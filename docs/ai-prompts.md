# AI Prompts & Iteration Log

Log of AI prompts used during scaffolding, architecture planning, feature implementation, and debugging for the Asset Lending project.

---

## Category 1: Architecture Planning & Schema Design

### Prompt 1: Full-Stack Domain & Schema Scaffolding
> *"Analyze the assignment brief for the Asset Lending library system. Design a Prisma schema with PostgreSQL support covering 7 core tables: users with role enum (LIBRARIAN, MEMBER), catalogue items, loans with status enum, immutable loan events timeline, custodians join table, and overdue alert dismissals. Ensure foreign keys and indices match all 10 requirements."*
- **Outcome**: Produced clean 7-table schema with explicit relations and unique constraints.

---

## Category 2: Domain Rule Enforcement & Middleware

### Prompt 2: Centralized Loan Lifecycle State Machine
> *"Write a TypeScript helper `transitionLoan` in `src/lib/loan-rules.ts` that enforces state machine rules: Requested -> Issued -> Returned, Issued -> Lost. Validate that an item with any open loan (Requested or Issued) rejects new loan issue requests with HTTP 409 and descriptive error message. Execute updates inside a Prisma transaction that appends a `loan_events` row."*
- **Outcome**: Successfully generated atomic state transition helper handling race conditions and conflict errors.

---

## Category 3: Troubleshooting & Corrections (Prompt That Produced Wrong Output)

### Prompt 3: CSV Bulk Import API Setup (Failed Output & Resolution)
> *"Write a Next.js API route `/api/items/import` that receives a CSV file, parses it using PapaParse, and inserts catalogue items into the database."*
- **What produced bad/wrong output**: The initial draft used `prisma.catalogueItem.createMany({ data })`. However, `createMany` in Prisma fails the *entire batch* if a single row violates a unique constraint (such as a duplicate item code), violating Goal 7 which explicitly requires: *"the result is a per-row report naming exactly which rows failed and why, while every valid row is still imported."*
- **Correction Made**: I caught this during review and modified the implementation to loop over rows individually inside a try/catch block, tracking per-row success/failure in a `results` array while successfully persisting valid rows.

---

## Category 4: Analytics & Visualizations

### Prompt 4: Dashboard Aggregations & Recharts Data Formatting
> *"Create a Next.js API route `/api/dashboard` and Client Component dashboard that calculates 4 headline stats (items out, overdue items, returned this week, total items), status breakdown, custodian breakdown, and formats 8-week returned loan counts for a Recharts line chart."*
- **Outcome**: Generated analytics endpoint and visual dashboard cards with dark mode Tailwind formatting.
