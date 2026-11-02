// The game (Phase 1): boot, the game loop, saving, and the wiring between
// input, the simulation, drawing and the HUD (PLAN §4.4). Phase 0's camera
// files stay unused until Phase 2.
import './ui/errorlog.js';
import { APP_VERSION } from './version.js';
import { config } from './config.js';
import * as clock from './clock.js';
import { EVENTS, on, emit, setDevMode } from './events.js';
import { createStorage } from './storage.js';
import {
  catchUp, tickInApp, applyGain, setAsleep, mood, lowestNeed, chooseUpdate, MOOD_LABELS,
} from './sim/needs.js';
import { launchState, step, activity, putToSleep, wakeUp } from './sim/behaviour.js';
import { createPointer } from './input/pointer.js';
import { createScene } from './render/scene.js';
import { createHud } from './ui/hud.js';
import { createDevPanel } from './ui/devpanel.js';

applyColours(config.colours);
registerServiceWorker();

const canvas = document.getElementById('scene');
const scene = createScene(canvas, config);
let lastWall = clock.wallNow(); // wall-clock time of the last update
let lastFrameTime = 0; // the browser's time for the last frame
let lastTimedSave = -Infinity; // frame time of the last 10-second save

// Boot (Phase 1 brief, step 12): load the save, catch up on the time away, set
// the launch state, and ask for persistent storage.
const storage = createStorage();
const loaded = storage.load(clock.now());
let save = catchUp(loaded.save, clock.now(), config);
let state = null; // the cat's behaviour state (not saved, PLAN §5.6)
startCat();
storage.requestPersist();
setDevMode(save.settings.dev);

// Every vocabulary event goes to the scene at once (held items and the wand
// follow the pointer) and waits for the cat's next step.
const queue = [];
for (const type of EVENTS) {
  on(type, (payload) => {
    const event = { type, ...payload };
    queue.push(event);
    scene.onEvent(event);
  });
}
createPointer({ element: canvas, toScene: scene.toScene, hitTest: scene.hitTest, emit, cfg: config });
const hud = createHud({ version: APP_VERSION, onModeChange: setMode });
const devPanel = createDevPanel({ game: developerControls(), cfg: config });
if (loaded.notice) hud.showMessage(loaded.notice);

lastWall = clock.wallNow();
persist();
requestAnimationFrame(frame);

document.addEventListener('visibilitychange', onVisibilityChange);
window.addEventListener('pagehide', persist);

// One frame: time, the needs, the cat's step and its effects, saving, drawing.
function frame(frameTime) {
  requestAnimationFrame(frame);
  lastFrameTime = frameTime;
  const before = save.needs;
  const now = clock.now();
  const wall = clock.wallNow();
  const elapsed = now - save.lastSeenAt;
  // A wall-clock gap over 10 s, or a clock moved back, goes to catch-up
  // (PLAN §5.7; DECISIONS §3).
  save = chooseUpdate(wall - lastWall, elapsed, config) === 'catchUp'
    ? catchUp(save, now, config)
    : tickInApp(save, elapsed, activity(state), config);
  lastWall = wall;

  const result = step(state, { now, events: queue.splice(0), needs: save.needs, random: Math.random }, config);
  state = result.state;
  applyEffects(result.effects);

  // Saved after every meter change and action, and every 10 s (PLAN §4.5 rule 4).
  const changed = result.effects.length > 0 || Object.keys(before).some((meter) => save.needs[meter] !== before[meter]);
  if (changed || frameTime - lastTimedSave >= config.time.saveEveryMs) {
    persist();
    lastTimedSave = frameTime;
  }
  draw(frameTime, result.animation);
}

function draw(frameTime, animation) {
  const moodName = mood(save.needs, config);
  const lowest = lowestNeed(save.needs);
  // Below 30 the mood names the lowest need (PLAN §5.4).
  const low = moodName === 'attention' || moodName === 'urgent';
  const moodLabel = low ? `${MOOD_LABELS[moodName]}: ${lowest}` : MOOD_LABELS[moodName];
  scene.draw(frameTime, { name: save.pet.name, mode: state.mode, animation, mood: moodName, moodLabel });
  hud.update({ needs: save.needs, mood: moodName, moodLabel, lowest, mode: save.settings.mode });
  devPanel.update();
}

// Effects from the cat's step: meter gains go into the save; items move in the scene.
function applyEffects(effects) {
  for (const effect of effects) {
    if (effect.type === 'gain') save = applyGain(save, effect.meter, effect.amount);
    else if (effect.type === 'sleep') save = setAsleep(save, true);
    else if (effect.type === 'wake') save = setAsleep(save, false);
    else if (effect.type === 'use') scene.items.use(effect.item);
    else if (effect.type === 'floatBack') scene.items.floatBack(effect.item, lastFrameTime);
    else if (effect.type === 'eaten') scene.items.eaten(effect.item);
  }
}

// The launch state (PLAN §5.6), at boot and after Reset save.
function startCat() {
  const launched = launchState(save, clock.now(), config, Math.random);
  state = launched.state;
  applyEffects(launched.effects);
}

function persist() {
  storage.save(save);
}

// Hidden counts as away (PLAN §5.3): save on the way out, catch up on return.
function onVisibilityChange() {
  if (document.visibilityState === 'hidden') {
    persist();
    return;
  }
  save = catchUp(save, clock.now(), config);
  lastWall = clock.wallNow();
  persist();
}

// Live or Relaxed, from Settings (D4).
function setMode(mode) {
  save = { ...save, settings: { ...save.settings, mode } };
  persist();
}

// The developer panel's controls (A4).
function developerControls() {
  const setCatAsleep = (asleep) => {
    const change = asleep ? putToSleep : wakeUp;
    const result = change(state, clock.now(), config, Math.random);
    state = result.state;
    applyEffects(result.effects);
    persist();
  };
  return {
    get save() {
      return save;
    },
    speed: () => clock.speed(),
    // The game clock jumps forward and catch-up runs, as after real time away.
    awayFor(ms) {
      clock.advance(ms);
      save = catchUp(save, clock.now(), config);
      persist();
    },
    // One in-app tick of the whole time, bypassing the gap rule (DECISIONS §3).
    // The clock then moves on by the same amount, so the next frame sees no gap.
    inAppFor(ms) {
      save = tickInApp(save, ms, activity(state), config);
      clock.advance(ms);
      persist();
    },
    setSpeed(speed) {
      clock.setSpeed(speed);
    },
    // The next frame sees time go backwards; nothing changes (PLAN §5.8).
    clockBack(ms) {
      clock.advance(-ms);
    },
    setMeter(meter, value) {
      save = { ...save, needs: { ...save.needs, [meter]: value } };
      persist();
    },
    // The PLAN §5.8 start: the default meters, every progress 0, the cat awake.
    resetMeters() {
      const { needs, progress } = config.defaultSave;
      save = { ...save, needs: { ...needs }, progress: { ...progress } };
      setCatAsleep(false);
    },
    setAsleep: setCatAsleep,
    // A new default cat (Phase 5's creator takes over later). Developer mode
    // goes with the old save (DECISIONS §3).
    resetSave() {
      save = storage.reset(clock.now());
      setDevMode(false);
      scene.items.reset();
      startCat();
    },
    enableDevMode() {
      setDevMode(true);
      if (save.settings.dev) return;
      save = { ...save, settings: { ...save.settings, dev: true } };
      persist();
    },
  };
}

// config.js holds the colours (DECISIONS §6); index.html repeats the page
// colours for the first paint.
function applyColours({ background, text, accent, accentText }) {
  const root = document.documentElement.style;
  root.setProperty('--background', background);
  root.setProperty('--text', text);
  root.setProperty('--accent', accent);
  root.setProperty('--accent-text', accentText);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', background);
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('This browser has no service workers, so the app will not open offline.');
    return;
  }
  navigator.serviceWorker.register('./sw.js').catch((error) => {
    console.error('The service worker failed to register.', error);
  });
}
