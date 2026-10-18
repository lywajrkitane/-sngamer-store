const bcrypt = require("bcryptjs");
const { Pool } = require("pg");
const express = require("express");

const customerPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const ORDER_STATUSES = ["Nouvelle", "Confirmée", "En préparation", "Expédiée", "Livrée", "Annulée"];
const PAYMENT_STATUSES = ["En attente", "Payé", "Échoué", "Échec"];
const REFUND_STATUSES = ["Aucun", "Demandé", "Remboursé", "Échec"];
const REFUND_PHONE = "+221 78 612 79 85";

async function initCustomerDatabase() {
  await customerPool.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      address TEXT,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_login_at TIMESTAMPTZ
    );
  `);

  await customerPool.query(`
    ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS customer_message TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS tracking_code TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'En attente',
      ADD COLUMN IF NOT EXISTS refund_status TEXT NOT NULL DEFAULT 'Aucun',
      ADD COLUMN IF NOT EXISTS refund_requested_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS cancelled_by TEXT,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `);

  await customerPool.query(`
    UPDATE orders
       SET refund_status = CASE
             WHEN payment_status = 'Remboursement demandé' THEN 'Demandé'
             WHEN payment_status = 'Remboursé' THEN 'Remboursé'
             ELSE COALESCE(refund_status, 'Aucun')
           END,
           payment_status = CASE
             WHEN payment_status IN ('Remboursement demandé', 'Remboursé') THEN 'Payé'
             WHEN payment_status = 'Échoué' THEN 'Échec'
             ELSE payment_status
           END
     WHERE payment_status IN ('Remboursement demandé', 'Remboursé', 'Échoué');
  `);

  await customerPool.query(`
    CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
    CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
  `);
}

function cleanCustomer(row) {
  if (!row) return null;
  return { id: row.id, name: row.name, email: row.email, phone: row.phone || "", address: row.address || "", created_at: row.created_at, updated_at: row.updated_at, last_login_at: row.last_login_at || null };
}

function requireCustomer(req, res, next) {
  if (!req.session.customerId) return res.status(401).json({ error: "Connexion client requise" });
  next();
}
function requireAdmin(req, res, next) {
  if (!req.session.admin) return res.status(401).json({ error: "Non autorisé" });
  next();
}

function orderSelect() {
  return `id,created_at,status,customer,payment,payment_status,refund_status,items,total,customer_message,tracking_code,refund_requested_at,refunded_at,cancelled_by,updated_at`;
}

function buildRouter() {
  const router = express.Router();

  router.post("/api/customer/register", async (req, res) => {
    try {
      const name = String(req.body.name || "").trim();
      const email = String(req.body.email || "").trim().toLowerCase();
      const phone = String(req.body.phone || "").trim();
      const address = String(req.body.address || "").trim();
      const password = String(req.body.password || "");
      if (!name || !email || !password) return res.status(400).json({ error: "Nom, e-mail et mot de passe sont obligatoires." });
      if (password.length < 6) return res.status(400).json({ error: "Le mot de passe doit contenir au moins 6 caractères." });
      const exists = await customerPool.query("SELECT id FROM customers WHERE email = $1", [email]);
      if (exists.rows.length) return res.status(409).json({ error: "Un compte existe déjà avec cet e-mail." });
      const hash = await bcrypt.hash(password, 12);
      const result = await customerPool.query(`INSERT INTO customers (name,email,phone,address,password_hash) VALUES ($1,$2,$3,$4,$5) RETURNING id,name,email,phone,address,created_at,updated_at,last_login_at`, [name, email, phone, address, hash]);
      req.session.customerId = result.rows[0].id;
      req.session.customerName = result.rows[0].name;
      res.status(201).json({ success: true, customer: cleanCustomer(result.rows[0]) });
    } catch (error) { console.error("CUSTOMER_REGISTER_ERROR:", error); res.status(500).json({ error: "Impossible de créer le compte." }); }
  });

  router.post("/api/customer/login", async (req, res) => {
    try {
      const email = String(req.body.email || "").trim().toLowerCase();
      const password = String(req.body.password || "");
      if (!email || !password) return res.status(400).json({ error: "E-mail et mot de passe sont obligatoires." });
      const result = await customerPool.query("SELECT * FROM customers WHERE email = $1", [email]);
      const customer = result.rows[0];
      if (!customer || !(await bcrypt.compare(password, customer.password_hash))) return res.status(401).json({ error: "E-mail ou mot de passe incorrect." });
      await customerPool.query("UPDATE customers SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1", [customer.id]);
      req.session.customerId = customer.id;
      req.session.customerName = customer.name;
      res.json({ success: true, customer: cleanCustomer(customer) });
    } catch (error) { console.error("CUSTOMER_LOGIN_ERROR:", error); res.status(500).json({ error: "Impossible de se connecter." }); }
  });

  router.post("/api/customer/logout", (req, res) => { delete req.session.customerId; delete req.session.customerName; res.json({ success: true }); });

  router.get("/api/customer/me", requireCustomer, async (req, res) => {
    try {
      const result = await customerPool.query(`SELECT id,name,email,phone,address,created_at,updated_at,last_login_at FROM customers WHERE id = $1`, [req.session.customerId]);
      if (!result.rows.length) { delete req.session.customerId; return res.status(401).json({ error: "Compte client introuvable." }); }
      res.json({ authenticated: true, customer: cleanCustomer(result.rows[0]) });
    } catch (error) { console.error("CUSTOMER_ME_ERROR:", error); res.status(500).json({ error: "Impossible de charger le profil." }); }
  });

  router.patch("/api/customer/me", requireCustomer, async (req, res) => {
    try {
      const name = String(req.body.name || "").trim();
      const phone = String(req.body.phone || "").trim();
      const address = String(req.body.address || "").trim();
      if (!name) return res.status(400).json({ error: "Le nom est obligatoire." });
      const result = await customerPool.query(`UPDATE customers SET name=$1, phone=$2, address=$3, updated_at=NOW() WHERE id=$4 RETURNING id,name,email,phone,address,created_at,updated_at,last_login_at`, [name, phone, address, req.session.customerId]);
      if (!result.rows.length) return res.status(404).json({ error: "Compte introuvable." });
      req.session.customerName = name;
      res.json({ success: true, customer: cleanCustomer(result.rows[0]) });
    } catch (error) { console.error("CUSTOMER_UPDATE_ERROR:", error); res.status(500).json({ error: "Impossible de modifier le profil." }); }
  });

  router.get("/api/customer/orders", requireCustomer, async (req, res) => {
    try {
      const result = await customerPool.query(`SELECT ${orderSelect()} FROM orders WHERE customer_id=$1 ORDER BY created_at DESC`, [req.session.customerId]);
      res.json(result.rows);
    } catch (error) { console.error("CUSTOMER_ORDERS_ERROR:", error); res.status(500).json({ error: "Impossible de charger les commandes." }); }
  });

  router.post("/api/customer/orders", requireCustomer, async (req, res) => {
    const client = await customerPool.connect();
    try {
      const { payment, items } = req.body;
      if (!payment || !Array.isArray(items) || !items.length) return res.status(400).json({ error: "Données de commande invalides." });
      const customerResult = await client.query("SELECT id,name,email,phone,address FROM customers WHERE id=$1", [req.session.customerId]);
      if (!customerResult.rows.length) return res.status(401).json({ error: "Compte client introuvable." });
      const customer = customerResult.rows[0];
      await client.query("BEGIN");
      let total = 0;
      const finalItems = [];
      for (const item of items) {
        const productId = Number(item.id);
        const quantity = Number(item.qty ?? item.quantity);
        if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity <= 0) throw new Error("Produit ou quantité invalide");
        const productResult = await client.query(`SELECT id,name,price,promo_price,promo_active,stock,emoji FROM products WHERE id=$1 FOR UPDATE`, [productId]);
        if (!productResult.rows.length) throw new Error("Produit introuvable");
        const product = productResult.rows[0];
        if (Number(product.stock) < quantity) throw new Error(`Stock insuffisant pour ${product.name}`);
        const promo = Boolean(product.promo_active) && Number(product.promo_price) > 0 && Number(product.promo_price) < Number(product.price);
        const unitPrice = promo ? Number(product.promo_price) : Number(product.price);
        const subtotal = unitPrice * quantity;
        total += subtotal;
        finalItems.push({ id: product.id, name: product.name, price: unitPrice, quantity, subtotal, emoji: product.emoji });
      }
      const orderCustomer = { name: customer.name, email: customer.email, phone: customer.phone || "", address: customer.address || "" };
      const result = await client.query(`INSERT INTO orders (customer_id,status,customer,payment,payment_status,items,total,customer_message,tracking_code,updated_at) VALUES ($1,'Nouvelle',$2,$3,'En attente',$4,$5,'','',NOW()) RETURNING ${orderSelect()}`, [customer.id, JSON.stringify(orderCustomer), payment, JSON.stringify(finalItems), total]);
      await client.query("COMMIT");
      res.status(201).json({ success: true, orderId: result.rows[0].id, order: result.rows[0] });
    } catch (error) { await client.query("ROLLBACK"); console.error("CUSTOMER_CREATE_ORDER_ERROR:", error); res.status(400).json({ error: error.message || "Impossible de créer la commande." }); }
    finally { client.release(); }
  });

  // Le client peut demander l'annulation, mais aucun remboursement n'est déclenché automatiquement.
  router.post("/api/customer/orders/:id/cancel", requireCustomer, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const result = await customerPool.query(`UPDATE orders SET status='Annulée', cancelled_by='client', updated_at=NOW() WHERE id=$1 AND customer_id=$2 AND status NOT IN ('Livrée','Annulée') RETURNING ${orderSelect()}`, [id, req.session.customerId]);
      if (!result.rows.length) return res.status(400).json({ error: "Cette commande ne peut plus être annulée." });
      const order = result.rows[0];
      let message = "Commande annulée. Aucun remboursement automatique n'est effectué. Contactez SNGAMER STORE au " + REFUND_PHONE + " pour demander votre remboursement.";
      if (order.payment_status === "Payé") {
        const refund = await customerPool.query(`UPDATE orders SET refund_status='Demandé', refund_requested_at=NOW(), updated_at=NOW() WHERE id=$1 RETURNING ${orderSelect()}`, [id]);
        message = "Commande annulée. Votre demande de remboursement est enregistrée. Contactez SNGAMER STORE au " + REFUND_PHONE + " pour le traitement du remboursement.";
        return res.json({ success: true, message, order: refund.rows[0] });
      }
      res.json({ success: true, message, order });
    } catch (error) { console.error("CUSTOMER_CANCEL_ORDER_ERROR:", error); res.status(500).json({ error: "Impossible d'annuler la commande." }); }
  });

  router.get("/api/admin/customers", requireAdmin, async (req, res) => {
    try {
      const result = await customerPool.query(`SELECT c.id,c.name,c.email,c.phone,c.address,c.created_at,c.last_login_at,COUNT(o.id)::int AS order_count,COALESCE(SUM(CASE WHEN o.payment_status='Payé' THEN o.total ELSE 0 END),0)::int AS total_spent,MAX(o.created_at) AS last_order_at FROM customers c LEFT JOIN orders o ON o.customer_id=c.id GROUP BY c.id ORDER BY c.created_at DESC`);
      res.json(result.rows);
    } catch (error) { console.error("ADMIN_CUSTOMERS_ERROR:", error); res.status(500).json({ error: "Impossible de charger les clients." }); }
  });

  router.get("/api/admin/customers/:id/orders", requireAdmin, async (req, res) => {
    try {
      const result = await customerPool.query(`SELECT ${orderSelect()} FROM orders WHERE customer_id=$1 ORDER BY created_at DESC`, [Number(req.params.id)]);
      res.json(result.rows);
    } catch (error) { console.error("ADMIN_CUSTOMER_ORDERS_ERROR:", error); res.status(500).json({ error: "Impossible de charger les commandes du client." }); }
  });

  // Vue financière dédiée au dashboard : seuls les paiements réellement confirmés comptent.
  router.get("/api/admin/order-finance", requireAdmin, async (req, res) => {
    try {
      const result = await customerPool.query(`SELECT COALESCE(SUM(CASE WHEN payment_status='Payé' AND COALESCE(refund_status,'Aucun') <> 'Remboursé' THEN total ELSE 0 END),0)::int AS paid_revenue, COALESCE(SUM(CASE WHEN refund_status='Remboursé' THEN total ELSE 0 END),0)::int AS refunded_total, COUNT(*) FILTER (WHERE payment_status='En attente')::int AS pending_payments, COUNT(*) FILTER (WHERE payment_status='Payé' AND COALESCE(refund_status,'Aucun') <> 'Remboursé')::int AS paid_orders, COUNT(*) FILTER (WHERE refund_status='Demandé')::int AS refund_requests FROM orders`);
      res.json({ ...result.rows[0], refund_phone: REFUND_PHONE });
    } catch (error) { console.error("ADMIN_ORDER_FINANCE_ERROR:", error); res.status(500).json({ error: "Impossible de charger les données financières." }); }
  });

  router.patch("/api/admin/orders/:id/customer-update", requireAdmin, async (req, res) => {
    try {
      const status = String(req.body.status || "");
      const customerMessage = String(req.body.customer_message ?? "");
      const trackingCode = String(req.body.tracking_code ?? "");
      if (!ORDER_STATUSES.includes(status)) return res.status(400).json({ error: "Statut invalide" });
      const result = await customerPool.query(`UPDATE orders SET status=$1,customer_message=$2,tracking_code=$3,updated_at=NOW() WHERE id=$4 RETURNING ${orderSelect()}`, [status, customerMessage, trackingCode, Number(req.params.id)]);
      if (!result.rows.length) return res.status(404).json({ error: "Commande introuvable" });
      res.json({ success: true, order: result.rows[0] });
    } catch (error) { console.error("ADMIN_CUSTOMER_UPDATE_ERROR:", error); res.status(500).json({ error: "Impossible de mettre à jour les informations client." }); }
  });

  router.patch("/api/admin/orders/:id/payment", requireAdmin, async (req, res) => {
    try {
      const paymentStatus = String(req.body.payment_status || "");
      if (!PAYMENT_STATUSES.includes(paymentStatus)) return res.status(400).json({ error: "Statut de paiement invalide" });
      const result = await customerPool.query(`UPDATE orders SET payment_status=$1, refunded_at=CASE WHEN $1='Remboursé' THEN NOW() ELSE refunded_at END, updated_at=NOW() WHERE id=$2 RETURNING ${orderSelect()}`, [paymentStatus, Number(req.params.id)]);
      if (!result.rows.length) return res.status(404).json({ error: "Commande introuvable" });
      res.json({ success: true, order: result.rows[0] });
    } catch (error) { console.error("ADMIN_PAYMENT_UPDATE_ERROR:", error); res.status(500).json({ error: "Impossible de modifier le paiement." }); }
  });

  router.delete("/api/admin/orders/:id", requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const result = await customerPool.query(`DELETE FROM orders WHERE id=$1 RETURNING id`, [id]);
      if (!result.rows.length) return res.status(404).json({ error: "Commande introuvable" });
      res.json({ success: true, deletedId: result.rows[0].id });
    } catch (error) { console.error("ADMIN_DELETE_ORDER_ERROR:", error); res.status(500).json({ error: "Impossible de supprimer la commande." }); }
  });

  return router;
}

function installCustomerSystem() { return buildRouter(); }
module.exports = { initCustomerDatabase, installCustomerSystem, ORDER_STATUSES, PAYMENT_STATUSES, REFUND_PHONE };