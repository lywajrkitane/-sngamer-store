/* SNGAMER STORE — ADMIN DATA REFRESH V3
   Single source of truth: use the existing data loaders directly.
   - loadAll() refreshes dashboard/products/orders counters and revenue.
   - loadOrders() refreshes the Orders view itself.
   - refresh happens after login, when the Orders workspace is opened,
     when the page becomes visible again, and periodically.
   No DOM/button simulation is used.
*/
(function () {
  'use strict';

  const STATE = '__sngamerAdminAutoRefreshV3';
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

  function callLoader(name) {
    const loader = window[name];
    if (typeof loader !== 'function') return false;

    try {
      const result = loader();
      if (result && typeof result.catch === 'function') {
        result.catch(error => console.error(`ADMIN_AUTO_${name}_ERROR:`, error));
      }
      return true;
    } catch (error) {
      console.error(`ADMIN_AUTO_${name}_CALL_ERROR:`, error);
      return false;
    }
  }

  function currentWorkspace() {
    const box = adminBox();
    return box?.getAttribute('data-v26-workspace') || '';
  }

  async function refreshNow(reason) {
    if (!isAdminVisible() || refreshInFlight) return;

    const workspace = currentWorkspace();
    refreshInFlight = true;

    try {
      // Always refresh the complete admin data set so the dashboard remains
      // synchronized with the same source used by the manual Actualiser.
      callLoader('loadAll');

      // When the Orders workspace is active, explicitly reload its list.
      if (workspace === 'orders') {
        callLoader('loadOrders');
      }

      lastWorkspace = workspace;
      console.debug('SNGAMER ADMIN AUTO REFRESH:', reason, workspace);
    } finally {
      // The loaders are async; prevent overlapping requests while they settle.
      window.setTimeout(() => {
        refreshInFlight = false;
      }, 2500);
    }
  }

  function scheduleInitialRefreshes() {
    [0, 300, 1000, 2500, 5000].forEach(delay => {
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
        lastWorkspace = workspace;
        refreshNow('workspace-change');
      }
    });

    observer.observe(box, {
      attributes: true,
      attributeFilter: ['class', 'data-v26-workspace']
    });
  }

  function boot() {
    const box = adminBox();
    if (!box) {
      window.setTimeout(boot, 250);
      return;
    }

    installObserver();

    if (isAdminVisible()) {
      scheduleInitialRefreshes();
      if (!intervalId) {
        intervalId = window.setInterval(() => refreshNow('interval'), INTERVAL_MS);
      }
    } else {
      window.setTimeout(boot, 250);
    }
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
