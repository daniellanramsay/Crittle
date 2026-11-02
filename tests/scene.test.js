// The scene's maths (CLAUDE.md rule 5): fitting the 1000 × 700 scene to the
// window, screen to scene points, the hit test, and items floating back.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { config } from '../src/config.js';
import { fitScene, toScenePoint, hitTest, createItems } from '../src/render/scene.js';

const { layout } = config;

function near(actual, expected, message) {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${message}: ${actual}, expected ${expected}`);
}

test('a wide window fits the scene by height and centres it', () => {
  assert.deepEqual(fitScene(1400, 700, config.scene), { scale: 1, offsetX: 200, offsetY: 0 });
});

test('a portrait window fits the scene by width and centres it', () => {
  const fit = fitScene(820, 1180, config.scene);
  near(fit.scale, 0.82, 'scale');
  near(fit.offsetX, 0, 'offsetX');
  near(fit.offsetY, (1180 - 700 * 0.82) / 2, 'offsetY');
});

test('screen points map to scene points', () => {
  const fit = fitScene(2400, 1400, config.scene); // scale 2, 200 px margins left and right
  assert.deepEqual(toScenePoint(fit, 200, 0), { x: 0, y: 0 });
  assert.deepEqual(toScenePoint(fit, 2200, 1400), { x: 1000, y: 700 });
  assert.deepEqual(toScenePoint(fit, 1200, 700), { x: 500, y: 350 });
});

test('the hit test finds each bowl, the jar, the cat and empty space', () => {
  const items = createItems(layout, config.floatBackMs);
  assert.equal(hitTest(layout, items, layout.food.x, layout.food.y), 'food');
  assert.equal(hitTest(layout, items, layout.water.x, layout.water.y), 'water');
  assert.equal(hitTest(layout, items, layout.jar.x, layout.jar.y), 'treat');
  const { left, top, width, height } = layout.cat;
  assert.equal(hitTest(layout, items, left + width / 2, top + height / 2), 'cat');
  assert.equal(hitTest(layout, items, left - 1, top + height / 2), null);
  assert.equal(hitTest(layout, items, 100, 650), null); // empty floor
  assert.equal(hitTest(layout, items, 100, 100), null); // wall
});

test('an item away from home cannot be picked up again, and one treat is out at a time', () => {
  const items = createItems(layout, config.floatBackMs);
  items.grab('food', 300, 600);
  assert.equal(hitTest(layout, items, layout.food.x, layout.food.y), null);
  items.drop(300, 600);
  items.floatBack('food', 0);
  assert.equal(hitTest(layout, items, layout.food.x, layout.food.y), null); // still on its way
  items.grab('treat', 300, 600);
  assert.equal(hitTest(layout, items, layout.jar.x, layout.jar.y), null);
});

test('a bowl floats back over 0.5 s, from where it was let go', () => {
  const items = createItems(layout, config.floatBackMs);
  items.grab('food', 300, 600);
  items.move(500, 500);
  items.drop(500, 500);
  items.floatBack('food', 1000);
  assert.deepEqual(items.place('food', 1000), { x: 500, y: 500, alpha: 1 });
  const middle = items.place('food', 1250);
  assert.ok(middle.x > 500 && middle.x < layout.food.x, `x ${middle.x}`);
  assert.ok(middle.y < 500 && middle.y > layout.food.y, `y ${middle.y}`);
  assert.deepEqual(items.place('food', 1500), { x: layout.food.x, y: layout.food.y, alpha: 1 });
  items.update(1499);
  assert.equal(items.isHome('food'), false);
  items.update(1500);
  assert.equal(items.isHome('food'), true);
});

test('a treat fades out where it was let go instead of floating back', () => {
  const items = createItems(layout, config.floatBackMs);
  items.grab('treat', 300, 600);
  items.drop(300, 600);
  items.floatBack('treat', 0);
  assert.deepEqual(items.place('treat', 250), { x: 300, y: 600, alpha: 0.5 });
  assert.deepEqual(items.place('treat', 500), { x: 300, y: 600, alpha: 0 });
  items.update(500);
  assert.equal(items.place('treat', 500), null); // back in the jar
});

test('a used bowl sits at the feeding spot, and a treat at the mouth', () => {
  const items = createItems(layout, config.floatBackMs);
  items.grab('water', 450, 400);
  items.drop(450, 400);
  items.use('water');
  assert.deepEqual(items.place('water', 0), { ...layout.feedingSpot, alpha: 1 });
  items.grab('treat', 470, 390);
  items.drop(470, 390);
  items.use('treat');
  assert.deepEqual(items.place('treat', 0), { ...layout.mouth, alpha: 1 });
  items.eaten('treat');
  assert.equal(items.isHome('treat'), true);
});

test('bowls on the shelf are out of the mouth\'s reach', () => {
  const { mouth } = layout;
  for (const name of ['food', 'water']) {
    const distance = Math.hypot(layout[name].x - mouth.x, layout[name].y - mouth.y);
    assert.ok(distance > config.behaviour.mouthReach, `${name} is ${distance} from the mouth`);
  }
});
