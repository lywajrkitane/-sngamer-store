const fs = require("fs");
const path = require("path");
const Module = require("module");

const ROOT = path.join(__dirname, "..");
const SERVER_DIR = __dirname;
const MARKER = "/* SNGAMER_STOCK_MODE_V1 */";
const RESERVATION_MARKER = "/* SNGAMER_STOCK_RESERVATION_V1 */";

function patchFile(file, transform) {
  if (!fs.existsSync(file)) return;
  let text = fs.readFileSync(file, "utf8");
  const next = transform(text);
  if (next !== text) fs.writeFileSync(file, next, "utf8");
}

function patchServerSource() {
  patchFile(path.join(SERVER_DIR, "server.js"), text => {
    if (!text.includes(MARKER)) {
      text = text.replace(
        /await db\(`\n  ALTER TABLE products\n  ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT NULL\n`\);/,
        match => `${match}\n\n  await db(\`\n    ALTER TABLE products\n    ADD COLUMN IF NOT EXISTS stock_mode TEXT NOT NULL DEFAULT 'stock'\n      CHECK (stock_mode IN ('stock','on_order','out'))\n  \`);`
      );

      text = text.replace(
        /  p\.stock,\n  p\.emoji,/,
        "  p.stock,\n  p.stock_mode,\n  p.emoji,"
      );

      text = text.replace(
        /SELECT id, name, price, promo_price, promo_active, stock, emoji\nFROM products/,
        "SELECT id, name, price, promo_price, promo_active, stock, stock_mode, emoji\nFROM products"
      );

      text = text.replace(
        /if \(product\.stock < quantity\) \{/g,
        "if (product.stock_mode !== \"on_order\" && product.stock < quantity) {"
      );

      const routeMarker = "app.patch(\n  \"/api/admin/products/:id/stock-mode\"";
      if (!text.includes(routeMarker)) {
        const route = `\n${MARKER}\napp.patch(\n  \"/api/admin/products/:id/stock-mode\",\n  requireAdmin,\n  async (req, res) => {\n    try {\n      const id = Number(req.params.id);\n      const mode = [\"stock\", \"on_order\", \"out\"].includes(req.body?.stock_mode)\n        ? req.body.stock_mode\n        : null;\n      if (!Number.isInteger(id) || !mode) {\n        return res.status(400).json({ error: \"Mode de disponibilité invalide\" });\n      }\n      const result = await db(\n        \"UPDATE products SET stock_mode=$1 WHERE id=$2 RETURNING id, stock, stock_mode\",\n        [mode, id]\n      );\n      if (!result.rows.length) return res.status(404).json({ error: \"Produit introuvable\" });\n      res.json({ success: true, product: result.rows[0] });\n    } catch (error) {\n      console.error(\"STOCK_MODE_ERROR:\", error);\n      res.status(500).json({ error: \"Impossible de modifier la disponibilité\" });\n    }\n  }\n);\n\n`;
        text = text.replace(/\ninitDb\(\)\n  \.then\(\(\) => \{/, `${route}initDb()\n  .then(() => {`);
      }
    }
    return text;
  });

  patchFile(path.join(SERVER_DIR, "paytech.js"), text => {
    text = text.replace(
      /SELECT id,name,price,promo_price,promo_active,stock,emoji FROM products/,
      "SELECT id,name,price,promo_price,promo_active,stock,stock_mode,emoji FROM products"
    );
    text = text.replace(
      /if \(Number\(product\.stock\) < quantity\) throw new Error\(`Stock insuffisant pour \$\{product\.name\}`\);/g,
      "if (product.stock_mode !== \"on_order\" && Number(product.stock) < quantity) throw new Error(`Stock insuffisant pour ${product.name}`);"
    );
    text = text.replace(
      /UPDATE products SET stock=stock-\$1 WHERE id=\$2 AND stock >= \$1/g,
      "UPDATE products SET stock=CASE WHEN stock_mode='on_order' THEN stock ELSE stock-$1 END WHERE id=$2 AND (stock_mode='on_order' OR stock >= $1)"
    );

    if (!text.includes(RESERVATION_MARKER)) {
      text = text.replace(
        /ADD COLUMN IF NOT EXISTS refund_provider_message TEXT\n    \);/,
        "ADD COLUMN IF NOT EXISTS refund_provider_message TEXT,\n      ADD COLUMN IF NOT EXISTS stock_reserved_until TIMESTAMPTZ\n    );"
      );

      const reservationHelpers = `\n  ${RESERVATION_MARKER}\n  const STOCK_RESERVATION_MINUTES = 20;\n\n  async function releaseExpiredStockReservations() {\n    const client = await pool.connect();\n    try {\n      await client.query(\"BEGIN\");\n      const result = await client.query(\`\n        SELECT id, items FROM orders\n        WHERE payment_status='En attente'\n          AND stock_reserved_until IS NOT NULL\n          AND stock_reserved_until <= NOW()\n        FOR UPDATE SKIP LOCKED\n      \`);\n      for (const order of result.rows) {\n        for (const item of (Array.isArray(order.items) ? order.items : [])) {\n          const quantity = Number(item.quantity);\n          const productId = Number(item.id);\n          if (Number.isInteger(quantity) && quantity > 0 && Number.isInteger(productId)) {\n            await client.query(\`UPDATE products SET stock=stock+$1 WHERE id=$2 AND stock_mode <> 'on_order'\`, [quantity, productId]);\n          }\n        }\n        await client.query(\`UPDATE orders SET stock_reserved_until=NULL,status='Paiement expiré',payment_status='Échec' WHERE id=$1 AND payment_status='En attente'\`, [order.id]);\n      }\n      await client.query(\"COMMIT\");\n    } catch (error) {\n      await client.query(\"ROLLBACK\");\n      console.error(\"STOCK_RESERVATION_CLEANUP_ERROR:\", error);\n    } finally {\n      client.release();\n    }\n  }\n\n  releaseExpiredStockReservations();\n  const stockReservationTimer = setInterval(releaseExpiredStockReservations, 60 * 1000);\n  stockReservationTimer.unref?.();\n`;
      text = text.replace(/\n  async function markOrderPaid\(/, `${reservationHelpers}\n  async function markOrderPaid(`);

      text = text.replace(
        /SELECT payment_status,items FROM orders WHERE id=\$1 FOR UPDATE/,
        "SELECT payment_status,items,stock_reserved_until FROM orders WHERE id=$1 FOR UPDATE"
      );

      const oldLoop = `      for (const item of items) {\n        const quantity = Number(item.quantity);\n        const productId = Number(item.id);\n        if (!Number.isInteger(quantity) || quantity <= 0 || !Number.isInteger(productId)) throw new Error(\"Commande payée invalide\");\n        const stockUpdate = await client.query(\n          \`UPDATE products SET stock=CASE WHEN stock_mode='on_order' THEN stock ELSE stock-$1 END WHERE id=$2 AND (stock_mode='on_order' OR stock >= $1)\`,\n          [quantity, productId]\n        );\n        if (stockUpdate.rowCount !== 1) throw new Error(\`Stock insuffisant ou produit introuvable pour \${productId}\`);\n      }`;
      const newLoop = `      if (!locked.rows[0].stock_reserved_until || new Date(locked.rows[0].stock_reserved_until).getTime() <= Date.now()) throw new Error(\"La réservation de stock a expiré\");\n      for (const item of items) {\n        const quantity = Number(item.quantity);\n        const productId = Number(item.id);\n        if (!Number.isInteger(quantity) || quantity <= 0 || !Number.isInteger(productId)) throw new Error(\"Commande payée invalide\");\n      }`;
      if (text.includes(oldLoop)) text = text.replace(oldLoop, newLoop);
      else text = text.replace(/      for \(const item of items\) \{[\s\S]*?      \}\n      await client\.query\(\n        `UPDATE orders SET payment_status='Payé'/, newLoop + "\n      await client.query(\n        `UPDATE orders SET payment_status='Payé'");

      text = text.replace(
        /`INSERT INTO orders \(status,customer,payment,items,total,payment_status,payment_method,paytech_ref,payment_request_key\)\n         VALUES \('Nouvelle',\$1,\$2,\$3,\$4,'En attente',\$2,\$5,\$6\) RETURNING id`/,
        "`INSERT INTO orders (status,customer,payment,items,total,payment_status,payment_method,paytech_ref,payment_request_key,stock_reserved_until)\n         VALUES ('Nouvelle',$1,$2,$3,$4,'En attente',$2,$5,$6,NOW() + INTERVAL '20 minutes') RETURNING id`"
      );

      const commitNeed = `      orderId = inserted.rows[0].id;\n      await client.query(\"COMMIT\");`;
      const reserveAfterInsert = `      orderId = inserted.rows[0].id;\n      for (const item of finalItems) {\n        const stockUpdate = await client.query(\n          \`UPDATE products SET stock=CASE WHEN stock_mode='on_order' THEN stock ELSE stock-$1 END WHERE id=$2 AND (stock_mode='on_order' OR stock >= $1)\`,\n          [item.quantity, item.id]\n        );\n        if (stockUpdate.rowCount !== 1) throw new Error(\`Stock insuffisant pour \${item.name}\`);\n      }\n      await client.query(\"COMMIT\");`;
      if (text.includes(commitNeed)) text = text.replace(commitNeed, reserveAfterInsert);

      text = text.replace(
        /UPDATE orders SET status='Paiement échoué',payment_status='Échec' WHERE id=\$1/g,
        "UPDATE orders SET status='Paiement échoué',payment_status='Échec',stock_reserved_until=NULL WHERE id=$1"
      );

      const cancelOld = `UPDATE orders SET status='Annulée',payment_status='Annulée',payment_method=COALESCE($1,payment_method),paytech_token=COALESCE($2,paytech_token) WHERE id=$3 AND payment_status <> 'Payé'`;
      const cancelNew = `UPDATE orders SET status='Annulée',payment_status='Annulée',payment_method=COALESCE($1,payment_method),paytech_token=COALESCE($2,paytech_token),stock_reserved_until=NULL WHERE id=$3 AND payment_status <> 'Payé'`;
      text = text.replace(cancelOld, cancelNew);

      const cancelBlock = `      } else if (body.type_event === \"sale_canceled\") {\n        await pool.query(\`UPDATE orders SET status='Annulée',payment_status='Annulée',payment_method=COALESCE($1,payment_method),paytech_token=COALESCE($2,paytech_token),stock_reserved_until=NULL WHERE id=$3 AND payment_status <> 'Payé'\`, [body.payment_method || null, body.token || null, order.id]);\n      }`;
      const cancelReplacement = `      } else if (body.type_event === \"sale_canceled\") {\n        const cancelClient = await pool.connect();\n        try {\n          await cancelClient.query(\"BEGIN\");\n          const locked = await cancelClient.query(\`SELECT items,payment_status,stock_reserved_until FROM orders WHERE id=$1 FOR UPDATE\`, [order.id]);\n          if (locked.rows.length && locked.rows[0].payment_status !== 'Payé' && locked.rows[0].stock_reserved_until) {\n            for (const item of (Array.isArray(locked.rows[0].items) ? locked.rows[0].items : [])) {\n              const quantity = Number(item.quantity); const productId = Number(item.id);\n              if (Number.isInteger(quantity) && quantity > 0 && Number.isInteger(productId)) await cancelClient.query(\`UPDATE products SET stock=stock+$1 WHERE id=$2 AND stock_mode <> 'on_order'\`, [quantity, productId]);\n            }\n          }\n          await cancelClient.query(\`UPDATE orders SET status='Annulée',payment_status='Annulée',payment_method=COALESCE($1,payment_method),paytech_token=COALESCE($2,paytech_token),stock_reserved_until=NULL WHERE id=$3 AND payment_status <> 'Payé'\`, [body.payment_method || null, body.token || null, order.id]);\n          await cancelClient.query(\"COMMIT\");\n        } catch (e) { await cancelClient.query(\"ROLLBACK\"); throw e; } finally { cancelClient.release(); }\n      }`;
      if (text.includes(cancelBlock)) text = text.replace(cancelBlock, cancelReplacement);
    }
    return text;
  });

  patchFile(path.join(SERVER_DIR, "customer-system.js"), text => {
    text = text.replace(
      /SELECT id,name,price,promo_price,promo_active,stock,emoji FROM products/,
      "SELECT id,name,price,promo_price,promo_active,stock,stock_mode,emoji FROM products"
    );
    text = text.replace(
      /if \(Number\(product\.stock\) < quantity\) throw new Error\(`Stock insuffisant pour \$\{product\.name\}`\);/g,
      "if (product.stock_mode !== \"on_order\" && Number(product.stock) < quantity) throw new Error(`Stock insuffisant pour ${product.name}`);"
    );
    return text;
  });
}

function patchPackageScripts() {
  const file = path.join(ROOT, "package.json");
  if (!fs.existsSync(file)) return;
  const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
  const preload = "./server/stock-mode-preload.js";
  for (const key of ["start", "dev"]) {
    if (pkg.scripts?.[key] && !pkg.scripts[key].includes(preload)) {
      pkg.scripts[key] = pkg.scripts[key].replace("node -r ", `node -r ${preload} -r `);
    }
  }
  fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + "\n", "utf8");
}

function patchHtml(fileName) {
  const file = path.join(ROOT, "public", fileName);
  patchFile(file, text => {
    const tag = '<script src="/stock-mode.js?v=20261019-0835"></script>';
    if (text.includes("/stock-mode.js")) {
      return text.replace(/<script\b[^>]*src="[^"]*stock-mode\.js(?:\?[^"]*)?"[^>]*><\/script>/i, tag);
    }
    return text.replace(/<\/body>/i, tag + "</body>");
  });
}

patchPackageScripts();
patchServerSource();
patchHtml("index.html");
patchHtml("admin.html");
patchHtml("admin-dashboard.html");

const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
  if (request === "./server" && parent && /server[\\/]bootstrap\.js$/.test(parent.filename)) {
    patchServerSource();
  }
  return originalLoad.apply(this, arguments);
};
