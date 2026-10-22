(function(){
  'use strict';
  if (window.__sngProductEditPolishV1) return;
  window.__sngProductEditPolishV1 = true;

  const $ = (s, root=document) => root.querySelector(s);
  const money = value => Number.isFinite(value)
    ? new Intl.NumberFormat('fr-FR').format(value) + ' FCFA'
    : '—';

  function init(){
    const form = $('#editProductForm');
    const modal = $('#editProductModal');
    if (!form || !modal || form.dataset.sngPolishReady === '1') return;
    form.dataset.sngPolishReady = '1';

    // The edit form already contains the professional price/reduction block.
    // Do not create a second pricing summary on top of it.
    const duplicateSummary = $('#sngEditPricingSummary', form);
    if (duplicateSummary) duplicateSummary.remove();

    const byId = id => document.getElementById(id);
    const fields = {
      name: byId('editProductName'),
      category: byId('editProductCategory'),
      platform: byId('editProductPlatform'),
      price: byId('editProductPrice'),
      stock: byId('editProductStock'),
      promo: byId('editProductPromoPrice'),
      active: byId('editProductPromoActive'),
      description: byId('editProductDescription')
    };

    function clearError(input){
      if (!input) return;
      input.removeAttribute('aria-invalid');
      const field = input.closest('.edit-product-field');
      const old = field && field.querySelector('.sng-edit-field-error');
      if (old) old.remove();
    }

    function setError(input, message){
      if (!input) return;
      clearError(input);
      input.setAttribute('aria-invalid','true');
      const field = input.closest('.edit-product-field');
      if (!field) return;
      const note = document.createElement('small');
      note.className = 'sng-edit-field-error';
      note.textContent = message;
      field.appendChild(note);
    }

    function updatePricing(){
      if (!fields.price || !fields.promo || !fields.active) return;
      const normalRaw = fields.price.value.trim();
      const promoRaw = fields.promo.value.trim();
      const normal = normalRaw === '' ? NaN : Number(normalRaw);
      const promo = promoRaw === '' ? null : Number(promoRaw);
      const discountInput = byId('editProductDiscount');

      if (discountInput) discountInput.value = '';
      if (!Number.isFinite(normal) || normal <= 0) return;
      if (promo === null || !Number.isFinite(promo) || promo <= 0 || promo >= normal) return;

      const discount = Math.round((normal - promo) / normal * 100);
      if (discountInput) discountInput.value = discount + '%';
    }

    function validate(){
      Object.values(fields).forEach(clearError);
      const name = fields.name?.value.trim() || '';
      const category = fields.category?.value.trim() || '';
      const platform = fields.platform?.value.trim() || '';
      const priceRaw = fields.price?.value.trim() || '';
      const stockRaw = fields.stock?.value.trim() || '';
      const promoRaw = fields.promo?.value.trim() || '';
      const price = priceRaw === '' ? NaN : Number(priceRaw);
      const stock = stockRaw === '' ? NaN : Number(stockRaw);
      const promo = promoRaw === '' ? null : Number(promoRaw);
      const active = !!fields.active?.checked;
      const errors = [];

      if (!name) { setError(fields.name, 'Le nom du produit est obligatoire.'); errors.push(fields.name); }
      if (!category) { setError(fields.category, 'Choisis une catégorie.'); errors.push(fields.category); }
      if (category === 'Coins' && !platform) { setError(fields.platform, 'Choisis Android ou iPhone pour les Pièces eFootball.'); errors.push(fields.platform); }
      if (category === 'Univers Gaming' && !platform) { setError(fields.platform, 'Choisis PC Gaming, Gaming Phone ou Console.'); errors.push(fields.platform); }
      if (!Number.isFinite(price) || price <= 0) { setError(fields.price, 'Le prix normal doit être supérieur à 0 FCFA.'); errors.push(fields.price); }
      if (!Number.isInteger(stock) || stock < 0) { setError(fields.stock, 'Le stock doit être un nombre entier positif ou égal à 0.'); errors.push(fields.stock); }
      if (active && promo === null) { setError(fields.promo, 'Indique un prix promotionnel avant d’activer la promotion.'); errors.push(fields.promo); }
      else if (promo !== null && (!Number.isFinite(promo) || promo <= 0 || !Number.isFinite(price) || promo >= price)) {
        setError(fields.promo, 'Le prix promotionnel doit être positif et inférieur au prix normal.'); errors.push(fields.promo);
      }
      updatePricing();
      return errors;
    }

    [fields.name, fields.category, fields.platform, fields.price, fields.stock, fields.promo, fields.active].forEach(input => {
      if (!input) return;
      input.addEventListener('input', () => {
        clearError(input);
        updatePricing();
      });
      input.addEventListener('change', () => {
        clearError(input);
        updatePricing();
      });
    });

    form.addEventListener('submit', event => {
      const errors = validate();
      if (errors.length) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const first = errors[0];
        first?.focus({preventScroll:false});
      }
    }, true);

    function addSelectedFileNotice(input){
      if (!input) return;
      const field = input.closest('.edit-product-field');
      const preview = field && field.querySelector('.edit-product-media-preview');
      if (!preview) return;
      const old = preview.querySelector('.sng-edit-file-selection');
      if (old) old.remove();
      const file = input.files && input.files[0];
      if (!file) return;
      const isVideo = input.accept.includes('video');
      const videoExtension = /\.(mp4|webm|mov|m4v|ogv|mkv|avi)$/i.test(file.name);
      const imageExtension = /\.(jpe?g|png|gif|webp|avif|bmp|heic|heif)$/i.test(file.name);
      const validType = isVideo
        ? (file.type ? file.type.startsWith('video/') : videoExtension)
        : (file.type ? file.type.startsWith('image/') : imageExtension);
      if (!validType) {
        input.value = '';
        const note = document.createElement('small');
        note.className = 'sng-edit-field-error';
        note.textContent = isVideo ? 'Choisis un fichier vidéo valide.' : 'Choisis un fichier image valide.';
        preview.appendChild(note);
        return;
      }
      const size = file.size < 1024*1024
        ? Math.max(1, Math.round(file.size/1024)) + ' Ko'
        : (file.size/(1024*1024)).toFixed(1).replace('.', ',') + ' Mo';
      const note = document.createElement('div');
      note.className = 'sng-edit-file-selection';
      note.textContent = '✓ Nouveau fichier sélectionné : ' + file.name + ' (' + size + '). Il remplacera le média actuel après enregistrement.';
      preview.appendChild(note);
    }

    ['editProductImage1','editProductImage2','editProductImage3','editProductVideo'].forEach(id => {
      const input = byId(id);
      if (input) input.addEventListener('change', () => addSelectedFileNotice(input));
    });

    const observer = new MutationObserver(records => {
      if (records.some(record => record.attributeName === 'class') && modal.classList.contains('show')) {
        Object.values(fields).forEach(clearError);
        setTimeout(updatePricing, 0);
      }
    });
    observer.observe(modal, {attributes:true, attributeFilter:['class']});
    updatePricing();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
