// Central catalogue service.
// Single data-access authority for the public product catalogue.
// The selected fields intentionally mirror the current /api/products response.

async function fetchCatalog(db) {
  const result = await db(`
    SELECT
      p.id,
      p.name,
      p.category,
      p.platform,
      p.product_condition,
      p.warranty,
      p.warranty_configured,
      p.price,
      p.stock,
      p.emoji,
      p.description,
      p.characteristics,
      p.colors,
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

  return result.rows;
}

module.exports = { fetchCatalog };
