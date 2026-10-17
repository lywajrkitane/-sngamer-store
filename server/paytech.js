const crypto = require("crypto");
const { Pool } = require("pg");

const PAYTECH_API_URL = "https://paytech.sn/api/payment/request-payment";

function publicBaseUrl(req) {
  const configured = String(process.env.PAYTECH_PUBLIC_URL || "").trim().replace(/\/$/, "");
  if (configured) return configured;
  const proto = String(req.headers["x-forwarded-proto"] || req.protocol || "https").split(",")[0];
  return `${proto}://${req.get("host")}`;
}

function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 9) return { international: `+221${digits}`, national: digits };
  if (digits.length === 12 && digits.startsWith("221")) return { international: `+${digits}`, national: digits.slice(3) };
  return { international: String(value || "").trim(), national: digits.slice(-9) };
}

function safeEqualHex(a, b) {
  const left = Buffer.from(String(a || ""), "utf8");
  const right = Buffer.from(String(b || ""), "utf8");
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

async function installPaytech(app) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return;

  const pool = new Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });

  await pool.query(`
    ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'En attente',
      ADD COLUMN IF NOT EXISTS payment_method TEXT,
      ADD COLUMN IF NOT EXISTS paytech_ref TEXT,
      ADD COLUMN IF NOT EXISTS paytech_token TEXT,
      ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ
  `);

  // The database may already contain a relation named idx_orders_paytech_ref_unique
  // from the previous PayTech system. PostgreSQL's IF NOT EXISTS only handles an
  // existing index cleanly; it can still fail when another relation owns that name.
  // Check pg_class first so the application can boot safely and the migration stays
  // idempotent across old/new PayTech deployments.
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'idx_orders_paytech_ref_unique'
          AND n.nspname = 'public'
      ) THEN
        CREATE UNIQUE INDEX idx_orders_paytech_ref_unique
          ON orders(paytech_ref)
          WHERE paytech_ref IS NOT NULL;
      END IF;
    END $$;
  `);

  app.post("/api/paytech/create", async (req, res) => {
    const client = await pool.connect();
    let orderId = null;
    try {
      const apiKey = String(process.env.PAYTECH_API_KEY || "").trim();
      const apiSecret = String(process.env.PAYTECH_API_SECRET || "").trim();
      const env = String(process.env.PAYTECH_ENV || "test").trim().toLowerCase();
      if (!apiKey || !apiSecret) {
        return res.status(503).json({ error: "PayTech n'est pas encore configuré sur le serveur." });
      }
      if (!["test", "prod"].includes(env)) {
        return res.status(500).json({ error: "PAYTECH_ENV doit être 'test' ou 'prod'." });
      }

      const { customer, payment, items } = req.body || {};
      const allowedPayments = ["Wave", "Orange Money"];
      const name = String(customer?.name || "").trim();
      const phone = String(customer?.phone || "").trim();
      const address = String(customer?.address || customer?.delivery?.address || "").trim();
      if (!name || !phone || !address || !allowedPayments.includes(payment) || !Array.isArray(items) || !items.length) {
        return res.status(400).json({ error: "Informations de commande ou moyen de paiement invalides." });
      }

      await client.query("BEGIN");
      let total = 0;
      const finalItems = [];

      for (const item of items) {
        const productId = Number(item.id);
        const quantity = Number(item.quantity ?? item.qty);
        if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity <= 0) {
          throw new Error("Produit ou quantité invalide");
        }

        const r = await client.query(
          `SELECT id,name,price,promo_price,promo_active,stock,emoji FROM products WHERE id=$1 FOR UPDATE`,
          [productId]
        );
        if (!r.rows.length) throw new Error("Produit introuvable");
        const product = r.rows[0];
        if (Number(product.stock) < quantity) throw new Error(`Stock insuffisant pour ${product.name}`);

        const promo = Boolean(product.promo_active) && Number(product.promo_price) > 0 && Number(product.promo_price) < Number(product.price);
        const unitPrice = promo ? Number(product.promo_price) : Number(product.price);
        const subtotal = unitPrice * quantity;
        total += subtotal;
        finalItems.push({ id: product.id, name: product.name, price: unitPrice, quantity, subtotal, emoji: product.emoji });
      }

      if (!Number.isSafeInteger(total) || total <= 0) throw new Error("Montant de commande invalide");

      const orderCustomer = {
        name,
        phone,
        address,
        email: String(customer?.email || "").trim(),
        delivery: customer?.delivery || null
      };
      const refCommand = `SNG-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;

      const inserted = await client.query(
        `INSERT INTO orders (status,customer,payment,items,total,payment_status,payment_method,paytech_ref)
         VALUES ('Nouvelle',$1,$2,$3,$4,'En attente',$2,$5)
         RETURNING id`,
        [JSON.stringify(orderCustomer), payment, JSON.stringify(finalItems), total, refCommand]
      );
      orderId = inserted.rows[0].id;
      await client.query("COMMIT");

      const base = publicBaseUrl(req);
      const phoneData = normalizePhone(phone);
      const paymentData = {
        item_name: `Commande SNGAMER STORE #${orderId}`,
        item_price: total,
        currency: "XOF",
        ref_command: refCommand,
        command_name: `Commande SNGAMER STORE #${orderId}`,
        target_payment: payment,
        env,
