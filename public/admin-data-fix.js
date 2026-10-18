/* SNGAMER STORE — ADMIN DATA REFRESH
   Uses the same refresh action that already works when the administrator
   presses "Actualiser" manually. This keeps one source of truth for orders,
   payment status, counters and revenue.
*/
(function () {
  'use strict';

  const INTERVAL_MS = 15000;
  let started = false;
  let timer = null;
  let clickInProgress = false;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function adminVisible() {
    const root = $('#adminBox');
    return Boolean(root && !root.classList.contains('hidden'));
  }

  function findOrdersSection() {
    const root = $('#adminBox');
    if (!root) return null;

    return $$(':scope > section', root).find(section => {
      const heading = (section.querySelector('h1,h2,h3,h4')?.textContent || '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
      return heading.includes('commande');
    }) || null;
  }

  function findRealOrdersRefreshButton() {
    const section = findOrdersSection();
    if (!section) return null;

    // This is the exact button already used by the administrator manually.
    return $$('.refresh', section).find(button => {
      const text = (button.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
      return text.includes('actualiser');
    }) || null;
  }

  async function refreshOrders() {
    if (!adminVisible() || document.visibilityState === 'hidden' || clickInProgress) return;

    const button = findRealOrdersRefreshButton();
    if (!button) return;

    clickInProgress = true;
    try {
      // Do not duplicate the order-loading logic here. The existing button
      // already calls the established loader that updates orders, counters
      // and revenue correctly.
      button.click();
    } catch (error) {
      console.error('ADMIN_AUTO_REFRESH_FAILED:', error);
    } finally {
      // Let the existing async loader finish before another automatic click.
      window.setTimeout(() => {
        clickInProgress = false;
      }, 3000);
    }
  }

  function start() {
    if (started || !adminVisible()) return;
    started = true;

    // Refresh immediately after login/page entry, then retry while the
    // workspace finishes building the Orders section.
    [0, 500, 1500, 3500, 6500].forEach(delay => {
      window.setTimeout(refreshOrders, delay);
    });

    timer = window.setInterval(refreshOrders, INTERVAL_MS);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') refreshOrders();
    });
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
