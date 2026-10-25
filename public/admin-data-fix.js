/* SNGAMER STORE — ADMIN DATA REFRESH V14
   Single owner for authenticated admin data refresh, refund UI, analytics
   and product-performance mounting.
   Order presentation/filtering belongs to the existing V2.1 Orders workspace.
   Do not inject a second order search/filter toolbar here.
*/
(function () {
  'use strict';

  const STATE = '__sngamerAdminAutoRefreshV14';
  if (window[STATE]) return;
  window[STATE] = true;

  // The previous 10-second polling caused the dashboard to generate a large
  // burst of API requests. That could exhaust the security rate limiter and
  // make the Activity panel report "Trop de requêtes" even though the server
  // and database were healthy. Admin data is now refreshed once per minute.
  const INTERVAL_MS = 60000;
  const MIN_REFRESH_GAP_MS = 5000;
  let intervalId = null;
  let refreshInFlight = false;
  let lastRefreshAt = 0;
  let observer = null;
  let lastWorkspace = null;

  function adminBox() {
    return document.getElementById('adminBox');
  }

  function isAdminVisible() {
    const box = adminBox();
    return !!box && !box.classList.contains('hidden');
  }

  function currentWorkspace() {
    return adminBox()?.getAttribute('data-v26-workspace') || '';
  }

  async function runLoader(name) {
    const loader = window[name];
    if (typeof loader !== 'function') {
      throw new Error(`Loader ${name} is not available yet`);
    }
    await loader();
  }

  function loadRefundUiV2() {
    if (window.__sngAdminRefundUiV2 || document.querySelector('script[data-sng-refund-ui-v2]')) return;
    const script = document.createElement('script');
    script.src = '/admin-refund-ui-v2.js?v=20261018-1335';
    script.async = false;
    script.dataset.sngRefundUiV2 = '1';
    script.onload = () => console.debug('SNGAMER: refund UI V2 loaded');
    script.onerror = () => console.error('SNGAMER: unable to load refund UI');
    document.head.appendChild(script);
  }

  function loadAnalyticsAdmin() {
    if (window.__sngAnalyticsAdminLoaded || document.querySelector('script[data-sng-site-analytics-admin]')) return;
    const script = document.createElement('script');
    script.src = '/site-analytics-admin.js?v=20261019-analytics3';
    script.async = false;
    script.dataset.sngSiteAnalyticsAdmin = '1';
    script.onload = () => {
      window.__sngAnalyticsAdminLoaded = true;
      console.debug('SNGAMER: site analytics admin loaded');
    };
    script.onerror = () => console.error('SNGAMER: unable to load site analytics admin');
    document.head.appendChild(script);
  }

  function loadProductPerformanceAdmin() {
    if (window.__sngProductPerformanceAdminLoaded || document.querySelector('script[data-sng-product-performance-admin]')) return;
    const script = document.createElement('script');
    script.src = '/product-analytics-admin.js?v=20261020-products4';
    script.async = false;
    script.dataset.sngProductPerformanceAdmin = '1';
    script.onload = () => {
      window.__sngProductPerformanceAdminLoaded = true;
      console.debug('SNGAMER: product performance admin loaded');
    };
    script.onerror = () => console.error('SNGAMER: unable to load product performance admin');
    document.head.appendChild(script);
  }

  function removeLegacyOrderTools() {
    document.querySelectorAll('#sng-order-tools, #sng-order-tools-style').forEach(el => el.remove());
  }

  function normalizeText(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function getOrdersSection() {
    const table = document.getElementById('ordersTable');
    return table?.closest('section') || null;
  }

  function isLegacyOrderSearchInput(input) {
    if (!input || input.closest('#sng-order-tools')) return false;
    const placeholder = normalizeText(input.getAttribute('placeholder'));
    return placeholder.includes('commande, client, telephone') ||
      (placeholder.includes('client') && placeholder.includes('telephone')) ||
      placeholder.includes('client, telephone, id');
  }

  function hasOptionText(container, pattern) {
    return Array.from(container.querySelectorAll('select')).some(select =>
      Array.from(select.options || []).some(option => pattern.test(normalizeText(option.textContent)))
    );
  }

  function cleanupDuplicateOrderSections() {
    const root = adminBox();
    if (!root) return;
    const markers = Array.from(root.querySelectorAll('input')).filter(isLegacyOrderSearchInput);
    markers.forEach(marker => {
      if (marker.closest('#sng-order-tools')) return;
      let candidate = marker.closest('section');
      if (!candidate || candidate === getOrdersSection()) candidate = marker.parentElement;
      for (let i = 0; i < 8 && candidate && candidate !== root; i += 1) {
        const hasPayment = hasOptionText(candidate, /tous les paiements/);
        const hasStatus = hasOptionText(candidate, /tous les statuts/);
        const hasReset = Array.from(candidate.querySelectorAll('button')).some(button => /reinitialiser/.test(normalizeText(button.textContent)));
        const ownsCanonicalTable = candidate.contains(document.getElementById('ordersTable'));
        const ownsCanonicalWorkspace = candidate.contains(document.getElementById('sngFinalOrders'));
        if (hasPayment && hasStatus && hasReset) {
          if (ownsCanonicalTable || ownsCanonicalWorkspace) return;
          console.debug('SNGAMER: removed duplicate standalone order filter panel');
          candidate.remove();
          return;
        }
        candidate = candidate.parentElement;
      }
    });
  }

  function cleanupDuplicateOrderTools(section) {
    if (!section) return;
    const marker = Array.from(section.querySelectorAll('input,select')).find(el => {
      if (el.closest('#sng-order-tools')) return false;
      const placeholder = normalizeText(el.getAttribute('placeholder'));
      return placeholder.includes('client, telephone, id');
    });
    if (!marker) return;
    let container = marker.parentElement;
    for (let i = 0; i < 8 && container && container !== section; i += 1) {
      const controls = container.querySelectorAll('input,select,button');
      const hasStatus = Array.from(container.querySelectorAll('select')).some(select =>
        Array.from(select.options || []).some(option => /tous les statuts/i.test(String(option.textContent || '')))
      );
      const ownsCanonicalTable = container.contains(document.getElementById('ordersTable'));
      const ownsCanonicalWorkspace = container.contains(document.getElementById('sngFinalOrders'));
      if (!ownsCanonicalTable && !ownsCanonicalWorkspace && controls.length >= 2 && hasStatus) {
        console.debug('SNGAMER: removed reduced legacy order filter panel');
        container.remove();
        return;
      }
      container = container.parentElement;
    }
    if (!marker.closest('#sngFinalOrders')) marker.remove();
  }

  function cleanupAllLegacyOrderPanels() {
    const root = adminBox();
    if (!root) return;
    removeLegacyOrderTools();
    cleanupDuplicateOrderSections();
    Array.from(root.querySelectorAll('section')).forEach(section => cleanupDuplicateOrderTools(section));
  }

  async function refreshNow(reason, options = {}) {
    if (!isAdminVisible() || refreshInFlight) return;

    const now = Date.now();
    if (!options.force && now - lastRefreshAt < MIN_REFRESH_GAP_MS) return;
    lastRefreshAt = now;
    refreshInFlight = true;
    const workspace = currentWorkspace();
    try {
      cleanupAllLegacyOrderPanels();
      loadProductPerformanceAdmin();
      await runLoader('loadAll');
      cleanupAllLegacyOrderPanels();
      loadProductPerformanceAdmin();
      if (currentWorkspace() === 'orders' || workspace === 'orders') {
        if (typeof window.loadOrders === 'function') await runLoader('loadOrders');
        cleanupAllLegacyOrderPanels();
      }
      lastWorkspace = currentWorkspace();
      console.debug('SNGAMER ADMIN AUTO REFRESH OK:', reason, lastWorkspace);
    } catch (error) {
      console.error('SNGAMER ADMIN AUTO REFRESH ERROR:', reason, error);
    } finally {
      refreshInFlight = false;
    }
  }

  function stopOldCoreTimer() {
    if (window.__sngAdminOrdersAutoRefreshTimer) {
      window.clearInterval(window.__sngAdminOrdersAutoRefreshTimer);
      window.__sngAdminOrdersAutoRefreshTimer = null;
      console.debug('SNGAMER: replaced old core auto-refresh timer');
    }
  }

  function installObserver() {
    const box = adminBox();
    if (!box || observer) return;
    observer = new MutationObserver(() => {
      if (!isAdminVisible()) return;
      cleanupAllLegacyOrderPanels();
      loadProductPerformanceAdmin();
      const workspace = currentWorkspace();
      if (workspace !== lastWorkspace) refreshNow('workspace-change');
    });
    observer.observe(box, { attributes: true, attributeFilter: ['class', 'data-v26-workspace'] });
  }

  function sanitizePaymentSelectors(root = document) {
    const selects = root.querySelectorAll ? root.querySelectorAll('select') : [];
    selects.forEach(select => {
      const options = Array.from(select.options || []);
      const texts = options.map(o => normalizeText(o.textContent));
      const looksLikePayment = texts.includes('paye') || texts.includes('en attente');
      const hasRefundOptions = texts.some(t => t === 'rembourse' || t === 'remboursement demande');
      if (!looksLikePayment || !hasRefundOptions) return;
      const oldValue = normalizeText(select.value);
      options.forEach(option => {
        const text = normalizeText(option.textContent);
        if (text === 'rembourse' || text === 'remboursement demande') option.remove();
      });
      if (oldValue === 'rembourse' || oldValue === 'remboursement demande') {
        const paid = Array.from(select.options).find(o => normalizeText(o.textContent) === 'paye');
        if (paid) select.value = paid.value;
      }
    });
  }

  function bootPaymentSelectorGuard() {
    sanitizePaymentSelectors(document);
    if (!document.body) return;
    const guard = new MutationObserver(() => sanitizePaymentSelectors(document));
    guard.observe(document.body, { childList: true, subtree: true });
    window.setInterval(() => sanitizePaymentSelectors(document), 2000);
  }

  function scheduleInitialRefreshes() {
    // One delayed initial load is enough; the previous six-load burst was
    // unnecessary and could consume the API rate-limit window immediately.
    window.setTimeout(() => refreshNow('initial-500ms'), 500);
  }

  function installFinalResponsiveDashboard() {
    if (window.__sngFinalResponsiveDashboard) return;
    window.__sngFinalResponsiveDashboard = true;

    const style = document.createElement('style');
    style.id = 'sg-final-dashboard-layout-v1';
    style.textContent = `
      html,body{max-width:100%;overflow-x:hidden!important}
      #adminBox{box-sizing:border-box!important;min-width:0!important;max-width:100%!important}
      #adminBox.sg-v26-mode{box-sizing:border-box!important;min-width:0!important}

      @media (min-width:900px){
        main#adminBox{width:min(1480px,calc(100% - 36px))!important;margin:0 auto!important}
        #adminBox.sg-v26-mode{display:grid!important;grid-template-columns:minmax(200px,220px) minmax(0,1fr)!important;column-gap:22px!important;align-items:start!important}
        #adminBox.sg-v26-mode>#sg-admin-v26-nav{grid-column:1!important;grid-row:1 / span 100!important;position:sticky!important;top:94px!important;display:flex!important;flex-direction:column!important;width:auto!important;max-width:none!important;margin:0!important;overflow:visible!important}
        #adminBox.sg-v26-mode>section,#adminBox.sg-v26-mode>.stats{grid-column:2!important;min-width:0!important}
        #adminBox.sg-v26-mode>.stats{grid-template-columns:repeat(4,minmax(0,1fr))!important}
      }

      @media (max-width:899px){
        main#adminBox{width:calc(100% - 16px)!important;max-width:100%!important;margin:0 auto!important;padding-top:16px!important}
        #adminBox.sg-v26-mode{display:block!important;overflow:visible!important}
        #adminBox.sg-v26-mode>#sg-admin-v26-nav{position:relative!important;top:auto!important;z-index:5!important;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important;width:100%!important;max-width:100%!important;margin:0 0 14px!important;padding:8px!important;box-sizing:border-box!important;overflow:visible!important}
        #sg-admin-v26-nav::before{grid-column:1/-1!important;padding:6px 8px 8px!important}
        #sg-admin-v26-nav button{width:100%!important;min-width:0!important;min-height:43px!important;justify-content:flex-start!important;padding:9px 10px!important;white-space:nowrap!important;overflow:hidden!important}
        #adminBox.sg-v26-mode>.stats{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;min-width:0!important}
        #adminBox.sg-v26-mode>section{min-width:0!important;max-width:100%!important}
      }

      #sg-product-performance-panel .sg-prod-table{width:100%!important;min-width:0!important;max-width:100%!important;table-layout:fixed!important}
      #sg-product-performance-panel .sg-prod-table .sg-col-rank{width:7%!important}
      #sg-product-performance-panel .sg-prod-table .sg-col-product{width:43%!important}
      #sg-product-performance-panel .sg-prod-table .sg-col-sold{width:13%!important;text-align:center!important}
      #sg-product-performance-panel .sg-prod-table .sg-col-ca{width:20%!important;padding-left:10px!important;text-align:left!important}
      #sg-product-performance-panel .sg-prod-table .sg-col-stock{width:17%!important;text-align:center!important}
      #sg-product-performance-panel .sg-prod-table th{white-space:nowrap!important;font-size:9px!important;letter-spacing:.04em!important;overflow:hidden!important}
      #sg-product-performance-panel .sg-prod-table td{overflow:hidden!important}
      #sg-product-performance-panel .sg-prod-item-name{max-width:8ch!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}
      #sg-product-performance-panel .sg-prod-money{white-space:normal!important;line-height:1.12!important}

      @media (max-width:899px){
        #sg-product-performance-panel .sg-prod-table .sg-col-rank{width:8%!important}
        #sg-product-performance-panel .sg-prod-table .sg-col-product{width:42%!important}
        #sg-product-performance-panel .sg-prod-table .sg-col-sold{width:13%!important}
        #sg-product-performance-panel .sg-prod-table .sg-col-ca{width:20%!important;padding-left:7px!important;padding-right:5px!important}
        #sg-product-performance-panel .sg-prod-table .sg-col-stock{width:17%!important}
        #sg-product-performance-panel .sg-prod-table th,#sg-product-performance-panel .sg-prod-table td{padding-left:4px!important;padding-right:4px!important}
        #sg-product-performance-panel .sg-prod-item{gap:5px!important}
        #sg-product-performance-panel .sg-prod-thumb,#sg-product-performance-panel .sg-prod-thumb-fallback{width:32px!important;height:32px!important;flex-basis:32px!important}
        #sg-product-performance-panel .sg-prod-item-name{max-width:7ch!important;font-size:11px!important}
      }

      @media (max-width:380px){
        #sg-product-performance-panel .sg-prod-item-name{max-width:6ch!important}
      }

      #sg-catalog-summary{min-width:0;border:1px solid rgba(115,145,190,.14);border-radius:13px;background:rgba(7,13,23,.68);overflow:hidden}
      #sg-catalog-summary .sg-catalog-head{padding:12px 13px;border-bottom:1px solid rgba(115,145,190,.10);color:#aebbd0;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.06em}
      #sg-catalog-summary .sg-catalog-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;padding:10px}
      #sg-catalog-summary .sg-catalog-stat{padding:10px;border-radius:10px;background:rgba(14,25,43,.72);border:1px solid rgba(115,145,190,.10);min-width:0}
      #sg-catalog-summary .sg-catalog-label{display:block;color:#71829a;font-size:9px;font-weight:800;text-transform:uppercase}
      #sg-catalog-summary .sg-catalog-value{display:block;margin-top:4px;color:#fff;font-size:18px;font-weight:900}
      @media (max-width:520px){#sg-catalog-summary .sg-catalog-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;padding:7px}#sg-catalog-summary .sg-catalog-stat{padding:8px}#sg-catalog-summary .sg-catalog-label{font-size:8px}#sg-catalog-summary .sg-catalog-value{font-size:15px}}
    `;
    document.head.appendChild(style);

    let catalogPromise = null;
    async function getCatalogStats() {
      if (window.__sngCatalogStats) return window.__sngCatalogStats;
      if (catalogPromise) return catalogPromise;
      catalogPromise = fetch('/api/products', { credentials:'same-origin', cache:'no-store' })
        .then(r => { if (!r.ok) throw new Error('products'); return r.json(); })
        .then(data => {
          const products = Array.isArray(data) ? data : (data?.products || []);
          const list = Array.isArray(products) ? products : [];
          const inStock = list.filter(p => Number(p?.stock || 0) > 0).length;
          const out = list.filter(p => Number(p?.stock || 0) <= 0).length;
          return window.__sngCatalogStats = { total:list.length, inStock, out };
        })
        .catch(() => null);
      return catalogPromise;
    }

    async function enhanceProductPanel() {
      const panel = document.getElementById('sg-product-performance-panel');
      const layout = panel?.querySelector('.sg-prod-layout');
      if (!layout || document.getElementById('sg-catalog-summary')) return;
      const box = document.createElement('div');
      box.id = 'sg-catalog-summary';
      box.innerHTML = '<div class="sg-catalog-head">📦 Catalogue produits</div><div class="sg-catalog-grid"><div class="sg-catalog-stat"><span class="sg-catalog-label">Produits</span><span class="sg-catalog-value">—</span></div><div class="sg-catalog-stat"><span class="sg-catalog-label">En stock</span><span class="sg-catalog-value">—</span></div><div class="sg-catalog-stat"><span class="sg-catalog-label">Rupture</span><span class="sg-catalog-value">—</span></div></div>';
      layout.appendChild(box);
      const stats = await getCatalogStats();
      if (!stats || !box.isConnected) return;
      const values = box.querySelectorAll('.sg-catalog-value');
      values[0].textContent = String(stats.total);
      values[1].textContent = String(stats.inStock);
      values[2].textContent = String(stats.out);
    }

    const observeProductPanel = () => {
      enhanceProductPanel();
      const panel = document.getElementById('sg-product-performance-panel');
      if (panel && !panel.__sgCatalogObserver) {
        const mo = new MutationObserver(() => enhanceProductPanel());
        mo.observe(panel, { childList:true, subtree:true });
        panel.__sgCatalogObserver = mo;
      }
    };
    window.setInterval(observeProductPanel, 1200);
    observeProductPanel();
  }

  function boot() {
    const box = adminBox();
    if (!box) {
      window.setTimeout(boot, 250);
      return;
    }
    installFinalResponsiveDashboard();
    stopOldCoreTimer();
    cleanupAllLegacyOrderPanels();
    installObserver();
    bootPaymentSelectorGuard();
    loadRefundUiV2();
    loadAnalyticsAdmin();
    loadProductPerformanceAdmin();
    if (!isAdminVisible()) {
      window.setTimeout(boot, 250);
      return;
    }
    if (!intervalId) {
      scheduleInitialRefreshes();
      intervalId = window.setInterval(() => refreshNow('interval'), INTERVAL_MS);
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      cleanupAllLegacyOrderPanels();
      loadRefundUiV2();
      loadAnalyticsAdmin();
      loadProductPerformanceAdmin();
      refreshNow('visibility');
    }
  });
  window.addEventListener('pageshow', () => {
    cleanupAllLegacyOrderPanels();
    loadRefundUiV2();
    loadAnalyticsAdmin();
    loadProductPerformanceAdmin();
    refreshNow('pageshow');
  });
  window.addEventListener('focus', () => {
    cleanupAllLegacyOrderPanels();
    loadRefundUiV2();
    loadAnalyticsAdmin();
    loadProductPerformanceAdmin();
    refreshNow('focus');
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
