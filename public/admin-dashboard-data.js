/* SNGAMER STORE — canonical dashboard data bridge.
   One authenticated endpoint feeds the overview counters and recap table.
   It is intentionally independent from the legacy admin loaders so a failed
   presentation panel cannot leave the whole dashboard at zero.
*/
(function () {
  'use strict';
  const STATE = '__sngCanonicalDashboardDataV1';
  if (window[STATE]) return;
  window[STATE] = true;

  const $ = id => document.getElementById(id);
  const money = value => `${new Intl.NumberFormat('fr-FR').format(Number(value || 0))} FCFA`;

  function setText(id, value) {
    const el = $(id);
    if (el) el.textContent = value;
  }

  function isAdminVisible() {
    const box = $('adminBox');
    return !!box && !box.classList.contains('hidden');
  }

  function ensureStyles() {
    if ($('sg-dashboard-recap-style')) return;
    const style = document.createElement('style');
    style.id = 'sg-dashboard-recap-style';
    style.textContent = `
      #sg-dashboard-recap{display:block!important;margin:0 0 20px!important;background:#111820;border:1px solid #26313d;border-radius:14px;padding:18px;box-sizing:border-box}
      #sg-dashboard-recap h2{margin:0 0 14px;font-size:20px}
      .sg-recap-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin-bottom:12px}
      .sg-recap-card{background:#0b0f14;border:1px solid #26313d;border-radius:11px;padding:12px;min-width:0}
      .sg-recap-card span{display:block;color:#8f9db3;font-size:10px;text-transform:uppercase;font-weight:800}
      .sg-recap-card b{display:block;margin-top:5px;color:#fff;font-size:17px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .sg-recap-table-wrap{overflow-x:auto}.sg-recap-table{width:100%;min-width:320px;border-collapse:collapse}.sg-recap-table th,.sg-recap-table td{text-align:left;padding:9px 7px;border-bottom:1px solid #26313d}.sg-recap-table th{color:#71829a;font-size:10px;text-transform:uppercase}.sg-recap-table td:last-child,.sg-recap-table th:last-child{text-align:right;font-weight:800}
      .sg-recap-state{margin-top:10px;color:#71829a;font-size:11px}.sg-recap-state.sg-ok{color:#86efac}.sg-recap-state.sg-error{color:#ff8795}
      @media(max-width:700px){#sg-dashboard-recap{padding:14px}.sg-recap-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    `;
    document.head.appendChild(style);
  }

  function ensureOverview() {
    ensureStyles();
    const box = $('adminBox');
    const stats = box?.querySelector(':scope > .stats');
    if (!box || !stats || $('sg-dashboard-recap')) return;

    const section = document.createElement('section');
    section.id = 'sg-dashboard-recap';
    section.innerHTML = `
      <h2>📊 Tableau récapitulatif</h2>
      <div class="sg-recap-grid">
        <div class="sg-recap-card"><span>Produits</span><b data-recap="products">—</b></div>
        <div class="sg-recap-card"><span>Commandes</span><b data-recap="orders">—</b></div>
        <div class="sg-recap-card"><span>Chiffre d'affaires</span><b data-recap="revenue">—</b></div>
        <div class="sg-recap-card"><span>Clients</span><b data-recap="customers">—</b></div>
      </div>
      <div class="sg-recap-table-wrap">
        <table class="sg-recap-table"><thead><tr><th>Statut</th><th>Nombre</th></tr></thead>
        <tbody>
          <tr><td>🆕 Nouvelles</td><td data-recap="new_orders">—</td></tr>
          <tr><td>✅ Confirmées</td><td data-recap="confirmed_orders">—</td></tr>
          <tr><td>🟣 En préparation</td><td data-recap="prepared_orders">—</td></tr>
          <tr><td>🚚 Expédiées</td><td data-recap="shipped_orders">—</td></tr>
          <tr><td>📦 Livrées</td><td data-recap="delivered_orders">—</td></tr>
          <tr><td>❌ Annulées</td><td data-recap="cancelled_orders">—</td></tr>
        </tbody></table>
      </div>
      <div class="sg-recap-state" data-recap-state>Chargement des données…</div>`;

    box.insertBefore(section, stats.nextSibling);
  }

  function update(data) {
    ensureOverview();
    const values = {
      products: data.products,
      orders: data.orders,
      revenue: money(data.revenue),
      customers: data.customers,
      new_orders: data.new_orders,
      confirmed_orders: data.confirmed_orders,
      prepared_orders: data.prepared_orders,
      shipped_orders: data.shipped_orders,
      delivered_orders: data.delivered_orders,
      cancelled_orders: data.cancelled_orders
    };
    Object.keys(values).forEach(key => {
      document.querySelectorAll(`[data-recap="${key}"]`).forEach(el => el.textContent = values[key]);
    });

    setText('productCount', data.products);
    setText('orderCount', data.orders);
    setText('revenue', money(data.revenue));
    setText('newOrderCount', data.new_orders);
    setText('confirmedOrderCount', data.confirmed_orders);
    setText('preparedOrderCount', data.prepared_orders);
    setText('shippedOrderCount', data.shipped_orders);
    setText('deliveredOrderCount', data.delivered_orders);
    setText('cancelledOrderCount', data.cancelled_orders);

    const state = document.querySelector('[data-recap-state]');
    if (state) { state.textContent = `Dernière synchronisation : ${new Date().toLocaleTimeString('fr-FR')}`; state.className = 'sg-recap-state sg-ok'; }
  }

  async function fetchSummary() {
    if (!isAdminVisible()) return false;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch('/api/admin/dashboard-summary', { credentials: 'same-origin', cache: 'no-store', signal: controller.signal });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
      update(data);
      return true;
    } catch (error) {
      ensureOverview();
      const state = document.querySelector('[data-recap-state]');
      if (state) { state.textContent = `Synchronisation impossible : ${error.message || 'erreur réseau'}`; state.className = 'sg-recap-state sg-error'; }
      console.error('SNGAMER_CANONICAL_DASHBOARD_ERROR:', error);
      return false;
    } finally { clearTimeout(timer); }
  }

  let authObserver = null;
  function startSummaryRefresh() {
    if (!isAdminVisible()) return;
    ensureOverview();
    fetchSummary();
    if (!window.__sngCanonicalDashboardTimer) {
      window.__sngCanonicalDashboardTimer = setInterval(() => {
        if (isAdminVisible()) fetchSummary();
      }, 60000);
    }
  }
  function boot() {
    ensureOverview();
    const box = $('adminBox');
    if (!box) return;
    if (isAdminVisible()) {
      startSummaryRefresh();
      return;
    }
    if (!authObserver && typeof MutationObserver !== 'undefined') {
      authObserver = new MutationObserver(() => {
        if (isAdminVisible()) {
          authObserver.disconnect();
          authObserver = null;
          startSummaryRefresh();
        }
      });
      authObserver.observe(box, { attributes: true, attributeFilter: ['class'] });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && isAdminVisible()) fetchSummary();
  });
  window.addEventListener('focus', () => { if (isAdminVisible()) fetchSummary(); });
  window.SNGAMER_CANONICAL_DASHBOARD_REFRESH = fetchSummary;
})();
