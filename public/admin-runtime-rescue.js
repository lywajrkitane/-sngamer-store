/* SNGAMER STORE — ADMIN RUNTIME RESCUE
   Defensive runtime guard only. It does not replace the existing admin logic.
   If the premium workspace script is missing/delayed, it reloads it and
   provides a minimal navigation shell so the dashboard never falls back to
   the legacy bare layout. It also explicitly starts the existing loadAll()
   loader once the authenticated admin box is visible.
*/
(function () {
  'use strict';

  const NAV_ID = 'sg-admin-v26-nav';
  const RETRY_MS = 350;
  const MAX_TRIES = 180;
  let tries = 0;
  let dataLoaded = false;
  let rescueScriptRequested = false;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const norm = value => String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();

  const views = [
    ['overview', "Vue d'ensemble", '▦'],
    ['hero', 'Hero', '🎯'],
    ['products', 'Produits', '📦'],
    ['orders', 'Commandes', '🛒'],
    ['promotions', 'Promotions', '🎉'],
    ['campaigns', 'Campagnes', '📣'],
    ['customers', 'Clients', '👥']
  ];

  function root() {
    return $('#adminBox');
  }

  function visibleAdmin() {
    const el = root();
    return !!el && !el.classList.contains('hidden');
  }

  function requestWorkspaceScript() {
    if (rescueScriptRequested || document.querySelector('script[data-sng-admin-runtime-rescue-workspace]')) return;
    rescueScriptRequested = true;
    const script = document.createElement('script');
    script.src = '/admin-v24-workspace.js?v=20261025-runtime-rescue1';
    script.async = false;
    script.dataset.sngAdminRuntimeRescueWorkspace = '1';
    script.onload = () => console.debug('SNGAMER: workspace rescue loaded');
    script.onerror = () => console.error('SNGAMER: workspace rescue failed');
    document.head.appendChild(script);
  }

  function sectionType(section) {
    const heading = norm(section.querySelector('h1,h2,h3,h4')?.textContent);
    const id = norm(section.id);
    const cls = norm(typeof section.className === 'string' ? section.className : '');
    if (id === 'sgcustomersection' || cls.includes('sgcustomersection')) return 'customers';
    if (/hero/.test(heading) || /hero/.test(id) || /heroworkspace/.test(cls)) return 'hero';
    if (/campagnes?/.test(heading) || /campaign/.test(id) || cls.includes('campaignssection')) return 'campaigns';
    if (/promotions?/.test(heading) || /promotion/.test(id) || cls.includes('promoadminsection')) return 'promotions';
    if (/produits?|stock|gestion des produits/.test(heading) || /products?/.test(id)) return 'products';
    if (/commandes?/.test(heading) || /orders?/.test(id)) return 'orders';
    return 'other';
  }

  function installFallbackStyles() {
    if ($('#sg-admin-runtime-rescue-style')) return;
    const style = document.createElement('style');
    style.id = 'sg-admin-runtime-rescue-style';
    style.textContent = `
      #${NAV_ID}{
        display:flex;flex-direction:column;gap:8px;margin:0 0 20px;padding:10px;
        background:linear-gradient(180deg,rgba(12,21,36,.96),rgba(7,13,23,.96));
        border:1px solid rgba(115,145,190,.16);border-radius:20px;box-shadow:0 18px 55px rgba(0,0,0,.28);
      }
      #${NAV_ID} button{
        width:100%;min-height:48px;padding:11px 13px;display:flex;align-items:center;gap:10px;
        border-radius:13px;border:1px solid transparent;background:transparent;color:#8f9db3;
        font-size:13px;font-weight:800;white-space:nowrap;cursor:pointer;
      }
      #${NAV_ID} button.active{color:#fff;border-color:rgba(92,116,255,.30);background:linear-gradient(135deg,rgba(32,126,255,.96),rgba(105,57,255,.96));}
      #${NAV_ID} button span{font-size:17px;width:22px;text-align:center}
      #${NAV_ID} button b{font-weight:800}
      @media(min-width:900px){
        #adminBox.sg-rescue-mode{display:grid!important;grid-template-columns:220px minmax(0,1fr);gap:22px;align-items:start}
        #adminBox.sg-rescue-mode > #${NAV_ID}{grid-column:1;grid-row:1 / span 100;position:sticky;top:94px;margin:0}
        #adminBox.sg-rescue-mode > .stats,#adminBox.sg-rescue-mode > section{grid-column:2;min-width:0}
      }
      @media(max-width:899px){
        #adminBox.sg-rescue-mode{display:block!important}
        #${NAV_ID}{flex-direction:row;overflow-x:auto;position:sticky;top:8px;z-index:9998;margin-bottom:14px;padding:8px}
        #${NAV_ID} button{width:auto;min-width:max-content;min-height:43px;padding:9px 12px}
      }
    `;
    document.head.appendChild(style);
  }

  function ensureNav() {
    const r = root();
    if (!r) return null;
    let nav = $('#' + NAV_ID, r);
    if (!nav) {
      nav = document.createElement('nav');
      nav.id = NAV_ID;
      nav.setAttribute('aria-label', 'Espaces administrateur');
      nav.innerHTML = views.map(([id, label, icon]) =>
        `<button type="button" data-v26-view="${id}"><span aria-hidden="true">${icon}</span><b>${label}</b></button>`
      ).join('');
      r.insertBefore(nav, r.firstElementChild);
    }
    return nav;
  }

  function fallbackApply(view) {
    const r = root();
    const nav = ensureNav();
    if (!r || !nav) return;
    const active = views.some(v => v[0] === view) ? view : 'overview';
    installFallbackStyles();
    r.classList.add('sg-rescue-mode');
    r.dataset.v26Workspace = active;

    const stats = $('.stats', r);
    if (stats) stats.style.display = active === 'overview' ? '' : 'none';

    $$(':scope > section', r).forEach(section => {
      const show = active !== 'overview' && sectionType(section) === active;
      section.style.display = active === 'overview' ? '' : (show ? '' : 'none');
    });

    $$('[data-v26-view]', nav).forEach(button => {
      button.classList.toggle('active', button.dataset.v26View === active);
    });

    try { sessionStorage.setItem('sg_admin_workspace_v26', active); } catch (_) {}
  }

  function bindFallbackNav() {
    const nav = ensureNav();
    if (!nav || nav.dataset.rescueBound === '1') return;
    nav.dataset.rescueBound = '1';
    nav.addEventListener('click', event => {
      const button = event.target.closest('[data-v26-view]');
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      fallbackApply(button.dataset.v26View);
      if (button.dataset.v26View === 'orders' && typeof window.loadOrders === 'function') window.loadOrders().catch(() => {});
      if (button.dataset.v26View === 'products' && typeof window.loadProducts === 'function') window.loadProducts().catch(() => {});
      if (button.dataset.v26View === 'customers' && typeof window.sngAdminCustomersLoad === 'function') window.sngAdminCustomersLoad().catch(() => {});
    });
  }

  function loadData() {
    if (dataLoaded || typeof window.loadAll !== 'function') return;
    dataLoaded = true;
    Promise.resolve(window.loadAll()).catch(error => {
      dataLoaded = false;
      console.error('SNGAMER ADMIN RUNTIME RESCUE DATA ERROR:', error);
    });
  }

  function boot() {
    const r = root();
    if (!r || r.classList.contains('hidden')) return false;

    loadData();

    if (!document.getElementById(NAV_ID)) requestWorkspaceScript();

    // The existing workspace controller normally creates the nav. Only create
    // the fallback shell if it is still missing, so the working controller wins.
    if (!document.getElementById(NAV_ID)) {
      ensureNav();
      installFallbackStyles();
      bindFallbackNav();
      let saved = 'overview';
      try { saved = sessionStorage.getItem('sg_admin_workspace_v26') || 'overview'; } catch (_) {}
      fallbackApply(saved);
    }

    return true;
  }

  function start() {
    const tick = () => {
      tries += 1;
      if (boot() || tries >= MAX_TRIES) return;
      window.setTimeout(tick, RETRY_MS);
    };
    tick();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
