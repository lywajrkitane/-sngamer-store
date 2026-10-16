/* SNGAMER STORE ADMIN — V2.4 isolated workspaces
   Real navigation: no anchor scrolling. Each module gets its own view.
*/
(function () {
  'use strict';

  const STYLE_ID = 'sg-v24-workspace-style';
  const NAV_ID = 'sg-v24-workspace-nav';
  const VIEWS = [
    { id: 'overview', label: "Vue d'ensemble", match: () => true },
    { id: 'products', label: 'Produits', match: t => /produit|gestion des produits|stock/i.test(t) },
    { id: 'orders', label: 'Commandes', match: t => /commande/i.test(t) },
    { id: 'promotions', label: 'Promotions', match: t => /promotion/i.test(t) },
    { id: 'campaigns', label: 'Campagnes', match: t => /campagne/i.test(t) }
  ];

  let active = 'overview';
  let booted = false;

  function addStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${NAV_ID}{position:sticky;top:0;z-index:80;margin:0 0 18px;padding:10px;background:rgba(11,15,20,.94);backdrop-filter:blur(14px);border:1px solid #26313d;border-radius:16px;display:flex;gap:8px;overflow-x:auto;scrollbar-width:none}
      #${NAV_ID}::-webkit-scrollbar{display:none}
      #${NAV_ID} button{flex:0 0 auto;border:1px solid #26313d;background:#111820;color:#cbd5e1;border-radius:999px;padding:11px 18px;font-weight:800;white-space:nowrap}
      #${NAV_ID} button.active{background:linear-gradient(135deg,#1687ff,#7b35ff);color:#fff;border-color:transparent;box-shadow:0 8px 22px rgba(62,90,255,.22)}
      #adminBox.sg-v24-isolated .sg-v24-hidden{display:none!important}
      #adminBox.sg-v24-isolated.sg-v24-orders-only .stats{display:none!important}
      #adminBox.sg-v24-isolated.sg-v24-products-only .stats{display:none!important}
      #adminBox.sg-v24-isolated.sg-v24-promotions-only .stats{display:none!important}
      #adminBox.sg-v24-isolated.sg-v24-campaigns-only .stats{display:none!important}
      .sg-v24-empty{padding:28px;text-align:center;color:#94a3b8;border:1px dashed #334155;border-radius:14px}
    `;
    document.head.appendChild(style);
  }

  function directSections() {
    const main = document.getElementById('adminBox');
    if (!main) return [];
    return [...main.children].filter(el => el.tagName === 'SECTION');
  }

  function sectionText(section) {
    return (section.querySelector('h1,h2,h3')?.textContent || section.textContent || '').trim();
  }

  function classify(section) {
    const text = sectionText(section);
    if (/commande/i.test(text)) return 'orders';
    if (/campagne/i.test(text)) return 'campaigns';
    if (/promotion/i.test(text)) return 'promotions';
    if (/produit|gestion des produits|stock/i.test(text)) return 'products';
    return 'other';
  }

  function buildNav() {
    const main = document.getElementById('adminBox');
    if (!main || document.getElementById(NAV_ID)) return;
    const nav = document.createElement('nav');
    nav.id = NAV_ID;
    nav.setAttribute('aria-label', 'Navigation du dashboard');
    VIEWS.forEach(v => {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.view = v.id;
      b.textContent = v.label;
      b.addEventListener('click', () => setView(v.id));
      nav.appendChild(b);
    });
    main.insertBefore(nav, main.firstElementChild);
  }

  function setBodyClass(view) {
    const main = document.getElementById('adminBox');
    if (!main) return;
    main.classList.remove('sg-v24-orders-only','sg-v24-products-only','sg-v24-promotions-only','sg-v24-campaigns-only');
    if (view !== 'overview') main.classList.add('sg-v24-' + view + '-only');
  }

  function setView(view, opts) {
    if (!VIEWS.some(v => v.id === view)) view = 'overview';
    active = view;
    const main = document.getElementById('adminBox');
    if (!main) return;

    directSections().forEach(section => {
      const type = classify(section);
      const visible = view === 'overview' || type === view;
      section.classList.toggle('sg-v24-hidden', !visible);
    });

    setBodyClass(view);
    document.querySelectorAll('#' + NAV_ID + ' button').forEach(b => b.classList.toggle('active', b.dataset.view === view));

    // Keep the dashboard at the top of the selected workspace. This is not an anchor jump.
    if (!opts?.silent) window.scrollTo({ top: 0, behavior: 'smooth' });
    try { sessionStorage.setItem('sg_admin_workspace', view); } catch (_) {}
  }

  function interceptLegacyButtons() {
    const candidates = [...document.querySelectorAll('#adminBox button,a')];
    candidates.forEach(el => {
      if (el.dataset.sgV24Bound) return;
      const text = (el.textContent || '').replace(/\s+/g,' ').trim().toLowerCase();
      let view = null;
      if (/voir les commandes|commandes/.test(text)) view = 'orders';
      else if (/gérer les produits|produits/.test(text)) view = 'products';
      else if (/promotions/.test(text)) view = 'promotions';
      else if (/campagnes/.test(text)) view = 'campaigns';
      else if (/vue d'ensemble|tableau de bord|accueil/.test(text)) view = 'overview';
      if (!view) return;
      // Do not hijack actual order/product action buttons.
      if (el.closest('#ordersTable') || el.closest('#productsTable') || el.dataset.statusId || el.dataset.details || el.dataset.products) return;
      el.dataset.sgV24Bound = '1';
      el.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        setView(view);
      }, true);
    });
  }

  function boot() {
    const main = document.getElementById('adminBox');
    if (!main) return false;
    addStyle();
    buildNav();
    interceptLegacyButtons();
    if (!booted) {
      booted = true;
      let saved = 'overview';
      try { saved = sessionStorage.getItem('sg_admin_workspace') || 'overview'; } catch (_) {}
      setView(saved, { silent: true });
    } else {
      setView(active, { silent: true });
    }
    return true;
  }

  function watch() {
    if (boot()) return;
    const observer = new MutationObserver(() => { if (boot()) observer.disconnect(); });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch);
  else watch();
})();
