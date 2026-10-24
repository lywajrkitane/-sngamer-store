(function(){
  'use strict';
  const fetchNative = window.fetch.bind(window);
  const CARD_ID = 'sngPushCard';
  let installing = false;
  const SW_VERSION = '20261024-stock-state-rootfix2';

  function base64UrlToUint8Array(base64String){
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(base64);
    return Uint8Array.from([...raw].map(char => char.charCodeAt(0)));
  }

  async function getCustomer(){
    try{
      const r = await fetchNative('/api/customer/me', { credentials:'same-origin', cache:'no-store' });
      if(!r.ok) return null;
      const d = await r.json();
      return d.customer || null;
    } catch(_) { return null; }
  }

  async function getRegistration(){
    if(!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return null;
    const registration = await navigator.serviceWorker.register('/sw.js?v=' + SW_VERSION, {
      scope:'/',
      updateViaCache:'none'
    });
    try { await registration.update(); } catch(_) {}
    return navigator.serviceWorker.ready;
  }

  async function subscribePush(){
    if(installing) return;
    installing = true;
    const button = document.querySelector('#sngPushEnable');
    const message = document.querySelector('#sngPushMessage');
    if(button){ button.disabled = true; button.textContent = 'Activation…'; }
    try{
      if(!window.isSecureContext) throw new Error('Les notifications nécessitent une connexion sécurisée.');
      const registration = await getRegistration();
      if(!registration) throw new Error('Les notifications push ne sont pas prises en charge sur cet appareil.');
      if(Notification.permission === 'denied') throw new Error('Les notifications sont bloquées dans les réglages du navigateur.');
      if(Notification.permission !== 'granted'){
        const permission = await Notification.requestPermission();
        if(permission !== 'granted') throw new Error('Autorisation des notifications refusée.');
      }

      const keyResponse = await fetchNative('/api/push/public-key', { credentials:'same-origin', cache:'no-store' });
      const keyData = await keyResponse.json().catch(()=>({}));
      if(!keyResponse.ok || !keyData.publicKey) throw new Error(keyData.error || 'Service de notification indisponible.');

      let subscription = await registration.pushManager.getSubscription();
      if(!subscription){
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64UrlToUint8Array(keyData.publicKey)
        });
      }

      const saveResponse = await fetchNative('/api/push/subscribe', {
        method:'POST',
        credentials:'same-origin',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ subscription: subscription.toJSON ? subscription.toJSON() : subscription })
      });
      const saveData = await saveResponse.json().catch(()=>({}));
      if(!saveResponse.ok) throw new Error(saveData.error || 'Impossible d’activer les notifications.');

      if(message) message.textContent = 'Notifications activées. Vous recevrez automatiquement les mises à jour de votre commande.';
      if(button){ button.textContent = '✓ Notifications activées'; button.classList.add('active'); }
      setTimeout(renderCard, 300);
    }catch(error){
      if(message) message.textContent = error.message || 'Impossible d’activer les notifications.';
      if(button){ button.disabled = false; button.textContent = '🔔 Activer les notifications'; }
    }finally{ installing = false; }
  }

  async function isSubscribed(){
    try{
      const registration = await getRegistration();
      if(!registration) return false;
      const subscription = await registration.pushManager.getSubscription();
      return Boolean(subscription && Notification.permission === 'granted');
    }catch(_){ return false; }
  }

  function styles(){
    if(document.getElementById('sngPushStyles')) return;
    const style=document.createElement('style');
    style.id='sngPushStyles';
    style.textContent=`
      #${CARD_ID}{margin:16px 0;padding:16px 18px;border:1px solid rgba(86,153,255,.22);border-radius:18px;background:linear-gradient(145deg,rgba(13,27,47,.96),rgba(16,10,34,.90));box-shadow:0 12px 32px rgba(0,0,0,.18)}
      #${CARD_ID} .sngPushTitle{font-size:15px;font-weight:900;color:#fff;margin-bottom:5px}
      #${CARD_ID} .sngPushText{font-size:12px;line-height:1.55;color:#94a7c0;margin-bottom:12px}
      #${CARD_ID} button{border:0;border-radius:11px;padding:11px 15px;background:linear-gradient(135deg,#2684ff,#7545ff,#e62f9f);color:#fff;font-weight:900;cursor:pointer;box-shadow:0 9px 22px rgba(73,74,255,.18)}
      #${CARD_ID} button:disabled{opacity:.65;cursor:wait}
      #${CARD_ID} button.active{background:rgba(37,214,139,.16);border:1px solid rgba(37,214,139,.35);box-shadow:none}
    `;
    document.head.appendChild(style);
  }

  async function renderCard(){
    const profile=document.querySelector('#profileArea');
    if(!profile) return;
    const customer=await getCustomer();
    if(!customer) return;
    styles();
    let card=document.getElementById(CARD_ID);
    const subscribed=await isSubscribed();
    if(subscribed){
      if(!card){
        card=document.createElement('div'); card.id=CARD_ID;
        card.innerHTML='<div class="sngPushTitle">🔔 Notifications de suivi</div><div class="sngPushText" id="sngPushMessage">Les notifications sont activées. Vous recevrez automatiquement les mises à jour de votre commande.</div><button type="button" id="sngPushEnable" class="active" disabled>✓ Notifications activées</button>';
        profile.prepend(card);
      } else {
        const message=card.querySelector('#sngPushMessage'); if(message) message.textContent='Les notifications sont activées. Vous recevrez automatiquement les mises à jour de votre commande.';
        const button=card.querySelector('#sngPushEnable'); if(button){button.textContent='✓ Notifications activées';button.disabled=true;button.classList.add('active');}
      }
      return;
    }
    if(card) return;
    card=document.createElement('div'); card.id=CARD_ID;
    card.innerHTML='<div class="sngPushTitle">🔔 Suivi de commande en temps réel</div><div class="sngPushText" id="sngPushMessage">Activez les notifications pour recevoir directement sur votre téléphone les mises à jour de votre commande.</div><button type="button" id="sngPushEnable">🔔 Activer les notifications</button>';
    profile.prepend(card);
    card.querySelector('#sngPushEnable').addEventListener('click',subscribePush);
  }

  function boot(){
    if(!('Notification' in window) || !('serviceWorker' in navigator)) return;
    let attempts=0;
    const timer=setInterval(()=>{
      attempts++;
      if(document.querySelector('#profileArea')) renderCard();
      if(attempts>30) clearInterval(timer);
    },1000);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
  window.sngRefreshPushNotifications=renderCard;
})();
