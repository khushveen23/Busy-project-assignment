# Database Schema

## Table-by-Table Schema Specification

### 1. `users`
- `id`: `String` (UUID, Primary Key)
- `email`: `String` (Unique, Indexed)
- `passwordHash`: `String` (Bcrypt hash)
- `name`: `String`
- `role`: `Enum(LIBRARIAN, MEMBER)` (Default: `MEMBER`)
- `createdAt`: `DateTime` (Default: `now()`)

### 2. `catalogue_items`
- `id`: `String` (UUID, Primary Key)
- `title`: `String`
- `category`: `String`
- `code`: `String` (Unique, Indexed, e.g. `CAM-001`)
- `archived`: `Boolean` (Default: `false`)
- `createdAt`: `DateTime` (Default: `now()`)
- `updatedAt`: `DateTime` (Updated automatically)

### 3. `loans`
- `id`: `String` (UUID, Primary Key)
- `status`: `Enum(REQUESTED, ISSUED, RETURNED, LOST)` (Default: `REQUESTED`)
- `requestedAt`: `DateTime` (Default: `now()`)
- `issuedAt`: `DateTime?` (Nullable)
- `dueDate`: `DateTime?` (Nullable)
- `returnedAt`: `DateTime?` (Nullable)
- `lostAt`: `DateTime?` (Nullable)
- `itemId`: `String` (Foreign Key → `catalogue_items.id`)
- `borrowerId`: `String` (Foreign Key → `users.id`)
- `issuedById`: `String?` (Foreign Key → `users.id`, Nullable)
- `processedById`: `String?` (Foreign Key → `users.id`, Nullable)

### 4. `loan_events` (Immutable Audit Trail)
- `id`: `String` (UUID, Primary Key)
- `eventType`: `Enum(REQUESTED, ISSUED, RETURNED, LOST, NOTE)`
- `note`: `String?` (Nullable)
- `createdAt`: `DateTime` (Default: `now()`)
- `loanId`: `String` (Foreign Key → `loans.id`)
- `actorId`: `String` (Foreign Key → `users.id`)

### 5. `overdue_alert_dismissals`
- `id`: `String` (UUID, Primary Key)
- `loanId`: `String` (Unique Foreign Key → `loans.id`)
- `dismissedById`: `String` (Foreign Key → `users.id`)
- `dismissedAt`: `DateTime` (Default: `now()`)

### 6. `_ItemCustodians` (Implicit Prisma Many-to-Many Join Table)
- `A`: `String` (Foreign Key → `catalogue_items.id`)
- `B`: `String` (Foreign Key → `users.id`)
- Primary Key: `(A, B)`

---

## Relationships: One-to-Many vs. Many-to-Many

- **One-to-Many**:
  - `User` → `Loan` (as borrower): One user can request/hold many loans over time.
  - `User` → `Loan` (as issuer): One librarian can issue many loans.
  - `User` → `Loan` (as processor): One librarian can process returns/losses for many loans.
  - `CatalogueItem` → `Loan`: One catalogue title/code can have multiple historical loan records.
  - `Loan` → `LoanEvent`: One loan has many timeline history events.
  - `User` → `LoanEvent`: One user can produce many event records across different loans.

- **Many-to-Many**:
  - `CatalogueItem` ↔ `User` (as Custodians): A catalogue item can have multiple librarian custodians, and a librarian can be a custodian for multiple items.

---

## Constraints: Database vs. Application Code

| Constraint | Enforced By | Rationale |
|---|---|---|
| Item `code` Uniqueness | **Database** (`@unique`) | Prevents duplicate physical tag codes even under concurrent CSV imports. |
| User `email` Uniqueness | **Database** (`@unique`) | Prevents duplicate account registrations at storage level. |
| Alert Dismissal per Loan | **Database** (`@unique`) | Guarantees at most one dismissal record per loan instance. |
| Single Active Loan per Item | **Application Code** | Checking if an item has an existing `REQUESTED` or `ISSUED` loan involves business status semantics that vary per action; Prisma query transaction ensures race condition safety. |
| Overdue Status Calculation | **Application Code** (Read-time) | Goal 4 specifies overdue is computed dynamically (`status === ISSUED && dueDate < now`) rather than stored, avoiding cron update sync issues. |
| Immutable Loan Events | **Application Code** | API layer provides zero routes for `UPDATE` or `DELETE` on `loan_events`, making audit logs append-only. |

---

## Deliberate Denormalisation

- **`status` on `loans` table**: Stored directly on `loans` rather than inferred solely by looking up the latest row in `loan_events`.
  - *Why*: Allows ultra-fast SQL query indexing and filtering (`WHERE status = 'ISSUED'`) across thousands of loan records without requiring costly subquery joins on the event history table.

---

## What Would Break First at 100x Data (e.g. 1 Million Loans)?

1. **Unindexed Text Search on Titles & Borrowers**:
   - `ILIKE %search%` queries across `catalogue_items.title` and `users.name` would cause full table scans.
   - *Fix*: Introduce PostgreSQL `pg_trgm` GIN indexes or full-text search indexes (`tsvector`).

2. **Dashboard Analytics In-Memory Aggregations**:
   - Calculating 8-week return trends via sequential `prisma.loan.count()` loop in Node.js would create database roundtrip overhead.
   - *Fix*: Replace with a single SQL raw aggregation query using `date_trunc('week', returned_at)` or materialized view refreshed periodically.
