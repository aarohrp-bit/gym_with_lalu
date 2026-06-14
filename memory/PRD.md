# Gym with Lalu — PRD

## Original problem statement
Build a Progressive Web App (PWA) called "Gym with Lalu" — a personal 6-day gym workout tracker for two users, fully installable to an Android home screen and working offline. React. No backend; everything in localStorage / IndexedDB. No login server, no cloud.

## Phase 2 scope (DELIVERED 2026-02-14)
1. Day Detail rewritten as an intro screen: category title, "Trains" line, "About" blurb, points indicator `n / 5 done`, and an "Enter workout" button. Rest day shows no Enter button.
2. New `/workout/:day` Card Stack screen — Type A cards only, one card at a time, swipe-right to complete, double-tap to flip to coaching, counter `n / 5`, peek-behind stack effect, day completes at exactly 5 points.
3. New `/summary/:day` Daily Summary screen — lists each completed exercise with HH:MM finish time, total session duration (first → last completion), and "Back to Week" button. Marks the day as Done on the dashboard.
4. Persistence per `(profile, weekStart, dayNum)` in `localStorage.workouts` — closing & reopening on the same day restores points and completed list; duplicates prevented.
5. Type B cards intentionally excluded from the workout stack (deferred to a later phase).


1. PWA: manifest (`/manifest.json`, standalone, dumbbell SVG icon, theme `#020617`) + service worker (`/service-worker.js`, app-shell cache, install + activate + fetch handlers) + registration in `index.html`. Installable via Chrome "Add to Home Screen".
2. Exercise database (hardcoded, in `/app/frontend/src/data/exercises.js`):
   - 6 training days × 8 cards each. Sunday = Rest.
   - Day 2 (Chest) and Day 6 (Biceps) each include one CIRCUIT card (type "B") with 6 mini-exercises.
   - Each card: `id, day, name, type ('A'|'B'), howTo (placeholder), whatItDoes (placeholder), circuit`.
3. Profile system:
   - Profile Select screen shows profiles list + "Add profile" + "Continue as Guest".
   - Add Profile: name → 4-digit PIN pad → profile created → dashboard.
   - PIN gate on existing profile selection (shake + error on wrong PIN).
   - Guest mode bypasses PIN.
4. Week Dashboard:
   - 7 tiles: Mon=Shoulders, Tue=Chest, Wed=Triceps, Thu=Legs, Fri=Back, Sat=Biceps, Sun=Rest.
   - Status badge per tile: Pending / Done / Skipped.
   - Header "X of 6 days done this week".
   - Auto-reset on Monday via `mondayKey()` weekly bucket.
5. Day Detail screen with 8 cards, grey placeholder images, circuit chip rendering, mark Done/Pending/Skipped action bar.

## User personas
- Lalu (primary user) and a second household user (two-user PWA).
- Personal tool, mobile-first, offline-first.

## Core requirements (static)
- Mobile-first, dark theme, premium minimal aesthetic (slate + indigo accent).
- No backend, no cloud, no login.
- PWA installable + offline.
- All interactive elements have `data-testid`.

## What's been implemented (2026-02-14)
- [x] PWA manifest + service worker + SW registration in `index.html`.
- [x] LocalStorage CRUD for profiles + per-week progress (`/app/frontend/src/lib/storage.js`).
- [x] Monday-based week key + auto reset (`/app/frontend/src/lib/week.js`).
- [x] Routes: `/`, `/add-profile`, `/pin/:profileId`, `/dashboard`, `/day/:day`.
- [x] Hardcoded 6-day exercise DB with placeholder how/what text and two circuit cards.
- [x] Status badges + counter on dashboard.
- [x] DayDetail with grey placeholder image boxes + circuit mini-exercise chips.
- [x] Verified by testing agent (frontend, 14/14 flows, 100% success).

## Tech
- React 19 + react-router-dom 7 + framer-motion + lucide-react + tailwind 3.
- Fonts: Barlow Condensed (display) + DM Sans (body).
- Colors: `bg #020617`, `surface #0F172A`, accent `#818CF8`.

## Backlog (Prioritized) — for future phases
### P0 (next)
- [ ] Full coaching text for `howTo` and `whatItDoes` on every exercise (user will paste).
- [ ] Real exercise images (replace grey placeholders).
- [ ] Per-exercise sets/reps/weight logging + persistence per week.

### P1
- [ ] Rest timer between sets (with vibration on PWA).
- [ ] Circuit run-through screen (timed cycle of 6 mini-exercises with vibration cues).
- [ ] Weekly history view & streaks.

### P2
- [ ] CSV export / share progress.
- [ ] Optional cloud sync (export/import JSON between devices via QR or file).
- [ ] Edit/delete profile, reset PIN.
