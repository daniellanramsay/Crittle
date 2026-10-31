// Every tunable number in the app (PLAN §4.5 rule 9), copied from docs/PLAN.md,
// or from DECISIONS.md §6 where the plan gives none. Phase 0 starts this file
// with its own numbers; Phase 1 extends it.

// Page colours (DECISIONS §6). index.html and manifest.webmanifest repeat them
// so the first paint is right before any script runs.
const colours = {
  background: '#1f1d2b',
  text: '#f4f1ea',
  accent: '#f2a65a',
  accentText: '#1f1d2b',
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

  // Taps on the version label that open the error log, and later the
  // developer panel (PLAN §4.8).
  devAccess: { taps: 5, withinMs: 3000 },

  colours,

  // Hand landmarks drawn over the video, in video pixels (DECISIONS §6).
  landmarks: {
    dotRadiusPx: 4,
    dotColour: colours.accent,
    lineWidthPx: 2,
    lineColour: '#ffffff',
  },
};
