// Needs, energy, catch-up and moods (PLAN §5), including every worked example
// in PLAN §5.8.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { config } from '../src/config.js';
import {
  catchUp, tickInApp, applyGain, setAsleep, mood, lowestNeed, chooseUpdate,
} from '../src/sim/needs.js';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const T0 = 1_762_000_000_000;
const CALM = { asleep: false, playing: false };

// The PLAN §5.8 start: 80, 80, 80, 80, 90, all progress 0, Live, awake.
function start(overrides = {}) {
  return {
    lastSeenAt: T0,
    settings: { mode: 'live' },
    needs: { hunger: 80, thirst: 80, fun: 80, affection: 80, energy: 90 },
    progress: { hunger: 0, thirst: 0, fun: 0, affection: 0, energy: 0, rest: 0 },
    asleep: false,
    ...overrides,
  };
}

function meters(save) {
  const { hunger, thirst, fun, affection, energy } = save.needs;
  return [hunger, thirst, fun, affection, energy];
}

function near(actual, expected, message) {
  assert.ok(Math.abs(actual - expected) < 1e-6, `${message}: ${actual}, expected ${expected}`);
}

// PLAN §5.8, one test per row.

test('§5.8 away 6 h: 77, 74, 79 (fun progress 0.5), 79, 100', () => {
  const save = catchUp(start(), T0 + 6 * HOUR, config);
  assert.deepEqual(meters(save), [77, 74, 79, 79, 100]);
  near(save.progress.fun, 0.5, 'fun progress');
  assert.equal(save.lastSeenAt, T0 + 6 * HOUR);
});

test('§5.8 then away 2 h more: 76, 72, 78, 79 (affection progress 0.33), 100', () => {
  const after6 = catchUp(start(), T0 + 6 * HOUR, config);
  const save = catchUp(after6, T0 + 8 * HOUR, config);
  assert.deepEqual(meters(save), [76, 72, 78, 79, 100]);
  near(save.progress.affection, 1 / 3, 'affection progress');
});

test('§5.8 Relaxed mode, away 6 h: 80, 80, 80, 80, 90', () => {
  const save = catchUp(start({ settings: { mode: 'relaxed' } }), T0 + 6 * HOUR, config);
  assert.deepEqual(meters(save), [80, 80, 80, 80, 90]);
  assert.equal(save.lastSeenAt, T0 + 6 * HOUR);
});

test('§5.8 away 40 days (counted as 30): 0, 0, 0, 0, 100', () => {
  const save = catchUp(start(), T0 + 40 * DAY, config);
  assert.deepEqual(meters(save), [0, 0, 0, 0, 100]);
});

test('§5.8 clock moved back 1 h: 80, 80, 80, 80, 90', () => {
  const save = catchUp(start(), T0 - HOUR, config);
  assert.deepEqual(meters(save), [80, 80, 80, 80, 90]);
  assert.equal(save.lastSeenAt, T0 - HOUR); // re-based to the new time
});

test('§5.8 in app 10 min, awake and calm: 67, 63, 65, 70, 70', () => {
  const save = tickInApp(start(), 10 * MINUTE, CALM, config);
  assert.deepEqual(meters(save), [67, 63, 65, 70, 70]);
  assert.equal(save.lastSeenAt, T0 + 10 * MINUTE);
});

test('§5.8 in app 10 min, then fed once: 100, 63, 65, 70, 70', () => {
  const save = applyGain(tickInApp(start(), 10 * MINUTE, CALM, config), 'hunger', config.gains.meal);
  assert.deepEqual(meters(save), [100, 63, 65, 70, 70]);
});

test('§5.8 mini view 2 h, 120 catch-ups of 1 min: 79, 78, 80 (0.5), 80 (0.33), 100', () => {
  let save = start();
  for (let i = 1; i <= 120; i += 1) save = catchUp(save, T0 + i * MINUTE, config);
  assert.deepEqual(meters(save), [79, 78, 80, 80, 100]); // energy 100, not 90
  near(save.progress.fun, 0.5, 'fun progress');
  near(save.progress.affection, 1 / 3, 'affection progress');
});

// Catch-up details

test('away time is capped at 30 days', () => {
  // 3 h past 30 days would leave affection progress at 0.5 without the cap.
  const capped = catchUp(start(), T0 + 30 * DAY + 3 * HOUR, config);
  assert.equal(capped.progress.affection, 0);
  assert.equal(capped.progress.rest, 0);
  assert.equal(capped.lastSeenAt, T0 + 30 * DAY + 3 * HOUR);
});

test('a remainder carries across two catch-ups', () => {
  const once = catchUp(start(), T0 + 6 * HOUR, config);
  const twice = catchUp(catchUp(start(), T0 + 3 * HOUR, config), T0 + 6 * HOUR, config);
  assert.deepEqual(meters(twice), meters(once));
  for (const key of Object.keys(once.progress)) near(twice.progress[key], once.progress[key], key);
});

test('catch-up leaves its argument unchanged', () => {
  const save = start();
  catchUp(save, T0 + 6 * HOUR, config);
  assert.deepEqual(save, start());
});

// The floating-point guard (Phase 1 pitfalls)

test('600 ticks of 1000 ms give exactly 15 fun drops', () => {
  let save = start();
  for (let i = 0; i < 600; i += 1) save = tickInApp(save, 1000, CALM, config);
  assert.equal(save.needs.fun, 65);
});

// The brief's case above passes even without the 1e-9 guard; these two fail without it.
test('600 ticks of 1000 ms give exactly 20 energy drops', () => {
  let save = start();
  for (let i = 0; i < 600; i += 1) save = tickInApp(save, 1000, CALM, config);
  assert.equal(save.needs.energy, 70);
});

test('10 minutes of 60 fps ticks give exactly 15 fun drops', () => {
  let save = start();
  for (let i = 0; i < 36_000; i += 1) save = tickInApp(save, 1000 / 60, CALM, config);
  assert.equal(save.needs.fun, 65);
});

// In-app details

test('an elapsed time of 0 or less changes nothing', () => {
  for (const dt of [0, -1, -HOUR]) {
    const save = tickInApp(start(), dt, CALM, config);
    assert.deepEqual(save, start(), `dt ${dt}`);
  }
});

test('playing loses an extra point of energy every 5 s', () => {
  const save = tickInApp(start(), 30_000, { asleep: false, playing: true }, config);
  assert.equal(save.needs.energy, 90 - 1 - 6);
});

test('asleep, energy rises 1 every 6 s, and 20 to 100 takes 8 minutes', () => {
  const save = tickInApp(start({ needs: { ...start().needs, energy: 20 } }), 8 * MINUTE, { asleep: true, playing: false }, config);
  assert.equal(save.needs.energy, 100);
  assert.equal(tickInApp(start(), 60_000, { asleep: true, playing: false }, config).needs.energy, 100);
});

test('falling asleep or waking restarts progress.energy', () => {
  const ticked = tickInApp(start(), 20_000, CALM, config);
  assert.ok(ticked.progress.energy > 0);
  const asleep = setAsleep(ticked, true);
  assert.equal(asleep.asleep, true);
  assert.equal(asleep.progress.energy, 0);
  assert.equal(setAsleep(asleep, false).asleep, false);
});

// Gains and limits

test('gains clamp at 100, and meters at 0', () => {
  assert.equal(applyGain(start(), 'hunger', 35).needs.hunger, 100);
  assert.equal(applyGain(start(), 'energy', -95).needs.energy, 0);
  const empty = catchUp(start(), T0 + 30 * DAY, config);
  assert.equal(catchUp(empty, T0 + 31 * DAY, config).needs.thirst, 0);
});

// Moods (PLAN §5.4)

test('moods change at 60, 30 and 15, from the lowest of the four needs', () => {
  const cases = [
    [60, 'happy'], [59, 'okay'], [30, 'okay'], [29, 'attention'], [15, 'attention'], [14, 'urgent'], [0, 'urgent'],
  ];
  for (const [thirst, expected] of cases) {
    const needs = { hunger: 100, thirst, fun: 100, affection: 100, energy: 100 };
    assert.equal(mood(needs, config), expected, `thirst ${thirst}`);
  }
});

test('energy never changes the mood', () => {
  for (const energy of [0, 14, 29, 100]) {
    assert.equal(mood({ hunger: 80, thirst: 80, fun: 80, affection: 80, energy }, config), 'happy');
  }
  assert.equal(lowestNeed({ hunger: 50, thirst: 40, fun: 60, affection: 45, energy: 0 }), 'thirst');
});

// The gap rule (DECISIONS §3)

test('a 2-hour wall-clock gap goes to catch-up even when the frame gap is 16 ms', () => {
  // The frame gap is not an input: frame times can stop while a laptop sleeps.
  assert.equal(chooseUpdate(2 * HOUR, 2 * HOUR, config), 'catchUp');
});

test('a 0.2 s frame at 60× stays an in-app tick', () => {
  assert.equal(chooseUpdate(200, 200 * 60, config), 'tick');
});

test('game time that moved back goes to catch-up', () => {
  assert.equal(chooseUpdate(16, -HOUR, config), 'catchUp');
});

test('an ordinary frame, or a wall gap of exactly 10 s, is an in-app tick', () => {
  assert.equal(chooseUpdate(16, 16, config), 'tick');
  assert.equal(chooseUpdate(10_000, 10_000, config), 'tick');
  assert.equal(chooseUpdate(10_001, 10_001, config), 'catchUp');
});
