const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");

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
        id,
        name,
        category,
        price,
        stock,
        emoji,
        created_at
      FROM products
      ORDER BY id DESC
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
        SELECT id, name, price, stock, emoji
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

      const subtotal = product.price * quantity;
      total += subtotal;

      finalItems.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity,
        subtotal,
        emoji: product.emoji
      });

      await client.query(
        `
        UPDATE products
        SET stock = stock - $1
        WHERE id = $2
        `,
        [quantity, productId]
      );
    }

    const orderResult = await client.query(
      `
      INSERT INTO orders
        (customer, payment, items, total)
      VALUES
        ($1, $2, $3, $4)
      RETURNING id, created_at, status, total
      `,
      [
        JSON.stringify(customer),
        payment,
        JSON.stringify(finalItems),
        total
      ]
    );

    await client.query("COMMIT");

    res.status(201).json({
  success: true,
  orderId: orderResult.rows[0].id,
  order: orderResult.rows[0]
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
    const { username, password } = req.body;

    const adminUser = process.env.ADMIN_USER;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminUser || !adminPassword) {
      return res.status(500).json({
        error: "Configuration administrateur manquante"
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
      passwordValid = await bcrypt.compare(
        password,
        adminPassword
      );
    } else {
      passwordValid = password === adminPassword;
    }

    if (!passwordValid) {
      return res.status(401).json({
        error: "Identifiants incorrects"
      });
    }

    req.session.admin = true;

    res.json({
      success: true
    });
  } catch (error) {
    console.error("LOGIN_ERROR:", error);

    res.status(500).json({
      error: "Erreur de connexion"
    });
  }
});

app.post("/api/admin/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({
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
          items,
          total
        FROM orders
        ORDER BY created_at DESC
      `);

      res.json(result.rows);
    } catch (error) {
      console.error("ADMIN_ORDERS_ERROR:", error);

      res.status(500).json({
        error: "Impossible de charger les commandes"
      });
    }
  }
);

app.patch(
  "/api/admin/orders/:id",
  requireAdmin,
  async (req, res) => {
    try {
      const orderId = Number(req.params.id);
      const { status } = req.body;

      const allowedStatuses = [
        "Nouvelle",
        "Confirmée",
        "Expédiée",
        "Livrée",
        "Annulée"
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          error: "Statut invalide"
        });
      }

      const result = await db(
        `
        UPDATE orders
        SET status = $1
        WHERE id = $2
        RETURNING *
        `,
        [status, orderId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: "Commande introuvable"
        });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("UPDATE_ORDER_ERROR:", error);

      res.status(500).json({
        error: "Impossible de modifier la commande"
      });
    }
  }
);

/* =========================
   ADMIN PRODUCTS
========================= */

app.post(
  "/api/admin/products",
  requireAdmin,
  async (req, res) => {
    try {
      const {
        name,
        category,
        price,
        stock,
        emoji
      } = req.body;

      if (!name || price === undefined) {
        return res.status(400).json({
          error: "Nom et prix obligatoires"
        });
      }

      const result = await db(
        `
        INSERT INTO products
          (name, category, price, stock, emoji)
        VALUES
          ($1, $2, $3, $4, $5)
        RETURNING *
        `,
        [
          name,
          category || "Accessoires",
          Number(price),
          Number(stock || 0),
          emoji || "🎮"
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("CREATE_PRODUCT_ERROR:", error);

      res.status(500).json({
        error: "Impossible de créer le produit"
      });
    }
  }
);

app.patch(
  "/api/admin/products/:id",
  requireAdmin,
  async (req, res) => {
    try {
      const productId = Number(req.params.id);

      const {
        name,
        category,
        price,
        stock,
        emoji
      } = req.body;

      const result = await db(
        `
        UPDATE products
        SET
          name = COALESCE($1, name),
          category = COALESCE($2, category),
          price = COALESCE($3, price),
          stock = COALESCE($4, stock),
          emoji = COALESCE($5, emoji)
        WHERE id = $6
        RETURNING *
        `,
        [
          name ?? null,
          category ?? null,
          price !== undefined ? Number(price) : null,
          stock !== undefined ? Number(stock) : null,
          emoji ?? null,
          productId
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: "Produit introuvable"
        });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("UPDATE_PRODUCT_ERROR:", error);

      res.status(500).json({
        error: "Impossible de modifier le produit"
      });
    }
  }
);

app.delete(
  "/api/admin/products/:id",
  requireAdmin,
  async (req, res) => {
    try {
      const productId = Number(req.params.id);

      const result = await db(
        `
        DELETE FROM products
        WHERE id = $1
        RETURNING id
        `,
        [productId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: "Produit introuvable"
        });
      }

      res.json({
        success: true
      });
    } catch (error) {
      console.error("DELETE_PRODUCT_ERROR:", error);

      res.status(500).json({
        error: "Impossible de supprimer le produit"
      });
    }
  }
);

/* =========================
   FRONTEND
========================= */

app.use(express.static(path.join(__dirname, "..", "public")));

app.get("*", (req, res) => {
  res.sendFile(
    path.join(__dirname, "..", "public", "index.html")
  );
});

/* =========================
   START SERVER
========================= */

initDb()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(
        `SNGAMER STORE running on port ${PORT}`
      );
    });
  })
  .catch((error) => {
    console.error("DATABASE_INITIALIZATION_ERROR:", error);
    process.exit(1);
  });
