(() => {
  'use strict';

  const PANEL_ID = 'sg-product-performance-panel';
  const STYLE_ID = 'sg-product-performance-style';
  const REFRESH_ID = 'sgProductPerformanceRefresh';
  let loading = false;

  const $ = (s, r = document) => r.querySelector(s);
  const fmt = n => new Intl.NumberFormat('fr-FR').format(Number(n || 0));
  const money = n => `${fmt(n)} FCFA`;
  const esc = v => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  function addStyles() {
    if ($('#' + STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
      /* SNGAMER ADMIN — single responsive correction layer */
      html,body{max-width:100%;overflow-x:hidden!important}
      #adminBox,#adminBox.sg-v26-mode{box-sizing:border-box!important;max-width:100%!important;min-width:0!important;overflow-x:clip!important}
      #adminBox.sg-v26-mode{grid-template-columns:minmax(0,220px) minmax(0,1fr)!important}
      #adminBox.sg-v26-mode > section,#adminBox.sg-v26-mode > .stats{min-width:0!important;width:100%!important;max-width:100%!important;box-sizing:border-box!important}
      #adminBox section,#adminBox .stats,#adminBox .stat,#adminBox .product-form,#adminBox .table-wrap{min-width:0!important;max-width:100%!important;box-sizing:border-box!important}
      #adminBox .stats{grid-template-columns:repeat(4,minmax(0,1fr))!important}
      #adminBox .product-form{grid-template-columns:repeat(4,minmax(0,1fr))!important}
      #adminBox .table-wrap{overflow-x:auto!important}
      #adminBox table{max-width:100%!important}

      #${PANEL_ID}{grid-column:1/-1!important;margin-top:14px!important;padding:18px!important;border:1px solid rgba(115,145,190,.16)!important;border-radius:18px!important;background:linear-gradient(145deg,rgba(14,25,43,.98),rgba(8,15,27,.98))!important;box-shadow:0 10px 32px rgba(0,0,0,.2);order:100!important;min-width:0!important;max-width:100%!important;box-sizing:border-box!important;overflow:hidden!important}
      .sg-prod-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:15px;min-width:0}
      .sg-prod-title{font-size:19px;font-weight:900;color:#f7f9ff;letter-spacing:-.02em}
      .sg-prod-sub{font-size:11px;color:#8f9db3;margin-top:4px;line-height:1.45}
      .sg-prod-refresh{border:0;border-radius:10px;padding:9px 12px;background:#26313d;color:#fff;font-weight:800;cursor:pointer;white-space:nowrap;flex:0 0 auto}
      .sg-prod-refresh:disabled{opacity:.55;cursor:wait}
      .sg-prod-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:12px;min-width:0}
      .sg-prod-card{min-width:0;padding:13px;border:1px solid rgba(115,145,190,.14);border-radius:13px;background:linear-gradient(145deg,#101b28,#0c141e);box-sizing:border-box;overflow:hidden}
      .sg-prod-card--best{border-color:rgba(53,166,255,.28);background:linear-gradient(145deg,#10233a,#0b1625)}
      .sg-prod-card--low{border-color:rgba(255,175,71,.22)}
      .sg-prod-label{font-size:10px;color:#8f9db3;font-weight:800;text-transform:uppercase;letter-spacing:.06em}
      .sg-prod-name{margin-top:7px;font-size:15px;font-weight:900;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
      .sg-prod-value{margin-top:5px;font-size:12px;color:#aebbd0;overflow-wrap:anywhere}
      .sg-prod-value strong{font-size:19px;color:#fff}
      .sg-prod-mini{margin-top:4px;font-size:10px;color:#71829a;overflow-wrap:anywhere}
      .sg-prod-layout{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(0,.85fr);gap:12px;min-width:0}
      .sg-prod-box{min-width:0;max-width:100%;border:1px solid rgba(115,145,190,.14);border-radius:13px;background:rgba(7,13,23,.68);overflow:hidden}
      .sg-prod-box-head{padding:12px 13px;border-bottom:1px solid rgba(115,145,190,.10);display:flex;justify-content:space-between;gap:10px;align-items:center;min-width:0}
      .sg-prod-box-title{font-size:11px;color:#aebbd0;font-weight:900;text-transform:uppercase;letter-spacing:.06em;min-width:0}
      .sg-prod-box-note{font-size:9px;color:#65768e;white-space:nowrap}
      .sg-prod-table-wrap{overflow-x:auto;max-width:100%}
      .sg-prod-table{width:100%;min-width:0;border-collapse:collapse;table-layout:fixed}
      .sg-prod-table th{padding:10px 12px;text-align:left;font-size:9px;color:#687990;text-transform:uppercase;letter-spacing:.06em;font-weight:900}
      .sg-prod-table td{padding:11px 12px;border-top:1px solid rgba(115,145,190,.08);font-size:11px;color:#e8edf6;overflow:hidden;text-overflow:ellipsis}
      .sg-prod-rank{width:30px;color:#71829a;font-weight:900}
      .sg-prod-item{display:flex;align-items:center;gap:8px;min-width:0;max-width:100%}
      .sg-prod-emoji{width:28px;height:28px;display:grid;place-items:center;border-radius:8px;background:rgba(38,132,255,.10);font-size:16px;flex:0 0 auto}
      .sg-prod-item-name{font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
      .sg-prod-badge{display:inline-flex;padding:4px 7px;border-radius:999px;font-size:9px;font-weight:900;background:rgba(38,132,255,.10);color:#72b9ff;white-space:nowrap}
      .sg-prod-badge--low{background:rgba(255,175,71,.10);color:#ffbf68}
      .sg-prod-badge--out{background:rgba(255,82,104,.10);color:#ff8a99}
      .sg-prod-empty{padding:18px;color:#71829a;font-size:11px;text-align:center}
      .sg-prod-error{padding:12px;border:1px solid rgba(255,90,110,.2);border-radius:10px;color:#ff8795;font-size:11px;background:rgba(255,70,90,.05)}

      /* desktop */
      @media(min-width:1201px){
        #adminBox.sg-v26-mode{grid-template-columns:minmax(210px,220px) minmax(0,1fr)!important;column-gap:22px!important}
      }
      /* tablet / small laptop: sidebar becomes horizontal, no page-wide horizontal scroll */
      @media(max-width:1100px){
        #adminBox.sg-v26-mode{display:block!important;overflow-x:hidden!important}
        #${PANEL_ID}{width:100%!important}
        #sg-admin-v26-nav{position:sticky!important;top:76px!important;z-index:50!important;display:flex!important;flex-direction:row!important;align-items:center!important;gap:7px!important;width:100%!important;max-width:100%!important;margin:0 0 14px!important;padding:8px!important;overflow-x:auto!important;overflow-y:hidden!important;box-sizing:border-box!important}
        #sg-admin-v26-nav::before{display:none!important}
        #sg-admin-v26-nav button{width:auto!important;min-width:max-content!important;min-height:43px!important;flex:0 0 auto!important;padding:9px 12px!important}
        #adminBox.sg-v26-mode > section,#adminBox.sg-v26-mode > .stats{width:100%!important;max-width:100%!important}
        #adminBox .stats{grid-template-columns:repeat(2,minmax(0,1fr))!important}
        #adminBox .product-form{grid-template-columns:repeat(2,minmax(0,1fr))!important}
        .sg-prod-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
        .sg-prod-layout{grid-template-columns:1fr}
      }
      /* tablet portrait */
      @media(max-width:760px){
        main#adminBox{width:calc(100% - 24px)!important;padding-top:16px!important}
        #adminBox section{padding:16px!important;border-radius:18px!important}
        #adminBox .stats{gap:9px!important}
        #adminBox .stat{min-height:100px!important;padding:14px!important}
        #adminBox .stat strong{font-size:22px!important}
        #adminBox .product-form{grid-template-columns:1fr!important}
        #adminBox .product-form > textarea{grid-column:auto!important}
        #adminBox .table-wrap{width:100%!important}
        #${PANEL_ID}{padding:14px!important}
        .sg-prod-head{gap:10px}
        .sg-prod-title{font-size:17px}
        .sg-prod-grid{grid-template-columns:1fr 1fr;gap:8px}
        .sg-prod-card{padding:11px}
        .sg-prod-layout{gap:8px}
      }
      /* phone */
      @media(max-width:520px){
        header{padding:10px 12px!important}
        main#adminBox{width:calc(100% - 16px)!important;padding-bottom:40px!important}
        #sg-admin-v26-nav{top:62px!important}
        #sg-admin-v26-nav button{min-height:40px!important;padding:8px 10px!important;font-size:12px!important}
        #adminBox .stats{grid-template-columns:1fr 1fr!important}
        #adminBox .stat{padding:11px!important;min-height:92px!important}
        #adminBox .stat strong{font-size:19px!important}
        #${PANEL_ID}{padding:12px!important;border-radius:15px!important}
        .sg-prod-head{align-items:flex-start}
        .sg-prod-sub{max-width:100%}
        .sg-prod-grid{grid-template-columns:1fr 1fr;gap:7px}
        .sg-prod-card{padding:9px;border-radius:11px}
        .sg-prod-label{font-size:8px}
        .sg-prod-name{font-size:12px}
        .sg-prod-value strong{font-size:16px}
        .sg-prod-mini{font-size:9px}
        .sg-prod-refresh{padding:8px 9px;font-size:10px}
        .sg-prod-box-head{padding:10px}
        .sg-prod-box-note{display:none}
        .sg-prod-table th,.sg-prod-table td{padding:9px 8px;font-size:10px}
      }
      @media(max-width:380px){
        .sg-prod-grid{grid-template-columns:1fr}
        .sg-prod-head{flex-direction:column}
        .sg-prod-refresh{align-self:flex-start}
        #adminBox .stats{grid-template-columns:1fr!important}
      }
    `;
    document.head.appendChild(s);
  }

  function isPaid(order) {
    return String(order?.payment_status || '').toLowerCase() === 'payé'
      && String(order?.status || '').toLowerCase() !== 'annulée'
      && String(order?.refund_status || '').toLowerCase() !== 'remboursé';
  }

  async function getData() {
    const opts = { credentials:'same-origin', cache:'no-store' };
    const [ordersRes, productsRes] = await Promise.all([
      fetch('/api/admin/orders', opts),
      fetch('/api/products', opts)
    ]);
    if (!ordersRes.ok) throw new Error('Impossible de charger les commandes.');
    if (!productsRes.ok) throw new Error('Impossible de charger les produits.');
    const [orders, products] = await Promise.all([ordersRes.json(), productsRes.json()]);
    return {
      orders: Array.isArray(orders) ? orders : (Array.isArray(orders?.orders) ? orders.orders : []),
      products: Array.isArray(products) ? products : (Array.isArray(products?.products) ? products.products : [])
    };
  }

  function calculate({ orders, products }) {
    const map = new Map(products.map(p => [Number(p.id), {id:Number(p.id),name:p.name || 'Produit sans nom',emoji:p.emoji || '🎮',stock:Number(p.stock || 0),sold:0,revenue:0}]));
    let paidOrders = 0;
    for (const order of orders) {
      if (!isPaid(order)) continue;
      paidOrders++;
      const items = Array.isArray(order.items) ? order.items : [];
      for (const item of items) {
        const id = Number(item.id);
        const qty = Number(item.quantity ?? item.qty ?? 0);
        if (!Number.isFinite(id) || !Number.isFinite(qty) || qty <= 0) continue;
        if (!map.has(id)) map.set(id, {id,name:item.name || `Produit #${id}`,emoji:item.emoji || '🎮',stock:0,sold:0,revenue:0});
        const row = map.get(id);
        row.sold += qty;
        row.revenue += Number(item.subtotal ?? (Number(item.price || 0) * qty)) || 0;
      }
    }
    const all = Array.from(map.values());
    const bySold = [...all].sort((a,b) => b.sold-a.sold || b.revenue-a.revenue || a.name.localeCompare(b.name,'fr'));
    const byRevenue = [...all].sort((a,b) => b.revenue-a.revenue || b.sold-a.sold);
    const least = [...all].sort((a,b) => a.sold-b.sold || a.revenue-b.revenue || a.name.localeCompare(b.name,'fr'))[0] || null;
    const lowStock = all.filter(p => p.stock <= 5).sort((a,b) => a.stock-b.stock || b.sold-a.sold);
    return { all, bySold, byRevenue, least, lowStock, paidOrders };
  }

  function productCell(p) {
    return `<div class="sg-prod-item"><span class="sg-prod-emoji">${esc(p.emoji)}</span><span class="sg-prod-item-name" title="${esc(p.name)}">${esc(p.name)}</span></div>`;
  }

  function render(data) {
    addStyles();
    const box = $('#adminBox');
    const stats = box?.querySelector(':scope > .stats');
    if (!box || !stats || box.classList.contains('hidden')) return;
    let panel = $('#' + PANEL_ID);
    if (!panel) { panel = document.createElement('div'); panel.id = PANEL_ID; stats.appendChild(panel); }
    const {all, bySold, byRevenue, least, lowStock, paidOrders} = calculate(data);
    const best = bySold[0] || null;
    const profitable = byRevenue[0] || null;
    const top = bySold.slice(0,5);
    const shownLow = lowStock.slice(0,6);
    panel.innerHTML = `
      <div class="sg-prod-head">
        <div><div class="sg-prod-title">📦 Performance des produits</div><div class="sg-prod-sub">Les ventes sont calculées à partir des commandes réellement payées, hors commandes annulées ou remboursées.</div></div>
        <button type="button" class="sg-prod-refresh" id="${REFRESH_ID}">Actualiser</button>
      </div>
      <div class="sg-prod-grid">
        <div class="sg-prod-card sg-prod-card--best"><div class="sg-prod-label">🏆 Produit le plus vendu</div><div class="sg-prod-name" title="${esc(best?.name || '—')}">${esc(best?.name || '—')}</div><div class="sg-prod-value"><strong>${fmt(best?.sold || 0)}</strong> unité${(best?.sold || 0) > 1 ? 's' : ''}</div><div class="sg-prod-mini">${money(best?.revenue || 0)} générés</div></div>
        <div class="sg-prod-card"><div class="sg-prod-label">📉 Produit le moins vendu</div><div class="sg-prod-name" title="${esc(least?.name || '—')}">${esc(least?.name || '—')}</div><div class="sg-prod-value"><strong>${fmt(least?.sold || 0)}</strong> unité${(least?.sold || 0) > 1 ? 's' : ''}</div><div class="sg-prod-mini">${least?.sold === 0 ? 'Aucune vente enregistrée' : money(least?.revenue || 0)}</div></div>
        <div class="sg-prod-card"><div class="sg-prod-label">💰 Produit le plus rentable</div><div class="sg-prod-name" title="${esc(profitable?.name || '—')}">${esc(profitable?.name || '—')}</div><div class="sg-prod-value"><strong>${money(profitable?.revenue || 0)}</strong></div><div class="sg-prod-mini">${fmt(profitable?.sold || 0)} unité${(profitable?.sold || 0) > 1 ? 's' : ''} vendue${(profitable?.sold || 0) > 1 ? 's' : ''}</div></div>
        <div class="sg-prod-card sg-prod-card--low"><div class="sg-prod-label">⚠️ Stock à surveiller</div><div class="sg-prod-name">${fmt(lowStock.length)} produit${lowStock.length > 1 ? 's' : ''}</div><div class="sg-prod-value"><strong>${fmt(all.reduce((n,p)=>n+p.sold,0))}</strong> unités vendues</div><div class="sg-prod-mini">${fmt(paidOrders)} commande${paidOrders > 1 ? 's' : ''} payée${paidOrders > 1 ? 's' : ''} analysée${paidOrders > 1 ? 's' : ''}</div></div>
      </div>
      <div class="sg-prod-layout">
        <div class="sg-prod-box">
          <div class="sg-prod-box-head"><div class="sg-prod-box-title">Top 5 des produits</div><div class="sg-prod-box-note">classement par unités vendues</div></div>
          <div class="sg-prod-table-wrap"><table class="sg-prod-table"><thead><tr><th>#</th><th>Produit</th><th>Vendus</th><th>CA</th><th>Stock</th></tr></thead><tbody>
            ${top.length ? top.map((p,i)=>`<tr><td class="sg-prod-rank">${i+1}</td><td>${productCell(p)}</td><td><strong>${fmt(p.sold)}</strong></td><td>${money(p.revenue)}</td><td><span class="sg-prod-badge ${p.stock===0?'sg-prod-badge--out':p.stock<=5?'sg-prod-badge--low':''}">${fmt(p.stock)}</span></td></tr>`).join('') : '<tr><td colspan="5"><div class="sg-prod-empty">Aucun produit disponible.</div></td></tr>'}
          </tbody></table></div>
        </div>
        <div class="sg-prod-box">
          <div class="sg-prod-box-head"><div class="sg-prod-box-title">Stock à surveiller</div><div class="sg-prod-box-note">≤ 5 unités</div></div>
          <div class="sg-prod-table-wrap"><table class="sg-prod-table"><thead><tr><th>Produit</th><th>Stock</th><th>Vendus</th></tr></thead><tbody>
            ${shownLow.length ? shownLow.map(p=>`<tr><td>${productCell(p)}</td><td><span class="sg-prod-badge ${p.stock===0?'sg-prod-badge--out':'sg-prod-badge--low'}">${p.stock===0?'Rupture':fmt(p.stock)}</span></td><td>${fmt(p.sold)}</td></tr>`).join('') : '<tr><td colspan="3"><div class="sg-prod-empty">Aucun produit à faible stock.</div></td></tr>'}
          </tbody></table></div>
        </div>
      </div>`;
    $('#' + REFRESH_ID)?.addEventListener('click', load);
  }

  async function load() {
    if (loading) return;
    loading = true;
    const btn = $('#' + REFRESH_ID);
    if (btn) { btn.disabled = true; btn.textContent = 'Actualisation…'; }
    try {
      render(await getData());
    } catch (e) {
      const box = $('#adminBox');
      const stats = box?.querySelector(':scope > .stats');
      if (!box || !stats || box.classList.contains('hidden')) return;
      let panel = $('#' + PANEL_ID);
      if (!panel) { panel = document.createElement('div'); panel.id = PANEL_ID; stats.appendChild(panel); }
      panel.innerHTML = `<div class="sg-prod-error">${esc(e.message || 'Statistiques produits indisponibles.')}</div>`;
    } finally {
      loading = false;
      const b = $('#' + REFRESH_ID);
      if (b) { b.disabled = false; b.textContent = 'Actualiser'; }
    }
  }

  function boot() {
    addStyles();
    load();
    const box = $('#adminBox');
    if (!box) return;
    const observer = new MutationObserver(() => {
      if (!$('#' + PANEL_ID) && !box.classList.contains('hidden')) load();
    });
    observer.observe(box, {childList:true, subtree:true, attributes:true, attributeFilter:['class','style']});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
