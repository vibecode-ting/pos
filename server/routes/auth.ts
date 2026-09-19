import { Router } from 'express';
import { pool } from '../db/client.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body as { username: string; password: string };
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password required' });
  }
  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        initials: user.initials,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me — verify token and return user info
router.get('/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(auth.slice(7), JWT_SECRET);
    res.json(decoded);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
