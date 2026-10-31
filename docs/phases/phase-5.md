# Phase 5: Looks and your art

Status: Not started

- **Versions during this phase:** 0.5.x
- **Previous phase:** tag `phase-4` must exist.

## Goal

The creator and recolouring work for every breed and pattern. Then Daniella's art replaces the placeholder without other code changes.

## Read before planning

- `DECISIONS.md`: D1, D2, D6, §4
- `docs/PLAN.md`: §4.7, §8 (all)
- `docs/ART-GUIDE.md` (all)

## Before this session, Daniella will have

- [ ] Confirmed D6
- [ ] Finished Phase 4 (tag `phase-4`)
- [ ] The one-part test (`ear_near` with `pivot`, `region`, `shade`, `light` and `line`) saved as `art/source/cat.psd`. The full art can arrive later in this phase.

## Build: part A, before the real art

1. **`src/render/recolour.js`:**
   - Pure pixel functions on `{ width, height, data }`:
     - Key-colour fill from the pattern table (PLAN §8.3)
     - The Colourpoint blend using the `points` layer's opacity
     - Overlays painted on fur only
     - Multiply for `shade`, screen for `light`, then `line` on top
   - A browser wrapper that turns a `rig.json` plus a look into finished parts (PLAN §8.6), cached by look
   - Eyes take the eye colour (odd-eyed: near blue, far gold); nose and pads take the nose colour
2. **`src/render/placeholder.js`** (add a mode): key-colour layers in the `rig.json` shape, in memory, for all 29 parts including the variants. Simple shapes, but with real `region` areas, overlay layers, a `points` layer, and `shade`, `light` and `line`.
3. **Breeds:** resolve each part to its breed variant if one exists (`@fold`, `@siamese`, `@slim`), otherwise the base part.
4. **`src/ui/creator.js`** (PLAN §8.1):
   - Breed, pattern, colours (slots per pattern, 8 swatches plus a picker), eyes and nose, name, adopt, with a live preview on every screen
   - The name's maximum length is proposed in the plan
   - Adopt rolls aptitude and affinity, starts fresh needs, tricks and stats, and saves
   - The creator shows when there is no save, including after the developer panel's Reset save
5. **Developer panel,** new **Looks** tab: a grid of all 21 breed and pattern combinations with the current colours; three preset colour sets; the recolour time in ms.
6. **Tests** for part A, below.

## Build: part B, with the real art

7. **`tools/build-art.mjs`.** Prove the route with the one-part test **first**:
   - Read the PSD. `ag-psd` is the candidate, with `useImageData: true` so Node needs no canvas.
   - Find groups and layers by their exact names, and the centre of the pivot dot.
   - Trim to the union of the group's layers, then halve: majority vote per 2 × 2 block for `region`, averaging for the other layers.
   - Pack the atlas, and write PNGs (`pngjs` is the candidate), plus `art/build/rig.json`.
   - Print a validation report: missing layers, unknown names, non-exact key colours (with counts), missing pivots.
   - Install libraries as exact-version devDependencies and record them in `DECISIONS.md` §4.
8. **Decide the route.** If the PSD keeps groups and names intact, continue. If not, switch to Krita's Export Layers fallback (a folder of PNGs per group), update `docs/ART-GUIDE.md` §5, and record the decision in `DECISIONS.md` §3.
9. **Load `art/build/rig.json`** when present, and fall back to the placeholder when it is missing, so the game never breaks.
10. **The full art:** run the build, go through the validation report with Daniella, fix the art or the tool, and check every animation with the real parts. Pose adjustments go in `poses.json` through the pose tuner.

## Tests (`npm test`)

- **`tests/recolour.test.js`,** on tiny synthetic layers:
  - Each pattern's mapping (PLAN §8.3)
  - Overlays never land on white areas
  - The Colourpoint blend at 0%, 50% and 100% points opacity
  - Multiply and screen maths; `line` stays on top
  - Exact-colour detection rejects near colours such as `#FE0101`
  - Variant resolution for each breed
- **`tests/build-art.test.js`,** using a small synthetic PSD or layer set written by the test itself:
  - Pivot found
  - Union trim
  - Majority-vote halving keeps key colours exact
  - The atlas rectangles in `rig.json` match the images

## Device test scripts

Both devices.

1. Developer panel → Save → Reset save. The creator appears. Make one cat of each breed and adopt it; the cat in the room matches the preview.
2. Developer panel → Looks: all 21 combinations look right with placeholder parts, in each of the three colour sets.
3. One-part test: Claude Code shows the real `ear_near` in the game, sitting correctly at its pivot.
4. With the full art: every animation plays with no gaps or misaligned parts; all 21 combinations recolour correctly in three colour sets; odd eyes and the three nose colours show correctly.
5. The recolour time on the iPad is under 300 ms (developer panel → Looks).

## Done when

- [ ] All 21 breed and pattern combinations render correctly with placeholder parts, shown together in a developer-panel grid.
- [ ] The one-part test export round-trips: pivot found, alignment exact, colours correct.
- [ ] With Daniella's full art, no animation shows gaps or misaligned parts, and all 21 combinations recolour correctly with three different colour sets.
- [ ] Recolouring a cat takes under 300 ms on the iPad.
- [ ] The creator shows on first launch, the adopted cat matches its preview, and the learning speed is rolled, on both devices.
- [ ] Art tool libraries and their versions are recorded in `DECISIONS.md` §4.

## Not in this phase

New breeds, re-styling after adoption, the app's icons, the mini view.

## Pitfalls to avoid

- **Canvas pixel reads** in browsers can alter colour values at partly transparent pixels. Match key colours on the RGB of pixels with alpha above zero, treat alpha separately, and test with soft outer outlines.
- **Halving by averaging** blends key colours at area borders into colours that match nothing. Always use the majority vote for `region`.
- **Layer and group names are exact and lowercase.** Report unknown names; never guess.
- **Colour space:** Krita should export sRGB. If colours look shifted, check the PSD's colour profile.
- **Never commit `art/source/`;** check `git status` before every commit in this phase.
- **A lying Scottish Fold:** PLAN §8.4 has `head@fold` but no `sleep_head@fold`, so a lying Fold uses the standard `sleep_head`, with its folded ears placed on it. If the difference shows, propose drawing `sleep_head@fold`; that is a plan change for `DECISIONS.md` §3.
