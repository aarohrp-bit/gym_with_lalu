// Maps each exercise id to its image filename in /public/exercises.
// Source mapping authored by user (Image_Mapping_For_Claude.txt).
// Convert PNG names -> WEBP. Keep this file flat so it's trivial to update.

const PREFIX = "/exercises/";
const f = (slug) => `${PREFIX}Gemini_Generated_Image_${slug}.webp`;

// Special-case filename (verbatim from user mapping).
const SPECIAL_MACHINE_ROW_V2 =
  `${PREFIX}ot what i asked for in the one i am telling you the person stands straight and holds dumbell in both his hands and then he moves his hand .webp`;

export const IMAGE_BY_EXERCISE_ID = {
  // ── Shoulders ──────────────────────────────────────────────────
  "shoulders-dumbbell-shrugs": f("9fyk939fyk939fyk"),
  "shoulders-cable-face-pulls": f("9iuckc9iuckc9iuc"),
  "shoulders-seated-dumbbell-shoulder-press": f("404cvl404cvl404c"),
  "shoulders-dumbbell-front-raises": f("a6wp6ia6wp6ia6wp"),
  "shoulders-standing-full-dumbbell-lateral-raise": f("v97wkzv97wkzv97w"),
  "shoulders-low-cable-lateral-raise": f("vsiqo2vsiqo2vsiq"),
  "shoulders-seated-arnold-press": f("buv80rbuv80rbuv8"),
  "shoulders-cable-upright-rows": f("tmw1satmw1satmw1"),

  // ── Chest ──────────────────────────────────────────────────────
  "chest-pec-deck-machine-flyes": f("5on1f55on1f55on1"),
  "chest-flat-dumbbell-bench-press": f("9pkptv9pkptv9pkp"),
  "chest-dumbbell-squeeze-press": f("84o2ln84o2ln84o2"),
  "chest-single-arm-flat-dumbbell-press": f("jb9rjhjb9rjhjb9r"),
  "chest-incline-dumbbell-bench-press": f("qg7j95qg7j95qg7j"),
  "chest-dumbbell-pullover": f("ywwdk0ywwdk0ywwd"),
  "chest-high-to-low-cable-crossovers": f("ohl056ohl056ohl0"),

  // ── Triceps ────────────────────────────────────────────────────
  "triceps-cable-overhead-tricep-extension": f("4so7634so7634so7"),
  "triceps-seated-dual-dumbbell-overhead-tricep-extension": f("8i68io8i68io8i68"),
  "triceps-cable-tricep-pulldown": f("c38ld4c38ld4c38l"),
  "triceps-single-arm-cable-tricep-pushdowns": f("ooynugooynugooyn"),
  "triceps-seated-single-arm-overhead-dumbbell-tricep-extension": f("r01yrlr01yrlr01y"),
  "triceps-seated-overhead-dumbbell-tricep-extension": f("yzsm4oyzsm4oyzsm"),
  "triceps-bench-dips": f("f1oxluf1oxluf1ox"),
  "triceps-cable-tricep-kickbacks": f("ar7ouuar7ouuar7o"),

  // ── Legs ───────────────────────────────────────────────────────
  "legs-dumbbell-goblet-squats": f("7zxxhr7zxxhr7zxx"),
  "legs-lying-hamstring-curls": f("8wi16v8wi16v8wi1"),
  "legs-dumbbell-calf-raises": f("667orr667orr667o"),
  "legs-dumbbell-farmer-s-walk": f("776lsc776lsc776l"),
  "legs-seated-leg-extensions": f("dt1er2dt1er2dt1e"),
  "legs-dumbbell-walking-lunges": f("dymt99dymt99dymt"),
  "legs-dumbbell-romanian-deadlifts": f("gt869gt869gt869g"),
  "legs-45-degree-leg-press": f("mc6wa9mc6wa9mc6w"),

  // ── Back ───────────────────────────────────────────────────────
  "back-wide-grip-cable-lat-pulldowns": f("c8pe80c8pe80c8pe"),
  "back-seated-low-cable-rows": f("kbbgn1kbbgn1kbbg"),
  "back-machine-cable-row-ver-1": f("l7cfjsl7cfjsl7cf"),
  "back-straight-arm-cable-pulldowns": f("nii3denii3denii3"),
  "back-single-arm-dumbbell-row": f("qwroa8qwroa8qwro"),
  "back-machine-cable-row-ver-2": SPECIAL_MACHINE_ROW_V2,
  "back-close-grip-cable-lat-pulldowns": f("maiyp4maiyp4maiy"),
  "back-incline-chest-supported-dumbbell-rows": f("qtit34qtit34qtit"),

  // ── Biceps ─────────────────────────────────────────────────────
  "biceps-low-cable-bicep-curls": f("3a60p33a60p33a60"),
  "biceps-dumbbell-preacher-curls": f("56it5756it5756it"),
  "biceps-seated-dumbbell-bicep-curls": f("854lqt854lqt854l"),
  "biceps-dumbbell-hammer-curls": f("i1ugm6i1ugm6i1ug"),
  "biceps-incline-dumbbell-bicep-curls": f("i1uxddi1uxddi1ux"),
  "biceps-seated-dumbbell-concentration-curls": f("ke1x4gke1x4gke1x"),
  "biceps-seated-dumbbell-wrist-curls": f("n6ecfwn6ecfwn6ec"),
};

// Mini-exercise images inside circuit cards (B-type cards). Keyed by display name.
export const IMAGE_BY_MINI_NAME = {
  // B2 Power & Conditioning (Chest day)
  "Step Jumping Jacks": f("2pvxjw2pvxjw2pvx"),
  "Plate Swings": f("5tbvis5tbvis5tbv"),
  "Plate Ground-to-Overhead": f("iv79ujiv79ujiv79"),
  "Bent-Over Plate Rows": f("xji55xji55xji55x"),
  "Small Jumps": f("ogoyiyogoyiyogoy"),
  "High Knees": f("g1qhqpg1qhqpg1qh"),
  // B1 Cardio Box (Biceps day)
  "Basic Step-Ups": f("9y024a9y024a9y02"),
  "Fast Step-Ups": f("af051oaf051oaf05"),
  "Lateral Step-Over with Floor Touch": f("knipphknipphknip"),
  "Step Straddle Jumps": f("lh8t4ilh8t4ilh8t"),
  "Quick Toe Taps": f("wv5sk7wv5sk7wv5s"),
  "Box Jumps": f("z6n3owz6n3owz6n3"),
};

export const imageForExerciseId = (id) => IMAGE_BY_EXERCISE_ID[id] || null;
export const imageForMiniName = (name) => IMAGE_BY_MINI_NAME[name] || null;
