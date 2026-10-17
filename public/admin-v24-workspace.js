/* SNGAMER STORE ADMIN — V2.6 REAL WORKSPACES
   This is the authoritative workspace controller.
   Each module is an isolated admin view: when Orders is selected, every
   other dashboard block is hidden. Navigation never scrolls to an anchor.
*/
(function () {
  'use strict';

  const NAV_ID = 'sg-admin-v26-nav';
  const STYLE_ID = 'sg-admin-v26-style';
  const KEY = 'sg_admin_workspace_v26';
  const VIEWS = [
    ['overview', "Vue d'ensemble", '▦'],
    ['products', 'Produits', '📦'],
    ['orders', 'Commandes', '🛒'],
    ['promotions', 'Promotions', '🎉'],
    ['campaigns', 'Campagnes', '📣']
  ];

  let active = 'overview';
  let timer = null;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const box = () => $('#adminBox');
  const norm = v => String(v || '').replace(/\s+/g, ' ').trim().toLowerCase();

  function typeOfSection(section) {
    const heading = norm(section.querySelector('h1,h2,h3,h4')?.textContent);
    const id = norm(section.id);
    const cls = norm(typeof section.className === 'string' ? section.className : '');

    if (cls.includes('campaignssection') || /campagnes/.test(heading) || /campagn/.test(id)) return 'campaigns';
    if (cls.includes('promoadminsection') || /promotions?/.test(heading) || /promotion/.test(id)) return 'promotions';
    if (/gestion des produits/.test(heading) || /produits?/.test(heading) || /stock/.test(heading) || /products?/.test(id)) return 'products';
    if (/commandes?/.test(heading) || /orders?/.test(id)) return 'orders';

    // Fallback only for clearly identifiable sections.
    const text = norm(section.textContent);
    if (/gestion des produits/.test(text) && !/commandes/.test(text.slice(0, 120))) return 'products';
    if (/gestion rapide de toutes les commandes/.test(text) || /commandes/.test(heading)) return 'orders';
    return 'other';
  }

  function sections() {
    const root = box();
    return root ? $$(':scope > section', root) : [];
  }

  function removeLegacyNavs() {
    ['#sngWorkspaceNav', '#sg-v25-workspace-nav', '#sg-v25-workspace-style', '#sngWorkspaceStyles'].forEach(sel => {
      $$(sel).forEach(el => {
        if (el.id === STYLE_ID) return;
        el.remove();
      });
    });
  }

  function styles() {
    if ($('#' + STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${NAV_ID}{
        position:sticky;top:0;z-index:9998;
        display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;
        margin:0 0 18px;padding:10px;
        background:rgba(8,14,24,.98);backdrop-filter:blur(14px);
        border:1px solid rgba(100,130,180,.20);border-radius:16px;
      }
      #${NAV_ID}::-webkit-scrollbar{display:none}
      #${NAV_ID} button{
        flex:0 0 auto;min-height:44px;padding:10px 16px;
        border-radius:13px;border:1px solid #26313d;background:#101a29;
        color:#aebbd0;font-size:14px;font-weight:800;white-space:nowrap;cursor:pointer;
      }
      #${NAV_ID} button.active{color:#fff;border-color:transparent;background:linear-gradient(135deg,#197cff,#7b32ff);box-shadow:0 8px 24px rgba(60,80,255,.24)}

      /* REAL ISOLATION: non-section dashboard blocks disappear outside overview. */
      #adminBox.sg-v26-mode > :not(#${NAV_ID}):not(section){display:none!important}
      #adminBox.sg-v26-mode > section.sg-v26-hide{display:none!important}
      #adminBox.sg-v26-mode > section.sg-v26-show{display:block!important}

      /* Old navigation bars cannot remain visible alongside the authoritative one. */
      #adminBox #sngWorkspaceNav,#adminBox #sg-v25-workspace-nav{display:none!important}

      @media(max-width:700px){
        #${NAV_ID}{margin-bottom:14px;padding:8px}
        #${NAV_ID} button{min-height:42px;padding:9px 13px;font-size:13px}
      }
    `;
    document.head.appendChild(style);
  }

  function nav() {
    const root = box();
    if (!root) return null;
    let n = $('#' + NAV_ID);
    if (n && n.parentElement !== root) n = null;
    if (n) return n;

    n = document.createElement('nav');
    n.id = NAV_ID;
    n.setAttribute('aria-label', 'Espaces administrateur');
    n.innerHTML = VIEWS.map(([id, label, icon]) =>
      `<button type="button" data-v26-view="${id}"><span aria-hidden="true">${icon}</span> <b>${label}</b></button>`
    ).join('');
    root.insertBefore(n, root.firstElementChild);
    return n;
  }

  function apply(view, scroll) {
    const root = box();
    if (!root) return;
    active = VIEWS.some(v => v[0] === view) ? view : 'overview';
    try { sessionStorage.setItem(KEY, active); } catch (_) {}

    styles();
    removeLegacyNavs();
    const n = nav();
    root.classList.add('sg-v26-mode');
    root.dataset.v26Workspace = active;

    sections().forEach(section => {
      const type = typeOfSection(section);
      const show = active === 'overview' || type === active;
      section.classList.toggle('sg-v26-show', show);
      section.classList.toggle('sg-v26-hide', !show);
    });

    n.querySelectorAll('[data-v26-view]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.v26View === active);
    });

    if (scroll) window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }

  function bindNavigation() {
    const n = nav();
    if (!n || n.dataset.bound) return;
    n.dataset.bound = '1';
    n.addEventListener('click', e => {
      const btn = e.target.closest('[data-v26-view]');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      apply(btn.dataset.v26View, true);
    });

    // This capture listener runs before older document-level workspace handlers.
    window.addEventListener('click', e => {
      const btn = e.target.closest?.('[data-v26-view]');
      if (!btn) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      apply(btn.dataset.v26View, true);
    }, true);
  }

  function interceptOldDashboardButtons() {
    if (window.__sgAdminV26LegacyIntercept) return;
    window.__sgAdminV26LegacyIntercept = true;
    window.addEventListener('click', e => {
      if (e.target.closest?.('#' + NAV_ID)) return;
      const el = e.target.closest?.('button,a,[role="button"]');
      if (!el) return;
      const text = norm(el.textContent);
      let view = null;
      if (/vue d'ensemble|vue d’ensemble|tableau de bord|accueil/.test(text)) view = 'overview';
      else if (/voir les commandes|gérer les commandes|^commandes$/.test(text)) view = 'orders';
      else if (/gérer les produits|^produits$/.test(text)) view = 'products';
      else if (/^promotions$/.test(text)) view = 'promotions';
      else if (/^campagnes$|campagnes & promotions/.test(text)) view = 'campaigns';
      if (!view) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      apply(view, true);
    }, true);
  }

  function boot() {
    const root = box();
    if (!root || root.classList.contains('hidden')) return false;
    styles();
    removeLegacyNavs();
    nav();
    bindNavigation();
    interceptOldDashboardButtons();
    let saved = 'overview';
    try { saved = sessionStorage.getItem(KEY) || 'overview'; } catch (_) {}
    apply(saved, false);
    return true;
  }

  function start() {
    if (boot()) return;
    let tries = 0;
    timer = setInterval(() => {
      if (boot() || ++tries > 150) clearInterval(timer);
    }, 200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
