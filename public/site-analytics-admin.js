(() => {
  'use strict';

  const STYLE = 'sg-site-analytics-style';
  const PANEL = 'sg-site-analytics-panel';

  function addStyles() {
    if (document.getElementById(STYLE)) return;
    const s = document.createElement('style');
    s.id = STYLE;
    s.textContent = `
      /* Analytics lives INSIDE .stats so the workspace controller cannot hide it. */
      #${PANEL}{grid-column:1/-1!important;display:block!important;margin:0 0 2px!important;padding:16px!important;border:1px solid rgba(115,145,190,.16);border-radius:18px;background:linear-gradient(145deg,rgba(14,25,43,.98),rgba(8,15,27,.98));box-shadow:0 10px 32px rgba(0,0,0,.2);order:-1}
      .sg-analytics-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}
      .sg-analytics-title{font-size:19px;font-weight:900;color:#f7f9ff}
      .sg-analytics-sub{font-size:11px;color:#8f9db3;margin-top:4px}
      .sg-analytics-refresh{border:0;border-radius:9px;padding:8px 11px;background:#26313d;color:#fff;font-weight:700;cursor:pointer}
      .sg-analytics-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
      .sg-analytics-card{padding:12px;border:1px solid rgba(115,145,190,.14);border-radius:13px;background:linear-gradient(145deg,#101b28,#0c141e)}
      .sg-analytics-label{font-size:10px;color:#8f9db3;font-weight:800;text-transform:uppercase;letter-spacing:.06em}
      .sg-analytics-value{margin-top:6px;font-size:21px;font-weight:900;color:#fff;overflow-wrap:anywhere}
      .sg-analytics-chart{margin-top:12px;padding:12px;border:1px solid rgba(115,145,190,.14);border-radius:13px;background:rgba(7,13,23,.82);overflow:auto}
      .sg-bars{display:flex;align-items:flex-end;gap:5px;height:105px;min-width:520px;padding-top:6px}
      .sg-bar-wrap{height:100%;flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:5px;min-width:13px}
      .sg-bar{width:100%;max-width:18px;border-radius:5px 5px 2px 2px;background:linear-gradient(180deg,#2684ff,#7545ff,#e62f9f);min-height:2px}
      .sg-bar-label{font-size:8px;color:#72829a;transform:rotate(-35deg);white-space:nowrap}
      .sg-analytics-error{color:#ff7777;font-size:13px;padding:8px 0}

      /* Keep the old order-status counters useful without making the Overview huge. */
      #adminBox .stats > .stat:not(#sg-site-analytics-panel){min-height:88px!important;padding:13px 15px!important}
      #adminBox .stats > .stat:not(#sg-site-analytics-panel) strong{font-size:22px!important;margin-top:7px!important}
      #adminBox .stats > .stat:nth-child(n+4){min-height:72px!important;padding:11px 13px!important}
      #adminBox .stats > .stat:nth-child(n+4) strong{font-size:19px!important;margin-top:5px!important}

      @media(max-width:900px){.sg-analytics-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:480px){
        .sg-analytics-head{align-items:flex-start}
        .sg-analytics-title{font-size:17px}
        .sg-analytics-grid{grid-template-columns:1fr 1fr;gap:8px}
        .sg-analytics-card{padding:10px}
        .sg-analytics-value{font-size:18px}
        #adminBox .stats{grid-template-columns:1fr 1fr!important;gap:8px!important}
        #adminBox .stats > .stat{min-height:78px!important;padding:11px!important}
        #adminBox .stats > .stat:nth-child(n+4){min-height:66px!important}
        #adminBox .stats > .stat strong{font-size:19px!important}
        #adminBox .stats > .stat:nth-child(n+4) strong{font-size:17px!important}
      }
    `;
    document.head.appendChild(s);
  }

  const fmt = n => new Intl.NumberFormat('fr-FR').format(Number(n || 0));

  function ensurePanel() {
    let panel = document.getElementById(PANEL);
    if (panel) return panel;
    const box = document.getElementById('adminBox');
    const stats = box && box.querySelector(':scope > .stats');
    if (!box || !stats || box.classList.contains('hidden')) return null;
    panel = document.createElement('div');
    panel.id = PANEL;
    stats.insertBefore(panel, stats.firstElementChild);
    return panel;
  }

  function render(data) {
    addStyles();
    const panel = ensurePanel();
    if (!panel) return;

    const days = Array.isArray(data.days) ? data.days : [];
    const max = Math.max(1, ...days.map(x => Number(x.visits || 0)));
    const bars = days.map(x => {
      const visits = Number(x.visits || 0);
      const height = Math.max(2, Math.round((visits / max) * 90));
      return `<div class="sg-bar-wrap" title="${x.date}: ${fmt(visits)} visites / ${fmt(x.visitors)} visiteurs"><div class="sg-bar" style="height:${height}px"></div><div class="sg-bar-label">${String(x.date).slice(5)}</div></div>`;
    }).join('');

    panel.innerHTML = `
      <div class="sg-analytics-head">
        <div>
          <div class="sg-analytics-title">📊 Activité de la boutique</div>
          <div class="sg-analytics-sub">Visiteurs, visites et commandes en un coup d'œil</div>
        </div>
        <button type="button" class="sg-analytics-refresh" id="sgAnalyticsRefresh">Actualiser</button>
      </div>
      <div class="sg-analytics-grid">
        <div class="sg-analytics-card"><div class="sg-analytics-label">Visiteurs aujourd'hui</div><div class="sg-analytics-value">${fmt(data.visitors_today)}</div></div>
        <div class="sg-analytics-card"><div class="sg-analytics-label">Visites aujourd'hui</div><div class="sg-analytics-value">${fmt(data.visits_today)}</div></div>
        <div class="sg-analytics-card"><div class="sg-analytics-label">Visiteurs · 7 jours</div><div class="sg-analytics-value">${fmt(data.visitors_7d)}</div></div>
        <div class="sg-analytics-card"><div class="sg-analytics-label">Visiteurs · 30 jours</div><div class="sg-analytics-value">${fmt(data.visitors_30d)}</div></div>
        <div class="sg-analytics-card"><div class="sg-analytics-label">Commandes totales</div><div class="sg-analytics-value">${fmt(data.orders)}</div></div>
        <div class="sg-analytics-card"><div class="sg-analytics-label">Commandes aujourd'hui</div><div class="sg-analytics-value">${fmt(data.orders_today)}</div></div>
        <div class="sg-analytics-card"><div class="sg-analytics-label">CA aujourd'hui</div><div class="sg-analytics-value">${fmt(data.revenue_today)} FCFA</div></div>
        <div class="sg-analytics-card"><div class="sg-analytics-label">Visites totales</div><div class="sg-analytics-value">${fmt(data.visits)}</div></div>
      </div>
      <div class="sg-analytics-chart">
        <div class="sg-analytics-label" style="margin-bottom:10px">Visites par jour · 30 derniers jours</div>
        <div class="sg-bars">${bars || '<span class="sg-analytics-sub">Aucune visite enregistrée pour le moment.</span>'}</div>
      </div>
    `;

    const btn = document.getElementById('sgAnalyticsRefresh');
    if (btn) btn.addEventListener('click', load);
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