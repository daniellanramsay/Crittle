# Phase 3: The rig and animations

Status: Not started

- **Versions during this phase:** 0.3.x
- **Previous phase:** tag `phase-2` must exist.

## Goal

The placeholder becomes a cut-out cat on the rig, with every v1 animation wired to the behaviour states and moods, running smoothly on both devices.

## Read before planning

- `DECISIONS.md`: D1, D2, §6
- `docs/PLAN.md`: §5.4, §5.6, §8.4, §8.6, §8.9
- `docs/ART-GUIDE.md`: §2 and §3 (the view and the parts, so the placeholder matches the real art)

## Before this session, Daniella will have

- [ ] Confirmed D1. If D1 is pixel art, this brief is rewritten first.
- [ ] Finished Phase 2 (tag `phase-2`)

## Build, in this order

1. **`src/render/rig.js`:**
   - Pure maths in its own exported functions, for tests: transform composition (parent to child around pivots, using `rot`, `dx`, `dy`, `sx`, `sy`), pose blending with easing (`linear`, `in`, `out`, `inOut`), z ordering (stable sort) and alpha
   - The sitting and lying skeletons, read as data from `src/render/poses.json` (PLAN §8.4, §8.6), never hard-coded, with a 300 ms cross-fade between them
   - Breathing (body scale 1.00 to 1.02 over 3 s) and blinking (every 3 to 7 s) layered on every pose
   - The horizontal flip used by Spin
   - Drawing finished parts to the canvas, with no new objects created per frame
2. **`src/render/placeholder.js`** (rewrite): draw every base part in PLAN §8.4 (the 20 Domestic Shorthair parts) as simple shapes into offscreen canvases, in fixed default colours (orange coat, green eyes, pink nose). Use the side view facing right from ART-GUIDE §2, with sensible pivots. The output is finished parts in the PLAN §8.6 format.
3. **`src/render/poses.json`:** the two skeletons (each part's parent, PLAN §8.4), and poses and animations for every v1 animation in PLAN §8.9, plus sad idle and the urgent lie-down. Animation lengths: sit pretty about 1.2 s, high-five about 1.0 s, spin about 0.9 s.
4. **Wiring:**
   - Behaviour state and mood choose the animation; idle extras run every 8 to 15 s; look at cursor follows the cursor
   - Eat, drink, track the wand (head follows it), pounce, flinch, sniff and turn away
   - Purr marks while petted, the mew bubble when urgent, the sleep bubble when asleep (sizes and timings proposed in the plan, recorded in `DECISIONS.md` §6)
   - The Phase 2 command icon positioned above the head
   - Sit pretty, high-five and spin are playable from the developer panel; trick logic is Phase 4
5. **Developer panel:**
   - **Animations** tab: play any animation, with loop and speed controls
   - **Pose tuner:** pick a pose and a part; sliders for `rot`, `dx`, `dy`, `sx`, `sy`, `z` and `alpha`; Copy JSON
   - Drawing fps
6. **Tests**, below.

## Tests (`npm test`)

- **`tests/rig.test.js`,** using a small hand-written part set in `tests/fixtures/parts-sample.json` (3 parts: a root, a child and a grandchild, with its own skeleton in the same shape as `poses.json`):
  - Transform composition, with children following their parents
  - Rotation about the pivot
  - Blending at the start, middle and end with each easing
  - Z sort; cross-fade alpha at 0, 150 and 300 ms
  - Parts left out of a pose keep their rest transform
- **`tests/poses.test.js`:**
  - `poses.json` is valid: both skeletons give every part in PLAN §8.4 a parent or make it the root; every pose an animation uses exists; every part named is in PLAN §8.4; skeleton values are `sitting` or `lying`; keys are sorted by `t`
  - Every v1 animation is present
  - Trick lengths are within 0.1 s of their targets

## Device test scripts

Both devices, after `/deploy` for the iPad.

1. Each behaviour state shows its animation: feed, drink, treat, pet, wand and pounce, flinch, refuse, fall asleep, sleep, wake, nap.
2. Developer panel → Meters: below 30 the cat shows the sad idle; below 15 it lies down and shows the mew bubble; at 30 or above it returns to normal.
3. Developer panel → Animations: play each of the 22 animations. Nothing jumps between them, and no gaps open at the joints.
4. Frame rate: 60 fps on the laptop, and at least 30 fps on the iPad with the camera on and your hand moving (developer panel readouts).
5. Purr marks show while petting, the mew bubble when urgent, and the sleep bubble when asleep.
6. Idle extras (groom, stretch, tail flick, look at cursor) appear every 8 to 15 s.

## Done when

- [ ] Every behaviour state and mood plays its animation, and transitions blend without jumps, on both devices.
- [ ] The laptop holds 60 fps and the iPad at least 30 fps with hand tracking running.
- [ ] `rig.js` animates any part set in the documented format, proved by the test with the hand-written sample (`npm test`).
- [ ] Purr, mew and sleep visuals appear at the right times; their sizes and timings are recorded in `DECISIONS.md` §6.

## Not in this phase

Recolouring, breeds, patterns, the creator, the real art, trick logic.

## Pitfalls to avoid

- Rotate about the pivot: translate to the pivot, rotate and scale, then translate back. Compose with the parent's full transform.
- Spin flips around the body's centre, not the canvas origin.
- Creating new objects every frame causes garbage-collection pauses on the iPad; reuse arrays and matrices.
- Draw finished parts as canvases or ImageBitmaps; never recolour or redraw shapes per frame.
- During a skeleton cross-fade both skeletons draw, with opposite alphas.
- End every animation on a clean pose, so the next one blends from somewhere sensible.
