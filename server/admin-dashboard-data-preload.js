/* SNGAMER STORE — canonical dashboard summary endpoint. */
const express = require('express');
const { Pool } = require('pg');

if (!express.application.__sngCanonicalDashboardData) {
  express.application.__sngCanonicalDashboardData = true;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  const originalListen = express.application.listen;
  express.application.listen = function canonicalDashboardListen(...args) {
    const app = this;
    const stack = app._router && app._router.stack;
    if (stack && !app.__sngCanonicalDashboardRoute) {
      app.__sngCanonicalDashboardRoute = true;
      const router = express.Router();
      router.get('/api/admin/dashboard-summary', async (req, res) => {
        if (!req.session?.admin) return res.status(401).json({ error: 'Non autorisé' });
        try {
          const result = await pool.query(`
            SELECT
              (SELECT COUNT(*)::int FROM products) AS products,
              (SELECT COUNT(*)::int FROM orders) AS orders,
              (SELECT COUNT(*)::int FROM orders WHERE LOWER(BTRIM(COALESCE(status,''))) IN ('nouvelle','nouveau') OR LOWER(BTRIM(COALESCE(status,''))) LIKE 'nouvelle %') AS new_orders,
              (SELECT COUNT(*)::int FROM orders WHERE LOWER(BTRIM(COALESCE(status,''))) = 'confirmée') AS confirmed_orders,
              (SELECT COUNT(*)::int FROM orders WHERE LOWER(BTRIM(COALESCE(status,''))) = 'en préparation') AS prepared_orders,
              (SELECT COUNT(*)::int FROM orders WHERE LOWER(BTRIM(COALESCE(status,''))) = 'expédiée') AS shipped_orders,
              (SELECT COUNT(*)::int FROM orders WHERE LOWER(BTRIM(COALESCE(status,''))) = 'livrée') AS delivered_orders,
              (SELECT COUNT(*)::int FROM orders WHERE LOWER(BTRIM(COALESCE(status,''))) = 'annulée') AS cancelled_orders,
              (SELECT COUNT(*)::int FROM customers) AS customers,
              (SELECT COALESCE(SUM(total),0)::bigint FROM orders
                 WHERE (
                   LOWER(BTRIM(COALESCE(payment_status,''))) IN ('payé','paye','paid')
                   OR (BTRIM(COALESCE(payment_status,'')) = '' AND LOWER(BTRIM(COALESCE(status,''))) IN ('payée','payee'))
                 )
                   AND LOWER(BTRIM(COALESCE(refund_status,''))) NOT IN ('remboursé','rembourse')
                   AND LOWER(BTRIM(COALESCE(status,''))) NOT IN ('annulée','annulee')) AS revenue
          `);
          res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
          res.json(result.rows[0]);
        } catch (error) {
          console.error('CANONICAL_DASHBOARD_SUMMARY_ERROR:', error);
          res.status(500).json({ error: 'Impossible de charger les données du dashboard' });
        }
      });
      stack.unshift(...(router.stack || []));
    }
    return originalListen.apply(this, args);
  };
}
