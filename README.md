# Asset Lending Library System

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-teal?style=flat&logo=prisma)](https://www.prisma.io/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> A modern, robust web application engineered to manage shared equipment loans, track asset lifecycles, prevent checkout conflicts, maintain immutable audit histories, and eliminate physical sign-out sheets.

---

## 🚀 Live Demo & Repository

- **GitHub Repository**: [https://github.com/khushveen23/Busy_infotech_project](https://github.com/khushveen23/Busy_infotech_project)
- **Live Deployed App**: [https://asset-lending-demo.vercel.app](https://asset-lending-demo.vercel.app)

---

## 🔑 Quick Demo Credentials

The database is pre-seeded with sample catalogue equipment, loan lifecycles, overdue alerts, and audit history:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Librarian (Admin)** | `librarian@library.dev` | `librarian123` | Full system access, catalogue CRUD, loan approvals/returns/lost, bulk CSV tools, alerts |
| **Librarian 2 (Custodian)** | `sam@library.dev` | `librarian123` | Assigned custodian for specific equipment, full librarian privileges |
| **Member (Borrower)** | `member@library.dev` | `member123` | Browse catalogue, request loans, view personal active/past loans & status |
| **Member 2 (Borrower)** | `casey@library.dev` | `member234` | Member permissions |

---

## ✨ Features & Specification Checklist

The application meets all **10 required goals** specified in the assignment brief:

### 1. 🛡️ Accounts and Roles (RBAC)
- **NextAuth.js** credentials provider with JWT session handling and bcrypt password hashing.
- Strict server-side role verification on all API endpoints and server actions (`LIBRARIAN` vs `MEMBER`).
- Member accounts can browse the catalogue and request loans, but cannot issue items, process returns, or modify inventory.

### 2. 📦 Catalogue Management
- Full CRUD for inventory items: Title, Category, and Unique Identifying Code.
- **Soft Archival System**: Items can be archived to hide them from standard browsing without destroying or breaking historical loan records. Items can be restored at any time.

### 3. 📑 Loan Management & History
- Comprehensive loan records associating catalogue items, borrowers, request dates, and due dates.
- Interactive item detail page displaying every loan ever made against that specific asset with real-time status.

### 4. 🔄 Loan Lifecycle State Machine & Conflict Prevention
- **Enforced Lifecycle**: `Requested` → `Issued` → `Returned` (or `Issued` → `Lost`).
- **Dynamic Overdue Computation**: A loan is computed as *Overdue* at read time if `status === 'ISSUED'` and `dueDate < now` (eliminating stale database flags).
- **Concurrency & Conflict Protection**: The server rejects any attempt to request or issue an item that already has an active open loan (`REQUESTED` or `ISSUED`).

### 5. 👥 Multi-Custodian Assignment
- Many-to-many relationship between librarians and catalogue items.
- Dedicated **"My Items"** view allowing librarians to monitor equipment they are personally responsible for, alongside active and overdue loan counts.

### 6. 🔍 Server-Side Search, Filter, Sort & Pagination
- High-performance loan query engine running on the database server.
- Full-text search over item titles and borrower names.
- Multi-dimensional filters (status, item, borrower) with sorting by due date, request date, or status, accompanied by server-computed total match counts.

### 7. ⚡ Bulk Operations & CSV Workflows
- **CSV Bulk Import**: Upload inventory CSVs with transactional row processing and a granular per-row success/failure report.
- **Bulk Loan Returns**: Check off multiple active loans to return them in a single batch with per-loan status confirmations.
- **CSV Active Loans Export**: Generate and download real-time CSV reports of all equipment currently checked out with borrower contact details and due dates.

### 8. 📊 Real-Time Analytics Dashboard
- Visual headline metrics: Items Currently Out, Items Overdue, Loans Returned This Week, Total Registered Assets.
- Lifecycle state breakdown distribution charts.
- Custodian accountability tables.
- **8-Week Returns Trend**: Interactive line chart powered by Recharts showing historical loan returns.

### 9. 🔒 Append-Only Immutable Audit Timeline
- Immutable `loan_events` log recording state changes (`REQUESTED`, `ISSUED`, `RETURNED`, `LOST`).
- Records actor identity, timestamp, and optional librarian notes.
- Zero update or delete operations exposed—audit history cannot be modified or forged.

### 10. 🔔 Overdue Loan Alert Center & Re-Alert Engine
- Automated detection of loans past their due date with a live notification badge count in the navigation.
- Dismissal capability for librarians with an intelligent re-alerting rule: if the same item is re-issued in the future and becomes overdue on a new loan, the alert automatically resurfaces.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | [Next.js 14](https://nextjs.org/) (App Router) | High-performance React server components and server-side API handlers |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | End-to-end type safety across schemas, APIs, and UI components |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | Responsive design system with dark mode and sleek component layouts |
| **Database & ORM** | [PostgreSQL](https://www.postgresql.org/) / [Prisma ORM](https://www.prisma.io/) | Relational database schema with relational integrity and transactional safety |
| **Authentication** | [NextAuth.js](https://next-auth.js.org/) | JWT authentication with role-based claims verification |
| **Charts & CSV** | [Recharts](https://recharts.org/) / [PapaParse](https://www.papaparse.com/) | SVG data visualization and client-side/server-side CSV parsing |

---

## 📂 Project Structure

```
├── docs/                     # Design & Architecture Documentation
│   ├── architecture.md       # Architecture diagram, data flow & trade-offs
│   ├── schema.md             # Prisma database schema, constraints & indexing
│   ├── plan.md               # Implementation schedule, phases & time allocation
│   ├── decisions.md          # Architectural & engineering decisions recorded
│   └── ai-prompts.md         # Record of AI prompts and refinement iterations
├── prisma/
│   ├── schema.prisma         # Relational database models and enums
│   └── seed.ts               # Database seeding script with realistic demo data
├── src/
│   ├── app/
│   │   ├── (app)/            # Authenticated routes (Dashboard, Items, Loans, Alerts, Members)
│   │   ├── api/              # Secure REST API endpoints with RBAC middleware
│   │   ├── login/            # Authentication (Sign In & Registration)
│   │   ├── globals.css       # Global styles and design system variables
│   │   └── layout.tsx        # Root application layout and providers
│   ├── components/
│   │   ├── layout/           # Navigation sidebar and header bars
│   │   └── ui/               # Reusable UI components (Buttons, Cards, Inputs, Modals)
│   ├── lib/                  # Authentication, Prisma client, and utility helpers
│   └── types/                # TypeScript type definitions and API interfaces
├── SUBMISSION.md             # Official assignment submission summary & review notes
└── package.json
```

---

## 💻 Local Development Setup

### Prerequisites
- Node.js (v18.17 or higher)
- npm or yarn
- SQLite (default for local dev) or PostgreSQL

### 1. Clone the repository
```bash
git clone https://github.com/khushveen23/Busy_infotech_project.git
cd Busy_infotech_project
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env` file in the root directory:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="super-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Initialize database and seed demo data
```bash
npx prisma db push
npm run db:seed
```

### 5. Start the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser and log in with the demo credentials.

---

## 🧪 Testing & Verification

Run linter and TypeScript verification:
```bash
npm run lint
```

Build production bundle:
```bash
npm run build
```

---

## 📖 Additional Documentation

For comprehensive engineering details, please refer to the technical documents in the `docs/` folder:
- 🏛️ [Architecture & System Design](docs/architecture.md)
- 🗄️ [Database Schema & Data Model](docs/schema.md)
- 🧭 [Engineering Decisions & Trade-offs](docs/decisions.md)
- 📅 [Project Plan & Time Tracking](docs/plan.md)
- 🤖 [AI Prompts & Verification Record](docs/ai-prompts.md)
- 📝 [Submission Checklist & Reviewer Notes](SUBMISSION.md)
