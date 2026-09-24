# Aanavandi Yathra Care - Passenger Grievance Redressal & Depot Operations System

An intelligent, offline-resilient, multi-lingual passenger grievance management and transport operations platform designed for **KSRTC (Kerala State Road Transport Corporation)**. Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Neon PostgreSQL**, **SQLite**, and **Nodemailer**.

---

## 🛠️ Complete Tech Stack

### 🎨 Frontend & User Interface
| Technology | Description |
| :--- | :--- |
| **[Next.js 14](https://nextjs.org/)** | Modern App Router framework with React Server Components (RSC) and Client Components. |
| **[React 18](https://react.dev/)** | Component-driven UI library with hooks, context providers, and reactive state management. |
| **[TypeScript 5](https://www.typescriptlang.org/)** | End-to-end strict type safety across forms, APIs, and database models. |
| **[Tailwind CSS 3](https://tailwindcss.com/)** | Utility-first styling with custom KSRTC emerald/amber color palettes and animations. |
| **[Lucide React](https://lucide.dev/)** | Comprehensive vector iconography for transit statuses, categories, badges, and depot KPIs. |
| **[clsx](https://github.com/lukeed/clsx) & [tailwind-merge](https://github.com/dcastil/tailwind-merge)** | Dynamic and conditional Tailwind class management. |

---

### ⚙️ Backend & API Architecture
| Technology | Description |
| :--- | :--- |
| **Next.js Route Handlers** | RESTful API endpoints (`/api/*`) for grievance ingestion, search, stats, feedback, QR generation, and batch email dispatch. |
| **Node.js (v18+ / v20+)** | Server-side JavaScript runtime powering serverless edge functions and background workers. |
| **[TSX](https://github.com/privatenumber/tsx)** | TypeScript execution engine for running migration and CSV seed scripts directly without compilation overhead. |

---

### 🗄️ Database & Storage Layer (Dual-Database Support)
| Technology | Description |
| :--- | :--- |
| **[Neon Serverless PostgreSQL](https://neon.tech/)** | Cloud-native serverless Postgres with `@neondatabase/serverless` connection pooling for scalable production deployment. |
| **[SQLite (`better-sqlite3`)](https://github.com/WiseLibs/better-sqlite3)** | High-performance embedded local SQL database operating in WAL (Write-Ahead Logging) mode for offline testing and local execution. |
| **[csv-parse](https://csv.js.org/parse/)** | Stream parser for reading organiser and depot CSV datasets (`depots.csv`, `routes.csv`, `categories.csv`, `complaints.csv`). |

---

### 📶 Offline Resilience & Client Storage
| Technology | Description |
| :--- | :--- |
| **Browser `localStorage`** | Local client-side caching (`aanavandi_offline_queue`) to store grievances when internet connectivity is lost on transit routes. |
| **HTML5 `online` / `offline` Events** | Automatic background sync listener that flushes queued local tickets to the database when connection restores. |
| **HTML5 Camera & Canvas API** | In-browser camera capture with live viewfinder preview and Base64 image compression for uploading ticket/bus photos. |

---

### 🌐 Internationalization & Localization (i18n)
| Technology | Description |
| :--- | :--- |
| **Custom i18n Context Engine** | Instant zero-reload language switching supporting **English**, **Malayalam (മലയാളം)**, and **Hindi (हिन्दी)** with persistent preferences. |

---

### 📬 Communication & Notifications
| Technology | Description |
| :--- | :--- |
| **[Nodemailer](https://nodemailer.com/)** | Gmail SMTP transporter for dispatching automated ticket confirmation emails and executive escalation dossiers. |
| **[Resend](https://resend.com/)** | Transactional cloud email API fallback for high-reliability message delivery. |
| **In-App Notification Center** | Centralized audit log tracking status transitions, automated SLA escalations, and official remarks. |

---

### 🔍 Intelligence & Operational Features
| Technology | Description |
| :--- | :--- |
| **[qrcode](https://github.com/soldair/node-qrcode)** | Dynamic SVG/PNG QR code generator for bus seat labels and depot stickers for one-scan complaint logging. |
| **SLA & Escalation Engine** | Category-based resolution timer that automatically computes deadlines and marks overdue tickets as `ESCALATED`. |
| **Duplicate Grievance Detector** | Real-time heuristic check for similar route + category tickets submitted within a tight timeframe. |
| **Trend Alert & Hotspot Engine** | Aggregates repeated issues along specific routes (e.g. breakdown, over-speeding) to alert depot controllers. |

---

### 🚀 DevOps & Deployment
| Technology | Description |
| :--- | :--- |
| **[Vercel](https://vercel.com/)** | Cloud hosting platform with automated CI/CD deployment pipelines on every `git push`. |
| **Git & GitHub** | Distributed version control and source code management. |
| **PostCSS & Autoprefixer** | Automated CSS preprocessing for cross-browser compatibility. |

---

## 📁 Clean Folder Structure

```
/aanavandi
├── app/
│   ├── layout.tsx                # Global root layout, providers & header
│   ├── page.tsx                  # Passenger grievance reporting & tracking portal
│   ├── globals.css               # Tailwind directives & custom CSS
│   ├── dashboard/page.tsx        # Depot Operations & Management Analytics Dashboard
│   ├── track/page.tsx            # Public grievance tracking page
│   ├── notifications/page.tsx    # Live notification center
│   ├── help/page.tsx             # Help, offline guide & FAQ documentation
│   └── api/
│       ├── complaints/           # Submission, listing, and filtering API
│       ├── complaints/[id]/      # Single ticket lookup and status update API
│       ├── complaints/check-duplicate/ # Pre-submission duplicate detector API
│       ├── escalate/             # Manual and auto SLA escalation trigger API
│       ├── feedback/             # Passenger resolution feedback rating API
│       ├── forward-complaints/   # Batch selection & official email forwarding API
│       ├── management-dashboard/ # Zonal & depot KPI aggregation API
│       ├── meta/                 # Route, category, and depot directory API
│       ├── notifications/        # Live notifications API
│       ├── qr/                   # Dynamic QR code generation endpoint
│       ├── seed/                 # Database CSV reseed trigger API
│       ├── simulate-time/        # Fast-forward simulation tool for SLA testing
│       └── trend-alerts/         # Route issue hotspot aggregation API
├── components/
│   ├── Header.tsx                # App navigation, language switcher & status indicators
│   ├── GrievanceForm.tsx         # Multi-step passenger form with offline queue & camera capture
│   ├── DashboardTable.tsx        # Depot operations table with batch select & forward modal
│   ├── ManagementDashboard.tsx   # Executive charts, SLA breach rates & depot rankings
│   └── TrendAlertsView.tsx       # Live route trend alerts and recurring issue warnings
├── context/
│   └── LanguageContext.tsx       # Multi-lingual translations (EN, ML, HI) and state provider
├── lib/
│   ├── db.ts                     # Database client (Neon PostgreSQL + SQLite fallback)
│   ├── complaints.ts             # Business logic, SLA calculators, and SQL queries
│   ├── email.ts                  # Nodemailer & Resend email templates and dispatchers
│   └── seed.ts                   # CSV ingestion and schema initialization engine
├── data/
│   ├── depots.csv                # Organiser CSV: Depot directory
│   ├── routes.csv                # Organiser CSV: Route directory
│   ├── categories.csv            # Organiser CSV: Grievance categories with SLA hours
│   └── complaints.csv            # Organiser CSV: Initial sample grievance records
├── scripts/
│   └── seed.ts                   # Standalone CLI database seed script (`npm run seed`)
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## 🗄️ Database Schema

### `depots`
* `id` (`TEXT PRIMARY KEY`): e.g. `DEP-01`
* `name` (`TEXT NOT NULL`): e.g. `Trivandrum Central Depot`
* `contact` (`TEXT`): e.g. `+91 471 2323886`

### `routes`
* `id` (`TEXT PRIMARY KEY`): e.g. `RT-101`
* `name` (`TEXT NOT NULL`): e.g. `Trivandrum - Ernakulam Super Fast`
* `depot_id` (`TEXT FK -> depots.id`)

### `categories`
* `id` (`TEXT PRIMARY KEY`): e.g. `CAT-01`
* `name` (`TEXT NOT NULL`): e.g. `Safety & Over-speeding`
* `sla_hours` (`INTEGER NOT NULL DEFAULT 24`)

### `complaints`
* `id` (`INTEGER / SERIAL PRIMARY KEY`)
* `reference_number` (`TEXT UNIQUE NOT NULL`): e.g. `GRV-20260924-A8F2`
* `route_id` (`TEXT FK -> routes.id`)
* `category` (`TEXT NOT NULL`)
* `location` (`TEXT`)
* `description` (`TEXT NOT NULL`)
* `passenger_name` (`TEXT`), `passenger_email` (`TEXT`), `passenger_phone` (`TEXT`)
* `evidence_url` (`TEXT`)
* `status` (`TEXT DEFAULT 'PENDING'`): `PENDING` | `IN_PROGRESS` | `RESOLVED` | `REJECTED`
* `depot_id` (`TEXT FK -> depots.id`)
* `created_at` (`TIMESTAMP DEFAULT CURRENT_TIMESTAMP`)
* `sla_deadline` (`TIMESTAMP`)
* `escalated` (`INTEGER DEFAULT 0`): `1` if overdue
* `escalation_level` (`TEXT DEFAULT 'DEPOT'`): `DEPOT` | `DISTRICT` | `STATE_HQ`
* `feedback_rating` (`INTEGER`), `feedback_comment` (`TEXT`)

---

## 🚀 Setup & Local Development

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/febin-04/yathra_care.git
cd yathra_care
npm install
```

### 2. Configure Environment Variables (`.env.local`)
Create a `.env.local` file in the root directory:
```env
# Database (Neon PostgreSQL or leave empty for local SQLite)
DATABASE_URL=postgresql://user:password@ep-xyz.neon.tech/neondb?sslmode=require

# Email Notifications (Gmail SMTP)
EMAIL_USER=your_email@gmail.com
EMAIL_APP_PASSWORD=your_gmail_app_password

# Resend API Key (Optional fallback)
RESEND_API_KEY=re_xxxxxxxxxxxx
```

### 3. Seed Database
Ingest all CSV files from `/data`:
```bash
npm run seed
```

### 4. Run Development Server
```bash
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🏗️ Production Build
```bash
npm run build
npm run start
```
