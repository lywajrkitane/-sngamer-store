const fs = require('fs');
const path = require('path');

(function installProductMediaDelete() {
  try {
    const serverFile = path.join(__dirname, 'server.js');
    if (fs.existsSync(serverFile)) {
      let text = fs.readFileSync(serverFile, 'utf8');
      const marker = '/* SNGAMER PRODUCT MEDIA DELETE ROUTE V1 */';

      if (!text.includes(marker)) {
        const anchor = 'app.post(\n  "/api/admin/products/:id/media",';
        if (!text.includes(anchor)) {
          console.error('[product-media-delete] media upload route not found; route not installed');
        } else {
          const route = `
${marker}
app.delete(
  "/api/admin/products/:id/media/:slot",
  requireAdmin,
  async (req, res) => {
    try {
      const productId = Number(req.params.id);
      const slot = String(req.params.slot || '').toLowerCase();
      const allowed = ['image1', 'image2', 'image3', 'video'];

      if (!Number.isInteger(productId) || productId <= 0) {
        return res.status(400).json({ error: "ID produit invalide" });
      }

      if (!allowed.includes(slot)) {
        return res.status(400).json({ error: "Média invalide" });
      }

      const product = await db(
        "SELECT id, image1_url, image2_url, image3_url, video_url FROM products WHERE id = $1",
        [productId]
      );

      if (!product.rows.length) {
        return res.status(404).json({ error: "Produit introuvable" });
      }

      const column = slot + '_url';
      const currentUrl = product.rows[0][column];
      if (!currentUrl) {
        return res.json({ success: true, alreadyEmpty: true, product: product.rows[0] });
      }

      let query;
      if (slot === 'image1') {
        query = `
          UPDATE products
          SET image1_url = NULL,
              main_image_url = COALESCE(image2_url, image3_url)
          WHERE id = $1
          RETURNING *
        `;
      } else {
        query = `
          UPDATE products
          SET ${column} = NULL
          WHERE id = $1
          RETURNING *
        `;
      }

      const result = await db(query, [productId]);
      return res.json({ success: true, product: result.rows[0] });
    } catch (error) {
      console.error("DELETE_PRODUCT_MEDIA_ERROR:", error);
      return res.status(500).json({ error: "Impossible de supprimer le média du produit" });
    }
  }
);

`;

          text = text.replace(anchor, route + anchor);
          fs.writeFileSync(serverFile, text, 'utf8');
          console.log('[product-media-delete] delete-media route installed');
        }
      }
    }

    const htmlFile = path.join(__dirname, '..', 'public', 'admin-dashboard.html');
    if (fs.existsSync(htmlFile)) {
      let html = fs.readFileSync(htmlFile, 'utf8');
      const htmlMarker = 'admin-product-media-delete.js?v=20261021';
      if (!html.includes(htmlMarker)) {
        const script = '<script src="/admin-product-media-delete.js?v=20261021"></script>';
        if (html.includes('</body>')) {
          html = html.replace('</body>', script + '\n</body>');
          fs.writeFileSync(htmlFile, html, 'utf8');
          console.log('[product-media-delete] dashboard script installed');
        }
      }
    }
  } catch (error) {
    console.error('[product-media-delete] preload failed:', error);
  }
})();
