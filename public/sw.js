const SNGAMER_NOTIFICATION_ICON = '/sngamer-notification-icon.svg';
const SNGAMER_SW_VERSION = '20261024-stock-state-rootfix2';

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
