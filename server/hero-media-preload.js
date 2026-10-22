const fs = require("fs");
const path = require("path");

const SERVER_FILE = path.join(__dirname, "server.js");
const PUBLIC_DIR = path.join(__dirname, "..", "public");

function patchServer() {
  let text = fs.readFileSync(SERVER_FILE, "utf8");
  let changed = false;

  const dbMarker = "/* SNGAMER HERO MEDIA DB V1 */";
  if (!text.includes(dbMarker)) {
    const anchor = '  console.log("Database initialized successfully");';
    const block = `  ${dbMarker}\n  await db(\`\n    CREATE TABLE IF NOT EXISTS hero_media (\n      slot INTEGER PRIMARY KEY CHECK (slot IN (1, 2, 3)),\n      media_type TEXT NOT NULL DEFAULT 'image',\n      url TEXT NOT NULL,\n      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()\n    );\n  \`);\n\n`;
    if (!text.includes(anchor)) throw new Error("Hero media DB anchor not found");
    text = text.replace(anchor, block + anchor);
    changed = true;
  }

  const routeMarker = "/* SNGAMER HERO MEDIA ROUTES V1 */";
  if (!text.includes(routeMarker)) {
    const anchor = 'app.use(express.static(path.join(__dirname, "..", "public")));';
    const block = `/* SNGAMER HERO MEDIA ROUTES V1 */\n\napp.get("/api/hero-media", async (req, res) => {\n  try {\n    const result = await db(\n      "SELECT slot, media_type, url, updated_at FROM hero_media ORDER BY slot ASC"\n    );\n    res.json({ success: true, hero: result.rows });\n  } catch (error) {\n    console.error("HERO_MEDIA_GET_ERROR:", error);\n    res.status(500).json({ success: false, error: "Impossible de récupérer les images du héros." });\n  }\n});\n\napp.post("/api/admin/hero-media", requireAdmin, (req, res) => {\n  upload.single("media")(req, res, async (uploadError) => {\n    try {\n      if (uploadError) throw uploadError;\n      const slot = Number(req.body?.slot);\n      if (![1, 2, 3].includes(slot)) {\n        return res.status(400).json({ success: false, error: "Emplacement du héros invalide." });\n      }\n      if (!req.file) {\n        return res.status(400).json({ success: false, error: "Sélectionne une image." });\n      }\n      if (!String(req.file.mimetype || "").startsWith("image/")) {\n        return res.status(400).json({ success: false, error: "Le fichier doit être une image." });\n      }\n\n      const result = await uploadToCloudinary(req.file.buffer, "image", "sngamer/hero");\n      const url = result.secure_url || result.url;\n      if (!url) throw new Error("Cloudinary n'a pas retourné d'URL.");\n\n      await db(\`INSERT INTO hero_media (slot, media_type, url, updated_at)\n         VALUES ($1, 'image', $2, NOW())\n         ON CONFLICT (slot) DO UPDATE SET\n           media_type = EXCLUDED.media_type,\n           url = EXCLUDED.url,\n           updated_at = NOW()\`,\n        [slot, url]\n      );\n\n      res.json({ success: true, slot, url });\n    } catch (error) {\n      console.error("HERO_MEDIA_UPLOAD_ERROR:", error);\n      res.status(400).json({ success: false, error: error.message || "Impossible d'enregistrer l'image." });\n    }\n  });\n});\n\napp.delete("/api/admin/hero-media/:slot", requireAdmin, async (req, res) => {\n  try {\n    const slot = Number(req.params.slot);\n    if (![1, 2, 3].includes(slot)) {\n      return res.status(400).json({ success: false, error: "Emplacement du héros invalide." });\n    }\n    await db("DELETE FROM hero_media WHERE slot = $1", [slot]);\n    res.json({ success: true, slot });\n  } catch (error) {\n    console.error("HERO_MEDIA_DELETE_ERROR:", error);\n    res.status(500).json({ success: false, error: "Impossible de retirer l'image." });\n  }\n});\n\n`;
    if (!text.includes(anchor)) throw new Error("Hero media route anchor not found");
    text = text.replace(anchor, block + anchor);
    changed = true;
  }

  if (changed) fs.writeFileSync(SERVER_FILE, text, "utf8");
}

function patchAdminFile(fileName) {
  const file = path.join(PUBLIC_DIR, fileName);
  if (!fs.existsSync(file)) return;
  let html = fs.readFileSync(file, "utf8");
  const marker = "/hero-media-admin.js";
  if (html.includes(marker)) return;
  const scriptTag = '<script src="/hero-media-admin.js?v=20261022-hero-admin2" defer></script>';
  if (/<\/body>/i.test(html)) {
    html = html.replace(/<\/body>/i, scriptTag + "</body>");
    fs.writeFileSync(file, html, "utf8");
  } else {
    console.error("HERO_MEDIA_PRELOAD_ERROR: </body> not found in " + fileName);
  }
}

try {
  patchServer();
  patchAdminFile("admin-dashboard.html");
  patchAdminFile("admin.html");
} catch (error) {
  console.error("HERO_MEDIA_PRELOAD_ERROR:", error);
}
