const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL manquante");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false
});

app.set("trust proxy", 1);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "change-this-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 8 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === "production",
      httpOnly: true
    }
  })
);

const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "ChangeMe123!";

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price INTEGER NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0,
      description TEXT DEFAULT '',
      image TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT DEFAULT '',
      payment_method TEXT DEFAULT '',
      items JSONB NOT NULL,
      total INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const count = await pool.query(
    "SELECT COUNT(*)::int AS count FROM products"
  );

  if (count.rows[0].count === 0) {
    const products = [
      [
        "Manette PS5 DualSense",
        "Manettes",
        35000,
        10,
        "Manette PS5 DualSense",
        "🎮"
      ],
      [
        "Casque Gaming RGB",
        "Casques",
        25000,
        15,
        "Casque gaming RGB",
        "🎧"
      ],
      [
        "Clavier mécanique RGB",
        "Claviers",
        30000,
        12,
        "Clavier mécanique RGB",
        "⌨️"
      ],
      [
        "Souris Gaming 7200 DPI",
        "Souris",
        15000,
        20,
        "Souris gaming haute précision",
        "🖱️"
      ]
    ];

    for (const product of products) {
      await pool.query(
        `INSERT INTO products
        (name, category, price, stock, description, image)
        VALUES ($1, $2, $3, $4, $5, $6)`,
        product
      );
    }
  }
}

function auth(req, res, next) {
  if (!req.session.isAdmin) {
    return res.status(401).json({ error: "Non autorisé" });
  }
  next();
        }app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM products ORDER BY id ASC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.post("/api/orders", async (req, res) => {
  const { customer_name, phone, address, payment_method, items } = req.body;

  if (!customer_name || !phone || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      error: "Informations de commande incomplètes"
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let total = 0;
    const finalItems = [];

    for (const item of items) {
      const productId = Number(item.id);
      const quantity = Number(item.quantity);

      if (!productId || quantity < 1) {
        throw new Error("Article invalide");
      }

      const result = await client.query(
        "SELECT * FROM products WHERE id = $1 FOR UPDATE",
        [productId]
      );

      if (result.rows.length === 0) {
        throw new Error("Produit introuvable");
      }

      const product = result.rows[0];

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
        quantity
      });

      await client.query(
        "UPDATE products SET stock = stock - $1 WHERE id = $2",
        [quantity, productId]
      );
    }

    const order = await client.query(
      `INSERT INTO orders
      (customer_name, phone, address, payment_method, items, total)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        customer_name,
        phone,
        address || "",
        payment_method || "",
        JSON.stringify(finalItems),
        total
      ]
    );

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      order: order.rows[0]
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);

    res.status(400).json({
      error: error.message || "Impossible de créer la commande"
    });

  } finally {
    client.release();
  }
});

app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      error: "Identifiants manquants"
    });
  }

  if (username !== ADMIN_USER) {
    return res.status(401).json({
      error: "Identifiants incorrects"
    });
  }

  const valid = await bcrypt.compare(
    password,
    await bcrypt.hash(ADMIN_PASSWORD, 10)
  );

  if (!valid) {
    return res.status(401).json({
      error: "Identifiants incorrects"
    });
  }

  req.session.isAdmin = true;

  res.json({
    success: true
  });
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
    authenticated: !!req.session.isAdmin
  });
});

app.get("/api/admin/orders", auth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM orders ORDER BY created_at DESC"
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erreur serveur"
    });
  }
});

app.patch("/api/admin/orders/:id", auth, async (req, res) => {
  try {
    const { status } = req.body;

    const result = await pool.query(
      "UPDATE orders SET status = $1 WHERE id = $2 RETURNING *",
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Commande introuvable"
      });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erreur serveur"
    });
  }
});

app.post("/api/admin/products", auth, async (req, res) => {
  try {
    const {
      name,
      category,
      price,
      stock,
      description,
      image
    } = req.body;

    if (!name || !category) {
      return res.status(400).json({
        error: "Nom et catégorie obligatoires"
      });
    }

    const result = await pool.query(
      `INSERT INTO products
      (name, category, price, stock, description, image)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        name,
        category,
        Number(price) || 0,
        Number(stock) || 0,
        description || "",
        image || ""
      ]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Impossible d'ajouter le produit"
    });
  }
});

app.patch("/api/admin/products/:id", auth, async (req, res) => {
  try {
    const {
      name,
      category,
      price,
      stock,
      description,
      image
    } = req.body;

    const result = await pool.query(
      `UPDATE products
       SET name = $1,
           category = $2,
           price = $3,
           stock = $4,
           description = $5,
           image = $6
       WHERE id = $7
       RETURNING *`,
      [
        name,
        category,
        Number(price) || 0,
        Number(stock) || 0,
        description || "",
        image || "",
        req.params.id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Produit introuvable"
      });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Impossible de modifier le produit"
    });
  }
});

app.get("/healthz", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      status: "ok",
      database: "connected"
    });

  } catch (error) {
    res.status(500).json({
      status: "error",
      database: "disconnected"
    });
  }
});

app.use(express.static(path.join(__dirname, "../public")));

app.get("*", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../public/index.html")
  );
});

initDb()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`SNGAMER STORE lancé sur le port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Erreur initialisation base de données :", error);
    process.exit(1);
  });
