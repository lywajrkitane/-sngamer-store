/* SNGAMER STORE — ADMIN DATA FIX
   Keeps the existing workspace UI untouched.
   - Loads orders automatically when the admin workspace becomes visible.
   - Refreshes dashboard data without requiring the manual Actualiser button.
   - Uses the server-side paid-only finance endpoint for chiffre d'affaires.
   - Does not create or modify any order/payment status controls.
*/
(function () {
  'use strict';

  const INTERVAL_MS = 30000;
  let started = false;
  let refreshTimer = null;
  let observer = null;
  let refreshInFlight = false;

  const $ = (selector, root = document) => root.querySelector(selector);

  function adminVisible() {
    const box = $('#adminBox');
    return !!box && !box.classList.contains('hidden');
  }

  function money(value) {
    const n = Number(value || 0);
    return `${n.toLocaleString('fr-FR')} FCFA`;
  }

  async function refreshFinance() {
    try {
      const response = await fetch('/api/admin/order-finance', {
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const revenue = $('#revenue');
      if (revenue && data && data.paid_revenue != null) {
        revenue.textContent = money(data.paid_revenue);
      }
      return data;
    } catch (error) {
      console.error('ADMIN_FINANCE_AUTOLOAD_ERROR:', error);
      return null;
    }
  }

  async function refreshData() {
    if (!adminVisible() || refreshInFlight) return;
    refreshInFlight = true;
    try {
      if (typeof window.loadAll === 'function') {
        await window.loadAll();
      } else if (typeof window.loadOrders === 'function') {
        await window.loadOrders();
      }
      await refreshFinance();
    } catch (error) {
      console.error('ADMIN_DATA_AUTOLOAD_ERROR:', error);
    } finally {
      refreshInFlight = false;
    }
  }

  function start() {
    if (started) return;
    if (!adminVisible()) return;
    started = true;

    [0, 350, 1000].forEach(delay => setTimeout(refreshData, delay));

    refreshTimer = window.setInterval(refreshData, INTERVAL_MS);

    const box = $('#adminBox');
    observer = new MutationObserver(() => {
      if (adminVisible()) refreshData();
    });
    observer.observe(box, { attributes: true, attributeFilter: ['class'] });
  }

  function waitForAdmin() {
    if (adminVisible()) {
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
