/* SNGAMER STORE — canonical full-dashboard workspace controller.
   Existing modules stay in their original source files. This controller only
   waits for administrator authentication and switches the seven workspaces.
*/
(function () {
  'use strict';
  var NAV_ID = 'sg-admin-v26-nav';
  var ROOT_ID = 'adminBox';
  var STORAGE_KEY = 'sg_admin_workspace_v26';
  var VIEWS = ['overview','hero','products','orders','promotions','campaigns','customers'];
  var authObserver = null;
  var sectionObserver = null;
  function root() { return document.getElementById(ROOT_ID); }
  function navElement() {
    var r = root(), nav = document.getElementById(NAV_ID);
    return r && nav && nav.parentElement === r ? nav : null;
  }
  function visible() {
    var r = root();
    return !!r && !r.classList.contains('hidden');
  }
  function installVisibilityGuard() {
    if (document.getElementById('sg-admin-auth-visibility-guard')) return;
    var style = document.createElement('style');
    style.id = 'sg-admin-auth-visibility-guard';
    style.textContent = 'html body #adminBox.hidden{display:none!important}';
    (document.head || document.documentElement).appendChild(style);
  }
  function norm(value) {
    return String(value || '').normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  }
  function sectionType(section) {
    var id = norm(section.id);
    var cls = typeof section.className === 'string' ? section.className : '';
    var headingNode = section.querySelector('h1,h2,h3,h4');
    var heading = norm(headingNode ? headingNode.textContent : '');
    if (id === 'sg-dashboard-recap') return 'overview';
    if (id === 'sngherodashboardeditor' || id.indexOf('hero') !== -1 || /\bhero\b/.test(heading)) return 'hero';
    if (id === 'sgcustomersection' || /sgcustomersection/i.test(cls)) return 'customers';
    if (section.matches('.promoAdminSection')) return 'promotions';
    if (section.matches('.campaignsSection')) return 'campaigns';
    if (section.querySelector('#productsTable') || heading.indexOf('gestion des produits') !== -1) return 'products';
    if (section.querySelector('#ordersTable') || heading === 'commandes') return 'orders';
    if (/page d'accueil|page d’accueil/.test(heading)) return 'hero';
    return 'other';
  }
  function directSections(r) {
    return Array.prototype.filter.call(r.children || [], function (child) {
      return child && child.tagName === 'SECTION';
    });
  }
  function setView(view, shouldScroll) {
    var r = root(), nav = navElement();
    if (!r || !nav || !visible()) return false;
    var selected = VIEWS.indexOf(view) !== -1 ? view : 'overview';
    var overview = selected === 'overview';
    r.classList.add('sg-v26-mode');
    r.setAttribute('data-v26-workspace', selected);
    directSections(r).forEach(function (section) {
      var show = sectionType(section) === selected;
      section.classList.toggle('sg-v26-show', show);
      section.classList.toggle('sg-v26-hide', !show);
      section.setAttribute('aria-hidden', show ? 'false' : 'true');
    });
    var stats = r.querySelector(':scope > .stats');
    if (stats) {
      if (overview) stats.style.removeProperty('display');
      else stats.style.setProperty('display', 'none', 'important');
    }
    Array.prototype.forEach.call(nav.querySelectorAll('[data-v26-view]'), function (button) {
      var active = button.getAttribute('data-v26-view') === selected;
      button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    try { sessionStorage.setItem(STORAGE_KEY, selected); } catch (_) {}
    nav.setAttribute('data-workspace-controller', 'ready');
    if (shouldScroll && selected === 'customers' && typeof window.sngAdminCustomersLoad === 'function') {
      try { window.sngAdminCustomersLoad(); } catch (_) {}
    }
    if (shouldScroll) window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    return true;
  }
  function bindNav(nav) {
    if (!nav || nav.getAttribute('data-bound') === '1') return;
    nav.setAttribute('data-bound', '1');
    nav.addEventListener('click', function (event) {
      var target = event.target;
      var button = target && target.closest ? target.closest('[data-v26-view]') : null;
      if (!button || !nav.contains(button)) return;
      event.preventDefault();
      event.stopPropagation();
      setView(button.getAttribute('data-v26-view'), true);
    });
  }
  function observeSections() {
    var r = root();
    if (!r || sectionObserver || typeof MutationObserver === 'undefined') return;
    sectionObserver = new MutationObserver(function (records) {
      var addedSection = records.some(function (record) {
        return Array.prototype.some.call(record.addedNodes || [], function (node) {
          return node && node.nodeType === 1 &&
            (node.tagName === 'SECTION' || (node.querySelector && node.querySelector('section')));
        });
      });
      if (addedSection && visible()) setView(r.getAttribute('data-v26-workspace') || 'overview', false);
    });
    sectionObserver.observe(r, { childList: true, subtree: true });
  }
  function boot() {
    installVisibilityGuard();
    var r = root(), nav = navElement();
    if (!r || !nav || !visible()) return false;
    bindNav(nav);
    observeSections();
    var saved = 'overview';
    try { saved = sessionStorage.getItem(STORAGE_KEY) || 'overview'; } catch (_) {}
    setView(saved, false);
    return true;
  }
  function start() {
    installVisibilityGuard();
    var r = root();
    if (!r) { window.setTimeout(start, 150); return; }
    if (!visible()) {
      if (!authObserver && typeof MutationObserver !== 'undefined') {
        authObserver = new MutationObserver(function () {
          if (visible()) {
            authObserver.disconnect();
            authObserver = null;
            boot();
          }
        });
        authObserver.observe(r, { attributes: true, attributeFilter: ['class'] });
      }
      return;
    }
    boot();
  }
  window.SNGAMER_ADMIN_WORKSPACE_BOOT = boot;
  window.SNGAMER_ADMIN_WORKSPACE_SET_VIEW = setView;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
