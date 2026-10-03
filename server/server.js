const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL manquante. Connecte une base PostgreSQL à Render.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  max: 5,
  idleTimeoutMillis: 30000
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

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      status TEXT NOT NULL DEFAULT 'Nouvelle',
      customer JSONB NOT NULL,
      payment TEXT NOT NULL,
      items JSONB NOT NULL,
      total INTEGER NOT NULL DEFAULT 0
    );
  `);

  const count = await db("SELECT COUNT(*)::int AS count FROM products");

  if (count.rows[0].count === 0) {
    await db(`
      INSERT INTO products (name, category, price, stock, emoji) VALUES
      ('Manette PS5 DualSense', 'Manettes', 45000, 12, '🎮'),
      ('Casque Gaming RGB', 'Casques', 28000, 8, '🎧'),
      ('Clavier mécanique RGB', 'Claviers', 35000, 6, '⌨️'),
      ('Souris Gaming 7200 DPI', 'Souris', 18000, 15, '🖱️')
    `);
  }
}

const ADMIN_USER = process.env.ADMIN_USER || "admin";

const ADMIN_HASH =
  process.env.ADMIN_PASSWORD_HASH ||
  bcrypt.hashSync(process.env.ADMIN_PASSWORD || "ChangeMe123!", 10);

app.set("trust proxy", 1);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "CHANGE_THIS_SECRET",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 8
    }
  })
);

function auth(req, res, next) {
  if (!req.session.admin) {
    return res.status(401).json({ error: "Non autorisé" });
  }

  next();
}

app.get("/healthz", async (req, res) => {
  try {
    await db("SELECT 1");
    res.json({ ok: true });
  } catch {
    res.status(503).json({ ok: false });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const r = await db(
      "SELECT id, name, category, price, stock, emoji FROM products ORDER BY id ASC"
    );

    res.json(r.rows);
  } catch {
    res.status(500).json({
      error: "Impossible de charger les produits"
    });
  }
});

app.post("/api/orders", async (req, res) => {
  const client = await pool.connect();

  try {
    const { customer, payment, items } = req.body;

    if (
      !customer?.name ||
      !customer?.phone ||
      !customer?.address ||
      !Array.isArray(items) ||
      !items.length
    ) {
      return res.status(400).json({
        error: "Commande incomplète"
      });
    }

    await client.query("BEGIN");

    const normalized = [];
    let total = 0;

    for (const item of items) {
      const qty = Number(item.qty);

      if (!Number.isInteger(qty) || qty < 1 || qty > 99) {
        throw new Error("Quantité invalide");
      }

      const p = await client.query(
        "SELECT id, name, price, stock, emoji FROM products WHERE id=$1 FOR UPDATE",
        [item.id]
      );

      if (!p.rows[0]) {
        throw new Error("Produit introuvable");
      }

      const product = p.rows[0];

      if (product.stock < qty) {
        throw new Error(`Stock insuffisant pour ${product.name}`);
      }

      await client.query(
        "UPDATE products SET stock=stock-$1 WHERE id=$2",
        [qty, product.id]
      );

      total += product.price * qty;

      normalized.push({
        id: product.id,
        name: product.name,
        price: product.price,
        qty,
        emoji: product.emoji
      });
    }

    const orderId = "SG-" + Date.now();

    await client.query(
      "INSERT INTO orders (id, status, customer, payment, items, total) VALUES ($1,'Nouvelle',$2,$3,$4,$5)",
      [
        orderId,
        JSON.stringify(customer),
        payment || "À la livraison",
        JSON.stringify(normalized),
        total
      ]
    );

    await client.query("COMMIT");

    res.json({
      ok: true,
      orderId,
      total
    });
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});

    res.status(400).json({
      error: e.message || "Erreur lors de la commande"
    });
  } finally {
    client.release();
  }
});

app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body;

  if (
    username !== ADMIN_USER ||
    !(await bcrypt.compare(password || "", ADMIN_HASH))
  ) {
    return res.status(401).json({
      error: "Identifiants incorrects"
    });
  }

  req.session.admin = true;

  res.json({
    ok: true
  });
});

app.post("/api/admin/logout", auth, (req, res) =>
  req.session.destroy(() => res.json({ ok: true }))
);

app.get("/api/admin/me", (req, res) =>
  res.json({
    authenticated: !!req.session.admin
  })
);

app.get("/api/admin/orders", auth, async (req, res) => {
  try {
    const r = await db(
      'SELECT id, created_at AS "createdAt", status, customer, payment, items, total FROM orders ORDER BY created_at DESC'
    );

    res.json(r.rows);
  } catch {
    res.status(500).json({
      error: "Impossible de charger les commandes"
    });
  }
});

app.patch("/api/admin/orders/:id", auth, async (req, res) => {
  try {
    const r = await db(
      'UPDATE orders SET status=$1 WHERE id=$2 RETURNING id, created_at AS "createdAt", status, customer, payment, items, total',
      [req.body.status || "Nouvelle", req.params.id]
    );

    if (!r.rows[0]) {
      return res.status(404).json({
        error: "Commande introuvable"
      });
    }

    res.json(r.rows[0]);
  } catch {
    res.status(500).json({
      error: "Impossible de modifier la commande"
    });
  }
});

app.post("/api/admin/products", auth, async (req, res) => {
  const { name, category, price, stock, emoji } = req.body;

  const p = {
    name: String(name || "").trim(),
    category: String(category || "Accessoires").trim(),
    price: Number(price),
    stock: Number(stock),
    emoji: emoji || "🎮"
  };

  if (
    !p.name ||
    !Number.isFinite(p.price) ||
    p.price < 0 ||
    !Number.isInteger(p.stock) ||
    p.stock < 0
  ) {
    return res.status(400).json({
      error: "Produit invalide"
    });
  }

  try {
    const r = await db(
      "INSERT INTO products (name, category, price, stock, emoji) VALUES ($1,$2,$3,$4,$5) RETURNING id, name, category, price, stock, emoji",
      [p.name, p.category, p.price, p.stock, p.emoji]
    );

    res.json(r.rows[0]);
  } catch {
    res.status(500).json({
      error: "Impossible d'ajouter le produit"
    });
  }
});

app.patch("/api/admin/products/:id", auth, async (req, res) => {
  try {
    const old = await db(
      "SELECT * FROM products WHERE id=$1",
      [req.params.id]
    );

    if (!old.rows[0]) {
      return res.status(404).json({
        error: "Produit introuvable"
      });
    }

    const p = old.rows[0];

    const name = req.body.name ?? p.name;
    const category = req.body.category ?? p.category;
    const price =
      req.body.price !== undefined ? Number(req.body.price) : p.price;
    const stock =
      req.body.stock !== undefined ? Number(req.body.stock) : p.stock;
    const emoji = req.body.emoji ?? p.emoji;

    if (
      !name ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      return res.status(400).json({
        error: "Valeurs invalides"
      });
    }

    const r = await db(
      "UPDATE products SET name=$1, category=$2, price=$3, stock=$4, emoji=$5 WHERE id=$6 RETURNING id, name, category, price, stock, emoji",
      [name, category, price, stock, emoji, req.params.id]
    );

    res.json(r.rows[0]);
  } catch {
    res.status(500).json({
      error: "Impossible de modifier le produit"
    });
  }
});

app.delete("/api/admin/products/:id", auth, async (req, res) => {
  try {
    await db(
      "DELETE FROM products WHERE id=$1",
      [req.params.id]
    );

    res.json({
      ok: true
    });
  } catch {
    res.status(500).json({
      error: "Impossible de supprimer le produit"
    });
  }
});

app.use(express.static(path.join(__dirname, "../public")));

app.get("*", (req, res) =>
  res.sendFile(path.join(__dirname, "../public/index.html"))
);

initDb()
  .then(() =>
    app.listen(PORT, "0.0.0.0", () =>
      console.log(`SNGAMER STORE V7 sur port ${PORT}`)
    )
  )
  .catch(err => {
    console.error("Erreur DB:", err);
    process.exit(1);
  });
