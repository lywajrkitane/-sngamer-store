(function(){
  'use strict';

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const money=v=>new Intl.NumberFormat('fr-FR').format(Number(v||0))+' FCFA';
  const date=v=>{try{return new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(v))}catch(_){return ''}};

  async function api(url,options={}){
    const r=await fetch(url,{credentials:'same-origin',headers:{'Content-Type':'application/json',...(options.headers||{})},...options});
    let d={}; try{d=await r.json()}catch(_){}
    if(!r.ok)throw new Error(d.error||'Erreur');
    return d;
  }

  function injectStyles(){
    if(document.getElementById('sgAdminCustomerStyles'))return;
    const s=document.createElement('style');
    s.id='sgAdminCustomerStyles';
    s.textContent=`
      .sgCustomerSection{background:#111820;border:1px solid #26313d;border-radius:14px;padding:18px;margin-bottom:20px}
      .sgCustomerHeader{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
      .sgCustomerHeader h2{margin:0}
      .sgCustomerGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:14px 0}
      .sgCustomerStat{background:#0b0f14;border:1px solid #26313d;border-radius:12px;padding:13px}
      .sgCustomerStat b{display:block;font-size:21px;margin-top:5px}.sgCustomerStat span{color:#8e9baa;font-size:11px}

      .sgCustomerTable{width:100%;border-collapse:separate;border-spacing:0}
      .sgCustomerTable th,.sgCustomerTable td{text-align:left;padding:12px 10px;border-bottom:1px solid #26313d;vertical-align:middle}
      .sgCustomerTable th{color:#9eabb8;font-size:12px;text-transform:uppercase;letter-spacing:.05em}
      .sgCustomerTable tbody tr:last-child td{border-bottom:0}
      .sgCustomerName{font-weight:800;color:#fff;font-size:15px}
      .sgCustomerId{display:inline-block;margin-right:8px;color:#5aa4ff;font-weight:900}
      .sgCustomerMeta{color:#8d9bad;font-size:11px;line-height:1.45;margin-top:3px}
      .sgCustomerBtn{border:1px solid #30445b;background:#17263a;color:#fff;border-radius:9px;padding:8px 10px;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;white-space:nowrap}
      .sgCustomerBtn.primary{background:#1e88e5;border-color:#1e88e5}
      .sgCustomerActionCell{text-align:right;white-space:nowrap}

      .sgCustomerModal{position:fixed;inset:0;background:rgba(0,0,0,.78);z-index:99999;display:grid;place-items:center;padding:16px}
      .sgCustomerBox{width:min(900px,100%);max-height:90vh;overflow:auto;background:#111820;border:1px solid #30465f;border-radius:18px;padding:18px;color:#fff}
      .sgCustomerBox h3{margin:0}.sgCustomerClose{float:right;border:0;background:transparent;color:#fff;font-size:25px}
      .sgCustomerOrder{background:#0b0f14;border:1px solid #26313d;border-radius:12px;padding:12px;margin-top:10px}
      .sgCustomerOrderTop{display:flex;justify-content:space-between;gap:10px}.sgCustomerOrder small{color:#8e9baa}
      .sgCustomerForm{display:grid;gap:9px;margin-top:12px}.sgCustomerForm textarea,.sgCustomerForm input,.sgCustomerForm select{width:100%;padding:10px;border-radius:9px;border:1px solid #344150;background:#0b0f14;color:#fff}
      .sgCustomerActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
      .sgCustomersNavBtn{width:100%;min-height:48px;padding:11px 13px;display:flex;align-items:center;gap:10px;border-radius:13px;border:1px solid transparent;background:transparent;color:#8f9db3;font-size:13px;font-weight:800;white-space:nowrap;cursor:pointer}
      .sgCustomersNavBtn:hover{color:#fff;background:rgba(48,76,120,.18);border-color:rgba(100,140,200,.14)}
      .sgCustomersNavBtn.active{color:#fff;border-color:rgba(92,116,255,.30);background:linear-gradient(135deg,rgba(32,126,255,.96),rgba(105,57,255,.96));box-shadow:0 10px 28px rgba(60,80,255,.22)}
      .sgCustomersNavBtn span{font-size:17px;width:22px;text-align:center}.sgCustomersNavBtn b{font-weight:800}

      @media(max-width:700px){
        .sgCustomerSection{padding:14px;overflow:hidden}
        .sgCustomerGrid{grid-template-columns:1fr 1fr}
        .sgCustomerTable{display:block;width:100%;border:0}
        .sgCustomerTable thead{display:none}
        .sgCustomerTable tbody{display:block;width:100%}
        .sgCustomerTable tr{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;width:100%;margin:0 0 9px;background:#0b0f14;border:1px solid #26313d;border-radius:12px;overflow:hidden}
        .sgCustomerTable td{display:block;width:auto;border:0!important;padding:12px!important;min-width:0}
        .sgCustomerTable td:not(:first-child):not(:last-child){display:none!important}
        .sgCustomerTable td:first-child{grid-column:1;grid-row:1}
        .sgCustomerTable td:first-child::before{display:none}
        .sgCustomerTable td:last-child{grid-column:2;grid-row:1;text-align:right;white-space:nowrap;padding-left:4px!important}
        .sgCustomerTable .sgCustomerName{font-size:15px;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .sgCustomerTable .sgCustomerMeta{display:none}
        .sgCustomerTable .sgCustomerBtn{width:auto;min-width:0;min-height:42px;padding:9px 13px;font-size:13px}
        .sgCustomersNavBtn{width:auto;min-height:43px;flex:0 0 auto;padding:9px 12px;font-size:12px}
      }
    `;
    document.head.appendChild(s);
  }

  function deactivateCustomersNav(){document.querySelector('#sg-admin-v26-nav [data-sg-customers]')?.classList.remove('active')}

  function showCustomersWorkspace(){
    const root=document.getElementById('adminBox');
    const section=document.getElementById('sgCustomerSection');
    const nav=document.getElementById('sg-admin-v26-nav');
    const button=nav?.querySelector('[data-sg-customers]');
    if(!root||!section||!nav||!button)return;
    root.classList.add('sg-v26-mode');
    root.dataset.v26Workspace='customers';
    const stats=root.querySelector(':scope > .stats');
    if(stats)stats.style.display='none';
    root.querySelectorAll(':scope > section').forEach(s=>{
      const show=s===section;
      s.classList.toggle('sg-v26-show',show);
      s.classList.toggle('sg-v26-hide',!show);
    });
    nav.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    button.classList.add('active');
    try{sessionStorage.setItem('sg_admin_workspace_v26','customers')}catch(_){}
    load();
    window.scrollTo({top:0,left:0,behavior:'auto'});
  }

  function mountNavButton(){
    const nav=document.getElementById('sg-admin-v26-nav');
    if(!nav||nav.querySelector('[data-sg-customers]'))return;
    const button=document.createElement('button');
    button.type='button';button.className='sgCustomersNavBtn';button.dataset.sgCustomers='1';
    button.innerHTML='<span aria-hidden="true">👥</span><b>Clients</b>';
    button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();showCustomersWorkspace()});
    nav.addEventListener('click',e=>{if(!e.target.closest('[data-sg-customers]'))deactivateCustomersNav()},true);
    nav.appendChild(button);
  }

  async function load(){
    if(!document.getElementById('adminBox')||document.getElementById('adminBox').classList.contains('hidden'))return;
    injectStyles();mountNavButton();
    let customers=[];try{customers=await api('/api/admin/customers')}catch(e){return}
    const box=document.getElementById('sgCustomerSection');if(!box)return;
    const total=customers.length;
    const orders=customers.reduce((s,c)=>s+Number(c.order_count||0),0);
    const revenue=customers.reduce((s,c)=>s+Number(c.total_spent||0),0);
    box.innerHTML=`
      <div class="sgCustomerHeader"><h2>👥 Clients & comptes</h2><button class="sgCustomerBtn" onclick="sngAdminCustomersLoad()">Actualiser</button></div>
      <div class="sgCustomerGrid">
        <div class="sgCustomerStat">Clients enregistrés<b>${total}</b><span>comptes actifs</span></div>
        <div class="sgCustomerStat">Commandes liées<b>${orders}</b><span>commandes clients</span></div>
        <div class="sgCustomerStat">Total clients<b>${money(revenue)}</b><span>cumul des commandes</span></div>
      </div>
      <div class="table-wrap">
        <table class="sgCustomerTable">
          <thead><tr><th>Client</th><th>Contact</th><th>Commandes</th><th>Dernière activité</th><th></th></tr></thead>
          <tbody>
            ${customers.length?customers.map(c=>`
              <tr>
                <td data-label="Client">
                  <div class="sgCustomerName"><span class="sgCustomerId">#${Number(c.id)}</span>${esc(c.name)}</div>
                  <div class="sgCustomerMeta">Compte #${Number(c.id)} · Créé le ${date(c.created_at)}</div>
                </td>
                <td data-label="Contact"><div>${esc(c.email)}</div><div class="sgCustomerMeta">${esc(c.phone||'Téléphone non renseigné')}<br>${esc(c.address||'Adresse non renseignée')}</div></td>
                <td data-label="Commandes"><b>${Number(c.order_count||0)}</b><div class="sgCustomerMeta">${money(c.total_spent)}</div></td>
                <td data-label="Dernière activité"><div>${c.last_order_at?date(c.last_order_at):'Aucune commande'}</div><div class="sgCustomerMeta">Dernière connexion : ${c.last_login_at?date(c.last_login_at):'—'}</div></td>
                <td class="sgCustomerActionCell"><button class="sgCustomerBtn primary" onclick="sngAdminCustomer(${Number(c.id)})">Voir le client</button></td>
              </tr>`).join(''):`<tr><td colspan="5" style="text-align:center;color:#8e9baa;padding:24px">Aucun compte client enregistré.</td></tr>`}
          </tbody>
        </table>
      </div>`;
  }

  async function customer(id){
    const c=await api('/api/admin/customers');
    const found=c.find(x=>Number(x.id)===Number(id));
    if(!found)return;
    const orders=await api('/api/admin/customers/'+id+'/orders');
    showModal(found,orders);
  }

  function showModal(c,orders){
    const m=document.createElement('div');m.className='sgCustomerModal';
    m.innerHTML=`
      <div class="sgCustomerBox">
        <button class="sgCustomerClose" onclick="this.closest('.sgCustomerModal').remove()">×</button>
        <h3>${esc(c.name)}</h3>
        <div class="sgCustomerMeta">${esc(c.email)} · ${esc(c.phone||'')} · ${esc(c.address||'')}</div>
        <div style="margin-top:15px;font-weight:800">Commandes du client</div>
        ${orders.length?orders.map(o=>`
          <div class="sgCustomerOrder">
            <div class="sgCustomerOrderTop"><strong>Commande #${o.id} · ${money(o.total)}</strong><span>${esc(o.status)}</span></div>
            <small>${date(o.created_at)} · ${esc(o.payment)}</small>
            <form class="sgCustomerForm" onsubmit="return sngAdminUpdateOrder(event,${Number(o.id)})">
              <select name="status">
                <option ${o.status==='Nouvelle'?'selected':''}>Nouvelle</option>
                <option ${o.status==='Confirmée'?'selected':''}>Confirmée</option>
                <option ${o.status==='En préparation'?'selected':''}>En préparation</option>
                <option ${o.status==='Expédiée'?'selected':''}>Expédiée</option>
                <option ${o.status==='Livrée'?'selected':''}>Livrée</option>
                <option ${o.status==='Annulée'?'selected':''}>Annulée</option>
              </select>
              <input name="tracking_code" value="${esc(o.tracking_code||'')}" placeholder="Numéro de suivi / référence livraison">
              <textarea name="customer_message" rows="2" placeholder="Message que le client verra dans son espace">${esc(o.customer_message||'')}</textarea>
              <div class="sgCustomerActions"><button class="sgCustomerBtn primary">Enregistrer et informer le client</button></div>
            </form>
          </div>`).join(''):`<div style="color:#8e9baa;padding:18px 0">Aucune commande liée à ce compte.</div>`}
      </div>`;
    document.body.appendChild(m);
  }

  window.sngAdminCustomer=customer;
  window.sngAdminCustomersLoad=load;
  window.sngAdminUpdateOrder=async(e,id)=>{
    e.preventDefault();const f=e.target;
    try{
      await api('/api/admin/orders/'+id+'/customer-update',{method:'PATCH',body:JSON.stringify({status:f.status.value,tracking_code:f.tracking_code.value,customer_message:f.customer_message.value})});
      alert('Les informations de la commande ont été mises à jour.');
      f.closest('.sgCustomerModal')?.remove();
      load();
      if(typeof loadOrders==='function')loadOrders();
    }catch(x){alert(x.message)}
    return false;
  };

  function mount(){
    if(!document.getElementById('adminBox')||document.getElementById('adminBox').classList.contains('hidden'))return;
    injectStyles();mountNavButton();
    if(document.getElementById('sgCustomerSection'))return;
    const main=document.getElementById('adminBox');
    const section=document.createElement('section');
    section.id='sgCustomerSection';section.className='sgCustomerSection';
    section.innerHTML='<div style="color:#8e9baa">Chargement des comptes clients…</div>';
    main.appendChild(section);load();
  }

  const observer=new MutationObserver(mount);
  observer.observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['class']});
  document.addEventListener('DOMContentLoaded',mount);
  setInterval(()=>{if(document.getElementById('adminBox')&&!document.getElementById('adminBox').classList.contains('hidden')){mountNavButton();load()}},30000);
})();