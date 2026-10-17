// SNGAMER STORE server
// This file is updated in-place to keep the existing backend behavior while exposing
// the campaign metadata needed by the storefront campaign carousel.

const express = require("express");
const path = require("path");
const session = require("express-session");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

async function db(text, params = []) {
  return pool.query(text, params);
}

async function initDatabase() {
  await db(`
    CREATE TABLE IF NOT EXISTS products (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT,
      platform TEXT,
      price NUMERIC DEFAULT 0,
      stock INTEGER DEFAULT 0,
      emoji TEXT DEFAULT '🎮',
      description TEXT,
      image1_url TEXT,
      image2_url TEXT,
      image3_url TEXT,
      video_url TEXT,
      promo_price NUMERIC DEFAULT 0,
      promo_active BOOLEAN DEFAULT FALSE,
      campaign_id BIGINT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await db(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      sticker TEXT DEFAULT '',
      description TEXT DEFAULT '',
      active BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await db(`
    ALTER TABLE campaigns
    ADD COLUMN IF NOT EXISTS right_sticker TEXT DEFAULT '';
  `);

  await db(`
    ALTER TABLE products
    ADD COLUMN IF NOT EXISTS campaign_id BIGINT
    REFERENCES campaigns(id) ON DELETE SET NULL;
  `);

  await db(`
    CREATE TABLE IF NOT EXISTS promo_media (
      id BIGSERIAL PRIMARY KEY,
      url TEXT,
      campaign_id BIGINT REFERENCES campaigns(id) ON DELETE SET NULL,
      product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await db(`
    ALTER TABLE promo_media
    ADD COLUMN IF NOT EXISTS campaign_id BIGINT
    REFERENCES campaigns(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS product_id BIGINT
    REFERENCES products(id) ON DELETE SET NULL;
  `);

  console.log("Database initialized successfully");
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("trust proxy", 1);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "sngamer-development-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24
    }
  })
);

app.get("/healthz", async (req, res) => {
  try {
    await db("SELECT 1");
    res.json({ ok: true, database: "connected" });
  } catch (error) {
    console.error("HEALTH_ERROR:", error);
    res.status(500).json({ ok: false, database: "error" });
  }
});

/* =========================
   PRODUCTS
   Campaign metadata is joined here so the public storefront receives
   the same campaign name/stickers selected in the admin dashboard.
========================= */
app.get("/api/products", async (req, res) => {
  try {
    const result = await db(`
      SELECT
        p.id,
        p.name,
        p.category,
        p.platform,
        p.price,
        p.stock,
        p.emoji,
        p.description,
        p.image1_url,
        p.image2_url,
        p.image3_url,
        p.video_url,
        p.promo_price,
        p.promo_active,
        p.campaign_id,
        c.name AS campaign_name,
        c.sticker AS campaign_sticker,
        c.right_sticker AS campaign_right_sticker,
        c.active AS campaign_active,
        p.created_at
      FROM products p
      LEFT JOIN campaigns c ON c.id = p.campaign_id
      ORDER BY p.created_at DESC, p.id DESC
    `);

    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.json(result.rows);
  } catch (error) {
    console.error("PRODUCTS_ERROR:", error);
    res.status(500).json({ error: "Impossible de charger les produits" });
  }
});

/* =========================
   PROMO MEDIA
========================= */
app.get("/api/promo-media", async (req, res) => {
  try {
    const result = await db(`
      SELECT
        pm.id,
        pm.url,
        pm.campaign_id,
        pm.product_id,
        c.name AS campaign_name,
        c.sticker AS campaign_sticker,
        c.right_sticker AS campaign_right_sticker,
        c.active AS campaign_active
      FROM promo_media pm
      LEFT JOIN campaigns c ON c.id = pm.campaign_id
      ORDER BY pm.created_at DESC, pm.id DESC
    `);

    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.json(result.rows);
  } catch (error) {
    console.error("PROMO_MEDIA_ERROR:", error);
    res.status(500).json({ error: "Impossible de charger les campagnes" });
  }
});

/* =========================
   CREATE ORDER
========================= */
app.post("/api/orders", async (req, res) => {
  const client = await pool.connect();

  try {
    const { customer, payment, items } = req.body;

    if (!customer || !payment || !Array.isArray(items)) {
      return res.status(400).json({ error: "Données de commande invalides" });
    }

    if (items.length === 0) {
      return res.status(400).json({ error: "Le panier est vide" });
    }

    await client.query("BEGIN");

    let total = 0;
    const finalItems = [];

    for (const item of items) {
      const productId = Number(item.id);
      const quantity = Number(item.quantity ?? item.qty);

      if (!Number.isInteger(productId) || !Number.isInteger(quantity)) {
        throw new Error("Produit ou quantité invalide");
      }

      if (quantity <= 0) {
        throw new Error("Quantité invalide");
      }

      const productResult = await client.query(
        `
        SELECT id, name, price, promo_price, promo_active, stock, emoji
        FROM products
        WHERE id = $1
        FOR UPDATE
        `,
        [productId]
      );

      if (productResult.rows.length === 0) {
        throw new Error("Produit introuvable");
      }

      const product = productResult.rows[0];

      if (product.stock < quantity) {
        throw new Error(`Stock insuffisant pour ${product.name}`);
      }

      const promoActive =
        Boolean(product.promo_active) &&
        Number(product.promo_price) > 0 &&
        Number(product.promo_price) < Number(product.price);

      const unitPrice = promoActive ? Number(product.promo_price) : Number(product.price);
      const subtotal = unitPrice * quantity;

      total += subtotal;

      finalItems.push({
        id: product.id,
        name: product.name,
        price: unitPrice,
        quantity,
        subtotal,
        emoji: product.emoji
      });
    }

    await client.query("ROLLBACK");

    return res.status(503).json({
      error: "Le paiement en ligne n'est pas encore activé. Aucune commande n'a été validée et le stock n'a pas été modifié."
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("ORDER_ERROR:", error);
    res.status(400).json({ error: error.message || "Impossible de créer la commande" });
  } finally {
    client.release();
  }
});

/* =========================
   ADMIN AUTH
========================= */
function requireAdmin(req, res, next) {
  if (!req.session.admin) {
    return res.status(401).json({ error: "Non autorisé" });
  }
  next();
}

app.post("/api/admin/login", async (req, res) => {
  const diagnosticStart = Date.now();
  console.log("LOGIN_DIAGNOSTIC: route atteinte");

  try {
    const { username, password } = req.body || {};
    console.log("LOGIN_DIAGNOSTIC: username reçu =", username || "(vide)");

    const adminUser = process.env.ADMIN_USER;
    const adminPassword = process.env.ADMIN_PASSWORD;

    console.log("LOGIN_DIAGNOSTIC: ADMIN_USER présent =", Boolean(adminUser));
    console.log("LOGIN_DIAGNOSTIC: ADMIN_PASSWORD présent =", Boolean(adminPassword));

    if (!adminUser || !adminPassword) {
      console.log("LOGIN_DIAGNOSTIC: configuration administrateur manquante");
      return res.status(500).json({ error: "Configuration administrateur manquante" });
    }

    if (username !== adminUser) {
      console.log("LOGIN_DIAGNOSTIC: mauvais nom utilisateur");
      return res.status(401).json({ error: "Identifiants incorrects" });
    }

    console.log("LOGIN_DIAGNOSTIC: nom utilisateur correct");
    let passwordValid = false;

    if (
      adminPassword.startsWith("$2a$") ||
      adminPassword.startsWith("$2b$") ||
      adminPassword.startsWith("$2y$")
    ) {
      console.log("LOGIN_DIAGNOSTIC: vérification bcrypt démarrée");
      const bcryptTimeout = new Promise((resolve) => {
        setTimeout(() => resolve("TIMEOUT"), 8000);
      });
      const bcryptCheck = bcrypt.compare(password || "", adminPassword);
      const bcryptResult = await Promise.race([bcryptCheck, bcryptTimeout]);

      if (bcryptResult === "TIMEOUT") {
        console.log("LOGIN_DIAGNOSTIC: bcrypt dépasse 8 secondes");
        return res.status(500).json({ error: "La vérification du mot de passe prend trop de temps." });
      }

      passwordValid = Boolean(bcryptResult);
    } else {
      passwordValid = password === adminPassword;
    }

    if (!passwordValid) {
      console.log("LOGIN_DIAGNOSTIC: mot de passe incorrect");
      return res.status(401).json({ error: "Identifiants incorrects" });
    }

    req.session.admin = true;
    console.log("LOGIN_DIAGNOSTIC: connexion réussie en", Date.now() - diagnosticStart, "ms");
    return res.json({ ok: true });
  } catch (error) {
    console.error("LOGIN_ERROR:", error);
    return res.status(500).json({ error: "Erreur de connexion" });
  }
});

app.use(express.static(path.join(__dirname, "../public")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`SNGAMER STORE running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("DATABASE_INIT_ERROR:", error);
    process.exit(1);
  });
