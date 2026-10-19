const express = require("express");
const multer = require("multer");
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const profilePool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!/^image\/(jpeg|png|webp|gif)$/i.test(file.mimetype || "")) {
      return cb(new Error("Format d'image non pris en charge."));
    }
    cb(null, true);
  }
});

async function ensureProfilePhotoColumn() {
  await profilePool.query(`
    ALTER TABLE customers
      ADD COLUMN IF NOT EXISTS profile_photo BYTEA,
      ADD COLUMN IF NOT EXISTS profile_photo_mime TEXT;
  `);
}

function installProfileRoutes() {
  const router = express.Router();
  router.get("/api/customer/profile-photo", async (req, res) => {
    try {
      if (!req.session?.customerId) return res.status(401).end();
      const result = await profilePool.query(
        `SELECT profile_photo, profile_photo_mime FROM customers WHERE id=$1 LIMIT 1`,
        [req.session.customerId]
      );
      if (!result.rows.length || !result.rows[0].profile_photo) return res.status(404).end();
      res.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
      res.type(result.rows[0].profile_photo_mime || "image/jpeg");
      res.send(result.rows[0].profile_photo);
    } catch (error) {
      console.error("CUSTOMER_PROFILE_PHOTO_GET_ERROR:", error);
      res.status(500).end();
    }
  });

  router.post("/api/customer/profile-photo", (req, res, next) => {
    if (!req.session?.customerId) return res.status(401).json({ error: "Connexion client requise" });
    upload.single("photo")(req, res, async error => {
      if (error) {
        return res.status(400).json({ error: error.message || "Photo invalide." });
      }
      try {
        if (!req.file?.buffer?.length) return res.status(400).json({ error: "Aucune photo reçue." });
        await profilePool.query(
          `UPDATE customers SET profile_photo=$1, profile_photo_mime=$2, updated_at=NOW() WHERE id=$3`,
          [req.file.buffer, req.file.mimetype, req.session.customerId]
        );
        res.json({ success: true });
      } catch (dbError) {
        console.error("CUSTOMER_PROFILE_PHOTO_SAVE_ERROR:", dbError);
        res.status(500).json({ error: "Impossible d'enregistrer la photo de profil." });
      }
    });
  });

  router.delete("/api/customer/profile-photo", async (req, res) => {
    try {
      if (!req.session?.customerId) return res.status(401).json({ error: "Connexion client requise" });
      await profilePool.query(
        `UPDATE customers SET profile_photo=NULL, profile_photo_mime=NULL, updated_at=NOW() WHERE id=$1`,
        [req.session.customerId]
      );
      res.json({ success: true });
    } catch (error) {
      console.error("CUSTOMER_PROFILE_PHOTO_DELETE_ERROR:", error);
      res.status(500).json({ error: "Impossible de supprimer la photo de profil." });
    }
  });
  return router;
}

function injectProfileScript(app) {
  const router = express.Router();
  router.get(["/", "/index.html"], (req, res, next) => {
    const indexPath = path.join(__dirname, "..", "public", "index.html");
    if (!fs.existsSync(indexPath)) return next();
    try {
      let html = fs.readFileSync(indexPath, "utf8");
      const tag = '<script src="/customer-profile-premium-v1.js?v=20261019-0905" defer></script>';
      if (!html.includes("customer-profile-premium-v1.js")) html = html.replace(/<\\/body>/i, `${tag}</body>`);
      res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");
      return res.type("html").send(html);
    } catch (error) {
      console.error("CUSTOMER_PROFILE_HTML_INJECTION_ERROR:", error);
      return next();
    }
  });
  const stack = app._router && app._router.stack;
  if (!stack) return;
  const staticIndex = stack.findIndex(layer => layer && layer.handle && layer.handle.name === "serveStatic");
  if (staticIndex >= 0) stack.splice(staticIndex, 0, ...(router.stack || []));
}

const originalListen = express.application.listen;
express.application.listen = function customerProfileListenPatched(...args) {
  const app = this;
  const start = async () => {
    try {
      await ensureProfilePhotoColumn();
      const stack = app._router && app._router.stack;
      if (stack) {
        const profileRouter = installProfileRoutes();
        const catchAllIndex = stack.findIndex(layer => {
          if (!layer || !layer.route || !layer.route.methods || !layer.route.methods.get) return false;
          const routePath = layer.route.path;
          return routePath === "*" || (Array.isArray(routePath) && routePath.includes("*"));
        });
        if (catchAllIndex >= 0) stack.splice(catchAllIndex, 0, ...(profileRouter.stack || []));
        else stack.push(...(profileRouter.stack || []));
        injectProfileScript(app);
      }
      return originalListen.apply(app, args);
    } catch (error) {
      console.error("CUSTOMER_PROFILE_PRELOAD_BOOT_ERROR:", error);
      process.exit(1);
    }
  };
  return start();
};
