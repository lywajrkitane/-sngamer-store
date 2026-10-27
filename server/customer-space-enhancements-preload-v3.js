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
    CREATE TABLE IF NOT EXISTS customer_favorites (
      customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (customer_id, product_id)
    );
    CREATE INDEX IF NOT EXISTS idx_customer_favorites_customer ON customer_favorites(customer_id);
    CREATE TABLE IF NOT EXISTS product_reviews (
      id BIGSERIAL PRIMARY KEY,
      product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (product_id, customer_id)
    );
    CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON product_reviews(product_id);
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
    } catch (error) { console.error("CUSTOMER_HIDE_ORDER_ERROR:", error); res.status(500).json({ error: "Impossible de supprimer la commande de votre espace client." }); }
  });
  router.get("/api/customer/favorites", async (req, res) => {
    try {
      if (!req.session?.customerId) return res.status(401).json({ error: "Connexion client requise" });
      const result = await enhancementPool.query(`SELECT p.id,p.name,p.price,p.promo_price,p.promo_active,p.stock,p.emoji,p.image1_url,p.image2_url,p.image3_url FROM customer_favorites f JOIN products p ON p.id=f.product_id WHERE f.customer_id=$1 ORDER BY f.created_at DESC`,[req.session.customerId]);
      res.json({ products: result.rows });
    } catch (error) { console.error("CUSTOMER_FAVORITES_GET_ERROR:", error); res.status(500).json({ error: "Impossible de charger les favoris." }); }
  });
  router.put("/api/customer/favorites/:id", async (req, res) => {
    try {
      if (!req.session?.customerId) return res.status(401).json({ error: "Connexion client requise" });
      const productId=Number(req.params.id);
      if(!Number.isInteger(productId)||productId<=0)return res.status(400).json({error:"Produit invalide."});
      const product=await enhancementPool.query(`SELECT id FROM products WHERE id=$1 LIMIT 1`,[productId]);
      if(!product.rows.length)return res.status(404).json({error:"Produit introuvable."});
      await enhancementPool.query(`INSERT INTO customer_favorites(customer_id,product_id) VALUES($1,$2) ON CONFLICT(customer_id,product_id) DO NOTHING`,[req.session.customerId,productId]);
      res.json({success:true,favorite:true});
    } catch(error){console.error("CUSTOMER_FAVORITE_ADD_ERROR:",error);res.status(500).json({error:"Impossible d'ajouter ce produit aux favoris."});}
  });
  router.delete("/api/customer/favorites/:id", async (req, res) => {
    try {
      if (!req.session?.customerId) return res.status(401).json({ error: "Connexion client requise" });
      const productId=Number(req.params.id);
      if(!Number.isInteger(productId)||productId<=0)return res.status(400).json({error:"Produit invalide."});
      await enhancementPool.query(`DELETE FROM customer_favorites WHERE customer_id=$1 AND product_id=$2`,[req.session.customerId,productId]);
      res.json({success:true,favorite:false});
    } catch(error){console.error("CUSTOMER_FAVORITE_REMOVE_ERROR:",error);res.status(500).json({error:"Impossible de retirer ce produit des favoris."});}
  });
  router.get("/api/products/:id/reviews", async (req, res) => {
    try {
      const productId=Number(req.params.id);
      if(!Number.isInteger(productId)||productId<=0)return res.status(400).json({error:"Produit invalide."});
      const summary=await enhancementPool.query(`SELECT COALESCE(AVG(rating),0)::numeric(3,1) AS average,COUNT(*)::int AS count FROM product_reviews WHERE product_id=$1`,[productId]);
      const rows=await enhancementPool.query(`SELECT r.id,r.rating,r.comment,r.created_at,c.name FROM product_reviews r JOIN customers c ON c.id=r.customer_id WHERE r.product_id=$1 ORDER BY r.created_at DESC LIMIT 50`,[productId]);
      let myRating=null;
      if(req.session?.customerId){const mine=await enhancementPool.query(`SELECT rating FROM product_reviews WHERE product_id=$1 AND customer_id=$2 LIMIT 1`,[productId,req.session.customerId]);if(mine.rows.length)myRating=Number(mine.rows[0].rating);}
      res.json({average:Number(summary.rows[0]?.average||0),count:Number(summary.rows[0]?.count||0),myRating,reviews:rows.rows.map(r=>({id:Number(r.id),rating:Number(r.rating),comment:r.comment||"",created_at:r.created_at,name:r.name||"Client"}))});
    } catch(error){console.error("PRODUCT_REVIEWS_GET_ERROR:",error);res.status(500).json({error:"Impossible de charger les avis."});}
  });
  router.post("/api/products/:id/reviews", async (req, res) => {
    try {
      if(!req.session?.customerId)return res.status(401).json({error:"Connexion client requise"});
      const productId=Number(req.params.id), rating=Number(req.body?.rating);
      if(!Number.isInteger(productId)||productId<=0)return res.status(400).json({error:"Produit invalide."});
      if(!Number.isInteger(rating)||rating<1||rating>5)return res.status(400).json({error:"La note doit être comprise entre 1 et 5 étoiles."});
      const product=await enhancementPool.query(`SELECT id FROM products WHERE id=$1 LIMIT 1`,[productId]);
      if(!product.rows.length)return res.status(404).json({error:"Produit introuvable."});
      await enhancementPool.query(`INSERT INTO product_reviews(product_id,customer_id,rating) VALUES($1,$2,$3) ON CONFLICT(product_id,customer_id) DO UPDATE SET rating=EXCLUDED.rating,updated_at=NOW()`,[productId,req.session.customerId,rating]);
      const summary=await enhancementPool.query(`SELECT COALESCE(AVG(rating),0)::numeric(3,1) AS average,COUNT(*)::int AS count FROM product_reviews WHERE product_id=$1`,[productId]);
      res.json({success:true,average:Number(summary.rows[0]?.average||0),count:Number(summary.rows[0]?.count||0),myRating:rating});
    } catch(error){console.error("PRODUCT_REVIEW_POST_ERROR:",error);res.status(500).json({error:"Impossible d'enregistrer la note."});}
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
      const paytechTag = '<script src="/paytech-checkout.js?v=20261021-stockcancel1"></script>';
      const customerTag = '<script src="/customer-space-enhancements.js?v=20261027-profile-catalog-stability1" defer></script>';
      const pushTag = '<script src="/customer-push.js?v=20261024-stock-rootcause2" defer></script>';
      const premiumCssTag = '<link rel="stylesheet" href="/premium-dialogs-v1.css?v=20261018-1525">';
      const premiumJsTag = '<script src="/premium-dialogs-v1.js?v=20261018-1525"></script>';
      const desktopProfileTag = '<script src="/desktop-profile-entry-v1.js?v=20261027-profile-catalog-stability1" defer></script>';
      const productSocialTag = '<script src="/product-social-v1.js?v=20261027-social-canonical2" defer></script>';
      const finalShellTag = '<script src="/store-shell-final-v1.js?v=20261027-profile-catalog-stability1" defer></script>';
      if (!html.includes("/paytech-checkout.js")) html = html.replace(/<\/body>/i, `${paytechTag}</body>`);
      if (!html.includes("/customer-space-enhancements.js")) html = html.replace(/<\/body>/i, `${customerTag}</body>`);
      if (!html.includes("/customer-push.js")) html = html.replace(/<\/body>/i, `${pushTag}</body>`);
      if (!html.includes("premium-dialogs-v1.css")) html = html.replace(/<\/head>/i, `${premiumCssTag}</head>`);
      if (!html.includes("premium-dialogs-v1.js")) html = html.replace(/<\/body>/i, `${premiumJsTag}</body>`);
      if (!html.includes("desktop-profile-entry-v1.js")) html = html.replace(/<\/body>/i, `${desktopProfileTag}</body>`);
      html = html.replace(/<script\b[^>]*src=["'][^"']*customer-profile-premium-v1\.js[^"']*["'][^>]*>\s*<\/script>/gi, "");
      if (!html.includes("/product-social-v1.js")) html = html.replace(/<\/body>/i, `${productSocialTag}</body>`);
      html = html.replace(/<script\b[^>]*src=["'][^"']*\/product-image-actions-[^"']+\.js(?:\?[^"']*)?["'][^>]*>\s*<\/script>/gi, "");
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
const originalUse = express.application.use;
express.application.use = function customerSpaceUse(...args) { return originalUse.apply(this, args); };
express.application.listen = function customerSpaceListenPatched(...args) {
  const app = this;
  const start = async () => {
    try {
      await ensureCustomerSpaceEnhancements();
      const stack = app._router && app._router.stack;
      if (stack) {
        const customerRouter = installCustomerSpaceRoutes();
        const catchAllIndex = stack.findIndex(layer => {
          if (!layer || !layer.route || !layer.route.methods || !layer.route.methods.get) return false;
          const routePath = layer.route.path;
          return routePath === "*" || (Array.isArray(routePath) && routePath.includes("*"));
        });
        if (catchAllIndex >= 0) stack.splice(catchAllIndex, 0, ...(customerRouter.stack || []));
        else stack.push(...(customerRouter.stack || []));
        injectCustomerSpaceScript(app);
        try { initPushDatabase(); installPushRoutes(app); } catch (pushError) { console.error("CUSTOMER_PUSH_BOOT_ERROR:", pushError); }
        try { installOrderStatusObserver(app); } catch (statusError) { console.error("ORDER_STATUS_OBSERVER_BOOT_ERROR:", statusError); }
      }
      return originalListen.apply(app, args);
    } catch (error) {
      console.error("CUSTOMER_SPACE_ENHANCEMENTS_BOOT_ERROR:", error);
      process.exit(1);
    }
  };
  return start();
};
