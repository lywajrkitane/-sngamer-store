const crypto = require("crypto");
const { Pool } = require("pg");

const PAYTECH_API_URL = "https://paytech.sn/api/payment/request-payment";
const PAYTECH_STATUS_URL = "https://paytech.sn/api/payment/get-status";

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

function paymentState(data) {
  const candidates = [
    data?.status, data?.state, data?.payment?.status, data?.payment?.state,
    data?.transaction?.status, data?.transaction?.state, data?.data?.status,
    data?.data?.state, data?.data?.payment?.status, data?.data?.payment?.state
  ];
  return candidates.map(v => String(v || "").trim().toLowerCase()).find(Boolean) || "";
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
      ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS refund_status TEXT NOT NULL DEFAULT 'Aucun',
      ADD COLUMN IF NOT EXISTS refund_requested_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS refund_provider_message TEXT
  `);

  await pool.query(`UPDATE orders SET status='Nouvelle' WHERE status='Payée' AND payment_status='Payé'`);

  await pool.query(`
    DO $$
    DECLARE lock_key BIGINT := hashtextextended('sngamer_paytech_index_install', 0);
    BEGIN
      PERFORM pg_advisory_lock(lock_key);
      BEGIN
        CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_paytech_ref_unique
          ON orders(paytech_ref) WHERE paytech_ref IS NOT NULL;
      EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
      END;
      PERFORM pg_advisory_unlock(lock_key);
    EXCEPTION WHEN OTHERS THEN
      PERFORM pg_advisory_unlock(lock_key); RAISE;
    END $$;
  `);

  async function markOrderPaid(orderId, paymentMethod, token) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const locked = await client.query(`SELECT payment_status,items FROM orders WHERE id=$1 FOR UPDATE`, [orderId]);
      if (!locked.rows.length) throw new Error("Commande introuvable");
      if (locked.rows[0].payment_status === "Payé") {
        await client.query("COMMIT");
        return false;
      }
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
        `UPDATE orders SET payment_status='Payé',payment_method=$1,paid_at=NOW(),paytech_token=COALESCE($2,paytech_token) WHERE id=$3`,
        [paymentMethod || null, token || null, orderId]
      );
      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async function reconcileWithPaytech(orderId) {
    const orderResult = await pool.query(
      `SELECT id,total,payment_status,paytech_token FROM orders WHERE id=$1`, [orderId]
    );
    if (!orderResult.rows.length) return { found: false, paid: false };
    const order = orderResult.rows[0];
    if (order.payment_status === "Payé") return { found: true, paid: true, state: "paid" };
    if (!order.paytech_token) return { found: true, paid: false, state: "no_token" };

    const apiKey = String(process.env.PAYTECH_API_KEY || "").trim();
    const apiSecret = String(process.env.PAYTECH_API_SECRET || "").trim();
    if (!apiKey || !apiSecret) return { found: true, paid: false, state: "not_configured" };

    const response = await fetch(`${PAYTECH_STATUS_URL}?token_payment=${encodeURIComponent(order.paytech_token)}`, {
      method: "GET",
      headers: { Accept: "application/json", API_KEY: apiKey, API_SECRET: apiSecret }
    });
    const result = await response.json().catch(() => ({}));
    const state = paymentState(result);
    console.log("PAYTECH_STATUS_CHECK:", JSON.stringify({ orderId, apiSuccess: result?.success, state }));

    const successfulStates = new Set(["success", "successful", "paid", "completed", "complete", "sale_complete", "validated"]);
    if (response.ok && successfulStates.has(state)) {
      await markOrderPaid(order.id, result?.payment_method || result?.payment?.payment_method || "Wave", result?.token || order.paytech_token);
      return { found: true, paid: true, state };
    }
    return { found: true, paid: false, state: state || "unknown" };
  }

  app.post("/api/paytech/create", async (req, res) => {
    const client = await pool.connect();
    let orderId = null;
    try {
      const apiKey = String(process.env.PAYTECH_API_KEY || "").trim();
      const apiSecret = String(process.env.PAYTECH_API_SECRET || "").trim();
      const env = String(process.env.PAYTECH_ENV || "test").trim().toLowerCase();
      if (!apiKey || !apiSecret) return res.status(503).json({ error: "PayTech n'est pas encore configuré sur le serveur." });
      if (!["test", "prod"].includes(env)) return res.status(500).json({ error: "PAYTECH_ENV doit être 'test' ou 'prod'." });

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
        const productId = Number(item.id), quantity = Number(item.quantity ?? item.qty);
        if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity <= 0) throw new Error("Produit ou quantité invalide");
        const r = await client.query(`SELECT id,name,price,promo_price,promo_active,stock,emoji FROM products WHERE id=$1 FOR UPDATE`, [productId]);
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

      const orderCustomer = { name, phone, address, email: String(customer?.email || "").trim(), delivery: customer?.delivery || null };
      const refCommand = `SNG-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
      const inserted = await client.query(
        `INSERT INTO orders (status,customer,payment,items,total,payment_status,payment_method,paytech_ref)
         VALUES ('Nouvelle',$1,$2,$3,$4,'En attente',$2,$5) RETURNING id`,
        [JSON.stringify(orderCustomer), payment, JSON.stringify(finalItems), total, refCommand]
      );
      orderId = inserted.rows[0].id;
      await client.query("COMMIT");

      const base = publicBaseUrl(req), phoneData = normalizePhone(phone);
      const paymentData = {
        item_name: `Commande SNGAMER STORE #${orderId}`, item_price: total, currency: "XOF", ref_command: refCommand,
        command_name: `Commande SNGAMER STORE #${orderId}`, target_payment: payment, env,
        ipn_url: `${base}/api/paytech/ipn`, refund_notif_url: `${base}/api/paytech/refund-ipn`, success_url: `${base}/paytech/success?order=${encodeURIComponent(orderId)}`,
        cancel_url: `${base}/paytech/cancel?order=${encodeURIComponent(orderId)}`,
        custom_field: JSON.stringify({ order_id: orderId, ref_command: refCommand })
      };
      const response = await fetch(PAYTECH_API_URL, {
        method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json", API_KEY: apiKey, API_SECRET: apiSecret },
        body: JSON.stringify(paymentData)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || Number(result.success) !== 1 || !result.redirect_url) {
        await pool.query(`UPDATE orders SET status='Paiement échoué',payment_status='Échec' WHERE id=$1`, [orderId]);
        return res.status(502).json({ error: result.message || "Impossible d'initialiser le paiement PayTech." });
      }
      let redirectUrl = result.redirect_url;
      const qp = new URLSearchParams({ pn: phoneData.international, nn: phoneData.national, fn: name, tp: payment, nac: "1" });
      redirectUrl += (redirectUrl.includes("?") ? "&" : "?") + qp.toString();
      await pool.query(`UPDATE orders SET paytech_token=$1 WHERE id=$2`, [result.token || null, orderId]);
      return res.status(201).json({ success: true, orderId, token: result.token || null, redirect_url: redirectUrl });
    } catch (error) {
      try { await client.query("ROLLBACK"); } catch (_) {}
      if (orderId) { try { await pool.query(`UPDATE orders SET status='Paiement échoué',payment_status='Échec' WHERE id=$1 AND payment_status='En attente'`, [orderId]); } catch (_) {} }
      console.error("PAYTECH_CREATE_ERROR:", error);
      return res.status(400).json({ error: error.message || "Impossible de créer le paiement." });
    } finally { client.release(); }
  });

  app.post("/api/paytech/ipn", async (req, res) => {
    try {
      const apiKey = String(process.env.PAYTECH_API_KEY || "").trim();
      const apiSecret = String(process.env.PAYTECH_API_SECRET || "").trim();
      if (!apiKey || !apiSecret) return res.status(503).send("PayTech not configured");
      const body = req.body || {};
      const refCommand = String(body.ref_command || "").trim();
      const finalPrice = String(body.final_item_price || body.item_price || "").trim();
      console.log("PAYTECH_IPN_RECEIVED:", JSON.stringify({ type_event: body.type_event, ref_command: refCommand, item_price: body.item_price, final_item_price: body.final_item_price, env: body.env }));
      if (!refCommand) return res.status(400).send("Missing ref_command");

      const expectedKeyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
      const expectedSecretHash = crypto.createHash("sha256").update(apiSecret).digest("hex");
      const shaAuthenticated = safeEqualHex(expectedKeyHash, body.api_key_sha256) && safeEqualHex(expectedSecretHash, body.api_secret_sha256);
      const receivedHmac = String(body.hmac_compute || "").trim();
      const expectedHmac = crypto.createHmac("sha256", apiSecret).update(`${finalPrice}|${refCommand}|${apiKey}`).digest("hex");
      const hmacAuthenticated = receivedHmac && safeEqualHex(expectedHmac, receivedHmac);
      if (!shaAuthenticated && !hmacAuthenticated) return res.status(403).send("Forbidden");

      const configuredEnv = String(process.env.PAYTECH_ENV || "test").trim().toLowerCase();
      const callbackEnv = String(body.env || "").trim().toLowerCase();
      if (callbackEnv && callbackEnv !== configuredEnv) return res.status(400).send("Environment mismatch");

      const orderResult = await pool.query(`SELECT id,total,payment_status FROM orders WHERE paytech_ref=$1`, [refCommand]);
      if (!orderResult.rows.length) return res.status(404).send("Order not found");
      const order = orderResult.rows[0];

      if (body.type_event === "sale_complete") {
        const amount = Number(finalPrice);
        if (!Number.isFinite(amount) || amount !== Number(order.total)) return res.status(400).send("Amount mismatch");
        await markOrderPaid(order.id, body.payment_method, body.token);
      } else if (body.type_event === "sale_canceled") {
        await pool.query(`UPDATE orders SET status='Annulée',payment_status='Annulée',payment_method=COALESCE($1,payment_method),paytech_token=COALESCE($2,paytech_token) WHERE id=$3 AND payment_status <> 'Payé'`, [body.payment_method || null, body.token || null, order.id]);
      }
      return res.status(200).send("OK");
    } catch (error) {
      console.error("PAYTECH_IPN_ERROR:", error);
      return res.status(500).send("IPN error");
    }
  });


  // Admin-initiated full refunds. PayTech's API accepts ref_command only;
  // the request is therefore full-order, not partial. Never mark as refunded
  // until PayTech's refund_complete notification or an admin-verified fallback.
  app.post("/api/admin/orders/:id/refund", async (req, res) => {
    if (!req.session || !req.session.admin) {
      return res.status(401).json({ error: "Non autorisé" });
    }

    const orderId = Number(req.params.id);
    if (!Number.isSafeInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ error: "Numéro de commande invalide." });
    }

    const apiKey = String(process.env.PAYTECH_API_KEY || "").trim();
    const apiSecret = String(process.env.PAYTECH_API_SECRET || "").trim();
    if (!apiKey || !apiSecret) {
      return res.status(503).json({ error: "Les clés API PayTech ne sont pas configurées." });
    }

    let order;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const locked = await client.query(
        `SELECT id, total, payment_status, paytech_ref, refund_status
         FROM orders WHERE id = $1 FOR UPDATE`,
        [orderId]
      );

      if (!locked.rows.length) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Commande introuvable." });
      }

      order = locked.rows[0];
      const currentRefundStatus = String(order.refund_status || "Aucun");
      const currentPaymentStatus = String(order.payment_status || "").trim().toLowerCase();

      if (!["payé", "paye", "paid"].includes(currentPaymentStatus)) {
        await client.query("ROLLBACK");
        return res.status(409).json({ error: "Seule une commande déjà payée peut être remboursée." });
      }
      if (!order.paytech_ref) {
        await client.query("ROLLBACK");
        return res.status(409).json({ error: "Cette commande n'a pas de référence PayTech. Vérifie son paiement et effectue son remboursement manuellement auprès du prestataire." });
      }
      if (currentRefundStatus === "Remboursé") {
        await client.query("ROLLBACK");
        return res.status(409).json({ error: "Cette commande est déjà marquée comme remboursée." });
      }
      if (currentRefundStatus === "En cours") {
        await client.query("ROLLBACK");
        return res.status(409).json({ error: "Un remboursement est déjà en cours. Ne relance pas la demande afin d'éviter un doublon." });
      }

      await client.query(
        `UPDATE orders
         SET refund_status = 'En cours',
             refund_requested_at = NOW(),
             refund_provider_message = 'Demande transmise à PayTech; confirmation en attente.'
         WHERE id = $1`,
        [orderId]
      );
      await client.query("COMMIT");
    } catch (error) {
      try { await client.query("ROLLBACK"); } catch (_) {}
      console.error("PAYTECH_REFUND_LOCK_ERROR:", error);
      return res.status(500).json({ error: "Impossible de préparer le remboursement." });
    } finally {
      client.release();
    }

    let response;
    let providerResult;
    try {
      response = await fetch("https://paytech.sn/api/payment/refund-payment", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
          API_KEY: apiKey,
          API_SECRET: apiSecret
        },
        body: new URLSearchParams({ ref_command: String(order.paytech_ref) }),
        signal: AbortSignal.timeout(15000)
      });
      providerResult = await response.json().catch(() => ({}));
    } catch (error) {
      // Timeout/network errors are ambiguous: keep "En cours" to block duplicate refunds.
      const message = "Réponse PayTech inconnue. Vérifie le back-office PayTech avant toute nouvelle action pour éviter un double remboursement.";
      try {
        await pool.query(
          `UPDATE orders SET refund_provider_message = $1
           WHERE id = $2 AND refund_status = 'En cours'`,
          [message, orderId]
        );
      } catch (dbError) {
        console.error("PAYTECH_REFUND_UNKNOWN_STATE_SAVE_ERROR:", dbError);
      }
      console.error("PAYTECH_REFUND_NETWORK_ERROR:", error);
      return res.status(202).json({ success: true, pending: true, message });
    }

    if (response.ok && Number(providerResult.success) === 1) {
      const message = String(providerResult.message || "Demande acceptée par PayTech; confirmation finale en attente.");
      await pool.query(
        `UPDATE orders
         SET refund_provider_message = $1
         WHERE id = $2 AND refund_status <> 'Remboursé'`,
        [message, orderId]
      );
      return res.status(202).json({
        success: true,
        pending: true,
        message: "PayTech a accepté la demande. Le statut passera à « Remboursé » après confirmation par PayTech. Pour les anciennes transactions sans notification de remboursement configurée, vérifie le résultat dans le back-office PayTech."
      });
    }

    const providerMessage = String(providerResult.message || "PayTech a refusé la demande de remboursement.");
    await pool.query(
      `UPDATE orders
       SET refund_status = CASE WHEN refund_status = 'Remboursé' THEN 'Remboursé' ELSE 'Échec' END,
           refund_provider_message = $1
       WHERE id = $2`,
      [providerMessage, orderId]
    );
    const current = await pool.query(
      "SELECT refund_status FROM orders WHERE id = $1",
      [orderId]
    );
    if (current.rows[0]?.refund_status === "Remboursé") {
      return res.json({ success: true, refunded: true, message: "PayTech a confirmé le remboursement." });
    }
    return res.status(502).json({ error: providerMessage });
  });

  // PayTech calls this URL only for refund_complete. Authenticate the callback
  // with the documented SHA-256 API key and secret checks before updating money status.
  app.post("/api/paytech/refund-ipn", async (req, res) => {
    try {
      const apiKey = String(process.env.PAYTECH_API_KEY || "").trim();
      const apiSecret = String(process.env.PAYTECH_API_SECRET || "").trim();
      if (!apiKey || !apiSecret) return res.status(503).send("PayTech not configured");

      const body = req.body || {};
      const expectedKeyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
      const expectedSecretHash = crypto.createHash("sha256").update(apiSecret).digest("hex");
      const authenticated =
        safeEqualHex(expectedKeyHash, body.api_key_sha256) &&
        safeEqualHex(expectedSecretHash, body.api_secret_sha256);
      if (!authenticated) return res.status(403).send("Forbidden");

      if (body.type_event !== "refund_complete") return res.status(200).send("Ignored");
      const configuredEnv = String(process.env.PAYTECH_ENV || "test").trim().toLowerCase();
      const callbackEnv = String(body.env || "").trim().toLowerCase();
      if (callbackEnv && callbackEnv !== configuredEnv) return res.status(400).send("Environment mismatch");

      const refCommand = String(body.ref_command || "").trim();
      if (!refCommand) return res.status(400).send("Missing ref_command");

      const orderResult = await pool.query(
        `SELECT id, total, refund_status FROM orders WHERE paytech_ref = $1`,
        [refCommand]
      );
      if (!orderResult.rows.length) return res.status(404).send("Order not found");
      const order = orderResult.rows[0];

      if (order.refund_status === "Remboursé") return res.status(200).send("OK");
      if (!["En cours", "Échec"].includes(String(order.refund_status || ""))) {
        return res.status(409).send("No matching refund request");
      }

      const callbackAmount = Number(body.item_price || body.final_item_price || 0);
      if (callbackAmount > 0 && callbackAmount !== Number(order.total)) {
        return res.status(400).send("Refund amount mismatch");
      }

      await pool.query(
        `UPDATE orders
         SET refund_status = 'Remboursé',
             payment_status = 'Remboursé',
             refunded_at = COALESCE(refunded_at, NOW()),
             refund_provider_message = 'Confirmation de remboursement reçue de PayTech'
         WHERE id = $1 AND refund_status IN ('En cours', 'Échec')`,
        [order.id]
      );
      console.log("PAYTECH_REFUND_CONFIRMED:", JSON.stringify({ orderId: order.id, ref_command: refCommand }));
      return res.status(200).send("OK");
    } catch (error) {
      console.error("PAYTECH_REFUND_IPN_ERROR:", error);
      return res.status(500).send("Refund IPN error");
    }
  });

  // Fallback for historical payments which were created before refund_notif_url
  // was included. Use only after manually verifying the completed refund in PayTech.
  app.post("/api/admin/orders/:id/refund/confirm", async (req, res) => {
    if (!req.session || !req.session.admin) {
      return res.status(401).json({ error: "Non autorisé" });
    }

    const orderId = Number(req.params.id);
    if (!Number.isSafeInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ error: "Numéro de commande invalide." });
    }

    try {
      const result = await pool.query(
        `UPDATE orders
         SET refund_status = 'Remboursé',
             payment_status = 'Remboursé',
             refunded_at = COALESCE(refunded_at, NOW()),
             refund_provider_message = 'Confirmation manuelle par l’administrateur après vérification PayTech'
         WHERE id = $1
           AND payment_status = 'Payé'
           AND refund_status = 'En cours'
           AND paytech_ref IS NOT NULL
         RETURNING id, refund_status, payment_status, refunded_at`,
        [orderId]
      );

      if (!result.rows.length) {
        return res.status(409).json({ error: "Aucun remboursement en cours à confirmer pour cette commande." });
      }
      return res.json({ success: true, order: result.rows[0], message: "Remboursement enregistré comme terminé." });
    } catch (error) {
      console.error("PAYTECH_REFUND_MANUAL_CONFIRM_ERROR:", error);
      return res.status(500).json({ error: "Impossible de confirmer le remboursement." });
    }
  });

  app.get("/paytech/success", async (req, res) => {
    const orderId = Number(req.query.order);
    let paid = false;
    try {
      if (Number.isInteger(orderId) && orderId > 0) {
        const result = await reconcileWithPaytech(orderId);
        paid = Boolean(result.paid);
      }
    } catch (error) {
      console.error("PAYTECH_SUCCESS_RECONCILE_ERROR:", error);
    }
    const title = paid ? "Paiement confirmé" : "Paiement reçu";
    const message = paid
      ? "Ton paiement a été confirmé. Ta commande est maintenant marquée comme payée."
      : "Ton paiement a été reçu. La confirmation finale peut prendre quelques instants.";
    res.status(200).send(`<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} - SNGAMER STORE</title><style>body{font-family:Arial,sans-serif;background:#07101d;color:#fff;display:grid;place-items:center;min-height:100vh;margin:0}.box{text-align:center;padding:32px;max-width:420px}.ok{font-size:52px;color:#8ee28e}a{display:inline-block;margin-top:20px;padding:13px 20px;border-radius:12px;background:linear-gradient(135deg,#287cff,#c51be9);color:#fff;text-decoration:none;font-weight:700}</style><div class="box"><div class="ok">✓</div><h1>${title}</h1><p>${message}</p><a href="/">Retour à la boutique</a></div></html>`);
  });

  app.get("/paytech/cancel", (req, res) => {
    res.status(200).send(`<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Paiement annulé</title><style>body{font-family:Arial,sans-serif;background:#07101d;color:#fff;display:grid;place-items:center;min-height:100vh;margin:0}.box{text-align:center;padding:32px;max-width:420px}a{display:inline-block;margin-top:20px;padding:13px 20px;border-radius:12px;background:#16243a;color:#fff;text-decoration:none;font-weight:700}</style><div class="box"><h1>Paiement annulé</h1><p>Ta commande n'a pas été confirmée comme payée.</p><a href="/">Retour à la boutique</a></div></html>`);
  });

  console.log("PayTech routes installed");
}

module.exports = { installPaytech };
