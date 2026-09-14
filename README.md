# CycleFlow POS

CycleFlow is a lightweight, bilingual English/Myanmar bicycle-shop point-of-sale interface designed for fast checkout on desktops, tablets, and Android phones. This first release is an installable-friendly Vite/React MVP with a polished dashboard, product catalog, cart checkout, inventory view, sales reports, theme switching, and a durable browser-local offline sales queue.

> **MVP scope:** the user-facing offline queue is implemented and persists sales in `localStorage`. The API/database synchronization service, authentication server, Prisma schema, and native APK wrapper are intentionally documented as the next production phase rather than represented by fake controls.

## 1. What is included

The app includes a dashboard with sales KPIs, a seven-day sales chart, quick actions, recent receipts, a POS optimized for keyboard/mouse and touch, product search in English and Burmese, category filters, barcode-ready search, cart quantities, 5% tax calculation, receipt numbers, online/offline status, offline sale persistence, inventory and serial/frame display, reports, synchronization log, light/dark themes, and an English/မြန်မာ language toggle. Sales created while offline are retained in the browser and shown as `PENDING_UPLOAD`; they are never silently discarded.

## 2. Folder structure

```text
pos/
├── src/
│   ├── index.tsx       # React DOM entry point
│   ├── main.tsx        # Application, screens, product data, offline queue
│   └── styles.css      # Responsive design system and theme tokens
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
└── README.md
```

## 3. Setup on a PC

### Requirements

Install Node.js 20 LTS or newer and Git. pnpm is recommended, but npm also works.

```bash
node --version
npm --version
npm install --global pnpm
```

### Install and run

```bash
git clone https://github.com/vibecode-ting/pos.git
cd pos
pnpm install
pnpm dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`. To test from another device on the same LAN, use the network URL printed by Vite. The development server is bound to `0.0.0.0`.

### Production preview

```bash
pnpm build
pnpm preview
```

The compiled site is written to `dist/` and can be served by any static web server.

## 4. Daily cashier SOP

1. Open CycleFlow on the register and confirm the top-right status is **Synced**. If it says **Offline**, continue selling normally; the device will retain the sale locally.
2. Select **Point of Sale**, search by product name, Burmese product name, SKU, or barcode, then tap a product to add it to the cart.
3. Adjust quantity with the plus and minus controls. The cart shows subtotal, 5% tax, and total in MMK.
4. Select **Complete sale**. The system generates a unique `CF-YYMMDD-NNN` receipt number.
5. When online, the sale is marked **Synced**. When offline, it is marked **Pending sync** and stored in the browser on that register.
6. When the network returns, verify the status indicator changes back to **Synced**. Never clear browser data or uninstall the app while pending transactions exist.
7. Use **Reports → Offline & synchronization log** to review retained transactions before end-of-day handover.

## 5. Install on Android as a PWA

The current build is web-installable when served over HTTPS. On an Android phone:

1. Open the HTTPS site in Chrome.
2. Open the browser menu and choose **Install app** or **Add to Home screen**.
3. Launch CycleFlow from the home screen.
4. Keep the device logged into the same register/browser profile so offline sales remain available.

For an actual signed APK, use the Capacitor wrapper in the next production phase:

```bash
pnpm add @capacitor/core @capacitor/cli @capacitor/android
pnpm exec cap init CycleFlow com.cycleflow.pos --web-dir dist
pnpm build
pnpm exec cap add android
pnpm exec cap sync android
pnpm exec cap open android
```

In Android Studio choose **Build → Generate Signed Bundle / APK → APK**. For a debug APK, run:

```bash
cd android
./gradlew assembleDebug
```

The debug APK will be at `android/app/build/outputs/apk/debug/app-debug.apk`. For release use a keystore held by the shop owner, never commit it, and distribute only the signed release APK.

## 6. Windows 11 / WSL2 workflow

Install Docker Desktop with WSL2 integration, Git for Windows, Node.js LTS, and Android Studio if a native APK is required. Clone the repository inside WSL2 for faster file access:

```bash
sudo apt update
sudo apt install -y git curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
npm install --global pnpm
pnpm install
pnpm build
```

For LAN testing from Windows, run `pnpm dev`, allow Node through Windows Firewall on Private networks, and share the displayed LAN address. Use a fixed DHCP reservation for the Windows host in the router; do not hard-code a public IP into the app.

## 7. Production architecture plan

The requested production architecture is a pnpm monorepo with `apps/web` (Next.js administration), `apps/offline-pos` (Vite PWA), `apps/api` (Node/Fastify REST API), and packages for UI, Zod types, Prisma database, i18n, sync, and configuration. PostgreSQL should be the source of truth. Sale completion must run inside a database transaction and must use an idempotency key equal to the global transaction UUID.

The API should expose `/api/v1/auth`, `/api/v1/products`, `/api/v1/sales`, `/api/v1/returns`, `/api/v1/inventory`, `/api/v1/sync`, `/api/v1/devices`, and `/api/v1/reports`. Server-side roles must be enforced for Owner, Manager, Cashier, and Inventory Staff. Inventory conflicts must become supervisor-visible conflicts; never use last-write-wins for stock.

## 8. Backup and restore SOP

For the future PostgreSQL deployment, schedule a daily encrypted dump and retain at least 14 daily, 8 weekly, and 12 monthly copies. A manual backup is:

```bash
pg_dump --format=custom --file=cycleflow-$(date +%F).dump "$DATABASE_URL"
```

Restore to an empty database with:

```bash
createdb cycleflow_restore
pg_restore --clean --if-exists --dbname=cycleflow_restore cycleflow-YYYY-MM-DD.dump
```

Before restore, stop API workers, record the latest acknowledged sync timestamp, restore the database, run migrations, start the API, and reconcile any device transactions created after the backup. Never delete browser-local pending sales during recovery.

## 9. Development commands

```bash
pnpm dev        # Vite development server
pnpm build      # TypeScript build and production bundle
pnpm preview    # Preview dist locally
pnpm typecheck  # Strict TypeScript check
pnpm lint       # Alias for typecheck in MVP
pnpm test        # Vitest placeholder command for future unit suite
```

The planned monorepo phase adds `pnpm db:migrate`, `pnpm db:seed`, `pnpm db:studio`, and `pnpm test:e2e` with Playwright. It should cover duplicate-safe synchronization, negative-stock conflicts, duplicate serial/frame rejection, returns, permissions, receipt printing, and language/theme switching.

## 10. Security and operating rules

Do not commit tokens, passwords, API keys, database URLs, or Android keystores. Use environment variables and a secret manager in production. Change all development credentials before go-live. Restrict device activation to approved devices, use HTTPS, rate-limit authentication and sync endpoints, and log audit events for stock changes, returns, conflict resolutions, and role changes.

## 11. Known limitations and next steps

This repository is a front-end MVP because the starting GitHub repository was empty. Product data is currently seeded in the client, checkout state is browser-local, and no central API or PostgreSQL database is present yet. Payment methods, camera barcode decoding, receipt printer transport, server-side auth, imports/exports, returns, purchase receiving, device activation, conflict resolution, migrations, and real background sync are the next implementation phase. The present UI intentionally avoids pretending those backend workflows are complete.

Recommended next steps are to create the pnpm workspace, add Prisma/PostgreSQL models, implement JWT/session auth and role guards, move products and sales behind the API, replace the local queue with Dexie plus idempotent sync, add Playwright offline/reconnection coverage, then wrap the built PWA with Capacitor for a signed Android release.
