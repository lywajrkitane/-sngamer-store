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

function cookies(req) {
  const out = {};
  String(req.headers.cookie || '').split(';').forEach(part => {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

function setCookie(res, name, value, maxAge) {
  const line = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=Lax`;
  const old = res.getHeader('Set-Cookie');
  res.setHeader('Set-Cookie', old ? [].concat(old, line) : line);
}

function installAnalytics(app) {
  const stack = app._router && app._router.stack;
  if (!stack || app.__sngAnalyticsInstalled) return;
  app.__sngAnalyticsInstalled = true;

  // Visitor tracking: one visit per visitor per 30 minutes.
  const tracker = express.Router();
  tracker.use(async (req, res, next) => {
    try {
      if (req.method === 'GET' && req.path === '/api/products') {
        await ensureTable();
        const jar = cookies(req);
        const visitorId = jar.sg_visitor_id || crypto.randomUUID();
        if (!jar.sg_visitor_id) setCookie(res, 'sg_visitor_id', visitorId, 31536000);

        const last = Number(jar.sg_last_visit || 0);
        const now = Date.now();
        if (!last || now - last > 1800000) {
          await analyticsPool.query(
            `INSERT INTO site_visits(visitor_id, visit_date) VALUES($1, CURRENT_DATE)`,
            [visitorId]
          );
          setCookie(res, 'sg_last_visit', String(now), 31536000);
        }
      }
    } catch (e) {
      console.error('SITE_ANALYTICS_TRACK_ERROR:', e.message);
    }
    next();
  });

  const productsIndex = stack.findIndex(
    layer => layer?.route?.path === '/api/products' && layer.route.methods?.get
  );
  if (productsIndex >= 0) stack.splice(productsIndex, 0, ...tracker.stack);

  // Admin analytics API. Register it with app.use() after the existing
  // application middleware so express-session is always available.
  const api = express.Router();
  api.get('/api/admin/analytics', async (req, res) => {
    if (!req.session?.admin) return res.status(401).json({ error: 'Non autorisé' });

    try {
      await ensureTable();
      const [totals, days, orders] = await Promise.all([
        analyticsPool.query(`
          SELECT
            COUNT(*)::int AS visits,
            COUNT(DISTINCT visitor_id)::int AS visitors,
            COUNT(*) FILTER (WHERE visit_date = CURRENT_DATE)::int AS visits_today,
            COUNT(DISTINCT visitor_id) FILTER (WHERE visit_date = CURRENT_DATE)::int AS visitors_today,
            COUNT(*) FILTER (WHERE visit_date >= CURRENT_DATE - INTERVAL '6 days')::int AS visits_7d,
            COUNT(DISTINCT visitor_id) FILTER (WHERE visit_date >= CURRENT_DATE - INTERVAL '6 days')::int AS visitors_7d,
            COUNT(*) FILTER (WHERE visit_date >= CURRENT_DATE - INTERVAL '29 days')::int AS visits_30d,
            COUNT(DISTINCT visitor_id) FILTER (WHERE visit_date >= CURRENT_DATE - INTERVAL '29 days')::int AS visitors_30d
          FROM site_visits
        `),
        analyticsPool.query(`
          SELECT
            visit_date::text AS date,
            COUNT(*)::int AS visits,
            COUNT(DISTINCT visitor_id)::int AS visitors
          FROM site_visits
          WHERE visit_date >= CURRENT_DATE - INTERVAL '29 days'
          GROUP BY visit_date
          ORDER BY visit_date ASC
        `),
        analyticsPool.query(`
          SELECT
            COUNT(*)::int AS orders,
            COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::int AS orders_today,
            COALESCE(SUM(total) FILTER (WHERE created_at >= CURRENT_DATE), 0)::int AS revenue_today
          FROM orders
        `)
      ]);

      res.set('Cache-Control', 'no-store');
      res.json({ ...totals.rows[0], ...orders.rows[0], days: days.rows });
    } catch (e) {
      console.error('SITE_ANALYTICS_API_ERROR:', e);
      res.status(500).json({ error: 'Statistiques indisponibles' });
    }
  });
  // Register this API before the wildcard frontend route in server/server.js.
  // That wildcard sends index.html for unmatched URLs; if the API is appended
  // afterward, fetch(...).json() receives HTML and throws "Unexpected token '<'".
  // The session middleware is already registered earlier in the app stack, so
  // inserting immediately before the catch-all preserves the authenticated session.
  const catchAllIndex = stack.findIndex(layer => {
    if (!layer || !layer.route || !layer.route.methods || !layer.route.methods.get) return false;
    const routePath = layer.route.path;
    return routePath === "*" || (Array.isArray(routePath) && routePath.includes("*"));
  });
  if (catchAllIndex >= 0) {
    stack.splice(catchAllIndex, 0, ...api.stack);
  } else {
    stack.push(...api.stack);
  }

  // Compatibility fallback for admin pages. The admin HTML and data-fix
  // already load the UI script, so this is intentionally only a fallback.
  const injector = express.Router();
  injector.use((req, res, next) => {
    try {
      if (typeof res.send !== 'function') return next();
      const send = res.send.bind(res);
      res.send = function(body) {
        try {
          if (
            (req.path === '/admin.html' || req.path === '/admin-dashboard.html') &&
            typeof body === 'string' &&
            body.includes('</body>') &&
            !body.includes('/site-analytics-admin.js')
          ) {
            body = body.replace(
              '</body>',
              '<script src="/site-analytics-admin.js?v=20261019-9" defer></script></body>'
            );
          }
        } catch (e) {
          console.error('SITE_ANALYTICS_HTML_INJECT_ERROR:', e.message);
        }
        return send(body);
      };
    } catch (e) {
      console.error('SITE_ANALYTICS_SEND_WRAP_ERROR:', e.message);
    }
    next();
  });
  stack.unshift(...injector.stack);
}

// bootstrap.js replaces express.application.listen. A setter wrapper survives
// that later assignment and installs analytics around the final listener.
const target = express.application;
const existingListen = target.listen;
let currentListen = existingListen;

function analyticsListenWrapper(nextListen) {
  return function analyticsAwareListen(...args) {
    try {
      installAnalytics(this);
    } catch (e) {
      console.error('SITE_ANALYTICS_INSTALL_ERROR:', e);
    }
    return nextListen.apply(this, args);
  };
}

Object.defineProperty(target, 'listen', {
  configurable: true,
  enumerable: false,
  get() {
    return currentListen;
  },
  set(nextListen) {
    currentListen = analyticsListenWrapper(nextListen);
  }
});

currentListen = analyticsListenWrapper(existingListen);
