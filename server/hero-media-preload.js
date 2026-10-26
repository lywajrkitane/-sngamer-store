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

  const contentDbMarker = "/* SNGAMER HERO CONTENT DB V1 */";
  if (!text.includes(contentDbMarker)) {
    const anchor = '  console.log("Database initialized successfully");';
    const block = [
      "  /* SNGAMER HERO CONTENT DB V1 */",
      "  await db(\"CREATE TABLE IF NOT EXISTS hero_slide_content (slot INTEGER PRIMARY KEY CHECK (slot IN (1, 2, 3)), title TEXT NOT NULL, body TEXT NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())\");",
      "  await db(\"INSERT INTO hero_slide_content (slot, title, body) VALUES (1, 'BONJOUR ET BIENVENUE SUR SNGAMER STORE', 'Bienvenue dans la boutique. Merci de nous rendre visite aujourd’hui.'), (2, 'COMMANDE EN LIGNE', 'Choisis tes produits, ajoute-les au panier et passe ta commande facilement.'), (3, 'LIVRAISON AU SÉNÉGAL', 'Nous préparons ta commande avec soin et facilitons sa livraison.') ON CONFLICT (slot) DO NOTHING\");",
      ""
    ].join("\n") + "\n";
    if (!text.includes(anchor)) throw new Error("Hero content DB anchor not found");
    text = text.replace(anchor, block + anchor);
    changed = true;
  }

  const contentMigrationMarker = "/* SNGAMER HERO CONTENT COPY V2 */";
  if (!text.includes(contentMigrationMarker)) {
    const anchor = '  console.log("Database initialized successfully");';
    const block = [
      "  /* SNGAMER HERO CONTENT COPY V2 */",
      "  await db(\"UPDATE hero_slide_content SET title = 'MERCI DE NOUS RENDRE VISITE !', body = 'Nous sommes heureux de vous accueillir dans notre boutique et de vous faire découvrir notre univers gaming.', updated_at = NOW() WHERE slot = 1 AND title = 'BONJOUR ET BIENVENUE SUR SNGAMER STORE' AND body = 'Bienvenue dans la boutique. Merci de nous rendre visite aujourd’hui.'\");",
      ""
    ].join("\n") + "\n";
    if (!text.includes(anchor)) throw new Error("Hero content migration anchor not found");
    text = text.replace(anchor, block + anchor);
    changed = true;
  }

  const routeMarker = "/* SNGAMER HERO MEDIA ROUTES V1 */";
  if (!text.includes(routeMarker)) {
    const anchor = 'app.use(express.static(path.join(__dirname, "..", "public")));';
    const block = `/* SNGAMER HERO MEDIA ROUTES V1 */\n\napp.get("/api/hero-media", async (req, res) => {\n  try {\n    const result = await db(\n      "SELECT slot, media_type, url, updated_at FROM hero_media ORDER BY slot ASC"\n    );\n    res.json({ success: true, hero: result.rows });\n  } catch (error) {\n    console.error("HERO_MEDIA_GET_ERROR:", error);\n    res.status(500).json({ success: false, error: "Impossible de récupérer les images du héros." });\n  }\n});\n\napp.post("/api/admin/hero-media", requireAdmin, (req, res) => {\n  upload.single("media")(req, res, async (uploadError) => {\n    try {\n      if (uploadError) throw uploadError;\n      const slot = Number(req.body?.slot);\n      if (![1, 2, 3].includes(slot)) return res.status(400).json({ success: false, error: "Emplacement du héros invalide." });\n      if (!req.file) return res.status(400).json({ success: false, error: "Sélectionne une image." });\n      if (!String(req.file.mimetype || "").startsWith("image/")) return res.status(400).json({ success: false, error: "Le fichier doit être une image." });\n      const result = await uploadToCloudinary(req.file.buffer, "image", "sngamer/hero");\n      const url = result.secure_url || result.url;\n      if (!url) throw new Error("Cloudinary n'a pas retourné d'URL.");\n      await db(\`INSERT INTO hero_media (slot, media_type, url, updated_at) VALUES ($1, 'image', $2, NOW()) ON CONFLICT (slot) DO UPDATE SET media_type = EXCLUDED.media_type, url = EXCLUDED.url, updated_at = NOW()\`, [slot, url]);\n      res.json({ success: true, slot, url });\n    } catch (error) {\n      console.error("HERO_MEDIA_UPLOAD_ERROR:", error);\n      res.status(400).json({ success: false, error: error.message || "Impossible d'enregistrer l'image." });\n    }\n  });\n});\n\napp.delete("/api/admin/hero-media/:slot", requireAdmin, async (req, res) => {\n  try {\n    const slot = Number(req.params.slot);\n    if (![1, 2, 3].includes(slot)) return res.status(400).json({ success: false, error: "Emplacement du héros invalide." });\n    await db("DELETE FROM hero_media WHERE slot = $1", [slot]);\n    res.json({ success: true, slot });\n  } catch (error) {\n    console.error("HERO_MEDIA_DELETE_ERROR:", error);\n    res.status(500).json({ success: false, error: "Impossible de retirer l'image." });\n  }\n});\n\n`;
    if (!text.includes(anchor)) throw new Error("Hero media route anchor not found");
    text = text.replace(anchor, block + anchor);
    changed = true;
  }

  const contentRouteMarker = "/* SNGAMER HERO CONTENT ROUTES V1 */";
  if (!text.includes(contentRouteMarker)) {
    const anchor = 'app.use(express.static(path.join(__dirname, "..", "public")));';
    const block = [
      "/* SNGAMER HERO CONTENT ROUTES V1 */",
      "",
      "app.get('/api/hero-content', async (req, res) => {",
      "  try {",
      "    const result = await db('SELECT slot, title, body, updated_at FROM hero_slide_content ORDER BY slot ASC');",
      "    res.json({ success: true, slides: result.rows });",
      "  } catch (error) {",
      "    console.error('HERO_CONTENT_GET_ERROR:', error);",
      "    res.status(500).json({ success: false, error: 'Impossible de récupérer les textes du héros.' });",
      "  }",
      "});",
      "",
      "app.post('/api/admin/hero-content', requireAdmin, async (req, res) => {",
      "  try {",
      "    const slot = Number(req.body && req.body.slot);",
      "    const title = String((req.body && req.body.title) || '').trim();",
      "    const body = String((req.body && req.body.body) || '').trim();",
      "    if (![1, 2, 3].includes(slot)) return res.status(400).json({ success: false, error: 'Emplacement du héros invalide.' });",
      "    if (!title || title.length > 90 || !body || body.length > 260) return res.status(400).json({ success: false, error: 'Vérifie le titre (1 à 90 caractères) et le texte (1 à 260 caractères).' });",
      "    const result = await db('INSERT INTO hero_slide_content (slot, title, body, updated_at) VALUES ($1, $2, $3, NOW()) ON CONFLICT (slot) DO UPDATE SET title = EXCLUDED.title, body = EXCLUDED.body, updated_at = NOW() RETURNING slot, title, body, updated_at', [slot, title, body]);",
      "    res.json({ success: true, slide: result.rows[0] });",
      "  } catch (error) {",
      "    console.error('HERO_CONTENT_SAVE_ERROR:', error);",
      "    res.status(500).json({ success: false, error: 'Impossible d’enregistrer les textes du héros.' });",
      "  }",
      "});",
      ""
    ].join("\n") + "\n";
    if (!text.includes(anchor)) throw new Error("Hero content route anchor not found");
    text = text.replace(anchor, block + anchor);
    changed = true;
  }

  if (changed) fs.writeFileSync(SERVER_FILE, text, "utf8");
}

function patchAdminFile(fileName) {
  const file = path.join(PUBLIC_DIR, fileName);
  if (!fs.existsSync(file)) return;

  const original = fs.readFileSync(file, "utf8");
  const editorTag = '<script src="/hero-dashboard-editor.js?v=20261026-hero-dedicated1" defer></script>';
  let html = original;

  // Keep only the dedicated Hero workspace editor. The two older scripts
  // mounted another Hero panel below Overview and duplicated the same controls.
  html = html
    .replace(/<script\b[^>]*src=["'][^"']*\/hero-media-admin\.js(?:\?[^"']*)?["'][^>]*>\s*<\/script>/gi, "")
    .replace(/<script\b[^>]*src=["'][^"']*\/hero-dashboard-fix\.js(?:\?[^"']*)?["'][^>]*>\s*<\/script>/gi, "")
    .replace(/<script\b[^>]*src=["'][^"']*\/hero-dashboard-editor\.js(?:\?[^"']*)?["'][^>]*>\s*<\/script>/gi, "");

  if (/<\/body>/i.test(html)) html = html.replace(/<\/body>/i, editorTag + "\n</body>");
  else html += "\n" + editorTag + "\n";

  if (html !== original) fs.writeFileSync(file, html, "utf8");
}

try {
  patchServer();
  patchAdminFile("admin-dashboard.html");
  patchAdminFile("admin.html");
} catch (error) {
  console.error("HERO_MEDIA_PRELOAD_ERROR:", error);
}
