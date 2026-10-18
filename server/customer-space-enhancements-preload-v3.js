const express = require("express");
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
const { initPushDatabase, installPushRoutes, installOrderStatusObserver } = require("./push-notifications");

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
      const customerTag = '<script src="/customer-space-enhancements.js?v=20261018-1450" defer></script>';
      const pushTag = '<script src="/customer-push.js?v=20261018-1600" defer></script>';
      const premiumCssTag = '<link rel="stylesheet" href="/premium-dialogs-v1.css?v=20261018-1525">';
      const premiumJsTag = '<script src="/premium-dialogs-v1.js?v=20261018-1525"></script>';
      const legacyBridgeTag = '<script src="/customer-premium-legacy-bridge-v1.js?v=20261018-1900"></script>';
      const desktopProfileTag = '<script src="/desktop-profile-entry-v1.js?v=20261018-2050" defer></script>';
      if (!html.includes("/paytech-checkout.js")) html = html.replace(/<\/body>/i, `${paytechTag}</body>`);
      if (!html.includes("/customer-space-enhancements.js")) html = html.replace(/<\/body>/i, `${customerTag}</body>`);
      if (!html.includes("/customer-push.js")) html = html.replace(/<\/body>/i, `${pushTag}</body>`);
      if (!html.includes("premium-dialogs-v1.css")) html = html.replace(/<\/head>/i, `${premiumCssTag}</head>`);
      if (!html.includes("premium-dialogs-v1.js")) html = html.replace(/<\/body>/i, `${premiumJsTag}</body>`);
      if (!html.includes("customer-premium-legacy-bridge-v1.js")) html = html.replace(/<\/body>/i, `${legacyBridgeTag}</body>`);
      if (!html.includes("desktop-profile-entry-v1.js")) html = html.replace(/<\/body>/i, `${desktopProfileTag}</body>`);
      html = html.replace(/if\s*\(!confirm\(([^;]*?)\)\)\s*return;/g, 'if (!(await window.sngPremiumConfirm($1))) return;');
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
      await initPushDatabase();
      const stack = app._router && app._router.stack;
      if (stack) {
        const enhancementRouter = installCustomerSpaceRoutes();
        const pushRouter = installPushRoutes();
        const catchAllIndex = stack.findIndex(layer => {
          if (!layer || !layer.route || !layer.route.methods || !layer.route.methods.get) return false;
          const routePath = layer.route.path;
          return routePath === "*" || (Array.isArray(routePath) && routePath.includes("*"));
        });
        if (catchAllIndex >= 0) {
          stack.splice(catchAllIndex, 0, ...(enhancementRouter.stack || []), ...(pushRouter.stack || []));
        } else {
          stack.push(...(enhancementRouter.stack || []), ...(pushRouter.stack || []));
        }
        installOrderStatusObserver(app);
        injectCustomerSpaceScript(app);
      }
      return originalListen.apply(app, args);
    } catch (error) { console.error("CUSTOMER_SPACE_ENHANCEMENTS_BOOT_ERROR:", error); process.exit(1); }
  };
  return start();
};