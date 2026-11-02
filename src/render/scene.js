// The room (PLAN §4.6, §5.5): the shelf with the food bowl, water bowl and
// treat jar, treats, the wand, and items floating back. The 1000 × 700 scene
// is scaled to fit the window and centred, and the margins are painted as wall
// and floor, so nothing looks letterboxed. The maths comes first and is pure
// (tests/scene.test.js); the drawing follows.
import { drawPlaceholderCat } from './placeholder.js';

// The scene's scale and offset in a view of viewWidth × viewHeight CSS pixels.
export function fitScene(viewWidth, viewHeight, scene) {
  const scale = Math.min(viewWidth / scene.width, viewHeight / scene.height);
  return {
    scale,
    offsetX: (viewWidth - scene.width * scale) / 2,
    offsetY: (viewHeight - scene.height * scale) / 2,
  };
}

// A point in the view, in CSS pixels, as a point in the scene.
export function toScenePoint(fit, x, y) {
  return { x: (x - fit.offsetX) / fit.scale, y: (y - fit.offsetY) / fit.scale };
}

// What lies under a scene point: 'food', 'water', 'treat' (the jar), 'cat' or
// null. Only items resting at home can be picked up. Phase 2's gestures use the
// same test (PLAN §6.4).
export function hitTest(layout, items, x, y) {
  if (items.isHome('food') && inBox(layout.food, x, y)) return 'food';
  if (items.isHome('water') && inBox(layout.water, x, y)) return 'water';
  if (items.isHome('treat') && inBox(layout.jar, x, y)) return 'treat';
  const { left, top, width, height } = layout.cat;
  if (x >= left && x <= left + width && y >= top && y <= top + height) return 'cat';
  return null;
}

// Where each item is: at home (a bowl on the shelf; for the treat, one waiting
// in the jar), held, dropped (waiting for the cat to decide), in use by the
// cat, or on its way home: a bowl floats back and a treat fades out
// (PLAN §5.5). Times are the browser's frame times, so items move smoothly at
// any game speed (DECISIONS §3).
export function createItems(layout, floatBackMs) {
  const homes = { food: layout.food, water: layout.water, treat: layout.jar };
  const spots = { food: layout.feedingSpot, water: layout.feedingSpot, treat: layout.mouth };
  const items = { food: { at: 'home' }, water: { at: 'home' }, treat: { at: 'home' } };
  const names = Object.keys(items);

  return {
    isHome: (name) => items[name].at === 'home',
    grab(name, x, y) {
      if (items[name].at === 'home') items[name] = { at: 'held', x, y };
    },
    move(x, y) {
      for (const name of names) if (items[name].at === 'held') items[name] = { at: 'held', x, y };
    },
    drop(x, y) {
      for (const name of names) if (items[name].at === 'held') items[name] = { at: 'dropped', x, y };
    },
    use(name) {
      const { x, y } = spots[name];
      items[name] = { at: 'used', x, y };
    },
    floatBack(name, time) {
      if (items[name].at === 'home' || items[name].at === 'returning') return;
      const { x, y } = items[name];
      items[name] = { at: 'returning', x, y, since: time };
    },
    eaten(name) {
      items[name] = { at: 'home' };
    },
    reset() {
      for (const name of names) items[name] = { at: 'home' };
    },
    update(time) {
      for (const name of names) {
        const item = items[name];
        if (item.at === 'returning' && time - item.since >= floatBackMs) items[name] = { at: 'home' };
      }
    },
    // Where to draw an item, as { x, y, alpha }, or null for nothing to draw
    // (a treat still in the jar).
    place(name, time) {
      const item = items[name];
      if (item.at === 'home') return name === 'treat' ? null : { x: homes[name].x, y: homes[name].y, alpha: 1 };
      if (item.at !== 'returning') return { x: item.x, y: item.y, alpha: 1 };
      const t = Math.min(1, Math.max(0, (time - item.since) / floatBackMs));
      if (name === 'treat') return { x: item.x, y: item.y, alpha: 1 - t };
      const eased = 1 - (1 - t) ** 3; // fast at first, settling gently
      const home = homes[name];
      return { x: item.x + (home.x - item.x) * eased, y: item.y + (home.y - item.y) * eased, alpha: 1 };
    },
  };
}

function inBox({ x, y, width, height }, px, py) {
  return Math.abs(px - x) <= width / 2 && Math.abs(py - y) <= height / 2;
}

// Drawing. The canvas fills the window at the device's pixel ratio, capped at
// 2 (PLAN §4.6); index.html gives it touch-action: none.
export function createScene(canvas, cfg) {
  const context = canvas.getContext('2d');
  const { layout, colours } = cfg;
  const items = createItems(layout, cfg.floatBackMs);
  let size = { width: 0, height: 0, ratio: 0 };
  let fit = fitScene(1, 1, cfg.scene);
  let wand = null; // { x, y } while the wand is out
  resize();

  return {
    items,
    toScene(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      return toScenePoint(fit, clientX - rect.left, clientY - rect.top);
    },
    hitTest: (x, y) => hitTest(layout, items, x, y),
    // Held items and the wand follow the pointer as events arrive.
    onEvent(event) {
      if (event.type === 'grab:start') items.grab(event.item, event.x, event.y);
      else if (event.type === 'grab:move') items.move(event.x, event.y);
      else if (event.type === 'grab:end') items.drop(event.x, event.y);
      else if (event.type === 'wand:move') wand = { x: event.x, y: event.y };
      else if (event.type === 'wand:end') wand = null;
    },
    // cat: { name, mode, animation, mood, moodLabel } for the placeholder.
    draw(time, cat) {
      resize();
      items.update(time);
      paintRoom();
      const { ratio } = size;
      context.setTransform(ratio * fit.scale, 0, 0, ratio * fit.scale, ratio * fit.offsetX, ratio * fit.offsetY);
      drawShelf();
      drawJar();
      for (const name of ['food', 'water']) if (items.isHome(name)) drawItem(name, time);
      drawPlaceholderCat(context, { ...cat, layout, colours, time, wand });
      for (const name of ['food', 'water', 'treat']) if (!items.isHome(name)) drawItem(name, time);
      if (wand) drawWand(wand);
    },
  };

  // Follows the window, including the iPad turning; cheap when nothing changed.
  function resize() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, cfg.scene.maxPixelRatio);
    if (width === size.width && height === size.height && ratio === size.ratio) return;
    size = { width, height, ratio };
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    if (width > 0 && height > 0) fit = fitScene(width, height, cfg.scene);
  }

  // Wall above the floor line and floor below it, across the whole canvas, so
  // the margins continue the room. A skirting board marks the line.
  function paintRoom() {
    const { width, height, ratio } = size;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const floorTop = fit.offsetY + layout.floorY * fit.scale;
    context.fillStyle = colours.wall;
    context.fillRect(0, 0, width, floorTop);
    context.fillStyle = colours.floor;
    context.fillRect(0, floorTop, width, height - floorTop);
    context.fillStyle = colours.shelf;
    context.fillRect(0, floorTop - 4 * fit.scale, width, 8 * fit.scale);
  }

  function drawShelf() {
    const { left, right, top, thickness } = layout.shelf;
    context.fillStyle = colours.shelf;
    context.fillRect(left, top, right - left, thickness);
    context.fillRect(left + 30, top + thickness, 14, 36);
    context.fillRect(right - 44, top + thickness, 14, 36);
  }

  function drawJar() {
    const { x, y, width, height } = layout.jar;
    const left = x - width / 2;
    const top = y - height / 2;
    context.globalAlpha = 0.85;
    context.fillStyle = colours.jar;
    context.beginPath();
    context.roundRect(left, top + 12, width, height - 12, 12);
    context.fill();
    context.globalAlpha = 1;
    context.fillStyle = colours.treat;
    for (const [dx, dy] of [[-14, 30], [6, 34], [18, 22], [-4, 18], [-18, 14]]) {
      context.beginPath();
      context.arc(x + dx, y + dy, 8, 0, Math.PI * 2);
      context.fill();
    }
    context.fillStyle = colours.shelf;
    context.beginPath();
    context.roundRect(left - 4, top, width + 8, 16, 5);
    context.fill();
  }

  function drawItem(name, time) {
    const place = items.place(name, time);
    if (!place) return;
    context.globalAlpha = place.alpha;
    if (name === 'treat') drawTreat(place.x, place.y);
    else drawBowl(name, place.x, place.y);
    context.globalAlpha = 1;
  }

  function drawBowl(name, x, y) {
    const { width, height } = layout[name];
    const rim = y - height / 2 + 6;
    context.fillStyle = name === 'food' ? colours.foodBowl : colours.waterBowl;
    context.beginPath();
    context.moveTo(x - width / 2, rim);
    context.lineTo(x + width / 2, rim);
    context.lineTo(x + width / 2 - 14, y + height / 2);
    context.lineTo(x - width / 2 + 14, y + height / 2);
    context.closePath();
    context.fill();
    // Kibble or water at the rim
    context.fillStyle = name === 'food' ? colours.treat : colours.jar;
    context.beginPath();
    context.ellipse(x, rim, width / 2 - 6, 7, 0, 0, Math.PI * 2);
    context.fill();
  }

  function drawTreat(x, y) {
    context.fillStyle = colours.treat;
    context.beginPath();
    context.arc(x, y, layout.treatSize / 2, 0, Math.PI * 2);
    context.fill();
  }

  // A stick held from below, with a feather at the pointer.
  function drawWand({ x, y }) {
    context.strokeStyle = colours.shelf;
    context.lineWidth = 6;
    context.lineCap = 'round';
    context.beginPath();
    context.moveTo(x + 60, y + 110);
    context.lineTo(x, y);
    context.stroke();
    context.fillStyle = colours.accent;
    for (const angle of [-0.6, 0, 0.6]) {
      context.beginPath();
      context.ellipse(x - 10 * Math.sin(angle), y - 14, 7, 20, angle, 0, Math.PI * 2);
      context.fill();
    }
  }
}
