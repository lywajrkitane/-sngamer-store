const SNGAMER_NOTIFICATION_ICON = '/sngamer-notification-icon.svg';
const SNGAMER_SW_VERSION = '20261024-stock-dot-only1';

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

/* SNGAMER stock badge refinement.
   Keep the badge/text completely static; animate ONLY the small status dot. */
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.pathname.endsWith('/product-stability.js')) return;

  event.respondWith((async () => {
    const response = await fetch(event.request);
    const source = await response.text();
    const patch = `
/* SNGAMER FINAL STOCK DOT-ONLY PATCH */
(() => {
  const style = document.createElement('style');
  style.id = 'sngamer-stock-dot-only-final';
  style.textContent = \`
    #products .card.productCardClickable .info > .stock.sngStockStatus {
      animation: none !important;
    }
    #products .card.productCardClickable .info > .stock.sngStockStatus.is-limited,
    #products .card.productCardClickable .info > .stock.sngStockStatus.is-last,
    #products .card.productCardClickable .info > .stock.sngStockStatus.is-out {
      animation: none !important;
    }
    #products .card.productCardClickable .info > .stock.sngStockStatus i {
      animation: sngStockDotBlink 1.8s ease-in-out infinite !important;
      transform-origin: center center !important;
    }
    @keyframes sngStockDotBlink {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: .12; transform: scale(.82); }
    }
  \`;
  document.head.appendChild(style);
})();
`;
    const body = source + '\n' + patch;
    const headers = new Headers(response.headers);
    headers.set('content-type', 'application/javascript; charset=utf-8');
    headers.delete('content-length');
    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
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
