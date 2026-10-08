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
  ADD COLUMN IF NOT EXISTS description TEXT,
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
    ADD COLUMN IF NOT EXISTS image1_url TEXT,
    ADD COLUMN IF NOT EXISTS image2_url TEXT,
    ADD COLUMN IF NOT EXISTS image3_url TEXT,
    ADD COLUMN IF NOT EXISTS video_url TEXT;
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
    CREATE TABLE IF NOT EXISTS promo_media (
      slot INTEGER PRIMARY KEY CHECK (slot IN (1, 2, 3)),
      media_type TEXT NOT NULL,
      url TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
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
  description,
  image1_url,
  image2_url,
  image3_url,
  video_url,
  promo_price,
  promo_active,
  campaign_id,
  created_at
FROM products
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
  const diagnosticStart = Date.now();

  console.log("LOGIN_DIAGNOSTIC: route atteinte");

  try {
    const { username, password } = req.body || {};

    console.log(
      "LOGIN_DIAGNOSTIC: username reçu =",
      username || "(vide)"
    );

    const adminUser = process.env.ADMIN_USER;
    const adminPassword = process.env.ADMIN_PASSWORD;

    console.log(
      "LOGIN_DIAGNOSTIC: ADMIN_USER présent =",
      Boolean(adminUser)
    );

    console.log(
      "LOGIN_DIAGNOSTIC: ADMIN_PASSWORD présent =",
      Boolean(adminPassword)
    );

    if (!adminUser || !adminPassword) {
      console.log(
        "LOGIN_DIAGNOSTIC: configuration administrateur manquante"
      );

      return res.status(500).json({
        error: "Configuration administrateur manquante"
      });
    }

    if (username !== adminUser) {
      console.log("LOGIN_DIAGNOSTIC: mauvais nom utilisateur");

      return res.status(401).json({
        error: "Identifiants incorrects"
      });
    }

    console.log(
      "LOGIN_DIAGNOSTIC: nom utilisateur correct"
    );

    let passwordValid = false;

    if (
      adminPassword.startsWith("$2a$") ||
      adminPassword.startsWith("$2b$") ||
      adminPassword.startsWith("$2y$")
    ) {
      console.log(
        "LOGIN_DIAGNOSTIC: vérification bcrypt démarrée"
      );

      const bcryptTimeout = new Promise((resolve) => {
        setTimeout(() => {
          resolve("TIMEOUT");
        }, 8000);
      });

      const bcryptCheck = bcrypt.compare(
        password || "",
        adminPassword
      );

      const bcryptResult = await Promise.race([
        bcryptCheck,
        bcryptTimeout
      ]);

      if (bcryptResult === "TIMEOUT") {
        console.log(
          "LOGIN_DIAGNOSTIC: bcrypt dépasse 8 secondes"
        );

        return res.status(500).json({
          error: "La vérification du mot de passe prend trop de temps."
        });
      }

      passwordValid = Boolean(bcryptResult);

      console.log(
        "LOGIN_DIAGNOSTIC: bcrypt terminé =",
        passwordValid
      );

    } else {
      console.log(
        "LOGIN_DIAGNOSTIC: comparaison directe du mot de passe"
      );

      passwordValid =
        password === adminPassword;

      console.log(
        "LOGIN_DIAGNOSTIC: comparaison terminée =",
        passwordValid
      );
    }

    if (!passwordValid) {
      console.log(
        "LOGIN_DIAGNOSTIC: mot de passe incorrect"
      );

      return res.status(401).json({
        error: "Identifiants incorrects"
      });
    }

    console.log(
      "LOGIN_DIAGNOSTIC: mot de passe correct"
    );

    console.log(
      "LOGIN_DIAGNOSTIC: création de session"
    );

    req.session.admin = true;

    console.log(
      "LOGIN_DIAGNOSTIC: session créée"
    );

    res.json({
      success: true
    });

    console.log(
      "LOGIN_DIAGNOSTIC: réponse envoyée en",
      Date.now() - diagnosticStart,
      "ms"
    );

  } catch (error) {

    console.error(
      "LOGIN_DIAGNOSTIC_ERROR:",
      error
    );

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
  "En préparation",
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

app.post("/api/admin/products", requireAdmin, async (req, res) => {
  const {
    name,
    category,
    price,
    stock,
    emoji,
    description
  } = req.body;

  const p = {
    name: String(name || "").trim(),
    category: String(category || "Accessoires").trim(),
    price: Number(price),
    stock: Number(stock),
    emoji: emoji || "🎮",
    description: String(description || "").trim()
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
      `
      INSERT INTO products
      (name, category, price, stock, emoji, description)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, category, price, stock, emoji, description
      `,
      [
        p.name,
        p.category,
        p.price,
        p.stock,
        p.emoji,
        p.description
      ]
    );

    res.json({
      success: true,
      product: r.rows[0]
    });

  } catch (error) {
    console.error("CREATE_PRODUCT_ERROR:", error);

    res.status(500).json({
      error: "Impossible d'ajouter le produit"
    });
  }
});
/* =========================================
   CAMPAGNES — ADMIN API
========================================= */

// Récupérer toutes les campagnes
app.get("/api/admin/campaigns", requireAdmin, async (req, res) => {
  try {
    const result = await db(`
      SELECT
        c.id,
        c.name,
        c.sticker,
        c.description,
        c.active,
        c.start_date,
        c.end_date,
        c.created_at,
        COUNT(p.id)::int AS products_count
      FROM campaigns c
      LEFT JOIN products p
        ON p.campaign_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);

    res.json(result.rows);

  } catch (error) {

    console.error("GET_CAMPAIGNS_ERROR:", error);

    res.status(500).json({
      error: "Impossible de charger les campagnes"
    });

  }
});


// Créer une campagne
app.post("/api/admin/campaigns", requireAdmin, async (req, res) => {

  const {
    name,
    sticker = "",
    description = "",
    active = false,
    start_date = null,
    end_date = null
  } = req.body;

  if (!name || !name.trim()) {

    return res.status(400).json({
      error: "Le nom de la campagne est obligatoire"
    });

  }

  try {

    const result = await db(
      `
      INSERT INTO campaigns
        (name, sticker, description, active, start_date, end_date)
      VALUES
        ($1, $2, $3, $4, $5, $6)
      RETURNING
        id,
        name,
        sticker,
        description,
        active,
        start_date,
        end_date,
        created_at
      `,
      [
        name.trim(),
        sticker,
        description,
        Boolean(active),
        start_date || null,
        end_date || null
      ]
    );

    res.status(201).json({
      success: true,
      campaign: result.rows[0]
    });

  } catch (error) {

    console.error("CREATE_CAMPAIGN_ERROR:", error);

    res.status(500).json({
      error: "Impossible de créer la campagne"
    });

  }

});


// Modifier une campagne
app.patch("/api/admin/campaigns/:id", requireAdmin, async (req, res) => {

  const { id } = req.params;

  const {
    name,
    sticker,
    description,
    active,
    start_date,
    end_date
  } = req.body;

  try {

    const result = await db(
      `
      UPDATE campaigns
      SET
        name = COALESCE($1, name),
        sticker = COALESCE($2, sticker),
        description = COALESCE($3, description),
        active = COALESCE($4, active),
        start_date = $5,
        end_date = $6
      WHERE id = $7
      RETURNING
        id,
        name,
        sticker,
        description,
        active,
        start_date,
        end_date,
        created_at
      `,
      [
        name !== undefined ? name.trim() : null,
        sticker !== undefined ? sticker : null,
        description !== undefined ? description : null,
        active !== undefined ? Boolean(active) : null,
        start_date || null,
        end_date || null,
        id
      ]
    );

    if (!result.rows.length) {

      return res.status(404).json({
        error: "Campagne introuvable"
      });

    }

    res.json({
      success: true,
      campaign: result.rows[0]
    });

  } catch (error) {

    console.error("UPDATE_CAMPAIGN_ERROR:", error);

    res.status(500).json({
      error: "Impossible de modifier la campagne"
    });

  }

});


// Supprimer une campagne
app.delete("/api/admin/campaigns/:id", requireAdmin, async (req, res) => {

  const { id } = req.params;

  try {

    const result = await db(
      `
      DELETE FROM campaigns
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );

    if (!result.rows.length) {

      return res.status(404).json({
        error: "Campagne introuvable"
      });

    }

    res.json({
      success: true
    });

  } catch (error) {

    console.error("DELETE_CAMPAIGN_ERROR:", error);

    res.status(500).json({
      error: "Impossible de supprimer la campagne"
    });

  }

});
app.patch(
  "/api/admin/products/:id",
  requireAdmin,
  async (req, res) => {

    try {

      const productId = Number(req.params.id);

      if (!Number.isInteger(productId)) {

        return res.status(400).json({
          error: "ID produit invalide"
        });

      }

      const {
        name,
        category,
        price,
        stock,
        emoji,
        description,
        promo_price,
        promo_active,
        campaign_id
      } = req.body;


      /*
       * =========================================
       * VALIDATION DES PROMOTIONS
       * =========================================
       */

      const promoPriceProvided =
        promo_price !== undefined;

      const promoActiveProvided =
        promo_active !== undefined;

      const campaignIdProvided =
        campaign_id !== undefined;


      let promoPriceValue = null;

      if (promoPriceProvided) {

        if (
          promo_price !== null &&
          promo_price !== ""
        ) {

          promoPriceValue = Number(promo_price);

          if (
            !Number.isFinite(promoPriceValue) ||
            promoPriceValue < 0
          ) {

            return res.status(400).json({
              error: "Prix promotionnel invalide"
            });

          }

        }

      }


      let campaignIdValue = null;

      if (campaignIdProvided) {

        if (
          campaign_id !== null &&
          campaign_id !== ""
        ) {

          campaignIdValue = Number(campaign_id);

          if (
            !Number.isInteger(campaignIdValue) ||
            campaignIdValue <= 0
          ) {

            return res.status(400).json({
              error: "Campagne invalide"
            });

          }

        }

      }


      /*
       * =========================================
       * VÉRIFICATION DE LA CAMPAGNE
       * =========================================
       */

      if (
        campaignIdProvided &&
        campaignIdValue !== null
      ) {

        const campaign = await db(
          `
          SELECT id
          FROM campaigns
          WHERE id = $1
          `,
          [campaignIdValue]
        );

        if (!campaign.rows.length) {

          return res.status(404).json({
            error: "Campagne introuvable"
          });

        }

      }


      /*
       * =========================================
       * MISE À JOUR DU PRODUIT
       * =========================================
       */

      const result = await db(
        `
        UPDATE products
        SET

          name = COALESCE($1, name),

          category = COALESCE($2, category),

          price = COALESCE($3, price),

          stock = COALESCE($4, stock),

          emoji = COALESCE($5, emoji),

          description = COALESCE($6, description),

          promo_price =
            CASE
              WHEN $7 = true
              THEN $8
              ELSE promo_price
            END,

          promo_active =
            CASE
              WHEN $9 = true
              THEN $10
              ELSE promo_active
            END,

          campaign_id =
            CASE
              WHEN $11 = true
              THEN $12
              ELSE campaign_id
            END

        WHERE id = $13

        RETURNING *
        `,
        [

          name ?? null,

          category ?? null,

          price !== undefined
            ? Number(price)
            : null,

          stock !== undefined
            ? Number(stock)
            : null,

          emoji ?? null,

          description ?? null,

          promoPriceProvided,

          promoPriceValue,

          promoActiveProvided,

          promo_active !== undefined
            ? Boolean(promo_active)
            : null,

          campaignIdProvided,

          campaignIdValue,

          productId

        ]
      );


      /*
       * =========================================
       * PRODUIT INTROUVABLE
       * =========================================
       */

      if (result.rows.length === 0) {

        return res.status(404).json({
          error: "Produit introuvable"
        });

      }


      /*
       * =========================================
       * RÉPONSE
       * =========================================
       */

      res.json(result.rows[0]);


    } catch (error) {

      console.error(
        "UPDATE_PRODUCT_ERROR:",
        error
      );

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
app.post(
  "/api/admin/products/:id/media",
  requireAdmin,
  (req, res) => {
    upload.fields([
      { name: "image1", maxCount: 1 },
      { name: "image2", maxCount: 1 },
      { name: "image3", maxCount: 1 },
      { name: "video", maxCount: 1 }
    ])(req, res, async (uploadError) => {
      if (uploadError) {
        console.error("MEDIA_UPLOAD_ERROR:", uploadError);
        return res.status(400).json({
          error: uploadError.message || "Erreur lors de l'envoi des fichiers"
        });
      }

      try {
        const productId = Number(req.params.id);

        if (!Number.isInteger(productId) || productId <= 0) {
          return res.status(400).json({
            error: "ID produit invalide"
          });
        }

        const productResult = await db(
          "SELECT id FROM products WHERE id = $1",
          [productId]
        );

        if (productResult.rows.length === 0) {
          return res.status(404).json({
            error: "Produit introuvable"
          });
        }

        const files = req.files || {};

        const image1 = files.image1?.[0];
        const image2 = files.image2?.[0];
        const image3 = files.image3?.[0];
        const video = files.video?.[0];

        if (!image1 && !image2 && !image3 && !video) {
          return res.status(400).json({
            error: "Aucun fichier envoyé"
          });
        }

        const uploaded = {};

        if (image1) {
          const result = await uploadToCloudinary(
            image1.buffer,
            "image",
            `sngamer-store/products/${productId}`
          );
          uploaded.image1_url = result.secure_url;
        }

        if (image2) {
          const result = await uploadToCloudinary(
            image2.buffer,
            "image",
            `sngamer-store/products/${productId}`
          );
          uploaded.image2_url = result.secure_url;
        }

        if (image3) {
          const result = await uploadToCloudinary(
            image3.buffer,
            "image",
            `sngamer-store/products/${productId}`
          );
          uploaded.image3_url = result.secure_url;
        }

        if (video) {
          const result = await uploadToCloudinary(
            video.buffer,
            "video",
            `sngamer-store/products/${productId}`
          );
          uploaded.video_url = result.secure_url;
        }

        const fields = [];
        const values = [];
        let index = 1;

        for (const [column, value] of Object.entries(uploaded)) {
          fields.push(`${column} = $${index}`);
          values.push(value);
          index++;
        }

        values.push(productId);

        const result = await db(
          `
          UPDATE products
          SET ${fields.join(", ")}
          WHERE id = $${index}
          RETURNING *
          `,
          values
        );

        return res.json({
          success: true,
          product: result.rows[0]
        });
      } catch (error) {
        console.error("PRODUCT_MEDIA_ERROR:", error);

        return res.status(500).json({
          error: "Impossible d'enregistrer les médias du produit"
        });
      }
    });
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
