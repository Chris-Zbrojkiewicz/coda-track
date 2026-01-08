# User Flows — V1

## Flow 1: First-time user (onboarding)

### Entry point
- User opens the app for the first time

### Steps
1. User sees a short product intro and value statement
2. User signs up or logs in
3. User lands on the main dashboard with an empty state
4. User is prompted to start their first practice session

### Exit condition (success)
- User understands what the app does and how to start practicing

---

## Flow 2: Log a practice session (core flow)

### Entry point
- User is on the main dashboard

### Steps
1. User taps "Start practice"
2. App starts a timer automatically
3. User practices
4. User taps "Stop practice"
5. App shows a lightweight confirmation with:
   - Duration (auto-calculated)
   - Optional note field
6. Session is saved automatically

### Exit condition (success)
- Practice session is logged with minimal friction

---

## Flow 3: View weekly summary

### Entry point
- User opens the app after having logged at least one session

### Steps
1. User sees a weekly summary section on the dashboard
2. Summary shows:
   - Total practice time this week
   - Number of sessions
   - Current streak
3. User can switch between weeks (optional in V1)

### Exit condition (success)
- User understands their recent practice activity at a glance

---

## Flow 4: Returning user

### Entry point
- User opens the app on a new day

### Steps
1. App loads the dashboard
2. User sees today's status (practiced today or not)
3. Primary action is clearly visible: "Start practice"

### Exit condition (success)
- User can immediately start practicing without decision fatigue
