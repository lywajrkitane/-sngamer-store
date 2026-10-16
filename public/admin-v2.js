/* SNGAMER STORE — ADMIN DASHBOARD V2 */
(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const money=n=>new Intl.NumberFormat('fr-FR').format(Number(n)||0)+' FCFA';
  const esc=v=>String(v??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[m]));

  function buildShell(){
    document.body.classList.add('sngAdminV2');
    const main=$('#adminBox'); if(!main||$('#a2Tools')) return;
    const top=document.createElement('div'); top.id='a2Tools'; top.innerHTML=`
      <div class="a2-topbar"><div class="a2-title"><h2>Tableau de bord</h2><p>Vue d'ensemble de SNGAMER STORE</p></div><div class="a2-actions"><input class="a2-search" id="a2GlobalSearch" placeholder="Rechercher produit ou commande…"><button class="a2-btn" id="a2Refresh">↻ Actualiser</button></div></div>
      <div class="a2-alerts"><div class="a2-panel"><h3>⚡ Actions rapides</h3><div class="a2-actions"><button class="a2-btn primary" data-jump="orders">🛒 Voir les commandes</button><button class="a2-btn" data-jump="products">📦 Gérer les produits</button><button class="a2-btn" data-jump="campaigns">🎉 Promotions</button></div></div><div class="a2-panel"><h3>⚠️ Vigilance</h3><div id="a2Alerts" class="a2-list"><div class="a2-empty">Analyse du stock en cours…</div></div></div></div>
      <nav class="a2-nav" aria-label="Navigation admin"><button class="active" data-jump="overview">Vue d'ensemble</button><button data-jump="products">Produits</button><button data-jump="orders">Commandes</button><button data-jump="promos">Promotions</button><button data-jump="campaigns">Campagnes</button></nav>`;
    main.insertBefore(top,main.firstChild);
    const stats=$('.stats',main); if(stats) $$('.stat',stats).forEach((el,i)=>el.classList.add('a2-kpi'));
    decorateSections();
    addOrderModal();
  }
  function decorateSections(){
    const sections=$$('section');
    sections.forEach(s=>{
      const h=s.querySelector('h2'); if(!h) return;
      if(h.textContent.includes('Gestion des produits')){s.id='a2-products'; addTools(s,'products');}
      if(h.textContent.includes('Commandes')){s.id='a2-orders'; addTools(s,'orders');}
      if(h.textContent.includes('Espace promotionnel')){s.id='a2-promos';}
      if(h.textContent.includes('Campagnes')){s.id='a2-campaigns';}
    });
  }
  function addTools(section,type){
    if(section.querySelector('.a2-section-head')) return;
    const h=section.querySelector('h2'); if(!h)return;
    const head=document.createElement('div');head.className='a2-section-head';
    const title=document.createElement('div');title.innerHTML='<h2>'+esc(h.textContent)+'</h2>';
    h.remove();
    const tools=document.createElement('div');tools.className='a2-section-tools';
    if(type==='products') tools.innerHTML='<input id="a2ProductSearch" placeholder="Rechercher un produit…"><select id="a2StockFilter"><option value="all">Tous les stocks</option><option value="ok">En stock</option><option value="low">Stock faible</option><option value="out">Rupture</option></select>';
    else tools.innerHTML='<input id="a2OrderSearch" placeholder="Client, téléphone, ID…"><select id="a2OrderStatus"><option value="all">Tous les statuts</option><option>Nouvelle</option><option>Confirmée</option><option>En préparation</option><option>Expédiée</option><option>Livrée</option><option>Annulée</option></select>';
    head.append(title,tools);section.insertBefore(head,section.firstChild);
    if(type==='products'){ $('#a2ProductSearch').addEventListener('input',filterProducts);$('#a2StockFilter').addEventListener('change',filterProducts); }
    else { $('#a2OrderSearch').addEventListener('input',filterOrders);$('#a2OrderStatus').addEventListener('change',filterOrders); }
  }
  function filterProducts(){const q=($('#a2ProductSearch')?.value||'').toLowerCase(),f=$('#a2StockFilter')?.value||'all';$$('#productsTable tr').forEach(r=>{const t=r.textContent.toLowerCase(),cells=$$('td',r),stock=Number(cells[4]?.textContent)||0;let ok=t.includes(q);if(f==='out')ok=ok&&stock<=0;if(f==='low')ok=ok&&stock>0&&stock<=5;if(f==='ok')ok=ok&&stock>5;r.style.display=ok?'':'none';});}
  function filterOrders(){const q=($('#a2OrderSearch')?.value||'').toLowerCase(),f=$('#a2OrderStatus')?.value||'all';$$('#ordersTable tr').forEach(r=>{const t=r.textContent.toLowerCase();const status=$('select.status',r)?.value||'';r.style.display=(t.includes(q)&&(f==='all'||status===f))?'':'none';});}
  async function refreshAlerts(){try{const r=await fetch('/api/products');if(!r.ok)return;const ps=await r.json();const low=ps.filter(p=>Number(p.stock)<=5),out=ps.filter(p=>Number(p.stock)<=0);const box=$('#a2Alerts');if(!box)return;box.innerHTML=`<div class="a2-item"><span>Rupture de stock</span><strong class="a2-stock-out">${out.length}</strong></div><div class="a2-item"><span>Stock faible ≤ 5</span><strong class="a2-stock-low">${low.length}</strong></div>`; }catch(e){}}
  function addOrderModal(){if($('#a2OrderModal'))return;const m=document.createElement('div');m.id='a2OrderModal';m.className='a2-order-modal';m.innerHTML='<div class="a2-order-box"><div class="a2-order-head"><div><h2 id="a2OrderTitle">Détail de la commande</h2><p id="a2OrderDate" style="color:var(--a2-muted)"></p></div><button class="a2-close" id="a2CloseOrder">×</button></div><div id="a2OrderBody"></div></div>';document.body.appendChild(m);$('#a2CloseOrder').onclick=()=>m.classList.remove('open');m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('open')});}
  async function showOrder(id){try{const r=await fetch('/api/admin/orders');if(!r.ok)throw 0;const orders=await r.json();const o=orders.find(x=>String(x.id)===String(id));if(!o)return;const customer=typeof o.customer==='string'?JSON.parse(o.customer||'{}'):o.customer||{};let items=o.items;try{if(typeof items==='string')items=JSON.parse(items)}catch(e){};$('#a2OrderTitle').textContent='Commande #'+o.id;$('#a2OrderDate').textContent=o.created_at?new Date(o.created_at).toLocaleString('fr-FR'):'';$('#a2OrderBody').innerHTML=`<div class="a2-detail-grid"><div class="a2-detail"><small>Client</small><strong>${esc(customer.name||'—')}</strong></div><div class="a2-detail"><small>Téléphone</small><strong>${esc(customer.phone||'—')}</strong></div><div class="a2-detail"><small>Adresse</small><strong>${esc(customer.address||'—')}</strong></div><div class="a2-detail"><small>Paiement</small><strong>${esc(o.payment||'—')}</strong></div><div class="a2-detail"><small>Statut</small><strong>${esc(o.status||'—')}</strong></div><div class="a2-detail"><small>Total</small><strong>${money(o.total)}</strong></div></div><h3>Articles</h3><div class="a2-order-items">${(Array.isArray(items)?items:[]).map(i=>`<div class="a2-order-item"><span>${esc(i.name)} × ${esc(i.quantity)}</span><strong>${money(i.subtotal||((i.price||0)*(i.quantity||1)))}</strong></div>`).join('')||'<div class="a2-empty">Aucun article.</div>'}</div>`;$('#a2OrderModal').classList.add('open')}catch(e){console.error(e)}}
  function wireOrderRows(){
    $$('#ordersTable tr').forEach(r=>{if(r.dataset.a2wired)return;r.dataset.a2wired='1';const cells=$$('td',r);if(!cells.length)return;const id=cells[0]?.textContent.trim();if(!id)return;const b=document.createElement('button');b.className='a2-btn';b.textContent='Voir';b.style.marginLeft='6px';b.onclick=()=>showOrder(id);const target=cells[0];target.appendChild(b);});filterOrders();
  }
  function decorateAfterLoad(){wireOrderRows();filterProducts();filterOrders();refreshAlerts();updateKpis();}
  function updateKpis(){const ids=['productCount','orderCount','revenue','newOrderCount','confirmedOrderCount','preparedOrderCount','shippedOrderCount','deliveredOrderCount','cancelledOrderCount'];ids.forEach(id=>{const el=$('#'+id);if(el&&el.closest('.stat'))el.closest('.stat').classList.add('a2-kpi')});}
  function jump(name){const map={overview:'a2Tools',products:'a2-products',orders:'a2-orders',promos:'a2-promos',campaigns:'a2-campaigns'};const el=$('#'+map[name]);if(el)el.scrollIntoView({behavior:'smooth',block:'start'});$$('.a2-nav button').forEach(b=>b.classList.toggle('active',b.dataset.jump===name));}
  function wireNav(){document.addEventListener('click',e=>{const b=e.target.closest('[data-jump]');if(b){e.preventDefault();jump(b.dataset.jump)}});$('#a2Refresh')?.addEventListener('click',()=>{if(typeof window.loadAll==='function')window.loadAll();setTimeout(decorateAfterLoad,500)});$('#a2GlobalSearch')?.addEventListener('input',e=>{const q=e.target.value.toLowerCase();$('#a2ProductSearch').value=q;$('#a2OrderSearch').value=q;filterProducts();filterOrders()});}
  function hookLoads(){const oldLoadAll=window.loadAll;if(typeof oldLoadAll==='function'&&!window.__a2Hook){window.__a2Hook=true;window.loadAll=async function(){const out=await oldLoadAll.apply(this,arguments);setTimeout(decorateAfterLoad,150);return out}}}
  function init(){buildShell();wireNav();hookLoads();setTimeout(decorateAfterLoad,700);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
