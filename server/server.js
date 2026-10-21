const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");
const { v2: cloudinary } = require("cloudinary");
const multer = require("multer");
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 4
  }
});
function uploadToCloudinary(buffer, resourceType, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder: folder
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    stream.end(buffer);
  });
}
const app = express();
const PORT = process.env.PORT || 10000;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function db(query, params = []) {
  return pool.query(query, params);
}

async function initDb() {
  await db(`
    CREATE TABLE IF NOT EXISTS products (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Accessoires',
platform TEXT DEFAULT NULL,
price INTEGER NOT NULL CHECK (price >= 0),
      stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
      emoji TEXT NOT NULL DEFAULT '🎮',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db(`
    ALTER TABLE products
    ADD COLUMN IF NOT EXISTS emoji TEXT NOT NULL DEFAULT '🎮'
  `);

  await db(`
  ALTER TABLE products
  ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT NULL
`);
  
  await db(`
    ALTER TABLE products
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS main_image_url TEXT,
    ADD COLUMN IF NOT EXISTS image1_url TEXT,
    ADD COLUMN IF NOT EXISTS image2_url TEXT,
    ADD COLUMN IF NOT EXISTS image3_url TEXT,
    ADD COLUMN IF NOT EXISTS video_url TEXT
  `);
  await db(`
    CREATE TABLE IF NOT EXISTS orders (
      id BIGSERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      status TEXT NOT NULL DEFAULT 'Nouvelle',
      customer JSONB NOT NULL,
      payment TEXT NOT NULL,
      items JSONB NOT NULL,
      total INTEGER NOT NULL DEFAULT 0
    );
  `);  await db(`
    ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS customer JSONB DEFAULT '{}'::jsonb
  `);

  await db(`
    ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS payment TEXT DEFAULT 'Paiement à la livraison'
  `);

  await db(`
    ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb
  `);

  await db(`
    ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS total INTEGER DEFAULT 0
  `);
  await db(`
    ALTER TABLE orders
    ALTER COLUMN customer_name DROP NOT NULL
  `);
  await db(`
  ALTER TABLE orders
  ALTER COLUMN phone DROP NOT NULL
`);
        await db(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS main_image_url TEXT,
      ADD COLUMN IF NOT EXISTS image1_url TEXT,
      ADD COLUMN IF NOT EXISTS image2_url TEXT,
      ADD COLUMN IF NOT EXISTS image3_url TEXT,
      ADD COLUMN IF NOT EXISTS video_url TEXT
    `);
  await db(`
  UPDATE products
  SET main_image_url = image1_url
  WHERE main_image_url IS NULL
    AND image1_url IS NOT NULL
`);
  const countResult = await db(
    "SELECT COUNT(*)::int AS count FROM products"
  );

  if (countResult.rows[0].count === 0) {
    await db(
      `
      INSERT INTO products
        (name, category, price, stock, emoji)
      VALUES
        ($1, $2, $3, $4, $5),
        ($6, $7, $8, $9, $10),
        ($11, $12, $13, $14, $15),
        ($16, $17, $18, $19, $20)
      `,
      [
        "Manette PS5 DualSense",
        "Manettes",
        45000,
        12,
        "🎮",

        "Casque Gaming RGB",
        "Casques",
        28000,
        8,
        "🎧",

        "Clavier mécanique RGB",
        "Claviers",
        35000,
        6,
        "⌨️",

        "Souris Gaming 7200 DPI",
        "Souris",
        18000,
        15,
        "🖱️"
      ]
    );
  }
  /* =================================
     CAMPAIGNS + PROMOTIONS
  ================================= */

  await db(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      sticker TEXT DEFAULT '',
      description TEXT DEFAULT '',
      active BOOLEAN NOT NULL DEFAULT false,
      start_date TIMESTAMPTZ,
      end_date TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db(`
    ALTER TABLE products
    ADD COLUMN IF NOT EXISTS promo_price INTEGER
      CHECK (promo_price >= 0),
    ADD COLUMN IF NOT EXISTS promo_active BOOLEAN
      NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS campaign_id BIGINT
      REFERENCES campaigns(id)
      ON DELETE SET NULL;
  `);
  
await db(`
  ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS right_sticker TEXT DEFAULT '';
`);

    await db(`
    CREATE TABLE IF NOT EXISTS promo_media (
      slot INTEGER PRIMARY KEY CHECK (slot IN (1, 2, 3)),
      media_type TEXT NOT NULL,
      url TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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

const CUSTOMER_SESSION_MAX_AGE = 30 * 24 * 60 * 60 * 1000;
const ADMIN_SESSION_MAX_AGE = 8 * 60 * 60 * 1000;

app.use(
  session({
    name: "sngamer.sid",
    secret: process.env.SESSION_SECRET || "sngamer-development-secret",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: CUSTOMER_SESSION_MAX_AGE
    }
  })
);

/* =========================
   HEALTH CHECK
========================= */

app.get("/healthz", async (req, res) => {
  try {
    await db("SELECT 1");
    res.json({
      ok: true,
      database: "connected"
    });
  } catch (error) {
    console.error("HEALTH_ERROR:", error);
    res.status(500).json({
      ok: false,
      database: "error"
    });
  }
});

/* =========================
   PRODUCTS
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
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("PRODUCTS_ERROR:", error);

    res.status(500).json({
      error: "Impossible de charger les produits"
    });
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
      return res.status(400).json({
        error: "Données de commande invalides"
      });
    }

    if (items.length === 0) {
      return res.status(400).json({
        error: "Le panier est vide"
      });
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
        throw new Error(
          `Stock insuffisant pour ${product.name}`
        );
      }

      
const promoActive =
  Boolean(product.promo_active) &&
  Number(product.promo_price) > 0 &&
  Number(product.promo_price) < Number(product.price);

const unitPrice = promoActive
  ? Number(product.promo_price)
  : Number(product.price);

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

            // Le stock est uniquement vérifié ici.
      // Il ne doit être déduit qu'après confirmation réelle du paiement.
    }

        await client.query("ROLLBACK");

    return res.status(503).json({
      error: "Le paiement en ligne n'est pas encore activé. Aucune commande n'a été validée et le stock n'a pas été modifié."
     });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("ORDER_ERROR:", error);

    res.status(400).json({
      error: error.message || "Impossible de créer la commande"
    });
  } finally {
    client.release();
  }
});

/* =========================
   ADMIN AUTH
========================= */

const adminLoginAttempts = new Map();
const ADMIN_LOGIN_WINDOW_MS = 15 * 60 * 1000;
const ADMIN_LOGIN_MAX_ATTEMPTS = 5;

function checkAdminLoginRateLimit(ip) {
  const now = Date.now();
  const current = adminLoginAttempts.get(ip);
  const attempts = current && now - current.startedAt < ADMIN_LOGIN_WINDOW_MS
    ? current
    : { startedAt: now, count: 0 };

  if (attempts.count >= ADMIN_LOGIN_MAX_ATTEMPTS) {
    return false;
  }

  attempts.count += 1;
  adminLoginAttempts.set(ip, attempts);
  return true;
}

function requireAdmin(req, res, next) {
  if (!req.session.admin) {
    return res.status(401).json({
      error: "Non autorisé"
    });
  }

  next();
}

app.post("/api/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const adminUser = process.env.ADMIN_USER;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminUser || !adminPassword) {
      return res.status(500).json({
        error: "Configuration administrateur manquante"
      });
    }

    if (!checkAdminLoginRateLimit(req.ip)) {
      return res.status(429).json({
        error: "Trop de tentatives de connexion. Réessayez plus tard."
      });
    }

    if (username !== adminUser) {
      return res.status(401).json({
        error: "Identifiants incorrects"
      });
    }

    let passwordValid = false;

    if (
      adminPassword.startsWith("$2a$") ||
      adminPassword.startsWith("$2b$") ||
      adminPassword.startsWith("$2y$")
    ) {
      passwordValid = await bcrypt.compare(password || "", adminPassword);
    } else {
      passwordValid = password === adminPassword;
    }

    if (!passwordValid) {
      return res.status(401).json({
        error: "Identifiants incorrects"
      });
    }

    await new Promise((resolve, reject) => {
      req.session.regenerate((error) => {
        if (error) {
          reject(error);
          return;
        }

        req.session.admin = true;
        req.session.save((saveError) => {
          if (saveError) {
            reject(saveError);
            return;
          }
          resolve();
        });
      });
    });

    req.session.cookie.maxAge = ADMIN_SESSION_MAX_AGE;
    adminLoginAttempts.delete(req.ip);

    return res.json({
      success: true
    });
  } catch (error) {
    console.error("ADMIN_LOGIN_ERROR:", error);

    return res.status(500).json({
      error: "Erreur de connexion"
    });
  }
});

app.post("/api/admin/logout", (req, res) => {
  req.session.destroy((error) => {
    res.clearCookie("sngamer.sid");

    if (error) {
      return res.status(500).json({
        error: "Impossible de fermer la session"
      });
    }

    return res.json({
      success: true
    });
  });
});

app.get("/api/admin/me", (req, res) => {
  res.json({
    authenticated: Boolean(req.session.admin)
  });
});

/* =========================
   ADMIN ORDERS
========================= */

app.get(
  "/api/admin/orders",
  requireAdmin,
  async (req, res) => {
    try {
      const result = await db(`
        SELECT
          id,
          created_at,
          status,
          customer,
          payment,
          payment_status,
          payment_method,
          paid_at,
          paytech_ref,
          refund_status,
          refund_requested_at,
          refunded_at,
          refund_provider_message,
          items,
          total,
          customer_id
        FROM orders
        ORDER BY created_at DESC
      `);

      res.json(result.rows);
    } catch (error) {
      console.error("ADMIN_ORDERS_ERROR:", error);
      res.status(500).json({ error: "Impossible de charger les commandes" });
    }
  }
);

/* =========================
   SERVER START
========================= */

async function startServer() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`SNGAMER Store running on port ${PORT}`);
    });
  } catch (error) {
    console.error("STARTUP_ERROR:", error);
    process.exit(1);
  }
}

startServer();
