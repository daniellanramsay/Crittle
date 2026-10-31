# Art guide: drawing the cat in Krita

For Daniella. This is the contract between your Krita file and the game. Follow the names and colours exactly and your art drops in without code changes (D1, D2). The game needs it in Phase 5, but you can start any time.

The technical side (how the game reads and recolours your layers) is in `docs/PLAN.md` §8.

---

## 1. What you are making

One Krita document holds every part of the cat. Each part is drawn once, in its own group, in its resting position: sitting parts sitting, lying parts lying.

Areas that change colour (fur, white areas, eyes, nose) are painted in flat **key colours**. The game repaints them with the player's choices. Shading, highlights and line art sit on their own layers and are never recoloured.

## 2. Canvas

- 2048 × 2048 pixels, RGB/Alpha, 8-bit, sRGB, transparent background.
- **View:** the part names assume the cat is seen from the side, facing right, with the head turned a little toward you. "Near" means the side closer to you and "far" the side away from you. If you want a different view, tell Claude Code before Phase 3 so the poses and part names can change.
- Let the sitting cat fill roughly the middle 60% of the canvas.
- The lying parts can overlap the sitting drawing on the canvas, because they are separate groups. Hide the groups you are not working on.
- The build tool halves the resolution (2048 becomes 1024), so detail below about 2 pixels will soften.

## 3. The parts: one group each

| Group name | What to draw | Pivot dot (the joint it turns on) |
| --- | --- | --- |
| `body` | Torso and haunches, sitting | Where the body rests on the floor, under the hips |
| `chest` | The front of the chest | Top of the chest, under the chin |
| `head` | Head without ears, eyes or open mouth. Include the closed mouth and the nose (nose in the nose key colour). | Where the neck meets the body |
| `ear_near`, `ear_far` | One ear each | Base of the ear |
| `eye_near`, `eye_far` | One eye each: iris in the iris key colour, pupil and outline in the line layer | Centre of the eye |
| `lid_near`, `lid_far` | A closed eyelid, shown when blinking and sleeping | Top edge of the eye |
| `mouth_open` | Open mouth for eating, mewing and yawning | Corner of the mouth |
| `tongue` | Tongue for drinking and grooming | Base of the tongue |
| `front_leg_near`, `front_leg_far` | Front legs, with paw pads where they show | Shoulder |
| `hind_leg` | The near hind leg | Hip |
| `tail_1`, `tail_2`, `tail_3` | The tail in three segments, base to tip | The base of each segment |
| `sleep_body` | The curled body, lying | Centre of the body |
| `sleep_head` | Head resting, **without** ears or eyes (the game places those on it) | Neck |
| `sleep_tail` | Tail wrapped around the body | Base of the tail |

**Breed variants** are separate groups that replace a part by name:

| Group name | Replaces | Breed |
| --- | --- | --- |
| `ear_near@fold`, `ear_far@fold` | the ears | Scottish Fold: folded ears |
| `head@fold` | `head` | Scottish Fold: rounder head |
| `ear_near@siamese`, `ear_far@siamese` | the ears | Siamese: large upright ears |
| `tail_1@slim`, `tail_2@slim`, `tail_3@slim`, `sleep_tail@slim` | the tail parts | Siamese: slim tail |

That makes 29 groups: 20 base parts and 9 variants. Whiskers are drawn by code, so leave them out.

**Joints:** let each part extend a little past its joint, under the neighbouring part. When the part rotates, the overlap stops gaps from opening.

## 4. Layers inside each group

Give each group only the layers it needs; names must match exactly (lowercase).

| Layer | What to paint | How the game uses it |
| --- | --- | --- |
| `pivot` | One small dot, 2 to 4 px, any solid colour, at the joint | Sets the rotation point; never drawn |
| `region` | Flat fills in the key colours below | Says which area gets which colour |
| `points` | White with soft edges over the face mask, ears, paws and tail tip | Colourpoint pattern: its opacity sets how strongly the points colour shows |
| `stripes` | Tabby stripes, white on transparent | Painted in the stripe colour, on fur only |
| `spots` | Spots, white on transparent | Painted in the spot colour, on fur only |
| `patchA`, `patchB` | Two sets of patches, white on transparent | Calico and tortoiseshell patches, in their colours |
| `shade` | Greyscale shadows on transparent (darker means more shadow) | Multiplied over the colours |
| `light` | Soft white highlights on transparent | Screened over the colours |
| `line` | Line art and anything never recoloured: pupils, inside of the mouth, claws | Drawn on top, unchanged |

For example, an eye needs `pivot`, `region` and `line`; the body might use every layer.

**Key colours for the `region` layer**

| Area | Key colour |
| --- | --- |
| Fur | `#FF0000` |
| White areas (chest, paws, muzzle) | `#00FF00` |
| Eye iris | `#0000FF` |
| Nose and paw pads | `#FF00FF` |

**Rules for key colours**

- Use the exact values at 100% opacity. The game finds areas by exact colour, so a blended pixel such as `#FE0101` becomes a speckle.
- Keep hard edges where two key colours meet. Turn anti-aliasing off, or use a pixel brush, along those borders.
- Only the **outer outline** of a part, against transparency, may be soft.

**Layer rules**

- Use plain paint layers only: no filter layers, clone layers, layer styles or masks. The export may flatten or drop them.
- Blending modes don't matter. You can preview `shade` with Multiply in Krita; the game applies multiply and screen itself and ignores the mode.
- The order of layers inside a group doesn't matter; the names do.

## 5. Saving and handing over

1. Work in `art/source/cat.kra`.
2. Export a copy as Photoshop format: File → Save As (or Export) → `.psd` → `art/source/cat.psd`. Keep the groups and layers; don't flatten.
3. **Start with a one-part test.** Before drawing everything, make just `ear_near`, with `pivot`, `region`, `shade`, `light` and `line`. Export it, and Phase 5 opens by proving the whole pipeline with it. If Krita's PSD keeps the groups and names, carry on. If not, Phase 5 switches to Krita's built-in Export Layers script, which writes one PNG per layer, and this guide gets updated.
4. **Back up `art/source/` yourself,** for example to OneDrive or an external drive. git ignores it because the repository is public.

## 6. Checklist before Phase 5

- [ ] 29 groups, named exactly (lowercase, no spaces, `@` for variants)
- [ ] Every group has a `pivot` dot at its joint
- [ ] Key colours exact and fully opaque, with hard edges between them
- [ ] Plain paint layers only, with exact layer names
- [ ] Parts overlap a little at the joints
- [ ] Lying parts drawn lying; no ears or eyes on `sleep_head`
- [ ] Saved as `art/source/cat.psd` with groups intact, and `cat.kra` kept
- [ ] A backup copy exists outside the project folder

## 7. Tips

- Draw the default Domestic Shorthair first and the variants afterwards.
- Test early with the one-part test; it costs ten minutes and can save days.
- To see how recolouring will look, temporarily fill the `region` layer with real colours on a duplicate. Delete the duplicate before exporting.

## 8. If you choose pixel art instead (D1 alternative)

The key colours and overlay layers stay the same. Every frame of every animation is then drawn for each breed in Aseprite and exported as sprite sheets with tags. Tell Claude Code before Phase 3; Phases 3 and 5 and this guide change.
