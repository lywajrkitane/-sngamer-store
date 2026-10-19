(() => {
  'use strict';

  const STYLE = 'sg-site-analytics-style';
  const PANEL = 'sg-site-analytics-panel';

  function addStyles() {
    if (document.getElementById(STYLE)) return;
    const s = document.createElement('style');
    s.id = STYLE;
    s.textContent = `
      #${PANEL}{display:block;margin:0 0 20px;padding:18px;border:1px solid rgba(115,145,190,.16);border-radius:18px;background:linear-gradient(145deg,rgba(14,25,43,.98),rgba(8,15,27,.98));box-shadow:0 10px 32px rgba(0,0,0,.2)}
      .sg-analytics-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}
      .sg-analytics-title{font-size:20px;font-weight:900;color:#f7f9ff}
      .sg-analytics-sub{font-size:11px;color:#8f9db3;margin-top:4px}
      .sg-analytics-refresh{border:0;border-radius:9px;padding:9px 12px;background:#26313d;color:#fff;font-weight:700;cursor:pointer}
      .sg-analytics-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
      .sg-analytics-card{padding:16px;border:1px solid rgba(115,145,190,.16);border-radius:14px;background:linear-gradient(145deg,#101b28,#0c141e)}
      .sg-analytics-label{font-size:11px;color:#8f9db3;font-weight:800;text-transform:uppercase;letter-spacing:.07em}
      .sg-analytics-value{margin-top:8px;font-size:25px;font-weight:900;color:#fff;overflow-wrap:anywhere}
      .sg-analytics-chart{margin-top:16px;padding:16px;border:1px solid rgba(115,145,190,.16);border-radius:14px;background:rgba(7,13,23,.82);overflow:auto}
      .sg-bars{display:flex;align-items:flex-end;gap:6px;height:145px;min-width:560px;padding-top:8px}
      .sg-bar-wrap{height:100%;flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:6px;min-width:14px}
      .sg-bar{width:100%;max-width:22px;border-radius:6px 6px 2px 2px;background:linear-gradient(180deg,#2684ff,#7545ff,#e62f9f);min-height:2px}
      .sg-bar-label{font-size:8px;color:#72829a;transform:rotate(-35deg);white-space:nowrap}
      .sg-analytics-error{color:#ff7777;font-size:13px;padding:8px 0}
      @media(max-width:700px){.sg-analytics-grid{grid-template-columns:1fr 1fr}.sg-analytics-card{padding:14px}.sg-analytics-value{font-size:21px}}
    `;
    document.head.appendChild(s);
  }

  const fmt = n => new Intl.NumberFormat('fr-FR').format(Number(n || 0));

  function ensurePanel() {
    let panel = document.getElementById(PANEL);
    if (panel) return panel;
    const box = document.getElementById('adminBox');
    const stats = box && box.querySelector('.stats');
    if (!box || !stats || box.classList.contains('hidden')) return null;
    panel = document.createElement('section');
    panel.id = PANEL;
    stats.insertAdjacentElement('afterend', panel);
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
      const height = Math.max(2, Math.round((visits / max) * 125));
      return `<div class="sg-bar-wrap" title="${x.date}: ${fmt(visits)} visites / ${fmt(x.visitors)} visiteurs"><div class="sg-bar" style="height:${height}px"></div><div class="sg-bar-label">${String(x.date).slice(5)}</div></div>`;
    }).join('');

    panel.innerHTML = `
      <div class="sg-analytics-head">
        <div>
          <div class="sg-analytics-title">Statistiques de la boutique</div>
          <div class="sg-analytics-sub">Fréquentation, visiteurs uniques et commandes</div>
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
        <div class="sg-analytics-card"><div class="sg-analytics-label">Chiffre d'affaires aujourd'hui</div><div class="sg-analytics-value">${fmt(data.revenue_today)} FCFA</div></div>
        <div class="sg-analytics-card"><div class="sg-analytics-label">Visites · 30 jours</div><div class="sg-analytics-value">${fmt(data.visits_30d)}</div></div>
        <div class="sg-analytics-card"><div class="sg-analytics-label">Visites totales</div><div class="sg-analytics-value">${fmt(data.visits)}</div></div>
      </div>
      <div class="sg-analytics-chart">
        <div class="sg-analytics-label" style="margin-bottom:14px">Visites par jour · 30 derniers jours</div>
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
      if (panel) panel.innerHTML = `<div class="sg-analytics-title">Statistiques de la boutique</div><div class="sg-analytics-error">${e.message || 'Impossible de charger les statistiques.'}</div>`;
      console.warn('SITE_ANALYTICS_ADMIN:', e);
    }
  }

  function isAdminVisible() {
    const box = document.getElementById('adminBox');
    return !!(box && !box.classList.contains('hidden'));
  }

  function init() {
    addStyles();
    const box = document.getElementById('adminBox');
    if (!box) return;

    const observer = new MutationObserver(() => {
      if (isAdminVisible()) load();
    });
    observer.observe(box, { attributes: true, attributeFilter: ['class'] });

    if (isAdminVisible()) load();
    setInterval(() => { if (isAdminVisible()) load(); }, 60000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
