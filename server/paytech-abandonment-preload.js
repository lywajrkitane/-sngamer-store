'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PAYTECH_FILE = path.join(__dirname, 'paytech.js');
const CHECKOUT_FILE = path.join(ROOT, 'public', 'paytech-checkout.js');
const PATCH_MARKER = '/* SNGAMER_PAYTECH_ABANDONMENT_V1 */';
const CHECKOUT_MARKER = '/* SNGAMER_PAYTECH_RETURN_CHECK_V1 */';
const BT = String.fromCharCode(96);

function requireReplace(source, oldValue, newValue, label) {
  if (!source.includes(oldValue)) {
    throw new Error('PayTech abandonment patch could not locate: ' + label);
  }
  return source.replace(oldValue, newValue);
}

function patchPayTech() {
  if (!fs.existsSync(PAYTECH_FILE)) {
    throw new Error('Missing PayTech source file: ' + PAYTECH_FILE);
  }

  let source = fs.readFileSync(PAYTECH_FILE, 'utf8');
  if (source.includes(PATCH_MARKER)) return;

  const reservationHelper = [
    '  ' + PATCH_MARKER,
    '  async function releasePendingStockReservation(orderIdValue, finalStatus, finalPaymentStatus) {',
    '    const orderId = Number(orderIdValue);',
    '    if (!Number.isSafeInteger(orderId) || orderId <= 0) return { found: false, released: false, paid: false };',
    '    const client = await pool.connect();',
    '    try {',
    '      await client.query("BEGIN");',
    '      const found = await client.query("SELECT id, items, payment_status, stock_reserved_until FROM orders WHERE id=$1 FOR UPDATE", [orderId]);',
    '      if (!found.rows.length) {',
    '        await client.query("COMMIT");',
    '        return { found: false, released: false, paid: false };',
    '      }',
    '      const order = found.rows[0];',
    '      if (order.payment_status === "Payé") {',
    '        await client.query("COMMIT");',
    '        return { found: true, released: false, paid: true, status: order.payment_status };',
    '      }',
    '      if (!order.stock_reserved_until) {',
    '        await client.query("COMMIT");',
    '        return { found: true, released: false, paid: false, status: order.payment_status };',
    '      }',
    '      const items = Array.isArray(order.items) ? order.items : [];',
    '      for (const item of items) {',
    '        const quantity = Number(item.quantity ?? item.qty);',
    '        const productId = Number(item.id);',
    '        if (!Number.isInteger(quantity) || quantity <= 0 || !Number.isInteger(productId) || productId <= 0) continue;',
    '        await client.query("UPDATE products SET stock=stock+$1 WHERE id=$2 AND stock_mode <> $3", [quantity, productId, "on_order"]);',
    '      }',
    '      const updated = await client.query(',
    '        "UPDATE orders SET status=$1, payment_status=$2, stock_reserved_until=NULL WHERE id=$3 AND payment_status <> $4 AND stock_reserved_until IS NOT NULL RETURNING id",',
    '        [finalStatus, finalPaymentStatus, orderId, "Payé"]',
    '      );',
    '      await client.query("COMMIT");',
    '      return { found: true, released: updated.rowCount === 1, paid: false, status: finalPaymentStatus };',
    '    } catch (error) {',
    '      await client.query("ROLLBACK");',
    '      throw error;',
    '    } finally {',
    '      client.release();',
    '    }',
    '  }',
    ''
  ].join('\n');

  const createRoute = '  app.post("/api/paytech/create", async (req, res) => {';
  source = requireReplace(source, createRoute, reservationHelper + createRoute, 'payment creation route');

  source = requireReplace(
    source,
    'SELECT id,payment_status,paytech_token,paytech_redirect_url FROM orders WHERE payment_request_key=$1 LIMIT 1',
    'SELECT id,payment_status,paytech_token,paytech_redirect_url,paytech_ref FROM orders WHERE payment_request_key=$1 LIMIT 1',
    'idempotent payment lookup'
  );

  source = requireReplace(
    source,
    'return res.status(200).json({ success: true, orderId: order.id, token: order.paytech_token || null, redirect_url: order.paytech_redirect_url, reused: true });',
    'return res.status(200).json({ success: true, orderId: order.id, token: order.paytech_token || null, redirect_url: order.paytech_redirect_url, return_sig: crypto.createHmac("sha256", apiSecret).update(String(order.id) + "|" + String(order.paytech_ref || "")).digest("hex"), reused: true });',
    'idempotent response signature'
  );

  const oldCancelUrl = 'cancel_url: ' + BT + '$' + '{base}/paytech/cancel?order=$' + '{encodeURIComponent(orderId)}' + BT + ',';
  const newCancelUrl = 'cancel_url: ' + BT + '$' + '{base}/paytech/cancel?order=$' + '{encodeURIComponent(orderId)}&ref_command=$' + '{encodeURIComponent(refCommand)}&sig=$' + '{crypto.createHmac("sha256", apiSecret).update(String(orderId) + "|" + refCommand).digest("hex")}' + BT + ',';
  source = requireReplace(source, oldCancelUrl, newCancelUrl, 'signed cancellation URL');

  source = requireReplace(
    source,
    'return res.status(201).json({ success: true, orderId, token: result.token || null, redirect_url: redirectUrl });',
    'return res.status(201).json({ success: true, orderId, token: result.token || null, redirect_url: redirectUrl, return_sig: crypto.createHmac("sha256", apiSecret).update(String(orderId) + "|" + refCommand).digest("hex") });',
    'checkout response signature'
  );

  const failedUpdate = 'await pool.query(' + BT + "UPDATE orders SET status='Paiement échoué',payment_status='Échec',stock_reserved_until=NULL WHERE id=$1" + BT + ', [orderId]);';
  source = requireReplace(
    source,
    failedUpdate,
    'await releasePendingStockReservation(orderId, "Paiement échoué", "Échec");',
    'release reservation when PayTech initialization fails'
  );

  const failedCatchUpdate = 'if (orderId) { try { await pool.query(' + BT + "UPDATE orders SET status='Paiement échoué',payment_status='Échec',stock_reserved_until=NULL WHERE id=$1 AND payment_status='En attente'" + BT + ', [orderId]); } catch (_) {} }';
  source = requireReplace(
    source,
    failedCatchUpdate,
    'if (orderId) { try { await releasePendingStockReservation(orderId, "Paiement échoué", "Échec"); } catch (releaseError) { console.error("PAYTECH_FAILURE_STOCK_RELEASE_ERROR:", releaseError); } }',
    'release reservation after a PayTech request exception'
  );

  const cancelRouteHead = '  app.get("/paytech/cancel", (req, res) => {';
  const signedCancelRoute = [
    '  app.get("/paytech/cancel", async (req, res) => {',
    '    try {',
    '      const orderId = Number(req.query.order);',
    '      const refCommand = String(req.query.ref_command || "").trim();',
    '      const signature = String(req.query.sig || "").trim();',
    '      const apiSecret = String(process.env.PAYTECH_API_SECRET || "").trim();',
    '      if (Number.isSafeInteger(orderId) && orderId > 0 && refCommand && signature && apiSecret) {',
    '        const found = await pool.query("SELECT paytech_ref FROM orders WHERE id=$1", [orderId]);',
    '        if (found.rows.length && String(found.rows[0].paytech_ref || "") === refCommand) {',
    '          const expected = crypto.createHmac("sha256", apiSecret).update(String(orderId) + "|" + refCommand).digest("hex");',
    '          if (safeEqualHex(expected, signature)) await releasePendingStockReservation(orderId, "Annulée", "Annulée");',
    '        }',
    '      }',
    '    } catch (error) {',
    '      console.error("PAYTECH_CANCEL_STOCK_RELEASE_ERROR:", error);',
    '    }'
  ].join('\n');
  source = requireReplace(source, cancelRouteHead, signedCancelRoute, 'cancellation return route');

  const returnCheckRoute = [
    '  app.post("/api/paytech/return-check", async (req, res) => {',
    '    try {',
    '      const orderId = Number(req.body && req.body.orderId);',
    '      const signature = String((req.body && req.body.signature) || "").trim();',
    '      const apiSecret = String(process.env.PAYTECH_API_SECRET || "").trim();',
    '      if (!Number.isSafeInteger(orderId) || orderId <= 0 || !signature) return res.status(400).json({ error: "Tentative de paiement invalide." });',
    '      if (!apiSecret) return res.status(503).json({ error: "PayTech n’est pas configuré." });',
    '      const found = await pool.query("SELECT id,paytech_ref,payment_status,stock_reserved_until FROM orders WHERE id=$1", [orderId]);',
    '      if (!found.rows.length) return res.status(404).json({ error: "Commande introuvable." });',
    '      const order = found.rows[0];',
    '      const expected = crypto.createHmac("sha256", apiSecret).update(String(orderId) + "|" + String(order.paytech_ref || "")).digest("hex");',
    '      if (!order.paytech_ref || !safeEqualHex(expected, signature)) return res.status(403).json({ error: "Signature invalide." });',
    '      if (order.payment_status === "Payé") return res.json({ success: true, paid: true, released: false, final: true });',
    '      if (order.payment_status !== "En attente") return res.json({ success: true, paid: false, released: false, final: true, status: order.payment_status });',
    '      const checked = await reconcileWithPaytech(orderId);',
    '      if (checked.paid) return res.json({ success: true, paid: true, released: false, final: true });',
    '      const state = String(checked.state || "").trim().toLowerCase();',
    '      const cancelledStates = new Set(["cancelled", "canceled", "cancel", "sale_canceled", "aborted", "void", "voided"]);',
    '      const failedStates = new Set(["failed", "failure", "expired", "declined", "refused", "rejected", "error", "timeout"]);',
    '      if (cancelledStates.has(state) || failedStates.has(state)) {',
    '        const cancelled = cancelledStates.has(state);',
    '        const status = cancelled ? "Annulée" : "Paiement échoué";',
    '        const paymentStatus = cancelled ? "Annulée" : "Échec";',
    '        const released = await releasePendingStockReservation(orderId, status, paymentStatus);',
    '        return res.json({ success: true, paid: false, released: Boolean(released.released), final: true, status: paymentStatus });',
    '      }',
    '      return res.json({ success: true, paid: false, released: false, final: false, pending: true, state: state || "unknown" });',
    '    } catch (error) {',
    '      console.error("PAYTECH_RETURN_CHECK_ERROR:", error);',
    '      return res.status(500).json({ error: "Impossible de vérifier l’état du paiement." });',
    '    }',
    '  });',
    ''
  ].join('\n');

  source = requireReplace(
    source,
    '  app.get("/paytech/success", async (req, res) => {',
    returnCheckRoute + '  app.get("/paytech/success", async (req, res) => {',
    'payment return-check route'
  );

  fs.writeFileSync(PAYTECH_FILE, source, 'utf8');
  console.log('SNGAMER_PAYTECH_ABANDONMENT_PATCH: installed');
}

function patchCheckoutUi() {
  if (!fs.existsSync(CHECKOUT_FILE)) {
    throw new Error('Missing checkout controller: ' + CHECKOUT_FILE);
  }

  let source = fs.readFileSync(CHECKOUT_FILE, 'utf8');
  if (source.includes(CHECKOUT_MARKER)) return;

  const redirectNeedle = '      clearPaymentAttemptKey();\n      window.location.assign(data.redirect_url);';
  const redirectReplacement = [
    '      try {',
    '        if (data.orderId && data.return_sig) {',
    '          sessionStorage.setItem("sngamer.paytech.pending-order", JSON.stringify({ orderId: data.orderId, sig: data.return_sig }));',
    '        }',
    '      } catch (_) {}',
    '      clearPaymentAttemptKey();',
    '      window.location.assign(data.redirect_url);'
  ].join('\n');

  source = requireReplace(source, redirectNeedle, redirectReplacement, 'persist pending order before redirect');

  const returnCheckUi = [
    '  ' + CHECKOUT_MARKER,
    '  let pendingReturnCheckInProgress = false;',
    '  async function reconcilePendingPaytechReturn() {',
    '    if (pendingReturnCheckInProgress) return;',
    '    let pending;',
    '    try {',
    '      const raw = sessionStorage.getItem("sngamer.paytech.pending-order");',
    '      if (!raw) return;',
    '      pending = JSON.parse(raw);',
    '    } catch (_) { return; }',
    '    if (!pending || !pending.orderId || !pending.sig) return;',
    '    pendingReturnCheckInProgress = true;',
    '    try {',
    '      const response = await fetch("/api/paytech/return-check", {',
    '        method: "POST",',
    '        cache: "no-store",',
    '        headers: { "Content-Type": "application/json" },',
    '        body: JSON.stringify({ orderId: pending.orderId, signature: pending.sig })',
    '      });',
    '      const data = await response.json().catch(() => ({}));',
    '      if (response.ok && (data.paid === true || data.released === true || data.final === true)) {',
    '        sessionStorage.removeItem("sngamer.paytech.pending-order");',
    '      }',
    '    } catch (error) {',
    '      console.warn("SNGAMER_PAYTECH_RETURN_CHECK_ERROR", error);',
    '    } finally {',
    '      pendingReturnCheckInProgress = false;',
    '    }',
    '  }',
    '  window.addEventListener("pageshow", () => {',
    '    window.setTimeout(() => { void reconcilePendingPaytechReturn(); }, 250);',
    '  });',
    '  document.addEventListener("visibilitychange", () => {',
    '    if (document.visibilityState === "visible") void reconcilePendingPaytechReturn();',
    '  });',
    ''
  ].join('\n');

  source = requireReplace(
    source,
    '  window.paytechCheckoutSubmit = paytechCheckoutSubmit;',
    returnCheckUi + '  window.paytechCheckoutSubmit = paytechCheckoutSubmit;',
    'register return-check UI'
  );

  fs.writeFileSync(CHECKOUT_FILE, source, 'utf8');
  console.log('SNGAMER_PAYTECH_RETURN_CHECK_UI: installed');
}

try {
  patchPayTech();
  patchCheckoutUi();
} catch (error) {
  console.error('SNGAMER_PAYTECH_ABANDONMENT_PATCH_ERROR:', error);
  throw error;
}
