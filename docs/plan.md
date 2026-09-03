# Plan

## Session Breakdown & Build Order

The development was structured into 7 distinct sessions of ~1.5–2 hours each:

### Session 1: Foundation & Authentication
- **Built**: Scaffolded Next.js 14 App Router, configured Tailwind CSS dark theme tokens, designed 7-table Prisma schema, implemented NextAuth.js Credentials provider with JWT role storage, middleware route protection, and database seed script.
- **Why this order**: Domain data models and authentication are preconditions for building catalogue items and role-restricted loan workflows.

### Session 2: Catalogue Management (Goal 2 & Goal 5)
- **Built**: Catalogue list UI with search, archive/restore soft delete, item creation/edit forms, item detail page with custodian tag management.
- **Why this order**: Catalogue items must exist before loans can be requested or issued against them.

### Session 3: Loan Lifecycle Engine & Rule Enforcement (Goal 3 & Goal 4)
- **Built**: Centralized transition engine (`src/lib/loan-rules.ts`), APIs for requesting, issuing, returning, and marking loans lost. Implemented dynamic read-time overdue computation and single open-loan item lock.
- **Why this order**: Establishing core domain lifecycle rules early guarantees that subsequent UI components conform to lifecycle constraints.

### Session 4: Finding Loans & Search Engine (Goal 6 & Goal 9)
- **Built**: Server-side loan list with text search (item title + borrower), status filters, multi-field sorting, pagination with total match counts. Created loan detail view with immutable audit timeline (`loan_events`).
- **Why this order**: Querying loans and viewing immutable timelines validates that state changes in Session 3 persist correctly.

### Session 5: Analytics Dashboard & Custodianship (Goal 5 & Goal 8)
- **Built**: Dashboard page featuring 4 headline metric cards, 8-week return line chart (Recharts), status breakdown bar chart, custodian breakdown table, and "My Items" custodian view.
- **Why this order**: Dashboard aggregates existing data across loans and items, benefiting from a seeded dataset.

### Session 6: Bulk Operations & Overdue Alerts (Goal 7 & Goal 10)
- **Built**: CSV bulk item import with per-row failure reporting, bulk loan return with per-loan status reporting, CSV export for active loans, and overdue alert center with navbar badge count and dismissal mechanics.
- **Why this order**: Bulk tools and alerts build upon all primary domain resources.

### Session 7: Seed Data, Documentation & Deployment
- **Built**: Comprehensive seed script with realistic asset names, historical loans, and overdue cases; filled documentation under `docs/`; prepared deployment setup.

---

## Estimated vs. Actual Time

| Task / Feature | Estimated | Actual | Notes / Variance |
|---|---|---|---|
| Project Scaffold & Auth | 1.5 hrs | 1.5 hrs | NextAuth JWT role callback required typing adjustments |
| Catalogue & Custodian CRUD | 2.0 hrs | 1.8 hrs | Built reusable card/table components |
| Loan Lifecycle & Validation | 2.5 hrs | 2.2 hrs | Transaction locks in Prisma simplified race safety |
| Server-Side Loan Search Engine | 2.0 hrs | 1.8 hrs | `prisma.$transaction` made total count + paginated query efficient |
| Bulk Operations (CSV & Return) | 2.0 hrs | 1.7 hrs | PapaParse handled edge cases cleanly |
| Dashboard & Charts | 1.5 hrs | 1.5 hrs | Recharts integrated cleanly with Next.js Client Components |
| Overdue Alerts & Re-alert | 1.5 hrs | 1.2 hrs | Schema-level unique constraint on `loanId` simplified re-alerting |
| **Total** | **13.0 hrs** | **11.7 hrs** | **Completed within budget** |

---

## What Was Cut When Short

1. **Barcode / QR-Code Check-in Scanning (Stretch Goal)**:
   - Deliberately omitted to focus on 100% adherence to all 10 primary required goals and documentation depth.
2. **WebSockets for Live Alert Badges**:
   - Replaced with lightweight 30-second polling to avoid websocket infrastructure overhead.
