import { Router } from 'express';
import { pool } from '../db/client.js';

const router = Router();

// GET /api/sales
router.get('/', async (req, res) => {
  const limit = Number(req.query.limit) || 100;
  try {
    const { rows } = await pool.query(
      `SELECT id, receipt, total, items, status, payload, created_at
       FROM sales
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
});

// POST /api/sales — record a completed sale
router.post('/', async (req, res) => {
  const s = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO sales (id, receipt, total, items, status, payload)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        s.id || crypto.randomUUID(),
        s.receipt, s.total, s.items,
        s.status || 'SYNCED',
        JSON.stringify(s.payload || [])
      ]
    );

    // Adjust product stock for each item in the sale
    if (Array.isArray(s.payload)) {
      for (const item of s.payload) {
        await pool.query(
          `UPDATE products SET stock = GREATEST(stock - $1, 0), updated_at = NOW() WHERE id = $2`,
          [item.qty, item.id]
        );
      }
    }

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to record sale' });
  }
});

export default router;
