/* SNGAMER STORE — Customer order tracking FINAL DOM reconciler
   This is intentionally loaded after the other customer-space enhancements.
   It owns only the tracking line and never replaces the customer's profile UI. */
(function(){
  'use strict';
  if(window.__sngCustomerOrderTrackingFinalV1)return;
  window.__sngCustomerOrderTrackingFinalV1=true;

  const STATES=['Nouvelle','Confirmée','En préparation','Expédiée','Livrée'];
  const LABELS=['Nouvelle','Confirmée','Préparation','Expédiée','Livrée'];
  let ordersPromise=null;

  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}

  function css(){
    if(document.getElementById('sngCustomerOrderTrackingFinalCss'))return;
    const style=document.createElement('style');
    style.id='sngCustomerOrderTrackingFinalCss';
    style.textContent=`
      .sngCustomerFinalTracking{margin:12px 0 0;padding:13px 9px 11px;border:1px solid rgba(74,145,255,.22);border-radius:14px;background:linear-gradient(135deg,rgba(8,22,40,.92),rgba(21,10,38,.82));box-sizing:border-box;width:100%;overflow:hidden}
      .sngCustomerFinalTracking *{box-sizing:border-box}
      .sngCustomerFinalTrackingHead{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px}
      .sngCustomerFinalTrackingTitle{font-size:12px;font-weight:900;color:#fff}
      .sngCustomerFinalTrackingStatus{font-size:10px;font-weight:900;color:#68b8ff;border:1px solid rgba(85,160,255,.24);background:rgba(48,120,255,.12);border-radius:999px;padding:4px 7px;white-space:nowrap}
      .sngCustomerFinalTrackingSteps{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:2px}
      .sngCustomerFinalTrackingStep{position:relative;min-width:0;text-align:center}
      .sngCustomerFinalTrackingStep:not(:last-child)::after{content:'';position:absolute;z-index:0;top:12px;left:50%;width:100%;height:2px;background:rgba(120,145,180,.22)}
      .sngCustomerFinalTrackingStep.done:not(:last-child)::after{background:linear-gradient(90deg,#25d68b,#4f9cff)}
      .sngCustomerFinalTrackingDot{position:relative;z-index:1;width:25px;height:25px;margin:0 auto 5px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#101b2b;border:2px solid rgba(130,155,190,.30);color:#8193aa;font-size:10px;font-weight:900}
      .sngCustomerFinalTrackingStep.done .sngCustomerFinalTrackingDot{background:linear-gradient(135deg,#167c57,#247cff);border-color:#50b9ff;color:#fff}
      .sngCustomerFinalTrackingStep.current .sngCustomerFinalTrackingDot{background:linear-gradient(135deg,#287bff,#873dff);border-color:#6fc1ff;color:#fff;box-shadow:0 0 13px rgba(68,135,255,.36)}
      .sngCustomerFinalTrackingLabel{font-size:8px;line-height:1.2;color:#71849d;font-weight:800;overflow-wrap:anywhere}
      .sngCustomerFinalTrackingStep.done .sngCustomerFinalTrackingLabel,.sngCustomerFinalTrackingStep.current .sngCustomerFinalTrackingLabel{color:#fff}
      .sngCustomerFinalTrackingNote{text-align:center;margin-top:9px;font-size:10px;color:#92a4ba}
      @media(min-width:601px){.sngCustomerFinalTracking{padding:15px 12px}.sngCustomerFinalTrackingLabel{font-size:10px}.sngCustomerFinalTrackingDot{width:28px;height:28px}.sngCustomerFinalTrackingStep:not(:last-child)::after{top:13px}}
    `;
    document.head.appendChild(style);
  }

  async function getOrders(){
    if(ordersPromise)return ordersPromise;
    ordersPromise=fetch('/api/customer/orders',{credentials:'same-origin',cache:'no-store'})
      .then(r=>r.ok?r.json():[])
      .then(rows=>Array.isArray(rows)?rows:[])
      .catch(()=>[]);
    return ordersPromise;
  }

  function normalizeStatus(value){
    const raw=String(value||'Nouvelle').trim();
    const n=raw.toLowerCase();
    if(raw==='Annulée'||n.includes('annul'))return 'Annulée';
    if(n.includes('livr'))return 'Livrée';
    if(n.includes('expédi'))return 'Expédiée';
    if(n.includes('prépar'))return 'En préparation';
    if(n.includes('confirm'))return 'Confirmée';
    return 'Nouvelle';
  }

  function statusFromCard(card,order){
    const explicit=card.querySelector('.sgaOrderTop span,[data-order-status],[data-status],.order-status');
    if(explicit?.textContent?.trim())return normalizeStatus(explicit.textContent);
    return normalizeStatus(order?.status||'Nouvelle');
  }

  function orderId(card){
    const attr=card.getAttribute('data-order-id');
    if(/^\d+$/.test(String(attr||'')))return Number(attr);
    const text=card.textContent||'';
    const match=text.match(/Commande\s*#\s*(\d+)/i);
    return match?Number(match[1]):null;
  }

  function trackingHtml(status){
    const current=normalizeStatus(status);
    if(current==='Annulée')return `<div class="sngCustomerFinalTracking" data-sng-final-tracking="1"><div class="sngCustomerFinalTrackingHead"><span class="sngCustomerFinalTrackingTitle">📍 Suivi de la commande</span><span class="sngCustomerFinalTrackingStatus">Annulée</span></div><div class="sngCustomerFinalTrackingNote">Cette commande a été annulée.</div></div>`;
    const active=STATES.indexOf(current)<0?0:STATES.indexOf(current);
    const steps=STATES.map((state,i)=>{
      const done=i<=active;
      const currentStep=i===active;
      return `<div class="sngCustomerFinalTrackingStep ${done?'done':''} ${currentStep?'current':''}"><span class="sngCustomerFinalTrackingDot">${done?'✓':''}</span><span class="sngCustomerFinalTrackingLabel">${LABELS[i]}</span></div>`;
    }).join('');
    const note=active===4?'Votre commande a été livrée.':active===3?'Votre commande a été expédiée.':active===2?'Votre commande est en préparation.':active===1?'Votre commande a été confirmée.':'Votre commande a été enregistrée.';
    return `<div class="sngCustomerFinalTracking" data-sng-final-tracking="1" data-status="${esc(current)}"><div class="sngCustomerFinalTrackingHead"><span class="sngCustomerFinalTrackingTitle">📍 Suivi de la commande</span><span class="sngCustomerFinalTrackingStatus">${esc(current)}</span></div><div class="sngCustomerFinalTrackingSteps">${steps}</div><div class="sngCustomerFinalTrackingNote">${note}</div></div>`;
  }

  function findOrderCards(profile){
    const all=[...profile.querySelectorAll('[data-order-id],article,section,.sgaOrder,.order-card,.orderCard,.order-item')];
    const seen=new Set();
    return all.filter(card=>{
      if(seen.has(card))return false;
      const id=orderId(card);
      if(!id)return false;
      seen.add(card);
      return true;
    });
  }

  async function reconcile(){
    const profile=document.getElementById('profileArea');
    if(!profile||profile.hidden||profile.offsetParent===null)return;
    css();
    const orders=await getOrders();
    const map=new Map(orders.map(o=>[Number(o.id),o]));
    findOrderCards(profile).forEach(card=>{
      const id=orderId(card); if(!id)return;
      card.setAttribute('data-order-id',String(id));
      const order=map.get(id);
      const status=statusFromCard(card,order);
      let tracking=card.querySelector('[data-sng-final-tracking="1"],.sngOrderTracking,.sngTracking');
      if(!tracking){
        const anchor=card.querySelector('.sgaOrderMeta,.sngCustomerOrderNotice,.sgaOrderTop');
        if(anchor)anchor.insertAdjacentHTML('afterend',trackingHtml(status));
        else card.insertAdjacentHTML('beforeend',trackingHtml(status));
      }else if(tracking.dataset.sngFinalTracking!=='1'){
        tracking.outerHTML=trackingHtml(status);
      }else if(normalizeStatus(tracking.dataset.status)!==status){
        tracking.outerHTML=trackingHtml(status);
      }
    });
  }

  function boot(){
    css();
    const profile=document.getElementById('profileArea');
    if(!profile)return;
    const observer=new MutationObserver(()=>{
      clearTimeout(window.__sngCustomerFinalTrackingTimer);
      window.__sngCustomerFinalTrackingTimer=setTimeout(reconcile,80);
    });
    observer.observe(profile,{childList:true,subtree:true});
    [0,150,500,1200,2500,5000].forEach(d=>setTimeout(reconcile,d));
    setInterval(()=>{ordersPromise=null;reconcile();},5000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
