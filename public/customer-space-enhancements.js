(function(){
'use strict';

/* =========================
   SNGAMER PREMIUM DIALOGS
   ========================= */
function installPremiumDialogs(){
  if(window.__sngPremiumDialogsInstalled)return;
  window.__sngPremiumDialogsInstalled=true;
  const css=`
.sngPremiumOverlay{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(2,7,18,.72);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);opacity:0;visibility:hidden;transition:opacity .22s ease,visibility .22s ease;box-sizing:border-box}
.sngPremiumOverlay.show{opacity:1;visibility:visible}
.sngPremiumModal{width:min(100%,430px);border:1px solid rgba(92,155,255,.28);border-radius:24px;background:linear-gradient(145deg,rgba(13,25,45,.98),rgba(22,12,42,.98));box-shadow:0 25px 80px rgba(0,0,0,.55),0 0 35px rgba(76,120,255,.14);overflow:hidden;transform:translateY(16px) scale(.97);transition:transform .24s cubic-bezier(.2,.8,.2,1);font-family:inherit;color:#fff}
.sngPremiumOverlay.show .sngPremiumModal{transform:translateY(0) scale(1)}
.sngPremiumTop{display:flex;align-items:center;gap:13px;padding:20px 20px 14px}
.sngPremiumIcon{width:46px;height:46px;flex:0 0 46px;border-radius:15px;display:flex;align-items:center;justify-content:center;font-size:22px;background:linear-gradient(135deg,#287cff,#873cf2);box-shadow:0 8px 24px rgba(68,110,255,.3)}
.sngPremiumModal.danger .sngPremiumIcon{background:linear-gradient(135deg,#ff416c,#8b2cff)}
.sngPremiumTitle{font-size:18px;font-weight:900;line-height:1.2}
.sngPremiumBody{padding:0 20px 20px;color:#aebbd0;font-size:14px;line-height:1.6;white-space:pre-line}
.sngPremiumActions{display:flex;gap:10px;padding:14px 20px 20px;border-top:1px solid rgba(255,255,255,.07)}
.sngPremiumBtn{appearance:none;border:1px solid rgba(112,150,210,.22);border-radius:14px;padding:12px 16px;min-height:46px;font:inherit;font-weight:850;cursor:pointer;flex:1;color:#fff;background:rgba(255,255,255,.055);transition:transform .16s ease,filter .16s ease,background .16s ease}
.sngPremiumBtn:active{transform:scale(.98)}
.sngPremiumBtn.primary{border-color:transparent;background:linear-gradient(135deg,#287cff,#873cf2);box-shadow:0 8px 22px rgba(64,103,255,.25)}
.sngPremiumBtn.danger{border-color:transparent;background:linear-gradient(135deg,#e83e63,#8b35e8);box-shadow:0 8px 22px rgba(204,53,116,.22)}
@media(max-width:430px){.sngPremiumOverlay{padding:14px}.sngPremiumModal{border-radius:21px}.sngPremiumTop{padding:18px 17px 12px}.sngPremiumBody{padding:0 17px 18px}.sngPremiumActions{padding:13px 17px 17px}.sngPremiumBtn{padding:11px 12px;font-size:13px}}
`;
  const style=document.createElement('style');style.id='sngPremiumDialogsStyle';style.textContent=css;document.head.appendChild(style);
  function openDialog(message,opts){
    opts=opts||{};
    return new Promise(resolve=>{
      const overlay=document.createElement('div');overlay.className='sngPremiumOverlay';
      const modal=document.createElement('div');modal.className='sngPremiumModal'+(opts.danger?' danger':'');modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');
      const title=opts.title||'SNGAMER STORE';
      const icon=opts.icon||'✓';
      const cancel=opts.cancelText||'Annuler';
      const confirm=opts.confirmText||'OK';
      const isConfirm=opts.confirmMode===true;
      modal.innerHTML='<div class="sngPremiumTop"><div class="sngPremiumIcon">'+icon+'</div><div class="sngPremiumTitle">'+escapeHtml(title)+'</div></div><div class="sngPremiumBody">'+escapeHtml(String(message||''))+'</div><div class="sngPremiumActions">'+(isConfirm?'<button type="button" class="sngPremiumBtn cancel">'+escapeHtml(cancel)+'</button>':'')+'<button type="button" class="sngPremiumBtn '+(opts.danger?'danger':'primary')+' confirm">'+escapeHtml(confirm)+'</button></div>';
      overlay.appendChild(modal);document.body.appendChild(overlay);
      const close=value=>{overlay.classList.remove('show');setTimeout(()=>overlay.remove(),220);resolve(value);};
      modal.querySelector('.confirm').addEventListener('click',()=>close(true));
      modal.querySelector('.cancel')?.addEventListener('click',()=>close(false));
      overlay.addEventListener('click',e=>{if(e.target===overlay&&isConfirm)close(false);});
      document.addEventListener('keydown',function key(e){if(e.key==='Escape'){document.removeEventListener('keydown',key);close(false);}}, {once:true});
      requestAnimationFrame(()=>overlay.classList.add('show'));
      setTimeout(()=>modal.querySelector('.confirm')?.focus(),80);
    });
  }
  function escapeHtml(value){return value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
  window.sngPremiumAlert=function(message,opts){return openDialog(message,Object.assign({title:'Information',icon:'✓',confirmText:'Compris'},opts||{}));};
  window.sngPremiumConfirm=function(message,opts){return openDialog(message,Object.assign({title:'Confirmation',icon:'⚠️',confirmText:'Confirmer',cancelText:'Annuler',confirmMode:true},opts||{}));};
  const nativeAlert=window.alert;
  window.__sngNativeAlert=nativeAlert;
  window.alert=function(message){window.sngPremiumAlert(String(message||''),{title:'SNGAMER STORE',icon:'✦',confirmText:'OK'});};
}
installPremiumDialogs();

const nativeFetch=window.fetch.bind(window);
let hiddenIdsPromise=null;async function hiddenIds(){if(!hiddenIdsPromise){hiddenIdsPromise=nativeFetch('/api/customer/hidden-orders',{credentials:'same-origin'}).then(r=>r.ok?r.json():{orderIds:[]}).then(d=>new Set((d.orderIds||[]).map(Number))).catch(()=>new Set());}return hiddenIdsPromise;}
window.fetch=async function(input,init){const request=input instanceof Request?input:null;const url=typeof input==='string'?input:input?.url||'';const method=String(init?.method||request?.method||'GET').toUpperCase();const response=await nativeFetch(input,init);if(method!=='GET'||!url.includes('/api/customer/orders')||url.includes('/api/customer/hidden-orders'))return response;try{const data=await response.clone().json();if(!Array.isArray(data))return response;const ids=await hiddenIds();const filtered=data.filter(order=>!ids.has(Number(order.id)));const headers=new Headers(response.headers);headers.set('Content-Type','application/json');return new Response(JSON.stringify(filtered),{status:response.status,statusText:response.statusText,headers});}catch(_){return response;}};
function fillCheckout(customer){if(!customer)return;const values={'#name':customer.name||'','#phone':customer.phone||'','#addr':customer.address||''};Object.entries(values).forEach(([selector,value])=>{const el=document.querySelector(selector);if(el&&!String(el.value||'').trim()&&value){el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}});}
async function loadCustomer(){try{const r=await nativeFetch('/api/customer/me',{credentials:'same-origin'});if(!r.ok)return null;const d=await r.json();return d.customer||null;}catch(_){return null;}}
function addDeleteButtons(){document.querySelectorAll('.sgaOrder').forEach(card=>{if(card.querySelector('.sgaDeleteOrder'))return;const strong=card.querySelector('.sgaOrderTop strong');const match=strong?.textContent?.match(/#(\d+)/);if(!match)return;const id=Number(match[1]);const actions=document.createElement('div');actions.className='sgaActions';actions.innerHTML='<button type="button" class="sgaBtn alt sgaDeleteOrder" style="border-color:rgba(225,59,85,.45);color:#ff9baa">🗑️ Supprimer de mon espace</button>';actions.querySelector('button').addEventListener('click',async()=>{const ok=await window.sngPremiumConfirm('Cette action retire uniquement la commande de votre historique personnel. Elle ne supprime pas la commande du système SNGAMER STORE.',{title:'Supprimer de mon espace',icon:'🗑️',confirmText:'Supprimer',cancelText:'Annuler',danger:true});if(!ok)return;try{const r=await nativeFetch('/api/customer/orders/'+encodeURIComponent(id)+'/hide',{method:'DELETE',credentials:'same-origin',headers:{'Content-Type':'application/json'}});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Impossible de supprimer la commande.');hiddenIdsPromise=null;if(typeof window.sngRefreshAccount==='function')await window.sngRefreshAccount();}catch(e){window.sngPremiumAlert(e.message||'Impossible de supprimer la commande.',{title:'Action impossible',icon:'⚠️',confirmText:'Fermer'});}});card.appendChild(actions);});}
function installAccountEnhancements(){if(typeof window.sngRefreshAccount!=='function')return false;if(window.__sngCustomerEnhancementsInstalled)return true;window.__sngCustomerEnhancementsInstalled=true;const originalRefresh=window.sngRefreshAccount;window.sngRefreshAccount=async function(){const result=await originalRefresh.apply(this,arguments);setTimeout(addDeleteButtons,30);return result;};const observer=new MutationObserver(()=>{addDeleteButtons();const profile=document.querySelector('#profileArea');if(profile&&profile.offsetParent!==null)loadCustomer().then(fillCheckout);});observer.observe(document.body,{childList:true,subtree:true});loadCustomer().then(fillCheckout);setInterval(()=>{if(document.querySelector('#checkout'))loadCustomer().then(fillCheckout);addDeleteButtons();},10000);return true;}
const boot=()=>{if(!installAccountEnhancements())setTimeout(boot,250);};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
