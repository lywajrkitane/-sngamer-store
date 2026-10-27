const SNGAMER_NOTIFICATION_ICON = '/sngamer-notification-icon.svg';
const SNGAMER_SW_VERSION = '20261027-social-canonical2';

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    await self.clients.claim();
    try {
      const notifications = await self.registration.getNotifications();
      notifications.forEach(notification => {
        const tag = String(notification.tag || '');
        if (tag.startsWith('sngamer-order-status-')) notification.close();
      });
    } catch (_) {}
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (request.destination === 'document' || url.pathname === '/' || url.pathname.endsWith('/index.html')) {
    event.respondWith((async () => {
      const response = await fetch(request, { cache: 'no-store' });
      if (!response.ok) return response;
      try {
        const type = response.headers.get('content-type') || '';
        if (!type.includes('text/html')) return response;
        const source = await response.text();
        const headers = new Headers(response.headers);
        headers.set('Cache-Control', 'no-store');
        headers.set('X-SNGAMER-Product-Actions', 'canonical-top-only');
        return new Response(source, { status: response.status, statusText: response.statusText, headers });
      } catch (_) { return response; }
    })());
    return;
  }

  if (url.pathname.endsWith('/navigation-checkout-fix.js') || url.pathname.endsWith('/profile-navigation-refresh.js')) {
    event.respondWith(fetch(request, { cache: 'no-store' }));
    return;
  }

  if (!url.pathname.endsWith('/stock-mode.js')) return;

  event.respondWith((async () => {
    const response = await fetch(request, { cache: 'no-store' });
    if (!response.ok) return response;
    try {
      const source = await response.text();
      const patch = `
;(function(){
  const PINK='#ff4fa3';
  function patchOnOrder(){
    const styleId='sngOnOrderFinalVisualGuard';
    let style=document.getElementById(styleId);
    if(!style){style=document.createElement('style');style.id=styleId;document.head.appendChild(style);}
    style.textContent=\`
      #products .card.productCardClickable .info > .stock.onOrderStock.sngStockStatus,
      #products .card.productCardClickable .info > .stock.sngStockStatus.onOrderStock.is-stock,
      #products .card.productCardClickable .info > .stock.onOrderStock {color:\${PINK}!important;border-color:rgba(255,79,163,.34)!important;background:rgba(255,79,163,.09)!important;box-shadow:none!important;}
      #products .card.productCardClickable .info > .stock.onOrderStock::before,
      #products .card.productCardClickable .info > .stock.onOrderStock::after {border-color:transparent!important;background:transparent!important;box-shadow:none!important;}
      #products .card.productCardClickable .info > .stock.onOrderStock > i,
      #products .card.productCardClickable .info > .stock.onOrderStock .sngOnOrderDot {background:\${PINK}!important;box-shadow:0 0 0 3px rgba(255,79,163,.08),0 0 10px \${PINK}!important;}
    \`;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',patchOnOrder,{once:true});else patchOnOrder();
  new MutationObserver(patchOnOrder).observe(document.documentElement,{childList:true,subtree:true});
})();
`;
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'no-store');
      headers.set('X-SNGAMER-Stock-Visual-Fix', 'on-order-pink');
      return new Response(source + patch, { status: response.status, statusText: response.statusText, headers });
    } catch (_) { return response; }
  })());
});

self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) {}
  const title = data.title || 'SNGAMER STORE';
  const options = {
    body: data.body || 'Une mise à jour de votre commande est disponible.',
    icon: data.icon || SNGAMER_NOTIFICATION_ICON,
    badge: data.badge || SNGAMER_NOTIFICATION_ICON,
    image: data.image || undefined,
    tag: data.tag || 'sngamer-store-notification',
    renotify: true,
    requireInteraction: false,
    silent: false,
    vibrate: [80,40,80],
    timestamp: Date.now(),
    lang: 'fr-FR',
    dir: 'auto',
    data: { url: data.url || '/?profile=1', orderId: data.orderId || null, status: data.status || null },
    actions: [{ action: 'open-order', title: 'Voir le suivi' }]
  };
  if(!options.image)delete options.image;
  event.waitUntil(self.registration.showNotification(title,options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = event.notification?.data?.url || '/?profile=1';
  event.waitUntil((async()=>{
    const clientsList=await clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of clientsList){if('focus' in client){try{await client.navigate(target)}catch(_){}return client.focus();}}
    return clients.openWindow(target);
  })());
});
