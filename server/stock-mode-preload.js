const fs = require("fs");
const path = require("path");
const Module = require("module");

const ROOT = path.join(__dirname, "..");
const SERVER_DIR = __dirname;
const MARKER = "/* SNGAMER_STOCK_MODE_V1 */";

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
