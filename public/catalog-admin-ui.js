(() => {
  'use strict';
  const VERSION = '20261021-catalog1';
  const IMAGE_IDS = ['pImage1','pImage2','pImage3'];

  function esc(value) {
    return String(value ?? '').replace(/[&<>\"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[ch]));
  }

  function money(value) {
    const n = Number(value);
    return Number.isFinite(n) ? new Intl.NumberFormat('fr-FR').format(n) + ' FCFA' : '—';
  }

  function ensureStyles() {
    if (document.getElementById('sng-catalog-admin-styles')) return;
    const style = document.createElement('style');
    style.id = 'sng-catalog-admin-styles';
    style.textContent = `
      .sng-catalog-head{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:14px;flex-wrap:wrap}
      .sng-catalog-head p{margin:4px 0 0;color:#91a0b2;font-size:13px}
      .sng-catalog-preview{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:12px}
      .sng-media-card{position:relative;background:#0b1118;border:1px solid #263544;border-radius:12px;overflow:hidden;min-height:110px}
      .sng-media-card img{display:block;width:100%;height:125px;object-fit:cover}
      .sng-media-card .sng-media-empty{height:125px;display:flex;align-items:center;justify-content:center;color:#657589;font-size:12px}
      .sng-media-label{position:absolute;left:7px;top:7px;background:rgba(5,10,16,.78);padding:4px 7px;border-radius:7px;font-size:11px;font-weight:700}
      .sng-product-live{display:grid;grid-template-columns:110px 1fr;gap:14px;align-items:center;margin-top:14px;padding:12px;border:1px solid #263544;border-radius:14px;background:linear-gradient(135deg,#0d141d,#111c27)}
      .sng-product-live img{width:110px;height:90px;object-fit:cover;border-radius:10px;background:#090e14}
      .sng-product-live h4{margin:0 0 5px;font-size:16px}.sng-product-live p{margin:3px 0;color:#9aa9b9;font-size:12px}
      .sng-product-price{font-weight:800;color:#fff;font-size:15px}.sng-product-promo{color:#53d89a;font-weight:800}
      .sng-stock-ok{color:#53d89a}.sng-stock-low{color:#ffcc66}.sng-stock-out{color:#ff7373}
      .sng-form-note{font-size:12px;color:#8392a4;margin:3px 0 8px}
      .sng-file-name{font-size:11px;color:#8fa0b2;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      @media(max-width:700px){.sng-catalog-preview{grid-template-columns:1fr}.sng-product-live{grid-template-columns:82px 1fr}.sng-product-live img{width:82px;height:72px}}
    `;
    document.head.appendChild(style);
  }

  function buildPreview() {
    const form = document.querySelector('.product-form');
    if (!form || document.getElementById('sngCatalogPreview')) return;
    const title = document.createElement('div');
    title.className = 'sng-catalog-head';
    title.innerHTML = '<div><strong>🛍️ Aperçu du produit</strong><p>Vérifie l\'affichage avant d\'ajouter le produit.</p></div>';
    const preview = document.createElement('div');
    preview.id = 'sngCatalogPreview';
    preview.className = 'sng-catalog-preview';
    IMAGE_IDS.forEach((id, i) => {
      const card = document.createElement('div');
      card.className = 'sng-media-card';
      card.dataset.slot = String(i + 1);
      card.innerHTML = `<span class="sng-media-label">Image ${i + 1}${i === 0 ? ' • principale' : ''}</span><div class="sng-media-empty">Aucune image</div>`;
      preview.appendChild(card);
    });
    const live = document.createElement('div');
    live.id = 'sngLiveProduct';
    live.className = 'sng-product-live';
    live.innerHTML = '<div><img alt="Aperçu produit"></div><div><h4>Nom du produit</h4><p>Catégorie • Stock</p><div class="sng-product-price">0 FCFA</div></div>';
    const anchor = form.querySelector('button[onclick="addProduct()"]');
    form.appendChild(title);
    form.appendChild(preview);
    form.appendChild(live);
    if (anchor) anchor.textContent = '➕ Ajouter le produit';
    refreshPreview();
  }

  function refreshPreview() {
    IMAGE_IDS.forEach((id, i) => {
      const input = document.getElementById(id);
      const card = document.querySelector(`#sngCatalogPreview [data-slot="${i + 1}"]`);
      if (!input || !card) return;
      const old = card.querySelector('img');
      if (old) old.remove();
      const empty = card.querySelector('.sng-media-empty');
      if (input.files && input.files[0]) {
        if (empty) empty.remove();
        const img = document.createElement('img');
        img.alt = `Aperçu image ${i + 1}`;
        img.src = URL.createObjectURL(input.files[0]);
        card.appendChild(img);
        let name = card.querySelector('.sng-file-name');
        if (!name) { name = document.createElement('div'); name.className = 'sng-file-name'; card.appendChild(name); }
        name.textContent = input.files[0].name;
      } else if (!empty) {
        const e = document.createElement('div'); e.className = 'sng-media-empty'; e.textContent = 'Aucune image'; card.appendChild(e);
        const name = card.querySelector('.sng-file-name'); if (name) name.remove();
      }
    });

    const live = document.getElementById('sngLiveProduct');
    if (!live) return;
    const name = document.getElementById('pName')?.value.trim() || 'Nom du produit';
    const category = document.getElementById('pCategory')?.value || 'Catégorie';
    const stock = Number(document.getElementById('pStock')?.value);
    const price = Number(document.getElementById('pPrice')?.value);
    const promo = Number(document.getElementById('pPromoPrice')?.value);
    const image = document.getElementById('pImage1')?.files?.[0];
    const img = live.querySelector('img');
    if (image) img.src = URL.createObjectURL(image); else img.removeAttribute('src');
    live.querySelector('h4').textContent = name;
    const stockText = Number.isFinite(stock) ? `Stock : ${stock}` : 'Stock non défini';
    live.querySelector('p').textContent = `${category} • ${stockText}`;
    const priceBox = live.querySelector('.sng-product-price');
    if (Number.isFinite(promo) && promo > 0 && promo < price) {
      priceBox.innerHTML = `<span class="sng-product-promo">${esc(money(promo))}</span> <s style="color:#7c8997;font-size:11px">${esc(money(price))}</s>`;
    } else {
      priceBox.textContent = Number.isFinite(price) && price > 0 ? money(price) : '0 FCFA';
    }
  }

  function installValidation() {
    const price = document.getElementById('pPrice');
    const promo = document.getElementById('pPromoPrice');
    const stock = document.getElementById('pStock');
    if (price) price.min = '0';
    if (promo) promo.min = '0';
    if (stock) { stock.min = '0'; stock.step = '1'; }
    IMAGE_IDS.forEach(id => document.getElementById(id)?.addEventListener('change', refreshPreview));
    ['pName','pCategory','pPrice','pStock','pPromoPrice','pPromoActive','pCampaign'].forEach(id => {
      const el = document.getElementById(id); if (el) el.addEventListener('input', refreshPreview);
      if (el) el.addEventListener('change', refreshPreview);
    });
  }

  function init() {
    ensureStyles();
    buildPreview();
    installValidation();
    refreshPreview();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.SNGAMER_CATALOG_ADMIN_VERSION = VERSION;
})();
