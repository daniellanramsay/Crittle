# Phase 2: Hands

Status: Not started

- **Versions during this phase:** 0.2.x
- **Previous phase:** tag `phase-1` must exist.

## Goal

Everything from Phase 1 also works by hand: open-palm petting, pinching to grab bowls and treats, and pointing to play with the wand. Thumb taps are detected and shown as a command icon; trick training is Phase 4. Thresholds are tuned on Daniella's hands and recorded.

## Read before planning

- `DECISIONS.md`: §3 (the Phase 0 worker decision), §4, §5
- `docs/PLAN.md`: §4.5, §5.5, §5.6, §6 (all), §7.2 step 1 (the command icon)
- `docs/phases/phase-0.md`: the pitfalls

## Before this session, Daniella will have

- [ ] Finished Phase 1 (tag `phase-1`)
- [ ] Decided D9: hand recordings stay on the laptop (default), or get committed
- [ ] Good, even light and a plain background behind her hand
- [ ] 30 to 40 minutes for recordings and tuning
- [ ] A clean, unobstructed laptop webcam

## Build, in this order

1. **`src/input/handmath.js`** (pure):
   - A One Euro filter for each landmark and axis, with timestamps in seconds
   - Mirroring, and conversion to video pixels
   - Mapping to scene units with clamping (PLAN §6.1)
   - The hand scale *s*, and the finger-extended test (PLAN §6.2)
2. **`src/input/gestures.js`** (pure):
   - `classify(frame, previousState, now, cfg)` returns the gesture state: pose, cursor, contact in progress, and taps that fired. It covers the pose detector (hysteresis, hold times, confirmation over 3 detections), the separate tap detector (60 to 450 ms contact, the index-far rule, the 600 ms cooldown, no taps while pinching or holding), and no-hand after 300 ms (PLAN §6.3, §6.4).
   - `toEvents(previous, next, hitTest, cfg)` returns vocabulary events. A pinch starting over an item sends `grab:start`, then `grab:move`, then `grab:end`. A point sends `wand:move` and `wand:end`. An open palm over the cat at 80 units/s or more sends `pet:stroke` with its speed. Taps send `trick:sitpretty`, `trick:highfive` or `trick:spin`. Losing the hand sends `cursor:hide`.
3. **`src/input/hands.js`** (extend the Phase 0 version): pass each frame through `handmath` and `gestures`, and emit the resulting events on the bus. Use the worker if Phase 0 decided on one.
4. **`src/input/camera.js`** (finish the lifecycle):
   - The camera switch in settings (`settings.camera`)
   - When the switch is on, a "Turn on camera" button at launch; it never starts by itself
   - Try again on failure
   - Stops when the page is hidden, and restarts on return
5. **`src/render/scene.js`:**
   - The hand cursor: an open hand, a claw while pinching, the wand while pointing
   - The mirrored 160 × 120 preview with dots in a corner, switchable in settings (`settings.preview`)
   - The "Show your hand to the camera" hint after 2 s without a hand
   - The command icon above the cat's head for 1.5 s on any trick event (PLAN §7.2 step 1). The cat itself ignores trick events until Phase 4.
6. **`src/ui/hud.js`:** camera and preview switches in settings; the camera button; the Try again state.
7. **`src/ui/devpanel.js`**, new **Hands** tab:
   - Readouts: *s*; each thumb-to-fingertip distance in units of *s*; pose; a running log of taps; detection ms; detection and drawing fps
   - Live sliders for every threshold in PLAN §6, and a Copy JSON button
   - **Record:** 10 s of raw landmarks in the PLAN §6.8 format, downloaded as a JSON file (landmark numbers only, never images)
8. **Recordings and tests:** Daniella records the files in the table below. Claude Code then writes the replay tests.

## Recordings (Daniella, on the laptop)

Developer panel → Hands → **Record**. Do the action for the full 10 s, then save the file into `tests/fixtures/` with exactly this name. By default `.gitignore` keeps these files on the laptop, out of the public repository (D9).

| File | During the 10 s | Expected when replayed |
| --- | --- | --- |
| `gesture-palm.json` | Open hand, moving slowly left and right | Mostly open palm; 0 taps; 0 pinches |
| `gesture-pinch.json` | Pinch and release 3 times, about 1 s apart | Exactly 3 pinch starts and 3 ends; 0 taps |
| `gesture-point.json` | Point and draw circles | Mostly point; 0 taps; 0 pinches |
| `gesture-tap-middle.json` | 5 thumb-to-middle taps, about 1 s apart, other fingers relaxed | Exactly 5 middle taps; no other taps; 0 pinches |
| `gesture-tap-ring.json` | 5 thumb-to-ring taps | Exactly 5 ring taps; no other taps; 0 pinches |
| `gesture-tap-pinky.json` | 5 thumb-to-pinky taps | Exactly 5 pinky taps; no other taps; 0 pinches |
| `gesture-nohand.json` | Hand in view 3 s, out of view 4 s, back in for 3 s | One no-hand period, starting about 300 ms after the hand leaves |
| `gesture-mixed.json` | Natural play: palm, point and pinch, with no taps | 0 taps |

If a recording doesn't match its expectation because of the performance itself, for example an accidental pinch, record it again. Never loosen a test to fit a bad recording.

## Tests (`npm test`)

- **`tests/handmath.test.js`:** the filter on synthetic data (a steady input stays steady, and a step input follows quickly); scene mapping at the corners and outside the region; *s*; the extended-finger rule.
- **`tests/gestures-synthetic.test.js`:** hand-built frames that check each rule precisely:
  - A pinch starts after 120 ms below 0.30 *s* and ends above 0.45 *s*
  - Taps of 60 and 450 ms count; taps of 40 and 500 ms don't
  - The 600 ms cooldown; the index-near rule blocks taps
  - Confirmation needs 3 detections; no-hand begins after 300 ms
  - The pose holds during a tap contact; no taps while holding an item
  - `pet:stroke` carries speed
- **`tests/gestures-replay.test.js`:** every recording in the table gives its expected result. A missing recording is skipped with a visible message naming the file, never silently.

## Device test scripts

Run on the laptop at localhost, then in the installed laptop app and the installed iPad app after `/deploy`.

1. Tap **Turn on camera**. The preview shows dots, and the cursor follows your palm. Moving right moves the cursor right.
2. **Petting:** palm over the cat, moving gently. The cat is petted and affection rises. A fast swipe makes it flinch.
3. **Feeding:** pinch over the food bowl and it lifts. Move it to the mouth and release: the cat eats. Do the same with the water bowl and a treat. Release one elsewhere: it floats back.
4. **Wand:** point, and the wand appears at your fingertip. Move it fast: the cat pounces. Relax your hand: the wand goes, and about 2 s later the cat is idle.
5. **Taps:** for each finger, make 20 deliberate taps and count the command icons. You need at least 18 per finger, each with the right icon.
6. Play normally for 2 minutes (petting, feeding, wand) without tapping. No command icon appears.
7. A pinch never shows a command icon, and a tap never grabs anything.
8. Holding a bowl, pull your hand out of view. About 0.3 s later the bowl starts floating back, and it is on the shelf within 1 s.
9. Keep your hand out of view for 2 s: the "Show your hand to the camera" hint appears.
10. Minimise the app or go to the Home Screen: the camera turns off. Return: it turns back on. With the camera switch off in settings, there's no camera button.
11. Try steps 2 to 5 at 40, 60 and 80 cm from the camera.
12. If any step fails: adjust it in developer panel → Hands, click Copy JSON, and give the values to Claude Code. They go into `config.js` and `DECISIONS.md` §5.

## Done when

- [ ] Replayed recordings give their expected results (`npm test`).
- [ ] Petting, feeding by pinch and wand play by pointing work on both devices with the hand 40 to 80 cm from the camera.
- [ ] At least 18 of 20 deliberate taps on each finger trigger correctly, and 2 minutes of normal play produce no accidental taps, on both devices.
- [ ] A pinch never fires a tap, and a tap never fires a pinch.
- [ ] Losing the hand starts a held item floating back within 400 ms, and it is on its shelf within 1 s.
- [ ] The camera turns off when hidden, comes back on return, and Try again works, on both devices.
- [ ] Final thresholds are in `config.js` and recorded in `DECISIONS.md` §5.

## Not in this phase

Trick training (taps only show the command icon), the rig and animations, recolouring, the creator, the mini view.

## Pitfalls to avoid

- Measure distances in video pixels, not normalised coordinates (PLAN §6.1 step 7).
- Mirror exactly once, in `handmath`. The CSS mirror on the preview is display-only.
- The One Euro filter needs real timestamps. Replays use the recorded `t`, never the wall clock.
- Recordings hold raw, unsmoothed, unmirrored data, so replays exercise the full pipeline.
- Handedness is ignored; either hand works.
- If taps still misfire after tuning, try 3D world landmarks for contact distances. That is a plan change: propose it, and record it in `DECISIONS.md` §3.
- Keep the 640 × 480 input. Higher resolutions slow the iPad without improving gestures much.
