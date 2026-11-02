# Phase 1: The cat lives, by touch and mouse

Status: Not started

- **Versions during this phase:** 0.1.x
- **Previous phase:** tag `phase-0` must exist.

## Goal

The cat exists and lives. Needs, energy and sleep follow PLAN §5 exactly, behaviour states and moods work, and feeding, treats, petting and wand play work by touch and mouse (A1). The save, catch-up and Live/Relaxed modes work, and the developer panel (A4) has time controls. The cat is drawn as a simple placeholder.

## Read before planning

- `DECISIONS.md`: D2, D4, D5, D7, A1, A4, §3, §6
- `docs/PLAN.md`: §2 (design rules), §4.4 to §4.8, §5 (all), §6.7, §8.6 (the Phase 1 bullet)

## Before this session, Daniella will have

- [ ] Confirmed D2, D4, D5 and D7
- [ ] Finished Phase 0 (tag `phase-0`)

## Build, in this order

1. **`src/config.js`** (started in Phase 0; extend it): every number from PLAN §5 and §6.7, grouped and commented with its PLAN section:
   - In-app and away intervals, gains, energy rules
   - Thresholds: 95 (full), 120 units (mouth distance), 3 s and 1 s (eating), 0.8 s (petted), 2 s (play ends), 400 units/s and once per second (pounce), 0.5 s (items floating back)
   - Moods: 60, 30, 15
   - Idle extras every 8 to 15 s
   - Sleep: 20 and 100; nap after 3 minutes below 60
   - Maximum away time 30 days; save every 10 s; gap 10 s
   - Scene 1000 × 700; pixel-ratio cap 2; developer access 5 taps in 3 s; wand hold 300 ms; stroke speeds 80 and 1200 units/s
   - The default save (PLAN §4.7)
   - Layout positions: proposed in the plan and recorded in `DECISIONS.md` §6
2. **`src/clock.js`:**
   - `now()`
   - `advance(ms)`, for the developer panel
   - `setSpeed(n)` for Pause (A8), 1×, 10× or 60×, re-based on every change so time never jumps backwards
   - `wallNow()`: unscaled wall time for the 10 s gap rule (`DECISIONS.md` §3)
   - Uses `Date.now()` underneath and is the only module that reads it. Touch timing and on-screen motion use the browser's own event and frame times (`DECISIONS.md` §3)
3. **`src/events.js`:** `on`, `off` and `emit`, with the fixed vocabulary from PLAN §4.5 rule 1. In developer mode, an unknown event name logs a warning. `pet:stroke` carries `{ x, y, speed }`.
4. **`src/storage.js`:**
   - `createStorage(backend)`, so tests can pass a fake in place of `localStorage`
   - `load()` with validation and migration; `save()`; `requestPersist()`
   - The key `vpet.save`. An unreadable save is kept under `vpet.save.broken`, a fresh save starts, and a message shows.
   - A new default save rolls aptitude and affinity with an injected random function (PLAN §7.3)
5. **`src/sim/needs.js`** (pure):
   - `catchUp(save, now, cfg)` as in PLAN §5.7
   - `tickInApp(save, dtMs, activity, cfg)`, where activity covers asleep and chasing; elapsed time of 0 or less changes nothing
   - `applyGain(save, meter, amount)`, clamped to 0 to 100
   - `mood(needs)`, using the four needs only
   - `lowestNeed(needs)`
6. **`src/sim/behaviour.js`** (pure): `step(state, input, cfg)`, where input is `{ now, events, needs }`. It returns the new state, the animation name and a list of effects (meter gains, energy changes, an item floating back). It covers:
   - The state table and priority order (PLAN §5.6)
   - Sleep and nap rules; the launch state
   - Eating and drinking timing; full refusal at 95; treats
   - Petting (affection +1 per 0.5 s of stroking; flinch above 1200 units/s)
   - Playing, pounces (at most once per second, +2 fun each) and extra energy drain; play ends at once when energy reaches 20
   - What happens to everything while asleep
7. **`src/input/pointer.js`:**
   - Pointer Events turned into vocabulary events, using a hit test from `scene.js`
   - Dragging across the cat sends `pet:stroke` with its speed
   - Dragging a bowl or treat sends the `grab:*` events
   - Holding 300 ms on empty floor sends the `wand:*` events
   - `setPointerCapture` during drags
8. **`src/render/scene.js`:**
   - The room, a shelf with the food bowl, water bowl and treat jar, the wand, and items floating back
   - The 1000 × 700 scene scaled to fit, with margins filled in the room's colours
   - The canvas at device pixel ratio, capped at 2, with `touch-action: none`
9. **`src/render/placeholder.js`** (Phase 1 version): a simple shape cat (body, head, ears) that visibly changes with state. It closes its eyes when asleep, shows a sleep bubble, tilts its head when refusing, and so on. The state and mood are written above it. The mouth point comes from `config.js`.
10. **`src/ui/hud.js`:** five meter bars with numbers and labels, the mood label, and a settings panel with the Live/Relaxed switch and the version label.
11. **`src/ui/devpanel.js`** (A4), opened by 5 taps on the version label within 3 s, with four tabs:
    - **Time:** "Away for" 10 min, 1 h, 2 h, 6 h, 1 day, 7 days and 40 days (runs catch-up with away rates and respects Relaxed mode). "In app for" 1 min, 10 min and 1 h (calls the in-app tick directly with the whole duration, bypassing the 10 s gap rule). Speed: Pause (A8), 1×, 10× and 60×. "Clock back 1 h".
    - **Meters:** set any meter; "Reset meters to start values" (80, 80, 80, 80, 90, progress 0, cat awake); set asleep or awake.
    - **Save:** show the save JSON; Reset save, with an in-app confirmation (no `confirm()` dialogs).
    - **Errors:** the A6 log, moved here from Phase 0.
12. **`src/main.js`:**
    - Boot: error log, then load the save, run catch-up, set the launch state, request persistent storage.
    - Loop (`requestAnimationFrame`): elapsed time from `clock.now()`; a gap over 10 s, measured on wall time, or a clock that moved back goes to `catchUp` (`DECISIONS.md` §3); then needs tick, behaviour step, effects applied, drawing.
    - Saving: every 10 s, after every meter change and action, on `visibilitychange` (hidden) and on `pagehide`.
    - Catch-up again on becoming visible.
13. **`index.html`:** replace the Phase 0 test page with the game page (canvas plus HUD containers). Leave `src/input/camera.js` and `src/input/hands.js` unchanged for Phase 2; no camera button in this phase.
14. **Tests**, below.

## Tests (`npm test`)

- **`tests/needs.test.js`:**
  - Every row of PLAN §5.8
  - A backwards clock; the 30-day cap; Relaxed mode
  - A remainder carried across two catch-ups
  - The floating-point boundary: 600 ticks of 1000 ms give exactly 15 fun drops. That case passes even without the 1e-9 guard, so energy over the same ticks (exactly 20) and fun over 10 minutes of 60 fps ticks (exactly 15) are tested too
  - The gap rule (`chooseUpdate`): a 2-hour wall-clock gap goes to catch-up even when the frame gap is 16 ms; a 0.2 s frame at 60× stays an in-app tick
  - Gains clamp at 100 and meters at 0
  - Mood thresholds at 60, 30 and 15, with energy ignored
  - Elapsed time of 0 or less in the in-app tick changes nothing
  - The PLAN §5.8 mini-view row: 120 one-minute catch-ups give energy 100, not 90
- **`tests/behaviour.test.js`:**
  - The priority order
  - Sleep at energy 20 only after the current action; nap after 3 minutes with energy 59 but not 60; waking at 100
  - Asleep: feeding, wand and tricks ignored, but petting still gives affection
  - Refusal at 95; eating lasts 3 s and a treat 1 s (+5)
  - No more than one pounce per second
  - Play ends when energy reaches 20
  - Flinch above 1200 units/s
  - The launch-state rules
- **`tests/storage.test.js`:** a round trip; the `vpet.` prefix; a broken save goes to `vpet.save.broken`; schema validation; the default save matches PLAN §4.7 exactly, apart from the rolled aptitude and affinity.
- **`tests/scene.test.js`** (CLAUDE.md rule 5): fitting the scene in landscape and portrait, screen to scene points, the hit test, and items floating back.
- **`tests/clock.test.js`** (A7): speed changes and Pause never move game time back, and 60× runs 60 times faster.
- **`tests/version.test.js`:** kept from Phase 0.

## Device test scripts

### Laptop (http://localhost:3000)

The developer panel opens when you click the version label (bottom-left) 5 times quickly. It sits on the left, with Close at the top. After each Time button, the line under the buttons lists all five meters. Pause (A8) stops game time, so the meters wait while you read; touch still works.

1. Developer panel → Save → **Reset save…** → Reset. Then Time → **Pause**. The meters read hunger 80, thirst 80, fun 80, affection 80 and energy 90; the mood is Happy; "Kitty · Idle" shows above the cat.
2. Time → **Away 6 h**: the meters read 77, 74, 79, 79 and 100.
3. **Away 2 h**: they read 76, 72, 78, 79 and 100.
4. Settings → Relaxed, then **Away 6 h**: nothing changes. Switch back to Live.
5. Meters → **Reset meters to start values**, then Time → **In app 10 min**: the meters read 67, 63, 65, 70 and 70. Then Time → **1×**.
6. Drag the food bowl to the cat's mouth. It eats for 3 s, and hunger becomes 100. Drag the bowl again: the cat sniffs and turns away, and the bowl floats back.
7. Meters → set thirst to 40. Drag the water bowl to the cat: it drinks for 3 s, and thirst becomes 80.
8. Meters → set hunger to 50. Drag a treat from the jar to the cat: it is eaten in 1 s, and hunger becomes 55.
9. Drag slowly across the cat: it is petted, and affection rises by about 2 per second. Stop: within 0.8 s it is idle again. Drag very fast: it flinches.
10. Hold 300 ms on empty floor: the wand appears and follows. Move it fast: the cat pounces, with fun +2 and at most one pounce a second. Release: about 2 s later the cat is idle.
11. Time → **Pause**. Meters → set affection to 50 and energy to 21, then Time → **In app 1 min**: energy reads 19, and the cat falls asleep with a sleep bubble. Time → **1×**. Feeding and the wand are ignored, and items float back. Petting still raises affection.
12. Time → **60×**: the cat wakes at energy 100 within about 8 seconds of real time.
13. Time → **Pause**. Meters → set thirst to 29: the mood shows "Needs attention: thirst" and the thirst bar pulses. Set it to 14: Urgent. Set it to 40: Okay. Set energy to 25: the mood stays Okay, because energy never changes the mood. (The cat may nap at 25; that's the nap rule.)
14. Meters → set energy to 59, stroke the cat once, then **Set awake**. Time → **60×** and leave the cat alone: about 3 s later (3 game minutes) it naps. Repeat with energy 70: Pause, set energy to 70, stroke once, Set awake, 60×, and watch for 3 s: no nap. (At 60× energy keeps falling, so it naps a few seconds later, once below 60.) Time → **1×**.
15. Meters → **Set asleep**. Close the tab and open http://localhost:3000 again: the meters are the same, apart from small drops, and the cat is still asleep. Settings → Relaxed, then close and reopen again: the same, still asleep. Switch back to Live.
16. Time → **Clock back 1 h**: nothing changes.

### iPad (installed app, after `/deploy`)

1. The version label matches the last deploy.
2. Repeat laptop steps 1 to 5 (the time controls), tapping instead of clicking.
3. Repeat laptop steps 6 to 10 with a finger. Dragging never scrolls or zooms the page.
4. Go to the Home Screen, wait 2 minutes, and reopen the app. Any changes are tiny (away rates), and no errors appear.
5. Rotate the iPad. The scene stays centred and nothing is cut off; landscape fills the screen best.
6. Developer panel → Errors: empty, or copy the entries to Claude Code.

## Done when

- [ ] `npm test` passes, including every worked example in PLAN §5.8.
- [ ] Feeding, drinking, treats, petting and wand play work by mouse on the laptop and by touch on the iPad, with no page scrolling or zooming.
- [ ] Sleep starts at energy 20 and ends at 100, and the 3-minute nap rule works.
- [ ] Moods change at 30 and at 15, and ignore energy.
- [ ] Closing and reopening restores everything in Live and Relaxed modes, including a sleeping cat.
- [ ] The developer panel opens from the version label, and its time controls give the PLAN §5.8 values on both devices.
- [ ] Layout positions and any other chosen numbers are recorded in `DECISIONS.md` §6.

## Not in this phase

Hands and the camera button, gestures, tricks (no trick buttons or keys yet), the rig and real animations, recolouring, the creator, the mini view, sound.

## Pitfalls to avoid

- **Floating point:** use `Math.floor(p + 1e-9)` when counting drops, or exact boundaries lose a point.
- **Elapsed time** comes from `clock.now()` differences. A gap over 10 s goes to `catchUp`, never to the in-app tick.
- **The iPad can end the app without `pagehide`;** the 10-second save covers that.
- **Pure modules** never call `Math.random` or `Date.now()`; inject them.
- **Long press on the iPad** opens a callout: set `-webkit-touch-callout: none` and `user-select: none` on the game area.
- **No browser dialogs** (`alert`, `confirm`); use in-app confirmations.
- Don't touch Phase 0's camera files.
