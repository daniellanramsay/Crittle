// The save (PLAN §4.5 rule 4, §4.7): a round trip, the vpet. prefix, broken
// saves, schema validation and the default cat.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStorage, createDefaultSave, isValidSave, BROKEN_MESSAGE } from '../src/storage.js';

// PLAN §4.7, copied by hand so a typo in config.js can't hide.
const PLAN_DEFAULT = {
  schema: 1,
  createdAt: 0,
  lastSeenAt: 0,
  settings: { mode: 'live', camera: true, preview: true, dev: false, tutorialDone: false },
  pet: {
    name: 'Kitty',
    species: 'cat',
    breed: 'shorthair',
    pattern: 'tabby',
    colours: { base: '#c8742a', second: '#5a3416', third: null },
    eyes: 'green',
    nose: 'pink',
    aptitude: 1.12,
    affinity: { sitpretty: 1.05, highfive: 0.92, spin: 1.10 },
  },
  needs: { hunger: 80, thirst: 80, fun: 80, affection: 80, energy: 90 },
  progress: { hunger: 0, thirst: 0, fun: 0, affection: 0, energy: 0, rest: 0 },
  asleep: false,
  tricks: { sitpretty: 0, highfive: 0, spin: 0 },
  stats: { commands: 0 },
};

// A stand-in for localStorage.
function fakeBackend(entries = {}) {
  const data = new Map(Object.entries(entries));
  return {
    data,
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
  };
}

const NOW = 1_762_000_000_000;

function withoutRolls(save) {
  const { aptitude, affinity, ...pet } = save.pet;
  return { ...save, pet };
}

test('the default save made at time 0 equals PLAN §4.7, apart from the rolls', () => {
  const made = createDefaultSave(0, () => 0.5);
  assert.deepEqual(withoutRolls(made), withoutRolls(PLAN_DEFAULT));
});

test('a new save is stamped with the moment it is made', () => {
  const made = createDefaultSave(NOW, () => 0.5);
  assert.equal(made.createdAt, NOW);
  assert.equal(made.lastSeenAt, NOW);
});

test('aptitude and affinity are rolled within PLAN §7.3 ranges, to 2 decimals', () => {
  for (const r of [0, 0.25, 0.5, 0.999999]) {
    const { aptitude, affinity } = createDefaultSave(0, () => r).pet;
    assert.ok(aptitude >= 0.7 && aptitude <= 1.4, `aptitude ${aptitude}`);
    assert.equal(aptitude, Math.round(aptitude * 100) / 100);
    for (const value of Object.values(affinity)) {
      assert.ok(value >= 0.8 && value <= 1.2, `affinity ${value}`);
      assert.equal(value, Math.round(value * 100) / 100);
    }
  }
  assert.equal(createDefaultSave(0, () => 0.5).pet.aptitude, 1.05);
  assert.equal(createDefaultSave(0, () => 0).pet.aptitude, 0.7);
});

test('a round trip keeps the save exactly', () => {
  const backend = fakeBackend();
  const save = createDefaultSave(NOW, () => 0.3);
  save.needs.thirst = 41;
  save.progress.fun = 0.5;
  save.asleep = true;
  createStorage(backend).save(save);
  const { save: loaded, notice } = createStorage(backend).load(NOW + 1000);
  assert.deepEqual(loaded, save);
  assert.equal(notice, null);
});

test('with no save, load starts a default cat and stores it', () => {
  const backend = fakeBackend();
  const { save, notice } = createStorage(backend, { random: () => 0.5 }).load(NOW);
  assert.equal(notice, null);
  assert.equal(save.pet.name, 'Kitty');
  assert.equal(save.lastSeenAt, NOW);
  assert.deepEqual(JSON.parse(backend.data.get('vpet.save')), save);
});

test('every key written starts with vpet.', () => {
  const backend = fakeBackend({ 'vpet.save': '{not json' });
  const storage = createStorage(backend);
  const { save } = storage.load(NOW);
  storage.save(save);
  storage.reset(NOW);
  assert.ok(backend.data.size > 0);
  for (const key of backend.data.keys()) assert.ok(key.startsWith('vpet.'), key);
});

test('an unreadable save moves to vpet.save.broken, and a fresh cat starts with a message', () => {
  const backend = fakeBackend({ 'vpet.save': '{not json' });
  const { save, notice } = createStorage(backend).load(NOW);
  assert.equal(backend.data.get('vpet.save.broken'), '{not json');
  assert.equal(notice, BROKEN_MESSAGE);
  assert.deepEqual(save.needs, PLAN_DEFAULT.needs);
  assert.equal(save.createdAt, NOW);
  assert.deepEqual(JSON.parse(backend.data.get('vpet.save')), save);
});

test('a save that fails validation, or has an unknown schema, is treated as broken', () => {
  const bad = createDefaultSave(NOW, () => 0.5);
  bad.needs.hunger = 150;
  const future = { ...createDefaultSave(NOW, () => 0.5), schema: 2 };
  for (const text of [JSON.stringify(bad), JSON.stringify(future), 'null', '[]', '"text"']) {
    const backend = fakeBackend({ 'vpet.save': text });
    const { notice } = createStorage(backend).load(NOW);
    assert.equal(notice, BROKEN_MESSAGE, text);
    assert.equal(backend.data.get('vpet.save.broken'), text);
  }
});

test('schema validation accepts the default and rejects wrong shapes', () => {
  assert.equal(isValidSave(createDefaultSave(NOW, () => 0.5)), true);
  const breakages = [
    (s) => { delete s.progress.rest; },
    (s) => { s.needs.energy = 50.5; },
    (s) => { s.needs.fun = -1; },
    (s) => { s.progress.thirst = 1.5; },
    (s) => { s.settings.mode = 'sleepy'; },
    (s) => { s.settings.dev = 'yes'; },
    (s) => { s.pet.breed = 'persian'; },
    (s) => { s.pet.colours.base = 'orange'; },
    (s) => { s.pet.aptitude = 2; },
    (s) => { s.pet.affinity.spin = 0.5; },
    (s) => { s.pet.name = ' '; },
    (s) => { s.asleep = 'no'; },
    (s) => { s.tricks.spin = 101; },
    (s) => { s.stats.commands = 1.5; },
    (s) => { s.lastSeenAt = 'yesterday'; },
  ];
  for (const breakIt of breakages) {
    const save = createDefaultSave(NOW, () => 0.5);
    breakIt(save);
    assert.equal(isValidSave(save), false, breakIt.toString());
  }
});

test('a read that throws starts a fresh cat but never overwrites the save', () => {
  const backend = fakeBackend({ 'vpet.save': 'kept' });
  backend.getItem = () => { throw new Error('blocked'); };
  const errors = [];
  const original = console.error;
  console.error = (...args) => errors.push(args);
  try {
    const storage = createStorage(backend);
    const { save } = storage.load(NOW);
    storage.save(save);
    assert.equal(save.pet.name, 'Kitty');
  } finally {
    console.error = original;
  }
  assert.equal(backend.data.get('vpet.save'), 'kept');
  assert.equal(errors.length, 1);
});
