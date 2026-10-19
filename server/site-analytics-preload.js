const express = require('express');
const { Pool } = require('pg');
const crypto = require('crypto');

const analyticsPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function ensureTable() {
  await analyticsPool.query(`
    CREATE TABLE IF NOT EXISTS site_visits (
      id BIGSERIAL PRIMARY KEY,
      visitor_id TEXT NOT NULL,
      visit_date DATE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await analyticsPool.query(`CREATE INDEX IF NOT EXISTS idx_site_visits_date ON site_visits(visit_date)`);
  await analyticsPool.query(`CREATE INDEX IF NOT EXISTS idx_site_visits_visitor ON site_visits(visitor_id)`);
}

const originalListen = express.application.listen;
express.application.listen = function analyticsListen(...args) {
  const app = this;
  const stack = app._router && app._router.stack;

  if (stack) {
    const analyticsMiddleware = express.Router();
    analyticsMiddleware.use(async (req, res, next) => {
      try {
        if (req.method === 'GET' && req.path === '/api/products') {
          await ensureTable();
          let visitorId = req.cookies?.sg_visitor_id;
          if (!visitorId) {
            visitorId = crypto.randomUUID();
            res.cookie('sg_visitor_id', visitorId, { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 24 * 365 });
          }
          const lastVisit = Number(req.headers['x-sg-visit-time'] || 0);
          const now = Date.now();
          if (!lastVisit || now - lastVisit > 30 * 60 * 1000) {
            await analyticsPool.query(`INSERT INTO site_visits(visitor_id, visit_date) VALUES($1,CURRENT_DATE)`, [visitorId]);
          }
        }
      } catch (error) {
        console.error('SITE_ANALYTICS_TRACK_ERROR:', error.message);
      }
      next();
    });

    // Make anonymous visitor tracking available without requiring a client analytics SDK.
    const productsIndex = stack.findIndex(layer => layer?.route?.path === '/api/products' && layer.route.methods?.get);
    if (productsIndex >= 0) stack.splice(productsIndex, 0, ...(analyticsMiddleware.stack || []));

    const api = express.Router();
    api.get('/api/admin/analytics', async (req, res) => {
      if (!req.session?.admin) return res.status(401).json({ error: 'Non autorisé' });
      try {
        await ensureTable();
        const [totals, days] = await Promise.all([
          analyticsPool.query(`SELECT COUNT(*)::int AS visits, COUNT(DISTINCT visitor_id)::int AS visitors, COUNT(*) FILTER (WHERE visit_date=CURRENT_DATE)::int AS visits_today, COUNT(DISTINCT visitor_id) FILTER (WHERE visit_date=CURRENT_DATE)::int AS visitors_today, COUNT(*) FILTER (WHERE visit_date>=CURRENT_DATE-INTERVAL '6 days')::int AS visits_7d, COUNT(DISTINCT visitor_id) FILTER (WHERE visit_date>=CURRENT_DATE-INTERVAL '6 days')::int AS visitors_7d, COUNT(*) FILTER (WHERE visit_date>=CURRENT_DATE-INTERVAL '29 days')::int AS visits_30d, COUNT(DISTINCT visitor_id) FILTER (WHERE visit_date>=CURRENT_DATE-INTERVAL '29 days')::int AS visitors_30d FROM site_visits`),
          analyticsPool.query(`SELECT visit_date::text AS date, COUNT(*)::int AS visits, COUNT(DISTINCT visitor_id)::int AS visitors FROM site_visits WHERE visit_date>=CURRENT_DATE-INTERVAL '29 days' GROUP BY visit_date ORDER BY visit_date ASC`)
        ]);
        res.json({ ...totals.rows[0], days: days.rows });
      } catch (error) {
        console.error('SITE_ANALYTICS_API_ERROR:', error);
        res.status(500).json({ error: 'Statistiques indisponibles' });
      }
    });
    stack.unshift(...(api.stack || []));

    // Inject the analytics dashboard script into the already-injected admin HTML response.
    const injector = express.Router();
    injector.use((req, res, next) => {
      const originalSend = res.send.bind(res);
      res.send = function analyticsSend(body) {
        try {
          if ((req.path === '/admin.html' || req.path === '/admin-dashboard.html') && typeof body === 'string' && body.includes('</body>') && !body.includes('/site-analytics-admin.js')) {
            body = body.replace('</body>', '<script src="/site-analytics-admin.js?v=20261019-1" defer></script></body>');
          }
        } catch (error) {
          console.error('SITE_ANALYTICS_HTML_INJECT_ERROR:', error.message);
        }
        return originalSend(body);
      };
      next();
    });
    stack.unshift(...(injector.stack || []));
  }

  return originalListen.apply(app, args);
};
