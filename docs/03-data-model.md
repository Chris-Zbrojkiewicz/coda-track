# Data Model — V1 (CodaTrack)

## Goals of the data model
- Store practice activity as durable, auditable events (sessions)
- Keep logging friction low (no required metadata beyond time)
- Support weekly summaries and streaks without complex schema
- Keep room to add routines/exercises later without migration pain

---

## Core entities (V1)

### User
Represents an authenticated account.

**Fields**
- id (uuid, PK)
- email (string, unique) or auth_provider_id (string)
- display_name (string, optional)
- created_at (timestamp)
- updated_at (timestamp)

**Notes**
- Prefer provider-managed auth user table if using Supabase/Firebase/Auth.js
- Do not store sensitive auth data yourself

---

### PracticeSession
The atomic event: one practice session. This is the core of the product.

**Fields**
- id (uuid, PK)
- user_id (uuid, FK -> User.id)
- started_at (timestamp, required)
- ended_at (timestamp, required)
- duration_seconds (integer, required)
- note (text, optional)
- source (enum: "web" | "mobile", optional)
- created_at (timestamp)
- updated_at (timestamp)

**Constraints**
- ended_at >= started_at
- duration_seconds = ended_at - started_at (can be computed server-side)
- user_id is required; sessions are always owned by a user

**Indexes**
- (user_id, started_at desc)
- (user_id, ended_at desc)

---

## Derived metrics (computed, not stored in V1)

These metrics should be calculated from PracticeSession. Do not store aggregates initially.

### Weekly summary (for a given week)
- total_practice_seconds = sum(duration_seconds)
- sessions_count = count(*)
- practiced_days_count = count(distinct date(started_at))

### Streak (basic definition for V1)
- A "practice day" is any calendar day (user’s timezone) with >= 1 session
- Streak counts consecutive days ending today (or yesterday if not practiced yet today)

**Notes**
- Streak logic is a common source of bugs: define it here to avoid ambiguity
- Timezone: use user-local timezone if available, else default to UTC (or Europe/Copenhagen for early V1)

---

## Optional V1 entities (only if needed)
These are explicitly optional. Add only if your UI requires them now.

### Routine (optional)
Represents a named plan/template (not required for V1 logging).

**Fields**
- id (uuid, PK)
- user_id (uuid, FK)
- name (string)
- created_at (timestamp)
- updated_at (timestamp)

### PracticeSessionRoutine (optional)
Link a session to a routine.

**Fields**
- practice_session_id (uuid, FK)
- routine_id (uuid, FK)

---

## API operations implied by this model (V1)

### Write
- Create practice session:
  - Input: started_at, ended_at, optional note
  - Server computes: duration_seconds
- Update practice session note (optional)

### Read
- List sessions (recent): last N sessions for user
- Weekly summary: computed over a date range
- Streak: computed from distinct practice days

---

## Data access and security (V1 expectations)
- A user can only read/write their own PracticeSessions
- Enforce this at the database layer if possible (e.g., RLS policies in Postgres/Supabase)
- Never trust client-provided user_id

---

## Future extensions (explicitly not in V1)
- Exercise-level breakdown (Exercise entity + join table)
- Goals (Goal entity)
- Tags (Tag + join table)
- Attachments/media
- Sharing/public profiles
- Teacher/student relationships (Organization, Classroom, Membership)
