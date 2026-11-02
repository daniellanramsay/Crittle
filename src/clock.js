// The app's clock (PLAN §4.4, §5.7). Game time drives the cat; the developer
// panel can pause it, speed it up or move it. Wall time is the real clock,
// untouched by any of that, and decides the 10 s gap rule (DECISIONS §3).
// Touch timing and on-screen motion use the browser's own event and frame
// times instead, so they feel the same at any speed.

// readRealTime returns milliseconds since 1970; tests pass a fake one.
export function createClock(readRealTime) {
  let speed = 1;
  let gameAtBase = readRealTime(); // game time at the last re-base
  let realAtBase = gameAtBase; // real time at the last re-base

  // Every change re-bases first, so game time carries on from where it was
  // and never jumps back on a speed change.
  function rebase() {
    const real = readRealTime();
    gameAtBase += (real - realAtBase) * speed;
    realAtBase = real;
  }

  return {
    now: () => gameAtBase + (readRealTime() - realAtBase) * speed,
    wallNow: () => readRealTime(),
    advance(ms) {
      rebase();
      gameAtBase += ms;
    },
    // 0 pauses game time (A8); 1, 10 and 60 run it at that many times real time.
    setSpeed(n) {
      rebase();
      speed = n;
    },
    speed: () => speed,
  };
}

// The app's one clock. This module is the only one that reads Date.now().
const clock = createClock(() => Date.now());

export const { now, wallNow, advance, setSpeed, speed } = clock;
