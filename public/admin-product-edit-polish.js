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

    const grid = form.querySelector('.edit-product-grid');
    if (grid && !$('#sngEditPricingSummary', form)) {
      const summary = document.createElement('div');
      summary.id = 'sngEditPricingSummary';
      summary.className = 'sng-edit-pricing-summary';
      summary.setAttribute('aria-live', 'polite');
      summary.innerHTML = [
        '<div class="sng-edit-price-card"><span class="sng-edit-price-label">Prix normal</span><strong class="sng-edit-price-value" id="sngEditNormalDisplay">—</strong></div>',
        '<div class="sng-edit-price-card"><span class="sng-edit-price-label">Prix promotionnel</span><strong class="sng-edit-price-value" id="sngEditPromoDisplay">—</strong></div>',
        '<div class="sng-edit-price-card"><span class="sng-edit-price-label">Économie / unité</span><strong class="sng-edit-price-value" id="sngEditSavingDisplay">—</strong></div>',
        '<p class="sng-edit-pricing-status" id="sngEditPricingStatus">Renseigne les prix pour voir l’aperçu.</p>'
      ].join('');
      grid.insertAdjacentElement('afterend', summary);
    }

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

    const errIds = new Set(Object.keys(fields));
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
    function status(message, kind=''){
      const el = byId('sngEditPricingStatus');
      if (!el) return;
      el.textContent = message;
      el.className = 'sng-edit-pricing-status' + (kind ? ' ' + kind : '');
    }

    function updatePricing(){
      if (!fields.price || !fields.promo || !fields.active) return;
      const normalRaw = fields.price.value.trim();
      const promoRaw = fields.promo.value.trim();
      const normal = normalRaw === '' ? NaN : Number(normalRaw);
      const promo = promoRaw === '' ? null : Number(promoRaw);
      const active = fields.active.checked;
      const normalDisplay = byId('sngEditNormalDisplay');
      const promoDisplay = byId('sngEditPromoDisplay');
      const savingDisplay = byId('sngEditSavingDisplay');
      if (normalDisplay) normalDisplay.textContent = money(normal);
      if (promoDisplay) promoDisplay.textContent = promo === null ? 'Non défini' : money(promo);
      if (savingDisplay) savingDisplay.textContent = '—';

      if (!Number.isFinite(normal) || normal <= 0) {
        status('Saisis un prix normal supérieur à 0 FCFA pour calculer la réduction.', 'warn');
        return;
      }
      if (promo === null) {
        if (active) status('La promotion est cochée : ajoute un prix promotionnel inférieur au prix normal.', 'bad');
        else status('Aucune promotion renseignée. Le prix normal sera appliqué.', '');
        return;
      }
      if (!Number.isFinite(promo) || promo <= 0 || promo >= normal) {
        status('Prix promotionnel invalide : il doit être positif et strictement inférieur au prix normal.', 'bad');
        return;
      }
      const discount = Math.round((normal - promo) / normal * 100);
      if (savingDisplay) savingDisplay.textContent = money(normal - promo);
      const discountInput = byId('editProductDiscount');
      if (discountInput) discountInput.value = discount + '%';
      if (active) {
        status('Promotion active : -' + discount + '% (' + money(normal-promo) + ' économisés par unité).', 'good');
      } else {
        status('Prix promotionnel valide mais inactif. Coche « Activer la promotion » pour l’afficher en boutique.', 'warn');
      }
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
      if (category === 'Coins' && !platform) { setError(fields.platform, 'Choisis Android ou iPhone.'); errors.push(fields.platform); }
      if (!Number.isFinite(price) || price <= 0) { setError(fields.price, 'Le prix normal doit être supérieur à 0 FCFA.'); errors.push(fields.price); }
      if (!Number.isInteger(stock) || stock < 0) { setError(fields.stock, 'Le stock doit être un nombre entier positif ou égal à 0.'); errors.push(fields.stock); }
      if (active && promo === null) { setError(fields.promo, 'Indique un prix promotionnel avant d’activer la promotion.'); errors.push(fields.promo); }
      else if (promo !== null && (!Number.isFinite(promo) || promo <= 0 || !Number.isFinite(price) || promo >= price)) {
        setError(fields.promo, 'Le prix promotionnel doit être positif et inférieur au prix normal.'); errors.push(fields.promo);
      }
      updatePricing();
      return errors;
    }

    // Inline feedback while typing; keep the established save logic untouched.
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

    // Validate in capture phase before the legacy save handler can submit.
    form.addEventListener('submit', event => {
      const errors = validate();
      if (errors.length) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const first = errors[0];
        first?.focus({preventScroll:false});
        return;
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
      const validType = isVideo ? file.type.startsWith('video/') : file.type.startsWith('image/');
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

    // Values are populated by the existing editProduct(id) function right before
    // the modal is shown, so refresh the preview on open without touching data.
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