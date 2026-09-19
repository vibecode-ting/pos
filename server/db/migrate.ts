import { pool } from './client.js';

export async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── Users ──────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            TEXT PRIMARY KEY,
        username      TEXT UNIQUE NOT NULL,
        display_name  TEXT NOT NULL,
        initials      TEXT NOT NULL DEFAULT '',
        role          TEXT NOT NULL DEFAULT 'cashier',
        password_hash TEXT NOT NULL,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // ── Products ───────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id          TEXT PRIMARY KEY,
        name        TEXT NOT NULL,
        name_local  TEXT NOT NULL DEFAULT '',
        sku         TEXT UNIQUE NOT NULL,
        category    TEXT NOT NULL DEFAULT '',
        price       NUMERIC(14, 2) NOT NULL DEFAULT 0,
        stock       INTEGER NOT NULL DEFAULT 0,
        min_stock   INTEGER NOT NULL DEFAULT 0,
        color       TEXT NOT NULL DEFAULT '#edf6f3',
        serial      TEXT NOT NULL DEFAULT '',
        image_url   TEXT NOT NULL DEFAULT '',
        meta        JSONB NOT NULL DEFAULT '{}',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // ── Sales ──────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id          TEXT PRIMARY KEY,
        receipt     TEXT NOT NULL,
        total       NUMERIC(14, 2) NOT NULL DEFAULT 0,
        items       INTEGER NOT NULL DEFAULT 0,
        status      TEXT NOT NULL DEFAULT 'SYNCED',
        payload     JSONB NOT NULL DEFAULT '[]',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query('COMMIT');
    console.log('[migrate] Tables ready ✓');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
