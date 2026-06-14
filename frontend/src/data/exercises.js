// Hardcoded exercise database for "Gym with Lalu" — with image paths from Gemini mapping.
const placeholderHow = "How to: short placeholder cue. (Full coaching text comes in a later phase.)";
const placeholderDoes = "What it does: short placeholder benefit. (Full description comes in a later phase.)";
const img = (slug) => `/exercises/Gemini_Generated_Image_${slug}.png`;

const mk = (day, name, image, type = "A", circuit = null) => ({
  id: `d${day}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
  day, name, type, image, howTo: placeholderHow, whatItDoes: placeholderDoes, circuit,
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

// Circuit mini-exercises with images
const miniImg = (slug) => `/exercises/Gemini_Generated_Image_${slug}.png`;
const B2_MINI = [
  { name: "Step Jumping Jacks", image: miniImg("2pvxjw2pvxjw2pvx") },
  { name: "Plate Swings", image: miniImg("5tbvis5tbvis5tbv") },
  { name: "Plate Ground-to-Overhead", image: miniImg("iv79ujiv79ujiv79") },
  { name: "Bent-Over Plate Rows", image: miniImg("xji55xji55xji55x") },
  { name: "Small Jumps", image: miniImg("ogoyiyogoyiyogoy") },
  { name: "High Knees", image: miniImg("g1qhqpg1qhqpg1qh") },
];
const B1_MINI = [
  { name: "Basic Step-Ups", image: miniImg("9y024a9y024a9y02") },
  { name: "Fast Step-Ups", image: miniImg("af051oaf051oaf05") },
  { name: "Lateral Step-Over with Floor Touch", image: miniImg("knipphknipphknip") },
  { name: "Step Straddle Jumps", image: miniImg("lh8t4ilh8t4ilh8t") },
  { name: "Quick Toe Taps", image: miniImg("wv5sk7wv5sk7wv5s") },
  { name: "Box Jumps", image: miniImg("z6n3owz6n3owz6n3") },
];

export const EXERCISES = {
  1: [
    mk(1, "Dumbbell Shrugs", img("9fyk939fyk939fyk")),
    mk(1, "Cable Face Pulls", img("9iuckc9iuckc9iuc")),
    mk(1, "Seated Dumbbell Shoulder Press", img("404cvl404cvl404c")),
    mk(1, "Dumbbell Front Raises", img("a6wp6ia6wp6ia6wp")),
    mk(1, "Standing Full Dumbbell Lateral Raise", img("v97wkzv97wkzv97w")),
    mk(1, "Low Cable Lateral Raise", img("vsiqo2vsiqo2vsiq")),
    mk(1, "Seated Arnold Press", img("buv80rbuv80rbuv8")),
    mk(1, "Cable Upright Rows", img("tmw1satmw1satmw1")),
  ],
  2: [
    mk(2, "Pec Deck Machine Flyes", img("5on1f55on1f55on1")),
    mk(2, "Flat Dumbbell Bench Press", img("9pkptv9pkptv9pkp")),
    mk(2, "Dumbbell Squeeze Press", img("84o2ln84o2ln84o2")),
    mk(2, "Single-Arm Flat Dumbbell Press", img("jb9rjhjb9rjhjb9r")),
    mk(2, "Incline Dumbbell Bench Press", img("qg7j95qg7j95qg7j")),
    mk(2, "Circuit B2 Power & Conditioning", null, "B", {
      name: "B2 Power & Conditioning", miniExercises: B2_MINI,
    }),
    mk(2, "Dumbbell Pullover", img("ywwdk0ywwdk0ywwd")),
    mk(2, "High-to-Low Cable Crossovers", img("ohl056ohl056ohl0")),
  ],
  3: [
    mk(3, "Cable Overhead Tricep Extension", img("4so7634so7634so7")),
    mk(3, "Seated Dual-Dumbbell Overhead Tricep Extension", img("8i68io8i68io8i68")),
    mk(3, "Cable Tricep Pulldown", img("c38ld4c38ld4c38l")), // mapped to Cable Tricep Pushdowns
    mk(3, "Single-Arm Cable Tricep Pushdowns", img("ooynugooynugooyn")),
    mk(3, "Seated Single-Arm Overhead Dumbbell Tricep Extension", img("r01yrlr01yrlr01y")),
    mk(3, "Seated Overhead Dumbbell Tricep Extension", img("yzsm4oyzsm4oyzsm")),
    mk(3, "Bench Dips", img("f1oxluf1oxluf1ox")),
    mk(3, "Cable Tricep Kickbacks", img("ar7ouuar7ouuar7o")),
  ],
  4: [
    mk(4, "Dumbbell Goblet Squats", img("7zxxhr7zxxhr7zxx")),
    mk(4, "Lying Hamstring Curls", img("8wi16v8wi16v8wi1")),
    mk(4, "Dumbbell Calf Raises", img("667orr667orr667o")),
    mk(4, "Dumbbell Farmer's Walk", img("776lsc776lsc776l")),
    mk(4, "Seated Leg Extensions", img("dt1er2dt1er2dt1e")),
    mk(4, "Dumbbell Walking Lunges", img("dymt99dymt99dymt")),
    mk(4, "Dumbbell Romanian Deadlifts", img("gt869gt869gt869g")),
    mk(4, "45-Degree Leg Press", img("mc6wa9mc6wa9mc6w")),
  ],
  5: [
    mk(5, "Wide-Grip Cable Lat Pulldowns", img("c8pe80c8pe80c8pe")),
    mk(5, "Seated Low Cable Rows", img("kbbgn1kbbgn1kbbg")),
    mk(5, "Machine Cable Row Ver 1", img("l7cfjsl7cfjsl7cf")),
    mk(5, "Straight-Arm Cable Pulldowns", img("nii3denii3denii3")),
    mk(5, "Single-Arm Dumbbell Row", img("qwroa8qwroa8qwro")),
    mk(5, "Machine Cable Row Ver 2", img("ttyp6kttyp6kttyp")), // mapped to Machine Cable Pulls
    mk(5, "Close-Grip Cable Lat Pulldowns", img("maiyp4maiyp4maiy")),
    mk(5, "Incline Chest-Supported Dumbbell Rows", img("qtit34qtit34qtit")),
  ],
  6: [
    mk(6, "Low Cable Bicep Curls", img("3a60p33a60p33a60")),
    mk(6, "Dumbbell Preacher Curls", img("56it5756it5756it")),
    mk(6, "Seated Dumbbell Bicep Curls", img("854lqt854lqt854l")),
    mk(6, "Dumbbell Hammer Curls", img("i1ugm6i1ugm6i1ug")),
    mk(6, "Incline Dumbbell Bicep Curls", img("i1uxddi1uxddi1ux")),
    mk(6, "Seated Dumbbell Concentration Curls", img("ke1x4gke1x4gke1x")),
    mk(6, "Circuit B1 Cardio Box", null, "B", {
      name: "B1 Cardio Box", miniExercises: B1_MINI,
    }),
    mk(6, "Seated Dumbbell Wrist Curls", img("n6ecfwn6ecfwn6ec")),
  ],
  7: [],
};
