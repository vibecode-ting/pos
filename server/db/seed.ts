import { pool } from './client.js';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tenant = JSON.parse(
  readFileSync(join(__dirname, '../../src/tenant.json'), 'utf-8')
);

export async function seed() {
  const client = await pool.connect();
  try {
    // ── Seed users if table is empty ──────────────────────────────────────
    const { rows: existingUsers } = await client.query(
      'SELECT COUNT(*) FROM users'
    );
    if (Number(existingUsers[0].count) === 0) {
      console.log('[seed] Seeding users from tenant.json...');
      for (const u of tenant.users) {
        const hash = await bcrypt.hash(u.password, 10);
        await client.query(
          `INSERT INTO users (id, username, display_name, initials, role, password_hash)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO NOTHING`,
          [u.id, u.username, u.displayName, u.initials, u.role, hash]
        );
      }
      console.log(`[seed] ${tenant.users.length} user(s) seeded ✓`);
    }

    // ── Seed products if table is empty ───────────────────────────────────
    const { rows: existingProducts } = await client.query(
      'SELECT COUNT(*) FROM products'
    );
    if (Number(existingProducts[0].count) === 0) {
      console.log('[seed] Seeding products from tenant.json...');
      for (const p of tenant.products) {
        await client.query(
          `INSERT INTO products
             (id, name, name_local, sku, category, price, stock, min_stock, color, serial, image_url)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
           ON CONFLICT (id) DO NOTHING`,
          [
            p.id, p.name, p.nameLocal || '', p.sku, p.category,
            p.price, p.stock, p.minStock || 0,
            p.color || '#edf6f3', p.serial || '', p.imageUrl || ''
          ]
        );
      }
      console.log(`[seed] ${tenant.products.length} product(s) seeded ✓`);
    }
  } finally {
    client.release();
  }
}

// Run directly: tsx server/db/seed.ts
if (process.argv[1]?.includes('seed')) {
  seed().then(() => { pool.end(); process.exit(0); });
}
