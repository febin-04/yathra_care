# Aanavandi - Passenger Grievance Reporting System

An offline-first, local passenger grievance management system built with Next.js 14 (App Router), TypeScript, Tailwind CSS, and SQLite (`better-sqlite3`).

Designed for transportation hubs and event venues with unreliable or zero internet connectivity. All data, logic, and CSV seeding run completely offline.

---

## 🚀 Features & Capabilities

- **Offline-First Architecture**: Powered by embedded SQLite (`better-sqlite3`) in WAL mode. Zero cloud dependency.
- **Dynamic CSV Seeder**: Reads and ingests organiser CSV files directly from `/data/*.csv` (`depots.csv`, `routes.csv`, `categories.csv`, `complaints.csv`).
- **Passenger Grievance Submission**: Public-facing form for logging grievances with auto-generated reference numbers (e.g. `GRV-20260923-8A2F`).
- **Automatic SLA & Escalation Engine**: Computes target resolution deadlines per category. Automatically flags overdue grievances as **Escalated**.
- **Depot Operations Dashboard**: Filter by Depot, Category, Status, or SLA Escalated status with real-time KPI metrics.
- **Reseed Interface**: Trigger full or incremental database reseeding from CSVs via CLI (`npm run seed`) or header UI action.

---

## 📁 Clean Folder Structure

```
/aanavandi
├── app/
│   ├── layout.tsx             # Global layout & header navigation
│   ├── page.tsx               # Grievance reporting & track status page
│   ├── globals.css            # Tailwind directives
│   ├── dashboard/             # Admin depot operations view
│   │   └── page.tsx
│   ├── complaints/[id]/       # Detailed grievance view
│   │   └── page.tsx
│   └── api/
│       ├── complaints/route.ts # Submit & filter grievances API
│       ├── complaints/[id]/    # Status update & detail lookup API
│       ├── meta/route.ts       # Metadata API (depots, routes, categories, stats)
│       └── seed/route.ts       # Database reseed endpoint
├── lib/
│   ├── db.ts                  # SQLite initialization & schema definitions
│   ├── seed.ts                # Dynamic CSV parser & seeder engine
│   └── complaints.ts          # Business logic, SLA logic, and SQL queries
├── components/
│   ├── Header.tsx             # App navigation with live reseed button
│   ├── GrievanceForm.tsx      # Passenger form & reference lookup
│   └── DashboardTable.tsx     # Admin table with filters, search, and inspect modal
├── data/
│   ├── depots.csv             # Organiser CSV: Depot directory
│   ├── routes.csv             # Organiser CSV: Route mapping
│   ├── categories.csv         # Organiser CSV: Categories with SLA targets
│   └── complaints.csv         # Organiser CSV: Sample initial grievances
├── scripts/
│   └── seed.ts                # CLI seed launcher (`npm run seed`)
├── aanavandi.db               # SQLite local database (generated on seed/run)
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## 🗄️ Database Schema (`aanavandi.db`)

### `depots`
- `id` (TEXT PRIMARY KEY): e.g. `DEP-01`
- `name` (TEXT NOT NULL): e.g. `Trivandrum Central Depot`
- `contact` (TEXT): e.g. `+91 471 2323886`

### `routes`
- `id` (TEXT PRIMARY KEY): e.g. `RT-101`
- `name` (TEXT NOT NULL): e.g. `Trivandrum - Ernakulam Super Fast`
- `depot_id` (TEXT FK -> depots.id)

### `categories`
- `id` (TEXT PRIMARY KEY): e.g. `CAT-01`
- `name` (TEXT NOT NULL): e.g. `Safety & Over-speeding`
- `sla_hours` (INTEGER NOT NULL DEFAULT 24)

### `complaints`
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `reference_number` (TEXT UNIQUE NOT NULL): e.g. `GRV-20260923-1001`
- `route_id` (TEXT FK -> routes.id)
- `category` (TEXT)
- `location` (TEXT)
- `description` (TEXT NOT NULL)
- `evidence_url` (TEXT)
- `status` (TEXT NOT NULL DEFAULT 'PENDING') — `PENDING`, `IN_PROGRESS`, `RESOLVED`, `REJECTED`
- `depot_id` (TEXT FK -> depots.id)
- `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)
- `sla_deadline` (DATETIME)
- `escalated` (INTEGER NOT NULL DEFAULT 0) — `1` if overdue

---

## 🛠️ Setup & Installation

### 1. Prerequisites
- Node.js v18+ or v20+ or v22+
- npm v9+

### 2. Install Dependencies
```bash
npm install
```

### 3. Seed Database from `/data/*.csv`
Run the seed script to read all CSV files inside `/data` and populate `aanavandi.db`:
```bash
npm run seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔄 How to Reseed the Database

Whenever new organiser CSV files are provided:

1. Drop or replace the CSV files inside the `/data` folder:
   - `/data/depots.csv`
   - `/data/routes.csv`
   - `/data/categories.csv`
   - `/data/complaints.csv` (optional)
2. Execute the reseed command:
   ```bash
   npm run seed
   ```
   *Alternatively, click the **"Reseed CSV"** button in the app navigation header while the server is running.*

---

## 🏗️ Production Build

To build the optimized static/server pages for offline deployment:
```bash
npm run build
npm run start
```
