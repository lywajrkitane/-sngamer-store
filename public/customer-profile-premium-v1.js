(function(){
  'use strict';
  if(window.__sngCustomerProfilePremiumV2)return;
  window.__sngCustomerProfilePremiumV2=true;

  const nativeFetch=window.fetch.bind(window);
  let ordersCache=null;
  let customerCache=null;
  let photoLoaded=false;
  let photoUrlCache=null;
  let enhancing=false;
  let observer=null;

  const css=`
    .sngProfileIdentity{display:flex;align-items:center;gap:14px;margin-top:12px;min-width:0}
    .sngProfileAvatarPremium{position:relative;width:82px;height:82px;flex:0 0 82px;border-radius:24px;overflow:hidden;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#287cff,#873cf2);box-shadow:0 10px 30px rgba(65,100,255,.28);cursor:pointer;border:1px solid rgba(255,255,255,.12)}
    .sngProfileAvatarPremium img{width:100%;height:100%;object-fit:cover;display:block}
    .sngProfileAvatarPremiumInitial{font-size:34px;font-weight:950;color:#fff}
    .sngProfileAvatarCamera{position:absolute;right:4px;bottom:4px;width:27px;height:27px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#ff3f8e,#9b3df5);border:2px solid #101a2a;color:#fff;font-size:13px;box-shadow:0 4px 12px rgba(0,0,0,.35)}
    .sngProfilePhotoInput{display:none!important}
    .sngProfilePhotoBusy{opacity:.65;pointer-events:none}
    .sngProfilePhotoToast{position:fixed;left:18px;right:18px;bottom:92px;z-index:100001;padding:13px 15px;border-radius:15px;background:rgba(8,17,31,.98);border:1px solid rgba(255,79,151,.38);box-shadow:0 12px 35px rgba(0,0,0,.45);color:#fff;font-size:13px;font-weight:800;text-align:center;opacity:0;transform:translateY(12px);transition:.22s ease;pointer-events:none}
    .sngProfilePhotoToast.show{opacity:1;transform:translateY(0)}
    .sngCustomerOrderNotice{margin:10px 0 0;padding:11px 12px;border-radius:11px;background:linear-gradient(145deg,rgba(36,89,160,.12),rgba(117,61,210,.09));border:1px solid rgba(82,137,255,.22);color:#e9f1ff;font-size:12px;line-height:1.5}
    .sngCustomerOrderNoticeTitle{display:block;margin-bottom:4px;color:#8db8ff;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.08em}
    .sngCustomerOrderTracking{display:block;margin-top:8px;color:#9eabc0;font-size:11px}
    .sngCustomerOrderTracking b{color:#fff}
    @media(max-width:600px){.sngProfileIdentity{gap:12px}.sngProfileAvatarPremium{width:76px;height:76px;flex-basis:76px;border-radius:22px}.sngProfileAvatarCamera{width:25px;height:25px;border-radius:9px;font-size:12px}}
  `;

  function installStyles(){if(document.getElementById('sngCustomerProfilePremiumStyles'))return;const style=document.createElement('style');style.id='sngCustomerProfilePremiumStyles';style.textContent=css;document.head.appendChild(style);}
  function toast(message){let el=document.getElementById('sngProfilePhotoToast');if(!el){el=document.createElement('div');el.id='sngProfilePhotoToast';el.className='sngProfilePhotoToast';document.body.appendChild(el);}el.textContent=message;requestAnimationFrame(()=>el.classList.add('show'));clearTimeout(window.__sngProfilePhotoToastTimer);window.__sngProfilePhotoToastTimer=setTimeout(()=>el.classList.remove('show'),3200);}
  async function getCustomer(){if(customerCache)return customerCache;try{const r=await nativeFetch('/api/customer/me',{credentials:'same-origin',cache:'no-store'});if(!r.ok)return null;const d=await r.json();customerCache=d.customer||null;return customerCache;}catch(_){return null;}}
  async function getOrders(forceRefresh=false){if(ordersCache&&!forceRefresh)return ordersCache;try{const r=await nativeFetch('/api/customer/orders',{credentials:'same-origin',cache:'no-store'});if(!r.ok)return ordersCache||[];const d=await r.json();ordersCache=Array.isArray(d)?d:[];return ordersCache;}catch(_){return ordersCache||[];}}
  function shortName(value){const text=String(value||'').replace(/\s+/g,' ').trim();if(!text)return 'Votre achat';return text.length>27?text.slice(0,27).trimEnd()+'…':text;}
  function orderPublicTitle(order){const items=Array.isArray(order?.items)?order.items:[];if(!items.length)return 'Commande · Votre achat';const first=shortName(items[0]?.name||'Votre achat');if(items.length>1)return `Commande · ${first} + ${items.length-1}`;return `Commande · ${first}`;}
  function rewriteOrderTitles(orders){const map=new Map((orders||[]).map(o=>[Number(o.id),o]));document.querySelectorAll('#profileArea .sgaOrder').forEach(card=>{const strong=card.querySelector('.sgaOrderTop strong');if(!strong)return;const match=(strong.textContent||'').match(/#(\d+)/);const id=Number(card.getAttribute('data-order-id')||match?.[1]);if(!Number.isInteger(id)||id<=0)return;card.setAttribute('data-order-id',String(id));const order=map.get(id);if(!order)return;const publicTitle=orderPublicTitle(order);if(strong.dataset.sngPublicTitle===publicTitle)return;strong.dataset.sngPublicTitle=publicTitle;strong.innerHTML=`<span class="sngProfileOrderPublicTitle">${escapeHtml(publicTitle)}</span><span class="sngProfileOrderInternalId"> #${id}</span>`;});}

  function renderOrderNotices(orders){
    const map=new Map((orders||[]).map(o=>[Number(o.id),o]));
    document.querySelectorAll('#profileArea .sgaOrder').forEach(card=>{
      const id=Number(card.getAttribute('data-order-id')||((card.querySelector('.sgaOrderTop')?.textContent||'').match(/#(\d+)/)?.[1]||0));
      const order=map.get(id);if(!order)return;
      card.setAttribute('data-order-id',String(id));
      const existing=card.querySelector('[data-sng-customer-order-notice="1"]');
      const message=String(order.customer_message||'').trim();
      const tracking=String(order.tracking_code||'').trim();
      if(!message&&!tracking){existing?.remove();return;}
      const html=`<div class="sngCustomerOrderNotice" data-sng-customer-order-notice="1">${message?`<span class="sngCustomerOrderNoticeTitle">Message de la boutique</span><div>${escapeHtml(message).replace(/\n/g,'<br>')}</div>`:''}${tracking?`<span class="sngCustomerOrderTracking">Suivi / référence : <b>${escapeHtml(tracking)}</b></span>`:''}</div>`;
      if(existing){if(existing.outerHTML!==html)existing.outerHTML=html;return;}
      const top=card.querySelector('.sgaOrderTop');
      if(top)top.insertAdjacentHTML('afterend',html);else card.insertAdjacentHTML('afterbegin',html);
    });
  }

  function escapeHtml(text){return String(text??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}

  function hideHeaderContacts(profile,customer){
    if(!profile)return;
    profile.querySelectorAll('.sgaProfileHeader .sngProfileMeta,.sngProfileMeta').forEach(el=>el.remove());
    if(!customer)return;
    const targets=[String(customer.email||'').trim(),String(customer.phone||'').trim()].filter(Boolean);
    profile.querySelectorAll('.sgaCard:first-child *').forEach(el=>{
      const text=(el.textContent||'').replace(/\s+/g,' ').trim();
      if(targets.length&&targets.some(value=>text===value))el.remove();
    });
  }

  async function loadPhoto(){
    if(photoLoaded)return photoUrlCache;
    photoLoaded=true;
    try{
      const r=await nativeFetch('/api/customer/profile-photo',{credentials:'same-origin',cache:'no-store'});
      if(!r.ok){photoUrlCache=null;return null;}
      const blob=await r.blob();
      if(!blob.size){photoUrlCache=null;return null;}
      photoUrlCache=URL.createObjectURL(blob);
      return photoUrlCache;
    }catch(_){photoUrlCache=null;return null;}
  }

  function findOriginalAvatar(profile,customer){
    const explicit=profile.querySelector('[data-sng-profile-avatar-root="1"],.sngProfileAvatarPremium');
    if(explicit)return explicit;
    const initial=String(customer?.name||'W').trim().charAt(0).toUpperCase();
    const candidates=[...profile.querySelectorAll('.sgaCard:first-child *')].filter(el=>{
      if(el.closest('.sngProfileAvatarPremium'))return false;
      const text=(el.textContent||'').trim();
      if(text!==initial)return false;
      const r=el.getBoundingClientRect();
      return r.width>=35&&r.height>=35;
    });
    return candidates.sort((a,b)=>b.getBoundingClientRect().width-a.getBoundingClientRect().width)[0]||null;
  }

  function buildAvatar(profile,customer,photoUrl){
    let avatar=profile.querySelector('[data-sng-profile-avatar-root="1"]');
    if(!avatar)avatar=profile.querySelector('.sngProfileAvatarPremium');
    const old=findOriginalAvatar(profile,customer);
    if(!avatar){
      avatar=document.createElement('div');
      avatar.className='sngProfileAvatarPremium';
      avatar.setAttribute('data-sng-profile-avatar-root','1');
      avatar.title='Changer ma photo de profil';
      if(old)old.replaceWith(avatar);
      else{
        const header=profile.querySelector('.sgaProfileHeader');
        const nameNode=header?.querySelector('h2');
        if(nameNode?.parentElement)nameNode.parentElement.insertBefore(avatar,nameNode);
        else header?.prepend(avatar);
      }
    }else{
      avatar.classList.add('sngProfileAvatarPremium');
      avatar.setAttribute('data-sng-profile-avatar-root','1');
    }
    updateAvatarImage(avatar,photoUrl,customer);
    installPhotoPicker(avatar);
    return avatar;
  }

  function updateAvatarImage(avatar,photoUrl,customer){
    const desiredPhoto=photoUrl||'';
    const initial=String(customer?.name||'W').trim().charAt(0).toUpperCase();
    const currentImage=avatar.querySelector('img');
    const currentInitial=avatar.querySelector('.sngProfileAvatarPremiumInitial');
    const hasCamera=Boolean(avatar.querySelector('.sngProfileAvatarCamera'));
    const alreadyCorrect=avatar.dataset.sngAvatarPremium==='1'&&(avatar.dataset.sngPhotoUrl||'')===desiredPhoto&&hasCamera&&(desiredPhoto?Boolean(currentImage):Boolean(currentInitial&&currentInitial.textContent===initial));
    if(alreadyCorrect)return;
    avatar.replaceChildren();
    if(desiredPhoto){const img=document.createElement('img');img.src=desiredPhoto;img.alt='Photo de profil';img.loading='eager';avatar.appendChild(img);}else{const span=document.createElement('span');span.className='sngProfileAvatarPremiumInitial';span.textContent=initial;avatar.appendChild(span);}
    const camera=document.createElement('span');camera.className='sngProfileAvatarCamera';camera.textContent='📷';camera.setAttribute('aria-hidden','true');avatar.appendChild(camera);
    avatar.dataset.sngPhotoUrl=desiredPhoto;avatar.dataset.sngAvatarPremium='1';
  }

  function installPhotoPicker(avatar){
    if(!avatar||avatar.dataset.sngPickerInstalled==='1')return;
    avatar.dataset.sngPickerInstalled='1';
    let input=document.querySelector('input[data-sng-profile-input="1"]');
    if(!input){input=document.createElement('input');input.type='file';input.accept='image/jpeg,image/png,image/webp,image/gif';input.className='sngProfilePhotoInput';input.dataset.sngProfileInput='1';document.body.appendChild(input);}
    avatar.addEventListener('click',()=>input.click());
    input.addEventListener('change',async()=>{
      const file=input.files?.[0];input.value='';if(!file)return;
      try{
        avatar.classList.add('sngProfilePhotoBusy');
        const compressed=await compressImage(file);
        const form=new FormData();form.append('photo',compressed,'profile.jpg');
        const r=await nativeFetch('/api/customer/profile-photo',{method:'POST',body:form,credentials:'same-origin'});
        const d=await r.json().catch(()=>({}));
        if(!r.ok)throw new Error(d.error||'Impossible d’enregistrer la photo.');
        toast('✓ Photo de profil mise à jour');
        const previousPhotoUrl=photoUrlCache;photoLoaded=false;photoUrlCache=null;
        const url=await loadPhoto();
        if(url){updateAvatarImage(avatar,url,customerCache||{});if(previousPhotoUrl)URL.revokeObjectURL(previousPhotoUrl);}
      }catch(error){toast(error.message||'Impossible de modifier la photo.');}
      finally{avatar.classList.remove('sngProfilePhotoBusy');}
    });
  }

  function compressImage(file){return new Promise((resolve,reject)=>{const url=URL.createObjectURL(file);const img=new Image();img.onload=()=>{URL.revokeObjectURL(url);const max=600;const scale=Math.min(1,max/Math.max(img.width,img.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));const ctx=canvas.getContext('2d');if(!ctx)return reject(new Error('Compression impossible.'));ctx.drawImage(img,0,0,canvas.width,canvas.height);canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Compression impossible.')),'image/jpeg',.86);};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Image invalide.'));};img.src=url;});}

  async function enhance(forceOrdersRefresh=false){
    if(enhancing)return;const profile=document.getElementById('profileArea');if(!profile||profile.offsetParent===null)return;enhancing=true;
    try{
      if(observer)observer.disconnect();
      installStyles();
      const customer=await getCustomer();if(!customer)return;
      hideHeaderContacts(profile,customer);
      const photo=await loadPhoto();
      buildAvatar(profile,customer,photo);
      const orders=await getOrders(forceOrdersRefresh);
      rewriteOrderTitles(orders);renderOrderNotices(orders);
    }finally{enhancing=false;if(observer)observer.observe(profile,{childList:true,subtree:true});}
  }

  observer=new MutationObserver(()=>{if(enhancing)return;clearTimeout(window.__sngProfileEnhanceTimer);window.__sngProfileEnhanceTimer=setTimeout(enhance,180);});
  const boot=()=>{const profile=document.getElementById('profileArea');if(!profile)return;observer.observe(profile,{childList:true,subtree:true});enhance();setInterval(()=>{if(document.getElementById('profileArea'))enhance(true);},5000);};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
