'use strict';

const express = require('express');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function ensureBaselineTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS analytics_baseline (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      orders_total BIGINT NOT NULL DEFAULT 0,
      orders_today BIGINT NOT NULL DEFAULT 0,
      revenue_total NUMERIC(14,2) NOT NULL DEFAULT 0,
      revenue_today NUMERIC(14,2) NOT NULL DEFAULT 0
    )
  `);
}

async function currentOrderSnapshot() {
  const result = await pool.query(`
    SELECT
      COUNT(*) FILTER (
        WHERE payment_status = 'Payé'
          AND COALESCE(status, '') <> 'Annulée'
          AND COALESCE(refund_status, 'Aucun') <> 'Remboursé'
      )::bigint AS orders_total,
      COUNT(*) FILTER (
        WHERE created_at >= CURRENT_DATE
          AND payment_status = 'Payé'
          AND COALESCE(status, '') <> 'Annulée'
          AND COALESCE(refund_status, 'Aucun') <> 'Remboursé'
      )::bigint AS orders_today,
      COALESCE(SUM(total) FILTER (
        WHERE payment_status = 'Payé'
          AND COALESCE(status, '') <> 'Annulée'
          AND COALESCE(refund_status, 'Aucun') <> 'Remboursé'
      ), 0)::numeric(14,2) AS revenue_total,
      COALESCE(SUM(total) FILTER (
        WHERE created_at >= CURRENT_DATE
          AND payment_status = 'Payé'
          AND COALESCE(status, '') <> 'Annulée'
          AND COALESCE(refund_status, 'Aucun') <> 'Remboursé'
      ), 0)::numeric(14,2) AS revenue_today
    FROM orders
  `);
  return result.rows[0];
}

function install(app) {
  const stack = app._router && app._router.stack;
  if (!stack || app.__sngAnalyticsBaselineInstalled) return;
  app.__sngAnalyticsBaselineInstalled = true;

  const api = express.Router();
  api.post('/api/admin/analytics/reset', async (req, res) => {
    if (!req.session?.admin) return res.status(401).json({ error: 'Non autorisé' });
    try {
      await ensureBaselineTable();
      const snapshot = await currentOrderSnapshot();
      await pool.query(`DELETE FROM site_visits`);
      await pool.query(`
        INSERT INTO analytics_baseline(id, reset_at, orders_total, orders_today, revenue_total, revenue_today)
        VALUES(1, NOW(), $1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE SET
          reset_at = EXCLUDED.reset_at,
          orders_total = EXCLUDED.orders_total,
          orders_today = EXCLUDED.orders_today,
          revenue_total = EXCLUDED.revenue_total,
          revenue_today = EXCLUDED.revenue_today
      `, [snapshot.orders_total, snapshot.orders_today, snapshot.revenue_total, snapshot.revenue_today]);
      res.set('Cache-Control', 'no-store');
      res.json({ ok: true, reset_at: new Date().toISOString() });
    } catch (e) {
      console.error('ANALYTICS_RESET_ERROR:', e);
      res.status(500).json({ error: 'Impossible d’initialiser les statistiques' });
    }
  });

  const catchAllIndex = stack.findIndex(layer => {
    if (!layer?.route?.methods?.get) return false;
    const p = layer.route.path;
    return p === '*' || (Array.isArray(p) && p.includes('*'));
  });
  if (catchAllIndex >= 0) stack.splice(catchAllIndex, 0, ...api.stack);
  else stack.push(...api.stack);

  // The analytics endpoint is installed by site-analytics-preload. This middleware
  // masks pre-reset order/revenue totals without deleting any orders.
  const guard = express.Router();
  guard.use(async (req, res, next) => {
    if (req.path !== '/api/admin/analytics' || req.method !== 'GET') return next();
    try {
      await ensureBaselineTable();
      const base = (await pool.query('SELECT * FROM analytics_baseline WHERE id = 1')).rows[0];
      if (!base) return next();

      const originalJson = res.json.bind(res);
      res.json = payload => {
        try {
          if (payload && typeof payload === 'object') {
            const orders = Math.max(0, Number(payload.orders || 0) - Number(base.orders_total || 0));
            const ordersToday = Math.max(0, Number(payload.orders_today || 0) - Number(base.orders_today || 0));
            const revenue = Math.max(0, Number(payload.revenue_total || 0) - Number(base.revenue_total || 0));
            const revenueToday = Math.max(0, Number(payload.revenue_today || 0) - Number(base.revenue_today || 0));
            const visits30 = Number(payload.visits_30d || 0);

            payload.orders = orders;
            payload.orders_today = ordersToday;
            payload.revenue_total = revenue;
            payload.revenue_today = revenueToday;
            payload.average_order = orders > 0 ? Number((revenue / orders).toFixed(2)) : 0;
            payload.conversion_rate = visits30 > 0 ? Number(((orders / visits30) * 100).toFixed(1)) : 0;

            const resetDate = new Date(base.reset_at).toISOString().slice(0, 10);
            const baseOrdersToday = Number(base.orders_today || 0);
            const baseRevenueToday = Number(base.revenue_today || 0);
            if (Array.isArray(payload.sales_days)) {
              payload.sales_days = payload.sales_days
                .filter(day => String(day.date) >= resetDate)
                .map(day => {
                  if (String(day.date) !== resetDate) return day;
                  return {
                    ...day,
                    orders: Math.max(0, Number(day.orders || 0) - baseOrdersToday),
                    revenue: Math.max(0, Number(day.revenue || 0) - baseRevenueToday)
                  };
                });
            }
            payload.analytics_initialized_at = base.reset_at;
          }
        } catch (e) {
          console.error('ANALYTICS_BASELINE_MASK_ERROR:', e.message);
        }
        return originalJson(payload);
      };
    } catch (e) {
      console.error('ANALYTICS_BASELINE_GUARD_ERROR:', e.message);
    }
    next();
  });

  const analyticsIndex = stack.findIndex(layer => layer?.route?.path === '/api/admin/analytics' && layer.route.methods?.get);
  if (analyticsIndex >= 0) stack.splice(analyticsIndex, 0, ...guard.stack);
}

const target = express.application;
const existingListen = target.listen;
let currentListen = existingListen;
function wrap(nextListen) {
  return function analyticsBaselineListen(...args) {
    try { install(this); } catch (e) { console.error('ANALYTICS_BASELINE_INSTALL_ERROR:', e); }
    return nextListen.apply(this, args);
  };
}
Object.defineProperty(target, 'listen', {
  configurable: true,
  enumerable: false,
  get() { return currentListen; },
  set(nextListen) { currentListen = wrap(nextListen); }
});
currentListen = wrap(existingListen);
