const DEFAULT_RESERVATION_MINUTES = 20;

/**
 * Stock reservation helper.
 *
 * This module deliberately contains only the reservation primitives so the
 * existing PayTech implementation can keep its payment/refund logic intact.
 * The caller must use the same pg client and transaction for reservation.
 */
function reservationMinutes() {
  const value = Number(process.env.STOCK_RESERVATION_MINUTES || DEFAULT_RESERVATION_MINUTES);
  return Number.isFinite(value) && value >= 1 && value <= 120 ? Math.floor(value) : DEFAULT_RESERVATION_MINUTES;
}

async function reserveStock(client, items) {
  if (!Array.isArray(items) || !items.length) throw new Error("Aucun article à réserver");

  const reserved = [];
  for (const item of items) {
    const productId = Number(item.id);
    const quantity = Number(item.quantity);
    if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity <= 0) {
      throw new Error("Produit ou quantité invalide");
    }

    const result = await client.query(
      `UPDATE products
          SET stock = stock - $1
        WHERE id = $2
          AND stock >= $1
      RETURNING id`,
      [quantity, productId]
    );

    if (result.rowCount !== 1) {
      throw new Error(`Stock insuffisant pour ${item.name || `le produit #${productId}`}`);
    }
    reserved.push({ id: productId, quantity });
  }
  return reserved;
}

async function restoreStock(client, items) {
  if (!Array.isArray(items)) return;
  for (const item of items) {
    const productId = Number(item.id);
    const quantity = Number(item.quantity);
    if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity <= 0) continue;
    await client.query(`UPDATE products SET stock = stock + $1 WHERE id = $2`, [quantity, productId]);
  }
}

function reservationUntilSql() {
  return `NOW() + INTERVAL '${reservationMinutes()} minutes'`;
}

module.exports = { reserveStock, restoreStock, reservationMinutes, reservationUntilSql };
