const bcrypt = require("bcryptjs");
const { Pool } = require("pg");
const express = require("express");

const customerPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

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
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `);

  await customerPool.query(`
    CREATE INDEX IF NOT EXISTS idx_orders_customer_id
    ON orders(customer_id);
  `);
}

function cleanCustomer(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || "",
    address: row.address || "",
    created_at: row.created_at,
    updated_at: row.updated_at,
    last_login_at: row.last_login_at || null
  };
}

function requireCustomer(req, res, next) {
  if (!req.session.customerId) {
    return res.status(401).json({ error: "Connexion client requise" });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.admin) {
    return res.status(401).json({ error: "Non autorisé" });
  }
  next();
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

      if (!name || !email || !password) {
        return res.status(400).json({ error: "Nom, e-mail et mot de passe sont obligatoires." });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: "Le mot de passe doit contenir au moins 6 caractères." });
      }

      const exists = await customerPool.query(
        "SELECT id FROM customers WHERE email = $1",
        [email]
      );
      if (exists.rows.length) {
        return res.status(409).json({ error: "Un compte existe déjà avec cet e-mail." });
      }

      const hash = await bcrypt.hash(password, 12);
      const result = await customerPool.query(
        `INSERT INTO customers (name,email,phone,address,password_hash)
         VALUES ($1,$2,$3,$4,$5)
         RETURNING id,name,email,phone,address,created_at,updated_at,last_login_at`,
        [name, email, phone, address, hash]
      );

      req.session.customerId = result.rows[0].id;
      req.session.customerName = result.rows[0].name;

      res.status(201).json({ success: true, customer: cleanCustomer(result.rows[0]) });
    } catch (error) {
      console.error("CUSTOMER_REGISTER_ERROR:", error);
      res.status(500).json({ error: "Impossible de créer le compte." });
    }
  });

  router.post("/api/customer/login", async (req, res) => {
    try {
      const email = String(req.body.email || "").trim().toLowerCase();
      const password = String(req.body.password || "");
      if (!email || !password) {
        return res.status(400).json({ error: "E-mail et mot de passe sont obligatoires." });
      }

      const result = await customerPool.query(
        "SELECT * FROM customers WHERE email = $1",
        [email]
      );
      const customer = result.rows[0];
      if (!customer || !(await bcrypt.compare(password, customer.password_hash))) {
        return res.status(401).json({ error: "E-mail ou mot de passe incorrect." });
      }

      await customerPool.query(
        "UPDATE customers SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1",
        [customer.id]
      );

      req.session.customerId = customer.id;
      req.session.customerName = customer.name;

      res.json({ success: true, customer: cleanCustomer(customer) });
    } catch (error) {
      console.error("CUSTOMER_LOGIN_ERROR:", error);
      res.status(500).json({ error: "Impossible de se connecter." });
    }
  });

  router.post("/api/customer/logout", (req, res) => {
    delete req.session.customerId;
    delete req.session.customerName;
    res.json({ success: true });
  });

  router.get("/api/customer/me", requireCustomer, async (req, res) => {
    try {
      const result = await customerPool.query(
        `SELECT id,name,email,phone,address,created_at,updated_at,last_login_at
         FROM customers WHERE id = $1`,
        [req.session.customerId]
      );
      if (!result.rows.length) {
        delete req.session.customerId;
        return res.status(401).json({ error: "Compte client introuvable." });
      }
      res.json({ authenticated: true, customer: cleanCustomer(result.rows[0]) });
    } catch (error) {
      console.error("CUSTOMER_ME_ERROR:", error);
      res.status(500).json({ error: "Impossible de charger le profil." });
    }
  });

  router.patch("/api/customer/me", requireCustomer, async (req, res) => {
    try {
      const name = String(req.body.name || "").trim();
      const phone = String(req.body.phone || "").trim();
      const address = String(req.body.address || "").trim();
      if (!name) return res.status(400).json({ error: "Le nom est obligatoire." });

      const result = await customerPool.query(
        `UPDATE customers
         SET name=$1, phone=$2, address=$3, updated_at=NOW()
         WHERE id=$4
         RETURNING id,name,email,phone,address,created_at,updated_at,last_login_at`,
        [name, phone, address, req.session.customerId]
      );
      if (!result.rows.length) return res.status(404).json({ error: "Compte introuvable." });
      req.session.customerName = name;
      res.json({ success: true, customer: cleanCustomer(result.rows[0]) });
    } catch (error) {
      console.error("CUSTOMER_UPDATE_ERROR:", error);
      res.status(500).json({ error: "Impossible de modifier le profil." });
    }
  });

  router.get("/api/customer/orders", requireCustomer, async (req, res) => {
    try {
      const result = await customerPool.query(
        `SELECT id,created_at,status,customer,payment,items,total,customer_message,tracking_code,updated_at
         FROM orders WHERE customer_id=$1 ORDER BY created_at DESC`,
        [req.session.customerId]
      );
      res.json(result.rows);
    } catch (error) {
      console.error("CUSTOMER_ORDERS_ERROR:", error);
      res.status(500).json({ error: "Impossible de charger les commandes." });
    }
  });

  router.post("/api/customer/orders", requireCustomer, async (req, res) => {
    const client = await customerPool.connect();
    try {
      const { payment, items } = req.body;
      if (!payment || !Array.isArray(items) || !items.length) {
        return res.status(400).json({ error: "Données de commande invalides." });
      }

      const customerResult = await client.query(
        "SELECT id,name,email,phone,address FROM customers WHERE id=$1",
        [req.session.customerId]
      );
      if (!customerResult.rows.length) return res.status(401).json({ error: "Compte client introuvable." });
      const customer = customerResult.rows[0];

      await client.query("BEGIN");
      let total = 0;
      const finalItems = [];

      for (const item of items) {
        const productId = Number(item.id);
        const quantity = Number(item.qty ?? item.quantity);
        if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity <= 0) {
          throw new Error("Produit ou quantité invalide");
        }

        const productResult = await client.query(
          `SELECT id,name,price,promo_price,promo_active,stock,emoji
           FROM products WHERE id=$1 FOR UPDATE`,
          [productId]
        );
        if (!productResult.rows.length) throw new Error("Produit introuvable");
        const product = productResult.rows[0];
        if (Number(product.stock) < quantity) throw new Error(`Stock insuffisant pour ${product.name}`);

        const promo = Boolean(product.promo_active) && Number(product.promo_price) > 0 && Number(product.promo_price) < Number(product.price);
        const unitPrice = promo ? Number(product.promo_price) : Number(product.price);
        const subtotal = unitPrice * quantity;
        total += subtotal;
        finalItems.push({ id: product.id, name: product.name, price: unitPrice, quantity, subtotal, emoji: product.emoji });
      }

      const orderCustomer = {
        name: customer.name,
        email: customer.email,
        phone: customer.phone || "",
        address: customer.address || ""
      };

      const result = await client.query(
        `INSERT INTO orders (customer_id,status,customer,payment,items,total,customer_message,tracking_code,updated_at)
         VALUES ($1,'Nouvelle',$2,$3,$4,$5,'','',NOW())
         RETURNING id,created_at,status,customer,payment,items,total,customer_message,tracking_code,updated_at`,
        [customer.id, JSON.stringify(orderCustomer), payment, JSON.stringify(finalItems), total]
      );

      await client.query("COMMIT");
      res.status(201).json({ success: true, orderId: result.rows[0].id, order: result.rows[0] });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("CUSTOMER_CREATE_ORDER_ERROR:", error);
      res.status(400).json({ error: error.message || "Impossible de créer la commande." });
    } finally {
      client.release();
    }
  });

  router.get("/api/admin/customers", requireAdmin, async (req, res) => {
    try {
      const result = await customerPool.query(`
        SELECT c.id,c.name,c.email,c.phone,c.address,c.created_at,c.last_login_at,
               COUNT(o.id)::int AS order_count,
               COALESCE(SUM(o.total),0)::int AS total_spent,
               MAX(o.created_at) AS last_order_at
        FROM customers c
        LEFT JOIN orders o ON o.customer_id=c.id
        GROUP BY c.id
        ORDER BY c.created_at DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("ADMIN_CUSTOMERS_ERROR:", error);
      res.status(500).json({ error: "Impossible de charger les clients." });
    }
  });

  router.get("/api/admin/customers/:id/orders", requireAdmin, async (req, res) => {
    try {
      const result = await customerPool.query(
        `SELECT id,created_at,status,customer,payment,items,total,customer_message,tracking_code,updated_at
         FROM orders WHERE customer_id=$1 ORDER BY created_at DESC`,
        [Number(req.params.id)]
      );
      res.json(result.rows);
    } catch (error) {
      console.error("ADMIN_CUSTOMER_ORDERS_ERROR:", error);
      res.status(500).json({ error: "Impossible de charger les commandes du client." });
    }
  });

  router.patch("/api/admin/orders/:id/customer-update", requireAdmin, async (req, res) => {
    try {
      const allowedStatuses = ["Nouvelle","Confirmée","En préparation","Expédiée","Livrée","Annulée"];
      const status = String(req.body.status || "");
      const customerMessage = String(req.body.customer_message ?? "");
      const trackingCode = String(req.body.tracking_code ?? "");
      if (!allowedStatuses.includes(status)) return res.status(400).json({ error: "Statut invalide" });

      const result = await customerPool.query(
        `UPDATE orders SET status=$1,customer_message=$2,tracking_code=$3,updated_at=NOW()
         WHERE id=$4 RETURNING id,customer_id,status,customer_message,tracking_code,updated_at`,
        [status, customerMessage, trackingCode, Number(req.params.id)]
      );
      if (!result.rows.length) return res.status(404).json({ error: "Commande introuvable" });
      res.json({ success: true, order: result.rows[0] });
    } catch (error) {
      console.error("ADMIN_CUSTOMER_UPDATE_ERROR:", error);
      res.status(500).json({ error: "Impossible de mettre à jour les informations client." });
    }
  });

  return router;
}

function installCustomerSystem() {
  const router = buildRouter();
  return router;
}

module.exports = { initCustomerDatabase, installCustomerSystem };
