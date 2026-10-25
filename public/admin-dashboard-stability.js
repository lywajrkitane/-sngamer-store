/* SNGAMER STORE — canonical dashboard stability layer
   Keeps business logic untouched. Restores only the admin workspace shell
   and KPI rendering when legacy dashboard scripts fail or load out of order.
*/
(function () {
  'use strict';
  if (window.__sngCanonicalDashboardStability) return;
  window.__sngCanonicalDashboardStability = true;

  const NAV_ID = 'sg-admin-v26-nav';
  const WORKSPACE_KEY = 'sg_admin_workspace_v26';
  const VIEWS = [
    ['overview', "Vue d'ensemble", '▦'],
    ['hero', 'Hero', '🎯'],
    ['products', 'Produits', '📦'],
    ['orders', 'Commandes', '🛒'],
    ['promotions', 'Promotions', '🎉'],
    ['campaigns', 'Campagnes', '📣'],
    ['customers', 'Clients', '👥']
  ];

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const norm = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  const root = () => $('#adminBox');
  const visible = () => { const r = root(); return !!r && !r.classList.contains('hidden'); };

  function typeOf(section) {
    const heading = norm(section.querySelector('h1,h2,h3,h4')?.textContent);
    const id = norm(section.id);
    const cls = norm(typeof section.className === 'string' ? section.className : '');
    const text = norm(section.textContent).slice(0, 500);
    if (id === 'sgcustomersection' || cls.includes('sgcustomersection') || (/clients?/.test(heading) && /comptes?/.test(text))) return 'customers';
    if (/\bhero\b/.test(heading) || /hero/.test(id) || /heroworkspace/.test(cls)) return 'hero';
    if (/campagnes?/.test(heading) || /campaign/.test(id) || cls.includes('campaignssection')) return 'campaigns';
    if (/promotions?/.test(heading) || /promotion/.test(id) || cls.includes('promoadminsection')) return 'promotions';
    if (/gestion des produits|produits?|stock/.test(heading) || /products?/.test(id)) return 'products';
    if (/commandes?|orders?/.test(heading) || /orders?/.test(id)) return 'orders';
    if (/activite de la boutique|activite|vue d'ensemble|aperçu|overview/.test(heading)) return 'overview';
    return 'other';
  }

  function sections() {
    const r = root();
    return r ? $$(':scope > section', r) : [];
  }

  function installStyle() {
    if ($('#sg-canonical-dashboard-stability-style')) return;
    const s = document.createElement('style');
    s.id = 'sg-canonical-dashboard-stability-style';
    s.textContent = `
      #${NAV_ID}{position:relative;z-index:20;display:flex;gap:8px;align-items:stretch;margin:0 0 18px;padding:9px;border:1px solid rgba(115,145,190,.16);border-radius:18px;background:linear-gradient(180deg,rgba(12,21,36,.96),rgba(7,13,23,.96));box-shadow:0 18px 55px rgba(0,0,0,.22)}
      #${NAV_ID} button{border:1px solid transparent;background:transparent;color:#8f9db3;border-radius:12px;padding:11px 13px;min-height:45px;font-weight:800;cursor:pointer;display:flex;align-items:center;gap:9px}
      #${NAV_ID} button:hover{color:#fff;background:rgba(48,76,120,.18)}
      #${NAV_ID} button.active{color:#fff;background:linear-gradient(135deg,#207eff,#6939ff);border-color:rgba(92,116,255,.30)}
      #${NAV_ID} button span{font-size:17px;width:22px;text-align:center}
      #${NAV_ID} button b{font-weight:800;white-space:nowrap}
      #adminBox.sg-v26-mode{display:block!important;min-width:0!important}
      #adminBox.sg-v26-mode > section{min-width:0!important}
      #adminBox.sg-v26-mode > section.sg-v26-hide{display:none!important}
      #adminBox.sg-v26-mode > section.sg-v26-show{display:block!important}
      @media(min-width:900px){
        #adminBox.sg-v26-mode{display:grid!important;grid-template-columns:220px minmax(0,1fr)!important;column-gap:22px!important;align-items:start!important}
        #adminBox.sg-v26-mode > #${NAV_ID}{grid-column:1;grid-row:1 / span 100;position:sticky;top:88px;display:flex;flex-direction:column;margin:0}
        #adminBox.sg-v26-mode > .stats,#adminBox.sg-v26-mode > section{grid-column:2;min-width:0}
      }
      @media(max-width:899px){
        #${NAV_ID}{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-bottom:14px}
        #${NAV_ID}::before{content:'SNGAMER STORE';grid-column:1/-1;padding:4px 7px 7px;color:#8ea4c5;font-size:10px;font-weight:900;letter-spacing:.18em}
        #${NAV_ID} button{width:100%;min-width:0;justify-content:flex-start;padding:9px 10px;overflow:hidden}
      }
      @media(max-width:480px){#${NAV_ID} button{font-size:12px}}
    `;
    document.head.appendChild(s);
  }

  function nav() {
    const r = root();
    if (!r) return null;
    let n = $('#' + NAV_ID, r);
    if (n) return n;
    n = document.createElement('nav');
    n.id = NAV_ID;
    n.setAttribute('aria-label', 'Espaces administrateur');
    n.innerHTML = VIEWS.map(([id, label, icon]) => `<button type="button" data-v26-view="${id}"><span aria-hidden="true">${icon}</span><b>${label}</b></button>`).join('');
    r.insertBefore(n, r.firstElementChild);
    return n;
  }

  function apply(view, scroll) {
    const r = root();
    if (!r || !visible()) return;
    const valid = VIEWS.some(v => v[0] === view) ? view : 'overview';
    r.classList.add('sg-v26-mode');
    r.dataset.v26Workspace = valid;
    try { sessionStorage.setItem(WORKSPACE_KEY, valid); } catch (_) {}
    sections().forEach(section => {
      const type = typeOf(section);
      const show = valid === 'overview' ? (type === 'overview') : type === valid;
      section.classList.toggle('sg-v26-show', show);
      section.classList.toggle('sg-v26-hide', !show);
    });
    const stats = r.querySelector(':scope > .stats');
    if (stats) stats.style.display = valid === 'overview' ? 'grid' : 'none';
    const n = nav();
    if (n) n.querySelectorAll('[data-v26-view]').forEach(b => b.classList.toggle('active', b.dataset.v26View === valid));
    if (scroll) window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }

  function bindNav() {
    const n = nav();
    if (!n || n.dataset.sngCanonicalBound === '1') return;
    n.dataset.sngCanonicalBound = '1';
    n.addEventListener('click', e => {
      const b = e.target.closest('[data-v26-view]');
      if (!b) return;
      e.preventDefault();
      e.stopPropagation();
      apply(b.dataset.v26View, true);
    });
  }

  async function refreshStats() {
    if (!visible()) return;
    try {
      const [productsResponse, ordersResponse] = await Promise.all([
        fetch('/api/products', { credentials: 'same-origin', cache: 'no-store' }),
        fetch('/api/admin/orders', { credentials: 'same-origin', cache: 'no-store' })
      ]);
      if (!productsResponse.ok || !ordersResponse.ok) return;
      const productsData = await productsResponse.json();
      const ordersData = await ordersResponse.json();
      const products = Array.isArray(productsData) ? productsData : (productsData?.products || []);
      const orders = Array.isArray(ordersData) ? ordersData : (ordersData?.orders || []);
      const money = n => new Intl.NumberFormat('fr-FR').format(Math.round(Number(n || 0))) + ' FCFA';
      const paid = orders.filter(o => {
        const paymentStatus = norm(o.payment_status);
        const refundStatus = norm(o.refund_status);
        if (refundStatus === 'rembourse' || refundStatus === 'remboursement') return false;
        if (paymentStatus) return paymentStatus === 'paye';
        return norm(o.status) !== 'paiement expire' && norm(o.status) !== 'annulee';
      });
      const byStatus = status => orders.filter(o => norm(o.status) === norm(status)).length;
      const set = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = String(value); };
      set('productCount', products.length);
      set('orderCount', orders.length);
      set('revenue', money(paid.reduce((sum, o) => sum + Number(o.total || 0), 0)));
      set('newOrderCount', byStatus('Nouvelle'));
      set('confirmedOrderCount', byStatus('Confirmée'));
      set('preparedOrderCount', byStatus('En préparation'));
      set('shippedOrderCount', byStatus('Expédiée'));
      set('deliveredOrderCount', byStatus('Livrée'));
      set('cancelledOrderCount', byStatus('Annulée'));
    } catch (error) {
      console.debug('SNGAMER canonical dashboard stats refresh skipped:', error?.message || error);
    }
  }

  function boot() {
    const r = root();
    if (!r) return false;
    installStyle();
    nav();
    bindNav();
    if (visible()) {
      let saved = 'overview';
      try { saved = sessionStorage.getItem(WORKSPACE_KEY) || 'overview'; } catch (_) {}
      apply(saved, false);
      refreshStats();
    }
    return true;
  }

  function start() {
    let tries = 0;
    const tick = () => {
      if (boot() || ++tries > 120) return;
      setTimeout(tick, 250);
    };
    tick();
    setInterval(() => { if (visible()) refreshStats(); }, 30000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
