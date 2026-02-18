# Data Model — V1 (CodaTrack)

## Goals of the data model
- Store practice activity as durable, auditable events (sessions)
- Keep logging friction low (no required metadata beyond time)
- Support weekly summaries and streaks without complex schema
- Keep room to add routines/exercises later without migration pain

---

## Platform decisions (V1)
- Frontend + backend: Next.js (App Router)
- Auth: Auth.js (NextAuth) with server-side session cookies
- Database: Supabase Postgres (database only; no Supabase Auth/RLS in V1)

## Database Layer

This project uses:

- PostgreSQL
- node-postgres (`pg`)
- Raw SQL queries
- Manual schema management

No ORM is used.

Schema changes are applied via SQL migrations executed manually or via deployment scripts.

**Implication**
- Authorization is enforced in the application layer:
  - Every query/mutation must be scoped to the authenticated user id.

---

## Core entities (V1)

### User
Represents an authenticated account, sourced from Auth.js.

**Source of truth**
- Auth.js manages identity and sessions.
- We persist a local User record for app-level metadata and relational integrity.

**Fields**
- id (string, PK) — matches Auth.js user id
- email (string, unique, required)
- name (string, optional)
- image (string, optional)
- created_at (timestamp)
- updated_at (timestamp)

**Notes**
- Do not store passwords yourself.
- If using Auth.js adapters, some tables may be created automatically (Account, Session, VerificationToken).
- The app should treat `User.id` as the stable identifier.

---

### PracticeSession
The atomic event: one practice session. This is the core of the product.

**Fields**
- id (uuid, PK)
- user_id (string, FK -> User.id, required)
- started_at (timestamp, required)
- ended_at (timestamp, required)
- duration_seconds (integer, required)
- note (text, optional)
- source (enum: "web" | "mobile", optional)
- created_at (timestamp)
- updated_at (timestamp)

**Constraints**
- ended_at >= started_at
- duration_seconds = ended_at - started_at
  - Prefer server-side computation to prevent tampering.

**Indexes**
- (user_id, started_at desc)
- (user_id, ended_at desc)

---

## Derived metrics (computed, not stored in V1)
Compute from PracticeSession. Do not store aggregates initially.

### Weekly summary (for a given week)
- total_practice_seconds = sum(duration_seconds)
- sessions_count = count(*)
- practiced_days_count = count(distinct date(started_at))

### Streak (basic definition for V1)
- A "practice day" is any calendar day (in the chosen timezone) with >= 1 session
- Streak counts consecutive practice days up to today (inclusive) if practiced today; otherwise up to yesterday

**Timezone rule (V1)**
- Use Europe/Copenhagen for day boundaries in V1 (documented, consistent)
- Future: store a per-user timezone preference

**Why this is documented here**
- Streak logic and day boundaries are a high-risk source of user mistrust if inconsistent.

---

## Optional V1 entities (only if needed)
Add only if UI requires them now. Default is to skip.

### Routine (optional)
Represents a named template (not required for V1 logging).

**Fields**
- id (uuid, PK)
- user_id (string, FK -> User.id)
- name (string)
- created_at (timestamp)
- updated_at (timestamp)

### PracticeSessionRoutine (optional)
Link a session to a routine.

**Fields**
- practice_session_id (uuid, FK -> PracticeSession.id)
- routine_id (uuid, FK -> Routine.id)

---

## API operations implied by this model (V1)

### Write
- Create practice session
  - Input: started_at, ended_at, optional note
  - Server computes: duration_seconds
  - Authorization: user_id set from session, never from client
- Update practice session note (optional)
  - Authorization: ensure session belongs to current user

### Read
- List sessions (recent): last N sessions for user
- Weekly summary: computed over a date range
- Streak: computed from distinct practice days

---

## Data access and security (V1 expectations)
- Authentication: required for all app routes and API routes (except marketing pages)
- Authorization: a user can only read/write their own PracticeSessions
- Enforce by scoping queries with `user_id = session.user.id`
- Never trust client-provided user_id (ignore it entirely if sent)

---

## Future extensions (explicitly not in V1)
- Exercise-level breakdown (Exercise entity + join table)
- Goals (Goal entity)
- Tags (Tag + join table)
- Attachments/media
- Sharing/public profiles
- Teacher/student relationships (Organization, Classroom, Membership)
- Realtime collaboration/multiplayer features
