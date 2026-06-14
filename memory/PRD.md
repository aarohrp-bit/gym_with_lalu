# Gym with Lalu — PRD

## Original problem statement
Build a Progressive Web App (PWA) called "Gym with Lalu" — a personal 6-day gym workout tracker for two users, fully installable to an Android home screen and working offline. React. No backend; everything in localStorage / IndexedDB. No login server, no cloud.

## Phase 3 scope (DELIVERED 2026-02-14)
1. Type B circuit cards now appear in the Day 2 (B2 Power & Conditioning) and Day 6 (B1 Cardio Box) workout stacks at idx 0 (will be re-sorted by least-done in Phase 4).
2. On the stack, B card renders a circuit variant: name + 6 mini-exercise list + Start button. No swipe-to-complete on the outer card.
3. `CircuitRunner.jsx` — full-screen z-50 overlay (locks the rest of the app):
   - Abort fixed at top → confirmation dialog → returns card to stack, no point/penalty.
   - Horizontal sub-stack of 6 mini-cards, swipe left/right to navigate, double-tap to flip to coaching.
   - 12:00 countdown fixed at bottom; Finish button disabled until 0:00.
   - Dev hook: `?fastTimer=1` (persisted via sessionStorage) reduces timer to 3s for testability.
4. Finish at 0:00 → `addCompletion(...)` with the B card id → +1 point in the shared 5/day pool → card removed from stack; same auto-redirect to `/summary/:day` at 5 fires.
5. Summary lists the circuit completion like any other exercise (name + HH:MM finish time).


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

## Phase 4 + 5 (DELIVERED 2026-06-14) — project finished
1. **Weekly generation (`lib/weekgen.js`)** — each weekday is mapped to a muscle category.
   Non-seed weeks are randomly shuffled with the "no category within 3 days of last week's
   slot" refresh rule (re-roll until satisfied; verified 0 violations over 200 consecutive weeks).
2. **Seed system** — deterministic `cyrb128` + `mulberry32` RNG drives a Fisher–Yates shuffle
   of both the day→category layout and per-category card order. Same seed → identical week on
   any device (verified). Seeds disable least-done sorting and last exactly one week.
   Dashboard has an "Enter seed" field, a seed banner with clear, and a "New week" button.
3. **5-minute guard** and **least-done-first sorting** wired through the week/category resolver.
4. **Default profile** — star toggle on the Profile Select screen; the default auto-loads on a
   fresh launch and is skipped after an explicit logout.
5. **Real images** — all placeholder boxes replaced with the exercise/mini-exercise images
   (`.webp`, keyed by short id in `data/exercises.js`). The 363 MB `.png` set was removed in
   favour of a 4 MB `.webp` set.
6. **Full coaching text** — every A exercise and every circuit mini-exercise now has real
   "How to perform" + "What it does" text.
7. **Offline hardening** — the service worker precaches the app shell **and all 58 images** on
   install, so the whole app works in airplane mode after one online visit.
8. **Bug fixes** — removed the broken `@emergentbase/visual-edits` private dependency (was a
   403 build blocker), removed the non-existent PNG icon entries from the manifest, and removed
   the external Emergent badge/script so the app is fully self-contained and offline-capable.

## Final UX pass (DELIVERED 2026-06-14) — Android-ready
- **Gestures reworked** (axis-locked, no free/diagonal drag via `dragDirectionLock`):
  swipe **right** = finish exercise; swipe **up/down** = browse the remaining (not-done) cards;
  double-tap = flip. Cards snap back (`dragSnapToOrigin`) and use a directional carousel
  (`AnimatePresence`) so the next card actually appears (fixes the stuck-card bug).
- **Type B**: cannot be finished by swiping — Start the circuit; when the 10-minute timer ends,
  Finish marks the point and removes the card. If <5 points the next card shows; at 5 the summary opens.
- **Circuit timer set to 10:00** (was 12:00).
- **CircuitRunner** constrained to mobile width (`max-w-md`) so it no longer blows up to full-screen
  on wide/desktop windows; sub-cards are axis-locked too.
- **In-app confirm dialogs** replace `window.confirm` for clear-seed, new-week, and restart-day
  (consistent look on Android, no browser chrome).
- **Applying a seed / starting a new week** now also resets the recovery-lock timer and this
  week's progress.
- **Card height** maximised to fill the screen; counter row compacted.
- **Dashboard "Pending" badge** shows only on today's scheduled day; past undone training days
  read as "Skipped"; future days show no badge.
- **Native feel**: global `user-select: none` + no tap-highlight/callout (inputs still selectable).

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
