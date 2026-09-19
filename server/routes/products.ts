import { Router } from 'express';
import { pool } from '../db/client.js';

const router = Router();

// GET /api/products
router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, name_local, sku, category,
              price, stock, min_stock, color, serial, image_url
       FROM products
       ORDER BY category, name`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// PATCH /api/products/:id/stock  — adjust stock after a sale
router.patch('/:id/stock', async (req, res) => {
  const { id } = req.params;
  const { delta } = req.body as { delta: number };
  try {
    const { rows } = await pool.query(
      `UPDATE products
       SET stock = GREATEST(stock + $1, 0), updated_at = NOW()
       WHERE id = $2
       RETURNING id, stock`,
      [delta, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

// POST /api/products — add a new product
router.post('/', async (req, res) => {
  const p = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO products
         (id, name, name_local, sku, category, price, stock, min_stock, color, serial, image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        p.id || crypto.randomUUID(),
        p.name, p.nameLocal || '', p.sku, p.category,
        p.price, p.stock ?? 0, p.minStock ?? 0,
        p.color || '#edf6f3', p.serial || '', p.imageUrl || ''
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err: any) {
    if (err.code === '23505') return res.status(409).json({ error: 'SKU already exists' });
    console.error(err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

export default router;
