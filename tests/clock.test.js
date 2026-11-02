// The clock (A7): speed changes and Pause never move game time back, 60×
// really runs 60 times faster, and wall time ignores them all (DECISIONS §3).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClock } from '../src/clock.js';

// A real clock that only moves when the test says so.
function fakeRealTime(start = 1_000_000) {
  let t = start;
  return { read: () => t, pass: (ms) => { t += ms; } };
}

test('game time follows real time at 1×', () => {
  const real = fakeRealTime();
  const clock = createClock(real.read);
  const start = clock.now();
  real.pass(5000);
  assert.equal(clock.now() - start, 5000);
});

test('60× runs 60 times faster', () => {
  const real = fakeRealTime();
  const clock = createClock(real.read);
  clock.setSpeed(60);
  const start = clock.now();
  real.pass(1000);
  assert.equal(clock.now() - start, 60_000);
});

test('speed changes never move game time back', () => {
  const real = fakeRealTime();
  const clock = createClock(real.read);
  clock.setSpeed(60);
  real.pass(2000);
  const before = clock.now();
  for (const speed of [1, 10, 0, 60, 1]) {
    clock.setSpeed(speed);
    assert.ok(clock.now() >= before, `game time went back on switching to ${speed}×`);
  }
  real.pass(1000);
  assert.equal(clock.now() - before, 1000); // carries on at 1× from where it was
});

test('Pause stops game time, and it resumes from the same point', () => {
  const real = fakeRealTime();
  const clock = createClock(real.read);
  clock.setSpeed(0);
  const paused = clock.now();
  real.pass(60_000);
  assert.equal(clock.now(), paused);
  clock.setSpeed(1);
  real.pass(500);
  assert.equal(clock.now(), paused + 500);
});

test('advance moves game time forward or back', () => {
  const real = fakeRealTime();
  const clock = createClock(real.read);
  const start = clock.now();
  clock.advance(6 * 3_600_000);
  assert.equal(clock.now() - start, 6 * 3_600_000);
  clock.advance(-3_600_000);
  assert.equal(clock.now() - start, 5 * 3_600_000);
});

test('advance works while paused', () => {
  const real = fakeRealTime();
  const clock = createClock(real.read);
  clock.setSpeed(0);
  const start = clock.now();
  clock.advance(600_000);
  real.pass(10_000);
  assert.equal(clock.now() - start, 600_000);
});

test('wall time ignores speed, Pause and advance', () => {
  const real = fakeRealTime();
  const clock = createClock(real.read);
  const start = clock.wallNow();
  clock.setSpeed(60);
  clock.advance(3_600_000);
  real.pass(1000);
  assert.equal(clock.wallNow() - start, 1000);
  clock.setSpeed(0);
  real.pass(1000);
  assert.equal(clock.wallNow() - start, 2000);
});
