# API Contract — V1 (CodaTrack)

## Overview

This document defines the V1 HTTP API contract between the Next.js UI and the Next.js backend (Route Handlers).

**Principles**

- All endpoints require authentication unless explicitly stated.
- The client is untrusted; the server derives `user_id` from the authenticated session.
- Inputs are validated server-side.
- Derived values (e.g. duration) are computed server-side.
- Responses are JSON.

**Base URL**

- Local: `http://localhost:3000`
- Production: same origin as deployed app

---

## Authentication

- Authentication is handled via Auth.js (NextAuth) using secure cookies.
- Requests from the browser automatically include cookies when same-origin.
- Unauthenticated requests return `401 Unauthorized`.

**Standard auth error**

```json
{ "error": "Unauthorized" }
```

---

## Shared data types

### PracticeSession

Returned when creating or listing practice sessions.

```json
{
  "id": "uuid",
  "startedAt": "2026-01-13T10:00:00.000Z",
  "endedAt": "2026-01-13T10:30:00.000Z",
  "durationSeconds": 1800,
  "note": "Alternate picking",
  "source": "web",
  "createdAt": "2026-01-13T10:30:02.000Z"
}
```

Notes:

- All timestamps are ISO 8601 strings in UTC.
- `note` and `source` are optional.

---

### WeeklySummary

```json
{
  "weekStart": "2026-01-12T00:00:00.000Z",
  "weekEnd": "2026-01-19T00:00:00.000Z",
  "totalSeconds": 5400,
  "sessionsCount": 3,
  "practicedDaysCount": 3
}
```

---

### Streak

```json
{ "streak": 7 }
```

---

## Error format

All errors use a minimal, consistent shape.

```json
{ "error": "Human readable message" }
```

**Common status codes**

- `400 Bad Request` — validation error
- `401 Unauthorized` — not authenticated
- `404 Not Found` — resource not found or not owned by user
- `500 Internal Server Error` — unexpected failure

---

## Endpoints

---

## 1) Create practice session

Creates a practice session for the authenticated user.

**Method**

- `POST /api/sessions`

**Auth**

- Required

**Request body**
Required:

- `started_at` — ISO timestamp
- `ended_at` — ISO timestamp

Optional:

- `note` — string
- `source` — short string (e.g. `"web"`, `"mobile"`)

Example:

```json
{
  "started_at": "2026-01-13T10:00:00.000Z",
  "ended_at": "2026-01-13T10:30:00.000Z",
  "note": "Alternate picking",
  "source": "web"
}
```

**Server behavior**

- `user_id` is derived from the authenticated session.
- Client-provided `user_id` is ignored if present.
- Validates timestamps and ordering.
- Computes `durationSeconds` server-side.

**Success**

- `201 Created`

```json
{
  "session": {
    /* PracticeSession */
  }
}
```

**Validation error**

- `400 Bad Request`

```json
{ "error": "ended_at must be >= started_at" }
```

---

## 2) List recent practice sessions

Returns recent sessions for the authenticated user.

**Method**

- `GET /api/sessions?limit=N`

**Auth**

- Required

**Query parameters**

- `limit` (optional, default: 20, max: 100)

**Success**

- `200 OK`

```json
{
  "sessions": [
    {
      /* PracticeSession */
    },
    {
      /* PracticeSession */
    }
  ]
}
```

---

## 3) Weekly summary and streak

Returns weekly totals and the current practice streak.

**Method**

- `GET /api/summary?week=YYYY-MM-DD`

**Auth**

- Required

**Query parameters**

- `week` (optional): anchor date in `YYYY-MM-DD` format
  - Defaults to the current week if omitted.

**Week boundaries (V1)**

- Timezone: Central European Time (CET)
- Week starts on Monday

**Success**

- `200 OK`

```json
{
  "summary": {
    /* WeeklySummary */
  },
  "streak": { "streak": 7 }
}
```

**Validation error**

- `400 Bad Request`

```json
{ "error": "Invalid week parameter" }
```

---

## Authorization rules (non-negotiable)

- All reads and writes are scoped to the authenticated user.
- The server must enforce ownership checks on every operation.
- If a resource does not exist or is not owned by the user, return `404`.

---

## Non-functional requirements (V1)

- Typical responses should be < 300ms under normal load.
- Endpoints should be written idempotency-ready (important for future billing/webhooks).
- Server should log validation errors and unexpected failures (without leaking secrets).

---

## Explicitly out of scope (V1)

- Editing or deleting sessions
- Billing and subscriptions
- Realtime updates
- Routines, goals, or tags
- Social or sharing features
