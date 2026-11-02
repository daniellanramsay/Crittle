// Every tunable number in the app (PLAN §4.5 rule 9), copied from docs/PLAN.md,
// or from DECISIONS.md §6 where the plan gives none. Phase 0 started this file
// with its own numbers; Phase 1 adds the cat's.

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// Page colours (DECISIONS §6). index.html and manifest.webmanifest repeat the
// first four so the first paint is right before any script runs. The rest
// paint the room and the placeholder cat (Phase 1).
const colours = {
  background: '#1f1d2b',
  text: '#f4f1ea',
  accent: '#f2a65a',
  accentText: '#1f1d2b',
  wall: '#3a3552',
  floor: '#5b4636',
  shelf: '#8a5a3b',
  foodBowl: '#e07a5f',
  waterBowl: '#5fa8d3',
  jar: '#cfe3ea',
  treat: '#b5651d',
  cat: '#c8742a',
  eyes: '#6aa84f',
  nose: '#e8a0a8',
};

export const config = {
  // The camera request (PLAN §6.1 step 1). A start fails if no frame arrives,
  // or the stream ends, within startTimeoutMs (PLAN §6.6).
  camera: {
    constraints: {
      video: {
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 30 },
      },
      audio: false,
    },
    startTimeoutMs: 3000,
  },

  // The hand detector (PLAN §6.1 step 2). Detection time and rate are
  // averaged over the last averageOver detections (Phase 0 brief, step 12).
  hands: {
    numHands: 1,
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
    averageOver: 60,
  },

  // Phase 0 test page: the readouts refresh twice a second (Phase 0 brief, step 13).
  readoutsEveryMs: 500,

  // The on-screen error log (A6) keeps this many entries.
  errorLog: { maxEntries: 200 },

  // Taps on the version label that open the developer panel (PLAN §4.8).
  devAccess: { taps: 5, withinMs: 3000 },

  colours,

  // Hand landmarks drawn over the video, in video pixels (DECISIONS §6).
  landmarks: {
    dotRadiusPx: 4,
    dotColour: colours.accent,
    lineWidthPx: 2,
    lineColour: '#ffffff',
  },

  // The scene (PLAN §4.6): a fixed area scaled to fit the window, drawn at the
  // device's pixel ratio up to maxPixelRatio.
  scene: { width: 1000, height: 700, maxPixelRatio: 2 },

  // Where everything sits, in scene units from the top-left corner
  // (DECISIONS §6). Bowls and the jar give their centre and size; the cat
  // gives its box, which is also where strokes count.
  layout: {
    floorY: 470,
    shelf: { left: 600, right: 960, top: 330, thickness: 20 },
    food: { x: 670, y: 310, width: 100, height: 40 },
    water: { x: 790, y: 310, width: 100, height: 40 },
    jar: { x: 900, y: 285, width: 70, height: 90 },
    treatSize: 24,
    cat: { left: 250, top: 280, width: 240, height: 340 },
    mouth: { x: 480, y: 395 },
    feedingSpot: { x: 550, y: 600 },
  },

  // Needs (PLAN §5.1): one point lost per interval, in the app and away (Live).
  needs: {
    inAppMs: { hunger: 45 * 1000, thirst: 35 * 1000, fun: 40 * 1000, affection: 60 * 1000 },
    awayMs: { hunger: 2 * HOUR, thirst: 1 * HOUR, fun: 4 * HOUR, affection: 6 * HOUR },
  },

  // Points gained per action (PLAN §5.1, §5.5). trick is used from Phase 4.
  gains: { meal: 35, drink: 40, treat: 5, pounce: 2, trick: 3 },

  // Energy (PLAN §5.2): lost while awake, an extra point while playing, gained
  // while asleep, and gained while away in Live mode. trickCost is Phase 4's.
  energy: {
    awakeLossMs: 30 * 1000,
    playLossMs: 5 * 1000,
    asleepGainMs: 6 * 1000,
    awayGainMs: 10 * MINUTE,
    trickCost: 1,
  },

  // Sleep (PLAN §5.2): asleep at energy 20 or below, awake at 100, and a nap
  // after 3 minutes without interaction while energy is below 60.
  sleep: { fallAsleepAt: 20, wakeAt: 100, napBelow: 60, napAfterMs: 3 * MINUTE },

  // Moods from the lowest of the four needs (PLAN §5.4).
  moods: { happyFrom: 60, okayFrom: 30, urgentBelow: 15 },

  // The cat's behaviour (PLAN §5.5, §5.6, §6.7; DECISIONS §6).
  behaviour: {
    fullAt: 95, // a bowl is refused at 95 or above
    mouthReach: 120, // scene units from the mouth point
    bowlMs: 3000, // eating or drinking from a bowl
    treatMs: 1000,
    pettingPointMs: 500, // +1 affection per 0.5 s of stroking
    pettedForMs: 800, // Petted ends 0.8 s after the last stroke
    strokeSpeed: { min: 80, max: 1200 }, // units/s; faster makes the cat flinch
    playEndsAfterMs: 2000, // after wand:end
    pounceSpeed: 400, // units/s
    pounceEveryMs: 1000,
    idleExtraEveryMs: { min: 8000, max: 15000 },
    // Placeholder reaction lengths until Phase 3's animations (DECISIONS §6)
    reactionMs: { flinch: 500, sniff: 1500, pounce: 400, idleExtra: 2000 },
  },

  // Items float back to the shelf over this time; a treat fades out (PLAN §5.5).
  floatBackMs: 500,

  // Time handling (PLAN §5.7, §4.5 rule 4): away time is capped at 30 days; a
  // wall-clock gap over gapMs goes to catch-up; the save is written every
  // saveEveryMs as well as after changes.
  time: { maxAwayMs: 30 * DAY, gapMs: 10 * 1000, saveEveryMs: 10 * 1000 },

  // Touch and mouse (PLAN §6.7; DECISIONS §6): hold 300 ms on empty floor for
  // the wand, moving at most holdSlop units; stroke speed is measured over the
  // last speedWindowMs of movement.
  pointer: { wandHoldMs: 300, holdSlop: 10, speedWindowMs: 100 },

  // Developer panel time controls (Phase 1 brief, step 11). Speed 0 is Pause (A8).
  devPanel: {
    awayFor: [10 * MINUTE, HOUR, 2 * HOUR, 6 * HOUR, DAY, 7 * DAY, 40 * DAY],
    inAppFor: [MINUTE, 10 * MINUTE, HOUR],
    speeds: [0, 1, 10, 60],
    clockBackMs: HOUR,
  },

  // The hidden learning speed, rolled once for each new cat (PLAN §7.3) and
  // rounded to 2 decimal places (DECISIONS §6). Training uses it from Phase 4.
  learning: {
    aptitude: { min: 0.7, max: 1.4 },
    affinity: { min: 0.8, max: 1.2 },
    decimals: 2,
  },

  // The first save (PLAN §4.7). storage.js stamps createdAt and lastSeenAt
  // with the moment it's made and rolls aptitude and affinity (DECISIONS §3).
  defaultSave: {
    schema: 1,
    createdAt: 0,
    lastSeenAt: 0,
    settings: { mode: 'live', camera: true, preview: true, dev: false, tutorialDone: false },
    pet: {
      name: 'Kitty',
      species: 'cat',
      breed: 'shorthair',
      pattern: 'tabby',
      colours: { base: '#c8742a', second: '#5a3416', third: null },
      eyes: 'green',
      nose: 'pink',
      aptitude: 1.12,
      affinity: { sitpretty: 1.05, highfive: 0.92, spin: 1.10 },
    },
    needs: { hunger: 80, thirst: 80, fun: 80, affection: 80, energy: 90 },
    progress: { hunger: 0, thirst: 0, fun: 0, affection: 0, energy: 0, rest: 0 },
    asleep: false,
    tricks: { sitpretty: 0, highfive: 0, spin: 0 },
    stats: { commands: 0 },
  },
};
