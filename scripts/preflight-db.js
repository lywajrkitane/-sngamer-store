const { Pool } = require("pg");

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
  });

  try {
    await pool.query("SELECT 1");

    // The application bootstrap historically assumed these legacy columns
    // already existed before attempting ALTER COLUMN ... DROP NOT NULL.
    // Make that migration safe on both old and newly-created databases.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id BIGSERIAL PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        status TEXT NOT NULL DEFAULT 'Nouvelle',
        customer JSONB NOT NULL DEFAULT '{}'::jsonb,
        payment TEXT NOT NULL DEFAULT 'Paiement à la livraison',
        items JSONB NOT NULL DEFAULT '[]'::jsonb,
        total INTEGER NOT NULL DEFAULT 0
      );
    `);

    await pool.query(`
      ALTER TABLE orders
        ADD COLUMN IF NOT EXISTS customer_name TEXT,
        ADD COLUMN IF NOT EXISTS phone TEXT,
        ADD COLUMN IF NOT EXISTS customer JSONB DEFAULT '{}'::jsonb,
        ADD COLUMN IF NOT EXISTS payment TEXT DEFAULT 'Paiement à la livraison',
        ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS total INTEGER DEFAULT 0;
    `);

    console.log("Preflight database check: OK");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("PREFLIGHT_DB_ERROR:", error.message || error);
  process.exit(1);
});
