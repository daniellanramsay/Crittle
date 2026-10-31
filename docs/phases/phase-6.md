# Phase 6: App shell and polish

Status: Not started

- **Versions during this phase:** 0.6.x, then 1.0.0 when the phase is finished
- **Previous phase:** tag `phase-5` must exist.

## Goal

A finished, installable v1:

- Its final name and icons
- Offline release mode
- The mini view and the floating mini window
- The sad window title
- The first-run tutorial (A2) and save backup (A3)
- The icon experiment
- An accessibility pass

## Read before planning

- `DECISIONS.md`: D7, D8, A2, A3, §4
- `docs/PLAN.md`: §2 (A2, A3), §4.5 rule 7, §4.7, §5.3, §9 (all)

## Before this session, Daniella will have

- [ ] Chosen D8: the app's name and a short name of 12 characters or fewer, for under the icon
- [ ] Drawn the icons: `icon-512.png` (512 × 512), `icon-192.png` (192 × 192) and `apple-touch-icon.png` (180 × 180). Square, with an opaque background (the iPad rounds the corners itself), and the important content inside the middle 80%.
- [ ] Finished Phase 5 (tag `phase-5`)
- [ ] A full day available afterwards for the day-of-use check

## Build, in this order

1. **Name:** the manifest's `name` and `short_name`, the page `<title>`, and any on-screen text that names the app.
2. **Icons:** replace the three files, and check the manifest and the apple-touch-icon link.
3. **Service worker release mode:**
   - A `PRECACHE` list in `sw.js` naming every **app file**: `index.html`, `manifest.webmanifest`, and everything under `src/` (including `src/render/poses.json`), `vendor/`, `art/build/` and `icons/`. Docs, tests, tools and `art/source/` are not app files, even though GitHub Pages can serve them.
   - Decide whether to precache both wasm variants (about 26 MB) or leave one to be cached on first use. A file deliberately left out goes in an `EXCLUDE` list in the precache test, with the reason, and is recorded in `DECISIONS.md`.
   - Cache-first for precached files
   - A new version installs in the background and applies at the next launch; never reload the page while the camera is on
   - The `vpet-` cache rules stay as they are
4. **`src/ui/mini.js`:**
   - The mini view switches on automatically when the window is narrower or shorter than 420 px, or from a Mini button
   - The idle loop (sit, blink, tail flick, groom, look around), the sad look, and sleeping
   - Tap or click returns to the full view
   - Camera off; away rates; catch-up every minute (D7)
5. **Floating window (Document Picture-in-Picture):**
   - The Pop out button appears only when `'documentPictureInPicture' in window`
   - Opening it needs a click; copy the styles into the new window and move the canvas there
   - Draw with the pop-out window's `requestAnimationFrame`
   - The main window shows "Your cat is in the pop-out window"
   - Closing the pop-out brings the canvas back
   - It counts as the mini view (D7): away rates, catch-up once a minute, camera off
6. **Window title:** "<name> needs you" while the lowest need is below 30; the normal title otherwise (PLAN §9.4).
7. **Tutorial (A2),** in `src/ui/tutorial.js`:
   - Runs after adoption on first run; can be skipped; can be replayed from settings; sets `settings.tutorialDone` when finished or skipped
   - Five short steps: the camera note ("the camera image never leaves this device"), petting with an open palm, feeding by pinching, the wand by pointing, and tricks by thumb taps
   - Each step works by touch too
   - Under 2 minutes in total
8. **Backup (A3),** in `src/ui/backup.js`:
   - Export downloads the save as `<name>-backup-<date>.json`
   - Import opens a file picker, validates the file, migrates an older schema, confirms with an in-app message, then replaces the save
   - On the iPad, exports go to the Files app
9. **Icon experiment (PLAN §9.6),** in `src/ui/appicon.js`: the page icon generated from the cat before installing. Try it on both devices and record the result.
10. **Accessibility pass:**
    - Text readable at default size; contrast at least 4.5:1
    - Every button at least 44 × 44 px with a visible focus outline
    - Nothing that relies on colour alone
11. **Version:** `/finish-phase 6` sets `APP_VERSION` to 1.0.0.

## Tests (`npm test`)

- **`tests/precache.test.js`:** walk the app-file folders (`src/`, `vendor/`, `art/build/`, `icons/`, plus `index.html` and `manifest.webmanifest`). Check each file is in `PRECACHE` unless it is in the test's `EXCLUDE` list, and that every listed file exists.
- **`tests/backup.test.js`:** export then import gives the same save; invalid and foreign files are rejected; an older schema migrates.
- All earlier tests still pass.

## Device test scripts

1. **Fresh installs.** Laptop: Edge → Settings and more → Apps → uninstall the old app, then install again from the address. iPad: export a backup first, delete the app from the Home Screen, then add it again from Safari.
2. **Offline after first launch:** open once online, then go offline (Wi-Fi off or Airplane Mode). The app opens, the cat works, and hand tracking works.
3. **Mini view:** shrink the laptop window below 420 px. Only the cat shows, with the right state (asleep, idle or sad). Click it to return. The camera is off in the mini view.
4. **Floating window (laptop):** click Pop out. The cat floats above other windows. Minimise the main window and the cat stays visible and animated. Close the pop-out: the cat returns to the main window.
5. **Title:** set a need below 30 (developer panel → Meters). Hovering the taskbar icon shows "<name> needs you". Back above 30, the normal title returns.
6. **Tutorial:** on the first run after adopting, it runs in under 2 minutes; Skip works; it can be replayed from settings.
7. **Backup:** export on the laptop, move the file to the iPad (OneDrive, email or iCloud Drive), and import it there. The same cat appears, with the same name, look, mastery and needs.
8. **Icon experiment:** install with the generated icon on both devices and note the result.
9. **A full day of real use on each device:** the error log stays empty.

## Done when

- [ ] A fresh install on each device works offline after its first launch.
- [ ] The mini view and the floating window show the right state (asleep, idle, sad) and use away rates.
- [ ] A backup exported on the laptop restores the same cat on the iPad.
- [ ] The tutorial takes under 2 minutes and can be skipped.
- [ ] The icon experiment's result is recorded in `DECISIONS.md`.
- [ ] A full day of real use on each device shows no errors in the error log.
- [ ] The name, icons and window title are final, and the accessibility pass is done.

## Not in this phase

Alerts while closed (L1), the Windows desktop app (L2), more species (L3), a native iPad app (L4), and anything in L5.

## Pitfalls to avoid

- **Document Picture-in-Picture** needs a click to open, and the new window starts with no styles; copy them across.
- **The main window's frames stop when it is minimised;** draw with the pop-out's own `requestAnimationFrame`.
- **Don't auto-reload for updates.** A reload while the camera is on stops it, and the iPad asks permission again.
- **Precache size:** the model and wasm files are large, so check the iPad still installs them reliably.
- **The installed icon may ignore a data-URL icon.** That is an acceptable experiment result; record it either way.
- **Deleting the iPad app deletes its save.** Always export first.
