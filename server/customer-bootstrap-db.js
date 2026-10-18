const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function initCustomersTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      address TEXT,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_login_at TIMESTAMPTZ
    );
  `);
}

async function ensureOrderCustomerColumns() {
  await pool.query(`
    ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS customer_message TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS tracking_code TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);`);

  // Link historical orders to an existing customer using the contact information
  // saved on the order. This is safe because it only fills an empty customer_id.
  await pool.query(`
    UPDATE orders o
       SET customer_id = c.id
      FROM customers c
     WHERE o.customer_id IS NULL
       AND (
         (
           NULLIF(lower(trim(COALESCE(o.customer->>'email', ''))), '') IS NOT NULL
           AND lower(trim(COALESCE(c.email, ''))) = lower(trim(COALESCE(o.customer->>'email', '')))
         )
         OR
         (
           NULLIF(regexp_replace(COALESCE(o.customer->>'phone', ''), '\\D', '', 'g'), '') IS NOT NULL
           AND regexp_replace(COALESCE(c.phone, ''), '\\D', '', 'g') = regexp_replace(COALESCE(o.customer->>'phone', ''), '\\D', '', 'g')
         )
       );
  `);

  // Keep future guest/PayTech orders linked automatically when their email or
  // phone belongs to an existing customer account.
  await pool.query(`
    CREATE OR REPLACE FUNCTION sngamer_link_order_customer()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    DECLARE matched_id BIGINT;
    BEGIN
      IF NEW.customer_id IS NOT NULL THEN
        RETURN NEW;
      END IF;

      SELECT c.id
        INTO matched_id
        FROM customers c
       WHERE (
         NULLIF(lower(trim(COALESCE(NEW.customer->>'email', ''))), '') IS NOT NULL
         AND lower(trim(COALESCE(c.email, ''))) = lower(trim(COALESCE(NEW.customer->>'email', '')))
       )
       OR (
         NULLIF(regexp_replace(COALESCE(NEW.customer->>'phone', ''), '\\D', '', 'g'), '') IS NOT NULL
         AND regexp_replace(COALESCE(c.phone, ''), '\\D', '', 'g') = regexp_replace(COALESCE(NEW.customer->>'phone', ''), '\\D', '', 'g')
       )
       ORDER BY CASE
         WHEN lower(trim(COALESCE(c.email, ''))) = lower(trim(COALESCE(NEW.customer->>'email', ''))) THEN 0
         ELSE 1
       END, c.id
       LIMIT 1;

      IF matched_id IS NOT NULL THEN
        NEW.customer_id := matched_id;
      END IF;

      RETURN NEW;
    END;
    $$;

    DROP TRIGGER IF EXISTS trg_sngamer_link_order_customer ON orders;

    CREATE TRIGGER trg_sngamer_link_order_customer
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION sngamer_link_order_customer();
  `);
}

module.exports = { initCustomersTable, ensureOrderCustomerColumns };
