// Hardcoded exercise database for "Gym with Lalu"
// Each card: { id, day, name, type: "A" | "B", howTo, whatItDoes }
// Day 2 (Chest) and Day 6 (Biceps) each contain ONE circuit card (type "B").

const placeholderHow = "How to: short placeholder cue. (Full coaching text comes in a later phase.)";
const placeholderDoes = "What it does: short placeholder benefit. (Full description comes in a later phase.)";

const mk = (day, name, type = "A", circuit = null) => ({
  id: `d${day}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
  day,
  name,
  type,
  howTo: placeholderHow,
  whatItDoes: placeholderDoes,
  circuit, // null OR { name, miniExercises: [string,...] }
});

export const DAY_META = [
  { day: 1, label: "Mon", title: "Shoulders", rest: false },
  { day: 2, label: "Tue", title: "Chest", rest: false },
  { day: 3, label: "Wed", title: "Triceps", rest: false },
  { day: 4, label: "Thu", title: "Legs", rest: false },
  { day: 5, label: "Fri", title: "Back", rest: false },
  { day: 6, label: "Sat", title: "Biceps", rest: false },
  { day: 7, label: "Sun", title: "Rest", rest: true },
];

export const EXERCISES = {
  1: [
    mk(1, "Dumbbell Shrugs"),
    mk(1, "Cable Face Pulls"),
    mk(1, "Seated Dumbbell Shoulder Press"),
    mk(1, "Dumbbell Front Raises"),
    mk(1, "Standing Full Dumbbell Lateral Raise"),
    mk(1, "Low Cable Lateral Raise"),
    mk(1, "Seated Arnold Press"),
    mk(1, "Cable Upright Rows"),
  ],
  2: [
    mk(2, "Pec Deck Machine Flyes"),
    mk(2, "Flat Dumbbell Bench Press"),
    mk(2, "Dumbbell Squeeze Press"),
    mk(2, "Single-Arm Flat Dumbbell Press"),
    mk(2, "Incline Dumbbell Bench Press"),
    mk(2, "Circuit B2 Power & Conditioning", "B", {
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
    mk(2, "Dumbbell Pullover"),
    mk(2, "High-to-Low Cable Crossovers"),
  ],
  3: [
    mk(3, "Cable Overhead Tricep Extension"),
    mk(3, "Seated Dual-Dumbbell Overhead Tricep Extension"),
    mk(3, "Cable Tricep Pulldown"),
    mk(3, "Single-Arm Cable Tricep Pushdowns"),
    mk(3, "Seated Single-Arm Overhead Dumbbell Tricep Extension"),
    mk(3, "Seated Overhead Dumbbell Tricep Extension"),
    mk(3, "Bench Dips"),
    mk(3, "Cable Tricep Kickbacks"),
  ],
  4: [
    mk(4, "Dumbbell Goblet Squats"),
    mk(4, "Lying Hamstring Curls"),
    mk(4, "Dumbbell Calf Raises"),
    mk(4, "Dumbbell Farmer's Walk"),
    mk(4, "Seated Leg Extensions"),
    mk(4, "Dumbbell Walking Lunges"),
    mk(4, "Dumbbell Romanian Deadlifts"),
    mk(4, "45-Degree Leg Press"),
  ],
  5: [
    mk(5, "Wide-Grip Cable Lat Pulldowns"),
    mk(5, "Seated Low Cable Rows"),
    mk(5, "Machine Cable Row Ver 1"),
    mk(5, "Straight-Arm Cable Pulldowns"),
    mk(5, "Single-Arm Dumbbell Row"),
    mk(5, "Machine Cable Row Ver 2"),
    mk(5, "Close-Grip Cable Lat Pulldowns"),
    mk(5, "Incline Chest-Supported Dumbbell Rows"),
  ],
  6: [
    mk(6, "Low Cable Bicep Curls"),
    mk(6, "Dumbbell Preacher Curls"),
    mk(6, "Seated Dumbbell Bicep Curls"),
    mk(6, "Dumbbell Hammer Curls"),
    mk(6, "Incline Dumbbell Bicep Curls"),
    mk(6, "Seated Dumbbell Concentration Curls"),
    mk(6, "Circuit B1 Cardio Box", "B", {
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
    mk(6, "Seated Dumbbell Wrist Curls"),
  ],
  7: [], // Rest day
};
