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
              (SELECT COUNT(*)::int FROM orders WHERE status = 'Nouvelle') AS new_orders,
              (SELECT COUNT(*)::int FROM orders WHERE status = 'Confirmée') AS confirmed_orders,
              (SELECT COUNT(*)::int FROM orders WHERE status = 'Expédiée') AS shipped_orders,
              (SELECT COUNT(*)::int FROM orders WHERE status = 'Livrée') AS delivered_orders,
              (SELECT COUNT(*)::int FROM orders WHERE status = 'Annulée') AS cancelled_orders,
              (SELECT COUNT(*)::int FROM customers) AS customers,
              (SELECT COALESCE(SUM(total),0)::bigint FROM orders
                 WHERE LOWER(COALESCE(payment_status,'')) IN ('payé','paye','paid')
                   AND LOWER(COALESCE(refund_status,'')) NOT IN ('remboursé','rembourse')
                   AND LOWER(COALESCE(status,'')) NOT IN ('annulée','annulee')) AS revenue
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
