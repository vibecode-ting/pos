import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

import { migrate } from './db/migrate.js';
import { seed } from './db/seed.js';
import productsRouter from './routes/products.js';
import salesRouter from './routes/sales.js';
import authRouter from './routes/auth.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load tenant config ─────────────────────────────────────────────────────
const tenant = JSON.parse(
  readFileSync(join(__dirname, '../src/tenant.json'), 'utf-8')
);

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────────────────────
app.get('/api/tenant', (_req, res) => {
  // Expose safe tenant config to the front-end (omit user passwords)
  const safe = {
    app: tenant.app,
    store: tenant.store,
    categories: tenant.categories,
  };
  res.json(safe);
});

app.use('/api/products', productsRouter);
app.use('/api/sales', salesRouter);
app.use('/api/auth', authRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: tenant.app.name, time: new Date().toISOString() });
});

// ── Bootstrap ──────────────────────────────────────────────────────────────
async function bootstrap() {
  try {
    console.log(`[server] Starting ${tenant.app.name} POS API...`);
    await migrate();
    await seed();
    app.listen(PORT, () => {
      console.log(`[server] ✓ API ready at http://localhost:${PORT}`);
      console.log(`[server] ✓ Health: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error('[server] Failed to start:', err);
    process.exit(1);
  }
}

bootstrap();
