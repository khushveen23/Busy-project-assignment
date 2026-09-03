# Submission

Completed submission for **Assignment 10 — Asset Lending**.

---

## Links

- **GitHub repository:** https://github.com/khushveen23/Busy_infotech_project
- **Live application:** <https://asset-lending-demo.vercel.app>

---

## Notes for the reviewer

- Hosted on **Vercel** with a managed **Supabase PostgreSQL** database.
- If accessing after inactivity, the database connection cold-start may take 5–10 seconds on the very first request.
- The repository is pre-seeded with realistic equipment catalogue items, custodians, historical loans across 8 weeks, and active overdue items for instant testing.

---

## Demo credentials

| Role | Email | Password |
|---|---|---|
| **Librarian (Admin)** | `librarian@library.dev` | `librarian123` |
| **Librarian 2 (Custodian)** | `sam@library.dev` | `librarian123` |
| **Member (Borrower)** | `member@library.dev` | `member123` |
| **Member 2 (Borrower)** | `casey@library.dev` | `member234` |

---

## Stack

| Layer | What you used | Why |
|---|---|---|
| **Frontend** | Next.js 14 (App Router) + TypeScript + Tailwind CSS + Lucide Icons | Server components reduce client bundle; fast type-safe UI development; professional dark aesthetic |
| **Backend** | Next.js API Routes + Server Actions | Co-located full-stack TypeScript API; zero CORS issues; seamless Vercel deployment |
| **Database** | PostgreSQL (Supabase) via Prisma ORM | Relational schema integrity, type-safe queries, migration control, transaction locks |
| **Auth** | NextAuth.js (v4) with JWT strategy | Credentials authentication with role (`LIBRARIAN` vs `MEMBER`) stored in JWT and server-verified |
| **Utilities** | PapaParse, Recharts, bcryptjs | Industry standard CSV parsing, SVG chart rendering, and secure password hashing |

---

## Goal checklist

| # | Goal | Status | Notes |
|---|---|---|---|
| 1 | Accounts and roles | **Done** | NextAuth with email/password; server middleware & API role enforcement (`LIBRARIAN` vs `MEMBER`). |
| 2 | Catalogue items | **Done** | Item title, category, unique code; edit support; archive/restore soft delete preserving history. |
| 3 | Loans | **Done** | Member request & Librarian issue flows; opening an item shows every loan ever made against it. |
| 4 | Loan lifecycle with rules | **Done** | State machine (*Requested → Issued → Returned*, *Issued → Lost*); dynamic read-time overdue computation; single open-loan lock enforced on server. |
| 5 | Custodians | **Done** | Many-to-many librarian↔item assignment; dedicated "My Items" custodian view for librarians. |
| 6 | Finding loans | **Done** | Server-side text search over item title & borrower, filters, sorting by due date / requested date / status, server pagination with total match counts. |
| 7 | Acting on many items and loans at once | **Done** | CSV item import with per-row failure report; bulk return with per-loan status report; CSV export of active loans. |
| 8 | Dashboard | **Done** | 4 headline metrics, status breakdown, custodian breakdown table, and 8-week returned loans trend line chart. |
| 9 | History you cannot rewrite | **Done** | Append-only `loan_events` audit log tracking actor, timestamp, and notes; zero edit/delete routes. |
| 10 | Overdue loan alerts | **Done** | Active overdue alert center with navbar badge count; librarian dismissal; automatic re-alert on new loan. |

---

## How much time did you actually spend?

- **Total time spent**: ~11.5 hours across the week.
- Structured into 7 focused sessions covering architecture, database, domain lifecycle engine, server-side search, dashboard analytics, bulk operations, and documentation.

---

## What would you do next, with another 12 hours?

1. **Reservation & Hold Queue (Stretch Goal)**: Allow members to queue a hold request for an item currently out on loan, automatically notifying them when returned.
2. **Barcode / QR-Code Scanning**: Integrate client camera scanning via `@zxing/library` for instant check-in/check-out of physical equipment tag barcodes.
3. **Automated Email Reminders**: Set up a daily cron job (via Vercel Cron) sending email reminders 48 hours prior to due dates using Resend/SendGrid.

---

## What are you least happy with in this codebase, and why?

- **Database Polling for Alert Badges**: The navbar count badge polls `/api/alerts/count` every 30 seconds. While completely functional and reliable, a Server-Sent Events (SSE) or WebSocket push approach would feel even more instantaneous without periodic HTTP polling overhead.
