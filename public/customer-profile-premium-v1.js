(function(){
  'use strict';
  if(window.__sngCustomerProfilePremiumV1)return;
  window.__sngCustomerProfilePremiumV1=true;

  const nativeFetch=window.fetch.bind(window);
  let ordersCache=null;
  let customerCache=null;

  const css=`
    .sngProfileAvatarPremium{position:relative;width:82px;height:82px;flex:0 0 82px;border-radius:24px;overflow:hidden;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#287cff,#873cf2);box-shadow:0 10px 30px rgba(65,100,255,.28);cursor:pointer;border:1px solid rgba(255,255,255,.12)}
    .sngProfileAvatarPremium img{width:100%;height:100%;object-fit:cover;display:block}
    .sngProfileAvatarPremiumInitial{font-size:34px;font-weight:950;color:#fff}
    .sngProfileAvatarCamera{position:absolute;right:4px;bottom:4px;width:27px;height:27px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#ff3f8e,#9b3df5);border:2px solid #101a2a;color:#fff;font-size:13px;box-shadow:0 4px 12px rgba(0,0,0,.35)}
    .sngProfilePhotoHint{margin-top:7px;font-size:10px;font-weight:800;color:#8195af;letter-spacing:.2px}
    .sngProfileOrderPublicTitle{display:inline-block}
    .sngProfileOrderInternalId{display:none!important}
    .sngProfilePhotoInput{display:none!important}
    .sngProfilePhotoBusy{opacity:.65;pointer-events:none}
    .sngProfilePhotoToast{position:fixed;left:18px;right:18px;bottom:92px;z-index:100001;padding:13px 15px;border-radius:15px;background:rgba(8,17,31,.98);border:1px solid rgba(255,79,151,.38);box-shadow:0 12px 35px rgba(0,0,0,.45);color:#fff;font-size:13px;font-weight:800;text-align:center;opacity:0;transform:translateY(12px);transition:.22s ease;pointer-events:none}
    .sngProfilePhotoToast.show{opacity:1;transform:translateY(0)}
    @media(max-width:600px){.sngProfileAvatarPremium{width:76px;height:76px;flex-basis:76px;border-radius:22px}.sngProfileAvatarCamera{width:25px;height:25px;border-radius:9px;font-size:12px}}
  `;

  function installStyles(){
    if(document.getElementById('sngCustomerProfilePremiumStyles'))return;
    const style=document.createElement('style');
    style.id='sngCustomerProfilePremiumStyles';
    style.textContent=css;
    document.head.appendChild(style);
  }

  function toast(message){
    let el=document.getElementById('sngProfilePhotoToast');
    if(!el){el=document.createElement('div');el.id='sngProfilePhotoToast';el.className='sngProfilePhotoToast';document.body.appendChild(el);}
    el.textContent=message;
    requestAnimationFrame(()=>el.classList.add('show'));
    clearTimeout(window.__sngProfilePhotoToastTimer);
    window.__sngProfilePhotoToastTimer=setTimeout(()=>el.classList.remove('show'),3200);
  }

  async function getCustomer(){
    if(customerCache)return customerCache;
    try{const r=await nativeFetch('/api/customer/me',{credentials:'same-origin',cache:'no-store'});if(!r.ok)return null;const d=await r.json();customerCache=d.customer||null;return customerCache;}catch(_){return null;}
  }

  async function getOrders(){
    if(ordersCache)return ordersCache;
    try{const r=await nativeFetch('/api/customer/orders',{credentials:'same-origin',cache:'no-store'});if(!r.ok)return [];const d=await r.json();ordersCache=Array.isArray(d)?d:[];return ordersCache;}catch(_){return [];}
  }

  function shortName(value){
    const text=String(value||'').replace(/\s+/g,' ').trim();
    if(!text)return 'Votre achat';
    return text.length>27?text.slice(0,27).trimEnd()+'…':text;
  }

  function orderPublicTitle(order){
    const items=Array.isArray(order?.items)?order.items:[];
    if(!items.length)return 'Commande · Votre achat';
    const first=shortName(items[0]?.name||'Votre achat');
    if(items.length>1)return `Commande · ${first} + ${items.length-1}`;
    return `Commande · ${first}`;
  }

  function rewriteOrderTitles(orders){
    const map=new Map((orders||[]).map(o=>[Number(o.id),o]));
    document.querySelectorAll('#profileArea .sgaOrder').forEach(card=>{
      const strong=card.querySelector('.sgaOrderTop strong');
      if(!strong)return;
      const match=(strong.textContent||'').match(/#(\d+)/);
      const id=Number(card.getAttribute('data-order-id')||match?.[1]);
      if(!Number.isInteger(id)||id<=0)return;
      card.setAttribute('data-order-id',String(id));
      const order=map.get(id);
      if(!order)return;
      const publicTitle=orderPublicTitle(order);
      if(strong.dataset.sngPublicTitle===publicTitle)return;
      strong.dataset.sngPublicTitle=publicTitle;
      strong.innerHTML=`<span class="sngProfileOrderPublicTitle">${escapeHtml(publicTitle)}</span><span class="sngProfileOrderInternalId"> #${id}</span>`;
    });
  }

  function escapeHtml(text){return String(text??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}

  function hideHeaderContacts(profile,customer){
    if(!profile||!customer)return;
    const targets=[String(customer.email||'').trim(),String(customer.phone||'').trim()].filter(Boolean);
    profile.querySelectorAll('.sgaCard:first-child *').forEach(el=>{
      const text=(el.textContent||'').replace(/\s+/g,' ').trim();
      if(targets.some(value=>text===value))el.style.display='none';
    });
  }

  async function loadPhoto(){
    try{const r=await nativeFetch('/api/customer/profile-photo',{credentials:'same-origin',cache:'no-store'});if(!r.ok)return null;const blob=await r.blob();return URL.createObjectURL(blob);}catch(_){return null;}
  }

  function findAvatar(profile,customer){
    const initial=String(customer?.name||'W').trim().charAt(0).toUpperCase();
    const candidates=[...profile.querySelectorAll('.sgaCard:first-child *')].filter(el=>{
      if(el.children.length)return false;
      const text=(el.textContent||'').trim();
      if(text!==initial)return false;
      const r=el.getBoundingClientRect();
      return r.width>=35&&r.height>=35;
    });
    return candidates.sort((a,b)=>b.getBoundingClientRect().width-a.getBoundingClientRect().width)[0]||null;
  }

  function buildAvatar(profile,customer,photoUrl){
    const old=findAvatar(profile,customer);
    if(old&&old.dataset.sngAvatarPremium==='1')return old.closest('.sngProfileAvatarPremium')||old;
    let avatar=old?.closest('.sngProfileAvatarPremium');
    if(!avatar){
      avatar=document.createElement('div');
      avatar.className='sngProfileAvatarPremium';
      avatar.title='Changer ma photo de profil';
      if(old){old.replaceWith(avatar);}else{
        const nameNode=[...profile.querySelectorAll('.sgaCard:first-child *')].find(el=>el.children.length===0&&(el.textContent||'').trim()===String(customer?.name||''));
        if(nameNode?.parentElement)nameNode.parentElement.insertBefore(avatar,nameNode);
      }
    }
    avatar.innerHTML='';
    if(photoUrl){const img=document.createElement('img');img.src=photoUrl;img.alt='Photo de profil';avatar.appendChild(img);}else{const span=document.createElement('span');span.className='sngProfileAvatarPremiumInitial';span.textContent=String(customer?.name||'W').trim().charAt(0).toUpperCase();avatar.appendChild(span);}
    const camera=document.createElement('span');camera.className='sngProfileAvatarCamera';camera.textContent='📷';camera.setAttribute('aria-hidden','true');avatar.appendChild(camera);
    avatar.dataset.sngAvatarPremium='1';
    installPhotoPicker(avatar);
    return avatar;
  }

  function installPhotoPicker(avatar){
    if(!avatar||avatar.dataset.sngPickerInstalled==='1')return;
    avatar.dataset.sngPickerInstalled='1';
    const input=document.createElement('input');input.type='file';input.accept='image/jpeg,image/png,image/webp,image/gif';input.className='sngProfilePhotoInput';
    document.body.appendChild(input);
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
        const url=await loadPhoto();
        if(url){const oldImg=avatar.querySelector('img');if(oldImg)oldImg.src=url;else{avatar.querySelector('.sngProfileAvatarPremiumInitial')?.remove();const img=document.createElement('img');img.src=url;img.alt='Photo de profil';avatar.insertBefore(img,avatar.firstChild);}}
      }catch(error){toast(error.message||'Impossible de modifier la photo.');}
      finally{avatar.classList.remove('sngProfilePhotoBusy');}
    });
  }

  function compressImage(file){
    return new Promise((resolve,reject)=>{
      const url=URL.createObjectURL(file);const img=new Image();
      img.onload=()=>{URL.revokeObjectURL(url);const max=600;const scale=Math.min(1,max/Math.max(img.width,img.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,canvas.width,canvas.height);canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Compression impossible.')),'image/jpeg',.86);};
      img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Image invalide.'));};img.src=url;
    });
  }

  async function enhance(){
    const profile=document.getElementById('profileArea');
    if(!profile||profile.offsetParent===null)return;
    installStyles();
    const customer=await getCustomer();
    if(!customer)return;
    hideHeaderContacts(profile,customer);
    const photo=await loadPhoto();
    buildAvatar(profile,customer,photo);
    const orders=await getOrders();
    rewriteOrderTitles(orders);
  }

  const observer=new MutationObserver(()=>{clearTimeout(window.__sngProfileEnhanceTimer);window.__sngProfileEnhanceTimer=setTimeout(enhance,120);});
  const boot=()=>{const profile=document.getElementById('profileArea');if(profile)observer.observe(profile,{childList:true,subtree:true});enhance();setInterval(()=>{if(document.getElementById('profileArea'))enhance();},4000);};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
