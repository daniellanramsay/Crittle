# Phase 4: Tricks

Status: Not started

- **Versions during this phase:** 0.4.x
- **Previous phase:** tag `phase-3` must exist.

## Goal

Tricks work exactly as PLAN §7 says. Thumb taps, buttons and keys command Sit pretty, High-five and Spin, with the success chance, rewards, learning speed, stars and learning-style label as specified.

## Read before planning

- `DECISIONS.md`: A1, §5, §6
- `docs/PLAN.md`: §5.2 (energy), §5.5 (treats), §6.3 (thumb taps), §6.7 (trick buttons), §7 (all)

## Before this session, Daniella will have

- [ ] Finished Phase 3 (tag `phase-3`)

## Build, in this order

1. **`src/sim/training.js`** (pure), with an injected seeded random function:
   - `successChance(m)`
   - `attempt(...)`, returning success, failure or a wrong trick (wrong only when the commanded trick's mastery is 30 or more, half of failures, and only toward a trick with mastery above 0)
   - `learn(m, k, A, f)`, capped at 100
   - `stars(m)`
   - `learningStyle(A, commands)`, hidden until 10 commands
2. **Integrate into `src/sim/behaviour.js`** (PLAN §7.2):
   - Asleep: only the sleep bubble shows. Energy below 25 or fun below 15: a yawn, and the command is ignored at no cost. A trick already playing: ignored.
   - Otherwise attempt: −1 energy, +1 to `stats.commands`.
   - Success: +3 fun, the trick animation, then the 4 s reward window with a sparkle.
   - Failure: a head tilt, or a wrong trick.
   - A new command during the window closes it unrewarded.
3. **Rewards:** a treat released at the mouth inside the window, or 1 s of stroking in total inside the window, gives k = 6. A window ending without a reward gives k = 2. A failure gives k = 1 at once. Treats give +5 hunger as always (PLAN §5.5).
4. **`src/ui/hud.js`:**
   - The Tricks panel: three tricks with 0 to 5 stars, and the learning style after 10 commands
   - Trick buttons (Sit pretty, High-five, Spin) and keys 1, 2 and 3 (A1)
5. **Aptitude and affinity:** already rolled in the save since Phase 1. Verify they are present and valid, and repair them with a fresh roll if missing.
6. **Developer panel,** new **Training** tab: mastery for each trick, A and each f; set mastery; and "Simulate 200 average cats", which runs 200 seeded simulated cats with every success rewarded and reports the mean number of commands to reach 80.
7. **Tests**, below.

## Tests (`npm test`)

- **`tests/training.test.js`:**
  - Success chance: 0.25 at m = 0, 0.46 at 30, 0.95 at 100, compared with a tolerance of 1e-9 (in JavaScript, 0.25 + 0.70 × 0.3 is 0.45999…).
  - Gain with A = f = 1: at m = 0, k = 6, 2 and 1 give 6, 2 and 1; at m = 60 they give 3, 1 and 0.5. Mastery is capped at 100.
  - Spread: the quickest possible (1.4 × 1.2) divided by the slowest (0.7 × 0.8) is 3.0.
  - Seeded simulation, 1,000 runs each, every success rewarded, counting commands until mastery reaches 80:
    - Average cat: mean 34 to 38, with at least 80% of runs between 30 and 42 inclusive. (Across 200 seeds this band held at least 83% every time; the narrower 31 to 41 sometimes dropped to 78%, which would make the test flaky.)
    - Quickest cat: mean 20 to 23.
    - Slowest cat: mean 61 to 67.
    - Average cat never rewarded: mean 82 to 87.
  - Wrong tricks happen only from mastery 30, and only toward a trick with mastery above 0.
  - Stars: 0 → 0, 19 → 0, 20 → 1, 99 → 4, 100 → 5.
  - Learning-style thresholds (1.2 and 0.9), and the reveal after 10 commands.
- **`tests/behaviour.test.js`** (extend): commands ignored at no cost when asleep, tired or bored; a command during a trick is ignored; a new command closes the reward window; k is applied at the right moment.

## Device test scripts

Both devices.

1. Tap each finger to the thumb. The command icon shows, and the cat tries; early on it mostly tilts its head (25% success).
2. On a success the sparkle shows. Give a treat or stroke within 4 s, and mastery jumps (developer panel → Training).
3. Let a window run out: mastery rises by a smaller step.
4. The buttons and keys 1, 2 and 3 do the same as the taps.
5. Developer panel → Meters: with energy at 24, a command gets a yawn and energy doesn't change. With fun at 14, a yawn too.
6. While the cat is asleep, a command shows only the sleep bubble.
7. After 10 commands, the learning style appears in the Tricks panel.
8. Set mastery to 20, 40 and 100: the stars show 1, 2 and 5.
9. Developer panel → Training → Simulate 200 average cats: the mean is about 36 commands (34 to 38).

## Done when

- [ ] Tests confirm the success chance, the gain for each k, the cap at 100 and the 3× spread between the slowest and quickest cats (`npm test`).
- [ ] A seeded simulation of an average cat with every success rewarded reaches 80 mastery in 30 to 42 commands in at least 80% of runs, mean about 36 (`npm test` and the developer panel).
- [ ] Commands are ignored correctly, at no cost, when the cat is asleep, tired or bored.
- [ ] Thumb taps, buttons and keys all command tricks on both devices, and rewards by treat and by stroking both work.

## Not in this phase

Extra tricks, forgetting, the creator, recolouring.

## Pitfalls to avoid

- Inject the random function everywhere; tests must be repeatable.
- Apply each gain once, at the right moment (PLAN §7.3).
- Count only attempted commands in `stats.commands`, not ignored ones.
- Taps can't start while an item is held, so a treat reward and a tap never collide. Keep that rule from Phase 2.
