/* SNGAMER STORE — ADMIN DATA REFRESH V9
   Automatic refresh owner for the authenticated admin workspace.
   Also loads the dedicated refund UI and analytics admin UI.
   Keeps one canonical order search/filter toolbar in the existing Orders section.
*/
(function () {
  'use strict';

  const STATE = '__sngamerAdminAutoRefreshV9';
  if (window[STATE]) return;
  window[STATE] = true;

  const INTERVAL_MS = 10000;
  let intervalId = null;
  let refreshInFlight = false;
  let observer = null;
  let orderObserver = null;
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
    script.onerror = () => console.error('SNGAMER: unable to load refund UI V2');
    document.head.appendChild(script);
  }

  function loadAnalyticsAdmin() {
    if (window.__sngAnalyticsAdminLoaded || document.querySelector('script[data-sng-site-analytics-admin]')) return;
    const script = document.createElement('script');
    script.src = '/site-analytics-admin.js?v=20261019-analytics2';
    script.async = false;
    script.dataset.sngSiteAnalyticsAdmin = '1';
    script.onload = () => {
      window.__sngAnalyticsAdminLoaded = true;
      console.debug('SNGAMER: site analytics admin loaded');
    };
    script.onerror = () => console.error('SNGAMER: unable to load site analytics admin');
    document.head.appendChild(script);
  }

  function injectOrderToolsStyle() {
    if (document.getElementById('sng-order-tools-style')) return;
    const style = document.createElement('style');
    style.id = 'sng-order-tools-style';
    style.textContent = `
      .sng-order-tools{
        display:grid;
        grid-template-columns:minmax(180px,1.8fr) minmax(150px,1fr) minmax(150px,1fr) auto;
        gap:10px;
        margin:0 0 14px;
        padding:12px;
        border:1px solid rgba(115,145,190,.14);
        border-radius:14px;
        background:rgba(5,12,23,.45);
      }
      .sng-order-tools input,.sng-order-tools select,.sng-order-tools button{
        min-height:44px;
        margin:0!important;
        border-radius:10px!important;
      }
      .sng-order-tools input,.sng-order-tools select{
        width:100%;
        padding:10px 12px!important;
        border:1px solid rgba(112,140,180,.20)!important;
        background:#070e18!important;
        color:#f5f7ff!important;
      }
      .sng-order-tools button{
        padding:10px 14px;
        border:1px solid rgba(112,140,180,.18);
        background:#172437;
        color:#fff;
        cursor:pointer;
      }
      .sng-order-tools button:hover{background:#21334e}
      .sng-order-tools-meta{
        grid-column:1/-1;
        color:#8f9db3;
        font-size:12px;
        font-weight:700;
      }
      @media(max-width:700px){
        .sng-order-tools{grid-template-columns:1fr 1fr}
        .sng-order-tools input,.sng-order-tools-meta{grid-column:1/-1}
        .sng-order-tools button{grid-column:1/-1}
      }
    `;
    document.head.appendChild(style);
  }

  function getOrdersSection() {
    const table = document.getElementById('ordersTable');
    return table?.closest('section') || null;
  }

  function normalizeText(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function isLegacyOrderSearchInput(input) {
    if (!input || input.closest('#sng-order-tools')) return false;
    const placeholder = normalizeText(input.getAttribute('placeholder'));
    return placeholder.includes('commande, client, telephone') ||
      (placeholder.includes('client') && placeholder.includes('telephone'));
  }

  function hasOptionText(container, pattern) {
    return Array.from(container.querySelectorAll('select')).some(select =>
      Array.from(select.options || []).some(option => pattern.test(normalizeText(option.textContent)))
    );
  }

  /*
     The old duplicate filter is not always a direct child <section> of #adminBox.
     Previous cleanup therefore missed the exact panel visible on mobile.
     We now locate the legacy search input anywhere inside the admin workspace,
     find its nearest meaningful container, and remove only that container when
     it has both the status and payment filters. The canonical #sng-order-tools
     and the section containing #ordersTable are always protected.
  */
  function cleanupDuplicateOrderSections() {
    const root = adminBox();
    if (!root) return;

    const markers = Array.from(root.querySelectorAll('input')).filter(isLegacyOrderSearchInput);
    markers.forEach(marker => {
      if (marker.closest('#sng-order-tools')) return;

      const ordersSection = getOrdersSection();
      if (ordersSection && ordersSection.contains(marker)) return;

      let candidate = marker.closest('section');
      if (!candidate || candidate === ordersSection) candidate = marker.parentElement;

      for (let i = 0; i < 8 && candidate && candidate !== root; i += 1) {
        const hasPayment = hasOptionText(candidate, /tous les paiements/);
        const hasStatus = hasOptionText(candidate, /tous les statuts/);
        const hasReset = Array.from(candidate.querySelectorAll('button')).some(button => /reinitialiser/.test(normalizeText(button.textContent)));
        if (hasPayment && hasStatus && hasReset) {
          if (candidate.contains(document.getElementById('ordersTable'))) return;
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
    for (let i = 0; i < 4 && container && container !== section; i += 1) {
      const controls = container.querySelectorAll('input,select,button');
      const hasStatus = Array.from(container.querySelectorAll('select')).some(select =>
        Array.from(select.options || []).some(option => /tous les statuts/i.test(String(option.textContent || '')))
      );
      if (controls.length >= 2 && hasStatus) {
        container.remove();
        return;
      }
      container = container.parentElement;
    }

    marker.remove();
  }

  function applyOrderFilters() {
    const table = document.getElementById('ordersTable');
    const tools = document.getElementById('sng-order-tools');
    if (!table || !tools) return;

    const search = String(tools.querySelector('[data-filter="search"]')?.value || '').trim().toLowerCase();
    const status = String(tools.querySelector('[data-filter="status"]')?.value || 'all');
    const payment = String(tools.querySelector('[data-filter="payment"]')?.value || 'all');
    const rows = Array.from(table.querySelectorAll('tr'));
    let visible = 0;

    rows.forEach(row => {
      const text = String(row.textContent || '').toLowerCase();
      const statusSelect = row.querySelector('select.status');
      const rowStatus = String(statusSelect?.value || '').trim();
      const paymentText = text;
      const statusOk = status === 'all' || rowStatus === status;
      let paymentOk = true;
      if (payment === 'paid') paymentOk = /etat du paiement:\s*(paye|paid)/i.test(paymentText) || /\bpaye\b|\bpaid\b/i.test(paymentText);
      if (payment === 'pending') paymentOk = /en attente|pending/i.test(paymentText);
      if (payment === 'refunded') paymentOk = /rembourse|remboursement/i.test(paymentText);
      const searchOk = !search || text.includes(search);
      const show = statusOk && paymentOk && searchOk;
      row.style.display = show ? '' : 'none';
      if (show) visible += 1;
    });

    const meta = tools.querySelector('[data-order-meta]');
    if (meta) meta.textContent = `${visible} commande${visible > 1 ? 's' : ''} affichée${visible > 1 ? 's' : ''}`;
  }

  function ensureOrderTools() {
    const section = getOrdersSection();
    if (!section) return;
    injectOrderToolsStyle();
    cleanupDuplicateOrderSections();
    cleanupDuplicateOrderTools(section);

    if (document.getElementById('sng-order-tools')) {
      applyOrderFilters();
      return;
    }

    const refreshButton = section.querySelector('.refresh');
    const tableWrap = section.querySelector('.table-wrap');
    if (!tableWrap) return;

    const tools = document.createElement('div');
    tools.id = 'sng-order-tools';
    tools.className = 'sng-order-tools';
    tools.innerHTML = `
      <input data-filter="search" type="search" placeholder="🔎 Rechercher : commande, client, téléphone..." autocomplete="off">
      <select data-filter="status" aria-label="Filtrer par statut">
        <option value="all">Tous les statuts</option>
        <option value="Nouvelle">Nouvelles</option>
        <option value="Confirmée">Confirmées</option>
        <option value="Expédiée">Expédiées</option>
        <option value="Livrée">Livrées</option>
        <option value="Annulée">Annulées</option>
      </select>
      <select data-filter="payment" aria-label="Filtrer par paiement">
        <option value="all">Tous les paiements</option>
        <option value="paid">Payées</option>
        <option value="pending">En attente</option>
        <option value="refunded">Remboursées</option>
      </select>
      <button type="button" data-filter-reset>Réinitialiser</button>
      <div class="sng-order-tools-meta" data-order-meta>0 commande affichée</div>
    `;

    if (refreshButton) refreshButton.insertAdjacentElement('afterend', tools);
    else section.insertBefore(tools, tableWrap);

    tools.querySelectorAll('[data-filter]').forEach(el => {
      el.addEventListener('input', applyOrderFilters);
      el.addEventListener('change', applyOrderFilters);
    });
    tools.querySelector('[data-filter-reset]')?.addEventListener('click', () => {
      tools.querySelector('[data-filter="search"]').value = '';
      tools.querySelector('[data-filter="status"]').value = 'all';
      tools.querySelector('[data-filter="payment"]').value = 'all';
      applyOrderFilters();
    });
    applyOrderFilters();
  }

  function installOrderTools() {
    cleanupDuplicateOrderSections();
    ensureOrderTools();
    const table = document.getElementById('ordersTable');
    if (!table || orderObserver) return;
    orderObserver = new MutationObserver(() => {
      cleanupDuplicateOrderSections();
      ensureOrderTools();
      applyOrderFilters();
    });
    orderObserver.observe(table, { childList: true });
  }

  async function refreshNow(reason) {
    if (!isAdminVisible() || refreshInFlight) return;

    refreshInFlight = true;
    const workspace = currentWorkspace();

    try {
      await runLoader('loadAll');
      cleanupDuplicateOrderSections();
      installOrderTools();
      if (currentWorkspace() === 'orders' || workspace === 'orders') {
        await runLoader('loadOrders');
        cleanupDuplicateOrderSections();
        installOrderTools();
        applyOrderFilters();
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

  function scheduleInitialRefreshes() {
    [0, 400, 1000, 2000, 3500, 6000].forEach(delay => {
      window.setTimeout(() => refreshNow(`initial-${delay}ms`), delay);
    });
  }

  function installObserver() {
    const box = adminBox();
    if (!box || observer) return;

    observer = new MutationObserver(() => {
      if (!isAdminVisible()) return;
      const workspace = currentWorkspace();
      if (workspace !== lastWorkspace) refreshNow('workspace-change');
    });

    observer.observe(box, {
      attributes: true,
      attributeFilter: ['class', 'data-v26-workspace']
    });
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
        const paid = Array.from(select.options).find(o => ['paye'].includes(normalizeText(o.textContent)));
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

  function boot() {
    const box = adminBox();
    if (!box) {
      window.setTimeout(boot, 250);
      return;
    }

    stopOldCoreTimer();
    installObserver();
    bootPaymentSelectorGuard();
    loadRefundUiV2();
    loadAnalyticsAdmin();
    installOrderTools();

    if (!isAdminVisible()) {
      window.setTimeout(boot, 250);
      return;
    }

    if (!intervalId) {
      scheduleInitialRefreshes();
      intervalId = window.setInterval(() => refreshNow('interval'), INTERVAL_MS);
    }

    refreshNow('boot');
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      loadRefundUiV2();
      loadAnalyticsAdmin();
      refreshNow('visibility');
    }
  });

  window.addEventListener('pageshow', () => {
    loadRefundUiV2();
    loadAnalyticsAdmin();
    refreshNow('pageshow');
  });
  window.addEventListener('focus', () => {
    loadRefundUiV2();
    loadAnalyticsAdmin();
    refreshNow('focus');
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();