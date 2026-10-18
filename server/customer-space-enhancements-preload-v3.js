const express = require("express");
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const CUSTOMER_SESSION_MAX_AGE = 1000 * 60 * 60 * 24 * 30;
const enhancementPool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function ensureCustomerSpaceEnhancements() {
  await enhancementPool.query(`
    CREATE TABLE IF NOT EXISTS customer_hidden_orders (
      customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      hidden_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (customer_id, order_id)
    );
    CREATE INDEX IF NOT EXISTS idx_customer_hidden_orders_customer ON customer_hidden_orders(customer_id);
  `);
}

function installCustomerSpaceRoutes() {
  const router = express.Router();
  router.use((req, res, next) => {
    if (req.session?.customerId) { req.session.cookie.maxAge = CUSTOMER_SESSION_MAX_AGE; req.session.touch(); }
    const originalJson = res.json.bind(res);
    res.json = function persistentCustomerJson(body) {
      if (!req.session?.customerId) return originalJson(body);
      req.session.cookie.maxAge = CUSTOMER_SESSION_MAX_AGE;
      req.session.touch();
      return req.session.save(error => { if (error) console.error("CUSTOMER_SESSION_SAVE_ERROR:", error); originalJson(body); });
    };
    next();
  });

  router.get("/api/customer/hidden-orders", async (req, res) => {
    try {
      if (!req.session?.customerId) return res.status(401).json({ error: "Connexion client requise" });
      const result = await enhancementPool.query(`SELECT order_id FROM customer_hidden_orders WHERE customer_id=$1 ORDER BY hidden_at DESC`, [req.session.customerId]);
      res.json({ orderIds: result.rows.map(row => Number(row.order_id)) });
    } catch (error) { console.error("CUSTOMER_HIDDEN_ORDERS_ERROR:", error); res.status(500).json({ error: "Impossible de charger les commandes masquées." }); }
  });

  router.delete("/api/customer/orders/:id/hide", async (req, res) => {
    try {
      if (!req.session?.customerId) return res.status(401).json({ error: "Connexion client requise" });
      const orderId = Number(req.params.id);
      if (!Number.isInteger(orderId) || orderId <= 0) return res.status(400).json({ error: "Commande invalide." });
      const owned = await enhancementPool.query(`SELECT id FROM orders WHERE id=$1 AND customer_id=$2 LIMIT 1`, [orderId, req.session.customerId]);
      if (!owned.rows.length) return res.status(404).json({ error: "Commande introuvable dans votre espace client." });
      await enhancementPool.query(`INSERT INTO customer_hidden_orders (customer_id, order_id) VALUES ($1,$2) ON CONFLICT (customer_id, order_id) DO UPDATE SET hidden_at=NOW()`, [req.session.customerId, orderId]);
      res.json({ success: true, message: "Commande supprimée de votre espace client." });
    } catch (error) { console.error("CUSTOMER_HIDE_ORDER_ERROR:", error); res.status(500).json({ error: "Impossible de supprimer cette commande de votre espace client." }); }
  });
  return router;
}

function injectCustomerSpaceScript(app) {
  const router = express.Router();
  router.get(["/", "/index.html"], (req, res, next) => {
    const indexPath = path.join(__dirname, "..", "public", "index.html");
    if (!fs.existsSync(indexPath)) return next();
    try {
      let html = fs.readFileSync(indexPath, "utf8");
      const paytechTag = '<script src="/paytech-checkout.js?v=20261017-2010"></script>';
      const customerTag = '<script src="/customer-space-enhancements.js?v=20261018-1435" defer></script>';
      if (!html.includes("/paytech-checkout.js")) html = html.replace(/<\/body>/i, `${paytechTag}</body>`);
      if (!html.includes("/customer-space-enhancements.js")) html = html.replace(/<\/body>/i, `${customerTag}</body>`);
      res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate"); res.set("Pragma", "no-cache"); res.set("Expires", "0");
      return res.type("html").send(html);
    } catch (error) { console.error("CUSTOMER_SPACE_HTML_INJECTION_ERROR:", error); return next(); }
  });
  const stack = app._router && app._router.stack;
  if (!stack) return;
  const staticIndex = stack.findIndex(layer => layer && layer.handle && layer.handle.name === "serveStatic");
  if (staticIndex >= 0) stack.splice(staticIndex, 0, ...(router.stack || []));
}

const originalListen = express.application.listen;
express.application.listen = function customerSpaceListenPatched(...args) {
  const app = this;
  const start = async () => {
    try {
      await ensureCustomerSpaceEnhancements();
      const stack = app._router && app._router.stack;
      if (stack) {
        const enhancementRouter = installCustomerSpaceRoutes();
        const catchAllIndex = stack.findIndex(layer => {
          if (!layer || !layer.route || !layer.route.methods || !layer.route.methods.get) return false;
          const routePath = layer.route.path;
          return routePath === "*" || (Array.isArray(routePath) && routePath.includes("*"));
        });
        if (catchAllIndex >= 0) stack.splice(catchAllIndex, 0, ...(enhancementRouter.stack || [])); else stack.push(...(enhancementRouter.stack || []));
        injectCustomerSpaceScript(app);
      }
      return originalListen.apply(app, args);
    } catch (error) { console.error("CUSTOMER_SPACE_ENHANCEMENTS_BOOT_ERROR:", error); process.exit(1); }
  };
  return start();
};
