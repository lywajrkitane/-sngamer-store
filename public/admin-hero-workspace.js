/* SNGAMER STORE ADMIN — HERO WORKSPACE NAVIGATION
   Adds a first-class Hero workspace to the existing admin navigation without
   changing the existing workspace controller or its data logic.
*/
(function () {
  'use strict';

  const NAV_ID = 'sg-admin-v26-nav';
  const ROOT_ID = 'adminBox';
  const BUTTON_ID = 'sg-admin-hero-view';
  const STORAGE_KEY = 'sg_admin_workspace_hero';
  const STYLE_ID = 'sg-admin-hero-nav-style';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const norm = v => String(v || '').replace(/\s+/g, ' ').trim().toLowerCase();

  function root() { return document.getElementById(ROOT_ID); }

  function findHeroSection() {
    const r = root();
    if (!r) return null;
    return $$(':scope > section', r).find(section => {
      const heading = norm(section.querySelector('h1,h2,h3,h4')?.textContent);
      const id = norm(section.id);
      const cls = norm(typeof section.className === 'string' ? section.className : '');
      return /\bhero\b/.test(heading) || /hero/.test(id) || /hero/.test(cls) || /page d'accueil/.test(heading) || /page d’accueil/.test(heading);
    }) || null;
  }

  function injectStyles() {
    if ($('#' + STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${NAV_ID} #${BUTTON_ID}{position:relative;}
      #${NAV_ID} #${BUTTON_ID}::after{
        content:'NOUVEAU';
        margin-left:auto;
        padding:3px 6px;
        border-radius:999px;
        font-size:8px;
        line-height:1;
        font-weight:900;
        letter-spacing:.08em;
        color:#dce7ff;
        background:linear-gradient(90deg,rgba(38,132,255,.30),rgba(230,47,159,.26));
        border:1px solid rgba(100,140,255,.22);
      }
      @media(max-width:760px){#${NAV_ID} #${BUTTON_ID}::after{display:none}}
    `;
    document.head.appendChild(style);
  }

  function addButton() {
    const nav = $('#' + NAV_ID);
    if (!nav || $('#' + BUTTON_ID)) return false;
    const button = document.createElement('button');
    button.type = 'button';
    button.id = BUTTON_ID;
    button.innerHTML = '<span aria-hidden="true">🎯</span> <b>Hero</b>';
    button.title = 'Gérer le Hero de la page d’accueil';
    button.setAttribute('aria-label', 'Gérer le Hero de la page d’accueil');
    const overview = nav.querySelector('[data-v26-view="overview"]');
    if (overview?.nextSibling) nav.insertBefore(button, overview.nextSibling);
    else nav.appendChild(button);
    return true;
  }

  function setActiveButton(active) {
    const nav = $('#' + NAV_ID);
    if (!nav) return;
    nav.querySelectorAll('button').forEach(btn => {
      const isHero = btn.id === BUTTON_ID;
      const isOther = btn.dataset.v26View === active;
      btn.classList.toggle('active', isHero ? active === 'hero' : isOther);
      if (isHero) btn.setAttribute('aria-current', active === 'hero' ? 'page' : 'false');
    });
  }

  function showHero(scroll = true) {
    const r = root();
    const hero = findHeroSection();
    if (!r || !hero) return false;
    r.classList.add('sg-v26-mode');
    r.dataset.v26Workspace = 'hero';
    $$(':scope > section', r).forEach(section => {
      const show = section === hero;
      section.classList.toggle('sg-v26-show', show);
      section.classList.toggle('sg-v26-hide', !show);
    });
    const stats = r.querySelector(':scope > .stats');
    if (stats) stats.style.display = 'none';
    setActiveButton('hero');
    try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch (_) {}
    if (scroll) window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    return true;
  }

  function bind() {
    const nav = $('#' + NAV_ID);
    if (!nav || nav.dataset.heroWorkspaceBound === '1') return false;
    nav.dataset.heroWorkspaceBound = '1';
    nav.addEventListener('click', event => {
      const button = event.target.closest('#' + BUTTON_ID);
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      showHero(true);
    });
    return true;
  }

  function boot() {
    injectStyles();
    addButton();
    bind();
    let shouldRestore = false;
    try { shouldRestore = sessionStorage.getItem(STORAGE_KEY) === '1'; } catch (_) {}
    if (shouldRestore) showHero(false);
    return !!($('#' + NAV_ID) && findHeroSection());
  }

  let tries = 0;
  const timer = setInterval(() => {
    if (boot() || ++tries > 150) clearInterval(timer);
  }, 200);
  if (document.readyState !== 'loading') boot();
  else document.addEventListener('DOMContentLoaded', boot, { once: true });
})();
