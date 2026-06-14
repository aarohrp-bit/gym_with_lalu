# Gym with Lalu

A personal, offline-first 6-day gym companion built as an installable PWA (React).
No backend, no accounts, no cloud — everything lives locally on the device.

## The idea
- **6 training days + Sunday rest.** Each weekday is locked to one muscle category
  (Shoulders, Chest, Triceps, Legs, Back, Biceps).
- **Target 5 points/day.** Finish any 5 things from the day's stack to complete the day.
- **Two card types.** Type A = one exercise = 1 point (double-tap to flip to coaching,
  swipe right to complete). Type B = a 12-minute timed circuit of 6 mini-exercises = 1 point.
- **5-minute guard** between every completion (anti-accident lock).
- **Least-done-first** ordering nudges variety — unless a seed is active.
- **Seeds (Minecraft-style).** Two people typing the same seed get an identical week
  (same day→category layout and card order), deterministic across devices. A seed lasts one week.
- **Profiles.** A 4-digit PIN per person (soft lock) + guest mode. One profile can be the
  auto-loading **default**.

## Run it

```bash
cd frontend
yarn install
yarn start      # dev server
yarn build      # production build into frontend/build
```

The production build is a static PWA — serve `frontend/build` with any static host.
After one online load it works fully offline (the service worker precaches the app shell
and all exercise images).

## Project layout
```
frontend/
  public/
    exercises/            # exercise images (.webp, keyed by short id)
    manifest.json         # PWA manifest (dumbbell icon, standalone)
    service-worker.js     # app-shell + image precache, offline-first fetch
  src/
    data/exercises.js     # the exercise database (names, image keys, coaching text, circuits)
    data/categoryBlurbs.js
    lib/storage.js        # localStorage: profiles, progress, counts, weeks, seeds, default
    lib/week.js           # Monday-based week bucketing
    lib/weekgen.js        # deterministic RNG, seeded/random week generation, 3-day refresh rule
    components/CircuitRunner.jsx
    pages/                # ProfileSelect, AddProfile, PinPad, Dashboard, DayDetail, Workout, Summary
```

## Rules reference
- 5 points = day done. A card = 1 pt. B circuit (6 minis) = 1 pt. 5A or 4A+1B.
- B circuits live only on the Chest day (B2) and the Biceps day (B1).
- Seeded weeks disable least-done sorting and use the seed's fixed order.
- Non-seed weeks never place a category within 3 days of its previous-week slot.
- All data is local per device. Clearing site data wipes it. Guest history isn't tracked long-term.
