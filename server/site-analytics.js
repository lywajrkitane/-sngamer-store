const express = require('express');
const crypto = require('crypto');

module.exports = function siteAnalytics(db, requireAdmin) {
  const router = express.Router();

  router.post('/api/analytics/visit', async (req, res) => {
    try {
      const visitorId = String(req.body?.visitorId || '').slice(0, 128);
      if (!visitorId) return res.status(400).json({ error: 'visitorId requis' });
      const today = new Date().toISOString().slice(0, 10);
      const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
      const ipHash = crypto.createHash('sha256').update(ip).digest('hex');
      await db(`CREATE TABLE IF NOT EXISTS site_visits (id BIGSERIAL PRIMARY KEY, visitor_id TEXT NOT NULL, visit_date DATE NOT NULL, ip_hash TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
      await db(`CREATE INDEX IF NOT EXISTS idx_site_visits_date ON site_visits(visit_date)`);
      await db(`INSERT INTO site_visits(visitor_id, visit_date, ip_hash) VALUES($1,$2,$3)`, [visitorId, today, ipHash]);
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: 'analytics indisponible' }); }
  });

  router.get('/api/admin/analytics', requireAdmin, async (req, res) => {
    try {
      await db(`CREATE TABLE IF NOT EXISTS site_visits (id BIGSERIAL PRIMARY KEY, visitor_id TEXT NOT NULL, visit_date DATE NOT NULL, ip_hash TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
      const result = await db(`SELECT COUNT(*)::int AS visits, COUNT(DISTINCT visitor_id)::int AS visitors, COUNT(DISTINCT visitor_id) FILTER (WHERE visit_date = CURRENT_DATE)::int AS visitors_today, COUNT(*) FILTER (WHERE visit_date = CURRENT_DATE)::int AS visits_today, COUNT(DISTINCT visitor_id) FILTER (WHERE visit_date >= CURRENT_DATE - INTERVAL '6 days')::int AS visitors_7d, COUNT(*) FILTER (WHERE visit_date >= CURRENT_DATE - INTERVAL '6 days')::int AS visits_7d, COUNT(DISTINCT visitor_id) FILTER (WHERE visit_date >= CURRENT_DATE - INTERVAL '29 days')::int AS visitors_30d, COUNT(*) FILTER (WHERE visit_date >= CURRENT_DATE - INTERVAL '29 days')::int AS visits_30d FROM site_visits`);
      res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: 'analytics indisponible' }); }
  });

  return router;
};
