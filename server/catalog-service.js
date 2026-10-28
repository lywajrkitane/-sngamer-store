// Central catalogue service.
// This module is the single data-access authority for the public product catalogue.
// It intentionally preserves the current /api/products response shape.

async function fetchCatalog(pool) {
  const result = await pool.query(`
    SELECT p.id, p.name, p.description, p.price, p.original_price,
           p.image_url, p.category, p.stock, p.is_active,
           p.created_at, p.updated_at,
           c.id AS campaign_id,
           c.name AS campaign_name,
           c.discount_type,
           c.discount_value,
           c.start_at AS campaign_start_at,
           c.end_at AS campaign_end_at
    FROM products p
    LEFT JOIN campaigns c
      ON c.product_id = p.id
     AND c.is_active = true
     AND (c.start_at IS NULL OR c.start_at <= NOW())
     AND (c.end_at IS NULL OR c.end_at >= NOW())
    ORDER BY p.created_at DESC, p.id DESC
  `);

  return result.rows;
}

module.exports = { fetchCatalog };
