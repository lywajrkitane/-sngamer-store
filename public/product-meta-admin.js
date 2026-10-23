(() => {
  'use strict';

  const VERSION = '20261023-product-meta1';
  const CONDITION_OPTIONS = ['Neuf', 'Occasion', 'Reconditionné'];
  const WARRANTY_OPTIONS = [
    'Aucune garantie',
    '7 jours',
    '15 jours',
    '30 jours',
    '2 mois',
    '3 mois',
    '6 mois',
    '12 mois',
    '2 ans',
    '6 ans',
    'Personnalisée'
  ];

  function esc(value) {
    return String(value ?? '').replace(/[&<>\"']/g, ch => ({
      '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#039;'
    }[ch]));
  }

  // Remove accidental technical build/version markers from the visible admin UI.
  // These markers are implementation details and must never be presented to admins.
  function removeTechnicalMarkers(root = document.body) {
    if (!root) return;
    const marker = 'SNGAMER_PRODUCT_META_V3_DIGITAL';
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);
    nodes.forEach(textNode => {
      if (String(textNode.nodeValue || '').includes(marker)) {
        textNode.nodeValue = String(textNode.nodeValue).replace(marker, '').replace(/\/\*\s*\*\//g, '').trim();
        if (!textNode.nodeValue) textNode.parentNode?.removeChild(textNode);
      }
    });
  }

  function watchTechnicalMarkers() {
    removeTechnicalMarkers();
    if (window.__sngProductMetaMarkerObserver || !document.body) return;
    const observer = new MutationObserver(() => removeTechnicalMarkers());
    observer.observe(document.body, {childList: true, subtree: true});
    window.__sngProductMetaMarkerObserver = observer;
  }

  function injectStyles() {
    if (document.getElementById('sng-product-meta-admin-styles')) return;
    const style = document.createElement('style');
    style.id = 'sng-product-meta-admin-styles';
    style.textContent = `
      .sng-product-meta-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:4px 0 8px}
      .sng-product-meta-field{display:flex;flex-direction:column;gap:4px}
      .sng-product-meta-field label{font-size:12px;color:#9eabb8;font-weight:700}
      .sng-product-meta-field select,.sng-product-meta-field input{width:100%;margin:0}
      .sng-product-meta-help{margin:0 0 8px;color:#78899d;font-size:11px;line-height:1.35}
      @media(max-width:700px){.sng-product-meta-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function buildFields() {
    const form = document.querySelector('.product-form');
    const category = document.getElementById('pCategory');
    const platform = document.getElementById('pPlatform');
    if (!form || !category || !platform || document.getElementById('pProductCondition')) return;

    const grid = document.createElement('div');
    grid.className = 'sng-product-meta-grid';
    grid.id = 'sngProductMetaGrid';
    grid.innerHTML = `
      <div class="sng-product-meta-field">
        <label for="pProductCondition">📦 État du produit</label>
        <select id="pProductCondition">
          ${CONDITION_OPTIONS.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('')}
        </select>
      </div>
      <div class="sng-product-meta-field">
        <label for="pWarranty">🛡️ Garantie</label>
        <select id="pWarranty" onchange="window.sngProductMetaToggleWarranty && window.sngProductMetaToggleWarranty()">
          <option value="">À définir (non renseignée)</option>
          ${WARRANTY_OPTIONS.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('')}
        </select>
      </div>
    `;

    const custom = document.createElement('input');
    custom.id = 'pWarrantyCustom';
    custom.type = 'text';
    custom.placeholder = 'Ex. 18 mois / 3 ans';
    custom.style.display = 'none';
    custom.style.margin = '0 0 8px';

    const help = document.createElement('div');
    help.className = 'sng-product-meta-help';
    help.textContent = 'Ces informations seront affichées automatiquement sur la fiche produit et pourront être modifiées depuis le dashboard.';

    platform.insertAdjacentElement('afterend', grid);
    grid.insertAdjacentElement('afterend', custom);
    custom.insertAdjacentElement('afterend', help);
  }

  function toggleWarrantyCustom() {
    const select = document.getElementById('pWarranty');
    const custom = document.getElementById('pWarrantyCustom');
    if (!select || !custom) return;
    custom.style.display = select.value === 'Personnalisée' ? 'block' : 'none';
    if (select.value !== 'Personnalisée') custom.value = '';
  }

  window.sngProductMetaToggleWarranty = toggleWarrantyCustom;

  function getMeta() {
    const condition = document.getElementById('pProductCondition')?.value || 'Neuf';
    const warrantyChoice = document.getElementById('pWarranty')?.value || '';
    const custom = document.getElementById('pWarrantyCustom')?.value.trim() || '';
    const configured = Boolean(warrantyChoice) && warrantyChoice !== 'Aucune garantie';
    const warranty = warrantyChoice === 'Personnalisée'
      ? custom
      : warrantyChoice;

    return {
      product_condition: CONDITION_OPTIONS.includes(condition) ? condition : 'Neuf',
      warranty: configured && warranty ? warranty : 'Aucune garantie',
      warranty_configured: configured && Boolean(warranty)
    };
  }

  function installFetchBridge() {
    if (window.__sngProductMetaFetchBridge) return;
    const originalFetch = window.fetch.bind(window);
    window.fetch = async function(input, init) {
      const url = typeof input === 'string' ? input : input?.url || '';
      const method = String(init?.method || (typeof input !== 'string' ? input?.method : 'GET') || 'GET').toUpperCase();
      if (method === 'POST' && /\/api\/admin\/products(?:\?|$)/.test(url) && !/\/media(?:\?|$)/.test(url)) {
        try {
          const meta = getMeta();
          const currentInit = init ? {...init} : {};
          const currentBody = currentInit.body;
          if (typeof currentBody === 'string') {
            const payload = JSON.parse(currentBody);
            Object.assign(payload, meta);
            currentInit.body = JSON.stringify(payload);
          }
          return originalFetch(input, currentInit);
        } catch (error) {
          console.error('[SNGAMER PRODUCT META] request bridge error:', error);
        }
      }
      return originalFetch(input, init);
    };
    window.__sngProductMetaFetchBridge = true;
  }

  function resetAfterCreate() {
    const condition = document.getElementById('pProductCondition');
    const warranty = document.getElementById('pWarranty');
    const custom = document.getElementById('pWarrantyCustom');
    if (condition) condition.value = 'Neuf';
    if (warranty) warranty.value = '';
    if (custom) custom.value = '';
    toggleWarrantyCustom();
  }

  function init() {
    watchTechnicalMarkers();
    injectStyles();
    buildFields();
    installFetchBridge();
  }

  window.sngProductMetaReset = resetAfterCreate;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, {once:true});
  } else {
    init();
  }

  setTimeout(init, 300);
  setTimeout(init, 1000);
})();
