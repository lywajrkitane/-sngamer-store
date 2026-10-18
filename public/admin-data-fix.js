/* SNGAMER STORE — ADMIN DATA REFRESH V4
   Automatic refresh owner for the authenticated admin workspace.
   The inline admin page used to create its own timer first; that caused this
   script to exit before it could take over. V4 explicitly replaces that timer
   and waits for the authenticated admin box to become visible.
*/
(function () {
  'use strict';

  const STATE = '__sngamerAdminAutoRefreshV4';
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

  async function refreshNow(reason) {
    if (!isAdminVisible() || refreshInFlight) return;

    refreshInFlight = true;
    const workspace = currentWorkspace();

    try {
      // This is the exact same data path used by the manual Actualiser button.
      // It refreshes products, orders, counters and revenue from the server.
      await runLoader('loadAll');

      // The Orders workspace must also redraw its list explicitly.
      if (currentWorkspace() === 'orders' || workspace === 'orders') {
        await runLoader('loadOrders');
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
      if (workspace !== lastWorkspace) {
        refreshNow('workspace-change');
      }
    });

    observer.observe(box, {
      attributes: true,
      attributeFilter: ['class', 'data-v26-workspace']
    });
  }

  // Refund is a separate state from payment. Some older admin markup exposed
  // both inside the same payment selector. Remove only those two refund
  // options; keep the real payment failure option "Échoué".
  function sanitizePaymentSelectors(root = document) {
    const selects = root.querySelectorAll ? root.querySelectorAll('select') : [];
    selects.forEach(select => {
      const options = Array.from(select.options || []);
      const texts = options.map(o => String(o.textContent || '').trim().toLowerCase());
      const looksLikePayment = texts.includes('payé') || texts.includes('paye') || texts.includes('en attente');
      const hasRefundOptions = texts.some(t => t === 'remboursé' || t === 'remboursement demandé');
      if (!looksLikePayment || !hasRefundOptions) return;

      const oldValue = String(select.value || '').trim().toLowerCase();
      options.forEach(option => {
        const text = String(option.textContent || '').trim().toLowerCase();
        if (text === 'remboursé' || text === 'remboursement demandé') option.remove();
      });

      if (oldValue === 'remboursé' || oldValue === 'remboursement demandé') {
        const paid = Array.from(select.options).find(o => ['payé', 'paye'].includes(String(o.textContent || '').trim().toLowerCase()));
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

    // The old inline timer is the reason V3 never took control. Replace it
    // instead of allowing two independent refresh systems to compete.
    stopOldCoreTimer();
    installObserver();
    bootPaymentSelectorGuard();

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
      refreshNow('visibility');
    }
  });

  window.addEventListener('pageshow', () => refreshNow('pageshow'));
  window.addEventListener('focus', () => refreshNow('focus'));

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();