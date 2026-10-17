/* SNGAMER STORE ADMIN — V2.5 isolated workspaces
   Each admin module is a real workspace: no anchor scrolling and no mixed sections.
   Overview = everything. Products = products only. Orders = orders only.
   Promotions = promotions only. Campaigns = campaigns only.
*/
(function () {
  'use strict';

  const STYLE_ID = 'sg-v25-workspace-style';
  const NAV_ID = 'sg-v25-workspace-nav';
  const STORAGE_KEY = 'sg_admin_workspace_v25';
  const VIEWS = [
    { id: 'overview', label: "Vue d'ensemble", icon: '▦' },
    { id: 'products', label: 'Produits', icon: '📦' },
    { id: 'orders', label: 'Commandes', icon: '🛒' },
    { id: 'promotions', label: 'Promotions', icon: '🎉' },
    { id: 'campaigns', label: 'Campagnes', icon: '📣' }
  ];

  let active = 'overview';
  let observer = null;

  const root = () => document.getElementById('adminBox');
  const children = () => root() ? Array.from(root().children) : [];
  const clean = value => String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${NAV_ID}{
        position:sticky;top:0;z-index:9000;
        display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;
        margin:0 0 18px;padding:10px;
        background:rgba(8,14,24,.97);backdrop-filter:blur(16px);
        border:1px solid rgba(100,130,180,.20);border-radius:16px;
      }
      #${NAV_ID}::-webkit-scrollbar{display:none}
      #${NAV_ID} button{
        flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;gap:7px;
        min-height:44px;padding:10px 16px;border-radius:13px;
        border:1px solid #26313d;background:#101a29;color:#aebbd0;
        font-size:14px;font-weight:800;white-space:nowrap;cursor:pointer;
      }
      #${NAV_ID} button.active{
        color:#fff;border-color:transparent;
        background:linear-gradient(135deg,#197cff,#7b32ff);
        box-shadow:0 8px 24px rgba(60,80,255,.24);
      }
      #adminBox.sg-v25-workspace > .sg-v25-hidden{display:none!important}
      #adminBox.sg-v25-workspace > section.sg-v25-hidden{display:none!important}
      #adminBox.sg-v25-workspace > section.sg-v25-visible{display:block!important}
      @media(max-width:700px){
        #${NAV_ID}{margin:0 0 14px;padding:8px}
        #${NAV_ID} button{min-height:42px;padding:9px 13px;font-size:13px}
      }
    `;
    document.head.appendChild(style);
  }

  function classify(el) {
    const id = clean(el.id);
    const cls = clean(typeof el.className === 'string' ? el.className : '');
    const heading = clean(el.querySelector?.('h1,h2,h3,h4')?.textContent);
    const text = clean(el.textContent);
    const hay = `${id} ${cls} ${heading} ${text}`;

    if (/promo|promotion/.test(hay)) return 'promotions';
    if (/campagne|campaign/.test(hay)) return 'campaigns';
    if (/commande|orders?/.test(hay)) return 'orders';
    if (/produit|products?|gestion des produits|stock/.test(hay)) return 'products';
    return 'other';
  }

  function buildNav() {
    const box = root();
    if (!box) return null;
    let nav = document.getElementById(NAV_ID);
    if (nav && nav.parentElement !== box) nav = null;
    if (nav) return nav;

    nav = document.createElement('nav');
    nav.id = NAV_ID;
    nav.setAttribute('aria-label', 'Navigation des espaces administrateur');
    nav.innerHTML = VIEWS.map(view =>
      `<button type="button" data-workspace="${view.id}"><span aria-hidden="true">${view.icon}</span><b>${view.label}</b></button>`
    ).join('');

    box.insertBefore(nav, box.firstElementChild);
    nav.addEventListener('click', event => {
      const button = event.target.closest('[data-workspace]');
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      setView(button.dataset.workspace);
    });
    return nav;
  }

  function markChildren() {
    children().forEach(el => {
      if (el.id === NAV_ID) return;
      if (el.id === 'loginBox' || el.id === 'logoutBtn') return;
      // Recalculate every time so dynamically inserted promotion/campaign/order sections
      // cannot remain stuck in the wrong workspace.
      el.dataset.sgV25Type = classify(el);
    });
  }

  function applyVisibility(view) {
    const box = root();
    if (!box) return;
    markChildren();

    box.classList.add('sg-v25-workspace');
    box.dataset.workspace = view;

    children().forEach(el => {
      if (el.id === NAV_ID || el.id === 'loginBox' || el.id === 'logoutBtn') return;
      const type = el.dataset.sgV25Type || classify(el);
      const visible = view === 'overview' || type === view;
      el.classList.toggle('sg-v25-visible', visible);
      el.classList.toggle('sg-v25-hidden', !visible);
    });

    const nav = document.getElementById(NAV_ID);
    if (nav) {
      nav.querySelectorAll('[data-workspace]').forEach(button => {
        button.classList.toggle('active', button.dataset.workspace === view);
      });
    }
  }

  function setView(view, shouldScroll = true) {
    if (!VIEWS.some(item => item.id === view)) view = 'overview';
    active = view;
    applyVisibility(view);
    try { sessionStorage.setItem(STORAGE_KEY, view); } catch (_) {}

    // A module is a page-like workspace, never an anchor inside the overview.
    if (shouldScroll) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function bindLegacyActions() {
    const box = root();
    if (!box) return;
    box.querySelectorAll('button,a,[role="button"]').forEach(el => {
      if (el.id === NAV_ID || el.closest(`#${NAV_ID}`)) return;
      if (el.closest('#ordersTable,#productsTable')) return;
      if (el.dataset.sgV25Bound) return;

      const text = clean(el.textContent);
      let view = null;
      if (/vue d'ensemble|vue d’ensemble|tableau de bord|accueil/.test(text)) view = 'overview';
      else if (/voir les commandes|gérer les commandes/.test(text)) view = 'orders';
      else if (/gérer les produits/.test(text)) view = 'products';
      else if (/^promotions$|campagnes & promotions/.test(text)) view = 'promotions';
      else if (/^campagnes$/.test(text)) view = 'campaigns';
      if (!view) return;

      el.dataset.sgV25Bound = '1';
      el.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        setView(view, true);
      }, true);
    });
  }

  function boot() {
    const box = root();
    if (!box || box.classList.contains('hidden')) return false;
    addStyles();
    buildNav();
    applyVisibility(active);
    bindLegacyActions();
    return true;
  }

  function start() {
    try { active = sessionStorage.getItem(STORAGE_KEY) || 'overview'; } catch (_) { active = 'overview'; }
    if (!VIEWS.some(item => item.id === active)) active = 'overview';

    const run = () => {
      if (boot()) {
        // Re-run when the existing dashboard adds sections after API loading.
        if (!observer) {
          observer = new MutationObserver(() => {
            if (boot()) applyVisibility(active);
          });
          const box = root();
          if (box) observer.observe(box, { childList: true });
        }
        return true;
      }
      return false;
    };

    if (run()) return;
    const timer = setInterval(() => {
      if (run()) clearInterval(timer);
    }, 200);
    setTimeout(() => clearInterval(timer), 30000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
