// Weekly category generator for "Gym with Lalu".
// Each new week, the 6 categories (Shoulders, Chest, Triceps, Legs, Back, Biceps)
// are randomly assigned across Mon..Sat (each exactly once). Sun stays "Rest".
//
// REFRESH RULE: a category must not land within 3 days of the weekday it occupied
// last week. We interpret "within 3 days" as `|new_day - old_day| < 3`, so the
// constraint is `|new_day - old_day| >= 3`. We re-roll random permutations until
// the rule holds; if attempts exhaust we fall back to a deterministic shift-by-3
// derangement which is guaranteed to satisfy gap=3 for every category.

export const CATEGORIES = ["Shoulders", "Chest", "Triceps", "Legs", "Back", "Biceps"];
export const MIN_GAP_DAYS = 3;

const fisherYates = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Returns true if `mapping` violates the refresh rule against `prevMapping`.
export const violatesRefreshRule = (mapping, prevMapping) => {
  if (!prevMapping) return false;
  for (let d = 1; d <= 6; d++) {
    const cat = mapping[d];
    for (let pd = 1; pd <= 6; pd++) {
      if (prevMapping[pd] === cat) {
        if (Math.abs(d - pd) < MIN_GAP_DAYS) return true;
        break;
      }
    }
  }
  return false;
};

// Deterministic fallback: shift each category from prev day `p` to new day `((p-1+3)%6)+1`.
// Yields gaps of exactly 3 for every category. Used only if random re-roll exhausts.
const shiftBy3Fallback = (prevMapping) => {
  const out = { 7: "Rest" };
  for (let d = 1; d <= 6; d++) {
    const sourceDay = ((d - 1 + 3) % 6) + 1; // 1->4, 2->5, 3->6, 4->1, 5->2, 6->3
    out[d] = prevMapping[sourceDay];
  }
  return out;
};

export const generateWeeklyMapping = (prevMapping = null, maxAttempts = 500) => {
  for (let i = 0; i < maxAttempts; i++) {
    const shuffled = fisherYates(CATEGORIES);
    const mapping = {
      1: shuffled[0],
      2: shuffled[1],
      3: shuffled[2],
      4: shuffled[3],
      5: shuffled[4],
      6: shuffled[5],
      7: "Rest",
    };
    if (!violatesRefreshRule(mapping, prevMapping)) return mapping;
  }
  if (prevMapping) return shiftBy3Fallback(prevMapping);
  const shuffled = fisherYates(CATEGORIES);
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
