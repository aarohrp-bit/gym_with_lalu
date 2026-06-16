// Hardcoded exercise database for "Gym with Lalu"
// Each A card: { id, day, name, type: "A", imageKey, img, howTo, whatItDoes }
// Each B card: { id, day, name, type: "B", circuit: { name, miniExercises: [{ name, imageKey, img, howTo, whatItDoes }] } }
// Day 2 (Chest) and Day 6 (Biceps) each contain ONE circuit card (type "B").

// Resolve an exercise image key to its public URL. Images live in /public/exercises/<key>.webp
export const imgUrl = (key) =>
  key ? `${process.env.PUBLIC_URL || ""}/exercises/${key}.webp` : null;

// All image keys actually used by the app — handy for service-worker precaching.
export const ALL_IMAGE_KEYS = [];

let _idSeen = {};
const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// A-card factory
const a = (day, name, imageKey, howTo, whatItDoes) => {
  let id = `d${day}-${slug(name)}`;
  while (_idSeen[id]) id += "x";
  _idSeen[id] = true;
  if (imageKey) ALL_IMAGE_KEYS.push(imageKey);
  return { id, day, name, type: "A", imageKey, img: imgUrl(imageKey), howTo, whatItDoes };
};

// mini-exercise factory (inside a circuit)
const mini = (name, imageKey, howTo, whatItDoes) => {
  if (imageKey) ALL_IMAGE_KEYS.push(imageKey);
  return { name, imageKey, img: imgUrl(imageKey), howTo, whatItDoes };
};

// B-card factory
const b = (day, name, circuit) => {
  let id = `d${day}-${slug(name)}`;
  while (_idSeen[id]) id += "x";
  _idSeen[id] = true;
  return { id, day, name, type: "B", imageKey: null, img: null, circuit };
};

export const DAY_META = [
  { day: 1, label: "Mon", title: "Shoulders", rest: false },
  { day: 2, label: "Tue", title: "Chest", rest: false },
  { day: 3, label: "Wed", title: "Triceps", rest: false },
  { day: 4, label: "Thu", title: "Legs", rest: false },
  { day: 5, label: "Fri", title: "Back", rest: false },
  { day: 6, label: "Sat", title: "Biceps", rest: false },
  { day: 7, label: "Sun", title: "Rest", rest: true },
];

// The six training categories, keyed by day-number identity for week generation.
export const CATEGORIES = DAY_META.filter((d) => !d.rest).map((d) => ({ id: d.day, title: d.title }));

// Resolve a category id (1..6) to its display title (e.g. 3 → "Triceps").
export const categoryTitle = (catId) => {
  const m = DAY_META.find((d) => d.day === catId);
  return m ? m.title : "";
};

export const EXERCISES = {
  1: [
    a(1, "Dumbbell Shrugs", "9fyk93",
      "Stand tall holding heavy dumbbells at your sides. Elevate your shoulders as high as possible toward your ears, hold for a second, and lower slowly.",
      "Builds upper trapezius muscles and neck stability."),
    a(1, "Cable Face Pulls", "9iuckc",
      "Using a rope attachment set at upper-chest height, pull the rope toward your nose, flaring elbows out and squeezing shoulder blades together.",
      "Strengthens rear deltoids, rotator cuffs, and improves posture."),
    a(1, "Seated Dumbbell Shoulder Press", "404cvl",
      "Sit upright on a bench. Press two dumbbells overhead from shoulder height until arms are fully extended, then lower with control.",
      "Primary mass builder for the anterior and medial deltoids."),
    a(1, "Dumbbell Front Raises", "a6wp6i",
      "Stand holding dumbbells in front of your thighs. Raise them straight forward with straight arms until they reach eye level, then lower.",
      "Isolates the anterior (front) deltoids."),
    a(1, "Standing Full Dumbbell Lateral Raise", "v97wkz",
      "Raise dumbbells out to the sides up to head level, then lower them in a wide arc to meet in front of the groin.",
      "Targets the lateral (side) deltoids through a full range of motion."),
    a(1, "Low Cable Lateral Raise", "vsiqo2",
      "Stand sideways to a low pulley. Pull the single handle outward and upward to shoulder height, keeping a slight bend in the elbow.",
      "Provides constant tension on the lateral deltoids."),
    a(1, "Seated Arnold Press", "buv80r",
      "Sit upright. Hold dumbbells in front of your face with palms facing you. Twist your wrists outward as you press the dumbbells overhead.",
      "Hits all three heads of the deltoids through rotational movement."),
    a(1, "Cable Upright Rows", "tmw1sa",
      "Use a low cable with a straight bar. Pull the bar vertically up the front of your body to chest level, leading with the elbows high.",
      "Builds traps and lateral deltoids."),
  ],
  2: [
    a(2, "Pec Deck Machine Flyes", "5on1f5",
      "Sit at the machine with arms on the pads. Squeeze your arms together in front of your chest, pausing at peak contraction.",
      "Isolates the pectoral muscles for width and definition."),
    a(2, "Flat Dumbbell Bench Press", "9pkptv",
      "Lie flat on a bench. Press dumbbells upward from chest level until arms are straight, then lower to chest level.",
      "Builds overall chest mass and recruits stabilizing muscles."),
    a(2, "Dumbbell Squeeze Press", "84o2ln",
      "Lie flat. Press two dumbbells tightly together over your chest and push them up while maintaining the inward squeeze.",
      "Maximizes inner-chest activation and time under tension."),
    a(2, "Single-Arm Flat Dumbbell Press", "jb9rjh",
      "Lie flat holding one dumbbell. Press it upward while keeping the core tight to prevent your body from rotating.",
      "Builds chest strength while heavily engaging the core for stability."),
    a(2, "Incline Dumbbell Bench Press", "qg7j95",
      "Sit on a bench angled at 45 degrees. Press dumbbells up and forward, then lower with control.",
      "Targets the upper pectoral muscles and front deltoids."),
    b(2, "B2 — Power & Conditioning Circuit", {
      name: "B2 Power & Conditioning",
      miniExercises: [
        mini("Step Jumping Jacks", "2pvxjw",
          "Perform traditional jumping jacks while stepping on and off a low platform.",
          "Full-body warmup and cardiovascular endurance."),
        mini("Plate Swings", "5tbvis",
          "Hold a weight plate with both hands. Hinge at hips to swing it between legs, then thrust hips to swing it up to chest level.",
          "Builds explosive glute and hip power."),
        mini("Plate Ground-to-Overhead", "iv79uj",
          "Lift a plate from the floor directly up over your head in one smooth, explosive motion.",
          "Full-body power generation."),
        mini("Bent-Over Plate Rows", "xji55x",
          "Bend at the hips and pull a weight plate to the stomach, keeping the back flat.",
          "Maintains back engagement during metabolic conditioning."),
        mini("Small Jumps", "ogoyiy",
          "Continuous, rapid low-impact vertical hops in place.",
          "Conditioning for the calves and Achilles tendons."),
        mini("High Knees", "g1qhqp",
          "Jog in place rapidly lifting knees to hip height. Hold hands flat at waist level as targets for the knees.",
          "Intense cardiovascular burn and core activation."),
      ],
    }),
    a(2, "Dumbbell Pullover", "ywwdk0",
      "Lie flat. Hold one dumbbell with both hands over your chest. Lower it backward over your head with slightly bent elbows, then pull back up.",
      "Expands the ribcage, stretches the pecs, and engages the lats."),
    a(2, "High-to-Low Cable Crossovers", "ohl056",
      "Stand between high pulleys. Pull handles down and across your body, crossing your hands in front of your waist.",
      "Sculpts the lower and inner chest with continuous cable tension."),
  ],
  3: [
    a(3, "Cable Overhead Tricep Extension", "4so763",
      "Face away from a high cable holding a rope behind your head. Push your hands forward to straighten your arms.",
      "Targets the long head of the tricep."),
    a(3, "Seated Dual-Dumbbell Overhead Tricep Extension", "8i68io",
      "Sit upright holding a dumbbell in each hand overhead. Lower them behind your head, keeping elbows pointing up, then press back up.",
      "Builds bilateral tricep strength and stability."),
    a(3, "Cable Tricep Pulldown", "c38ld4",
      "Stand facing a high cable. Push the bar/rope down until arms are fully locked out at your sides.",
      "Isolates the lateral head of the triceps."),
    a(3, "Single-Arm Cable Tricep Pushdowns", "ooynug",
      "Use a single D-handle on a high cable. Push down with one arm until locked out.",
      "Fixes muscle imbalances between the left and right arms."),
    a(3, "Seated Single-Arm Overhead Dumbbell Tricep Extension", "r01yrl",
      "Sit upright. Lower one dumbbell behind your head with one arm, then extend straight up.",
      "Isolates the long head of the tricep unilaterally."),
    a(3, "Seated Overhead Dumbbell Tricep Extension", "yzsm4o",
      "Sit upright holding one heavy dumbbell with both hands. Lower it behind the neck and press up.",
      "Allows for heavier weight to build overall tricep mass."),
    a(3, "Bench Dips", "f1oxlu",
      "Place hands on the edge of a bench behind you, legs straight out. Lower your hips toward the floor by bending elbows, then press up.",
      "Uses body weight to build triceps and anterior deltoids."),
    a(3, "Cable Tricep Kickbacks", "ar7ouu",
      "Bend forward at the hips. Hold a low cable handle and extend your arm straight backward until locked out.",
      "Provides peak contraction at the top of the movement."),
  ],
  4: [
    a(4, "Dumbbell Goblet Squats", "7zxxhr",
      "Hold one dumbbell vertically against your chest. Squat down until thighs are parallel to the floor, then stand.",
      "Builds quads and glutes while reinforcing upright posture."),
    a(4, "Lying Hamstring Curls", "8wi16v",
      "Lie face-down on the curl machine. Curl the padded bar up toward your glutes.",
      "Directly isolates the hamstring muscles."),
    a(4, "Dumbbell Calf Raises", "667orr",
      "Stand holding dumbbells. Push up onto your tiptoes, pause, and lower your heels slowly.",
      "Builds calf muscle size and ankle strength."),
    a(4, "Dumbbell Farmer's Walk", "776lsc",
      "Hold heavy dumbbells at your sides and walk with perfect, upright posture.",
      "Full-body functional movement; builds grip, core, and leg endurance."),
    a(4, "Seated Leg Extensions", "dt1er2",
      "Sit in the machine. Straighten your legs against the padded bar.",
      "Isolates the quadriceps (front of the thigh)."),
    a(4, "Dumbbell Walking Lunges", "dymt99",
      "Hold dumbbells. Step forward into a deep lunge, then step the other foot forward into the next lunge.",
      "Builds dynamic leg strength, balance, and glute activation."),
    a(4, "Dumbbell Romanian Deadlifts", "gt869g",
      "Hold dumbbells in front of thighs. Keep legs slightly bent, hinge at the hips, push glutes back and lower the weights, then stand up.",
      "Strengthens the posterior chain (hamstrings, glutes, lower back)."),
    a(4, "45-Degree Leg Press", "mc6wa9",
      "Sit in the machine. Push the heavy plate upward with your feet, then lower with control.",
      "Safely moves heavy loads to build overall leg mass."),
  ],
  5: [
    a(5, "Wide-Grip Cable Lat Pulldowns", "c8pe80",
      "Grip a wide bar on a high cable. Pull the bar down to your upper chest while leaning slightly back.",
      "Builds back width and the outer latissimus dorsi."),
    a(5, "Seated Low Cable Rows", "kbbgn1",
      "Sit with legs braced. Pull a low cable handle horizontally into your stomach.",
      "Builds back thickness and mid-back musculature."),
    a(5, "Machine Cable Row (Ver 1)", "l7cfjs",
      "Sit on the machine bench with feet flat on the floor, knees locked under the rod pad. Pull handles to the chest.",
      "Allows for strict, stable upper back isolation."),
    a(5, "Machine Cable Row (Feet Up)", "mcrft",
      "Sit on the machine with your feet up on the raised footrests, knees slightly bent. Pull the handle into your stomach, squeezing your shoulder blades, then return with control.",
      "Builds mid-back thickness with the legs elevated so the back does the work."),
    a(5, "Single-Arm Dumbbell Row", "qwroa8",
      "Support one knee and hand on a bench. Pull a dumbbell upward to your hip with the free arm.",
      "Builds unilateral back thickness and lat development."),
    a(5, "Machine Cable Row (Ver 2)", "ttyp6k",
      "Sit upright with legs extended straight on the footrests. Pull the handle into the stomach.",
      "Engages the lower back for stability while rowing."),
    a(5, "Close-Grip Cable Lat Pulldowns", "maiyp4",
      "Use a narrow V-handle. Pull straight down to the chest.",
      "Targets the lower lats and middle back."),
    a(5, "Incline Chest-Supported Dumbbell Rows", "qtit34",
      "Lie face-down on an incline bench. Pull dumbbells upward to your ribcage.",
      "Eliminates lower back momentum to strictly target the upper back."),
  ],
  6: [
    a(6, "Low Cable Bicep Curls", "3a60p3",
      "Stand using a low cable. Curl the bar/handle up to your shoulders.",
      "Provides constant tension on the biceps throughout the motion."),
    a(6, "Dumbbell Preacher Curls", "56it57",
      "Rest your upper arms on the angled pad of a preacher bench. Curl the dumbbells upward.",
      "Prevents cheating, isolating the short head of the bicep."),
    a(6, "Seated Dumbbell Bicep Curls", "854lqt",
      "Sit upright. Curl dumbbells from your sides up to your shoulders.",
      "Standard mass builder for the biceps."),
    a(6, "Dumbbell Hammer Curls", "i1ugm6",
      "Hold dumbbells vertically (palms facing each other) and curl upward.",
      "Targets the brachialis and brachioradialis for arm thickness."),
    a(6, "Incline Dumbbell Bicep Curls", "i1uxdd",
      "Sit on a reclined bench with arms hanging down. Curl the weight up.",
      "Stretches the long head of the bicep for peak development."),
    a(6, "Seated Dumbbell Concentration Curls", "ke1x4g",
      "Sit leaning forward, resting one elbow on the inner knee. Curl the weight upward.",
      "Builds the peak of the bicep."),
    b(6, "B1 — Cardio Box Circuit", {
      name: "B1 Cardio Box",
      miniExercises: [
        mini("Basic Step-Ups", "9y024a",
          "Step one foot onto a box, follow with the other, then step down. Alternate the leading foot.",
          "Builds basic coordination and leg endurance."),
        mini("Fast Step-Ups", "af051o",
          "Rapidly step up and down on a low box, keeping a quick cadence.",
          "Spikes heart rate and improves foot speed."),
        mini("Lateral Step-Over with Floor Touch", "knipph",
          "Jump sideways over the box, land softly, then hinge at the hips to touch the floor.",
          "Develops lateral agility and functional hip hinging."),
        mini("Step Straddle Jumps", "lh8t4i",
          "Stand straddling the box. Jump up landing with both feet on the box, then jump back down to straddle.",
          "Improves explosive power."),
        mini("Quick Toe Taps", "wv5sk7",
          "Rapidly alternate tapping your toes on the edge of the box.",
          "High-intensity cardio and calf conditioning."),
        mini("Box Jumps", "z6n3ow",
          "Explode upward to jump with both feet onto the box, stand tall, then step down.",
          "Builds fast-twitch muscle fibers and vertical power."),
      ],
    }),
    a(6, "Seated Dumbbell Wrist Curls", "n6ecfw",
      "Rest forearms on thighs holding small weights. Flex wrists upward and downward.",
      "Strengthens the forearms and grip."),
  ],
  7: [], // Rest day
};
