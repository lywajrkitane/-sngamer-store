const express = require('express');
const { Pool } = require('pg');
const webpush = require('web-push');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const publicKey = String(process.env.VAPID_PUBLIC_KEY || '').trim();
const privateKey = String(process.env.VAPID_PRIVATE_KEY || '').trim();
const subject = String(process.env.VAPID_SUBJECT || 'https://sngamer-store.onrender.com').trim();

function configured() {
  return Boolean(publicKey && privateKey);
}

if (configured()) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
} else {
  console.warn('PUSH_NOTIFICATIONS: VAPID keys are not configured; push notifications are disabled.');
}

async function initPushDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS customer_push_subscriptions (
      id BIGSERIAL PRIMARY KEY,
      customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      endpoint TEXT NOT NULL UNIQUE,
      subscription JSONB NOT NULL,
      user_agent TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_success_at TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS idx_customer_push_subscriptions_customer
      ON customer_push_subscriptions(customer_id);
  `);
}

function requireCustomer(req, res, next) {
  if (!req.session?.customerId) return res.status(401).json({ error: 'Connexion client requise' });
  next();
}

function installPushRoutes() {
  const router = express.Router();

  router.get('/api/push/public-key', (req, res) => {
    if (!configured()) return res.status(503).json({ enabled: false, error: 'Notifications indisponibles.' });
    res.json({ enabled: true, publicKey });
  });

  router.post('/api/push/subscribe', requireCustomer, async (req, res) => {
    try {
      if (!configured()) return res.status(503).json({ error: 'Notifications indisponibles.' });
      const subscription = req.body?.subscription;
      if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
        return res.status(400).json({ error: 'Abonnement de notification invalide.' });
      }
      await pool.query(
        `INSERT INTO customer_push_subscriptions
          (customer_id, endpoint, subscription, user_agent, updated_at)
         VALUES ($1,$2,$3,$4,NOW())
         ON CONFLICT (endpoint) DO UPDATE SET
           customer_id=EXCLUDED.customer_id,
           subscription=EXCLUDED.subscription,
           user_agent=EXCLUDED.user_agent,
           updated_at=NOW()`,
        [req.session.customerId, subscription.endpoint, JSON.stringify(subscription), String(req.headers['user-agent'] || '')]
      );
      res.json({ success: true });
    } catch (error) {
      console.error('PUSH_SUBSCRIBE_ERROR:', error);
      res.status(500).json({ error: 'Impossible d’activer les notifications.' });
    }
  });

  router.delete('/api/push/subscribe', requireCustomer, async (req, res) => {
    try {
      const endpoint = String(req.body?.endpoint || '').trim();
      if (endpoint) {
        await pool.query('DELETE FROM customer_push_subscriptions WHERE customer_id=$1 AND endpoint=$2', [req.session.customerId, endpoint]);
      } else {
        await pool.query('DELETE FROM customer_push_subscriptions WHERE customer_id=$1', [req.session.customerId]);
      }
      res.json({ success: true });
    } catch (error) {
      console.error('PUSH_UNSUBSCRIBE_ERROR:', error);
      res.status(500).json({ error: 'Impossible de désactiver les notifications.' });
    }
  });

  return router;
}

function notificationContent(order) {
  const status = String(order?.status || 'Nouvelle');
  const items = Array.isArray(order?.items) ? order.items : [];
  const singleName = items.length === 1 ? String(items[0]?.name || '').trim() : '';

  if (status === 'Confirmée') {
    return { title: 'SNGAMER STORE', body: singleName ? `Votre commande ${singleName} a été confirmée.` : 'Votre commande a été confirmée.' };
  }
  if (status === 'En préparation') {
    return { title: 'SNGAMER STORE', body: singleName ? `Votre commande ${singleName} est en préparation.` : 'Votre commande est en préparation.' };
  }
  if (status === 'Expédiée') {
    return { title: 'SNGAMER STORE', body: singleName ? `Votre commande ${singleName} a été expédiée.` : 'Votre commande vient d’être expédiée.' };
  }
  if (status === 'Livrée') {
    return { title: 'SNGAMER STORE', body: 'Votre commande a été livrée. Merci d’avoir choisi SNGAMER STORE ! ❤️' };
  }
  if (status === 'Annulée') {
    return { title: 'SNGAMER STORE', body: 'Votre commande a été annulée.' };
  }
  return { title: 'SNGAMER STORE', body: singleName ? `Votre commande ${singleName} a été mise à jour.` : 'Le statut de votre commande a été mis à jour.' };
}

async function notifyOrderStatusChange(order) {
  if (!configured() || !order?.customer_id) return { sent: 0, removed: 0, skipped: true };
  const content = notificationContent(order);
  const result = await pool.query('SELECT id, endpoint, subscription FROM customer_push_subscriptions WHERE customer_id=$1', [order.customer_id]);
  let sent = 0;
  let removed = 0;

  for (const row of result.rows) {
    try {
      await webpush.sendNotification(row.subscription, JSON.stringify({
        title: content.title,
        body: content.body,
        url: '/?profile=1',
        tag: `sngamer-order-status-${order.id}`
      }));
      await pool.query('UPDATE customer_push_subscriptions SET last_success_at=NOW(), updated_at=NOW() WHERE id=$1', [row.id]);
      sent += 1;
    } catch (error) {
      const status = Number(error?.statusCode || 0);
      if (status === 404 || status === 410) {
        await pool.query('DELETE FROM customer_push_subscriptions WHERE id=$1', [row.id]);
        removed += 1;
      } else {
        console.error('PUSH_SEND_ERROR:', error?.message || error);
      }
    }
  }
  return { sent, removed, skipped: false };
}

function installOrderStatusObserver(app) {
  const stack = app._router && app._router.stack;
  if (!stack) return false;
  const targetPaths = new Set(['/api/admin/orders/:id', '/api/admin/orders/:id/customer-update']);
  const targets = [];
  stack.forEach((layer, index) => {
    if (layer?.route?.path && targetPaths.has(layer.route.path) && layer.route.methods?.patch) targets.push(index);
  });
  if (!targets.length) return false;

  const observerRouter = express.Router();
  observerRouter.patch(['/api/admin/orders/:id', '/api/admin/orders/:id/customer-update'], async (req, res, next) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return next();

    let before = null;
    try {
      const r = await pool.query('SELECT id, customer_id, status, items FROM orders WHERE id=$1 LIMIT 1', [id]);
      before = r.rows[0] || null;
    } catch (error) {
      console.error('PUSH_STATUS_BEFORE_ERROR:', error);
    }

    res.on('finish', async () => {
      if (res.statusCode < 200 || res.statusCode >= 300 || !before?.customer_id) return;
      try {
        const r = await pool.query('SELECT id, customer_id, status, items FROM orders WHERE id=$1 LIMIT 1', [id]);
        const after = r.rows[0];
        if (!after || String(after.status) === String(before.status)) return;
        const result = await notifyOrderStatusChange(after);
        console.log('PUSH_STATUS_NOTIFICATION:', { orderId: id, status: after.status, ...result });
      } catch (error) {
        console.error('PUSH_STATUS_AFTER_ERROR:', error);
      }
    });
    next();
  });

  // Insert before the earliest matching PATCH route so both dashboard update paths are observed.
  const firstIndex = Math.min(...targets);
  stack.splice(firstIndex, 0, ...(observerRouter.stack || []));
  return true;
}

module.exports = {
  initPushDatabase,
  installPushRoutes,
  installOrderStatusObserver,
  notifyOrderStatusChange,
  configured
};
