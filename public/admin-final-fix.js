/* SNGAMER STORE — FINAL ADMIN FIX
   1) Guarantees an initial orders/stats load after the admin dashboard becomes visible.
   2) Keeps the manual "Actualiser" button available.
   3) Restores dashboard statistics that the workspace controller previously hid.
*/
(function () {
  'use strict';

  const STYLE_ID = 'sg-admin-final-fix-style';
  const STATE_KEY = '__sgAdminFinalFixInstalled';

  if (window[STATE_KEY]) return;
  window[STATE_KEY] = true;

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      /* The workspace controller treats .stats as a non-section child.
         Keep it visible on the overview instead of hiding the dashboard KPIs. */
      #adminBox.sg-v26-mode > .stats {
        display: grid !important;
        grid-column: 2 !important;
        min-width: 0 !important;
      }
      #adminBox.sg-v26-mode[data-v26-workspace="overview"] > .stats {
        display: grid !important;
      }
      #adminBox.sg-v26-mode[data-v26-workspace]:not([data-v26-workspace="overview"]) > .stats {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  function isAdminVisible() {
    const box = document.getElementById('adminBox');
    return !!box && !box.classList.contains('hidden');
  }

  function ordersLoaded() {
    const table = document.getElementById('ordersTable');
    if (!table) return false;
    return table.children.length > 0;
  }

  function callLoadAll() {
    if (!isAdminVisible()) return false;
    if (typeof window.loadAll !== 'function') return false;
    try {
      const result = window.loadAll();
      if (result && typeof result.catch === 'function') {
        result.catch(err => console.error('ADMIN_FINAL_AUTOLOAD_ERROR:', err));
      }
      return true;
    } catch (err) {
      console.error('ADMIN_FINAL_AUTOLOAD_CALL_ERROR:', err);
      return false;
    }
  }

  function startInitialLoad() {
    if (!isAdminVisible()) return;

    /* Do not depend on one particular authentication timing. */
    [0, 150, 500, 1000, 1800, 3000, 5000].forEach(delay => {
      setTimeout(() => {
        if (!isAdminVisible()) return;
        if (!ordersLoaded() || delay === 0) callLoadAll();
      }, delay);
    });
  }

  function watchAdminBox() {
    const box = document.getElementById('adminBox');
    if (!box) return;

    let wasVisible = isAdminVisible();
    if (wasVisible) startInitialLoad();

    const observer = new MutationObserver(() => {
      const visible = isAdminVisible();
      if (visible && !wasVisible) {
        wasVisible = true;
        startInitialLoad();
      } else if (!visible) {
        wasVisible = false;
      }
    });

    observer.observe(box, { attributes: true, attributeFilter: ['class', 'data-v26-workspace'] });

    window.addEventListener('pageshow', startInitialLoad);
    window.addEventListener('focus', () => {
      if (isAdminVisible() && !ordersLoaded()) startInitialLoad();
    });
  }

  function boot() {
    installStyle();
    watchAdminBox();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
