// src/version.js and line 1 of sw.js must hold the same version (PLAN §4.8).
// sw.js is read as text and never imported: it only runs as a service worker.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const moduleVersion = read('src/version.js')
  .match(/^export const APP_VERSION = '([^']*)';$/m)?.[1];
const workerVersion = read('sw.js')
  .split(/\r?\n/, 1)[0]
  .match(/^const APP_VERSION = '([^']*)';$/)?.[1];

test('src/version.js exports APP_VERSION', () => {
  assert.ok(moduleVersion, "src/version.js needs the line: export const APP_VERSION = '…';");
});

test('line 1 of sw.js sets APP_VERSION', () => {
  assert.ok(workerVersion, "line 1 of sw.js must be: const APP_VERSION = '…';");
});

test('both hold the same version', () => {
  assert.equal(workerVersion, moduleVersion);
});

test('the version looks like 0.N.x or 1.0.0', () => {
  assert.match(moduleVersion ?? '', /^(0\.[0-6]\.\d+|1\.0\.0)$/);
});
