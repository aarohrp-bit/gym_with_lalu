// Hardcoded exercise database for "Gym with Lalu"
// Each card: { id, category, name, type: "A" | "B", howTo, whatItDoes }
// Chest and Biceps categories each contain ONE circuit card (type "B").
//
// NOTE: Exercises are keyed by CATEGORY (not weekday) because the weekday-to-category
// mapping is now generated weekly by lib/weeklyCategory.js.

const placeholderHow = "How to: short placeholder cue. (Full coaching text comes in a later phase.)";
const placeholderDoes = "What it does: short placeholder benefit. (Full description comes in a later phase.)";

const mk = (category, name, type = "A", circuit = null) => ({
  id: `${category.toLowerCase()}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
  category,
  name,
  type,
  howTo: placeholderHow,
  whatItDoes: placeholderDoes,
  circuit, // null OR { name, miniExercises: [string,...] }
});

// Mon..Sun labels only — the category title is now resolved per-week from the
// stored weekly mapping (see lib/weeklyCategory.js + lib/storage.js#getWeeklyMapping).
export const DAY_META = [
  { day: 1, label: "Mon", rest: false },
  { day: 2, label: "Tue", rest: false },
  { day: 3, label: "Wed", rest: false },
  { day: 4, label: "Thu", rest: false },
  { day: 5, label: "Fri", rest: false },
  { day: 6, label: "Sat", rest: false },
  { day: 7, label: "Sun", rest: true },
];

export const EXERCISES_BY_CATEGORY = {
  Shoulders: [
    mk("Shoulders", "Dumbbell Shrugs"),
    mk("Shoulders", "Cable Face Pulls"),
    mk("Shoulders", "Seated Dumbbell Shoulder Press"),
    mk("Shoulders", "Dumbbell Front Raises"),
    mk("Shoulders", "Standing Full Dumbbell Lateral Raise"),
    mk("Shoulders", "Low Cable Lateral Raise"),
    mk("Shoulders", "Seated Arnold Press"),
    mk("Shoulders", "Cable Upright Rows"),
  ],
  Chest: [
    mk("Chest", "Circuit B2 Power & Conditioning", "B", {
      name: "B2 Power & Conditioning",
      miniExercises: [
        "Step Jumping Jacks",
        "Plate Swings",
        "Plate Ground-to-Overhead",
        "Bent-Over Plate Rows",
        "Small Jumps",
        "High Knees",
      ],
    }),
    mk("Chest", "Pec Deck Machine Flyes"),
    mk("Chest", "Flat Dumbbell Bench Press"),
    mk("Chest", "Dumbbell Squeeze Press"),
    mk("Chest", "Single-Arm Flat Dumbbell Press"),
    mk("Chest", "Incline Dumbbell Bench Press"),
    mk("Chest", "Dumbbell Pullover"),
    mk("Chest", "High-to-Low Cable Crossovers"),
  ],
  Triceps: [
    mk("Triceps", "Cable Overhead Tricep Extension"),
    mk("Triceps", "Seated Dual-Dumbbell Overhead Tricep Extension"),
    mk("Triceps", "Cable Tricep Pulldown"),
    mk("Triceps", "Single-Arm Cable Tricep Pushdowns"),
    mk("Triceps", "Seated Single-Arm Overhead Dumbbell Tricep Extension"),
    mk("Triceps", "Seated Overhead Dumbbell Tricep Extension"),
    mk("Triceps", "Bench Dips"),
    mk("Triceps", "Cable Tricep Kickbacks"),
  ],
  Legs: [
    mk("Legs", "Dumbbell Goblet Squats"),
    mk("Legs", "Lying Hamstring Curls"),
    mk("Legs", "Dumbbell Calf Raises"),
    mk("Legs", "Dumbbell Farmer's Walk"),
    mk("Legs", "Seated Leg Extensions"),
    mk("Legs", "Dumbbell Walking Lunges"),
    mk("Legs", "Dumbbell Romanian Deadlifts"),
    mk("Legs", "45-Degree Leg Press"),
  ],
  Back: [
    mk("Back", "Wide-Grip Cable Lat Pulldowns"),
    mk("Back", "Seated Low Cable Rows"),
    mk("Back", "Machine Cable Row Ver 1"),
    mk("Back", "Straight-Arm Cable Pulldowns"),
    mk("Back", "Single-Arm Dumbbell Row"),
    mk("Back", "Machine Cable Row Ver 2"),
    mk("Back", "Close-Grip Cable Lat Pulldowns"),
    mk("Back", "Incline Chest-Supported Dumbbell Rows"),
  ],
  Biceps: [
    mk("Biceps", "Circuit B1 Cardio Box", "B", {
      name: "B1 Cardio Box",
      miniExercises: [
        "Basic Step-Ups",
        "Fast Step-Ups",
        "Lateral Step-Over with Floor Touch",
        "Step Straddle Jumps",
        "Quick Toe Taps",
        "Box Jumps",
      ],
    }),
    mk("Biceps", "Low Cable Bicep Curls"),
    mk("Biceps", "Dumbbell Preacher Curls"),
    mk("Biceps", "Seated Dumbbell Bicep Curls"),
    mk("Biceps", "Dumbbell Hammer Curls"),
    mk("Biceps", "Incline Dumbbell Bicep Curls"),
    mk("Biceps", "Seated Dumbbell Concentration Curls"),
    mk("Biceps", "Seated Dumbbell Wrist Curls"),
  ],
  Rest: [],
};

// Helper: get exercises for a given category title (or [] for Rest/unknown).
export const exercisesForCategory = (category) =>
  EXERCISES_BY_CATEGORY[category] || [];
