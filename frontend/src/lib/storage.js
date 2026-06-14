// LocalStorage helpers for Gym with Lalu (no backend)
import { generateWeeklyMapping } from "@/lib/weeklyCategory";

const KEY = "gym_lalu_v1";

const empty = () => ({ profiles: [], progress: {}, workouts: {}, weeklyMappings: {} });

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
    parsed.weeklyMappings ||= {};
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

// ── Weekly category mapping (per profile, per week) ────────────────────────
// mapping shape: { 1: "Shoulders", 2: "Chest", ..., 6: "Biceps", 7: "Rest" }
// Generated once per (profile, weekStartIso); persisted; refresh rule enforced
// against the most-recent prior week's mapping for that profile.

const findPrevMapping = (data, profileId, weekStartIso) => {
  const all = data.weeklyMappings[profileId] || {};
  const priorKey = Object.keys(all)
    .filter((w) => w < weekStartIso)
    .sort()
    .pop();
  return priorKey ? all[priorKey] : null;
};

export const getWeeklyMapping = (profileId, weekStartIso) => {
  const data = load();
  data.weeklyMappings[profileId] ||= {};
  const existing = data.weeklyMappings[profileId][weekStartIso];
  if (existing) return existing;
  const prev = findPrevMapping(data, profileId, weekStartIso);
  const mapping = generateWeeklyMapping(prev);
  data.weeklyMappings[profileId][weekStartIso] = mapping;
  save(data);
  return mapping;
};

export const regenerateWeeklyMapping = (profileId, weekStartIso) => {
  const data = load();
  data.weeklyMappings[profileId] ||= {};
  // The mapping currently stored at this week (about to be replaced) is what
  // the user is refreshing away from — use it as the "previous" reference so
  // the refresh rule still applies on same-week regenerations. Fall back to the
  // most-recent strictly-earlier mapping if no current mapping exists.
  const prev =
    data.weeklyMappings[profileId][weekStartIso] ||
    findPrevMapping(data, profileId, weekStartIso);
  const mapping = generateWeeklyMapping(prev);
  data.weeklyMappings[profileId][weekStartIso] = mapping;
  // Clear week progress + workouts for this profile + week.
  if (data.progress[profileId]) delete data.progress[profileId][weekStartIso];
  if (data.workouts[profileId]) delete data.workouts[profileId][weekStartIso];
  save(data);
  return mapping;
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
