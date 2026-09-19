# POS — White-Label Point of Sale

A fully template-driven POS system built with **React + Vite + TypeScript** on the front-end, and **Express + PostgreSQL** on the back-end. One config file (`src/tenant.json`) controls everything — brand name, logo, currency, products, users, and more.

---

## 🚀 Quick Start (Local Dev)

### Prerequisites
- **Node.js** v18+ and **pnpm** (`npm i -g pnpm`)
- **PostgreSQL** — either locally installed, or via Docker:

```bash
docker compose up -d          # starts PostgreSQL on port 5432
```

### 1. Configure environment
```bash
cp .env.example .env          # already has default dev values
```

### 2. Configure your tenant
Edit [`src/tenant.json`](./src/tenant.json) to set your business name, logo URL, currency, products, and users.

### 3. Install & run
```bash
pnpm install
pnpm dev:all                  # starts Vite (port 5173) + Express API (port 3001)
```

Open **http://localhost:5173**

Default login credentials (from `tenant.json`):
| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | owner |
| `cashier` | `cashier123` | cashier |

---

## 🗂️ Project Structure

```
pos/
├── src/
│   ├── tenant.json        ← 🔑 MASTER CONFIG — change this per deployment
│   ├── main.tsx           ← React app (reads tenant.json)
│   ├── api.ts             ← Fetch wrapper for Express API
│   ├── index.tsx          ← Entry point
│   └── styles.css         ← All styles
├── server/
│   ├── index.ts           ← Express entry (loads tenant.json, runs migrations)
│   ├── db/
│   │   ├── client.ts      ← PostgreSQL pool
│   │   ├── migrate.ts     ← Auto-creates tables
│   │   └── seed.ts        ← Seeds from tenant.json
│   └── routes/
│       ├── products.ts    ← GET/POST /api/products
│       ├── sales.ts       ← GET/POST /api/sales
│       └── auth.ts        ← POST /api/auth/login
├── docker-compose.yml     ← PostgreSQL via Docker
├── vite.config.ts         ← Proxies /api/* → Express
├── .env.example           ← Copy to .env
└── tenant.json            ← (root alias — see src/tenant.json)
```

---

## ⚙️ White-Labeling for a New Client

To deploy this POS for a new business, only edit **`src/tenant.json`**:

```jsonc
{
  "app": {
    "name": "Your Business Name",   // ← brand name everywhere
    "tagline": "Your Tagline",
    "logoUrl": "https://...",        // ← logo image URL (or "" for icon)
    "themeColor": "#0f766e",         // ← sidebar/accent color
    "currency": "USD",               // ← any ISO currency code
    "currencyLocale": "en-US",
    "taxRate": 0.08                  // ← tax rate (0.08 = 8%)
  },
  "products": [ ... ],              // ← seed products for this business
  "users": [ ... ]                  // ← staff accounts
}
```

Then run `docker compose up -d && pnpm dev:all`. Done.

---

## 🗄️ PostgreSQL Tables

| Table | Description |
|-------|-------------|
| `users` | Staff accounts (hashed passwords) |
| `products` | Product catalog with stock levels |
| `sales` | Completed sales with sync status |

Tables are created automatically on first run (`migrate.ts`). Seed data from `tenant.json` is inserted if tables are empty (`seed.ts`).

---

## 🔌 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Server status + app name |
| `GET` | `/api/tenant` | Safe tenant config (no passwords) |
| `GET` | `/api/products` | List all products |
| `POST` | `/api/products` | Add a product |
| `PATCH` | `/api/products/:id/stock` | Adjust stock |
| `GET` | `/api/sales` | List sales (newest first) |
| `POST` | `/api/sales` | Record a sale (deducts stock) |
| `POST` | `/api/auth/login` | Username/password → JWT |
| `GET` | `/api/auth/me` | Verify JWT |

---

## 📱 Features

- ✅ **POS** — cart, barcode scan placeholder, tax calculation
- ✅ **Dashboard** — today's sales, recent transactions, quick actions
- ✅ **Inventory** — product catalog, low stock alerts
- ✅ **Reports** — sales totals, category breakdown, sync log
- ✅ **Settings** — store, receipt, language, sync status
- ✅ **Offline mode** — sales saved locally, sync on reconnect
- ✅ **Dark mode** — full dark theme
- ✅ **Bilingual** — English + Myanmar (or add any language to `i18n`)
- ✅ **Login screen** — JWT auth backed by PostgreSQL
- ✅ **White-label** — one `tenant.json` controls everything
