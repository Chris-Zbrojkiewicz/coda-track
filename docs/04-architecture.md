# Architecture — V1 (CodaTrack)

## Objective
Deliver a V1 guitar practice tracking SaaS that is:
- Fast to use (logging friction < ~15 seconds of interaction)
- Secure (users can only access their own data)
- Simple to operate (minimal infrastructure)
- Portfolio-quality (clear layering, documented decisions, testable boundaries)

---

## System overview
The system is a single Next.js application that serves:
- The web UI (React)
- Server-side API endpoints (Route Handlers)
- Server-side rendering / server components where useful

A managed Postgres database (Supabase) is used for persistence.

**Key principle**
- UI changes frequently; the data model and access rules must remain stable.

---

## Components

### 1) Frontend (Next.js UI)
Responsibilities:
- Render dashboard and practice session flows
- Start/stop timer locally
- Send session events to the backend API
- Display weekly summary + streak

Non-responsibilities:
- Direct database access
- Trust decisions (authorization)
- Payment status enforcement logic (handled server-side)

### 2) Backend API (Next.js Route Handlers)
Responsibilities:
- Authenticate the user (via Auth.js session)
- Authorize all reads/writes by scoping to the current user
- Validate request input and enforce invariants (e.g., ended_at >= started_at)
- Compute derived metrics (weekly summary, streak) from stored sessions
- Provide a clean API boundary for the UI

Non-responsibilities (V1):
- Background job processing
- Realtime features

### 3) Database (Supabase Postgres — DB only)
Responsibilities:
- Durable storage of Users and PracticeSessions
- Indexing to support time-based queries
- Backup/restore via managed service

Non-responsibilities (V1):
- Supabase Auth
- Supabase RLS policies (authorization is in the app layer for V1)

Rationale:
- Using Supabase as DB-only keeps infra simple while still using a production-grade Postgres host.
- Authorization is implemented in code to demonstrate backend competence for portfolio purposes.

---

## Data ownership and trust boundaries

### Trust boundary
- The browser/client is untrusted.
- The API is trusted to enforce identity and authorization.
- The database is trusted to persist data but is not responsible for access control in V1.

### Authorization rule (non-negotiable)
- Every database read/write must include `WHERE user_id = currentUserId`.
- The client must never provide `user_id` for writes. The server derives it from the session.

---

## Key flows mapped to architecture

### Flow: Log a practice session
1. UI starts timer locally
2. UI stops timer and calls `POST /api/sessions`
3. API validates timestamps and computes duration server-side
4. API writes PracticeSession with `user_id` from session
5. UI refreshes recent sessions and summary

### Flow: View weekly summary + streak
1. UI calls `GET /api/summary?week=YYYY-MM-DD` (optional)
2. API queries sessions for user within week range
3. API computes totals + streak
4. UI displays summary cards

---

## API surface (V1)
- `POST /api/sessions` — create practice session
- `GET /api/sessions?limit=N` — list recent sessions
- `GET /api/summary?week=YYYY-MM-DD` — weekly totals + streak

Notes:
- Keep endpoints small and predictable.
- Prefer server-side computation for derived fields.

---

## Authentication strategy (V1)
- Auth.js (NextAuth) provides session management via secure cookies.
- V1 can start with a single provider (e.g., GitHub OAuth) for speed.
- Later: add email magic links or passwordless for broader user adoption.

Rationale:
- OAuth-first allows fast development and avoids building credential storage.
- The architecture remains the same regardless of provider.

---

## Persistence strategy
- Store raw events (PracticeSession) as the source of truth.
- Do not store aggregates (weekly totals/streak tables) in V1.
- Compute summaries on demand from sessions.

Rationale:
- Prevents drift between stored aggregates and raw data.
- Keeps schema stable and simplifies iteration.

---

## Error handling and reliability (V1)
- Validate all inputs in API routes.
- Return consistent JSON error shapes to the UI.
- Ensure idempotency-ready patterns (important later for payments/webhooks).

Minimal operational requirements:
- Logging in server routes (structured where possible)
- Basic health checks (optional)
- Database backups (managed by Supabase)

---

## Deployment (V1)
- Deploy the Next.js app to a Next-compatible host.
- Provide environment variables for:
  - database connection
  - Auth.js secrets/providers

Database:
- Supabase-hosted Postgres used by server routes only.

Notes:
- Avoid direct DB access from the client.
- For production serverless environments, use a pooled DB connection method if required.

---

## Out of scope (explicit)
- Realtime updates
- Multi-user collaboration / teacher-student model
- Audio analysis / pitch detection
- AI coaching
- Social/sharing feeds
- Mobile apps (native)

---

## Future evolution (planned extensions)
- Routines and exercise-level breakdown (new entities + joins)
- Goals and reminders
- Paid tier with Stripe (webhooks + subscription status)
- User timezone preference for streak accuracy
- Optional RLS migration if desired for defense-in-depth
