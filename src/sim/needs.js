// Meters, decay, Live/Relaxed, catch-up and moods (PLAN §5). Pure: no DOM,
// timers, storage or Date.now(); every time arrives as an argument
// (PLAN §4.5 rule 5). Each function returns a new save and leaves its
// argument unchanged.

export const NEEDS = ['hunger', 'thirst', 'fun', 'affection'];

export const MOOD_LABELS = {
  happy: 'Happy',
  okay: 'Okay',
  attention: 'Needs attention',
  urgent: 'Urgent',
};

// Floating-point error must never lose a point at an exact boundary (PLAN §5.7).
const EPSILON = 1e-9;

// Away time (PLAN §5.7): on launch, on becoming visible, after a wall-clock gap
// over 10 s, and from the developer panel's "Away for".
export function catchUp(save, now, cfg) {
  let away = now - save.lastSeenAt;
  if (!(away > 0)) away = 0; // the clock moved back: no change
  away = Math.min(away, cfg.time.maxAwayMs); // capped at 30 days
  if (save.settings.mode === 'relaxed') away = 0; // Relaxed: everything freezes while away
  const next = copy(save);
  for (const need of NEEDS) lose(next, need, away / cfg.needs.awayMs[need]);
  // The cat rests while away. progress.rest carries over, so the mini view's
  // one-minute catch-ups add up.
  const rest = next.progress.rest + away / cfg.energy.awayGainMs;
  const gained = Math.floor(rest + EPSILON);
  next.needs.energy = Math.min(100, next.needs.energy + gained);
  next.progress.rest = Math.max(0, rest - gained);
  next.lastSeenAt = now;
  return next;
}

// In-app time (PLAN §5.1, §5.2, §5.7): dtMs since the previous tick, while the
// page is visible. activity is { asleep, playing } from behaviour.js.
export function tickInApp(save, dtMs, activity, cfg) {
  if (!(dtMs > 0)) return save; // the clock moved back: nothing changes
  const next = copy(save);
  for (const need of NEEDS) lose(next, need, dtMs / cfg.needs.inAppMs[need]);
  if (activity.asleep) {
    const p = next.progress.energy + dtMs / cfg.energy.asleepGainMs;
    const gained = Math.floor(p + EPSILON);
    next.needs.energy = Math.min(100, next.needs.energy + gained);
    next.progress.energy = Math.max(0, p - gained);
  } else {
    // Playing adds its extra loss to the same count toward the next point.
    let perMs = 1 / cfg.energy.awakeLossMs;
    if (activity.playing) perMs += 1 / cfg.energy.playLossMs;
    lose(next, 'energy', dtMs * perMs);
  }
  next.lastSeenAt = save.lastSeenAt + dtMs;
  return next;
}

// Gains from actions, kept inside 0 to 100 (PLAN §5).
export function applyGain(save, meter, amount) {
  const next = copy(save);
  next.needs[meter] = Math.min(100, Math.max(0, next.needs[meter] + amount));
  return next;
}

// The save records whether the cat is asleep (PLAN §5.6), and progress.energy
// restarts at 0 whenever it falls asleep or wakes (PLAN §5.2).
export function setAsleep(save, asleep) {
  const next = copy(save);
  next.asleep = asleep;
  next.progress.energy = 0;
  return next;
}

// The lowest of the four needs decides the mood; energy never does (PLAN §5.4).
export function mood(needs, cfg) {
  const lowest = needs[lowestNeed(needs)];
  if (lowest >= cfg.moods.happyFrom) return 'happy';
  if (lowest >= cfg.moods.okayFrom) return 'okay';
  if (lowest >= cfg.moods.urgentBelow) return 'attention';
  return 'urgent';
}

// The first of the four needs with the lowest value.
export function lowestNeed(needs) {
  return NEEDS.reduce((lowest, need) => (needs[need] < needs[lowest] ? need : lowest));
}

// Which update a frame gets (PLAN §5.7). A wall-clock gap over 10 s (the laptop
// slept, the tab froze) or game time that moved back goes to catch-up; anything
// else is in-app time. The wall clock keeps counting while a computer sleeps,
// when frame times may not, and ignores the developer speed, so a slow frame at
// 60× stays in-app time (DECISIONS §3).
export function chooseUpdate(wallGapMs, gameElapsedMs, cfg) {
  return wallGapMs > cfg.time.gapMs || gameElapsedMs < 0 ? 'catchUp' : 'tick';
}

// progress[meter] counts toward the next point; whole points move the meter.
function lose(save, meter, points) {
  const p = save.progress[meter] + points;
  const whole = Math.floor(p + EPSILON);
  save.needs[meter] = Math.max(0, save.needs[meter] - whole);
  save.progress[meter] = Math.max(0, p - whole);
}

function copy(save) {
  return { ...save, needs: { ...save.needs }, progress: { ...save.progress } };
}
