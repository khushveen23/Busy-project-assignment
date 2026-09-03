# Architecture

## Moving Pieces & Communication

The Asset Lending system is built as a unified, monolithic full-stack application using **Next.js 14 (App Router)** and **TypeScript**. 

1. **Client Layer (Browser)**:
   - Built using React Server Components (RSC) for initial page renders and low-latency data fetching.
   - Client Components handle dynamic user interactions (forms, search filters, state transitions, charts via Recharts, CSV upload parsing via PapaParse).
   - Styled with Tailwind CSS and Radix UI primitive design system tokens.

2. **Application & API Layer (Next.js Node.js Server)**:
   - **NextAuth.js (v4)**: Manages authentication using standard JWT sessions. Enforces user roles (`LIBRARIAN` vs `MEMBER`) in JWT payload and server-side middleware (`src/middleware.ts`).
   - **Domain Logic (`src/lib/loan-rules.ts`)**: Centralized state transition engine that validates lifecycle moves (*Requested → Issued → Returned*, *Issued → Lost*) and enforces business invariants (e.g. refusing double-loaning of active items).
   - **API Endpoints (`src/app/api/...`)**: RESTful endpoints returning JSON responses with HTTP status codes for CRUD, bulk operations, and CSV streaming.

3. **Data Layer (PostgreSQL via Supabase)**:
   - **Prisma ORM**: Interfaces between Node.js and PostgreSQL with strict TypeScript types.
   - 7 relational tables: `users`, `catalogue_items`, `loans`, `loan_events`, `overdue_alert_dismissals`, and `_ItemCustodians` join table.

## Where Each Piece Runs

- **Browser**: React Client Components, stateful UI hooks, PapaParse CSV parsing.
- **Serverless / Vercel Edge/Node environment**: Next.js App Router, Server Actions, NextAuth JWT validation, Prisma client execution.
- **Database Server (Supabase Managed Cloud)**: Hosted PostgreSQL engine executing transaction locks, foreign key constraints, unique indexing, and cascade rules.

## Request Path for a Representative User Action: "Librarian Issues a Loan"

1. **Client Action**: Librarian clicks "Issue Item" on `/loans/[id]` with a chosen due date (`2026-09-15`) and note.
2. **HTTP Dispatch**: Client submits a `PATCH` request to `/api/loans/[id]` with `{ action: 'issue', dueDate, note }`.
3. **Middleware Guard**: `src/middleware.ts` verifies the session JWT token. If non-librarian or unauthenticated, rejects with `401/403`.
4. **Auth Check**: `requireLibrarian()` helper confirms role from JWT session in server runtime.
5. **Domain Validation (`transitionLoan`)**:
   - Fetches loan from Prisma. Verifies status is `REQUESTED`.
   - Queries `prisma.loan.findFirst()` to check if the target `itemId` has any existing open loan (`REQUESTED` or `ISSUED`).
   - If an open loan exists, aborts with HTTP `409 Conflict` and explicit error message.
6. **Database Transaction (`prisma.$transaction`)**:
   - Updates `loans` status to `ISSUED`, sets `issuedAt = now()`, `dueDate`, `issuedById = librarian.id`.
   - Inserts immutable `loan_events` row with `eventType = 'ISSUED'`, `actorId`, `note`.
7. **Client Response**: Returns updated loan JSON. UI re-renders status badge to `Issued`, renders success feedback, and appends the immutable event to the timeline.

## What Was Decided *Not* to Build, and Why

1. **WebSockets / Real-Time Sockets**:
   - *Why rejected*: Added server state complexity and infrastructure requirements beyond free tier constraints.
   - *Alternative chosen*: Short-polling interval (30s) for navigation alert badge and standard page revalidation.

2. **Client-side State Management Library (Redux/Zustand)**:
   - *Why rejected*: Next.js App Router server components and URL search parameters manage page state cleanly without client store boilerplate.

3. **Separate Express/NestJS Backend Repository**:
   - *Why rejected*: Next.js API routes provide type-safe full-stack integration in a single unified codebase, simplifying deployment to Vercel.
