# Decisions

The live record for this project: decisions, flagged additions, changes to the plan, pinned versions, tuned values and the phase log.

**This file wins.** If it disagrees with `docs/PLAN.md` or a phase brief, this file is right; Claude Code then updates the other file in the same session and says so.

**To change a decision,** tell Claude Code, for example "change D6 to Shorthair and Siamese only". It updates the table, adds a dated line to §3, and updates any affected file.

---

## 1. Decisions

Defaults are as planned on 31 October 2026. Status changes to "Confirmed (date)" once Daniella confirms, normally in the kickoff session.

| ID | Decision | Default | Status | Needed by | Notes |
| --- | --- | --- | --- | --- | --- |
| D1 | Art style | Illustrated cut-out cat drawn in Krita; each part drawn once and animated by code | Confirmed (31 Oct 2026) | Phase 3 | Alternative: pixel art in Aseprite (PLAN §8.10); changes Phases 3 and 5 only |
| D2 | When the art arrives | Phase 5; a code-drawn placeholder cat built from the same parts until then | Confirmed (31 Oct 2026) | Phase 1 | |
| D3 | Hosting | GitHub Pages with git, public repository | Confirmed (31 Oct 2026) | Phase 0 | Free GitHub Pages works only with public repositories. Fallback without git: Netlify Drop |
| D4 | Default needs mode | Live (needs drop slowly while away); Relaxed is a switch in settings | Confirmed (31 Oct 2026) | Phase 1 | |
| D5 | What happens at 0 | Only sadness; never ill, never runs away, never dies | Confirmed (31 Oct 2026) | Phase 1 | |
| D6 | Breeds in v1 | Domestic Shorthair, Scottish Fold, Siamese | Confirmed (31 Oct 2026) | Phase 5 | Long-haired breeds are later (L5) |
| D7 | The mini view counts as | Away (slow 1 to 6 hour rates) | Confirmed (31 Oct 2026) | Phase 1 | |
| D8 | App name | Not chosen | Open | Phase 6 | Used for the install name, icon label and window title; a good name for the GitHub repository too (WORKFLOW §13) |
| D9 | Hand recordings (Phase 2 test files) | Kept on the laptop only (git-ignored) | Confirmed (31 Oct 2026) | Phase 2 | They describe the shape and movement of your hand, and the repository is public. Replay tests skip, with a visible note, where the files are missing |
| Q1 | Access to a Mac? | — | Open | Later only | Affects only later phase L4 (native iPad app) |

---

## 2. Flagged additions

Not in the original request. Each is included unless struck.

| ID | Addition | Phase | Status | Why |
| --- | --- | --- | --- | --- |
| A1 | Touch and mouse controls for everything | 1 | Confirmed (31 Oct 2026) | Hand tracking fails in poor light or when camera access is refused; touch is natural on the iPad; the game can be built and tested before hand tracking exists |
| A2 | First-run tutorial | 6 | Confirmed (31 Oct 2026) | Teaches the pinch and thumb taps; says the camera image never leaves the device |
| A3 | Save backup (export and import a file) | 6 | Confirmed (31 Oct 2026) | Protects the cat if browser data is cleared; moves a cat between devices by hand |
| A4 | Developer panel (hidden by default) | 1 | Confirmed (31 Oct 2026) | Live gesture readings and time controls, so slow decay can be tested in seconds |
| A5 | git from Phase 0 | 0 | Confirmed (31 Oct 2026) | Every phase becomes a checkpoint that can be returned to |
| A6 | On-screen error log | 0 | Confirmed (31 Oct 2026); added 31 Oct 2026 | The iPad has no developer console without a Mac; without this, iPad failures cannot be diagnosed |
| A7 | `tests/clock.test.js`: speed changes and Pause never move game time back, and 60× runs 60 times faster | 1 | Confirmed (1 Nov 2026) | The 60× device checks depend on the clock, and the Phase 1 brief had no clock test |
| A8 | A Pause speed in the developer panel's Time tab | 1 | Confirmed (1 Nov 2026) | In-app decay keeps running while you read and click; paused, the developer checks give exact values however long they take |
| A9 | The Time tab's "Done" line lists all five meters | 1 | Confirmed (6 Nov 2026) | The open panel can cover the meters on a narrow screen, and the checks read them with it open |

Further additions approved during the build get the next number (A7, A8, …) and a row here.

---

## 3. Changes and clarifications to the plan

Changes made after the plan doc, newest last. Each is already written into `docs/PLAN.md` and the phase briefs.

| Date | What changed | Why |
| --- | --- | --- |
| 2026-10-31 | Logic tests run with Node's built-in test runner (`npm test`), replacing `tests/tests.html` | Claude Code can run them itself after every change |
| 2026-10-31 | Art source moved to `art/source/` (git-ignored); build output to `art/build/` | Free GitHub Pages repositories are public; source art stays private |
| 2026-10-31 | Storage keys start with `vpet.`; cache names start with `vpet-` | Every GitHub Pages project on one account shares one web origin |
| 2026-10-31 | The service worker fetches with `cache: 'no-cache'` while in development | GitHub Pages lets browsers reuse files for 10 minutes; without this the iPad can run old files after a deploy |
| 2026-10-31 | `APP_VERSION` scheme `0.N.x`, kept in `src/version.js` and line 1 of `sw.js`, checked by a test | One visible version per deploy, so testers know which build they are running |
| 2026-10-31 | Scene fixed at 1000 × 700 units, scaled to fit; canvas pixel ratio capped at 2 | Positions and speeds must mean the same on every screen |
| 2026-10-31 | Moods use the four needs only, not energy | A tired cat sleeps; it is not sad |
| 2026-10-31 | The save records whether the cat is asleep; launch state defined (PLAN §5.6) | Closing the app no longer wakes the cat |
| 2026-10-31 | Treats: +5 hunger, always eaten while awake, also count as the trick reward | The plan used treats as rewards without saying what they do otherwise |
| 2026-10-31 | Thumb taps have their own detector; the pose holds still during a tap | A tap must not disturb petting or the wand |
| 2026-10-31 | Gesture distances measured in video pixels | Normalised coordinates stretch differently in x and y |
| 2026-10-31 | Touch and mouse: hold 300 ms on empty floor to bring out the wand | The plan said "press and hold" without a time |
| 2026-10-31 | No sound in v1; purring and mewing shown visually | Sound was implied but never specified; it moves to L5 |
| 2026-10-31 | Pattern-to-colour mapping table; part hierarchy; sitting and lying skeletons; sleep pose reuses ear and eye parts; `sleep_tail@slim` added | Phase 5 art and Phase 3 rig need exact rules |
| 2026-10-31 | Art data flow defined: `rig.json` → `recolour.js` → finished parts → `rig.js`; formats for `rig.json`, finished parts, `poses.json` and hand recordings | Removes ambiguity between Phases 3 and 5 |
| 2026-10-31 | New file `src/input/handmath.js` (pure smoothing and mapping) and `src/ui/errorlog.js` (A6) | Lets recorded hand data be replayed in tests; holds the error log |
| 2026-10-31 | Default first cat named "Kitty"; developer panel opens by tapping the version label 5 times within 3 s | The plan needed a name for the window title before the creator exists |
| 2026-10-31 | Quickest learner reaches 80 mastery in about 22 commands (was "about 20"); simulation table added to PLAN §7.3 | Checked by simulation |
| 2026-10-31 | `pet:stroke` carries its speed; the cat decides between petting (80 to 1200 units/s) and flinching (faster) | Keeps the event list fixed while letting touch and hands share one rule |
| 2026-10-31 | At most one pounce per second (+2 fun each) | Without a limit, a fast wand would add fun on every frame |
| 2026-10-31 | The art tool halves `region` layers by majority vote per 2 × 2 block | Averaging would blend key colours into unrecognisable in-between colours |
| 2026-10-31 | Energy regained while away keeps its fraction in a new `progress.rest` field | Without it, the mini view's once-a-minute catch-ups each rounded down to 0 and energy never rose |
| 2026-10-31 | Save schema 1 also holds `settings.preview` and `settings.tutorialDone` | Phases 2 and 6 need them; adding them now avoids a schema change |
| 2026-10-31 | Affection from petting is +1 per 0.5 s (still 2 per second) | Meters move in whole points |
| 2026-10-31 | Play ends at once when energy reaches 20, and the cat falls asleep | Otherwise endless play could drain energy to 0 and block sleep |
| 2026-10-31 | The in-app tick ignores elapsed time of 0 or less; "In app for" bypasses the 10 s gap rule | A clock moved back must not raise the meters; the developer control must apply in-app rates |
| 2026-10-31 | Items float back to the shelf over 0.5 s; the Phase 2 check counts from the moment the hand leaves | The plan gave no duration, and no-hand detection itself takes 300 ms |
| 2026-10-31 | Camera: the first start after each launch needs a tap; later restarts on return happen by themselves | The plan said both "only from a tap" and "restarts on return" |
| 2026-10-31 | The floating window counts as the mini view (D7) | Its rates and camera behaviour were unstated |
| 2026-10-31 | Skeletons (root and parents) are data in `src/render/poses.json` | `rig.js` then works with any part set, including the test sample |
| 2026-10-31 | New Phase 6 files `src/ui/tutorial.js`, `src/ui/backup.js` and `src/ui/appicon.js`; optional `src/input/hands.worker.js` (Phase 0) | Every feature needs a named home, and `CLAUDE.md` forbids unlisted files |
| 2026-10-31 | Precache scope defined as the app's own files, not docs, tests or tools | GitHub Pages serves the whole repository, so "every served file" was ambiguous |
| 2026-10-31 | `.claude/settings.json` mirrors each Bash rule as a PowerShell rule, and asks before `git commit --amend` and forced tags | On Windows, Claude Code's primary shell is usually PowerShell, and Bash rules don't apply to it |
| 2026-10-31 | "Needs attention" durations corrected to 71 drops (41 to 71 minutes in the app) | The earlier figures counted to 30, which is still "Okay" |
| 2026-10-31 | D9 added: hand recordings stay on the laptop by default | The repository is public |
| 2026-10-31 | Claude Code installs `.claude` from `claude-setup` as step 0 of the kickoff, copying exactly five files with your approval and doing nothing else; SETUP no longer asks you to run `robocopy` | Your choice; a remote Claude session can't write into `.claude` |
| 2026-10-31 | That install is a one-time permission, not a general one. Any later change in `.claude/` needs your explicit instruction (rule in `CLAUDE.md`), and `.claude/settings.json` adds an ask rule, `Edit(/.claude/**)`, so edits there always prompt | Your instruction |
| 2026-10-31 | The build runs in the Claude desktop app's Code tab, not the terminal; WORKFLOW §3 and SETUP §8 say how the app differs | The terminal `claude` command isn't installed. The app reads the project settings, but a resumed session can come back in another mode, so Plan is checked at each session start |
| 2026-10-31 | The manifest has no `id`, so the app's identity is its `start_url`, the app's own folder (PLAN §4.5 rule 8, Phase 0 step 7) | A relative `id` resolves against the origin, so `./` meant `https://<username>.github.io/`, which every Pages project on the account shares |
| 2026-10-31 | `src/config.js` starts in Phase 0 with that phase's numbers; Phase 1 extends it | Rule 9 applies from Phase 0, which already has tunable numbers |
| 2026-10-31 | `src/ui/errorlog.js` loads from its own module script before `main.js`, and `hands.js` loads the MediaPipe bundle with `import()` when the camera starts | A file that fails to load can't stop the error log, and the service worker caches the bundle at the first camera start |
| 2026-10-31 | If the first detection with the GPU delegate fails, `hands.js` switches to CPU once and logs it (PLAN §6.1) | GPU creation can succeed while detection still fails |
| 2026-10-31 | A camera stream that ends unexpectedly after the first 3 s also shows the failed state, with Try again (PLAN §6.6) | Otherwise a frozen picture would show as "on" |
| 2026-10-31 | Visual CSS values (spacing, font sizes) are not tunable numbers and aren't listed in `config.js` or §6, as long as they meet the accessibility rules in `CLAUDE.md` | Daniella's choice in the Phase 0 plan |
| 2026-10-31 | The GitHub repository is named `Crittle`, not `my-virtual-pet` (it was briefly `MyVirtualPet`, before anything was published), so the app's address is `https://daniellanramsay.github.io/Crittle/`. SETUP §5, WORKFLOW and the Phase 0 brief now use that name; the laptop folder is still `MyVirtualPet`. `package.json` keeps the name `my-virtual-pet` that the brief gives it, because npm's name doesn't affect the app | Daniella's choice |
| 2026-10-31 | The iPad's Phase 0 readouts (detection rate and time, delegate) were not recorded; the worker decision used the laptop's numbers | Daniella's choice |
| 2026-10-31 | `.gitignore` also ignores `.claude/launch.json`, the desktop app's setting for starting the local server | Daniella's choice; `/deploy` adds every new file, so it would otherwise be published |
| 2026-10-31 | Details settled while building Phase 0: the error log has a Close button besides Copy, Clear and Test error, opens by itself if `config.js` can't load, and keeps MediaPipe's own notes and warnings at their level, so its badge counts only errors; the camera's 3 s window for a first frame starts when the stream arrives, so time on the permission prompt doesn't count | The brief left these open; listed for Daniella after the build |
| 2026-10-31 | Worker decision: detection runs in a module worker, `src/input/hands.worker.js` (PLAN §6.1). The page fetches the worker's files through the service worker and hands them over, so the worker fetches nothing itself, and lends MediaPipe a canvas from the page (`transferControlToOffscreen`). If the worker can't start, detection runs on the page as before. The Delegate readout shows where detection runs, for example "GPU (worker)". Delegate before the worker: GPU on the laptop; the iPad's wasn't recorded | Daniella's choice, after the laptop measured 12.3 to 24.9 ms per detection, over the 12 ms line, and the page froze while hand tracking started. Tested in the Claude app's browser (Chromium) with a stand-in video: with a canvas of the worker's own, every first detection took 12 to 14 s, because the browser didn't reuse its stored graphics setup; with the page's canvas it took 0.9 s. The page then never paused for more than 35 ms. Some browsers send a worker's own requests past the service worker, which would break offline use |
| 2026-11-01 | A new save's `createdAt` and `lastSeenAt` are the moment it's made; the 0 in PLAN §4.7's example is the time the test uses | Taken literally, the first catch-up would count 30 days away, and Kitty would start at 0, 0, 0, 0 and 100 |
| 2026-11-01 | Three kinds of time. Game time (`clock.now()`) drives the cat. Unscaled wall time (`clock.wallNow()`, `Date.now()`) decides the 10 s gap rule, through the pure `chooseUpdate` in `needs.js`. The browser's own event and frame times drive touch speeds, the 300 ms hold, items floating back and the 10 s autosave. Game time that moved back also goes to catch-up, which changes nothing and re-bases the time, and the cat's timers shift with it | If touch used game time, then at 60× a stroke would measure 60 times too slow and the hold would last 5 ms. Frame times can stop while a computer sleeps, so hours away could be charged at in-app rates (Daniella's change to the Phase 1 plan) |
| 2026-11-01 | Developer time controls: Away for moves the game clock forward and runs catch-up. In app for runs one in-app tick and then moves the clock on by the same amount. Clock back moves the game clock back. Pause (A8) stops game time. All of these last only until a reload | The brief didn't say how the controls and the clock fit together |
| 2026-11-01 | Developer mode is `settings.dev`: opening the developer panel turns it on and saves it, and Reset save turns it off. In Phase 1 its only effect is a warning for unknown event names | PLAN never defined it (Daniella approved the default) |
| 2026-11-01 | Event payloads, in scene units: `cursor:move` {x, y}; `pet:stroke` {x, y, speed}; `grab:start` {item, x, y}, where item is `food`, `water` or `treat`; `grab:move` and `grab:end` {x, y}; `wand:move` {x, y}; the rest carry nothing. The hit test from `scene.js` returns `cat`, `food`, `water`, `treat` (the jar) or nothing | Phase 2's hands must send exactly what touch sends |
| 2026-11-01 | Behaviour details: a higher-priority trigger takes over at once (a bowl dropped during play is eaten), and a lower one is ignored (strokes during a meal do nothing). Sleep at energy 20 waits for a meal to finish or petting to end, while play ends at once. The nap timer counts from the last interaction, or from launch. A meal's gain arrives when it ends. Stroking time counts the gaps between strokes that come within 0.8 s of each other. Flinch, sniff, pounce and the idle extras are short reactions, not states, and a stroke too fast to pet is ignored while asleep | PLAN §5.6 left these open |
| 2026-11-01 | Items while the cat sleeps: when it falls asleep, a held item floats back; one picked up while it sleeps floats back when released. Only one treat is out at a time | Daniella approved the default |
| 2026-11-01 | The wand starts after a 300 ms hold anywhere that isn't the cat, a bowl or the jar, including the wall. Moving more than 10 units first makes it a drag | "Empty floor" was unclear (Daniella approved the default) |
| 2026-11-01 | The error log is now the developer panel's Errors tab. `errorlog.js` still loads on its own, owns the version label (its text, badge and 5 taps), and opens the panel, which is non-modal and on the left. If the game fails to load, the panel opens with only the Errors tab working | The log must survive a file that fails to load (31 Oct entry above) |
| 2026-11-01 | Developer panel details: Away for also offers 2 h; Reset meters also wakes the cat, which is the PLAN §5.8 starting point; the Time tab's "Done" line lists all five meters, because the open panel can cover them on a narrow screen | Laptop step 3 needed a 2 h button; the other two came up while testing in the browser pane |
| 2026-11-01 | Phase 1 test scripts revised. Steps 1 to 5, 11 and 13 start with Pause. Steps 7, 8 and 11 set the meter low first. Step 14 strokes the cat before watching. Step 15 runs with the cat asleep, in Live and in Relaxed. The iPad repeats laptop steps 1 to 5 before 6 to 10. The floating-point test adds two cases that fail without the 1e-9 guard | In-app decay raced the checks, the 100 cap hid gains, three "Done when" items weren't covered, and the brief's own floating-point case passes even without the guard |
| 2026-11-06 | Each Time button names its group ("Away 10 min", "In app 10 min"), and a meter box applies its number as soon as typing ends: Enter, Done on the iPad keyboard, a tap elsewhere, or Set. Laptop steps 1 to 5 are done in one sitting | Two buttons both read "10 min". The boxes lost what was typed: the panel refreshes every frame and put the old number back once a box lost focus, so only Enter worked. Closing the app ends Pause, and real time away then adds to the buttons |

---

## 4. Pinned versions

Filled in during Phase 0 (and Phase 5 for art tools). Change only with a dated note in §3.

| Item | Version | Where | Pinned on | Notes |
| --- | --- | --- | --- | --- |
| `@mediapipe/tasks-vision` | 1.1.1 | `vendor/mediapipe/` | 31 Oct 2026 | Rule: newest stable release (not rc, not nightly) published at least 14 days before Phase 0. On 31 Oct 2026 that was 1.1.1 (published 14 Oct 2026); 1.2.0 (27 Oct 2026) was too new. npm tarball shasum `9a219124017db10bbeb4aedca86d367a640c555d`. Copied: `vision_bundle.mjs`, `package.json`, and in `wasm/` the `vision_wasm_internal` and `vision_wasm_nosimd_internal` pairs (`.js` and `.wasm`), plus the `vision_wasm_module_internal` pair for the worker (§3; same package, copied 31 Oct 2026). Its type definitions were checked against the calls in the Phase 0 brief, step 12 |
| Hand model `hand_landmarker.task` | float16, version 1 | `vendor/mediapipe/` | 31 Oct 2026 | From `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`; 7,819,105 bytes; SHA-256 `FBC2A30080C3C557093B5DDFC334698132EB341044CCEE322CCF8BCF3607CDE1` |
| `serve` (local server) | 14.2.6 | `npm run serve` (npx) | 31 Oct 2026 | Development only |
| App address | `https://daniellanramsay.github.io/Crittle/` | GitHub Pages, repository `daniellanramsay/Crittle` | 31 Oct 2026 | First published at version 0.0.1. The path is case-sensitive: `/crittle/` gives a 404 |
| Node.js | v24.20.0 | Laptop | 31 Oct 2026 | Development only; version 22 or newer |
| Art tool libraries | — | devDependencies | — | Phase 5 |

---

## 5. Tuned values

Every value changed from its starting value in `docs/PLAN.md`, once tested on Daniella's devices.

| Date | Value | Old | New | Why |
| --- | --- | --- | --- | --- |
| | | | | |

---

## 6. Layout and other numbers chosen during the build

Numbers the plan left to a phase (for example object positions in Phase 1, purr and mew timings in Phase 3).

| Date | Phase | Value | Chosen | Why |
| --- | --- | --- | --- | --- |
| 2026-10-31 | 0 | Colours | Background and theme `#1f1d2b`; text `#f4f1ea`; buttons `#f2a65a` with `#1f1d2b` text | A dark page suits the camera view; text contrast about 15:1, button contrast about 8:1 |
| 2026-10-31 | 0 | Placeholder icons | A `#f2a65a` paw on `#1f1d2b`, inside the middle 60% | Clear at 180 px; replaced by Daniella's icons in Phase 6 |
| 2026-10-31 | 0 | Landmark drawing | Dots of radius 4 px in `#f2a65a`; white lines 2 px wide | Visible over the video at 640 × 480 |
| 2026-10-31 | 0 | Worker rule (12 ms) | Judged on the 60-detection average, with a hand in view | Single detections vary, and with no hand in view the detector does different work |
| 2026-11-01 | 1 | Layout (scene units, x and y from the top-left) | Floor from y 470; shelf x 600 to 960, top surface at y 330; food bowl 100 × 40 centred at (670, 310); water bowl 100 × 40 at (790, 310); treat jar 70 × 90 at (900, 285); treats 24 across; cat box x 250 to 490, y 280 to 620, which is also where strokes count; mouth point (480, 395); feeding spot (550, 600) for a bowl in use, while a treat is eaten at the mouth | The HUD covers roughly the top 110. The cat sits facing the shelf, and the bowls on it are at least 208 from the mouth, outside the 120 reach. Items are grabbed by their drawn box |
| 2026-11-01 | 1 | Hold tolerance | Moving more than 10 units before 300 ms makes a drag, not the wand | A finger jitters a little while it holds still |
| 2026-11-01 | 1 | Stroke speed | Measured over the last 100 ms of movement | The iPad's 120 Hz touches would otherwise spike into false flinches |
| 2026-11-01 | 1 | Placeholder reaction lengths | Flinch 0.5 s, sniff and turn away 1.5 s, pounce 0.4 s, idle extra 2 s | Phase 3's animations replace them with real lengths |
| 2026-11-01 | 1 | Rolled aptitude and affinity | Rounded to 2 decimal places | As in the PLAN §4.7 example |
| 2026-11-01 | 1 | Room colours | Wall `#3a3552`, floor `#5b4636`, shelf `#8a5a3b`, food bowl `#e07a5f`, water bowl `#5fa8d3`, jar `#cfe3ea`, treat `#b5651d`, cat `#c8742a` (the default coat), eyes `#6aa84f`, nose `#e8a0a8` | Text `#f4f1ea` on the wall is about 10:1 |

---

## 7. Phase log

| Phase | Finished | Tag | Version | Notes |
| --- | --- | --- | --- | --- |
| 0 | 1 Nov 2026 | `phase-0` | 0.0.2 | Laptop, Edge at localhost (31 Oct 2026): 48.3 fps, 19.8 ms average over the last 60 detections, GPU delegate, video 640 × 480. The first camera start failed once with `NotReadableError: Could not start video source`; Try again worked. Laptop, installed app from GitHub Pages: online 60.0 fps, 12.3 ms, GPU, 640 × 480; offline (Wi-Fi off) 38.4 fps, 24.9 ms, GPU, 640 × 480. Offline it opened and tracked hands, but the camera and the first landmarks took a long time to appear, and the page lagged just before. Laptop, installed app, version 0.0.2 with the worker: 36.9 fps, 18.3 ms, GPU (worker), 640 × 480. iPad, Home Screen app: every check passed with versions 0.0.1 and 0.0.2, including offline; its readouts weren't measured (§3). |
| 1 | 6 Nov 2026 | `phase-1` | 0.1.2 | Laptop, Edge: every check confirmed, with the moods steps run on their own on 6 Nov 2026, using Set. iPad, Home Screen app, version 0.1.1: the meter boxes put the old number back, because the panel's refresh overwrote a box once it lost focus and only Enter worked; fixed in 0.1.2, which also names each time button's group. Two iPad readings on 0.1.1 were off and their cause wasn't established: 72, 64, 76, 78, 100 after Away 2 h (exactly 16 hours away in total) and 80, 80, 80, 80, 90 after 10 min. The same steps gave the right numbers with real clicks in headless Edge, and the readings didn't come back. Daniella's first confirmation of the time controls was on v0.1.1. iPad, version 0.1.2, after a full close and reopen: the time controls and a meter box all matched. For Phase 2: `behaviour.js` ignores `cursor:hide` for now, so PLAN §6.3's No hand row (a held item floats back, the wand disappears) needs adding there, and Phase 2's build list doesn't name that file. |
| 2 | — | — | — | |
| 3 | — | — | — | |
| 4 | — | — | — | |
| 5 | — | — | — | |
| 6 | — | — | — | |
