/* SNGAMER STORE — ADMIN DATA REFRESH
   Polls the existing admin endpoints after login and while the dashboard is visible.
   Deliberately does not call loadAll() to avoid overlapping requests from legacy code;
   the established loaders remain the single source for orders, counts and revenue.
*/
(function () {
  'use strict';

  const INTERVAL_MS = 15000;
  let started = false;
  let timer = null;
  let inFlight = false;
  let observer = null;

  const $ = (selector, root = document) => root.querySelector(selector);
  const visible = () => {
    const root = $('#adminBox');
    return Boolean(root && !root.classList.contains('hidden'));
  };

  async function refreshDashboard() {
    if (!visible() || inFlight || document.visibilityState === 'hidden') return;
    inFlight = true;
    try {
      // The original loaders own the order list, all status counters and revenue.
      // Run them independently so one failure does not block the other.
      const tasks = [];
      if (typeof window.loadProducts === 'function') tasks.push(
        Promise.resolve().then(() => window.loadProducts())
      );
      if (typeof window.loadOrders === 'function') tasks.push(
        Promise.resolve().then(() => window.loadOrders())
      );
      const results = await Promise.allSettled(tasks);
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error('ADMIN_AUTO_REFRESH_FAILED:', index === 0 ? 'products' : 'orders', result.reason);
        }
      });
    } finally {
      inFlight = false;
    }
  }

  function start() {
    if (started || !visible()) return;
    started = true;
    // Do several short retries because the login callback can expose the UI
    // before the browser has fully persisted the session cookie.
    [0, 500, 1500, 3500].forEach(delay => window.setTimeout(refreshDashboard, delay));
    timer = window.setInterval(refreshDashboard, INTERVAL_MS);
    document.addEventListener('visibilitychange', refreshDashboard);

    const root = $('#adminBox');
    if (root) {
      observer = new MutationObserver(() => {
        if (visible()) refreshDashboard();
      });
      observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    }
  }

  function waitForAdmin() {
    if (visible()) {
      start();
      return;
    }
    window.setTimeout(waitForAdmin, 250);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForAdmin, { once: true });
  } else {
    waitForAdmin();
  }
})();
