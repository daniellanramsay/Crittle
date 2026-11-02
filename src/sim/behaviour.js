// The cat's state machine (PLAN §5.2, §5.5, §5.6). Pure: no DOM, timers,
// storage or Date.now(); time and randomness arrive in the input
// (PLAN §4.5 rule 5).
//
// step(state, input, cfg) returns { state, animation, effects }.
//   input:   { now, events, needs, random }. events are the vocabulary events
//            since the last step, in order, as { type, ...payload }.
//   effects: { type: 'gain', meter, amount }
//            { type: 'sleep' } or { type: 'wake' }
//            { type: 'use', item }        the item sits by the cat while used
//            { type: 'floatBack', item }  it floats back to the shelf
//            { type: 'eaten', item }      a treat is gone
//
// Modes, highest priority first: asleep, eating, playing, petted, idle. The
// trick mode joins in Phase 4. Flinch, sniff, pounce and the idle extras are
// short reactions shown over a mode, not modes of their own (DECISIONS §3).

const IDLE_EXTRAS = ['groom', 'stretch', 'tail-flick', 'look-at-cursor'];

// What each item does at the mouth (PLAN §5.1, §5.5).
const MEALS = {
  food: { meter: 'hunger', gain: 'meal', lasts: 'bowlMs' },
  water: { meter: 'thirst', gain: 'drink', lasts: 'bowlMs' },
  treat: { meter: 'hunger', gain: 'treat', lasts: 'treatMs' },
};

// The launch state (PLAN §5.6), after catch-up: asleep if the save says so and
// energy is below 100, or if energy is 20 or below; otherwise idle.
export function launchState(save, now, cfg, random) {
  const { energy } = save.needs;
  const asleep = (save.asleep && energy < cfg.sleep.wakeAt) || energy <= cfg.sleep.fallAsleepAt;
  const state = {
    mode: asleep ? 'asleep' : 'idle',
    now, // the time of the last step
    lastInteractionAt: now, // the nap timer counts from launch, or the last interaction
    meal: null, // { item, meter, amount, until } while eating
    lastStrokeAt: -Infinity, // the last stroke in the petting band
    strokeMs: 0, // stroking time not yet turned into affection
    wand: null, // { x, y, at } while the wand is out
    wandEndedAt: null,
    lastPounceAt: -Infinity,
    held: null, // the item being carried, if any
    reaction: null, // { name, until }
    nextExtraAt: now + idleGap(random, cfg),
  };
  const effects = asleep === save.asleep ? [] : [{ type: asleep ? 'sleep' : 'wake' }];
  return { state, effects };
}

export function step(previous, { now, events, needs, random }, cfg) {
  const turn = { state: shiftTimes(previous, now), needs, effects: [], cfg, random };
  turn.state.now = now;
  for (const event of events) handle(turn, event);
  advance(turn);
  return { state: turn.state, animation: animationOf(turn.state, cfg), effects: turn.effects };
}

// What the needs tick needs to know (needs.js, tickInApp).
export function activity(state) {
  return { asleep: state.mode === 'asleep', playing: state.mode === 'playing' };
}

// The developer panel's Set asleep and Set awake (A4).
export function putToSleep(previous, now, cfg, random) {
  const turn = { state: shiftTimes(previous, now), needs: null, effects: [], cfg, random };
  turn.state.now = now;
  if (turn.state.mode !== 'asleep') {
    const { meal } = turn.state;
    if (meal) {
      // An unfinished meal gives nothing and goes back.
      turn.effects.push({ type: 'floatBack', item: meal.item });
      turn.state.meal = null;
    }
    fallAsleep(turn);
  }
  return { state: turn.state, effects: turn.effects };
}

export function wakeUp(previous, now, cfg, random) {
  const turn = { state: shiftTimes(previous, now), needs: null, effects: [], cfg, random };
  turn.state.now = now;
  if (turn.state.mode === 'asleep') wake(turn);
  return { state: turn.state, effects: turn.effects };
}

function handle(turn, event) {
  const { state } = turn;
  // Any vocabulary event except the cursor ones is an interaction (PLAN §5.2).
  if (event.type !== 'cursor:move' && event.type !== 'cursor:hide') state.lastInteractionAt = state.now;
  switch (event.type) {
    case 'pet:stroke':
      stroke(turn, event.speed);
      break;
    case 'grab:start':
      state.held = event.item;
      break;
    case 'grab:end':
      release(turn, event);
      break;
    case 'wand:move':
      moveWand(turn, event);
      break;
    case 'wand:end':
      state.wand = null;
      state.wandEndedAt = state.now;
      break;
    default:
      // cursor:move, cursor:hide, grab:move, and tricks until Phase 4
  }
}

// Petting (PLAN §5.6, §6.3): 80 to 1200 units/s pets, faster flinches.
function stroke(turn, speed) {
  const { state, cfg } = turn;
  const { strokeSpeed, pettedForMs, pettingPointMs } = cfg.behaviour;
  if (!(speed >= strokeSpeed.min)) return;
  const busy = state.mode === 'eating' || state.mode === 'playing';
  if (speed > strokeSpeed.max) {
    if (state.mode !== 'asleep' && !busy) react(turn, 'flinch');
    return;
  }
  if (busy) return; // eating and playing outrank petting
  if (state.mode === 'idle') enter(turn, 'petted');
  // Asleep or petted, stroking time counts: the gap since the previous stroke,
  // when it's within 0.8 s (DECISIONS §3). +1 affection per 0.5 s.
  const gap = state.now - state.lastStrokeAt;
  if (gap <= pettedForMs) state.strokeMs += gap;
  state.lastStrokeAt = state.now;
  const points = Math.floor(state.strokeMs / pettingPointMs);
  if (points > 0) {
    state.strokeMs -= points * pettingPointMs;
    turn.effects.push({ type: 'gain', meter: 'affection', amount: points });
  }
}

// Feeding (PLAN §5.5): an item released within reach of the mouth while the cat
// is awake is used; anything else floats back.
function release(turn, { x, y }) {
  const { state, needs, cfg, effects } = turn;
  const item = state.held;
  state.held = null;
  if (item === null) return; // it already floated back when the cat fell asleep
  const { mouth } = cfg.layout;
  const atMouth = Math.hypot(x - mouth.x, y - mouth.y) <= cfg.behaviour.mouthReach;
  if (!atMouth || state.mode === 'asleep' || state.mode === 'eating') {
    effects.push({ type: 'floatBack', item });
    return;
  }
  const { meter, gain, lasts } = MEALS[item];
  if (item !== 'treat' && needs[meter] >= cfg.behaviour.fullAt) {
    react(turn, 'sniff'); // sniffs and turns away
    effects.push({ type: 'floatBack', item });
    return;
  }
  enter(turn, 'eating');
  state.meal = { item, meter, amount: cfg.gains[gain], until: state.now + cfg.behaviour[lasts] };
  effects.push({ type: 'use', item });
}

// Play (PLAN §5.6): the wand starts play while the cat is awake with energy
// above 20; it pounces when the wand moves faster than 400 units/s, at most
// once a second.
function moveWand(turn, { x, y }) {
  const { state, needs, cfg, effects } = turn;
  const { now } = state;
  const previous = state.wand;
  state.wand = { x, y, at: now };
  state.wandEndedAt = null;
  if (state.mode === 'asleep' || state.mode === 'eating') return;
  if (state.mode !== 'playing') {
    if (needs.energy <= cfg.sleep.fallAsleepAt) return;
    enter(turn, 'playing');
  }
  // Speed since the wand's position at an earlier step.
  if (!previous || now <= previous.at) return;
  const speed = Math.hypot(x - previous.x, y - previous.y) / ((now - previous.at) / 1000);
  if (speed > cfg.behaviour.pounceSpeed && now - state.lastPounceAt >= cfg.behaviour.pounceEveryMs) {
    state.lastPounceAt = now;
    effects.push({ type: 'gain', meter: 'fun', amount: cfg.gains.pounce });
    react(turn, 'pounce');
  }
}

// Timers and energy, after the events (PLAN §5.2, §5.6).
function advance(turn) {
  const { state, needs, cfg, effects, random } = turn;
  const { now } = state;
  const { fallAsleepAt, wakeAt, napBelow, napAfterMs } = cfg.sleep;

  if (state.reaction && now >= state.reaction.until) state.reaction = null;

  if (state.mode === 'eating' && now >= state.meal.until) {
    const { item, meter, amount } = state.meal;
    effects.push({ type: 'gain', meter, amount });
    effects.push(item === 'treat' ? { type: 'eaten', item } : { type: 'floatBack', item });
    state.meal = null;
    enter(turn, 'idle');
  }
  if (state.mode === 'petted' && now - state.lastStrokeAt > cfg.behaviour.pettedForMs) enter(turn, 'idle');
  if (state.mode === 'playing') {
    // Play ends at once at energy 20, and the cat falls asleep (DECISIONS §3).
    if (needs.energy <= fallAsleepAt) fallAsleep(turn);
    else if (state.wandEndedAt !== null && now - state.wandEndedAt >= cfg.behaviour.playEndsAfterMs) enter(turn, 'idle');
  }

  if (state.mode === 'asleep') {
    if (needs.energy >= wakeAt) wake(turn);
  } else if (state.mode === 'idle') {
    // Eating and petting have finished by now, so sleep never cuts them short.
    const nap = needs.energy < napBelow && now - state.lastInteractionAt >= napAfterMs;
    if (needs.energy <= fallAsleepAt || nap) {
      fallAsleep(turn);
    } else if (!state.reaction && now >= state.nextExtraAt) {
      react(turn, IDLE_EXTRAS[Math.floor(random() * IDLE_EXTRAS.length)], 'idleExtra');
      state.nextExtraAt = now + idleGap(random, cfg);
    }
  }
}

function fallAsleep(turn) {
  const { state, effects } = turn;
  enter(turn, 'asleep');
  effects.push({ type: 'sleep' });
  // A held item floats back (PLAN §5.2); its later grab:end is ignored.
  if (state.held !== null) {
    effects.push({ type: 'floatBack', item: state.held });
    state.held = null;
  }
}

function wake(turn) {
  enter(turn, 'idle');
  turn.effects.push({ type: 'wake' });
}

// A new mode ends any reaction. Idle schedules its next extra.
function enter(turn, mode) {
  const { state } = turn;
  state.mode = mode;
  state.reaction = null;
  if (mode === 'idle') state.nextExtraAt = state.now + idleGap(turn.random, turn.cfg);
}

function react(turn, name, kind = name) {
  turn.state.reaction = { name, until: turn.state.now + turn.cfg.behaviour.reactionMs[kind] };
}

// Idle extras come every 8 to 15 s (PLAN §5.6).
function idleGap(random, cfg) {
  const { min, max } = cfg.behaviour.idleExtraEveryMs;
  return min + (max - min) * random();
}

// Animation names for the placeholder now, and Phase 3's poses later (PLAN §8.9).
function animationOf(state, cfg) {
  if (state.mode === 'asleep') {
    return state.now - state.lastStrokeAt <= cfg.behaviour.pettedForMs ? 'sleepy-purr' : 'sleep';
  }
  if (state.reaction) return state.reaction.name;
  if (state.mode === 'eating') return state.meal.item === 'water' ? 'drink' : 'eat';
  if (state.mode === 'playing') return 'track-wand';
  if (state.mode === 'petted') return 'purr';
  return 'sit';
}

// A copy of the state. If the clock moved back, every stored time moves back
// with it, so a backwards clock changes nothing (PLAN §5.7; DECISIONS §3).
function shiftTimes(previous, now) {
  const state = { ...previous };
  const delta = now - previous.now;
  if (!(delta < 0)) return state;
  const shift = (time) => (time === null ? null : time + delta);
  for (const key of ['lastInteractionAt', 'lastStrokeAt', 'wandEndedAt', 'lastPounceAt', 'nextExtraAt']) {
    state[key] = shift(state[key]);
  }
  if (state.meal) state.meal = { ...state.meal, until: state.meal.until + delta };
  if (state.reaction) state.reaction = { ...state.reaction, until: state.reaction.until + delta };
  if (state.wand) state.wand = { ...state.wand, at: state.wand.at + delta };
  return state;
}
