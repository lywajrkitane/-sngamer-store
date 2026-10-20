(() => {
  'use strict';
  const PANEL_ID = 'sg-product-performance-panel-v2';
  const STYLE_ID = 'sg-product-performance-style-v2';
  const fmt = n => new Intl.NumberFormat('fr-FR').format(Number(n || 0));
  const money = n => `${fmt(n)} FCFA`;
  const esc = v => String(v ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));

  function styles() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style'); s.id = STYLE_ID;
    s.textContent = `
      #${PANEL_ID}{display:block!important;width:100%!important;box-sizing:border-box!important;margin:18px 0!important;padding:20px!important;border:1px solid rgba(115,145,190,.18)!important;border-radius:20px!important;background:linear-gradient(145deg,rgba(14,25,43,.98),rgba(7,13,23,.98))!important;box-shadow:0 14px 40px rgba(0,0,0,.24)!important;color:#fff!important;clear:both!important;position:relative!important;z-index:5!important}
      #${PANEL_ID} *{box-sizing:border-box}
      .sgpf-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:16px}.sgpf-title{font-size:20px;font-weight:900}.sgpf-sub{font-size:11px;color:#8f9db3;margin-top:5px}.sgpf-btn{border:0;border-radius:10px;padding:9px 13px;background:#26313d;color:#fff;font-weight:800;cursor:pointer}.sgpf-btn:disabled{opacity:.5}
      .sgpf-cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:12px}.sgpf-card{padding:14px;border:1px solid rgba(115,145,190,.14);border-radius:14px;background:rgba(12,22,36,.9);min-width:0}.sgpf-card.best{border-color:rgba(53,166,255,.3)}.sgpf-card.low{border-color:rgba(255,175,71,.25)}.sgpf-label{font-size:10px;color:#8f9db3;font-weight:900;text-transform:uppercase;letter-spacing:.05em}.sgpf-name{margin-top:7px;font-size:14px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sgpf-val{margin-top:5px;font-size:12px;color:#aebbd0}.sgpf-val strong{font-size:18px;color:#fff}.sgpf-mini{margin-top:4px;font-size:10px;color:#71829a}
      .sgpf-layout{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(250px,.8fr);gap:12px}.sgpf-box{border:1px solid rgba(115,145,190,.14);border-radius:14px;overflow:hidden;background:rgba(7,13,23,.65)}.sgpf-box h3{margin:0;padding:12px 13px;border-bottom:1px solid rgba(115,145,190,.1);font-size:11px;color:#aebbd0;text-transform:uppercase;letter-spacing:.06em}.sgpf-scroll{overflow:auto}.sgpf-table{width:100%;border-collapse:collapse;min-width:500px}.sgpf-table th{padding:10px 12px;text-align:left;font-size:9px;color:#687990;text-transform:uppercase}.sgpf-table td{padding:11px 12px;border-top:1px solid rgba(115,145,190,.08);font-size:11px;color:#e8edf6}.sgpf-badge{display:inline-flex;padding:4px 7px;border-radius:999px;background:rgba(38,132,255,.1);color:#72b9ff;font-size:9px;font-weight:900}.sgpf-badge.low{background:rgba(255,175,71,.1);color:#ffbf68}.sgpf-badge.out{background:rgba(255,82,104,.1);color:#ff8a99}.sgpf-empty{padding:16px;text-align:center;color:#71829a}
      @media(max-width:900px){.sgpf-cards{grid-template-columns:repeat(2,1fr)}.sgpf-layout{grid-template-columns:1fr}}@media(max-width:520px){#${PANEL_ID}{padding:14px!important}.sgpf-cards{grid-template-columns:1fr 1fr}.sgpf-layout{display:block}.sgpf-box+ .sgpf-box{margin-top:10px}.sgpf-head{align-items:stretch}.sgpf-title{font-size:17px}}
    `;
    document.head.appendChild(s);
  }

  async function data() {
    const opts = {credentials:'same-origin',cache:'no-store'};
    const [or, pr] = await Promise.all([fetch('/api/admin/orders', opts), fetch('/api/products', opts)]);
    if (!or.ok || !pr.ok) throw new Error('Impossible de charger les données produits.');
    const [orders, products] = await Promise.all([or.json(), pr.json()]);
    return {orders:Array.isArray(orders)?orders:(orders?.orders||[]),products:Array.isArray(products)?products:(products?.products||[])};
  }
  function calc({orders,products}) {
    const map = new Map(products.map(p => [Number(p.id), {id:Number(p.id),name:p.name||'Produit sans nom',emoji:p.emoji||'🎮',stock:Number(p.stock||0),sold:0,revenue:0}]));
    let paid=0;
    for (const o of orders) {
      const payment=String(o?.payment_status||'').toLowerCase(), status=String(o?.status||'').toLowerCase(), refund=String(o?.refund_status||'').toLowerCase();
      if (payment !== 'payé' || status === 'annulée' || refund === 'remboursé') continue;
      paid++;
      for (const i of (Array.isArray(o.items)?o.items:[])) {
        const id=Number(i.id), qty=Number(i.quantity ?? i.qty ?? 0); if(!Number.isFinite(id)||qty<=0) continue;
        if(!map.has(id)) map.set(id,{id,name:i.name||`Produit #${id}`,emoji:i.emoji||'🎮',stock:0,sold:0,revenue:0});
        const p=map.get(id); p.sold+=qty; p.revenue+=Number(i.subtotal ?? Number(i.price||0)*qty)||0;
      }
    }
    const all=[...map.values()], bySold=[...all].sort((a,b)=>b.sold-a.sold||b.revenue-a.revenue||a.name.localeCompare(b.name,'fr')), byRevenue=[...all].sort((a,b)=>b.revenue-a.revenue||b.sold-a.sold);
    return {all,bySold,byRevenue,paid,least:[...all].sort((a,b)=>a.sold-b.sold||a.revenue-b.revenue||a.name.localeCompare(b.name,'fr'))[0],low:all.filter(p=>p.stock<=5).sort((a,b)=>a.stock-b.stock||b.sold-a.sold)};
  }
  function target() {
    const box=document.getElementById('adminBox'); if(!box||box.classList.contains('hidden')) return null;
    const existing=document.getElementById(PANEL_ID); if(existing) return existing;
    const sections=[...box.querySelectorAll(':scope > section')];
    const overview=sections.find(s=>/vue d.?ensemble|overview/i.test((s.querySelector('h1,h2,h3,h4')?.textContent||'')+' '+s.id)) || sections[0];
    if(!overview) return null;
    const panel=document.createElement('section'); panel.id=PANEL_ID; overview.insertAdjacentElement('afterend',panel); return panel;
  }
  function render(d) {
    styles(); const panel=target(); if(!panel) return false;
    const {all,bySold,byRevenue,least,low,paid}=calc(d), best=bySold[0], profitable=byRevenue[0], top=bySold.slice(0,5), shown=low.slice(0,6);
    panel.innerHTML=`<div class="sgpf-head"><div><div class="sgpf-title">📦 Performance des produits</div><div class="sgpf-sub">Analyse des ventes payées, du stock et des produits les plus/moins performants.</div></div><button class="sgpf-btn" id="sgpfRefresh">Actualiser</button></div>
      <div class="sgpf-cards"><div class="sgpf-card best"><div class="sgpf-label">🏆 Produit le plus vendu</div><div class="sgpf-name">${esc(best?.name||'—')}</div><div class="sgpf-val"><strong>${fmt(best?.sold||0)}</strong> unité${(best?.sold||0)>1?'s':''}</div><div class="sgpf-mini">${money(best?.revenue||0)} générés</div></div>
      <div class="sgpf-card"><div class="sgpf-label">📉 Produit le moins vendu</div><div class="sgpf-name">${esc(least?.name||'—')}</div><div class="sgpf-val"><strong>${fmt(least?.sold||0)}</strong> unité${(least?.sold||0)>1?'s':''}</div><div class="sgpf-mini">${least?.sold===0?'Aucune vente enregistrée':money(least?.revenue||0)}</div></div>
      <div class="sgpf-card"><div class="sgpf-label">💰 Produit le plus rentable</div><div class="sgpf-name">${esc(profitable?.name||'—')}</div><div class="sgpf-val"><strong>${money(profitable?.revenue||0)}</strong></div><div class="sgpf-mini">${fmt(profitable?.sold||0)} unité${(profitable?.sold||0)>1?'s':''} vendue${(profitable?.sold||0)>1?'s':''}</div></div>
      <div class="sgpf-card low"><div class="sgpf-label">⚠️ Stock à surveiller</div><div class="sgpf-name">${fmt(low.length)} produit${low.length>1?'s':''}</div><div class="sgpf-val"><strong>${fmt(all.reduce((n,p)=>n+p.sold,0))}</strong> unités vendues</div><div class="sgpf-mini">${fmt(paid)} commande${paid>1?'s':''} payée${paid>1?'s':''}</div></div></div>
      <div class="sgpf-layout"><div class="sgpf-box"><h3>Top 5 des produits</h3><div class="sgpf-scroll"><table class="sgpf-table"><thead><tr><th>#</th><th>Produit</th><th>Vendus</th><th>CA</th><th>Stock</th></tr></thead><tbody>${top.length?top.map((p,i)=>`<tr><td>${i+1}</td><td>${esc(p.emoji)} ${esc(p.name)}</td><td><strong>${fmt(p.sold)}</strong></td><td>${money(p.revenue)}</td><td><span class="sgpf-badge ${p.stock===0?'out':p.stock<=5?'low':''}">${fmt(p.stock)}</span></td></tr>`).join(''):'<tr><td colspan="5"><div class="sgpf-empty">Aucun produit disponible.</div></td></tr>'}</tbody></table></div></div>
      <div class="sgpf-box"><h3>Stock à surveiller · ≤ 5 unités</h3><div class="sgpf-scroll"><table class="sgpf-table"><thead><tr><th>Produit</th><th>Stock</th><th>Vendus</th></tr></thead><tbody>${shown.length?shown.map(p=>`<tr><td>${esc(p.emoji)} ${esc(p.name)}</td><td><span class="sgpf-badge ${p.stock===0?'out':'low'}">${p.stock===0?'Rupture':fmt(p.stock)}</span></td><td>${fmt(p.sold)}</td></tr>`).join(''):'<tr><td colspan="3"><div class="sgpf-empty">Aucun produit à faible stock.</div></td></tr>'}</tbody></table></div></div></div>`;
    document.getElementById('sgpfRefresh')?.addEventListener('click',()=>load()); return true;
  }
  async function load(){try{render(await data());}catch(e){const p=target();if(p)p.innerHTML=`<div class="sgpf-head"><div><div class="sgpf-title">📦 Performance des produits</div><div class="sgpf-sub">${esc(e.message)}</div></div><button class="sgpf-btn" id="sgpfRefresh">Réessayer</button></div>`;document.getElementById('sgpfRefresh')?.addEventListener('click',load);}}
  function boot(){styles();let tries=0;const tick=()=>{tries++;const box=document.getElementById('adminBox');if(box&&!box.classList.contains('hidden')){load();return;}if(tries<30)setTimeout(tick,500);};tick();const box=document.getElementById('adminBox');if(box)new MutationObserver(()=>{if(!document.getElementById(PANEL_ID)&&!box.classList.contains('hidden'))load();}).observe(box,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
