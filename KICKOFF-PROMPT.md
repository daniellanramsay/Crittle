# Kickoff prompt

**How to use it**

1. Finish `docs/SETUP.md` first.
2. Open Claude Code on your laptop in this folder: in PowerShell, run `cd C:\Users\danie\MyVirtualPet`, then `claude`. Press Shift+Tab until the status bar shows `⏸ plan mode on`. (After step 0 of the prompt, sessions start in plan mode by themselves.)
3. Copy everything below the line and send it as your first message.
4. Step 0 of the prompt has Claude Code install its settings and commands from `claude-setup` into `.claude`. When it presents that plan, choose **Yes, manually approve edits**, so every copy and the final delete wait for your click. At each of those prompts choose plain **Yes**. Never pick a "don't ask again" or "for this session" option there: those would turn this one-time permission into a lasting one.

You can also send it to Claude with this folder attached. It works there too, but the building itself should happen in Claude Code on your laptop (step 1 of the prompt checks this).

Claude will first install its settings and commands (step 0), then ask you to restart it with `claude --continue`. After that it reads everything, checks its setup, reports back, goes through the decisions with you, and plans Phase 0. It won't change any file until you approve its plan.

---

Hi Claude. I'm Daniella. This folder, `MyVirtualPet`, holds the complete plan for an app I want to build with you. Planning is finished and no app code exists yet. This message explains what we are building, how I want us to work, and exactly what to do in this session. Please read all of it before doing anything.

If anything in this message disagrees with the files, the files win, with `DECISIONS.md` first. Tell me about any disagreement you notice.

## 1. What we are building

A hand-tracked virtual pet that I play with by holding my hand in front of the camera. Version 1 (v1) has one animal: a cat. A cat is the easiest species that still supports everything I want: it mostly sits, loafs and sleeps in one spot, so it needs no walking, and its breeds differ mainly in ears, tail and coat.

The interactions, all by hand:

- **Petting:** stroke the cat with an open palm. It purrs and leans into my hand, and its affection rises.
- **Feeding:** pinch the food bowl or the water bowl on a shelf, bring it to the cat's mouth and let go. The cat eats or drinks. If it's already full, it sniffs and turns away. A treat jar works the same way.
- **Playing:** point my index finger and a feather wand appears at my fingertip. The cat tracks it and pounces when it moves fast.
- **Tricks:** touching my thumb to a fingertip gives a command. Thumb to middle finger is **Sit pretty**, thumb to ring finger is **High-five**, thumb to pinky is **Spin**.
- **Training:** each trick has a mastery from 0 to 100. The cat's chance of getting it right rises from 25% to 95% as mastery grows, and rewarding a success, with a treat or a stroke within 4 seconds, makes it learn faster. Every cat has a hidden learning speed, so some cats learn about three times faster than others.

Everything also works by touch and mouse, for poor light, a refused camera, or plain convenience on the iPad.

Designing my cat:

- 3 breeds: Domestic Shorthair, Scottish Fold, Siamese
- 7 coat patterns: solid, bicolour, tabby, spotted, calico, tortoiseshell, colourpoint
- Any colours, eye colour (including odd-eyed), nose and paw-pad colour, and a name

The art is a "cut-out" cat. I draw each body part once in Krita, and code moves, rotates and recolours the parts. Until my art arrives in Phase 5, a code-drawn placeholder made of the same parts stands in.

Needs and energy:

- Four needs (hunger, thirst, fun, affection) drop one point at a time. In the app the intervals are 35 to 60 seconds; while I'm away, Live mode uses 1 to 6 hours.
- A **Relaxed** mode freezes everything while I'm away.
- Energy drains with activity. The cat falls asleep at 20 and wakes at 100, and it naps when left alone with low energy.
- When a need is low the cat looks sad, and below 15 it lies down and mews. Nothing worse ever happens: no illness, no running away, no dying.

Two smaller ways to see the cat:

- **Mini view:** a pet-only corner view when the window is small.
- **Floating mini window:** on the laptop, an always-on-top window while the app is open.

The exact numbers for all of this are in `docs/PLAN.md` §5 to §7.

## 2. Where it runs, and how

- One codebase runs on my **Windows 11 laptop** and my **iPad**.
- It is an **installable web app**. On the laptop I install it from Microsoft Edge, and it then opens in its own window with its own taskbar icon, not as a browser tab. On the iPad I add it to the Home Screen from Safari, and it opens full screen.
- The stack is plain JavaScript ES modules, HTML and CSS: no framework, no TypeScript, no bundler, no build step for the game.
- Hand tracking uses **MediaPipe Hand Landmarker** (`@mediapipe/tasks-vision`), copied into `vendor/` at an exact pinned version.
- It is hosted on **GitHub Pages** in a public repository, because the iPad allows the camera only on HTTPS pages and free Pages needs a public repository.
- Everything runs on the device. There is no server in v1, and camera images are never stored or sent anywhere.

## 3. What v1 deliberately does not do

Don't try to make these work in v1; they are planned for later or impossible for a web app:

- **Alerts while the app is fully closed:** needs a push server (later phase L1). In v1 the cat looks sad and the window title changes.
- **An app icon that changes to show my pet:** an installed icon can't change. Phase 6 tries an install-time icon experiment only.
- **A pet on the desktop or Home Screen while the app is closed:** needs a desktop app (L2) or a native iPad app (L4).
- **Other species (dog, bird, fish), scale gradients, long-haired breeds, re-styling after adoption, sound:** later phases (L3, L5).

## 4. Where we are now

- Planning was done with Claude in an earlier conversation, and this folder is the handoff.
- An online copy of the plan exists as a doc. This folder is the source of truth for the build.
- Nothing is built yet: no `index.html`, no `src/`, no `vendor/`, no git repository yet.
- The next step is Phase 0, which proves the riskiest part first: hand tracking inside the installed app on the iPad.

## 5. The folder: every file and its job

- `README.md`: overview and status, written for me.
- `KICKOFF-PROMPT.md`: this message.
- `CLAUDE.md`: your standing rules for every session. Claude Code loads it automatically.
- `DECISIONS.md`: the live record of decisions (D1 to D9, Q1), flagged additions (A1 to A6), changes to the plan, pinned versions, tuned values, chosen numbers and the phase log. **It wins over every other file.**
- `docs/PLAN.md`: the full specification: architecture, rules, save format, every number, every gesture, the learning maths, the art pipeline, file formats, risks and sources.
- `docs/WORKFLOW.md`: how each phase session runs, how I test on each device, how deploying works, what to do when something goes wrong.
- `docs/SETUP.md`: the one-time setup I've done (git, Node.js, GitHub account and empty repository, camera settings, Claude Code).
- `docs/ART-GUIDE.md`: the contract for my Krita file: part names, layers, key colours, pivots.
- `docs/phases/phase-0.md` to `phase-6.md`: one brief per phase, each with a reading list, ordered build steps, tests, device test scripts, a "Done when" checklist, a "Not in this phase" list, and pitfalls.
- `.claude/settings.json`: makes every session start in plan mode, pre-approves tests and safe git commands, and always asks before pushing or discarding work.
- `.claude/skills/`: my four commands, `/start-phase N`, `/deploy`, `/handoff` and `/finish-phase N`.
- `claude-setup/`: holds `settings.json` and the four skills until you install them into `.claude` in step 0 of section 9. They were delivered there because Claude couldn't write into `.claude` from outside my laptop.
- `art/source/`: where my Krita files go. It is git-ignored because the repository is public.
- `.gitignore` and `.gitattributes`: git housekeeping (LF line endings, binary files).

Which file wins: `DECISIONS.md` wins over every other file. A phase brief and `docs/PLAN.md` should never disagree; if they do, stop and ask me.

## 6. How we work

1. **Plan before changing anything.** Present a plan and wait for my explicit approval before creating or editing any file. In Claude Code, stay in plan mode until I approve.
2. **One phase per session.** Never start the next phase. When a phase is finished, I start a fresh session for the next one.
3. **Scope discipline.** Build only what the current brief lists, and respect its "Not in this phase" list. Anything else is an **addition**: name it, give the reason, and ask. If I approve, log it in `DECISIONS.md` §2 with the next number (A7, A8, …). No silent extras.
4. **No invented numbers.** Every number comes from `docs/PLAN.md` (later `src/config.js`). If the plan doesn't give one, propose it in your plan and record my answer in `DECISIONS.md` §6.
5. **Honesty about the plan.** If something in the plan is wrong, contradictory or won't work, tell me directly and propose the smallest fix. Never work around it quietly.
6. **Tests.** Pure logic is tested with Node's built-in test runner (`npm test`). Run it after every module, and fix failures before moving on.
7. **Device checks are mine.** Only I can confirm what happens on my laptop and iPad. Never tick a device check yourself.
8. **git safety.**
   - Commit after each logical step, with clear messages.
   - Before anything that discards or rewrites work (reset, restore, checkout of files, clean, rebase, branch deletion, `rm`), tell me in one sentence what it will do and wait for my yes.
   - Never force-push. Explain each git step in one plain sentence.
   - Never commit `art/source/` or anything personal.
9. **Long sessions.** If the conversation gets long, or I need to stop partway, use `/handoff` so the next session continues exactly where we left off.
10. **Record everything that changes the plan** in `DECISIONS.md` in the same session.

## 7. Technical rules you must keep (PLAN §4.5)

1. **One event vocabulary** for touch, mouse and hands: `cursor:move`, `cursor:hide`, `pet:stroke` (which carries speed), `grab:start`, `grab:move`, `grab:end`, `wand:move`, `wand:end`, `trick:sitpretty`, `trick:highfive`, `trick:spin`.
2. **Time comes only from timestamps** (`clock.now()`), never from counting ticks.
3. **No URL or hash changes after load**, and no `href="#"`. On the iPad a hash change stops the camera.
4. **Only `src/storage.js` touches `localStorage`.** Keys start with `vpet.` because every GitHub Pages project on my account shares one origin.
5. **Pure modules** (simulation, gesture maths, render maths) use no DOM, timers, storage or `Date.now()`.
6. **Exact pinned versions only:** no CDN links, no `@latest`, no runtime npm dependencies. Record versions in `DECISIONS.md` §4.
7. **Service worker:** cache names start with `vpet-`, and only those are ever deleted. Until Phase 6 it fetches network-first with `cache: 'no-cache'`, because GitHub Pages lets browsers reuse files for 10 minutes. `APP_VERSION` goes up on every deploy and shows on screen.
8. **Relative paths only** (`./…`). The app lives in a sub-folder on GitHub Pages.
9. **Every tunable number lives in `src/config.js`.**
10. **The camera's first start after each launch needs a tap.** It stops when hidden, in the mini view or switched off, restarts by itself on return if it was running, and images are never stored or sent.
11. **Errors also go to an on-screen error log,** because the iPad has no developer console without a Mac.

## 8. Platform facts already established (don't rediscover them)

These were researched during planning and are cited in `docs/PLAN.md` §13. Treat them as known unless my devices show otherwise.

- On iPadOS 26, sites added to the Home Screen open as web apps by default ("Open as Web App").
- Home Screen web apps on the iPad currently ask for camera permission on **every launch**. That's why the camera starts from a button.
- In iPad Home Screen apps, a hash change has stopped the camera and reset its permission.
- Intermittent camera start failures in Home Screen apps are a known WebKit issue, so we need a Try again path.
- The `<video>` element needs `playsinline` and `muted`. `detectForVideo(video, timestamp)` needs strictly increasing timestamps. MediaPipe detection calls block the page while they run.
- A Home Screen icon never updates once added. A closed web app cannot schedule its own notifications; Chrome's scheduled-notification API never launched.
- Document Picture-in-Picture (the floating window) works in Chrome and Edge, not on the iPad. It never outlives the opening window, and the app cannot position it.
- Deleting a Home Screen app on the iPad deletes its stored data.
- On Windows, Claude Code's primary shell is usually PowerShell, and Bash permission rules don't apply to it. The project settings therefore list every rule for both shells.
- Free GitHub Pages works only with public repositories. GitHub Pages sends `Cache-Control: max-age=600`.
- On 31 October 2026 the newest stable `@mediapipe/tasks-vision` at least 14 days old was 1.1.1. Phase 0 re-checks the rule before downloading.

## 9. What I want from you in this session, step by step

**Step 0: install the project's settings and commands. Do exactly this and nothing else.**

Claude couldn't write into `.claude` from outside my laptop, so the files are waiting in `claude-setup/`. This step copies them into place.

1. Without changing anything, show me the files in `claude-setup/` and what `.claude/` holds now. It may contain four empty folders under `.claude/skills/`.
2. Present this as your plan and wait for my approval:
   - Copy exactly these five files, unchanged, using a file-copy command (`Copy-Item` or `cp`), never by retyping their contents:
     - `claude-setup/settings.json` → `.claude/settings.json`
     - `claude-setup/skills/start-phase/SKILL.md` → `.claude/skills/start-phase/SKILL.md`
     - `claude-setup/skills/deploy/SKILL.md` → `.claude/skills/deploy/SKILL.md`
     - `claude-setup/skills/handoff/SKILL.md` → `.claude/skills/handoff/SKILL.md`
     - `claude-setup/skills/finish-phase/SKILL.md` → `.claude/skills/finish-phase/SKILL.md`
   - Compare each copy's SHA-256 with its source's, and show me all five pairs.
   - Only if all five match, delete the `claude-setup/` folder. Its `README.md` is not copied.
   - If any target file already exists, don't overwrite it. Show me whether it matches its source and ask me what to do.
3. After I approve, do only those actions, telling me each one as you do it. Then list `.claude/` to show the result.
4. Nothing else in this step: no other file created, edited, moved or deleted; no git; no installs; no network; no change to the copied files' contents. Don't start step 1.
5. This permission covers this one copy, this one time. It is **not** a general permission to change `.claude/`. After step 0, never create, edit, move or delete anything in `.claude/` unless I explicitly ask for that specific change.
6. Finish by telling me to type `/exit`, then run `claude --continue`. That reloads Claude Code with the new settings and commands and carries this conversation on. Then I check that the status bar shows plan mode and that typing `/` lists start-phase, deploy, handoff and finish-phase, and send "Continue with step 1."

**Step 1: environment check.**
- Tell me where you are running. Is it Claude Code on my Windows laptop in `C:\Users\danie\MyVirtualPet`, or somewhere else, such as a Linux sandbox with this folder attached? If it's not Claude Code on my laptop, say so and don't run any git commands; the build belongs in Claude Code on my laptop.
- Check that plan mode is on.
- Tell me which shell you use for commands. On Windows, Claude Code usually uses PowerShell; there, use `curl.exe` (not `curl`) and `Get-FileHash` for SHA-256.
- Run `git --version`, `node --version` and `npm --version`. If git or Node.js is missing, or Node is older than v22, tell me and point me to `docs/SETUP.md`.
- List the folder and confirm every file named in section 5 exists.
- Confirm step 0 is complete: `.claude/settings.json` and the four `.claude/skills/*/SKILL.md` files exist, `claude-setup/` is gone, plan mode is on, and the four commands appear when I type `/`. If anything is missing, stop and tell me what; don't repeat step 0 without my approval.

**Step 2: read, in this order.**
1. `CLAUDE.md`
2. `README.md`
3. `DECISIONS.md`
4. `docs/PLAN.md`, all of it
5. `docs/WORKFLOW.md`
6. `docs/phases/phase-0.md`
7. The headings, goals and "Done when" lists of `docs/phases/phase-1.md` to `phase-6.md`
8. `docs/ART-GUIDE.md` (skim)
9. `docs/SETUP.md` (skim)
10. `.claude/settings.json` and the four `SKILL.md` files in `.claude/skills/`

**Step 3: report back,** with these headings:
- **The project in your own words:** at most 10 lines, so I can see you've understood it.
- **Problems found:** anything inconsistent between files, ambiguous, missing, or that you believe won't work. Give the file and section for each and your proposed fix. Don't fix anything yet.
- **Risks for Phase 0:** what you think is most likely to go wrong, and how the brief handles it, or doesn't.

**Step 4: decisions.** Present D1 to D9, Q1 and the flagged additions A1 to A6 as one numbered list. Give each one's default and its trade-off in one or two sentences, so I can answer in a single reply (for example, "D1 keep, D6 drop Scottish Fold, A2 strike"). Phase 0 strictly needs only D3 confirmed, but I'd like to settle them all now. D8 (the app's name) can stay open until Phase 6.

**Step 5: plan Phase 0,** following `docs/phases/phase-0.md`. Use the same headings `/start-phase` uses: Goal, Files, Order of work, Tests, How each "Done when" check will be met, Numbers the plan does not give, Additions, Problems found, Questions. Make recording my decisions in `DECISIONS.md` the first item of the plan. Ask me for my GitHub username and the repository's HTTPS address. Then stop and wait for my approval.

**Step 6: after I approve,** build Phase 0 exactly as approved.
- Run `npm test`, and commit after each step.
- Give me the laptop test script, help me through `/deploy` and the GitHub Pages setup, then give me the iPad test script.
- Record versions, measurements and decisions as the brief says.
- Use `/finish-phase 0` only after I confirm every check.
- If Phase 0 fails on the iPad, stop and present the options listed in the brief. Don't start Phase 1.

## 10. How to talk to me

- Explain the why, not just the what. I want to understand the reasoning behind choices.
- Keep follow-ups concise and information-dense. Use short, structured notes for important explanations.
- Correct me directly and honestly when something I ask for won't work, and say what would.
- For anything on my devices, tell me exactly what to tap or click and what I should see.
- When you're blocked, ask one clear question at a time and offer a default I can accept.

## 11. What "done" looks like for v1

- Phases 0 to 6 each finished with every check confirmed, and tagged `phase-0` to `phase-6`.
- `APP_VERSION` 1.0.0.
- The app installed on my laptop (taskbar) and iPad (Home Screen), working offline after its first launch.
- Every requirement in `docs/PLAN.md` §3 delivered as its Scope column says: 17 fully, 3 partly, 2 in later phases.
- A full day of real use on each device with an empty error log.

## 12. Final reminders

- Don't build anything from a later phase, and don't add libraries, frameworks, settings or files that aren't in the plan without asking.
- Don't change `CLAUDE.md`, `.claude/settings.json`, the skills, or the structure of the docs unless I agree; step 0's exact copy is a one-time permission for that copy only, not a general permission. If you think one of them is wrong, tell me.
- Don't push without my approval, never force-push, and never commit `art/source/`.
- Don't start the camera automatically, and never store or send camera images.

Thank you. Start with step 1.
