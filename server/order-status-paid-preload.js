const { Pool } = require("pg");

// Keeps the customer-facing order lifecycle aligned with successful PayTech payments.
// Payment confirmation is automatic; operational stages remain manual.
const databaseUrl = String(process.env.DATABASE_URL || "").trim();
if (!databaseUrl) {
  console.warn("PAID_ORDER_STATUS_SYNC: DATABASE_URL missing");
} else {
  const pool = new Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  let installed = false;
  let busy = false;

  async function installAndSync() {
    if (busy) return;
    busy = true;
    try {
      // Trigger fires at the exact moment payment_status becomes Payé.
      await pool.query(`
        CREATE OR REPLACE FUNCTION sngamer_confirm_paid_order()
        RETURNS trigger
        LANGUAGE plpgsql
        AS $$
        BEGIN
          IF NEW.payment_status = 'Payé'
             AND (OLD.payment_status IS DISTINCT FROM 'Payé')
             AND NEW.status IN ('Nouvelle', 'Payée') THEN
            NEW.status := 'Confirmée';
          END IF;
          RETURN NEW;
        END;
        $$;
      `);

      await pool.query(`
        DROP TRIGGER IF EXISTS trg_sngamer_confirm_paid_order ON orders;
        CREATE TRIGGER trg_sngamer_confirm_paid_order
        BEFORE UPDATE OF payment_status ON orders
        FOR EACH ROW
        EXECUTE FUNCTION sngamer_confirm_paid_order();
      `);

      // Repair existing paid orders without touching orders already in
      // En préparation / Expédiée / Livrée / Annulée.
      const repaired = await pool.query(`
        UPDATE orders
        SET status = 'Confirmée'
        WHERE payment_status = 'Payé'
          AND status IN ('Nouvelle', 'Payée')
      `);

      if (!installed) {
        installed = true;
        console.log(`PAID_ORDER_STATUS_SYNC: installed; repaired ${repaired.rowCount} order(s)`);
      }
    } catch (error) {
      // The orders table may not exist yet during the very first bootstrap.
      if (installed) console.error("PAID_ORDER_STATUS_SYNC_ERROR:", error);
    } finally {
      busy = false;
    }
  }

  // Bootstrap may create the orders table after preloads are evaluated.
  installAndSync();
  const retry = setInterval(installAndSync, 2000);
  retry.unref?.();

  process.once("SIGTERM", async () => {
    clearInterval(retry);
    await pool.end().catch(() => {});
  });
  process.once("SIGINT", async () => {
    clearInterval(retry);
    await pool.end().catch(() => {});
  });
}
