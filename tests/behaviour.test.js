// The cat's behaviour (PLAN §5.2, §5.5, §5.6): priorities, sleep and naps,
// feeding, petting, play, the launch state and a clock that moves back.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { config } from '../src/config.js';
import { launchState, step, activity, putToSleep, wakeUp } from '../src/sim/behaviour.js';

const T = 1_000_000;
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const NEEDS = { hunger: 50, thirst: 50, fun: 50, affection: 50, energy: 80 };
const MOUTH = config.layout.mouth;
const FAR_AWAY = { x: 100, y: 650 };
const half = () => 0.5;

function launch({ asleep = false, needs = {} } = {}, random = half) {
  return launchState({ asleep, needs: { ...NEEDS, ...needs } }, T, config, random).state;
}

function at(state, now, events = [], needs = {}, random = half) {
  return step(state, { now, events, needs: { ...NEEDS, ...needs }, random }, config);
}

const stroke = (speed = 300) => ({ type: 'pet:stroke', x: 370, y: 450, speed });
const grab = (item) => ({ type: 'grab:start', item, x: 670, y: 310 });
const drop = (where = MOUTH) => ({ type: 'grab:end', x: where.x, y: where.y });
const feed = (item, where = MOUTH) => [grab(item), drop(where)];
const wand = (x, y = 600) => ({ type: 'wand:move', x, y });
const WAND_END = { type: 'wand:end' };

function gained(effects, meter) {
  return effects.filter((e) => e.type === 'gain' && e.meter === meter).reduce((sum, e) => sum + e.amount, 0);
}

// One stroke every `every` ms from `from` to `from + ms`.
function strokeFor(state, from, ms, every = 100, speed = 300, needs = {}) {
  const effects = [];
  let current = state;
  for (let t = from; t <= from + ms; t += every) {
    const result = at(current, t, [stroke(speed)], needs);
    current = result.state;
    effects.push(...result.effects);
  }
  return { state: current, effects };
}

// Priority order and interruptions (PLAN §5.6)

test('asleep: feeding and the wand are ignored, and the item floats back', () => {
  const asleep = launch({ asleep: true });
  let result = at(asleep, T + 100, feed('food'));
  assert.equal(result.state.mode, 'asleep');
  assert.deepEqual(result.effects, [{ type: 'floatBack', item: 'food' }]);
  result = at(result.state, T + 200, [wand(300)]);
  result = at(result.state, T + 300, [wand(700)]);
  assert.equal(result.state.mode, 'asleep');
  assert.deepEqual(result.effects, []);
});

test('asleep: petting still gives affection, with a sleepy purr', () => {
  const { state, effects } = strokeFor(launch({ asleep: true }), T + 100, 1000);
  assert.equal(state.mode, 'asleep');
  assert.equal(gained(effects, 'affection'), 2);
  assert.equal(at(state, T + 1200).animation, 'sleepy-purr');
});

test('eating outranks playing: a bowl dropped during play is eaten', () => {
  let result = at(launch(), T, [wand(100)]);
  assert.equal(result.state.mode, 'playing');
  result = at(result.state, T + 100, feed('food'));
  assert.equal(result.state.mode, 'eating');
  assert.deepEqual(result.effects, [{ type: 'use', item: 'food' }]);
});

test('eating ignores strokes, the wand and a second item', () => {
  let result = at(launch(), T + 100, feed('food'));
  result = at(result.state, T + 200, [stroke(300), stroke(2000), wand(100)]);
  result = at(result.state, T + 300, [wand(900), ...feed('water')]);
  assert.equal(result.state.mode, 'eating');
  assert.equal(result.animation, 'eat');
  assert.deepEqual(result.effects, [{ type: 'floatBack', item: 'water' }]);
});

test('playing outranks petting', () => {
  let result = at(launch(), T, [wand(100)]);
  result = at(result.state, T + 100, [stroke(300)]);
  assert.equal(result.state.mode, 'playing');
  assert.equal(gained(result.effects, 'affection'), 0);
});

test('petting outranks idle, and the wand outranks petting', () => {
  let result = at(launch(), T + 100, [stroke(300)]);
  assert.equal(result.state.mode, 'petted');
  assert.equal(result.animation, 'purr');
  result = at(result.state, T + 200, [wand(100)]);
  assert.equal(result.state.mode, 'playing');
});

// Sleep and naps (PLAN §5.2)

test('at energy 20 the cat sleeps only after a meal finishes', () => {
  let result = at(launch(), T + 100, feed('food'));
  result = at(result.state, T + 1000, [], { energy: 20 });
  assert.equal(result.state.mode, 'eating');
  result = at(result.state, T + 3100, [], { energy: 20 });
  assert.equal(result.state.mode, 'asleep');
  assert.deepEqual(result.effects, [
    { type: 'gain', meter: 'hunger', amount: 35 },
    { type: 'floatBack', item: 'food' },
    { type: 'sleep' },
  ]);
});

test('at energy 20 the cat sleeps only once petting ends', () => {
  let result = at(launch(), T + 100, [stroke(300)], { energy: 21 });
  result = at(result.state, T + 500, [stroke(300)], { energy: 20 });
  assert.equal(result.state.mode, 'petted');
  result = at(result.state, T + 1300, [], { energy: 20 });
  assert.equal(result.state.mode, 'petted');
  result = at(result.state, T + 1301, [], { energy: 20 });
  assert.equal(result.state.mode, 'asleep');
});

test('an idle cat at energy 20 falls asleep at once', () => {
  const result = at(launch(), T + 16, [], { energy: 20 });
  assert.equal(result.state.mode, 'asleep');
  assert.deepEqual(result.effects, [{ type: 'sleep' }]);
});

test('a nap comes after 3 minutes without interaction at energy 59, but not at 60', () => {
  const cat = launch();
  assert.equal(at(cat, T + 3 * MINUTE - 1, [], { energy: 59 }).state.mode, 'idle');
  const napped = at(cat, T + 3 * MINUTE, [], { energy: 59 });
  assert.equal(napped.state.mode, 'asleep');
  assert.deepEqual(napped.effects, [{ type: 'sleep' }]);
  assert.equal(at(cat, T + 3 * MINUTE, [], { energy: 60 }).state.mode, 'idle');
  assert.equal(at(cat, T + HOUR, [], { energy: 60 }).state.mode, 'idle');
});

test('an interaction restarts the nap timer; the cursor does not', () => {
  let result = at(launch(), T + 2 * MINUTE, [stroke(300)], { energy: 59 });
  result = at(result.state, T + 3 * MINUTE, [], { energy: 59 });
  assert.equal(result.state.mode, 'idle');
  result = at(result.state, T + 5 * MINUTE, [], { energy: 59 });
  assert.equal(result.state.mode, 'asleep');

  result = at(launch(), T + 2 * MINUTE, [{ type: 'cursor:move', x: 300, y: 300 }], { energy: 59 });
  result = at(result.state, T + 3 * MINUTE, [], { energy: 59 });
  assert.equal(result.state.mode, 'asleep');
});

test('the cat wakes at energy 100', () => {
  let result = at(launch({ asleep: true }), T + 100, [], { energy: 99 });
  assert.equal(result.state.mode, 'asleep');
  result = at(result.state, T + 200, [], { energy: 100 });
  assert.equal(result.state.mode, 'idle');
  assert.deepEqual(result.effects, [{ type: 'wake' }]);
});

test('a held item floats back when the cat falls asleep, and its release is ignored', () => {
  let result = at(launch(), T + 100, [grab('food')]);
  result = at(result.state, T + 200, [], { energy: 20 });
  assert.deepEqual(result.effects, [{ type: 'sleep' }, { type: 'floatBack', item: 'food' }]);
  result = at(result.state, T + 300, [drop()], { energy: 20 });
  assert.deepEqual(result.effects, []);
});

test('an item picked up while the cat sleeps floats back when released', () => {
  let result = at(launch({ asleep: true }), T + 100, [grab('water')]);
  assert.deepEqual(result.effects, []);
  result = at(result.state, T + 200, [drop()]);
  assert.deepEqual(result.effects, [{ type: 'floatBack', item: 'water' }]);
});

// Feeding (PLAN §5.5)

test('a bowl at 95 or above is refused: the cat sniffs and the bowl floats back', () => {
  for (const [item, meter] of [['food', 'hunger'], ['water', 'thirst']]) {
    const result = at(launch(), T + 100, feed(item), { [meter]: 95 });
    assert.equal(result.state.mode, 'idle');
    assert.equal(result.animation, 'sniff');
    assert.deepEqual(result.effects, [{ type: 'floatBack', item }]);
  }
  assert.equal(at(launch(), T + 100, feed('food'), { hunger: 94 }).state.mode, 'eating');
});

test('eating lasts 3 s and gives +35 hunger when it ends', () => {
  let result = at(launch(), T + 100, feed('food'));
  result = at(result.state, T + 3099);
  assert.equal(result.state.mode, 'eating');
  assert.deepEqual(result.effects, []);
  result = at(result.state, T + 3100);
  assert.equal(result.state.mode, 'idle');
  assert.deepEqual(result.effects, [
    { type: 'gain', meter: 'hunger', amount: 35 },
    { type: 'floatBack', item: 'food' },
  ]);
});

test('drinking lasts 3 s and gives +40 thirst', () => {
  let result = at(launch(), T + 100, feed('water'));
  assert.equal(result.animation, 'drink');
  result = at(result.state, T + 3100);
  assert.equal(gained(result.effects, 'thirst'), 40);
});

test('a treat is always eaten while awake, in 1 s, for +5 hunger', () => {
  let result = at(launch(), T + 100, feed('treat'), { hunger: 100 });
  assert.equal(result.state.mode, 'eating');
  result = at(result.state, T + 1099);
  assert.equal(result.state.mode, 'eating');
  result = at(result.state, T + 1100);
  assert.deepEqual(result.effects, [
    { type: 'gain', meter: 'hunger', amount: 5 },
    { type: 'eaten', item: 'treat' },
  ]);
});

test('an item counts within 120 units of the mouth, and floats back from further away', () => {
  const edge = { x: MOUTH.x + 120, y: MOUTH.y };
  const beyond = { x: MOUTH.x + 121, y: MOUTH.y };
  assert.equal(at(launch(), T + 100, feed('food', edge)).state.mode, 'eating');
  for (const where of [beyond, FAR_AWAY]) {
    const result = at(launch(), T + 100, feed('food', where));
    assert.equal(result.state.mode, 'idle');
    assert.deepEqual(result.effects, [{ type: 'floatBack', item: 'food' }]);
  }
});

// Petting (PLAN §5.1, §5.6)

test('stroking gives +1 affection per 0.5 s', () => {
  const { effects } = strokeFor(launch(), T + 100, 2000, 50);
  assert.equal(gained(effects, 'affection'), 4);
});

test('a pause of more than 0.8 s between strokes does not count as stroking', () => {
  let result = at(launch(), T + 100, [stroke(300)]);
  result = at(result.state, T + 1000, [stroke(300)]);
  result = at(result.state, T + 1400, [stroke(300)]);
  assert.equal(result.state.strokeMs, 400);
});

test('the cat is petted until 0.8 s after the last stroke', () => {
  let result = at(launch(), T + 100, [stroke(300)]);
  result = at(result.state, T + 900);
  assert.equal(result.state.mode, 'petted');
  result = at(result.state, T + 901);
  assert.equal(result.state.mode, 'idle');
});

test('above 1200 units/s the cat flinches; below 80 a stroke does not count', () => {
  let result = at(launch(), T + 100, [stroke(1201)]);
  assert.equal(result.state.mode, 'idle');
  assert.equal(result.animation, 'flinch');
  assert.deepEqual(result.effects, []);
  assert.equal(at(launch(), T + 100, [stroke(1200)]).state.mode, 'petted');
  result = at(launch(), T + 100, [stroke(79)]);
  assert.equal(result.state.mode, 'idle');
  assert.equal(result.animation, 'sit');
});

// Play (PLAN §5.6)

test('the cat pounces at most once per second, for +2 fun each', () => {
  let result = at(launch(), T, [wand(100)]);
  const effects = [];
  for (let i = 1; i <= 20; i += 1) {
    // 100 units every 100 ms: 1000 units/s
    result = at(result.state, T + i * 100, [wand(100 + (i % 2) * 100)]);
    effects.push(...result.effects);
  }
  assert.equal(gained(effects, 'fun'), 4); // pounces at 100 ms and 1100 ms
});

test('a wand slower than 400 units/s gets no pounce', () => {
  let result = at(launch(), T, [wand(100)]);
  for (let i = 1; i <= 20; i += 1) {
    result = at(result.state, T + i * 100, [wand(100 + (i % 2) * 30)]);
    assert.deepEqual(result.effects, []);
  }
  assert.equal(result.animation, 'track-wand');
});

test('play ends 2 s after the wand goes', () => {
  let result = at(launch(), T, [wand(100)]);
  result = at(result.state, T + 500, [WAND_END]);
  result = at(result.state, T + 2499);
  assert.equal(result.state.mode, 'playing');
  result = at(result.state, T + 2500);
  assert.equal(result.state.mode, 'idle');
});

test('play ends at once when energy reaches 20, and the cat falls asleep', () => {
  let result = at(launch(), T, [wand(100)]);
  result = at(result.state, T + 100, [wand(200)], { energy: 20 });
  assert.equal(result.state.mode, 'asleep');
  assert.ok(result.effects.some((e) => e.type === 'sleep'));
});

test('a cat with energy 20 or below does not start playing', () => {
  assert.equal(at(launch(), T + 100, [wand(100)], { energy: 21 }).state.mode, 'playing');
  assert.equal(at(launch(), T + 100, [wand(100)], { energy: 20 }).state.mode, 'asleep');
});

test('the needs tick learns whether the cat is asleep or playing', () => {
  assert.deepEqual(activity(launch()), { asleep: false, playing: false });
  assert.deepEqual(activity(launch({ asleep: true })), { asleep: true, playing: false });
  assert.deepEqual(activity(at(launch(), T, [wand(100)]).state), { asleep: false, playing: true });
});

// A clock that moves back (PLAN §5.7)

test('a clock moved back changes nothing: a meal still ends 3 s after it began', () => {
  let result = at(launch(), T + 100, feed('food'));
  result = at(result.state, T + 1100);
  result = at(result.state, T + 1100 - HOUR);
  assert.equal(result.state.mode, 'eating');
  assert.deepEqual(result.effects, []);
  result = at(result.state, T + 3099 - HOUR);
  assert.equal(result.state.mode, 'eating');
  result = at(result.state, T + 3100 - HOUR);
  assert.equal(result.state.mode, 'idle');
  assert.equal(gained(result.effects, 'hunger'), 35);
});

test('a clock moved back keeps the nap timer', () => {
  let result = at(launch(), T + 2 * MINUTE, [], { energy: 59 });
  result = at(result.state, T + 2 * MINUTE - HOUR, [], { energy: 59 });
  result = at(result.state, T + 3 * MINUTE - HOUR - 1, [], { energy: 59 });
  assert.equal(result.state.mode, 'idle');
  result = at(result.state, T + 3 * MINUTE - HOUR, [], { energy: 59 });
  assert.equal(result.state.mode, 'asleep');
});

// The launch state (PLAN §5.6)

test('launch: asleep if the save says so and energy is below 100, or if energy is 20 or below', () => {
  const cases = [
    [true, 99, 'asleep', []],
    [true, 10, 'asleep', []],
    [true, 100, 'idle', [{ type: 'wake' }]],
    [false, 20, 'asleep', [{ type: 'sleep' }]],
    [false, 21, 'idle', []],
    [false, 100, 'idle', []],
  ];
  for (const [asleep, energy, mode, effects] of cases) {
    const launched = launchState({ asleep, needs: { ...NEEDS, energy } }, T, config, half);
    assert.equal(launched.state.mode, mode, `asleep ${asleep}, energy ${energy}`);
    assert.deepEqual(launched.effects, effects, `asleep ${asleep}, energy ${energy}`);
  }
});

// Idle extras (PLAN §5.6)

test('idle extras come every 8 to 15 s, chosen by the injected random', () => {
  const low = () => 0;
  let result = { state: launch({}, low) };
  result = at(result.state, T + 7999, [], {}, low);
  assert.equal(result.animation, 'sit');
  result = at(result.state, T + 8000, [], {}, low);
  assert.equal(result.animation, 'groom');
  result = at(result.state, T + 9999, [], {}, low);
  assert.equal(result.animation, 'groom');
  result = at(result.state, T + 10_000, [], {}, low);
  assert.equal(result.animation, 'sit');
  result = at(result.state, T + 16_000, [], {}, low);
  assert.equal(result.animation, 'groom');

  const high = () => 0.99;
  result = { state: launch({}, high) };
  result = at(result.state, T + 14_929, [], {}, high);
  assert.equal(result.animation, 'sit');
  result = at(result.state, T + 14_930, [], {}, high);
  assert.equal(result.animation, 'look-at-cursor');
});

// The developer panel's Set asleep and Set awake

test('Set asleep and Set awake', () => {
  const asleep = putToSleep(launch(), T + 100, config, half);
  assert.equal(asleep.state.mode, 'asleep');
  assert.deepEqual(asleep.effects, [{ type: 'sleep' }]);
  const awake = wakeUp(asleep.state, T + 200, config, half);
  assert.equal(awake.state.mode, 'idle');
  assert.deepEqual(awake.effects, [{ type: 'wake' }]);
  const eating = at(launch(), T + 100, feed('food')).state;
  assert.deepEqual(putToSleep(eating, T + 200, config, half).effects, [
    { type: 'floatBack', item: 'food' },
    { type: 'sleep' },
  ]);
});
