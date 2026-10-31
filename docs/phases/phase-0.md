# Phase 0: Prove the risky parts

Status: Not started

- **Versions during this phase:** 0.0.x
- **Previous phase:** none. `docs/SETUP.md` must be complete.

## Goal

The installed app on both devices starts the camera from a button and draws the 21 hand landmarks on the live video, fast enough to play with, and opens offline after its first load. Nothing else is built. If this fails on the iPad, the plan changes before anything else is built.

## Read before planning

- `DECISIONS.md`: D3, A5, A6, §4
- `docs/PLAN.md`: §1 ("Biggest risk"), §4.1 to §4.5, §4.8, §6.1, §6.6, §12 (first three rows)
- `docs/WORKFLOW.md`: §3, §6, §7

## Before this session, Daniella will have

- [ ] Completed `docs/SETUP.md`
- [ ] Confirmed D3 (GitHub Pages)
- [ ] Her GitHub username and the empty repository's HTTPS address ready
- [ ] The laptop and iPad at hand, charged, on Wi-Fi
- [ ] Optional: placeholder icons exported from Krita (192 × 192, 512 × 512 and 180 × 180 PNG). Otherwise Claude Code generates simple ones.

## Build, in this order

1. **git first.** Run `git init -b main`. `.gitignore` and `.gitattributes` already exist; check them. Commit the existing planning files as `planning files`.
2. **`package.json`**, exactly:
   ```json
   {
     "name": "my-virtual-pet",
     "private": true,
     "type": "module",
     "scripts": {
       "test": "node --test",
       "serve": "npx --yes serve@14.2.6 -l tcp://localhost:3000 ."
     }
   }
   ```
   `node --test` with no arguments finds `tests/*.test.js`. `tcp://localhost` keeps the server private to the laptop, so Windows Firewall has nothing to ask about.
3. **`.nojekyll`**: an empty file, so GitHub Pages serves every file exactly as it is.
4. **`src/version.js`**: `export const APP_VERSION = '0.0.1';` Also **`src/config.js`** (`DECISIONS.md` §3): this phase's tunable numbers, that is the camera constraints (PLAN §6.1), the 3 s failure window, the 60-detection average, readouts every 500 ms, 200 error-log entries, 5 taps within 3 s, and the colours and drawing sizes in `DECISIONS.md` §6. Phase 1 extends it.
5. **`vendor/mediapipe/`**:
   1. Choose the version by the rule in `DECISIONS.md` §4: the newest stable release (not rc or nightly) published at least 14 days earlier. Check with `npm view @mediapipe/tasks-vision time --json`. Tell Daniella the version before downloading.
   2. In a temporary folder **outside** the project, run `npm pack @mediapipe/tasks-vision@<version>`, then `tar -xzf` the result.
   3. Copy into `vendor/mediapipe/`: `vision_bundle.mjs` and `package.json`, which records the version and the Apache-2.0 licence (the package has no separate LICENSE file). From `wasm/`, copy `vision_wasm_internal.js`, `vision_wasm_internal.wasm`, `vision_wasm_nosimd_internal.js` and `vision_wasm_nosimd_internal.wasm` into `vendor/mediapipe/wasm/`. The `vision_wasm_module_internal.*` pair is only for module workers; copy it only if step 15 decides on a worker.
   4. Download the model: `curl.exe -L -o vendor/mediapipe/hand_landmarker.task https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`. `curl.exe` works in PowerShell and Git Bash; plain `curl` in Windows PowerShell 5.1 is a different command. This is the URL Google's examples use; if it fails, stop and report.
   5. Record in `DECISIONS.md` §4: the package version, the model URL, the model's size in bytes and its SHA-256 (`Get-FileHash -Algorithm SHA256` in PowerShell, or `sha256sum` in Git Bash).
   6. Delete the temporary folder (Daniella approves).
   7. For reference, in version 1.1.1 the files are about 156 KB (`vision_bundle.mjs`), 13.5 MB (`vision_wasm_internal.wasm`) and 12.6 MB (`vision_wasm_nosimd_internal.wasm`).
6. **`index.html`** (the Phase 0 test page):
   - `<meta charset="utf-8">`; viewport `width=device-width, initial-scale=1, viewport-fit=cover`; `<title>My Virtual Pet</title>`; theme colour; `<link rel="manifest" href="./manifest.webmanifest">`; `<link rel="apple-touch-icon" href="./icons/apple-touch-icon.png">`
   - The version label in a corner; a **Turn on camera** button; a status line (off, starting, on, failed with Try again)
   - `<video playsinline muted autoplay>` and an overlay `<canvas>`, both mirrored with CSS
   - Readouts: detection frames per second, average detection time in ms, delegate (GPU or CPU), video size
   - Buttons only: no `href="#"` links anywhere
   - `<script type="module" src="./src/ui/errorlog.js"></script>`, then `<script type="module" src="./src/main.js"></script>`. The error log has its own script, so it runs even if another file fails to load (`DECISIONS.md` §3).
7. **`manifest.webmanifest`**: no `id`, so it defaults to `start_url` (`DECISIONS.md` §3); `name` "My Virtual Pet" (until D8), `short_name` "Pet", `start_url` `./`, `scope` `./`, `display` `standalone`, background and theme colours proposed in the plan, icons `./icons/icon-192.png` (192x192) and `./icons/icon-512.png` (512x512), type `image/png`.
8. **`icons/`**: `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` (180 × 180). Use Daniella's if provided; otherwise write `tools/make-placeholder-icons.mjs`, which uses only Node's built-in modules (zlib) to draw a simple paw on a plain square.
9. **`sw.js`**:
   - Line 1: `const APP_VERSION = '0.0.1';` and cache name `vpet-${APP_VERSION}`.
   - Install: precache the app shell (index, manifest, `src/` files, icons), but not `vendor/`. Call `self.skipWaiting()`.
   - Activate: delete caches whose names start with `vpet-` but are not the current one; never touch other caches. Call `clients.claim()`.
   - Fetch: handle only same-origin GET requests inside the scope. Go network-first with `cache: 'no-cache'`, store successful responses in the current cache, and fall back to the cache when offline. Vendor files are therefore cached on first use, so only the wasm variant a device actually uses gets stored.
10. **`src/ui/errorlog.js`** (A6):
    - Installed first, before anything else runs.
    - Captures `error` and `unhandledrejection` events, and wraps `console.error` and `console.warn`.
    - Keeps the last 200 entries, each with time, version and message (plus stack where available).
    - Shows a small count badge on the version label when there are errors.
    - Its panel opens after 5 taps or clicks on the version label within 3 s. It has Copy (Clipboard API, with select-the-text as a fallback), Clear and **Test error** buttons.
11. **`src/input/camera.js`**:
    - `start()` is called only from the button's click.
    - `stop()` stops every track.
    - States: off, starting, on, failed.
    - Failure means: `getUserMedia` rejects, no frame arrives within 3 s, or the track ends within 3 s. It shows "Camera didn't start" with Try again. A track that ends unexpectedly later also shows the failed state with Try again.
    - It stops when the page becomes hidden, and restarts on return if it was on. It never starts by itself at launch.
12. **`src/input/hands.js`** (Phase 0 version):
    - `FilesetResolver.forVisionTasks('./vendor/mediapipe/wasm')`, then `HandLandmarker.createFromOptions` with `baseOptions: { modelAssetPath: './vendor/mediapipe/hand_landmarker.task', delegate: 'GPU' }`, `runningMode: 'VIDEO'` and `numHands: 1`. If creation fails, try again with `'CPU'`. If the first detection with GPU fails, switch to `'CPU'` once and log a warning. Record which delegate is in use.
    - Detect only when `video.currentTime` has changed, with a strictly increasing `performance.now()` timestamp.
    - Keep a rolling average of detection time over 60 detections, and the detection rate.
    - Load the bundle with a relative dynamic import when the camera first starts: `const { FilesetResolver, HandLandmarker } = await import('../../vendor/mediapipe/vision_bundle.mjs');`. A failed load then can't stop the page, and the service worker caches the bundle (`DECISIONS.md` §3).
13. **`src/main.js`** (Phase 0 version): import the error log first (`index.html` also loads it on its own, step 6); register `./sw.js`; wire the button to camera, then hands, then a `requestAnimationFrame` loop that draws the landmarks and connecting lines; update the readouts twice a second; show the version.
14. **`tests/version.test.js`**: read `src/version.js` and line 1 of `sw.js` as text with `node:fs` (never import `sw.js`), extract both versions with a regular expression, and assert they are equal and look like `0.N.x` or `1.0.0`.
15. **Publish and measure:**
    1. Ask Daniella for the repository's HTTPS address. Run `git remote add origin <address>`, commit, then `git push -u origin main`; Daniella approves, and a GitHub sign-in window may open.
    2. Guide her: on github.com, repository → Settings → Pages → Build and deployment → Source "Deploy from a branch" → Branch "main", folder "/ (root)" → Save. After 1 to 2 minutes the address shows at the top of that page. Record it in `DECISIONS.md` §4.
    3. Run the device test scripts below with her.
    4. Decide on a worker. If one detection takes more than 12 ms on the iPad, move detection into a module worker (`src/input/hands.worker.js`, using the module wasm variant if needed), redeploy and re-measure. Record the decision, the delegate and the measurements in `DECISIONS.md`.

## Tests (`npm test`)

- `tests/version.test.js`: `src/version.js` and `sw.js` line 1 hold the same version.

## Device test scripts

### Laptop

1. In a second terminal, run `npm run serve`, then open http://localhost:3000 in Edge.
2. The version label shows 0.0.x.
3. Click **Turn on camera**, and allow the camera when Edge asks. The camera light comes on.
4. Hold one hand 40 to 80 cm from the camera. 21 dots joined by lines follow it. Moving your hand to your right moves the dots to the right, like a mirror.
5. Note the readouts: detection fps (target 25 or more), detection time in ms, and GPU or CPU.
6. Minimise Edge for 5 s; the camera light goes off. Restore it; the camera restarts by itself.
7. Click the version label 5 times quickly. The error log opens. Click **Test error**: an entry appears. Click **Copy** and paste somewhere to check.
8. After `/deploy`: open the GitHub Pages address in Edge, then Settings and more (…) → Apps → Install this site as an app → Install. It opens in its own window with its own taskbar icon. Right-click the taskbar icon → **Pin to taskbar**.
9. In the installed app, repeat steps 3 to 5.
10. Offline: close the installed app, turn Wi-Fi off, and open the app from the taskbar. It loads, and the camera and landmarks work. Turn Wi-Fi back on.

### iPad

1. In Safari, open the GitHub Pages address, tap Share → Add to Home Screen, keep **Open as Web App** on, and tap Add.
2. Open the app from the Home Screen. It fills the screen with no Safari address bar.
3. The version label matches the last deploy.
4. Tap **Turn on camera**, then Allow. The landmarks follow your hand, mirrored correctly.
5. Note the readouts: detection fps (target 20 or more), detection time, and GPU or CPU.
6. Swipe up to go home; the green camera dot disappears. Reopen the app; the camera restarts, possibly after asking permission again (both are fine), and the landmarks work.
7. Close the app fully (swipe it away), reopen it, and tap **Turn on camera**. It asks permission (expected) and works.
8. Tap the version label 5 times quickly, then **Test error**. The entry appears, and **Copy** works (paste into Notes to check).
9. Offline: turn on Airplane Mode in Control Centre, then open the app. It loads, and the landmarks work. Turn Airplane Mode off.
10. Leave the camera on for 2 minutes. Nothing freezes, and "Camera didn't start" never appears.

## Done when

- [ ] Installed from Edge on the laptop, the app opens in its own window with its own taskbar icon.
- [ ] Added to the iPad Home Screen, it opens full screen as a web app.
- [ ] Inside the installed app on both devices, the camera starts from the button and the landmarks follow the hand.
- [ ] Detection runs at 20 fps or more on the iPad and 25 fps or more on the laptop; the worker decision is recorded.
- [ ] The camera stops when the app is hidden and restarts on return.
- [ ] After the first load, the app opens and tracks hands with the device offline.
- [ ] The error log shows a test error on the iPad, and Copy works (A6).
- [ ] `npm test` passes. The MediaPipe version, the model's size and SHA-256, and the app's address are recorded in `DECISIONS.md` §4.

## Not in this phase

The cat, the room, needs, `storage.js`, `events.js`, gestures, smoothing and scene mapping, the developer panel beyond the error log, the real app name and icons.

## Pitfalls to avoid

- **Video on iPad:** without `playsinline` and `muted`, iPadOS may refuse to play the stream or play it full screen. Call `video.play()` after attaching the stream, and wait until `video.videoWidth` is above 0 before detecting.
- **Timestamps:** `detectForVideo(video, timestamp)` needs a strictly increasing timestamp, so skip a frame if `performance.now()` hasn't advanced.
- **Mirroring:** feed MediaPipe the unmirrored video and mirror only the display (CSS `transform: scaleX(-1)` on the video and the overlay together), so the dots stay aligned with the hand.
- **Service worker and navigation:** older browsers threw when a navigation request was rebuilt with options, as in `fetch(event.request, { cache: 'no-cache' })`; current ones quietly change its mode instead. Fetching navigations by URL, `fetch(event.request.url, { cache: 'no-cache' })`, avoids the question on every browser.
- **Paths:** register `./sw.js` and keep every path relative; the site lives at `/my-virtual-pet/`, not at `/`.
- **Caches:** delete only caches that start with `vpet-`. Other projects on the same GitHub Pages origin have caches too.
- **Camera at launch:** never start it automatically. The iPad asks permission on every launch, and that is expected.
- **GPU delegate:** it may fail on one device. The CPU fallback is acceptable if the fps targets are met; record which is used.
- **Windows shells:** Claude Code usually runs commands in PowerShell, with Git Bash also available. `npm`, `npx`, `node`, `tar` and `curl.exe` work in both; for SHA-256 use `Get-FileHash` in PowerShell or `sha256sum` in Git Bash. Use forward slashes in npm scripts.
- **First Pages deploy:** it can take a few minutes; a 404 before then is normal.
- **Large files:** don't precache both wasm variants; let first use cache the one the device needs.

## If the iPad checks fail

Stop, and don't start Phase 1. Present:

1. **The evidence:** the copied error log, which step fails, the version, delegate and readouts.
2. **The options:**
   - Fixes within Phase 0: a worker, the CPU delegate, a lower resolution (480 × 360), or testing in a Safari tab to isolate whether the problem is specific to Home Screen apps.
   - Touch only on the iPad for v1, with hand tracking on the laptop only.
   - A native iPad app later (L4, needs a Mac).
   - Another route Daniella prefers.

Daniella decides, and the decision goes into `DECISIONS.md` §3 before any further work.

## Record in DECISIONS.md

- §4: MediaPipe version; model URL, size and SHA-256; Node.js version; the app's address
- §3: the worker decision and the delegate used on each device
- §7: detection fps and ms for each device, in the phase log notes
