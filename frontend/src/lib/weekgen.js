// Deterministic week generation for "Gym with Lalu".
// - Non-seed weeks: random category→weekday layout with the "no category within 3 days
//   of last week's slot" refresh rule.
// - Seeded weeks (Minecraft-style): same seed string → identical layout + card order on
//   every device, using the cyrb128 + mulberry32 RNG (NOT Math.random).

import { EXERCISES, CATEGORIES } from "@/data/exercises";

// ── Deterministic RNG (do NOT swap for Math.random for seeds) ──────────────────
export function cyrb128(str) {
  let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
  for (let i = 0, k; i < str.length; i++) {
    k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= (h2 ^ h3 ^ h4); h2 ^= h1; h3 ^= h1; h4 ^= h1;
  return h1 >>> 0;
}

export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fisher–Yates shuffle using a provided rng() in [0,1).
export function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const CAT_IDS = CATEGORIES.map((c) => c.id); // [1..6]
const SLOTS = [1, 2, 3, 4, 5, 6]; // Mon–Sat weekday numbers

// Recurrence gap (in calendar days, across the 7-day week incl. Sunday rest) between
// a category's previous weekday slot and its new slot. Same slot → 7. Returns false
// if any category lands within 3 days of where it was last week.
export function satisfiesRefreshRule(dayCategory, prevDayCategory) {
  if (!prevDayCategory) return true;
  // Build cat → slot lookups
  const prevSlotOf = {};
  Object.entries(prevDayCategory).forEach(([slot, cat]) => { prevSlotOf[cat] = Number(slot); });
  for (const [slotStr, cat] of Object.entries(dayCategory)) {
    const newSlot = Number(slotStr);
    const prevSlot = prevSlotOf[cat];
    if (prevSlot == null) continue;
    let g = (newSlot - prevSlot + 7) % 7;
    if (g === 0) g = 7;
    if (g < 3) return false;
  }
  return true;
}

// Map a slot→catId object onto { 1: catId, ... } given a category ordering array.
const assign = (catOrder) => {
  const dayCategory = {};
  SLOTS.forEach((slot, i) => { dayCategory[slot] = catOrder[i]; });
  return dayCategory;
};

export function generateWeek({ seed = null, prevDayCategory = null, weekStartIso = "" } = {}) {
  const cleanSeed = seed && String(seed).trim() ? String(seed).trim() : null;
  const rng = cleanSeed ? mulberry32(cyrb128(cleanSeed)) : Math.random;

  let dayCategory;
  if (cleanSeed) {
    // Deterministic: same seed → same layout everywhere. Refresh rule does NOT apply.
    dayCategory = assign(shuffle(CAT_IDS, rng));
  } else {
    // Random with the 3-day refresh rule (re-roll until satisfied; safe fallback).
    let candidate = assign(shuffle(CAT_IDS, rng));
    let attempts = 0;
    while (!satisfiesRefreshRule(candidate, prevDayCategory) && attempts < 2000) {
      candidate = assign(shuffle(CAT_IDS, rng));
      attempts++;
    }
    dayCategory = candidate;
  }

  // Card order: only fixed for seeds (so both friends see the identical order).
  // Non-seed weeks use dynamic least-done-first sorting at render time, so leave null.
  let cardOrder = null;
  if (cleanSeed) {
    cardOrder = {};
    CAT_IDS.forEach((catId) => {
      const ids = (EXERCISES[catId] || []).map((e) => e.id);
      cardOrder[catId] = shuffle(ids, rng);
    });
  }

  return {
    weekId: `${weekStartIso || ""}#${cleanSeed || "auto"}#${Date.now()}`,
    seed: cleanSeed,
    dayCategory,
    cardOrder,
    prevWeekDayCategory: prevDayCategory || null,
    generatedAt: new Date().toISOString(),
  };
}

// Resolve the muscle category id for a given weekday (1..7). Day 7 (Sun) → null.
export const categoryForDay = (week, dayNum) => {
  if (dayNum === 7) return null;
  if (week && week.dayCategory && week.dayCategory[dayNum]) return week.dayCategory[dayNum];
  return dayNum; // sensible fallback before a week is generated
};
