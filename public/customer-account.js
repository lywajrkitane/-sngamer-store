(function(){
  'use strict';
  const state={customer:null,orders:[]};
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const money=v=>new Intl.NumberFormat('fr-FR').format(Number(v||0))+' FCFA';
  const date=v=>{try{return new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(v))}catch(_){return ''}};
  const firstName=n=>(String(n||'').trim().split(/\s+/)[0]||'Client');

  const ORDER_TRACKING_STEPS=[
    {key:'Nouvelle',label:'Commande',icon:'🛒'},
    {key:'Confirmée',label:'Confirmée',icon:'✓'},
    {key:'En préparation',label:'Préparation',icon:'📦'},
    {key:'Expédiée',label:'Expédiée',icon:'🚚'},
    {key:'Livrée',label:'Livrée',icon:'✓'}
  ];
  let accountPhotoObjectUrl=null;
  let accountTrackingBusy=false;
  function normalizeAccountOrderStatus(value){
    const raw=String(value||'Nouvelle').trim();
    const n=raw.toLowerCase();
    if(n.includes('annul'))return 'Annulée';
    if(n.includes('paiement')&&n.includes('expir'))return 'Paiement expiré';
    if(n.includes('paiement')&&(n.includes('échou')||n.includes('echec')))return 'Paiement échoué';
    if(n.includes('livr'))return 'Livrée';
    if(n.includes('expédi'))return 'Expédiée';
    if(n.includes('prépar'))return 'En préparation';
    if(n.includes('confirm'))return 'Confirmée';
    return 'Nouvelle';
  }
  function renderAccountOrderTracking(order){
    const raw=String(order?.status||'Nouvelle').trim();
    const status=normalizeAccountOrderStatus(raw);
    const head='<div class="sgaOrderTrackingHead"><span class="sgaOrderTrackingTitle">📍 Suivi de la commande</span><span class="sgaOrderTrackingStatus">'+esc(raw)+'</span></div>';
    if(status==='Annulée')return '<div class="sgaOrderTracking" data-status="'+esc(status)+'">'+head+'<div class="sgaOrderTrackingNote cancelled">Cette commande a été annulée.</div></div>';
    if(status==='Paiement expiré'||status==='Paiement échoué')return '<div class="sgaOrderTracking" data-status="'+esc(status)+'">'+head+'<div class="sgaOrderTrackingNote cancelled">'+(status==='Paiement expiré'?'Le délai de paiement a expiré.':'Le paiement a échoué.')+'</div></div>';
    let active=ORDER_TRACKING_STEPS.findIndex(step=>step.key===status);
    if(active<0)active=0;
    const steps=ORDER_TRACKING_STEPS.map((step,i)=>{
      const done=i<active,current=i===active;
      return '<div class="sgaOrderTrackingStep '+(done?'done ':'')+(current?'current':'')+'"><span class="sgaOrderTrackingDot">'+(done?'✓':step.icon)+'</span><span class="sgaOrderTrackingLabel">'+step.label+'</span></div>';
    }).join('');
    const note=active===4?'Votre commande a été livrée.':active===3?'Votre commande a été expédiée.':active===2?'Votre commande est en préparation.':active===1?'Votre commande a été confirmée.':'Votre commande a été enregistrée.';
    return '<div class="sgaOrderTracking" data-status="'+esc(status)+'">'+head+'<div class="sgaOrderTrackingSteps">'+steps+'</div><div class="sgaOrderTrackingNote">'+note+'</div></div>';
  }
  function fallbackAccountPhoto(){
    const profile=document.getElementById('profileArea');
    const image=profile?.querySelector('.sgaAvatarImage');
    const initial=profile?.querySelector('.sgaAvatarInitial');
    if(image){image.hidden=true;image.removeAttribute('src');}
    if(initial)initial.hidden=false;
  }
  async function loadAccountPhoto(){
    const profile=document.getElementById('profileArea');
    const image=profile?.querySelector('.sgaAvatarImage');
    const initial=profile?.querySelector('.sgaAvatarInitial');
    if(!image||!initial)return;
    try{
      const response=await fetch('/api/customer/profile-photo',{credentials:'same-origin',cache:'no-store'});
      if(!response.ok)throw new Error('Aucune photo enregistrée.');
      const blob=await response.blob();
      if(!blob.size)throw new Error('Photo vide.');
      const nextUrl=URL.createObjectURL(blob);
      const previousUrl=accountPhotoObjectUrl;
      accountPhotoObjectUrl=nextUrl;
      image.onload=()=>{image.hidden=false;initial.hidden=true;if(previousUrl)URL.revokeObjectURL(previousUrl);};
      image.onerror=()=>{fallbackAccountPhoto();if(previousUrl)URL.revokeObjectURL(previousUrl);};
      image.src=nextUrl;
    }catch(_){fallbackAccountPhoto();}
  }
  function compressAccountPhoto(file){
    return new Promise((resolve,reject)=>{
      const sourceUrl=URL.createObjectURL(file),image=new Image();
      image.onload=()=>{
        URL.revokeObjectURL(sourceUrl);
        const max=600,scale=Math.min(1,max/Math.max(image.width,image.height));
        const canvas=document.createElement('canvas');
        canvas.width=Math.max(1,Math.round(image.width*scale));
        canvas.height=Math.max(1,Math.round(image.height*scale));
        const context=canvas.getContext('2d');
        if(!context){reject(new Error('Compression de la photo impossible.'));return;}
        context.drawImage(image,0,0,canvas.width,canvas.height);
        canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Compression de la photo impossible.')),'image/jpeg',.86);
      };
      image.onerror=()=>{URL.revokeObjectURL(sourceUrl);reject(new Error('Le fichier sélectionné ne contient pas une image valide.'));};
      image.src=sourceUrl;
    });
  }
  function setupAccountPhotoPicker(){
    const input=document.getElementById('sgaProfilePhotoInput');
    if(input)input.onchange=async()=>{
      const file=input.files?.[0];input.value='';if(!file)return;
      const button=document.querySelector('#profileArea .sgaAvatar');
      try{
        if(button)button.disabled=true;
        const compressed=await compressAccountPhoto(file);
        const body=new FormData();body.append('photo',compressed,'profile.jpg');
        const response=await fetch('/api/customer/profile-photo',{method:'POST',body,credentials:'same-origin',cache:'no-store'});
        const data=await response.json().catch(()=>({}));
        if(!response.ok)throw new Error(data.error||'Impossible d’enregistrer la photo de profil.');
        await loadAccountPhoto();
        alert('Photo de profil mise à jour.');
      }catch(error){alert(error.message||'Impossible de modifier la photo de profil.');}
      finally{if(button)button.disabled=false;}
    };
    loadAccountPhoto();
  }
  window.sngPickProfilePhoto=function(){document.getElementById('sgaProfilePhotoInput')?.click();};
  async function refreshAccountTracking(){
    const profile=document.getElementById('profileArea');
    if(accountTrackingBusy||!profile||profile.hidden||profile.offsetParent===null||document.body.dataset.storeSection!=='profile')return;
    if(!profile.querySelector('.sgaOrder[data-order-id]'))return;
    accountTrackingBusy=true;
    try{
      const orders=await api('/api/customer/orders');
      if(!Array.isArray(orders))return;
      state.orders=orders;
      const byId=new Map(orders.map(order=>[Number(order.id),order]));
      profile.querySelectorAll('.sgaOrder[data-order-id]').forEach(card=>{
        const order=byId.get(Number(card.dataset.orderId));
        if(!order)return;
        const rawStatus=String(order.status||'Nouvelle').trim();
        const statusNode=card.querySelector('[data-current-order-status="1"]');
        if(statusNode&&statusNode.textContent!==rawStatus)statusNode.textContent=rawStatus;
        const normalized=normalizeAccountOrderStatus(rawStatus);
        const tracking=card.querySelector('.sgaOrderTracking');
        if(!tracking||tracking.dataset.status!==normalized){
          const html=renderAccountOrderTracking(order);
          if(tracking)tracking.outerHTML=html;
          else{
            const actions=card.querySelector('.sgaActions');
            if(actions)actions.insertAdjacentHTML('beforebegin',html);else card.insertAdjacentHTML('beforeend',html);
          }
        }
      });
    }catch(_){}finally{accountTrackingBusy=false;}
  }

  async function api(url,options={}){const r=await fetch(url,{credentials:'same-origin',headers:{'Content-Type':'application/json',...(options.headers||{})},...options});let d={};try{d=await r.json()}catch(_){}if(!r.ok)throw new Error(d.error||'Une erreur est survenue.');return d}
  function styles(){if(document.getElementById('sgAuthStyles'))return;const s=document.createElement('style');s.id='sgAuthStyles';s.textContent=`#profileArea.sga{display:block!important;width:100%;padding:0 0 36px}#products.sga-hide{display:none!important}.sgaWrap{max-width:760px;margin:auto;display:grid;gap:16px}.sgaCard{background:linear-gradient(145deg,#101d2f,#080e18);border:1px solid rgba(91,169,255,.25);border-radius:24px;padding:22px;color:#fff;box-shadow:0 16px 42px rgba(0,0,0,.2)}.sgaHero{text-align:center;padding:30px 20px}.sgaLogo{width:64px;height:64px;border-radius:20px;display:grid;place-items:center;margin:0 auto 15px;background:linear-gradient(135deg,#168bff,#a72be8);font-size:27px;font-weight:900}.sgaTitle{margin:0;font-size:30px;font-weight:900}.sgaSub{color:#94a6bd;line-height:1.55;font-size:13px;margin:9px auto 0;max-width:560px}.sgaForm{display:grid;gap:11px;margin-top:18px}.sgaForm input{width:100%;padding:13px 14px;border-radius:13px;border:1px solid #2b4059;background:#09111d;color:#fff;outline:none}.sgaBtn{border:0;border-radius:13px;padding:13px 16px;background:linear-gradient(135deg,#247fff,#a72be8);color:#fff;font-weight:900;cursor:pointer}.sgaBtn.alt{background:#17263a;border:1px solid #30445c}.sgaBtn.danger{background:linear-gradient(135deg,#b51f45,#e13b55)}.sgaTabs{display:grid;grid-template-columns:1fr 1fr;gap:7px;padding:5px;border-radius:15px;background:#08111d}.sgaTabs button{border:0;border-radius:11px;padding:11px;background:transparent;color:#8ea1b9;font-weight:900}.sgaTabs button.on{background:linear-gradient(135deg,#1b7fff,#9b2ce9);color:#fff}.sgaError{color:#ff8d98;font-size:12px;text-align:center;min-height:18px}.sgaHead{display:flex;align-items:center;justify-content:space-between;gap:12px}.sgaHead h2{margin:0;font-size:22px}.sgaSmall{color:#8da0b8;font-size:11px}.sgaIdentity{display:flex;align-items:center;gap:12px;margin-top:16px;min-width:0}.sgaAvatar{appearance:none;position:relative;width:58px;height:58px;flex:0 0 58px;padding:0;border:1px solid rgba(255,255,255,.22);border-radius:18px;display:grid;place-items:center;overflow:hidden;background:linear-gradient(135deg,#168bff,#a72be8);color:#fff;font-weight:900;font-size:22px;cursor:pointer}.sgaAvatar:disabled{opacity:.65;cursor:wait}.sgaAvatarImage{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}.sgaAvatarImage[hidden]{display:none!important}.sgaAvatarInitial{position:relative;z-index:1}.sgaAvatarCamera{position:absolute;right:3px;bottom:3px;z-index:2;width:20px;height:20px;border-radius:7px;display:grid;place-items:center;background:#101b2b;border:1px solid rgba(255,255,255,.32);font-size:11px;line-height:1}.sgaPhotoInput{display:none!important}.sgaStatGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:17px}.sgaStat{background:#09111d;border:1px solid #20344b;border-radius:15px;padding:13px;text-align:center}.sgaStat b{display:block;font-size:19px}.sgaStat span{display:block;color:#7f91aa;font-size:9px;text-transform:uppercase;margin-top:4px}.sgaOrder{padding:14px;border:1px solid #20344b;border-radius:16px;background:#09111d;margin-top:10px}.sgaOrderTracking{display:block;margin-top:12px;padding:13px 9px 11px;border:1px solid rgba(74,145,255,.24);border-radius:14px;background:linear-gradient(135deg,rgba(8,22,40,.92),rgba(21,10,38,.82));box-sizing:border-box;width:100%;overflow:hidden}.sgaOrderTrackingHead{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px}.sgaOrderTrackingTitle{font-size:12px;font-weight:900;color:#fff}.sgaOrderTrackingStatus{font-size:10px;font-weight:900;color:#68b8ff;border:1px solid rgba(85,160,255,.24);background:rgba(48,120,255,.12);border-radius:999px;padding:4px 7px;white-space:nowrap}.sgaOrderTrackingSteps{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:2px}.sgaOrderTrackingStep{position:relative;min-width:0;text-align:center}.sgaOrderTrackingStep:not(:last-child)::after{content:'';position:absolute;z-index:0;top:12px;left:50%;width:100%;height:2px;background:rgba(120,145,180,.22)}.sgaOrderTrackingStep.done:not(:last-child)::after{background:linear-gradient(90deg,#25d68b,#4f9cff)}.sgaOrderTrackingDot{position:relative;z-index:1;width:25px;height:25px;margin:0 auto 5px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#101b2b;border:2px solid rgba(130,155,190,.30);color:#8193aa;font-size:10px;font-weight:900}.sgaOrderTrackingStep.done .sgaOrderTrackingDot{background:linear-gradient(135deg,#167c57,#247cff);border-color:#50b9ff;color:#fff}.sgaOrderTrackingStep.current .sgaOrderTrackingDot{background:linear-gradient(135deg,#287bff,#873dff);border-color:#6fc1ff;color:#fff;box-shadow:0 0 13px rgba(68,135,255,.36)}.sgaOrderTrackingLabel{display:block;font-size:8px;line-height:1.2;color:#71849d;font-weight:800;overflow-wrap:anywhere}.sgaOrderTrackingStep.done .sgaOrderTrackingLabel,.sgaOrderTrackingStep.current .sgaOrderTrackingLabel{color:#fff}.sgaOrderTrackingNote{text-align:center;margin-top:9px;font-size:10px;color:#92a4ba}.sgaOrderTrackingNote.cancelled{color:#ff8aa1}@media(max-width:430px){.sgaIdentity{gap:11px}.sgaOrderTracking{padding:12px 7px 10px}.sgaOrderTrackingTitle{font-size:11px}.sgaOrderTrackingStatus{font-size:9px;padding:4px 5px}.sgaOrderTrackingDot{width:23px;height:23px;font-size:9px}.sgaOrderTrackingStep:not(:last-child)::after{top:11px}.sgaOrderTrackingLabel{font-size:7.5px}}.sgaOrderTop{display:flex;justify-content:space-between;gap:10px}.sgaOrder strong{font-size:13px}.sgaStatus{color:#63bfff;font-size:11px;font-weight:900}.sgaRefund{color:#ffd36a;font-size:11px;font-weight:900;margin-top:5px}.sgaOrder p{color:#8fa1b7;font-size:11px;line-height:1.5;margin:7px 0}.sgaActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:15px}.sgaSectionTitle{font-size:15px;font-weight:900;margin:0 0 11px}.sgaEmpty{text-align:center;color:#8799b0;font-size:12px;padding:18px}.sgaLogout{margin-left:auto;background:#17263a;border:1px solid #31465e;color:#fff;border-radius:10px;padding:8px 11px;font-weight:800}.sgaRow{display:flex;justify-content:space-between;gap:10px;color:#a8b7ca;font-size:12px;padding:8px 0;border-bottom:1px solid #20344b}.sgaRow b{color:#fff;text-align:right}@media(max-width:430px){.sgaStatGrid{gap:6px}.sgaStat{padding:11px 5px}.sgaTitle{font-size:27px}}`;
    document.head.appendChild(s)}
  function hideCatalog(){const p=document.getElementById('products'),c=document.getElementById('cats'),s=document.getElementById('navSubcategories');if(p){p.classList.add('sga-hide');p.style.setProperty('display','none','important')}if(c)c.style.display='none';if(s){s.style.display='none';s.hidden=true;s.innerHTML=''}}
  function area(){const a=document.getElementById('profileArea');if(a){a.hidden=false;a.classList.add('sga');a.style.display='block'}return a}
  async function me(){try{const d=await api('/api/customer/me');state.customer=d.customer;return true}catch(_){state.customer=null;return false}}
  function authView(mode='login'){const a=area();if(!a)return;hideCatalog();a.innerHTML=`<div class="sgaWrap"><section class="sgaCard sgaHero"><div class="sgaLogo">👤</div><h2 class="sgaTitle">Espace client</h2><p class="sgaSub">Connecte-toi pour retrouver tes commandes, suivre leur préparation et gérer tes demandes.</p></section><section class="sgaCard"><div class="sgaTabs"><button class="${mode==='login'?'on':''}" onclick="sngAuthView('login')">Se connecter</button><button class="${mode==='register'?'on':''}" onclick="sngAuthView('register')">Créer un compte</button></div><form id="sgaAuthForm" class="sgaForm"></form><div id="sgaError" class="sgaError"></div></section></div>`;const f=document.getElementById('sgaAuthForm');f.innerHTML=mode==='register'?`<input id="sgaName" placeholder="Nom complet" autocomplete="name" required><input id="sgaEmail" type="email" placeholder="Adresse e-mail" autocomplete="email" required><input id="sgaPhone" placeholder="Téléphone" autocomplete="tel"><input id="sgaAddress" placeholder="Adresse de livraison" autocomplete="street-address"><input id="sgaPassword" type="password" placeholder="Mot de passe (6 caractères minimum)" autocomplete="new-password" required><button class="sgaBtn">Créer mon compte</button>`:`<input id="sgaEmail" type="email" placeholder="Adresse e-mail" autocomplete="email" required><input id="sgaPassword" type="password" placeholder="Mot de passe" autocomplete="current-password" required><button class="sgaBtn">Se connecter</button>`;f.onsubmit=async e=>{e.preventDefault();const err=document.getElementById('sgaError');err.textContent='';try{let d;if(mode==='register')d=await api('/api/customer/register',{method:'POST',body:JSON.stringify({name:sgaName.value,email:sgaEmail.value,phone:sgaPhone.value,address:sgaAddress.value,password:sgaPassword.value})});else d=await api('/api/customer/login',{method:'POST',body:JSON.stringify({email:sgaEmail.value,password:sgaPassword.value})});state.customer=d.customer;await renderAccount()}catch(x){err.textContent=x.message}}}
  async function cancelOrder(id){const o=state.orders.find(x=>Number(x.id)===Number(id));if(!o)return;const paid=o.payment_status==='Payé';const text=paid?`Annuler la commande #${id} et enregistrer une demande de remboursement de ${money(o.total)} ?\n\nLe remboursement ne sera considéré comme effectué qu'après traitement par SNGAMER STORE via PayTech.`:`Annuler la commande #${id} ?`;if(!confirm(text))return;try{const d=await api('/api/customer/orders/'+encodeURIComponent(id)+'/cancel',{method:'POST'});alert(d.message||'Commande annulée.');await renderAccount()}catch(e){alert(e.message)}}
  async function renderAccount(){styles();const ok=await me();if(!ok)return authView('login');const a=area();hideCatalog();let orders=[];try{orders=(await api('/api/customer/orders'))||[]}catch(_){orders=[]}state.orders=orders;const c=state.customer,n=firstName(c.name),count=orders.length,active=orders.filter(o=>!['Livrée','Annulée'].includes(o.status)).length;a.innerHTML=`<div class="sgaWrap"><section class="sgaCard"><div class="sgaHead"><div><div class="sgaSmall">SNGAMER STORE · ESPACE CLIENT</div><h2>Bonjour ${esc(n)} 👋</h2></div><button class="sgaLogout" onclick="sngLogout()">Déconnexion</button></div><div class="sgaIdentity"><button type="button" class="sgaAvatar" onclick="sngPickProfilePhoto()" title="Changer ma photo de profil" aria-label="Modifier la photo de profil"><span class="sgaAvatarInitial">${esc(n.charAt(0).toUpperCase())}</span><img class="sgaAvatarImage" alt="Photo de profil" hidden><span class="sgaAvatarCamera" aria-hidden="true">📷</span></button><input id="sgaProfilePhotoInput" class="sgaPhotoInput" type="file" accept="image/jpeg,image/png,image/webp,image/gif"><div><strong>${esc(c.name)}</strong></div></div><div class="sgaStatGrid"><div class="sgaStat"><b>${count}</b><span>Commandes</span></div><div class="sgaStat"><b>${active}</b><span>En cours</span></div><div class="sgaStat"><b>${orders.filter(o=>o.status==='Livrée').length}</b><span>Livrées</span></div></div></section><section class="sgaCard"><h3 class="sgaSectionTitle">Mes commandes</h3>${orders.length?orders.map(o=>{const items=Array.isArray(o.items)?o.items:[];const cancellable=!['Livrée','Annulée'].includes(o.status)&&o.refund_status!=='Demandé'&&o.refund_status!=='Remboursé';const refund=o.refund_status&&o.refund_status!=='Aucun';return `<div class="sgaOrder" data-order-id="${Number(o.id)||0}"><div class="sgaOrderTop"><strong>Commande #${Number(o.id)||0}</strong><span class="sgaStatus" data-current-order-status="1">${esc(o.status||'Nouvelle')}</span></div><p>${date(o.created_at)} · ${items.length} produit(s) · <b>${money(o.total)}</b></p>${o.payment_status?`<p>💳 Paiement : <b>${esc(o.payment_status)}</b></p>`:''}${refund?`<div class="sgaRefund">↩️ Remboursement : ${esc(o.refund_status)}</div>`:''}${o.tracking_code?`<p>🚚 Suivi : <b>${esc(o.tracking_code)}</b></p>`:''}${o.customer_message?`<p>💬 ${esc(o.customer_message)}</p>`:''}${renderAccountOrderTracking(o)}${cancellable?`<div class="sgaActions"><button class="sgaBtn danger" onclick="sngCancelOrder(${Number(o.id)})">↩️ ${o.payment_status==='Payé'?'Annuler et demander un remboursement':'Annuler la commande'}</button></div>`:''}</div>`}).join(''):`<div class="sgaEmpty">Aucune commande pour le moment.</div>`}</section><section class="sgaCard"><h3 class="sgaSectionTitle">Mes informations</h3><div class="sgaRow"><span>Nom</span><b>${esc(c.name)}</b></div><div class="sgaRow"><span>E-mail</span><b>${esc(c.email)}</b></div><div class="sgaRow"><span>Téléphone</span><b>${esc(c.phone||'—')}</b></div><div class="sgaRow"><span>Adresse</span><b>${esc(c.address||'—')}</b></div><div class="sgaActions"><button class="sgaBtn" onclick="sngEditProfile()">Modifier mes informations</button><button class="sgaBtn alt" onclick="navigateStore('home')">Continuer mes achats</button></div></section><section class="sgaCard"><h3 class="sgaSectionTitle">Suivi & assistance</h3><p class="sgaSub">Les statuts de commande et les demandes de remboursement sont synchronisés avec SNGAMER STORE.</p><div class="sgaActions"><button class="sgaBtn" onclick="sngRefreshAccount()">Actualiser mon suivi</button><button class="sgaBtn alt" onclick="window.open('https://wa.me/221786127985','_blank')">Contacter SNGAMER</button></div></section></div>`;
    setupAccountPhotoPicker();
  }
  async function refreshAccountTracking(){
    const profile=document.getElementById('profileArea');
    if(accountTrackingBusy||!profile||profile.hidden||profile.offsetParent===null||document.body.dataset.storeSection!=='profile')return;
    if(!profile.querySelector('.sgaOrder[data-order-id]'))return;
    accountTrackingBusy=true;
    try{
      const orders=await api('/api/customer/orders');
      if(!Array.isArray(orders))return;
      state.orders=orders;
      const byId=new Map(orders.map(order=>[Number(order.id),order]));
      profile.querySelectorAll('.sgaOrder[data-order-id]').forEach(card=>{
        const order=byId.get(Number(card.dataset.orderId));if(!order)return;
        const rawStatus=String(order.status||'Nouvelle').trim();
        const statusNode=card.querySelector('[data-current-order-status="1"]');
        if(statusNode&&statusNode.textContent!==rawStatus)statusNode.textContent=rawStatus;
        const normalized=normalizeAccountOrderStatus(rawStatus);
        const tracking=card.querySelector('.sgaOrderTracking');
        if(!tracking||tracking.dataset.status!==normalized){
          const html=renderAccountOrderTracking(order);
          if(tracking)tracking.outerHTML=html;
          else{const actions=card.querySelector('.sgaActions');if(actions)actions.insertAdjacentHTML('beforebegin',html);else card.insertAdjacentHTML('beforeend',html);}
        }
      });
    }catch(_){}finally{accountTrackingBusy=false;}
  }
  window.sngAuthView=authView;window.sngRefreshAccount=renderAccount;window.sngCancelOrder=cancelOrder;
  window.sngLogout=async()=>{try{await api('/api/customer/logout',{method:'POST'});state.customer=null;authView('login')}catch(e){alert(e.message)}};
  window.sngEditProfile=()=>{const c=state.customer||{},m=document.createElement('div');m.className='sgaModal';m.innerHTML=`<div class="sgaModalBox"><button class="sgaModalClose" onclick="this.closest('.sgaModal').remove()">×</button><h3>Modifier mes informations</h3><form id="sgaEdit" class="sgaForm"><input id="eName" value="${esc(c.name)}" placeholder="Nom complet" required><input id="ePhone" value="${esc(c.phone)}" placeholder="Téléphone"><input id="eAddress" value="${esc(c.address)}" placeholder="Adresse"><button class="sgaBtn">Enregistrer</button></form><div id="eErr" class="sgaError"></div></div>`;document.body.appendChild(m);document.getElementById('sgaEdit').onsubmit=async e=>{e.preventDefault();try{await api('/api/customer/me',{method:'PATCH',body:JSON.stringify({name:eName.value,phone:ePhone.value,address:eAddress.value})});m.remove();renderAccount()}catch(x){document.getElementById('eErr').textContent=x.message}}};
  async function openProfile(){styles();await renderAccount()}
  const originalNavigateStore=window.navigateStore;
  if(typeof originalNavigateStore==='function'){
    window.navigateStore=function(section){
      // This legacy account panel hides the product grid using .sga-hide and
      // display:none!important. Clear both before leaving Profile so the main
      // app renderer can display the already-loaded products without a reload.
      if(section!=='profile'){
        const products=document.getElementById('products');
        if(products){
          products.classList.remove('sga-hide');
          products.hidden=section==='coins';
          products.style.removeProperty('display');
        }
      }
      originalNavigateStore(section);
      if(section==='profile')setTimeout(openProfile,30);
    };
  }
  window.order=async function(){const ok=await me();if(!ok){if(typeof closeCheckout==='function')closeCheckout();if(typeof closeCart==='function')closeCart();if(typeof navigateStore==='function')navigateStore('profile');alert('Connecte-toi ou crée ton compte avant de passer une commande.');return}const cart=JSON.parse(localStorage.getItem('sg_cart')||'[]');if(!cart.length)return alert('Panier vide.');const payment=document.getElementById('pay')?.value||'Paiement à la livraison';try{const d=await api('/api/customer/orders',{method:'POST',body:JSON.stringify({payment,items:cart})});localStorage.removeItem('sg_cart');if(typeof cartItems!=='undefined')cartItems=[];if(typeof save==='function')save();if(typeof closeCheckout==='function')closeCheckout();if(typeof closeCart==='function')closeCart();alert('Commande #'+d.orderId+' enregistrée.');await renderAccount()}catch(e){alert(e.message)}};
  setInterval(refreshAccountTracking,10000);
  document.addEventListener('DOMContentLoaded',()=>styles());
})();
