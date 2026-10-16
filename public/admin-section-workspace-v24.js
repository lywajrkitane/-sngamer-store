/* SNGAMER STORE — ADMIN V2.4 SECTION WORKSPACE
   Isolates dashboard areas so each section behaves like a real admin page.
*/
(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const KEY = 'sngamer_admin_workspace';
  let current = sessionStorage.getItem(KEY) || 'overview';
  let ready = false;

  const modes = [
    ['overview', 'Vue d’ensemble', '▦'],
    ['products', 'Produits', '📦'],
    ['orders', 'Commandes', '🛒'],
    ['promotions', 'Promotions', '🎉'],
    ['campaigns', 'Campagnes', '📣']
  ];

  function adminBox() { return $('#adminBox'); }

  function sectionType(section) {
    const text = (section.innerText || section.textContent || '').toLowerCase();
    if (section.matches('.promoAdminSection')) return 'promotions';
    if (section.matches('.campaignsSection')) return 'campaigns';
    if (text.includes('gestion des produits')) return 'products';
    if (text.includes('commandes')) return 'orders';
    return null;
  }

  function getSections() {
    const box = adminBox();
    return box ? $$(':scope > section', box) : [];
  }

  function ensureNav() {
    const box = adminBox();
    if (!box || $('#sngWorkspaceNav')) return;
    const nav = document.createElement('nav');
    nav.id = 'sngWorkspaceNav';
    nav.setAttribute('aria-label', 'Navigation du tableau de bord');
    nav.innerHTML = modes.map(([id, label, icon]) =>
      `<button type="button" data-workspace="${id}"><span>${icon}</span><b>${label}</b></button>`
    ).join('');
    box.insertBefore(nav, box.firstElementChild);
    nav.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-workspace]');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      setMode(btn.dataset.workspace, true);
    });
  }

  function ensureStyles() {
    if ($('#sngWorkspaceStyles')) return;
    const style = document.createElement('style');
    style.id = 'sngWorkspaceStyles';
    style.textContent = `
      #sngWorkspaceNav{
        position:sticky;
        top:0;
        z-index:9000;
        display:flex;
        gap:8px;
        overflow-x:auto;
        padding:10px 0 12px;
        margin:0 0 14px;
        scrollbar-width:none;
        background:linear-gradient(180deg,#0d1422 78%,rgba(13,20,34,0));
      }
      #sngWorkspaceNav::-webkit-scrollbar{display:none}
      #sngWorkspaceNav button{
        flex:0 0 auto;
        min-height:42px;
        padding:10px 15px;
        border-radius:13px;
        border:1px solid rgba(255,255,255,.08);
        background:#101a29;
        color:#aebbd0;
        font-size:14px;
        font-weight:800;
        white-space:nowrap;
      }
      #sngWorkspaceNav button span{margin-right:6px}
      #sngWorkspaceNav button.active{
        color:#fff;
        border-color:transparent;
        background:linear-gradient(135deg,#197cff,#7b32ff);
        box-shadow:0 8px 24px rgba(60,80,255,.22);
      }
      #adminBox.sng-workspace-mode > section.sng-workspace-hidden,
      #adminBox.sng-workspace-mode > .sng-workspace-hidden{
        display:none !important;
      }
      #adminBox.sng-workspace-mode > section.sng-workspace-visible{
        display:block !important;
      }
      #adminBox.sng-workspace-mode > .sng-workspace-overview-hidden{
        display:none !important;
      }
      #adminBox.sng-workspace-mode[data-workspace="overview"] > section,
      #adminBox.sng-workspace-mode[data-workspace="overview"] > .sng-workspace-overview-hidden{
        display:block;
      }
      #adminBox.sng-workspace-mode[data-workspace="overview"] #sngWorkspaceNav{
        margin-bottom:14px;
      }
      @media(max-width:700px){
        #sngWorkspaceNav{padding:8px 0 11px;margin-bottom:10px}
        #sngWorkspaceNav button{min-height:40px;padding:9px 12px;font-size:13px}
      }
    `;
    document.head.appendChild(style);
  }

  function findOverviewElements() {
    const box = adminBox();
    if (!box) return [];
    return Array.from(box.children).filter(el => el.id !== 'sngWorkspaceNav' && !el.matches('section'));
  }

  function setMode(mode, scrollTop) {
    const box = adminBox();
    if (!box) return;
    current = modes.some(m => m[0] === mode) ? mode : 'overview';
    sessionStorage.setItem(KEY, current);
    box.dataset.workspace = current;
    box.classList.add('sng-workspace-mode');

    ensureStyles();
    ensureNav();

    const nav = $('#sngWorkspaceNav');
    if (nav) $$('#sngWorkspaceNav button').forEach(b => b.classList.toggle('active', b.dataset.workspace === current));

    getSections().forEach(section => {
      const type = sectionType(section);
      let visible = current === 'overview';
      if (current === 'products') visible = type === 'products';
      if (current === 'orders') visible = type === 'orders';
      if (current === 'promotions') visible = type === 'promotions' || type === 'campaigns';
      if (current === 'campaigns') visible = type === 'campaigns';
      section.classList.toggle('sng-workspace-visible', visible);
      section.classList.toggle('sng-workspace-hidden', !visible);
    });

    findOverviewElements().forEach(el => {
      el.classList.toggle('sng-workspace-overview-hidden', current !== 'overview');
    });

    if (scrollTop) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function interceptLegacyTabs() {
    document.addEventListener('click', function (e) {
      if (e.target.closest('#sngWorkspaceNav')) return;
      const target = e.target.closest('button, a, [role="button"]');
      if (!target) return;
      const text = (target.innerText || target.textContent || '').trim().toLowerCase();
      let mode = null;
      if (text === 'vue d’ensemble' || text === "vue d'ensemble" || text.includes('vue d’ensemble')) mode = 'overview';
      else if (text === 'produits' || text.includes('gérer les produits')) mode = 'products';
      else if (text === 'commandes' || text.includes('voir les commandes')) mode = 'orders';
      else if (text === 'promotions') mode = 'promotions';
      else if (text === 'campagnes' || text.includes('campagnes & promotions')) mode = 'campaigns';
      if (!mode) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      setMode(mode, true);
    }, true);
  }

  function boot() {
    const box = adminBox();
    if (!box || box.classList.contains('hidden')) return;
    ensureStyles();
    ensureNav();
    setMode(current, false);
    if (!ready) {
      ready = true;
      interceptLegacyTabs();
    }
  }

  function watch() {
    let tries = 0;
    const timer = setInterval(() => {
      tries++;
      if (adminBox() && !adminBox().classList.contains('hidden')) {
        boot();
        if (getSections().length >= 4) clearInterval(timer);
      }
      if (tries > 80) clearInterval(timer);
    }, 250);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch, { once: true });
  else watch();
})();
