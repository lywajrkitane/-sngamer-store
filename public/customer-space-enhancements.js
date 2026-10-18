(function(){
  'use strict';
  const nativeFetch = window.fetch.bind(window);
  let hiddenIdsPromise = null;

  async function hiddenIds(){
    if(!hiddenIdsPromise){
      hiddenIdsPromise = nativeFetch('/api/customer/hidden-orders',{credentials:'same-origin'})
        .then(r=>r.ok?r.json():{orderIds:[]})
        .then(d=>new Set((d.orderIds||[]).map(Number)))
        .catch(()=>new Set());
    }
    return hiddenIdsPromise;
  }

  window.fetch = async function(input, init){
    const request = input instanceof Request ? input : null;
    const url = typeof input === 'string' ? input : input?.url || '';
    const method = String(init?.method || request?.method || 'GET').toUpperCase();
    const response = await nativeFetch(input, init);

    if(method !== 'GET' || !url.includes('/api/customer/orders') || url.includes('/api/customer/hidden-orders')) return response;
    try{
      const data = await response.clone().json();
      if(!Array.isArray(data)) return response;
      const ids = await hiddenIds();
      const filtered = data.filter(order=>!ids.has(Number(order.id)));
      const headers = new Headers(response.headers);
      headers.set('Content-Type','application/json');
      return new Response(JSON.stringify(filtered),{status:response.status,statusText:response.statusText,headers});
    }catch(_){ return response; }
  };

  function fillCheckout(customer){
    if(!customer) return;
    const values={
      '#name':customer.name||'',
      '#phone':customer.phone||'',
      '#addr':customer.address||''
    };
    Object.entries(values).forEach(([selector,value])=>{
      const el=document.querySelector(selector);
      if(el && !String(el.value||'').trim() && value){
        el.value=value;
        el.dispatchEvent(new Event('input',{bubbles:true}));
        el.dispatchEvent(new Event('change',{bubbles:true}));
      }
    });
  }

  async function loadCustomer(){
    try{
      const r=await nativeFetch('/api/customer/me',{credentials:'same-origin'});
      if(!r.ok) return null;
      const d=await r.json();
      return d.customer||null;
    }catch(_){return null;}
  }

  function addDeleteButtons(){
    document.querySelectorAll('.sgaOrder').forEach(card=>{
      if(card.querySelector('.sgaDeleteOrder')) return;
      const strong=card.querySelector('.sgaOrderTop strong');
      const match=strong?.textContent?.match(/#(\d+)/);
      if(!match) return;
      const id=Number(match[1]);
      const actions=document.createElement('div');
      actions.className='sgaActions';
      actions.innerHTML='<button type="button" class="sgaBtn alt sgaDeleteOrder" style="border-color:rgba(225,59,85,.45);color:#ff9baa">🗑️ Supprimer de mon espace</button>';
      actions.querySelector('button').addEventListener('click',async()=>{
        const ok=window.confirm('Supprimer la commande #'+id+' de votre espace client ?\n\nCette action retire uniquement la commande de votre historique personnel. Elle ne supprime pas la commande du système SNGAMER STORE.');
        if(!ok) return;
        try{
          const r=await nativeFetch('/api/customer/orders/'+encodeURIComponent(id)+'/hide',{method:'DELETE',credentials:'same-origin',headers:{'Content-Type':'application/json'}});
          const d=await r.json().catch(()=>({}));
          if(!r.ok) throw new Error(d.error||'Impossible de supprimer la commande.');
          hiddenIdsPromise=null;
          if(typeof window.sngRefreshAccount==='function') await window.sngRefreshAccount();
        }catch(e){window.alert(e.message||'Impossible de supprimer la commande.');}
      });
      card.appendChild(actions);
    });
  }

  function installAccountEnhancements(){
    if(typeof window.sngRefreshAccount!=='function') return false;
    if(window.__sngCustomerEnhancementsInstalled) return true;
    window.__sngCustomerEnhancementsInstalled=true;

    const originalRefresh=window.sngRefreshAccount;
    window.sngRefreshAccount=async function(){
      const result=await originalRefresh.apply(this,arguments);
      setTimeout(addDeleteButtons,30);
      return result;
    };

    const observer=new MutationObserver(()=>{
      addDeleteButtons();
      const profile=document.querySelector('#profileArea');
      if(profile && profile.offsetParent!==null) loadCustomer().then(fillCheckout);
    });
    observer.observe(document.body,{childList:true,subtree:true});

    loadCustomer().then(fillCheckout);
    setInterval(()=>{
      if(document.querySelector('#checkout')) loadCustomer().then(fillCheckout);
      addDeleteButtons();
    },1500);
    return true;
  }

  const boot=()=>{if(!installAccountEnhancements()) setTimeout(boot,250);};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
