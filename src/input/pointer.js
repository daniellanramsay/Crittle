// Touch and mouse (A1, PLAN §6.7): Pointer Events become vocabulary events.
// Pressing a bowl, or the treat jar, grabs it; a drag across the cat strokes
// it; a still 300 ms hold anywhere else brings out the wand. One pointer at a
// time. Speeds and the hold use the browser's own event times, so Pause and
// 60× never change how touch feels (DECISIONS §3).

export function createPointer({ element, toScene, hitTest, emit, cfg }) {
  const { wandHoldMs, holdSlop, speedWindowMs } = cfg.pointer;
  const strokeFrom = cfg.behaviour.strokeSpeed.min;
  // The pressed pointer: { id, mode, start, last, samples, timer }. mode is
  // 'grab', 'hold' (waiting for the wand), 'wand' or 'drag'.
  let press = null;

  element.addEventListener('pointerdown', down);
  element.addEventListener('pointermove', move);
  element.addEventListener('pointerup', up);
  element.addEventListener('pointercancel', up);
  element.addEventListener('pointerleave', leave);
  // No long-press menu on the game area (Phase 1 pitfalls).
  element.addEventListener('contextmenu', (event) => event.preventDefault());

  function down(event) {
    if (press || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.preventDefault();
    element.setPointerCapture(event.pointerId);
    const point = toScene(event.clientX, event.clientY);
    const target = hitTest(point.x, point.y);
    press = { id: event.pointerId, mode: 'drag', start: point, last: point, samples: [sample(point, event)], timer: null };
    emit('cursor:move', point);
    if (target === 'food' || target === 'water' || target === 'treat') {
      press.mode = 'grab';
      emit('grab:start', { item: target, ...point });
    } else if (target === null) {
      // Empty floor or wall (DECISIONS §3): the wand, if it's held still.
      press.mode = 'hold';
      press.timer = setTimeout(startWand, wandHoldMs);
    }
  }

  function move(event) {
    const point = toScene(event.clientX, event.clientY);
    if (!press) {
      emit('cursor:move', point); // a mouse hovering
      return;
    }
    if (event.pointerId !== press.id) return;
    emit('cursor:move', point);
    press.last = point;
    if (press.mode === 'grab') {
      emit('grab:move', point);
      return;
    }
    if (press.mode === 'wand') {
      emit('wand:move', point);
      return;
    }
    if (press.mode === 'hold') {
      if (Math.hypot(point.x - press.start.x, point.y - press.start.y) <= holdSlop) return;
      clearTimeout(press.timer);
      press.mode = 'drag'; // it moved too far to be a hold
    }
    // A drag strokes the cat wherever it crosses it, at 80 units/s or faster.
    press.samples.push(sample(point, event));
    const speed = speedOf(press.samples, speedWindowMs);
    if (speed >= strokeFrom && hitTest(point.x, point.y) === 'cat') emit('pet:stroke', { ...point, speed });
  }

  function up(event) {
    if (!press || event.pointerId !== press.id) return;
    // A cancelled pointer may carry no position; its last one stands in.
    const point = event.type === 'pointercancel' ? press.last : toScene(event.clientX, event.clientY);
    clearTimeout(press.timer);
    if (press.mode === 'grab') emit('grab:end', point);
    if (press.mode === 'wand') emit('wand:end');
    press = null;
    if (event.pointerType !== 'mouse') emit('cursor:hide'); // the finger has lifted
  }

  function leave(event) {
    if (!press && event.pointerType === 'mouse') emit('cursor:hide');
  }

  function startWand() {
    if (press?.mode !== 'hold') return;
    press.mode = 'wand';
    emit('wand:move', press.last);
  }
}

function sample(point, event) {
  return { x: point.x, y: point.y, t: event.timeStamp };
}

// Speed over the last windowMs of movement, in scene units per second, so a
// single jittery event can't spike it into a flinch (DECISIONS §6). Drops
// samples older than the window, keeping at least two.
function speedOf(samples, windowMs) {
  const latest = samples[samples.length - 1];
  while (samples.length > 2 && latest.t - samples[0].t > windowMs) samples.shift();
  const elapsed = latest.t - samples[0].t;
  if (elapsed <= 0) return 0;
  let distance = 0;
  for (let i = 1; i < samples.length; i += 1) {
    distance += Math.hypot(samples[i].x - samples[i - 1].x, samples[i].y - samples[i - 1].y);
  }
  return (distance / elapsed) * 1000;
}
