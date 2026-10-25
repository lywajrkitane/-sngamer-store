const SNGAMER_NOTIFICATION_ICON = '/sngamer-notification-icon.svg';
const SNGAMER_SW_VERSION = '20261025-product-actions-loader1';

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

/* SNGAMER — ensure the product image-action module is actually loaded.
   The module already exists in public/, but the storefront HTML did not load it.
   Inject only the missing script into document responses; do not alter the page
   markup or any working product logic. */
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (request.destination === 'document' || url.pathname === '/' || url.pathname.endsWith('/index.html')) {
    event.respondWith((async () => {
      const response = await fetch(request);
      if (!response.ok) return response;
      try {
        const type = response.headers.get('content-type') || '';
        if (!type.includes('text/html')) return response;
        const source = await response.text();
        if (source.includes('/product-image-actions-v1.js')) return new Response(source, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
        const injected = source.replace(
          '</body>',
          '<script src="/product-image-actions-v1.js?v=20261025-image-actions2" defer></script></body>'
        );
        const headers = new Headers(response.headers);
        headers.set('Cache-Control', 'no-store');
        headers.set('X-SNGAMER-Product-Actions', 'loaded');
        return new Response(injected, {
          status: response.status,
          statusText: response.statusText,
          headers
        });
      } catch (_) {
        return response;
      }
    })());
    return;
  }

  if (!url.pathname.endsWith('/stock-mode.js')) return;

  event.respondWith((async () => {
    const response = await fetch(request);
    if (!response.ok) return response;

    try {
      const source = await response.text();
      const patch = `\n;(function(){\n  const PINK='#ff4fa3';\n  function patchOnOrder(){\n    const styleId='sngOnOrderFinalVisualGuard';\n    let style=document.getElementById(styleId);\n    if(!style){\n      style=document.createElement('style');\n      style.id=styleId;\n      document.head.appendChild(style);\n    }\n    style.textContent=\`\n      #products .card.productCardClickable .info > .stock.onOrderStock.sngStockStatus,\n      #products .card.productCardClickable .info > .stock.sngStockStatus.onOrderStock.is-stock,\n      #products .card.productCardClickable .info > .stock.onOrderStock {\n        color:\${PINK} !important;\n        border-color:rgba(255,79,163,.34) !important;\n        background:rgba(255,79,163,.09) !important;\n        box-shadow:none !important;\n      }\n      #products .card.productCardClickable .info > .stock.onOrderStock::before,\n      #products .card.productCardClickable .info > .stock.onOrderStock::after {\n        border-color:transparent !important;\n        background:transparent !important;\n        box-shadow:none !important;\n      }\n      #products .card.productCardClickable .info > .stock.onOrderStock > i,\n      #products .card.productCardClickable .info > .stock.onOrderStock .sngOnOrderDot {\n        background:\${PINK} !important;\n        box-shadow:0 0 0 3px rgba(255,79,163,.08),0 0 10px \${PINK} !important;\n      }\n    \`;\n  }\n  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',patchOnOrder,{once:true});\n  else patchOnOrder();\n  new MutationObserver(patchOnOrder).observe(document.documentElement,{childList:true,subtree:true});\n})();\n`;
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'no-store');
      headers.set('X-SNGAMER-Stock-Visual-Fix', 'on-order-pink');
      return new Response(source + patch, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    } catch (_) {
      return response;
    }
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
    vibrate: [80, 40, 80],
    timestamp: Date.now(),
    lang: 'fr-FR',
    dir: 'auto',
    data: {
      url: data.url || '/?profile=1',
      orderId: data.orderId || null,
      status: data.status || null
    },
    actions: [
      { action: 'open-order', title: 'Voir le suivi' }
    ]
  };

  if (!options.image) delete options.image;
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = event.notification?.data?.url || '/?profile=1';

  event.waitUntil((async () => {
    const clientsList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clientsList) {
      if ('focus' in client) {
        try { await client.navigate(target); } catch (_) {}
        return client.focus();
      }
    }
    return clients.openWindow(target);
  })());
});
