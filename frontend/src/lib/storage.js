// LocalStorage helpers for Gym with Lalu (no backend)

const KEY = "gym_lalu_v1";

import { generateWeek } from "@/lib/weekgen";

const empty = () => ({ profiles: [], progress: {}, workouts: {}, counts: {}, lastCompletionAt: {}, weeks: {}, defaultProfileId: null });

// Per-day workout target — day is "done" at exactly this many A-card completions.
export const POINTS_TARGET = 5;

// Five-minute completion guard (between every A swipe and every B Finish).
export const GUARD_SECONDS_REAL = 5 * 60;
export const GUARD_SECONDS_FAST = 5;
export const getGuardSeconds = () => {
  if (typeof window === "undefined") return GUARD_SECONDS_REAL;
  const fast =
    window.sessionStorage?.getItem("fastGuard") === "1" ||
    window.location.search.includes("fastGuard=1");
  return fast ? GUARD_SECONDS_FAST : GUARD_SECONDS_REAL;
};

export const load = () => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return empty();
    parsed.profiles ||= [];
    parsed.progress ||= {};
    parsed.workouts ||= {};
    parsed.counts ||= {};
    parsed.lastCompletionAt ||= {};
    parsed.weeks ||= {};
    if (!("defaultProfileId" in parsed)) parsed.defaultProfileId = null;
    return parsed;
  } catch {
    return empty();
  }
};

export const save = (data) => {
  localStorage.setItem(KEY, JSON.stringify(data));
};

export const addProfile = (name, pin) => {
  const data = load();
  const profile = {
    id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim(),
    pin: String(pin),
    createdAt: new Date().toISOString(),
  };
  data.profiles.push(profile);
  save(data);
  return profile;
};

export const verifyPin = (profileId, pin) => {
  const data = load();
  const p = data.profiles.find((x) => x.id === profileId);
  if (!p) return false;
  return p.pin === String(pin);
};

export const getProfile = (profileId) => {
  const data = load();
  return data.profiles.find((x) => x.id === profileId) || null;
};

// Progress shape: progress[profileId][weekStartIso] = { 1: "pending"|"done"|"skipped", ... }
export const getWeekProgress = (profileId, weekStartIso) => {
  const data = load();
  return (data.progress[profileId] && data.progress[profileId][weekStartIso]) || {};
};

export const setDayStatus = (profileId, weekStartIso, dayNum, status) => {
  const data = load();
  data.progress[profileId] ||= {};
  data.progress[profileId][weekStartIso] ||= {};
  data.progress[profileId][weekStartIso][dayNum] = status;
  save(data);
};

// ── Workouts ────────────────────────────────────────────────────────────────
// workouts[profileId][weekStartIso][dayNum] = {
//   completions: [{ exerciseId, name, completedAt: ISO }],
//   dayCompleted: boolean,
//   startedAt: ISO,
//   finishedAt: ISO | null
// }
export const getWorkout = (profileId, weekStartIso, dayNum) => {
  const data = load();
  return (
    (data.workouts[profileId] &&
      data.workouts[profileId][weekStartIso] &&
      data.workouts[profileId][weekStartIso][dayNum]) || null
  );
};

const ensureWorkout = (data, profileId, weekStartIso, dayNum) => {
  data.workouts[profileId] ||= {};
  data.workouts[profileId][weekStartIso] ||= {};
  if (!data.workouts[profileId][weekStartIso][dayNum]) {
    data.workouts[profileId][weekStartIso][dayNum] = {
      completions: [],
      dayCompleted: false,
      startedAt: new Date().toISOString(),
      finishedAt: null,
    };
  }
  return data.workouts[profileId][weekStartIso][dayNum];
};

export const addCompletion = (profileId, weekStartIso, dayNum, exerciseId, name) => {
  const data = load();
  const w = ensureWorkout(data, profileId, weekStartIso, dayNum);
  // Prevent duplicates
  if (w.completions.find((c) => c.exerciseId === exerciseId)) {
    save(data);
    return w;
  }
  if (w.dayCompleted) {
    save(data);
    return w;
  }
  w.completions.push({
    exerciseId,
    name,
    completedAt: new Date().toISOString(),
  });
  // Lifetime counts (not for guest) + last completion timestamp (always)
  if (profileId !== "guest") {
    data.counts[profileId] ||= {};
    data.counts[profileId][exerciseId] = (data.counts[profileId][exerciseId] || 0) + 1;
  }
  data.lastCompletionAt[profileId] = new Date().toISOString();
  if (w.completions.length >= POINTS_TARGET) {
    w.dayCompleted = true;
    w.finishedAt = new Date().toISOString();
    data.progress[profileId] ||= {};
    data.progress[profileId][weekStartIso] ||= {};
    data.progress[profileId][weekStartIso][dayNum] = "done";
  }
  save(data);
  return w;
};

export const resetWorkout = (profileId, weekStartIso, dayNum) => {
  const data = load();
  if (data.workouts[profileId]?.[weekStartIso]?.[dayNum]) {
    delete data.workouts[profileId][weekStartIso][dayNum];
  }
  if (data.progress[profileId]?.[weekStartIso]?.[dayNum] === "done") {
    delete data.progress[profileId][weekStartIso][dayNum];
  }
  save(data);
};

export const getCounts = (profileId) => {
  if (profileId === "guest") return {};
  const data = load();
  return data.counts[profileId] || {};
};

export const getLastCompletionAt = (profileId) => {
  const data = load();
  return data.lastCompletionAt[profileId] || null;
};

// ── Weekly layout (category↔weekday mapping + optional seed) ──────────────────
// weeks[profileId][weekStartIso] = { weekId, seed, dayCategory, cardOrder, prevWeekDayCategory, generatedAt }

// Find the most recent stored week BEFORE weekStartIso for this profile (for the 3-day rule).
const findPrevDayCategory = (data, profileId, weekStartIso) => {
  const byWeek = data.weeks[profileId] || {};
  const earlier = Object.keys(byWeek)
    .filter((k) => k < weekStartIso)
    .sort();
  if (earlier.length === 0) return null;
  const prev = byWeek[earlier[earlier.length - 1]];
  return prev?.dayCategory || null;
};

// Get the week layout, generating a fresh (non-seed) one if none exists yet.
export const ensureWeek = (profileId, weekStartIso) => {
  const data = load();
  data.weeks[profileId] ||= {};
  if (!data.weeks[profileId][weekStartIso]) {
    const prevDayCategory = findPrevDayCategory(data, profileId, weekStartIso);
    data.weeks[profileId][weekStartIso] = generateWeek({
      seed: null,
      prevDayCategory,
      weekStartIso,
    });
    save(data);
  }
  return data.weeks[profileId][weekStartIso];
};

export const getWeek = (profileId, weekStartIso) => {
  const data = load();
  return data.weeks[profileId]?.[weekStartIso] || null;
};

// Apply a seed: regenerate THIS week deterministically from the seed string.
// An empty/blank seed clears the seed and regenerates a normal (non-seed) week.
export const applySeed = (profileId, weekStartIso, seedString) => {
  const data = load();
  data.weeks[profileId] ||= {};
  const prevDayCategory = findPrevDayCategory(data, profileId, weekStartIso);
  data.weeks[profileId][weekStartIso] = generateWeek({
    seed: seedString && String(seedString).trim() ? seedString : null,
    prevDayCategory,
    weekStartIso,
  });
  // A new layout invalidates this week's in-progress data.
  if (data.workouts[profileId]) delete data.workouts[profileId][weekStartIso];
  if (data.progress[profileId]) delete data.progress[profileId][weekStartIso];
  save(data);
  return data.weeks[profileId][weekStartIso];
};

// "Start new week": clear any seed, regenerate a fresh non-seed layout, reset progress.
export const startNewWeek = (profileId, weekStartIso) =>
  applySeed(profileId, weekStartIso, null);

// ── Default profile (auto-loads on launch) ────────────────────────────────────
export const getDefaultProfileId = () => load().defaultProfileId || null;

export const setDefaultProfileId = (profileId) => {
  const data = load();
  data.defaultProfileId = profileId || null;
  save(data);
};

export const toggleDefaultProfile = (profileId) => {
  const data = load();
  data.defaultProfileId = data.defaultProfileId === profileId ? null : profileId;
  save(data);
  return data.defaultProfileId;
};

// Active profile session helpers (sessionStorage so refresh remembers, but new tab = relock)
const ACTIVE = "gym_lalu_active";
export const setActive = (profileId, isGuest = false) => {
  sessionStorage.setItem(ACTIVE, JSON.stringify({ profileId, isGuest }));
};
export const getActive = () => {
  try {
    const raw = sessionStorage.getItem(ACTIVE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
export const clearActive = () => sessionStorage.removeItem(ACTIVE);
