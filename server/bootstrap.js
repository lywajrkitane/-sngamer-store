const express = require("express");
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
const { installCustomerSystem } = require("./customer-system");
const { initCustomersTable, ensureOrderCustomerColumns } = require("./customer-bootstrap-db");

const guestOrderPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

function installGuestOrderRoute(app) {
  const guestRouter = express.Router();
  guestRouter.post(["/api/orders", "/api/customer/orders"], async (req, res) => {
    const client = await guestOrderPool.connect();
    try {
      const { customer, payment, items } = req.body || {};
      const allowedPayments = ["Wave", "Orange Money", "PayPal"];
      const name = String(customer?.name || "").trim();
      const phone = String(customer?.phone || "").trim();
      const address = String(customer?.address || "").trim();
      if (!name || !phone || !address || !allowedPayments.includes(payment) || !Array.isArray(items)) {
        return res.status(400).json({ error: "Remplis les informations de commande et sélectionne un moyen de paiement valide." });
      }
      if (!items.length) return res.status(400).json({ error: "Le panier est vide" });
      await client.query("BEGIN");
      let total = 0;
      const finalItems = [];
      for (const item of items) {
        const productId = Number(item.id);
        const quantity = Number(item.quantity ?? item.qty);
        if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity <= 0) throw new Error("Produit ou quantité invalide");
        const productResult = await client.query(`SELECT id,name,price,promo_price,promo_active,stock,emoji FROM products WHERE id=$1 FOR UPDATE`, [productId]);
        if (!productResult.rows.length) throw new Error("Produit introuvable");
        const product = productResult.rows[0];
        if (Number(product.stock) < quantity) throw new Error(`Stock insuffisant pour ${product.name}`);
        const promoActive = Boolean(product.promo_active) && Number(product.promo_price) > 0 && Number(product.promo_price) < Number(product.price);
        const unitPrice = promoActive ? Number(product.promo_price) : Number(product.price);
        const subtotal = unitPrice * quantity;
        total += subtotal;
        finalItems.push({ id: product.id, name: product.name, price: unitPrice, quantity, subtotal, emoji: product.emoji });
      }
      const orderCustomer = { name, phone, address, email: String(customer?.email || "").trim() };
      const customerId = req.session?.customerId || null;
      const result = await client.query(`INSERT INTO orders (customer_id,status,customer,payment,items,total) VALUES ($1,'Nouvelle',$2,$3,$4,$5) RETURNING id,created_at,status,customer,payment,items,total`, [customerId, JSON.stringify(orderCustomer), payment, JSON.stringify(finalItems), total]);
      await client.query("COMMIT");
      res.status(201).json({ success: true, orderId: result.rows[0].id, order: result.rows[0], guest: !customerId });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("GUEST_ORDER_ERROR:", error);
      res.status(400).json({ error: error.message || "Impossible de créer la commande" });
    } finally { client.release(); }
  });
  const stack = app._router && app._router.stack;
  if (!stack) return;
  const orderIndex = stack.findIndex(layer => layer && layer.route && layer.route.path === "/api/orders" && layer.route.methods?.post);
  if (orderIndex >= 0) stack.splice(orderIndex, 0, ...(guestRouter.stack || [])); else stack.unshift(...(guestRouter.stack || []));
}

const originalListen = express.application.listen;
express.application.listen = function patchedListen(...args) {
  const app = this;
  const router = installCustomerSystem();
  const stack = app._router && app._router.stack;
  if (stack) {
    installGuestOrderRoute(app);
    const adminInjection = function(req, res, next) {
      const target = req.path === "/admin-dashboard.html" || req.path === "/admin.html";
      if (!target || req.method !== "GET") return next();
      const file = path.join(__dirname, "..", "public", req.path.replace(/^\//, ""));
      if (!fs.existsSync(file)) return next();
      try {
        let html = fs.readFileSync(file, "utf8");
        if (!html.includes("customer-admin.js")) html = html.replace(/<\/body>/i, '<script src="/customer-admin.js" defer></script></body>');
        if (!html.includes("admin-v2.css")) html = html.replace(/<\/head>/i, '<link rel="stylesheet" href="/admin-v2.css?v=20261016-2200"></head>');
        if (!html.includes("admin-v2.js")) html = html.replace(/<\/body>/i, '<script src="/admin-v2.js?v=20261016-2200" defer></script></body>');
        res.type("html").send(html);
      } catch (error) { console.error("ADMIN_HTML_INJECTION_ERROR:", error); next(); }
    };
    const injectionRouter = express.Router(); injectionRouter.use(adminInjection);
    let staticIndex = stack.length;
    for (let i=0;i<stack.length;i++){const layer=stack[i];if(layer&&layer.handle&&layer.handle.name==="serveStatic"){staticIndex=i;break;}}
    stack.splice(staticIndex,0,...(injectionRouter.stack||[]));
    let catchAllIndex=stack.length;
    for(let i=0;i<stack.length;i++){const layer=stack[i];if(layer&&layer.regexp&&String(layer.regexp).includes("fast_star")){catchAllIndex=i;break;}}
    stack.splice(catchAllIndex,0,...(router.stack||[]));
  }
  ensureOrderCustomerColumns().then(()=>originalListen.apply(app,args)).catch(error=>{console.error("CUSTOMER_ORDER_DB_BOOT_ERROR:",error);process.exit(1);});
};

(async()=>{try{await initCustomersTable();require("./server");}catch(error){console.error("CUSTOMER_SYSTEM_BOOT_ERROR:",error);process.exit(1);}})();
