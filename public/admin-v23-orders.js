/* SNGAMER STORE ADMIN — V2.3 compact orders workspace
   Keeps the existing API/status logic and replaces the verbose order cards with a compact workspace. */
(function(){
  'use strict';
  const originalLoadOrders = window.loadOrders;
  let allOrders = [];
  let activeFilter = 'Toutes';

  const esc = v => String(v ?? '-').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const moneySafe = v => typeof window.money === 'function' ? window.money(v) : `${Number(v||0).toLocaleString('fr-FR')} FCFA`;

  function orderStatus(o){ return String(o.status || 'Nouvelle').trim(); }
  function bucket(status){
    const s=status.toLowerCase();
    if(s.includes('livr')) return 'Livrées';
    if(s.includes('expédi') || s.includes('exped')) return 'Expédiées';
    if(s.includes('préparation') || s.includes('preparation') || s.includes('confirm')) return 'En cours';
    if(s.includes('annul')) return 'Annulées';
    return 'À traiter';
  }

  function ensureWorkspace(){
    const section=[...document.querySelectorAll('#adminBox > section')].find(s => /commandes/i.test(s.querySelector('h2')?.textContent || ''));
    if(!section) return null;
    section.classList.add('v23-orders-section');
    let tools=section.querySelector('.v23-order-tools');
    if(!tools){
      tools=document.createElement('div');
      tools.className='v23-order-tools';
      tools.innerHTML=`
        <div class="v23-order-head">
          <div><h3>🛒 Commandes</h3><p>Gérez chaque commande sans afficher les informations inutiles.</p></div>
          <button type="button" class="v23-refresh" id="v23OrderRefresh">🔄 Actualiser</button>
        </div>
        <div class="v23-order-tabs" role="tablist">
          ${['Toutes','À traiter','En cours','Expédiées','Livrées','Annulées'].map((x,i)=>`<button type="button" class="${i===0?'active':''}" data-filter="${x}">${x}</button>`).join('')}
        </div>
        <label class="v23-order-search">🔎 <input id="v23OrderSearch" type="search" placeholder="Rechercher par N° de commande, client ou téléphone…"></label>`;
      section.insertBefore(tools, section.querySelector('.table-wrap'));
      tools.querySelector('#v23OrderRefresh').addEventListener('click', ()=>originalLoadOrders?.());
      tools.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{activeFilter=b.dataset.filter;tools.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('active',x===b));render();}));
      tools.querySelector('#v23OrderSearch').addEventListener('input',render);
    }
    return section;
  }

  function render(){
    const section=ensureWorkspace(); if(!section)return;
    const tbody=document.getElementById('ordersTable'); if(!tbody)return;
    const q=(document.getElementById('v23OrderSearch')?.value || '').trim().toLowerCase();
    const filtered=allOrders.filter(o=>{
      const inFilter=activeFilter==='Toutes' || bucket(orderStatus(o))===activeFilter;
      const c=o.customer||{};
      const hay=[o.id,c.name,c.phone,c.address].join(' ').toLowerCase();
      return inFilter && (!q || hay.includes(q));
    });
    tbody.innerHTML=filtered.map(o=>{
      const c=o.customer||{};
      const items=Array.isArray(o.items)?o.items:[];
      const productSummary=items.length===0?'Aucun produit':items.map(i=>`${esc(i.name)} × ${esc(i.quantity)}`).join('<br>');
      const safeStatus=esc(orderStatus(o));
      return `<tr class="v23-order-row" data-order-id="${esc(o.id)}">
        <td class="v23-order-main" colspan="7">
          <div class="v23-order-card">
            <div class="v23-order-identity">
              <span class="v23-order-id">#${esc(o.id)}</span>
              <div><strong>${esc(c.name || 'Client')}</strong><small>${esc(new Date(o.created_at).toLocaleString('fr-FR'))}</small></div>
            </div>
            <div class="v23-order-meta"><span>${moneySafe(o.total)}</span><em>${safeStatus}</em></div>
            <div class="v23-order-actions">
              <button type="button" class="v23-product-btn" data-products="${esc(o.id)}">📦 Voir les produits</button>
              <button type="button" class="v23-detail-btn" data-details="${esc(o.id)}">👁️ Voir les détails</button>
            </div>
            <select class="status v23-status" aria-label="Statut de la commande #${esc(o.id)}" data-status-id="${esc(o.id)}">
              ${['Nouvelle','Confirmée','En préparation','Expédiée','Livrée','Annulée'].map(s=>`<option value="${s}" ${s===o.status?'selected':''}>${s}</option>`).join('')}
            </select>
          </div>
        </td>
      </tr>`;
    }).join('') || `<tr><td colspan="7" class="v23-empty">Aucune commande dans cette catégorie.</td></tr>`;

    tbody.querySelectorAll('[data-details]').forEach(b=>b.addEventListener('click',()=>window.viewOrderDetails?.(Number(b.dataset.details))));
    tbody.querySelectorAll('[data-products]').forEach(b=>b.addEventListener('click',()=>openProducts(Number(b.dataset.products))));
    tbody.querySelectorAll('[data-status-id]').forEach(s=>s.addEventListener('change',()=>window.changeStatus?.(Number(s.dataset.statusId),s.value)));
  }

  function openProducts(id){
    const o=allOrders.find(x=>Number(x.id)===id); if(!o)return;
    let modal=document.getElementById('v23ProductsModal');
    if(!modal){
      modal=document.createElement('div');modal.id='v23ProductsModal';modal.className='v23-modal';
      modal.innerHTML='<div class="v23-modal-box"><button class="v23-modal-close" type="button">×</button><div id="v23ProductsContent"></div></div>';
      document.body.appendChild(modal);
      modal.addEventListener('click',e=>{if(e.target===modal||e.target.closest('.v23-modal-close'))modal.classList.remove('show')});
    }
    const items=Array.isArray(o.items)?o.items:[];
    document.getElementById('v23ProductsContent').innerHTML=`<div class="v23-products-title"><span>📦 Produits — commande #${esc(o.id)}</span><strong>${moneySafe(o.total)}</strong></div>${items.length?items.map(i=>`<div class="v23-product-line"><span>${esc(i.name)} × ${esc(i.quantity)}</span><strong>${moneySafe(Number(i.price||0)*Number(i.quantity||0))}</strong></div>`).join(''):'<p>Aucun produit enregistré.</p>'}`;
    modal.classList.add('show');
  }

  async function load(){
    if(typeof originalLoadOrders!=='function')return;
    const response=await fetch('/api/admin/orders');
    if(response.status===401){location.reload();return;}
    allOrders=await response.json();
    render();
  }

  // The original dashboard function remains available for compatibility; this enhancement
  // owns the visible order list and re-fetches the same authenticated API.
  window.loadOrders=load;
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>{ensureWorkspace();setTimeout(load,50)});
  else {ensureWorkspace();setTimeout(load,50);}
})();
