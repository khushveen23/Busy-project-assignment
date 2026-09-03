# Technical Decisions

Log of key technical architectural decisions made during the construction of the Asset Lending application.

---

## Decision 1: Next.js 14 App Router as Single Unified Full-Stack Framework

- **Chose:** Next.js 14 with App Router (React Server Components + API Routes).
- **Rejected:** Decoupled React SPA (Vite) frontend + separate Express/Node.js backend API.
- **Why:** Eliminates CORS configuration friction, provides server-side rendering for low-latency initial renders, allows type sharing between client and API routes, and enables single-click deployment to Vercel free tier.

---

## Decision 2: Storing Overdue as a Computed Read-Time State

- **Chose:** Computing overdue dynamically (`status === 'ISSUED' && dueDate < now()`) whenever loan data is fetched.
- **Rejected:** Storing an explicit `OVERDUE` string column value in the database updated via scheduled cron background jobs.
- **Why:** Goal 4 explicitly demands that overdue status is computed on read rather than stored as a persistent state. Persistent states risk falling out of sync if cron jobs fail, whereas computed properties guarantee 100% accuracy whenever viewed.

---

## Decision 3: NextAuth.js JWT Strategy for Session & Role Storage

- **Chose:** NextAuth.js with JWT session strategy, storing user `id` and `role` directly inside the encrypted JWT token payload.
- **Rejected:** Database-backed sessions (persisting every session row in PostgreSQL) or client-side localStorage tokens.
- **Why:** JWT sessions require zero database reads to authenticate incoming API requests or middleware route checks, avoiding database connection pool exhaustion on serverless hosting (Vercel).

---

## Decision 4: Client-Side CSV Parsing via PapaParse for Bulk Import

- **Chose:** Standard multipart file upload to Next.js API route with server-side PapaParse processing.
- **Rejected:** Client-side CSV parsing sending a large array of JSON objects to the backend API.
- **Later reversed:** Initially attempted client-side CSV parsing sending raw JSON arrays to `/api/items/import`.
  - **What changed my mind:** Large JSON payloads risked exceeding serverless payload limits (4MB), and validating file syntax on the server ensured consistent error formatting regardless of browser client quirks. Standardizing on server-side PapaParse stream processing fixed payload limits and kept per-row error reporting robust.

---

## Decision 5: Dedicated `loan_events` Table for Immutable Audit History

- **Chose:** Separate append-only `loan_events` table recording every state transition (`REQUESTED`, `ISSUED`, `RETURNED`, `LOST`, `NOTE`) along with `actorId`, `timestamp`, and `note`.
- **Rejected:** Storing event history inside a JSONB column on the `loans` table.
- **Why:** A dedicated SQL table with foreign keys to `users` and `loans` enforces relational integrity, enables fast querying of audit history, and makes it trivial to block `UPDATE` / `DELETE` operations at the application level to satisfy Goal 9 (history you cannot rewrite).
