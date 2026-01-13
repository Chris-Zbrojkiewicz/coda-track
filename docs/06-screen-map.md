# Screen Map — V1 (CodaTrack)

## Purpose of this document
This document maps **designed UI screens** to:
- User flows
- API endpoints
- Data requirements
- UI states (loading / empty / error)

It serves as the final bridge between design and implementation.

---

## Screen 1: Dashboard

### Design reference
- “Dashboard” screen with greeting, streak card, weekly summary, recent sessions, metronome/tuner widgets

### Purpose
- Primary home screen
- Show current progress and motivation
- Provide the main entry point to start a practice session

### Data required
- Weekly summary
- Current streak
- Recent practice sessions (last N)

### API calls
- `GET /api/summary`
  - On initial load
- `GET /api/sessions?limit=5`
  - On initial load

### UI states
- Loading:
  - Skeleton cards for summary and recent sessions
- Empty:
  - No sessions yet → “Start your first practice session”
- Error:
  - Inline error + retry button
- Success:
  - Render all cards

### Primary actions
- “Start Session”
- (Secondary) Start metronome / tuner (local-only in V1)

### Notes (V1 scope)
- Routine name (“Technical Shred V1”) is **display-only** in V1
- “Schedule” button is **non-functional / future**
- Metronome & tuner widgets are **local utilities**, no backend dependency

---

## Screen 2: Session Setup

### Design reference
- “Session Setup” with routine builder, focus areas, total duration, presets

### Purpose
- Prepare a structured practice session before starting

### Data required (V1)
- None required from backend (V1 simplification)

### API calls (V1)
- None

### UI states
- Default:
  - Static routine layout
- Interaction:
  - Adjust durations locally
  - Select preset (visual only)

### Primary actions
- “Start Session”

### Notes (important)
- This screen is **UI-first in V1**
- No routines, presets, or focus areas are persisted yet
- Starting a session transitions to Practice Timer
- Backend session logging starts when the user **ends** the session

---

## Screen 3: Practice Timer (Active Session)

### Design reference
- Large circular timer
- Session plan sidebar
- End Session button

### Purpose
- Focused, distraction-free practice execution

### Data required
- None initially
- Session start timestamp stored locally

### API calls
- `POST /api/sessions`
  - Triggered when user clicks “End Session”

### Client-side behavior
- Timer runs locally
- Start timestamp stored in memory
- End timestamp captured on “End Session”

### UI states
- Active:
  - Timer running
- Paused:
  - Timer paused (local-only)
- Ending:
  - Confirmation / transition state

### Primary actions
- Pause / Resume
- End Session

### Notes
- Segment-level tracking is **visual only** in V1
- Only one PracticeSession is created per timer run

---

## Screen 4: Progress & Insights

### Design reference
- “Progress & Insights” analytics dashboard
- Practice volume chart, streak, focus breakdown

### Purpose
- Visualize consistency and long-term progress

### Data required (V1)
- Weekly summaries
- Recent sessions

### API calls
- `GET /api/summary`
- `GET /api/sessions?limit=30` (or similar)

### UI states
- Loading:
  - Chart skeletons
- Empty:
  - “No data yet” messaging
- Success:
  - Render charts and stats

### Notes (scope control)
- Focus breakdown is **derived client-side or stubbed**
- Week / Month / Year toggles:
  - Only “Week” is functional in V1
- Charts can be approximate in V1 (no heavy analytics yet)

---

## Screen 5: Settings

### Design reference
- Settings with audio, alerts, metronome, account sections

### Purpose
- Configure user preferences

### Data required (V1)
- None persisted server-side

### API calls (V1)
- None

### UI states
- Default:
  - Local preferences only

### Notes
- Settings are **local-only in V1**
- No backend persistence yet
- This is acceptable for V1 and can be expanded later

---

## Global UI rules (V1)

### Authentication
- All screens except marketing require authentication
- Unauthenticated users are redirected to sign-in

### Error handling
- API failures must not break navigation
- Retry options provided where applicable

### Navigation
- Sidebar navigation is client-side routing
- No deep-linking requirements in V1

---

## V1 implementation summary

### Backend-connected screens
- Dashboard
- Practice Timer (on session end)
- Progress & Insights

### UI-only screens (V1)
- Session Setup
- Settings

### Backend endpoints used
- `GET /api/summary`
- `GET /api/sessions`
- `POST /api/sessions`

---

## Explicitly deferred (not V1)
- Routine persistence
- Segment-level practice tracking
- Advanced analytics
- Cloud-synced settings
- Scheduling
- Notifications
