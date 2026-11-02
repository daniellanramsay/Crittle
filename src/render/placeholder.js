// The Phase 1 placeholder cat (PLAN §8.6): simple shapes that show what the
// behaviour is doing, with the cat's name, state and mood written above it, so
// behaviour can be checked before the rig exists. Phase 3 rewrites this file.

const STATE_LABELS = {
  idle: 'Idle',
  petted: 'Petted',
  eating: 'Eating',
  playing: 'Playing',
  asleep: 'Asleep',
};

// Reactions and idle extras, named after the state (PLAN §8.9).
const ANIMATION_LABELS = {
  groom: 'grooming',
  stretch: 'stretching',
  'tail-flick': 'tail flick',
  'look-at-cursor': 'looking around',
  flinch: 'flinch!',
  sniff: 'sniffs and turns away',
  pounce: 'pounce!',
  'sleepy-purr': 'sleepy purr',
};

// How each animation moves the shapes, in scene units and radians.
const POSES = {
  eat: { headX: 50, headY: 100, eyes: 'closed' },
  drink: { headX: 50, headY: 100, eyes: 'closed' },
  sniff: { headX: -24, headTilt: -0.3 },
  flinch: { dx: -16, squash: 0.94 },
  pounce: { dy: -30 },
  purr: { headTilt: 0.12, eyes: 'closed', prr: true },
  sleep: { dy: 24, headX: -24, headY: 70, eyes: 'closed', zzz: true },
  'sleepy-purr': { dy: 24, headX: -24, headY: 70, eyes: 'closed', zzz: true, prr: true },
  groom: { headX: -30, headY: 50, headTilt: 0.3, eyes: 'closed' },
  stretch: { stretch: 1.12 },
  'tail-flick': { flick: true },
  'look-at-cursor': { lookUp: true },
};

// view: { layout, colours, time, wand, name, mode, animation, mood, moodLabel }
export function drawPlaceholderCat(context, view) {
  const { layout, colours, time, animation } = view;
  const pose = POSES[animation] ?? {};
  const box = layout.cat;
  const sad = view.mood === 'attention' || view.mood === 'urgent';
  const body = {
    x: box.left + box.width * 0.42,
    y: box.top + box.height * 0.72,
    rx: box.width * 0.4 * (pose.stretch ?? 1),
    ry: box.height * 0.27 * (pose.squash ?? 1),
  };
  // The head sits so the mouth point is on its lower right; the cat faces right.
  const head = {
    x: layout.mouth.x - 58 + (pose.headX ?? 0),
    y: layout.mouth.y - 32 + (pose.headY ?? 0),
    r: 70,
  };

  context.save();
  context.translate(pose.dx ?? 0, pose.dy ?? 0);
  context.lineWidth = 3;
  context.strokeStyle = colours.background;
  context.fillStyle = colours.cat;
  drawTail(context, box, body, pose.flick ? Math.sin(time / 90) * 30 : 0);
  ellipse(context, body.x, body.y, body.rx, body.ry);
  ellipse(context, body.x + 34, box.top + box.height - 10, 24, 12);
  ellipse(context, body.x + 76, box.top + box.height - 12, 24, 12);
  context.save();
  context.translate(head.x, head.y);
  context.rotate(pose.headTilt ?? 0);
  drawHead(context, colours, head.r, pose, sad, lookDirection(view, head, pose));
  context.restore();
  context.restore();

  const lift = (pose.dy ?? 0) + Math.sin(time / 400) * 4;
  if (pose.zzz) bubble(context, colours, 'z z z', head.x + 70, head.y - 70 + lift);
  if (pose.prr) bubble(context, colours, 'prr', body.x + body.rx + 10, body.y - 50 + lift);
  drawLabels(context, colours, view, box);
}

function drawTail(context, box, body, flick) {
  context.save();
  context.lineWidth = 22;
  context.lineCap = 'round';
  context.strokeStyle = context.fillStyle;
  context.beginPath();
  context.moveTo(body.x - body.rx + 20, body.y + 40);
  context.quadraticCurveTo(box.left - 40, body.y + 20, box.left - 10 + flick, box.top + box.height * 0.42);
  context.stroke();
  context.restore();
}

// Drawn around the head's centre, already rotated by the pose.
function drawHead(context, colours, r, pose, sad, look) {
  // Ears: upright, or lowered when the mood is Needs attention or Urgent.
  for (const side of [-1, 1]) {
    context.save();
    context.translate(side * 38 + 8, -48);
    context.rotate(side * (sad ? 0.9 : 0.15));
    context.beginPath();
    context.moveTo(-20, 12);
    context.lineTo(0, -44);
    context.lineTo(20, 12);
    context.closePath();
    context.fill();
    context.stroke();
    context.restore();
  }
  ellipse(context, 0, 0, r, r * 0.92);
  // Eyes, toward the right-hand side: the cat faces right.
  for (const eyeX of [-4, 34]) {
    if (pose.eyes === 'closed') {
      context.beginPath();
      context.arc(eyeX, -10, 9, 0.15 * Math.PI, 0.85 * Math.PI);
      context.stroke();
    } else {
      context.fillStyle = colours.eyes;
      ellipse(context, eyeX, -10, 10, sad ? 7 : 11);
      context.fillStyle = colours.background;
      context.beginPath();
      context.arc(eyeX + look.x * 4, -10 + look.y * 4, 4, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = colours.cat;
    }
  }
  // Nose and mouth, at the mouth point (58, 32 from the centre)
  context.fillStyle = colours.nose;
  context.beginPath();
  context.moveTo(46, 14);
  context.lineTo(60, 14);
  context.lineTo(53, 22);
  context.closePath();
  context.fill();
  context.beginPath();
  context.moveTo(53, 22);
  context.lineTo(53, 30);
  context.moveTo(44, 34);
  context.quadraticCurveTo(53, 38, 62, 32);
  context.stroke();
  context.fillStyle = colours.cat;
}

// The pupils look at the wand while playing, and up for "look at cursor".
function lookDirection(view, head, pose) {
  if (pose.lookUp) return { x: 0.3, y: -1 };
  if (view.mode !== 'playing' || !view.wand) return { x: 0.4, y: 0 };
  const dx = view.wand.x - head.x;
  const dy = view.wand.y - head.y;
  const length = Math.hypot(dx, dy) || 1;
  return { x: dx / length, y: dy / length };
}

function bubble(context, colours, text, x, y) {
  context.font = '600 22px system-ui, -apple-system, "Segoe UI", sans-serif';
  context.textAlign = 'center';
  context.lineWidth = 5;
  context.strokeStyle = colours.background;
  context.strokeText(text, x, y);
  context.fillStyle = colours.text;
  context.fillText(text, x, y);
}

// Name and state on one line, the mood below, above the cat's head.
function drawLabels(context, colours, view, box) {
  const state = view.mode === 'eating' && view.animation === 'drink' ? 'Drinking' : STATE_LABELS[view.mode];
  const extra = ANIMATION_LABELS[view.animation];
  const lines = [`${view.name} · ${state}${extra ? ` · ${extra}` : ''}`, view.moodLabel];
  const x = box.left + box.width / 2;
  context.font = '600 22px system-ui, -apple-system, "Segoe UI", sans-serif';
  context.textAlign = 'center';
  context.lineJoin = 'round';
  lines.forEach((line, i) => {
    const y = box.top - 80 + i * 28;
    context.lineWidth = 5;
    context.strokeStyle = colours.background;
    context.strokeText(line, x, y);
    context.fillStyle = colours.text;
    context.fillText(line, x, y);
  });
}

function ellipse(context, x, y, rx, ry) {
  context.beginPath();
  context.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  context.fill();
  context.stroke();
}
