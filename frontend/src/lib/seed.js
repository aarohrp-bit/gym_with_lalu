// Deterministic seed-based week generator for "Gym with Lalu".
// Two devices entering the same seed string MUST produce the identical week
// (category-per-day + card order in each category). All randomness flows from
// the seed string via cyrb128 -> mulberry32. Do NOT use Math.random() here.

import { CATEGORIES } from "@/lib/weeklyCategory";
import { EXERCISES_BY_CATEGORY } from "@/data/exercises";

// VERBATIM from the spec — do not modify.
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
  h1 ^= (h2 ^ h3 ^ h4);
  h2 ^= h1;
  h3 ^= h1;
  h4 ^= h1;
  return (h1 >>> 0);
}

// VERBATIM from the spec — do not modify.
export function mulberry32(a) {
  return function () {
    a |= 0;
    a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Fisher-Yates shuffle driven by a given RNG (no Math.random anywhere).
export const seededShuffle = (arr, rng) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Derive the day-to-category mapping for a seed.
// Mon..Sat each carry one category (each used exactly once). Sun = "Rest".
export const deriveSeededMapping = (seed) => {
  const rng = mulberry32(cyrb128(`${seed}::categories`));
  const shuffled = seededShuffle(CATEGORIES, rng);
  return {
    1: shuffled[0],
    2: shuffled[1],
    3: shuffled[2],
    4: shuffled[3],
    5: shuffled[4],
    6: shuffled[5],
    7: "Rest",
  };
};

// Derive the deterministic card order (list of exercise ids) for each category.
// Returns { Shoulders: [id,id,...], Chest: [...], ... }
export const deriveSeededCardOrders = (seed) => {
  const out = {};
  for (const cat of CATEGORIES) {
    const rng = mulberry32(cyrb128(`${seed}::cards::${cat}`));
    const ids = (EXERCISES_BY_CATEGORY[cat] || []).map((e) => e.id);
    out[cat] = seededShuffle(ids, rng);
  }
  return out;
};

// Normalize a user-typed seed so trivial whitespace differences don't break sharing.
export const normalizeSeed = (raw) => (raw || "").trim();
