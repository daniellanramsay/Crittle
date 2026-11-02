// The event bus and its fixed vocabulary (PLAN §4.5 rule 1). Touch, mouse and,
// from Phase 2, hands all emit these names, so the game never knows which
// input was used. New names need Daniella's approval.
//
// Payloads, in scene units (DECISIONS §3):
//   cursor:move {x, y}
//   pet:stroke  {x, y, speed}    speed in units per second
//   grab:start  {item, x, y}     item is 'food', 'water' or 'treat'
//   grab:move   {x, y}
//   grab:end    {x, y}
//   wand:move   {x, y}
//   cursor:hide, wand:end, trick:sitpretty, trick:highfive, trick:spin: none

export const EVENTS = Object.freeze([
  'cursor:move',
  'cursor:hide',
  'pet:stroke',
  'grab:start',
  'grab:move',
  'grab:end',
  'wand:move',
  'wand:end',
  'trick:sitpretty',
  'trick:highfive',
  'trick:spin',
]);

const listeners = new Map(EVENTS.map((name) => [name, new Set()]));
let devMode = false;

// Developer mode is settings.dev, turned on by opening the developer panel
// (DECISIONS §3).
export function setDevMode(on) {
  devMode = on;
}

export function on(name, listener) {
  if (known(name)) listeners.get(name).add(listener);
}

export function off(name, listener) {
  listeners.get(name)?.delete(listener);
}

export function emit(name, payload = {}) {
  if (!known(name)) return;
  for (const listener of listeners.get(name)) listener(payload);
}

// Unknown names are dropped; in developer mode they also warn, which shows in
// the error log.
function known(name) {
  if (listeners.has(name)) return true;
  if (devMode) console.warn(`Unknown event name "${name}" was ignored.`);
  return false;
}
