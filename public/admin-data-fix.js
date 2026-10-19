/* SNGAMER STORE — ADMIN DATA REFRESH V10
   Single owner for authenticated admin data refresh, refund UI and analytics.
   Order presentation/filtering belongs to the existing V2.1 Orders workspace.
   Do not inject a second order search/filter toolbar here.
*/
(function () {
  'use strict';

  const STATE = '__sngamerAdminAutoRefreshV10';
  if (window[STATE]) return;
  window[STATE] = true;

  const INTERVAL_MS = 10000;
  let intervalId = null;
  let refreshInFlight = false;
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

  /*
     The V2.1 Orders workspace is already the canonical order UI.
     Older versions of this refresh script injected #sng-order-tools and
     produced the duplicate panel visible above the Orders workspace.
     Remove that obsolete node if a cached/previous controller left it behind,
     but never create it again.
  */
  function removeLegacyOrderTools() {
    document.querySelectorAll('#sng-order-tools, #sng-order-tools-style').forEach(el => el.remove());
  }

  async function refreshNow(reason) {
    if (!isAdminVisible() || refreshInFlight) return;

    refreshInFlight = true;
    const workspace = currentWorkspace();

    try {
      removeLegacyOrderTools();
      await runLoader('loadAll');
      removeLegacyOrderTools();

      /* The existing V2.1 Orders workspace owns its own search, tabs,
         pagination and details. Refresh its source data without adding UI. */
      if (currentWorkspace() === 'orders' || workspace === 'orders') {
        if (typeof window.loadOrders === 'function') {
          await runLoader('loadOrders');
        }
        removeLegacyOrderTools();
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
      removeLegacyOrderTools();
      const workspace = currentWorkspace();
      if (workspace !== lastWorkspace) refreshNow('workspace-change');
    });

    observer.observe(box, {
      attributes: true,
      attributeFilter: ['class', 'data-v26-workspace']
    });
  }

  function normalizeText(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
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
    [0, 400, 1000, 2000, 3500, 6000].forEach(delay => {
      window.setTimeout(() => refreshNow(`initial-${delay}ms`), delay);
    });
  }

  function boot() {
    const box = adminBox();
    if (!box) {
      window.setTimeout(boot, 250);
      return;
    }

    stopOldCoreTimer();
    removeLegacyOrderTools();
    installObserver();
    bootPaymentSelectorGuard();
    loadRefundUiV2();
    loadAnalyticsAdmin();

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
      removeLegacyOrderTools();
      loadRefundUiV2();
      loadAnalyticsAdmin();
      refreshNow('visibility');
    }
  });

  window.addEventListener('pageshow', () => {
    removeLegacyOrderTools();
    loadRefundUiV2();
    loadAnalyticsAdmin();
    refreshNow('pageshow');
  });

  window.addEventListener('focus', () => {
    removeLegacyOrderTools();
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