// Deep-link encoding for sharing a single custom card via QR / link.
// Images are too big for a QR, so only text fields travel; the recipient can add photos
// later by editing. Works for Type A (one exercise) and Type B (a circuit of minis).

const b64e = (s) => btoa(unescape(encodeURIComponent(s)));
const b64d = (s) => decodeURIComponent(escape(atob(s)));

// A short link that opens the app with the card embedded.
export const cardShareUrl = (card) => {
  let mini;
  if (card.type === "B" || Array.isArray(card.miniExercises)) {
    mini = {
      t: "B",
      c: Number(card.category) || 1,
      n: card.name || "",
      m: (card.miniExercises || []).map((x) => ({ n: x.name || "", h: x.howTo || "", w: x.whatItDoes || "" })),
    };
  } else {
    mini = { t: "A", c: Number(card.category) || 1, n: card.name || "", h: card.howTo || "", w: card.whatItDoes || "" };
  }
  const data = encodeURIComponent(b64e(JSON.stringify(mini)));
  const base = `${window.location.origin}${process.env.PUBLIC_URL || ""}/`;
  return `${base}?card=${data}`;
};

// Decode a raw `card` param value into an importable cards payload (+ a summary).
export const parseCardRaw = (raw) => {
  try {
    const mini = JSON.parse(b64d(decodeURIComponent(raw)));
    if (!mini || !mini.n) return null;
    let card;
    if (mini.t === "B") {
      card = {
        type: "B",
        category: Number(mini.c) || 1,
        name: String(mini.n),
        miniExercises: (mini.m || []).map((x) => ({ name: String(x.n || "Move"), howTo: String(x.h || ""), whatItDoes: String(x.w || ""), img: null })),
      };
    } else {
      card = { type: "A", category: Number(mini.c) || 1, name: String(mini.n), howTo: String(mini.h || ""), whatItDoes: String(mini.w || ""), img: null };
    }
    return { payload: { type: "gym-with-lalu-cards", version: 1, cards: [card] }, name: card.name, category: card.category };
  } catch {
    return null;
  }
};
