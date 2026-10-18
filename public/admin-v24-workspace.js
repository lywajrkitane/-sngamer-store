/* SNGAMER STORE ADMIN — V2.7 PREMIUM WORKSPACES
   UI-only workspace controller.
   Keeps the existing admin logic and data intact while providing a
   premium responsive dashboard shell for both admin.html and
   admin-dashboard.html.
*/
(function () {
  'use strict';

  const NAV_ID = 'sg-admin-v26-nav';
  const STYLE_ID = 'sg-admin-v27-style';
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
        if (el.id === NAV_ID || el.id === STYLE_ID) return;
        el.remove();
      });
    });
  }

  function styles() {
    if ($('#' + STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      :root{
        --sg-bg:#050913;
        --sg-panel:rgba(11,18,31,.88);
        --sg-panel-2:rgba(15,24,40,.94);
        --sg-border:rgba(115,145,190,.16);
        --sg-border-strong:rgba(74,137,255,.32);
        --sg-text:#f7f9ff;
        --sg-muted:#8f9db3;
        --sg-blue:#2684ff;
        --sg-purple:#7545ff;
        --sg-pink:#e62f9f;
        --sg-shadow:0 18px 55px rgba(0,0,0,.28);
      }

      /* ---------- GLOBAL ADMIN SHELL ---------- */
      body{
        background:
          radial-gradient(circle at 15% -10%,rgba(31,111,255,.12),transparent 28%),
          radial-gradient(circle at 90% 5%,rgba(126,52,255,.10),transparent 25%),
          var(--sg-bg)!important;
        color:var(--sg-text)!important;
        font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif!important;
      }

      header{
        position:sticky!important;
        top:0;
        z-index:10000;
        min-height:70px;
        padding:14px clamp(18px,3vw,42px)!important;
        background:rgba(4,8,16,.86)!important;
        border-bottom:1px solid var(--sg-border)!important;
        box-shadow:0 10px 35px rgba(0,0,0,.22);
        backdrop-filter:blur(18px);
      }

      header h1{
        font-size:16px!important;
        letter-spacing:.04em;
        font-weight:900;
        text-transform:uppercase;
      }

      header h1::first-letter{color:#35b9ff}

      .logout{
        border:1px solid rgba(255,100,100,.24)!important;
        background:linear-gradient(135deg,#8f2638,#d23b4f)!important;
        border-radius:11px!important;
        padding:10px 16px!important;
        box-shadow:0 8px 22px rgba(210,59,79,.16);
      }

      main#adminBox{
        width:min(1480px,calc(100% - 36px))!important;
        max-width:none!important;
        margin:0 auto!important;
        padding:26px 0 70px!important;
      }

      /* ---------- PREMIUM LOGIN ---------- */
      #loginBox.login{
        width:min(440px,calc(100% - 32px));
        max-width:none!important;
        margin:90px auto!important;
        padding:30px!important;
        border:1px solid var(--sg-border)!important;
        border-radius:24px!important;
        background:linear-gradient(145deg,rgba(14,24,40,.96),rgba(7,13,24,.96))!important;
        box-shadow:var(--sg-shadow),0 0 80px rgba(48,94,255,.07);
      }

      #loginBox h2{font-size:25px;margin-bottom:22px}
      #loginBox input{
        min-height:48px;
        margin:6px 0 10px;
        border-radius:12px;
        border:1px solid var(--sg-border)!important;
        background:#070d17!important;
      }
      #loginBox button:not(.hidden){
        min-height:48px;
        border-radius:12px;
        background:linear-gradient(135deg,var(--sg-blue),var(--sg-purple),var(--sg-pink))!important;
        box-shadow:0 12px 30px rgba(72,72,255,.20);
      }

      /* ---------- DESKTOP WORKSPACE ---------- */
      #${NAV_ID}{
        grid-column:1;
        grid-row:1 / span 100;
        position:sticky;
        top:94px;
        align-self:start;
        display:flex;
        flex-direction:column;
        gap:8px;
        overflow:visible;
        margin:0;
        padding:10px;
        background:linear-gradient(180deg,rgba(12,21,36,.96),rgba(7,13,23,.96));
        backdrop-filter:blur(18px);
        border:1px solid var(--sg-border);
        border-radius:20px;
        box-shadow:var(--sg-shadow);
      }

      #${NAV_ID}::before{
        content:'SNGAMER STORE';
        display:block;
        padding:9px 10px 13px;
        color:#8ea4c5;
        font-size:10px;
        font-weight:900;
        letter-spacing:.22em;
      }

      #${NAV_ID}::-webkit-scrollbar{display:none}
      #${NAV_ID} button{
        width:100%;
        min-height:48px;
        padding:11px 13px;
        display:flex;
        align-items:center;
        gap:10px;
        border-radius:13px;
        border:1px solid transparent;
        background:transparent;
        color:#8f9db3;
        font-size:13px;
        font-weight:800;
        white-space:nowrap;
        cursor:pointer;
        transition:transform .18s ease,background .18s ease,color .18s ease,border-color .18s ease,box-shadow .18s ease;
      }
      #${NAV_ID} button:hover{
        color:#fff;
        background:rgba(48,76,120,.18);
        border-color:rgba(100,140,200,.14);
        transform:translateX(2px);
      }
      #${NAV_ID} button.active{
        color:#fff;
        border-color:rgba(92,116,255,.30);
        background:linear-gradient(135deg,rgba(32,126,255,.96),rgba(105,57,255,.96));
        box-shadow:0 10px 28px rgba(60,80,255,.22);
      }
      #${NAV_ID} button span{font-size:17px;width:22px;text-align:center}
      #${NAV_ID} button b{font-weight:800}

      #adminBox.sg-v26-mode{
        display:grid!important;
        grid-template-columns:220px minmax(0,1fr);
        column-gap:22px;
        align-items:start;
      }

      #adminBox.sg-v26-mode > section{
        grid-column:2;
        min-width:0;
      }

      /* REAL ISOLATION */
      #adminBox.sg-v26-mode > :not(#${NAV_ID}):not(section):not(.stats){display:none!important}
      #adminBox.sg-v26-mode > .stats{display:grid!important;grid-column:2;min-width:0}
      #adminBox.sg-v26-mode[data-v26-workspace="overview"] > .stats{display:grid!important}
      #adminBox.sg-v26-mode[data-v26-workspace]:not([data-v26-workspace="overview"]) > .stats{display:none!important}
      #adminBox.sg-v26-mode > section.sg-v26-hide{display:none!important}
      #adminBox.sg-v26-mode > section.sg-v26-show{display:block!important}
      #adminBox #sngWorkspaceNav,#adminBox #sg-v25-workspace-nav{display:none!important}

      /* ---------- SECTIONS ---------- */
      #adminBox section{
        position:relative;
        margin:0 0 20px!important;
        padding:24px!important;
        border:1px solid var(--sg-border)!important;
        border-radius:22px!important;
        background:linear-gradient(145deg,rgba(13,23,39,.94),rgba(7,13,23,.94))!important;
        box-shadow:var(--sg-shadow);
        overflow:hidden;
      }

      #adminBox section::before{
        content:'';
        position:absolute;
        left:0;right:0;top:0;height:1px;
        background:linear-gradient(90deg,transparent,rgba(58,137,255,.45),rgba(157,67,255,.30),transparent);
        pointer-events:none;
      }

      #adminBox section h2{
        margin:0 0 20px!important;
        font-size:20px!important;
        letter-spacing:-.02em;
      }

      /* ---------- STATS ---------- */
      #adminBox .stats{
        grid-column:2;
        display:grid;
        grid-template-columns:repeat(4,minmax(0,1fr));
        gap:14px;
        margin:0 0 20px!important;
      }

      #adminBox .stat{
        position:relative;
        min-height:120px;
        padding:20px!important;
        border:1px solid var(--sg-border)!important;
        border-radius:18px!important;
        background:linear-gradient(145deg,rgba(14,25,43,.96),rgba(8,15,27,.96))!important;
        box-shadow:0 10px 32px rgba(0,0,0,.20);
        transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease;
      }
      #adminBox .stat:hover{
        transform:translateY(-3px);
        border-color:var(--sg-border-strong)!important;
        box-shadow:0 16px 36px rgba(0,0,0,.28),0 0 28px rgba(40,115,255,.06);
      }
      #adminBox .stat strong{
        margin-top:10px!important;
        font-size:27px!important;
        line-height:1.05;
        letter-spacing:-.03em;
      }
      #adminBox .stat::after{
        content:'';
        position:absolute;
        right:16px;bottom:16px;
        width:42px;height:3px;
        border-radius:99px;
        background:linear-gradient(90deg,var(--sg-blue),var(--sg-purple),var(--sg-pink));
        opacity:.8;
      }

      /* ---------- FORMS ---------- */
      #adminBox input,#adminBox select,#adminBox textarea{
        min-height:44px;
        margin:0!important;
        padding:11px 13px!important;
        border-radius:11px!important;
        border:1px solid rgba(112,140,180,.18)!important;
        background:#070e18!important;
        color:#f5f7ff!important;
        outline:none;
        transition:border-color .18s ease,box-shadow .18s ease,background .18s ease;
      }
      #adminBox textarea{min-height:100px;resize:vertical}
      #adminBox input:focus,#adminBox select:focus,#adminBox textarea:focus{
        border-color:rgba(62,139,255,.70)!important;
        box-shadow:0 0 0 3px rgba(52,127,255,.10),0 8px 24px rgba(0,0,0,.14);
      }

      #adminBox label{
        color:#a9b7cb;
        font-size:12px;
        font-weight:800;
        letter-spacing:.02em;
      }

      #adminBox .product-form{
        display:grid;
        grid-template-columns:repeat(4,minmax(0,1fr));
        gap:12px;
        align-items:center;
      }
      #adminBox .product-form > textarea{grid-column:1 / -1}
      #adminBox .product-form > label{align-self:end}
      #adminBox .product-form > input[type=file]{padding:9px!important}
      #adminBox .product-form > button{
        min-height:46px;
        border-radius:12px;
        background:linear-gradient(135deg,var(--sg-blue),var(--sg-purple),var(--sg-pink))!important;
        color:#fff!important;
        box-shadow:0 10px 25px rgba(73,74,255,.20);
      }

      /* ---------- TABLES ---------- */
      #adminBox .table-wrap{
        overflow-x:auto;
        border:1px solid rgba(110,140,180,.12);
        border-radius:16px;
        background:rgba(4,9,17,.32);
      }
      #adminBox table{min-width:760px;border-collapse:separate;border-spacing:0}
      #adminBox th{
        padding:13px 12px!important;
        color:#7f91aa!important;
        background:rgba(11,20,34,.82);
        font-size:11px;
        text-transform:uppercase;
        letter-spacing:.08em;
      }
      #adminBox td{
        padding:14px 12px!important;
        border-bottom:1px solid rgba(110,140,180,.10)!important;
        color:#e8edf6;
      }
      #adminBox tbody tr{transition:background .18s ease}
      #adminBox tbody tr:hover{background:rgba(45,86,145,.08)}
      #adminBox tbody tr:last-child td{border-bottom:0!important}

      #adminBox .delete{
        border-radius:10px!important;
        background:rgba(213,54,73,.12)!important;
        border:1px solid rgba(213,54,73,.24)!important;
        color:#ff8090!important;
      }
      #adminBox .refresh{
        border-radius:10px!important;
        border:1px solid rgba(75,140,255,.20)!important;
        background:#0d1929!important;
        color:#c8d6ea!important;
      }


      /* ---------- MOBILE TABLE CARDS V1 ---------- */
      @media(max-width:760px){
        #adminBox .products-table-wrap,
        #adminBox .orders-table-wrap{
          overflow:visible!important;
          border:0!important;
          background:transparent!important;
          border-radius:0!important;
        }
        #adminBox .products-table-wrap table,
        #adminBox .orders-table-wrap table{
          display:block!important;
          width:100%!important;
          min-width:0!important;
          border:0!important;
          border-collapse:separate!important;
          border-spacing:0!important;
        }
        #adminBox .products-table-wrap thead,
        #adminBox .orders-table-wrap thead{display:none!important;}
        #adminBox .products-table-wrap tbody,
        #adminBox .orders-table-wrap tbody{
          display:grid!important;
          gap:12px!important;
          width:100%!important;
        }
        #adminBox .products-table-wrap tbody tr,
        #adminBox .orders-table-wrap tbody tr{
          display:block!important;
          width:100%!important;
          min-width:0!important;
          margin:0!important;
          padding:4px 14px!important;
          border:1px solid rgba(115,145,190,.16)!important;
          border-radius:16px!important;
          background:linear-gradient(145deg,rgba(14,25,43,.96),rgba(8,15,27,.96))!important;
          box-shadow:0 10px 28px rgba(0,0,0,.18)!important;
          overflow:hidden!important;
        }
        #adminBox .products-table-wrap td,
        #adminBox .orders-table-wrap td{
          display:flex!important;
          align-items:center!important;
          justify-content:space-between!important;
          gap:12px!important;
          width:100%!important;
          min-width:0!important;
          min-height:48px!important;
          padding:11px 0!important;
          border-bottom:1px solid rgba(110,140,180,.10)!important;
          white-space:normal!important;
          overflow-wrap:anywhere!important;
        }
        #adminBox .products-table-wrap td:last-child,
        #adminBox .orders-table-wrap td:last-child{border-bottom:0!important;}
        #adminBox .products-table-wrap td::before,
        #adminBox .orders-table-wrap td::before{
          flex:0 0 auto!important;
          color:#7f91aa!important;
          font-size:10px!important;
          font-weight:900!important;
          letter-spacing:.08em!important;
          text-transform:uppercase!important;
          white-space:nowrap!important;
        }
        #adminBox .products-table-wrap td:nth-child(1)::before{content:'ID';}
        #adminBox .products-table-wrap td:nth-child(2)::before{content:'Produit';}
        #adminBox .products-table-wrap td:nth-child(3)::before{content:'Catégorie';}
        #adminBox .products-table-wrap td:nth-child(4)::before{content:'Prix';}
        #adminBox .products-table-wrap td:nth-child(5)::before{content:'Stock';}
        #adminBox .products-table-wrap td:nth-child(6)::before{content:'Action';}
        #adminBox .orders-table-wrap td:nth-child(1)::before{content:'ID';}
        #adminBox .orders-table-wrap td:nth-child(2)::before{content:'Date';}
        #adminBox .orders-table-wrap td:nth-child(3)::before{content:'Client';}
        #adminBox .orders-table-wrap td:nth-child(4)::before{content:'Articles';}
        #adminBox .orders-table-wrap td:nth-child(5)::before{content:'Total';}
        #adminBox .orders-table-wrap td:nth-child(6)::before{content:'Paiement';}
        #adminBox .orders-table-wrap td:nth-child(7)::before{content:'Statut';}
        #adminBox .products-table-wrap td:last-child,
        #adminBox .orders-table-wrap td:last-child{
          align-items:stretch!important;
          flex-direction:column!important;
          gap:7px!important;
        }
        #adminBox .products-table-wrap td:last-child::before,
        #adminBox .orders-table-wrap td:last-child::before{align-self:flex-start!important;}
        #adminBox .products-table-wrap td:last-child button,
        #adminBox .orders-table-wrap td:last-child button,
        #adminBox .orders-table-wrap td:last-child select{
          width:100%!important;
          max-width:none!important;
          min-width:0!important;
        }
        #adminBox .orders-table-wrap .status{min-width:0!important;width:100%!important;}
      }
      @media(max-width:420px){
        #adminBox .products-table-wrap tbody tr,
        #adminBox .orders-table-wrap tbody tr{
          padding-left:12px!important;
          padding-right:12px!important;
          border-radius:14px!important;
        }
        #adminBox .products-table-wrap td,
        #adminBox .orders-table-wrap td{font-size:13px!important;}
      }

      /* ---------- RESPONSIVE ---------- */
      @media(max-width:1050px){
        #adminBox .stats{grid-template-columns:repeat(2,minmax(0,1fr))}
        #adminBox.sg-v26-mode{grid-template-columns:190px minmax(0,1fr);column-gap:16px}
        #${NAV_ID}{top:88px}
      }

      @media(max-width:760px){
        header{position:relative!important}
        main#adminBox{width:min(100% - 20px,680px)!important;padding:12px 0 50px!important}
        #adminBox.sg-v26-mode{display:block!important}
        #${NAV_ID}{
          position:sticky;
          top:8px;
          z-index:9998;
          flex-direction:row;
          overflow-x:auto;
          margin:0 0 14px;
          padding:8px;
          border-radius:16px;
        }
        #${NAV_ID}::before{display:none}
        #${NAV_ID} button{width:auto;min-height:43px;flex:0 0 auto;padding:9px 12px}
        #adminBox .stats{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
        #adminBox .stat{min-height:105px;padding:15px!important}
        #adminBox .stat strong{font-size:22px!important}
        #adminBox section{padding:17px!important;border-radius:18px!important}
        #adminBox .product-form{grid-template-columns:1fr}
        #adminBox .product-form > textarea{grid-column:auto}
        #adminBox .table-wrap{border-radius:13px}
        header h1{font-size:14px!important}
      }

      @media(max-width:480px){
        main#adminBox{width:calc(100% - 14px)!important}
        #adminBox .stats{grid-template-columns:1fr}
        #adminBox .stat{min-height:94px}
        #adminBox section{padding:14px!important}
        #adminBox section h2{font-size:18px!important}
        #${NAV_ID} button{font-size:12px;padding:8px 10px}
      }

      @media(prefers-reduced-motion:reduce){
        *,*::before,*::after{scroll-behavior:auto!important;transition:none!important;animation:none!important}
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

  let viewLoadGeneration = 0;

  function refreshViewData(view) {
    const root = box();
    if (!root || root.classList.contains('hidden')) return;
    const generation = ++viewLoadGeneration;
    const delays = view === 'orders' ? [0, 1200] : view === 'overview' ? [0, 900] : view === 'products' ? [0] : [];

    delays.forEach((delay, index) => {
      setTimeout(async () => {
        if (generation !== viewLoadGeneration || active !== view || root.classList.contains('hidden')) return;
        if (index > 0 && view === 'orders') {
          const tbody = $('#ordersTable');
          // The explicit empty-state row also counts as a completed render.
          if (tbody && tbody.children.length > 0) return;
        }
        const loader = view === 'orders'
          ? (typeof window.loadOrders === 'function' ? window.loadOrders : window.loadAll)
          : view === 'overview'
            ? window.loadAll
            : view === 'products'
              ? window.loadProducts
              : null;
        if (typeof loader !== 'function') return;
        try {
          await loader();
        } catch (error) {
          console.error('ADMIN_WORKSPACE_AUTOLOAD_ERROR:', view, error);
        }
      }, delay);
    });
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

    // Statistics are a direct child of #adminBox, not a section. Explicitly
    // show them on Overview and hide them only in the other workspaces.
    const stats = root.querySelector(':scope > .stats');
    if (stats) stats.style.display = active === 'overview' ? 'grid' : 'none';

    // Restoring the saved "Commandes" tab also loads orders automatically.
    refreshViewData(active);

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