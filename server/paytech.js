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

  // Multiple Render instances can boot at the same time. The previous
  // existence-check was race-prone: two instances could both see that the
  // index did not exist and then both try to create the same PostgreSQL
  // relation. Serialize this small DDL section with a database advisory lock.
  await pool.query(`
    DO $$
    DECLARE
      lock_key BIGINT := hashtextextended('sngamer_paytech_index_install', 0);
    BEGIN
      PERFORM pg_advisory_lock(lock_key);
      BEGIN
        CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_paytech_ref_unique
          ON orders(paytech_ref)
          WHERE paytech_ref IS NOT NULL;
      EXCEPTION
        WHEN duplicate_object OR duplicate_table THEN
          NULL;
      END;
      PERFORM pg_advisory_unlock(lock_key);
    EXCEPTION WHEN OTHERS THEN
      PERFORM pg_advisory_unlock(lock_key);
      RAISE;
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
        ipn_url: `${base}/api/paytech/ipn`,
        success_url: `${base}/paytech/success?order=${encodeURIComponent(orderId)}`,
        cancel_url: `${base}/paytech/cancel?order=${encodeURIComponent(orderId)}`,
        custom_field: JSON.stringify({ order_id: orderId, ref_command: refCommand })
      };

      const response = await fetch(PAYTECH_API_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          API_KEY: apiKey,
          API_SECRET: apiSecret
        },
        body: JSON.stringify(paymentData)
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || Number(result.success) !== 1 || !result.redirect_url) {
        await pool.query(`UPDATE orders SET status='Paiement échoué', payment_status='Échec' WHERE id=$1`, [orderId]);
        return res.status(502).json({ error: result.message || "Impossible d'initialiser le paiement PayTech." });
      }

      let redirectUrl = result.redirect_url;
      const qp = new URLSearchParams({
        pn: phoneData.international,
        nn: phoneData.national,
        fn: name,
        tp: payment,
        nac: "1"
      });
      redirectUrl += (redirectUrl.includes("?") ? "&" : "?") + qp.toString();

      await pool.query(`UPDATE orders SET paytech_token=$1 WHERE id=$2`, [result.token || null, orderId]);
      return res.status(201).json({ success: true, orderId, token: result.token || null, redirect_url: redirectUrl });
    } catch (error) {
      try { await client.query("ROLLBACK"); } catch (_) {}
      if (orderId) {
        try { await pool.query(`UPDATE orders SET status='Paiement échoué', payment_status='Échec' WHERE id=$1 AND payment_status='En attente'`, [orderId]); } catch (_) {}
      }
      console.error("PAYTECH_CREATE_ERROR:", error);
      return res.status(400).json({ error: error.message || "Impossible de créer le paiement." });
    } finally {
      client.release();
    }
  });

  app.post("/api/paytech/ipn", async (req, res) => {
    try {
      const apiKey = String(process.env.PAYTECH_API_KEY || "").trim();
      const apiSecret = String(process.env.PAYTECH_API_SECRET || "").trim();
      if (!apiKey || !apiSecret) return res.status(503).send("PayTech not configured");

      const body = req.body || {};
      const refCommand = String(body.ref_command || "").trim();
      const receivedHmac = String(body.hmac_compute || "").trim();
      const finalPrice = String(body.final_item_price || body.item_price || "").trim();
      if (!refCommand) return res.status(400).send("Missing ref_command");

      let authenticated = false;
      if (receivedHmac) {
        const expected = crypto.createHmac("sha256", apiSecret).update(`${finalPrice}|${refCommand}|${apiKey}`).digest("hex");
        authenticated = safeEqualHex(expected, receivedHmac);
      } else {
        const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
        const secretHash = crypto.createHash("sha256").update(apiSecret).digest("hex");
        authenticated = safeEqualHex(keyHash, body.api_key_sha256) && safeEqualHex(secretHash, body.api_secret_sha256);
      }
      if (!authenticated) return res.status(403).send("Forbidden");

      const configuredEnv = String(process.env.PAYTECH_ENV || "test").trim().toLowerCase();
      const callbackEnv = String(body.env || "").trim().toLowerCase();
      if (callbackEnv && callbackEnv !== configuredEnv) return res.status(400).send("Environment mismatch");

      const orderResult = await pool.query(
        `SELECT id,total,payment_status,items FROM orders WHERE paytech_ref=$1 FOR UPDATE`,
        [refCommand]
      );
      if (!orderResult.rows.length) return res.status(404).send("Order not found");
      const order = orderResult.rows[0];

      if (body.type_event === "sale_complete") {
        const amount = Number(finalPrice);
        if (!Number.isFinite(amount) || amount !== Number(order.total)) return res.status(400).send("Amount mismatch");

        if (order.payment_status !== "Payé") {
          const client = await pool.connect();
          try {
            await client.query("BEGIN");
            const locked = await client.query(`SELECT payment_status,items FROM orders WHERE id=$1 FOR UPDATE`, [order.id]);
            if (locked.rows[0].payment_status !== "Payé") {
              const items = Array.isArray(locked.rows[0].items) ? locked.rows[0].items : [];
              for (const item of items) {
                const quantity = Number(item.quantity);
                const productId = Number(item.id);
                if (!Number.isInteger(quantity) || quantity <= 0 || !Number.isInteger(productId)) throw new Error("Commande payée invalide");
                const stockUpdate = await client.query(
                  `UPDATE products SET stock=stock-$1 WHERE id=$2 AND stock >= $1`,
                  [quantity, productId]
                );
                if (stockUpdate.rowCount !== 1) throw new Error(`Stock insuffisant ou produit introuvable pour ${productId}`);
              }

              await client.query(
                `UPDATE orders
                 SET status='Payée',payment_status='Payé',payment_method=$1,paid_at=NOW(),paytech_token=COALESCE($2,paytech_token)
                 WHERE id=$3`,
                [body.payment_method || null, body.token || null, order.id]
              );
            }
            await client.query("COMMIT");
          } catch (error) {
            await client.query("ROLLBACK");
            throw error;
          } finally {
            client.release();
          }
        }
      } else if (body.type_event === "sale_canceled") {
        await pool.query(
          `UPDATE orders
           SET status='Annulée',payment_status='Annulée',payment_method=COALESCE($1,payment_method),paytech_token=COALESCE($2,paytech_token)
           WHERE id=$3 AND payment_status <> 'Payé'`,
          [body.payment_method || null, body.token || null, order.id]
        );
      }

      return res.status(200).send("OK");
    } catch (error) {
      console.error("PAYTECH_IPN_ERROR:", error);
      return res.status(500).send("IPN error");
    }
  });

  app.get("/paytech/success", (req, res) => {
    res.status(200).send(`<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Paiement SNGAMER STORE</title><style>body{font-family:Arial,sans-serif;background:#07101d;color:#fff;display:grid;place-items:center;min-height:100vh;margin:0}.box{text-align:center;padding:32px;max-width:420px}.ok{font-size:52px}a{display:inline-block;margin-top:20px;padding:13px 20px;border-radius:12px;background:linear-gradient(135deg,#287cff,#c51be9);color:#fff;text-decoration:none;font-weight:700}</style><div class="box"><div class="ok">✓</div><h1>Paiement envoyé</h1><p>Merci pour ta commande. La confirmation finale est traitée automatiquement par SNGAMER STORE.</p><a href="/">Retour à la boutique</a></div></html>`);
  });

  app.get("/paytech/cancel", (req, res) => {
    res.status(200).send(`<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Paiement annulé</title><style>body{font-family:Arial,sans-serif;background:#07101d;color:#fff;display:grid;place-items:center;min-height:100vh;margin:0}.box{text-align:center;padding:32px;max-width:420px}a{display:inline-block;margin-top:20px;padding:13px 20px;border-radius:12px;background:#16243a;color:#fff;text-decoration:none;font-weight:700}</style><div class="box"><h1>Paiement annulé</h1><p>Ta commande n'a pas été confirmée comme payée.</p><a href="/">Retour à la boutique</a></div></html>`);
  });

  console.log("PayTech routes installed");
}

module.exports = { installPaytech };
