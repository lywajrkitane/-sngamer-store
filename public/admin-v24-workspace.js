/* SNGAMER STORE — canonical admin workspace controller
   Single UI owner for dashboard navigation. Business/data logic stays untouched.
*/
(function () {
  'use strict';

  var NAV_ID = 'sg-admin-v26-nav';
  var ROOT_ID = 'adminBox';
  var STORAGE_KEY = 'sg_admin_workspace_v26';
  var VIEWS = [
    ['overview', "Vue d'ensemble", '▦'],
    ['hero', 'Hero', '🎯'],
    ['products', 'Produits', '📦'],
    ['orders', 'Commandes', '🛒'],
    ['promotions', 'Promotions', '🎉'],
    ['campaigns', 'Campagnes', '📣'],
    ['customers', 'Clients', '👥']
  ];

  function $(selector, root) { return (root || document).querySelector(selector); }
  function $$(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }
  function root() { return document.getElementById(ROOT_ID); }
  function norm(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function sectionType(section) {
    var heading = norm(section.querySelector('h1,h2,h3,h4') ? section.querySelector('h1,h2,h3,h4').textContent : '');
    var id = norm(section.id);
    var cls = norm(typeof section.className === 'string' ? section.className : '');
    var text = norm((section.textContent || '').slice(0, 800));

    if (id === 'sgcustomersection' || cls.indexOf('sgcustomersection') !== -1 || /clients?/.test(heading)) return 'customers';
    if (/\bhero\b/.test(heading) || id.indexOf('hero') !== -1 || cls.indexOf('hero') !== -1 || /page d'accueil|page d'accueil/.test(heading)) return 'hero';
    if (/campagnes?/.test(heading) || id.indexOf('campaign') !== -1 || cls.indexOf('campaignssection') !== -1) return 'campaigns';
    if (/promotions?/.test(heading) || id.indexOf('promotion') !== -1 || cls.indexOf('promoadminsection') !== -1) return 'promotions';
    if (/gestion des produits|produits?|stock/.test(heading) || id.indexOf('product') !== -1) return 'products';
    if (/commandes?|orders?/.test(heading) || id.indexOf('order') !== -1 || text.indexOf('gestion rapide de toutes les commandes') !== -1) return 'orders';
    return 'other';
  }

  function sections() {
    var r = root();
    return r ? $$(':scope > section', r) : [];
  }

  function installStyles() {
    if ($('#sg-canonical-workspace-style')) return;
    var style = document.createElement('style');
    style.id = 'sg-canonical-workspace-style';
    style.textContent = '\n' +
      '#'+NAV_ID+'{grid-column:1;grid-row:1 / span 100;position:sticky;top:88px;align-self:start;display:flex;flex-direction:column;gap:8px;margin:0;padding:10px;background:linear-gradient(180deg,rgba(12,21,36,.97),rgba(7,13,23,.97));border:1px solid rgba(115,145,190,.16);border-radius:20px;box-shadow:0 18px 55px rgba(0,0,0,.25);z-index:20}'+
      '#'+NAV_ID+'::before{content:"SNGAMER STORE";display:block;padding:8px 10px 12px;color:#8ea4c5;font-size:10px;font-weight:900;letter-spacing:.2em}'+
      '#'+NAV_ID+' button{width:100%;min-height:47px;padding:10px 12px;display:flex;align-items:center;gap:10px;border:1px solid transparent;border-radius:13px;background:transparent;color:#8f9db3;font-size:13px;font-weight:800;white-space:nowrap;cursor:pointer}'+
      '#'+NAV_ID+' button:hover{color:#fff;background:rgba(48,76,120,.18)}'+
      '#'+NAV_ID+' button.active{color:#fff;border-color:rgba(92,116,255,.3);background:linear-gradient(135deg,#207eff,#6939ff);box-shadow:0 10px 28px rgba(60,80,255,.22)}'+
      '#'+NAV_ID+' button span{font-size:17px;width:22px;text-align:center}'+
      '#'+NAV_ID+' button b{font-weight:800}'+
      '#adminBox.sg-v26-mode{display:grid!important;grid-template-columns:220px minmax(0,1fr)!important;column-gap:22px!important;align-items:start!important}'+
      '#adminBox.sg-v26-mode>.stats,#adminBox.sg-v26-mode>section{grid-column:2;min-width:0}'+
      '#adminBox.sg-v26-mode>section.sg-v26-hide{display:none!important}'+
      '#adminBox.sg-v26-mode>section.sg-v26-show{display:block!important}'+
      '@media(max-width:899px){#adminBox.sg-v26-mode{display:block!important}#'+NAV_ID+'{position:relative;top:auto;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;width:100%;margin:0 0 14px;padding:8px;box-sizing:border-box}#'+NAV_ID+'::before{grid-column:1/-1;padding:5px 7px 8px}#'+NAV_ID+' button{min-width:0;justify-content:flex-start;overflow:hidden;padding:9px 10px}#adminBox.sg-v26-mode>.stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));min-width:0}#adminBox.sg-v26-mode>section{min-width:0;max-width:100%}}'+
      '@media(max-width:480px){#'+NAV_ID+' button{font-size:12px}}';
    document.head.appendChild(style);
  }

  function nav() {
    var r = root();
    if (!r) return null;
    var existing = document.getElementById(NAV_ID);
    if (existing && existing.parentElement === r) return existing;
    if (existing) existing.remove();
    var n = document.createElement('nav');
    n.id = NAV_ID;
    n.setAttribute('aria-label', 'Espaces administrateur');
    n.innerHTML = VIEWS.map(function (view) {
      var extra = view[0] === 'customers' ? ' data-sg-customers="1"' : '';
      return '<button type="button" data-v26-view="' + view[0] + '"' + extra + '><span aria-hidden="true">' + view[2] + '</span><b>' + view[1] + '</b></button>';
    }).join('');
    r.insertBefore(n, r.firstElementChild);
    return n;
  }

  function apply(view, scroll) {
    var r = root();
    if (!r || r.classList.contains('hidden')) return;
    var valid = VIEWS.some(function (v) { return v[0] === view; }) ? view : 'overview';
    r.classList.add('sg-v26-mode');
    r.setAttribute('data-v26-workspace', valid);
    try { sessionStorage.setItem(STORAGE_KEY, valid); } catch (_) {}

    var n = nav();
    sections().forEach(function (section) {
      var type = sectionType(section);
      var show = valid === 'overview' || type === valid;
      section.classList.toggle('sg-v26-show', show);
      section.classList.toggle('sg-v26-hide', !show);
    });

    var stats = r.querySelector(':scope > .stats');
    if (stats) stats.style.display = valid === 'overview' ? '' : 'none';
    if (n) $$('#' + NAV_ID + ' [data-v26-view]').forEach(function (button) {
      button.classList.toggle('active', button.getAttribute('data-v26-view') === valid);
    });

    if (scroll) window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }

  function bind() {
    var n = nav();
    if (!n || n.getAttribute('data-bound') === '1') return;
    n.setAttribute('data-bound', '1');
    n.addEventListener('click', function (event) {
      var button = event.target.closest('[data-v26-view]');
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      apply(button.getAttribute('data-v26-view'), true);
    });
  }

  function refreshData(view) {
    if (view === 'products' && typeof window.loadProducts === 'function') window.loadProducts();
    else if (view === 'orders' && typeof window.loadOrders === 'function') window.loadOrders();
    else if (view === 'customers' && typeof window.sngAdminCustomersLoad === 'function') window.sngAdminCustomersLoad();
    else if (view === 'overview' && typeof window.loadAll === 'function') window.loadAll();
  }

  function observe() {
    var r = root();
    if (!r || r.getAttribute('data-v26-observer') === '1' || typeof MutationObserver === 'undefined') return;
    r.setAttribute('data-v26-observer', '1');
    var observer = new MutationObserver(function (records) {
      var addedSection = records.some(function (record) {
        return Array.prototype.some.call(record.addedNodes || [], function (node) {
          return node && node.nodeType === 1 && (node.tagName === 'SECTION' || (node.querySelector && node.querySelector('section')));
        });
      });
      if (!addedSection) return;
      apply(r.getAttribute('data-v26-workspace') || 'overview', false);
    });
    observer.observe(r, { childList: true, subtree: true });
  }

  function boot() {
    var r = root();
    if (!r || r.classList.contains('hidden')) return false;
    installStyles();
    nav();
    bind();
    observe();
    var saved = 'overview';
    try { saved = sessionStorage.getItem(STORAGE_KEY) || 'overview'; } catch (_) {}
    apply(saved, false);
    return true;
  }

  function start() {
    var tries = 0;
    function tick() {
      if (boot()) return;
      tries += 1;
      if (tries < 160) window.setTimeout(tick, 200);
    }
    tick();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
