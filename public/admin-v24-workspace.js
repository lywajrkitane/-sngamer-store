/* SNGAMER STORE ADMIN — V2.4 isolated workspaces
   Real navigation: each module is a true workspace, not an anchor scroll.
   Overview shows the complete dashboard; every other tab shows only its module.
*/
(function () {
  'use strict';

  const STYLE_ID = 'sg-v24-workspace-style';
  const NAV_ID = 'sg-v24-workspace-nav';
  const WORKSPACE_ID = 'sg-v24-workspace-content';

  const VIEWS = [
    { id: 'overview', label: "Vue d'ensemble" },
    { id: 'products', label: 'Produits' },
    { id: 'orders', label: 'Commandes' },
    { id: 'promotions', label: 'Promotions' },
    { id: 'campaigns', label: 'Campagnes' }
  ];

  let active = 'overview';
  let booted = false;

  function addStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${NAV_ID}{position:sticky;top:0;z-index:80;margin:0 0 18px;padding:10px;background:rgba(11,15,20,.96);backdrop-filter:blur(14px);border:1px solid #26313d;border-radius:16px;display:flex;gap:8px;overflow-x:auto;scrollbar-width:none}
      #${NAV_ID}::-webkit-scrollbar{display:none}
      #${NAV_ID} button{flex:0 0 auto;border:1px solid #26313d;background:#111820;color:#cbd5e1;border-radius:999px;padding:11px 18px;font-weight:800;white-space:nowrap}
      #${NAV_ID} button.active{background:linear-gradient(135deg,#1687ff,#7b35ff);color:#fff;border-color:transparent;box-shadow:0 8px 22px rgba(62,90,255,.22)}
      #${WORKSPACE_ID}{min-height:120px}
      #adminBox.sg-v24-isolated .sg-v24-hidden{display:none!important}
      #adminBox.sg-v24-isolated .sg-v24-only-hidden{display:none!important}
      #adminBox.sg-v24-isolated.sg-v24-overview .sg-v24-only-hidden{display:none!important}
      #adminBox.sg-v24-isolated:not(.sg-v24-overview) .sg-v24-global-dashboard{display:none!important}
      .sg-v24-empty{padding:28px;text-align:center;color:#94a3b8;border:1px dashed #334155;border-radius:14px}
      @media (max-width:700px){#${NAV_ID}{margin-left:-2px;margin-right:-2px;padding:9px}#${NAV_ID} button{padding:10px 15px}}
    `;
    document.head.appendChild(style);
  }

  function main() {
    return document.getElementById('adminBox');
  }

  function children() {
    const root = main();
    return root ? [...root.children] : [];
  }

  function textOf(el) {
    return (el.querySelector?.('h1,h2,h3,h4')?.textContent || el.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function classify(el) {
    const text = textOf(el);
    const id = (el.id || '').toLowerCase();
    const cls = (el.className || '').toString().toLowerCase();
    const hay = `${id} ${cls} ${text}`;

    if (/commande|order/.test(hay)) return 'orders';
    if (/campagne|campaign/.test(hay)) return 'campaigns';
    if (/promotion|promo/.test(hay)) return 'promotions';
    if (/produit|product|stock/.test(hay)) return 'products';
    return 'other';
  }

  function isNavigationOrAuth(el) {
    return el.id === NAV_ID || el.id === 'loginBox' || el.id === 'logoutBtn';
  }

  function buildNav() {
    const root = main();
    if (!root || document.getElementById(NAV_ID)) return;

    const nav = document.createElement('nav');
    nav.id = NAV_ID;
    nav.setAttribute('aria-label', 'Navigation du dashboard');

    VIEWS.forEach(view => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.view = view.id;
      button.textContent = view.label;
      button.addEventListener('click', () => setView(view.id));
      nav.appendChild(button);
    });

    root.insertBefore(nav, root.firstElementChild);
  }

  function prepareWorkspaceMarkers() {
    children().forEach(el => {
      if (el.id === NAV_ID || isNavigationOrAuth(el)) return;
      if (!el.dataset.sgV24Type) el.dataset.sgV24Type = classify(el);
    });
  }

  function setView(view, opts = {}) {
    if (!VIEWS.some(v => v.id === view)) view = 'overview';
    active = view;

    const root = main();
    if (!root) return;

    prepareWorkspaceMarkers();
    root.classList.remove(
      'sg-v24-overview',
      'sg-v24-orders-only',
      'sg-v24-products-only',
      'sg-v24-promotions-only',
      'sg-v24-campaigns-only'
    );
    root.classList.add('sg-v24-isolated', `sg-v24-${view}`);

    children().forEach(el => {
      if (isNavigationOrAuth(el)) return;

      const type = el.dataset.sgV24Type || classify(el);
      const isNav = el.id === NAV_ID;
      const visible = view === 'overview' || type === view;

      // On a module workspace, every unrelated top-level dashboard block disappears.
      el.classList.toggle('sg-v24-only-hidden', !isNav && !visible);
      el.classList.toggle('sg-v24-hidden', !isNav && !visible);
    });

    document.querySelectorAll(`#${NAV_ID} button`).forEach(button => {
      button.classList.toggle('active', button.dataset.view === view);
    });

    try { sessionStorage.setItem('sg_admin_workspace', view); } catch (_) {}

    // True workspace navigation: always start at the top, never jump to an anchor.
    if (!opts.silent) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function interceptLegacyButtons() {
    const root = main();
    if (!root) return;

    [...root.querySelectorAll('button,a')].forEach(el => {
      if (el.dataset.sgV24Bound) return;
      if (el.closest('#ordersTable') || el.closest('#productsTable')) return;

      const text = (el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
      let view = null;
      if (/voir les commandes|gérer les commandes|commandes/.test(text)) view = 'orders';
      else if (/gérer les produits|produits/.test(text)) view = 'products';
      else if (/promotions/.test(text)) view = 'promotions';
      else if (/campagnes/.test(text)) view = 'campaigns';
      else if (/vue d'ensemble|tableau de bord|accueil/.test(text)) view = 'overview';

      if (!view) return;
      el.dataset.sgV24Bound = '1';
      el.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        setView(view);
      }, true);
    });
  }

  function boot() {
    const root = main();
    if (!root) return false;

    addStyle();
    buildNav();
    prepareWorkspaceMarkers();
    interceptLegacyButtons();

    let saved = 'overview';
    try { saved = sessionStorage.getItem('sg_admin_workspace') || 'overview'; } catch (_) {}

    setView(booted ? active : saved, { silent: true });
    booted = true;
    return true;
  }

  function watch() {
    if (boot()) return;
    const observer = new MutationObserver(() => {
      if (boot()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch);
  else watch();
})();
