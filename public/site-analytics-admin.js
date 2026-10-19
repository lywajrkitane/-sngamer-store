(() => {
  'use strict';

  const STYLE = 'sg-site-analytics-style';
  const PANEL = 'sg-site-analytics-panel';

  function addStyles() {
    if (document.getElementById(STYLE)) return;
    const s = document.createElement('style');
    s.id = STYLE;
    s.textContent = `
      #adminBox > .stats{display:grid!important;grid-template-columns:repeat(6,minmax(0,1fr))!important;gap:10px!important;margin-bottom:20px!important}
      #adminBox > .stats > .stat{grid-column:auto!important;min-width:0!important;min-height:74px!important;padding:12px 13px!important;border-radius:15px!important;display:flex!important;flex-direction:column!important;justify-content:center!important}
      #adminBox > .stats > .stat:nth-child(1),#adminBox > .stats > .stat:nth-child(2),#adminBox > .stats > .stat:nth-child(3){grid-column:span 2!important;min-height:92px!important;padding:15px!important}
      #adminBox > .stats > .stat:nth-child(1) strong,#adminBox > .stats > .stat:nth-child(2) strong,#adminBox > .stats > .stat:nth-child(3) strong{font-size:24px!important;margin-top:7px!important;line-height:1.1!important}
      #adminBox > .stats > .stat:nth-child(n+4):not(#${PANEL}){grid-column:span 1!important;min-height:68px!important}
      #adminBox > .stats > .stat:nth-child(n+4):not(#${PANEL}) strong{font-size:20px!important;margin-top:5px!important;line-height:1!important}
      #${PANEL}{grid-column:1/-1!important;display:block!important;margin:2px 0 0!important;padding:16px!important;border:1px solid rgba(115,145,190,.16);border-radius:18px;background:linear-gradient(145deg,rgba(14,25,43,.98),rgba(8,15,27,.98));box-shadow:0 10px 32px rgba(0,0,0,.2);order:99!important}
      .sg-analytics-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}
      .sg-analytics-title{font-size:19px;font-weight:900;color:#f7f9ff}
      .sg-analytics-sub{font-size:11px;color:#8f9db3;margin-top:4px}
      .sg-analytics-refresh{border:0;border-radius:10px;padding:9px 12px;background:#26313d;color:#fff;font-weight:700;cursor:pointer;white-space:nowrap}
      .sg-analytics-refresh:active{transform:scale(.98)}
      .sg-analytics-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
      .sg-analytics-card{padding:12px;border:1px solid rgba(115,145,190,.14);border-radius:13px;background:linear-gradient(145deg,#101b28,#0c141e);min-width:0}
      .sg-analytics-card--highlight{background:linear-gradient(145deg,#111f36,#0c1626);border-color:rgba(67,110,255,.24)}
      .sg-analytics-label{font-size:10px;color:#8f9db3;font-weight:800;text-transform:uppercase;letter-spacing:.06em}
      .sg-analytics-value{margin-top:6px;font-size:21px;font-weight:900;color:#fff;overflow-wrap:anywhere}
      .sg-analytics-chart{margin-top:12px;padding:12px;border:1px solid rgba(115,145,190,.14);border-radius:13px;background:rgba(7,13,23,.82);overflow:hidden}
      .sg-chart-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}
      .sg-chart-note{font-size:9px;color:#667891;text-transform:none;font-weight:600;letter-spacing:0}
      .sg-bars{display:flex;align-items:flex-end;gap:4px;height:112px;width:100%;padding-top:6px;touch-action:pan-y}
      .sg-bar-wrap{height:100%;flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:5px;min-width:0;cursor:pointer;position:relative}
      .sg-bar{width:100%;max-width:16px;border-radius:5px 5px 2px 2px;background:linear-gradient(180deg,#2684ff,#7545ff,#e62f9f);min-height:2px;transition:transform .15s,filter .15s}
      .sg-bar-wrap:hover .sg-bar,.sg-bar-wrap.is-selected .sg-bar{transform:scaleX(1.18);filter:brightness(1.15)}
      .sg-bar-label{font-size:8px;color:#72829a;white-space:nowrap;min-height:10px}
      .sg-sales-bar{background:linear-gradient(180deg,#39b6ff,#2d6bff)}
      .sg-sales-value{font-size:7px;color:#8797ae;white-space:nowrap;min-height:9px;overflow:hidden;text-overflow:ellipsis;max-width:100%}
      .sg-chart-detail{margin-top:9px;padding:9px 10px;border:1px solid rgba(67,110,255,.2);border-radius:10px;background:rgba(17,31,54,.72);color:#dfe7f7;font-size:10px;line-height:1.45;min-height:16px}
      .sg-chart-detail strong{color:#fff;font-size:11px}
      .sg-analytics-legend{display:flex;gap:12px;margin-top:9px;font-size:9px;color:#72829a;flex-wrap:wrap}
      .sg-legend-dot{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:4px;background:#2684ff}
      .sg-analytics-error{color:#ff7777;font-size:13px;padding:8px 0}
      @media(max-width:900px){
        #adminBox > .stats{grid-template-columns:repeat(6,minmax(0,1fr))!important}
        #adminBox > .stats > .stat:nth-child(1),#adminBox > .stats > .stat:nth-child(2),#adminBox > .stats > .stat:nth-child(3){grid-column:span 2!important}
        #adminBox > .stats > .stat:nth-child(n+4):not(#${PANEL}){grid-column:span 1!important}
        .sg-analytics-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
      }
      @media(max-width:600px){
        #adminBox > .stats{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}
        #adminBox > .stats > .stat:nth-child(1),#adminBox > .stats > .stat:nth-child(2),#adminBox > .stats > .stat:nth-child(3){grid-column:span 1!important;min-height:82px!important}
        #adminBox > .stats > .stat:nth-child(n+4):not(#${PANEL}){grid-column:span 1!important;min-height:62px!important;padding:9px 10px!important}
        #adminBox > .stats > .stat:nth-child(1) strong,#adminBox > .stats > .stat:nth-child(2) strong,#adminBox > .stats > .stat:nth-child(3) strong{font-size:20px!important}
        #adminBox > .stats > .stat:nth-child(n+4):not(#${PANEL}) strong{font-size:17px!important}
        .sg-analytics-grid{grid-template-columns:1fr 1fr;gap:8px}
        .sg-analytics-card{padding:10px}
        .sg-analytics-value{font-size:18px}
        .sg-analytics-head{align-items:flex-start}
        .sg-analytics-title{font-size:17px}
        .sg-analytics-refresh{padding:8px 10px}
        .sg-bars{height:100px;gap:2px}
        .sg-bar{max-width:10px}
        .sg-bar-label{font-size:7px}
        .sg-chart-note{display:none}
        .sg-chart-detail{font-size:10px}
      }
      @media(max-width:360px){.sg-analytics-grid{grid-template-columns:1fr}.sg-analytics-refresh{font-size:12px}}
    `;
    document.head.appendChild(s);
  }

  const fmt = n => new Intl.NumberFormat('fr-FR').format(Number(n || 0));
  const fmtMoney = n => `${fmt(n)} FCFA`;
  const fmtPct = n => `${Number(n || 0).toLocaleString('fr-FR',{maximumFractionDigits:1})}%`;

  function ensurePanel() {
    let panel = document.getElementById(PANEL);
    if (panel) return panel;
    const box = document.getElementById('adminBox');
    const stats = box && box.querySelector(':scope > .stats');
    if (!box || !stats || box.classList.contains('hidden')) return null;
    panel = document.createElement('div');
    panel.id = PANEL;
    stats.appendChild(panel);
    return panel;
  }

  function normalizeDays(days, salesDays) {
    const visits = new Map((Array.isArray(days) ? days : []).map(x => [String(x.date), x]));
    const sales = new Map((Array.isArray(salesDays) ? salesDays : []).map(x => [String(x.date), x]));
    const keys = new Set([...visits.keys(), ...sales.keys()]);
    return Array.from(keys).sort().slice(-30).map(date => ({
      date,
      visits: Number(visits.get(date)?.visits || 0),
      visitors: Number(visits.get(date)?.visitors || 0),
      orders: Number(sales.get(date)?.orders || 0),
      revenue: Number(sales.get(date)?.revenue || 0)
    }));
  }

  function chartBars(items, valueKey, barClass, formatter, tooltipExtra, detailId) {
    const max = Math.max(1, ...items.map(x => Number(x[valueKey] || 0)));
    return items.map((x, i) => {
      const value = Number(x[valueKey] || 0);
      const height = Math.max(2, Math.round((value / max) * 86));
      const showLabel = i === 0 || i === items.length - 1 || i % 5 === 0;
      const extra = tooltipExtra ? ` · ${tooltipExtra(x)}` : '';
      const title = `${x.date}: ${formatter(value)}${extra}`;
      const detail = `${x.date} · ${formatter(value)}${extra}`;
      return `<div class="sg-bar-wrap" role="button" tabindex="0" aria-label="${title.replace(/"/g, '&quot;')}" data-chart-detail="${detail.replace(/"/g, '&quot;')}" data-chart-id="${detailId}"><div class="sg-bar ${barClass || ''}" style="height:${height}px"></div><div class="sg-bar-label">${showLabel ? String(x.date).slice(5) : ''}</div></div>`;
    }).join('');
  }

  function bindChartInteractions(panel) {
    panel.querySelectorAll('.sg-bar-wrap').forEach(bar => {
      const select = () => {
        const id = bar.dataset.chartId;
        const detail = panel.querySelector(`[data-detail-for="${id}"]`);
        if (!detail) return;
        panel.querySelectorAll('.sg-bar-wrap.is-selected').forEach(x => x.classList.remove('is-selected'));
        bar.classList.add('is-selected');
        detail.innerHTML = `<strong>${bar.dataset.chartDetail}</strong>`;
      };
      bar.addEventListener('click', select);
      bar.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(); }
      });
    });
  }

  function render(data) {
    addStyles();
    const panel = ensurePanel();
    if (!panel) return;

    const items = normalizeDays(data.days, data.sales_days);
    const visitBars = chartBars(items, 'visits', '', v => `${fmt(v)} visites`, x => `${fmt(x.visitors)} visiteurs`, 'visits');
    const salesBars = chartBars(items, 'revenue', 'sg-sales-bar', v => fmtMoney(v), x => `${fmt(x.orders)} commande${x.orders > 1 ? 's' : ''}`, 'sales');

    panel.innerHTML = `
      <div class="sg-analytics-head">
        <div><div class="sg-analytics-title">📊 Activité de la boutique</div><div class="sg-analytics-sub">Visiteurs, ventes et performance commerciale en un coup d'œil</div></div>
        <button type="button" class="sg-analytics-refresh" id="sgAnalyticsRefresh">Actualiser</button>
      </div>
      <div class="sg-analytics-grid">
        <div class="sg-analytics-card"><div class="sg-analytics-label">Visiteurs aujourd'hui</div><div class="sg-analytics-value">${fmt(data.visitors_today)}</div></div>
        <div class="sg-analytics-card"><div class="sg-analytics-label">Visites aujourd'hui</div><div class="sg-analytics-value">${fmt(data.visits_today)}</div></div>
        <div class="sg-analytics-card"><div class="sg-analytics-label">Visiteurs · 7 jours</div><div class="sg-analytics-value">${fmt(data.visitors_7d)}</div></div>
        <div class="sg-analytics-card"><div class="sg-analytics-label">Visiteurs · 30 jours</div><div class="sg-analytics-value">${fmt(data.visitors_30d)}</div></div>
        <div class="sg-analytics-card"><div class="sg-analytics-label">Commandes payées</div><div class="sg-analytics-value">${fmt(data.orders)}</div></div>
        <div class="sg-analytics-card"><div class="sg-analytics-label">Commandes payées aujourd'hui</div><div class="sg-analytics-value">${fmt(data.orders_today)}</div></div>
        <div class="sg-analytics-card"><div class="sg-analytics-label">CA encaissé aujourd'hui</div><div class="sg-analytics-value">${fmtMoney(data.revenue_today)}</div></div>
        <div class="sg-analytics-card"><div class="sg-analytics-label">Visites totales</div><div class="sg-analytics-value">${fmt(data.visits)}</div></div>
        <div class="sg-analytics-card sg-analytics-card--highlight"><div class="sg-analytics-label">CA encaissé total</div><div class="sg-analytics-value">${fmtMoney(data.revenue_total)}</div></div>
        <div class="sg-analytics-card sg-analytics-card--highlight"><div class="sg-analytics-label">Panier moyen encaissé</div><div class="sg-analytics-value">${fmtMoney(data.average_order)}</div></div>
        <div class="sg-analytics-card sg-analytics-card--highlight"><div class="sg-analytics-label">Commandes / visites · 30 j</div><div class="sg-analytics-value">${fmtPct(data.conversion_rate)}</div></div>
        <div class="sg-analytics-card"><div class="sg-analytics-label">Visiteurs uniques · 30 j</div><div class="sg-analytics-value">${fmt(data.visitors_30d)}</div></div>
      </div>
      <div class="sg-analytics-chart">
        <div class="sg-chart-head"><div class="sg-analytics-label">Visites par jour · 30 derniers jours</div><div class="sg-chart-note">Touchez une barre pour voir les détails</div></div>
        <div class="sg-bars">${visitBars || '<span class="sg-analytics-sub">Aucune visite enregistrée pour le moment.</span>'}</div>
        <div class="sg-chart-detail" data-detail-for="visits">Touchez une barre pour afficher la date, les visites et les visiteurs uniques.</div>
        <div class="sg-analytics-legend"><span><span class="sg-legend-dot"></span>Visites</span></div>
      </div>
      <div class="sg-analytics-chart">
        <div class="sg-chart-head"><div class="sg-analytics-label">Chiffre d'affaires · 30 derniers jours</div><div class="sg-chart-note">Commandes payées uniquement</div></div>
        <div class="sg-bars">${salesBars || '<span class="sg-analytics-sub">Aucune vente enregistrée pour le moment.</span>'}</div>
        <div class="sg-chart-detail" data-detail-for="sales">Touchez une barre pour afficher la date, le CA et le nombre de commandes.</div>
        <div class="sg-analytics-legend"><span><span class="sg-legend-dot"></span>CA encaissé</span></div>
      </div>
    `;

    const btn = document.getElementById('sgAnalyticsRefresh');
    if (btn) btn.addEventListener('click', load);
    bindChartInteractions(panel);
  }

  async function load() {
    const box = document.getElementById('adminBox');
    if (!box || box.classList.contains('hidden')) return;
    try {
      const r = await fetch('/api/admin/analytics', { credentials: 'same-origin', cache: 'no-store' });
      if (r.status === 401) return;
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Statistiques indisponibles');
      render(d);
    } catch (e) {
      const panel = ensurePanel();
      if (panel) panel.innerHTML = `<div class="sg-analytics-title">📊 Activité de la boutique</div><div class="sg-analytics-error">${e.message || 'Impossible de charger les statistiques.'}</div>`;
      console.warn('SITE_ANALYTICS_ADMIN:', e);
    }
  }

  function init() {
    addStyles();
    const box = document.getElementById('adminBox');
    if (!box) return;
    const observer = new MutationObserver(() => {
      if (!box.classList.contains('hidden')) load();
    });
    observer.observe(box, { attributes: true, attributeFilter: ['class'] });
    if (!box.classList.contains('hidden')) load();
    setInterval(() => { if (!box.classList.contains('hidden')) load(); }, 60000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
