/* SNGAMER STORE — ADMIN UI STABILITY FIX
   Surgical fixes only:
   1) Keep exactly one workspace button active at a time.
   2) Keep the order-details dialog above the sticky admin header on mobile,
      so its title and close button are reachable when returning to the top.
   No order/product/customer data logic is changed.
*/
(function () {
  'use strict';

  const NAV = '#sg-admin-v26-nav';
  const ROOT = '#adminBox';
  const STYLE_ID = 'sg-admin-ui-stability-fix-style';
  const MODAL_CLASS = 'sg-order-details-viewport-fix';
  let syncing = false;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const norm = v => String(v || '').replace(/\s+/g, ' ').trim().toLowerCase();

  function injectStyles() {
    if ($('#' + STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      /* The sticky admin header must never cover the order-details dialog. */
      .${MODAL_CLASS}{
        z-index:2147483001 !important;
      }
      .${MODAL_CLASS} > *{
        box-sizing:border-box;
      }
      @media(max-width:700px){
        .${MODAL_CLASS}{
          padding-top:max(12px,env(safe-area-inset-top)) !important;
          padding-bottom:max(12px,env(safe-area-inset-bottom)) !important;
        }
        .${MODAL_CLASS} [class*="dialog"],
        .${MODAL_CLASS} [class*="modal"],
        .${MODAL_CLASS} [role="dialog"]{
          max-height:calc(100dvh - 24px) !important;
          overflow-y:auto !important;
          overscroll-behavior:contain;
          -webkit-overflow-scrolling:touch;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function nav() { return $(NAV); }
  function root() { return $(ROOT); }

  function buttonForWorkspace(workspace) {
    const n = nav();
    if (!n) return null;
    const wanted = norm(workspace);
    if (wanted === 'hero') return n.querySelector('#sg-admin-hero-view');
    if (wanted === 'customers') return n.querySelector('[data-sg-customers]');
    return n.querySelector(`[data-v26-view="${CSS.escape(wanted)}"]`);
  }

  function workspaceFromUI() {
    const r = root();
    const value = norm(r?.dataset?.v26Workspace);
    if (value) return value;
    try {
      return norm(sessionStorage.getItem('sg_admin_workspace_v26')) || 'overview';
    } catch (_) {
      return 'overview';
    }
  }

  function normalizeActive(workspace) {
    const n = nav();
    if (!n || syncing) return;
    const buttons = $$('button', n);
    if (!buttons.length) return;

    const wanted = buttonForWorkspace(workspace);
    if (!wanted) return;

    syncing = true;
    buttons.forEach(btn => btn.classList.toggle('active', btn === wanted));
    buttons.forEach(btn => {
      if (btn === wanted) btn.setAttribute('aria-current', 'page');
      else if (btn.hasAttribute('aria-current')) btn.setAttribute('aria-current', 'false');
    });
    syncing = false;
  }

  function bindExclusiveNav() {
    const n = nav();
    if (!n || n.dataset.sgExclusiveActiveBound === '1') return;
    n.dataset.sgExclusiveActiveBound = '1';

    n.addEventListener('click', event => {
      const btn = event.target.closest('button');
      if (!btn) return;
      setTimeout(() => normalizeActive(workspaceFromUI()), 0);
    });

    const observer = new MutationObserver(() => {
      if (syncing) return;
      normalizeActive(workspaceFromUI());
    });
    observer.observe(n, { subtree: true, attributes: true, attributeFilter: ['class', 'data-v26-view', 'data-sg-customers'] });
    n._sgExclusiveObserver = observer;
  }

  function findOrderDetailsOverlay() {
    const headings = $$('h1,h2,h3,h4', document).filter(h => /détails de la commande/i.test(norm(h.textContent)));
    for (const heading of headings) {
      let el = heading;
      for (let i = 0; i < 8 && el && el !== document.body; i++, el = el.parentElement) {
        const cls = typeof el.className === 'string' ? norm(el.className) : '';
        const role = norm(el.getAttribute?.('role'));
        const position = getComputedStyle(el).position;
        if (role === 'dialog' || /modal|dialog|overlay|backdrop/.test(cls) || position === 'fixed') return el;
      }
    }
    return null;
  }

  function fixOrderDetailsViewport() {
    const overlay = findOrderDetailsOverlay();
    if (!overlay) return;
    overlay.classList.add(MODAL_CLASS);

    // Keep the dialog's own scroll position independent from the page/header.
    const dialog = overlay.querySelector('[role="dialog"], [class*="dialog"], [class*="modal"]');
    if (dialog) {
      dialog.style.maxHeight = 'calc(100dvh - 24px)';
      dialog.style.overflowY = 'auto';
      dialog.style.webkitOverflowScrolling = 'touch';
    }
  }

  function boot() {
    injectStyles();
    bindExclusiveNav();
    normalizeActive(workspaceFromUI());
    fixOrderDetailsViewport();
  }

  const observer = new MutationObserver(() => {
    injectStyles();
    bindExclusiveNav();
    normalizeActive(workspaceFromUI());
    fixOrderDetailsViewport();
  });

  function start() {
    boot();
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'data-v26-workspace'] });
    [0, 200, 500, 1000, 2000].forEach(delay => setTimeout(boot, delay));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
