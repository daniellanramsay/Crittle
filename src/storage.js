// The only module that reads or writes the save, and the only one that touches
// localStorage (PLAN §4.5 rule 4). Every key starts with "vpet.", because every
// GitHub Pages project on one account shares one web origin.
import { config } from './config.js';

const SAVE_KEY = 'vpet.save';
const BROKEN_KEY = 'vpet.save.broken';
const SCHEMA = 1;

// A change to the save's shape raises SCHEMA and adds a step here (PLAN §4.7):
// MIGRATIONS[n] turns a schema-n save into a schema n + 1 save.
const MIGRATIONS = {};

const METERS = ['hunger', 'thirst', 'fun', 'affection', 'energy'];
const TRICKS = ['sitpretty', 'highfive', 'spin'];
const BREEDS = ['shorthair', 'fold', 'siamese'];
const PATTERNS = ['solid', 'bicolour', 'tabby', 'spotted', 'calico', 'tortoiseshell', 'colourpoint'];
const EYES = ['green', 'gold', 'copper', 'blue', 'odd'];
const NOSES = ['pink', 'black', 'brown'];

export const BROKEN_MESSAGE =
  "Your saved cat couldn't be read, so a new cat has started. The old save is kept in case it can be rescued.";

// backend is localStorage in the app and a fake in the tests.
export function createStorage(backend = browserStorage(), { random = Math.random } = {}) {
  // After a failed read, nothing is written, so a save that couldn't be read
  // is never overwritten.
  let readable = backend !== null;
  let reportedWriteError = false;

  return { load, save, reset, requestPersist };

  // Returns { save, notice }: the save, and a message for the screen or null.
  function load(now) {
    const text = read(SAVE_KEY);
    if (text === null) return { save: reset(now), notice: null };
    const loaded = parse(text);
    if (loaded) return { save: loaded, notice: null };
    write(BROKEN_KEY, text);
    return { save: reset(now), notice: BROKEN_MESSAGE };
  }

  function save(data) {
    write(SAVE_KEY, JSON.stringify(data));
  }

  // A new default cat, written straight away (Phase 1; Phase 5's creator
  // replaces it).
  function reset(now) {
    const fresh = createDefaultSave(now, random);
    save(fresh);
    return fresh;
  }

  // Asked at every launch (PLAN §4.5 rule 4); resolves to true if granted.
  async function requestPersist() {
    try {
      return (await globalThis.navigator?.storage?.persist?.()) ?? false;
    } catch (error) {
      console.warn('Persistent storage could not be requested.', error);
      return false;
    }
  }

  function read(key) {
    if (!readable) return null;
    try {
      return backend.getItem(key);
    } catch (error) {
      readable = false;
      console.error('The save could not be read, so this session will not be saved.', error);
      return null;
    }
  }

  function write(key, text) {
    if (!readable) return;
    try {
      backend.setItem(key, text);
      reportedWriteError = false;
    } catch (error) {
      // Reported once, not every 10 s, until a write works again.
      if (!reportedWriteError) console.error('The save could not be written.', error);
      reportedWriteError = true;
    }
  }
}

// The PLAN §4.7 default cat, stamped with the moment it's made (DECISIONS §3),
// with aptitude and affinity rolled as in PLAN §7.3.
export function createDefaultSave(now, random) {
  const save = structuredClone(config.defaultSave);
  save.createdAt = now;
  save.lastSeenAt = now;
  const { aptitude, affinity, decimals } = config.learning;
  save.pet.aptitude = roll(aptitude, random, decimals);
  for (const trick of TRICKS) save.pet.affinity[trick] = roll(affinity, random, decimals);
  return save;
}

// Schema 1, checked field by field. Anything that fails is treated as broken;
// nothing is repaired.
export function isValidSave(save) {
  return isObject(save)
    && save.schema === SCHEMA
    && isTime(save.createdAt)
    && isTime(save.lastSeenAt)
    && isSettings(save.settings)
    && isPet(save.pet)
    && isObject(save.needs) && METERS.every((meter) => isPoints(save.needs[meter]))
    && isObject(save.progress) && [...METERS, 'rest'].every((key) => isFraction(save.progress[key]))
    && typeof save.asleep === 'boolean'
    && isObject(save.tricks) && TRICKS.every((trick) => isMastery(save.tricks[trick]))
    && isObject(save.stats) && Number.isInteger(save.stats.commands) && save.stats.commands >= 0;
}

function parse(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  const migrated = migrate(data);
  return migrated && isValidSave(migrated) ? migrated : null;
}

// A save from a newer schema, or one with no migration path, can't be read.
function migrate(data) {
  if (!isObject(data) || !Number.isInteger(data.schema)) return null;
  let current = data;
  while (current.schema < SCHEMA) {
    const next = MIGRATIONS[current.schema];
    if (!next) return null;
    current = next(current);
  }
  return current.schema === SCHEMA ? current : null;
}

function roll({ min, max }, random, decimals) {
  const scale = 10 ** decimals;
  return Math.round((min + (max - min) * random()) * scale) / scale;
}

function isSettings(settings) {
  return isObject(settings)
    && (settings.mode === 'live' || settings.mode === 'relaxed')
    && ['camera', 'preview', 'dev', 'tutorialDone'].every((key) => typeof settings[key] === 'boolean');
}

function isPet(pet) {
  const { aptitude, affinity } = config.learning;
  return isObject(pet)
    && typeof pet.name === 'string' && pet.name.trim() !== ''
    && pet.species === 'cat'
    && BREEDS.includes(pet.breed)
    && PATTERNS.includes(pet.pattern)
    && isObject(pet.colours)
    && isColour(pet.colours.base)
    && (pet.colours.second === null || isColour(pet.colours.second))
    && (pet.colours.third === null || isColour(pet.colours.third))
    && EYES.includes(pet.eyes)
    && NOSES.includes(pet.nose)
    && inRange(pet.aptitude, aptitude)
    && isObject(pet.affinity) && TRICKS.every((trick) => inRange(pet.affinity[trick], affinity));
}

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isTime(value) {
  return Number.isFinite(value) && value >= 0;
}

// Meters move in whole points (PLAN §5).
function isPoints(value) {
  return Number.isInteger(value) && value >= 0 && value <= 100;
}

function isFraction(value) {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

function isMastery(value) {
  return Number.isFinite(value) && value >= 0 && value <= 100;
}

function inRange(value, { min, max }) {
  return Number.isFinite(value) && value >= min && value <= max;
}

function isColour(value) {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
}

// Reading localStorage itself can throw when site data is blocked.
function browserStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}
