# CLAUDE.md — My Virtual Pet

Standing instructions for every Claude Code session in this folder. Detail lives in `docs/`; this file holds the rules that apply every time.

## The project

A hand-tracked virtual cat for Daniella's Windows 11 laptop and iPad. You pet it with an open hand, feed it by pinching a bowl, play with a feather wand by pointing, and teach tricks with thumb-to-fingertip taps. It has needs, energy and sleep, and a customisable look.

It is an installable web app: plain JavaScript ES modules, HTML and CSS, no framework, no build step for the game. MediaPipe Hand Landmarker does the hand tracking, vendored and version-pinned. GitHub Pages hosts it (HTTPS is needed for the camera). Everything runs on the device; there is no server in v1.

It is built in seven phases (0 to 6), one Claude Code session per phase, tested on both devices between phases.

## Files, and which one wins

- `DECISIONS.md`: live decisions, additions, plan changes, pinned versions, tuned values, phase log. **Newest; wins over every other file.**
- `docs/phases/phase-N.md`: the brief and checklist for phase N.
- `docs/PLAN.md`: the full specification. Every number comes from here, and later from `src/config.js`.
- `docs/WORKFLOW.md`: how sessions, testing and deploying work (written for Daniella).
- `docs/ART-GUIDE.md`: the art asset contract (Phase 5).
- `docs/HANDOFF.md`: exists only while a phase is paused. If it exists, read it first.

If `DECISIONS.md` disagrees with another file, follow `DECISIONS.md`, update the other file in the same session, and say so. If a phase brief and `PLAN.md` disagree, stop and ask.

## How every session works

1. The project starts sessions in plan mode. Read `DECISIONS.md`, `docs/HANDOFF.md` if present, the phase brief, and the `PLAN.md` sections the brief lists.
2. Present a plan and wait for approval. Change no file before Daniella approves.
3. Build only the brief's list, in its order. Run `npm test` after each module and fix failures before moving on.
4. Tell Daniella exactly what to test on each device, using the brief's test script.
5. Close the phase with `/finish-phase N`, and only after Daniella confirms every device check.

One phase per session. Never start the next phase. If the session is getting long or must stop, run `/handoff`.

## Scope rules (non-negotiable)

- Build only the current phase. Respect its "Not in this phase" list.
- Anything not in the plan is an **addition**: name it, give the reason, and ask. If approved, log it in `DECISIONS.md` §2 with the next A-number. No silent extras: no extra features, libraries, settings or files.
- Never invent a number. Take it from `PLAN.md`. If the plan has none, propose one in your plan, get approval, and record it in `DECISIONS.md` §6.
- If something in the plan is wrong or impossible, say so directly and propose the smallest fix. Never work around it silently.
- Never tick a device check yourself. Only Daniella confirms what happens on her devices.
- **`.claude/` is off-limits.** Never create, edit, move or delete anything in `.claude/` unless Daniella explicitly asks for that specific change. Her approval of the kickoff's step 0 install was a one-time permission for that copy only, not a general permission. If you think something there should change, say so and wait.

## Engineering rules (PLAN §4.5)

1. **One event vocabulary:** `cursor:move`, `cursor:hide`, `pet:stroke`, `grab:start`, `grab:move`, `grab:end`, `wand:move`, `wand:end`, `trick:sitpretty`, `trick:highfive`, `trick:spin`. Touch, mouse and hands all emit these, and game logic never knows the input type. New names need approval.
2. **Time from timestamps only** (`clock.now()`); never count ticks.
3. **No URL changes after load:** no hash routing, no `pushState`, no `href="#"`; use buttons. On the iPad a hash change stops the camera.
4. **Only `src/storage.js` touches `localStorage`.** Keys start with `vpet.`; the save key is `vpet.save`.
5. **Pure modules** (`src/sim/*`, `src/input/handmath.js`, `src/input/gestures.js`, and the maths in `src/render/*`) use no DOM, timers, storage or `Date.now()`. Test them in `tests/*.test.js`.
6. **Pinned versions only.** No CDN links, no `@latest`, no runtime npm dependencies. Vendored files go in `vendor/`. Record every version in `DECISIONS.md` §4.
7. **Service worker:** cache names `vpet-<APP_VERSION>`, and delete only caches that start with `vpet-`. Until Phase 6, fetch network-first with `cache: 'no-cache'`. Every deploy bumps `APP_VERSION`.
8. **Relative paths only** (`./…`), everywhere. The app lives in a sub-folder on GitHub Pages.
9. **Every tunable number lives in `src/config.js`.**
10. **Camera:** the first start after each launch needs a tap. Stop when hidden, in the mini view, or switched off, and restart by itself on return if it was running. Never store or send images.
11. **Errors are visible:** errors and warnings also go to the on-screen error log (`src/ui/errorlog.js`), because the iPad has no console.

## Code style

- ES2022 modules with `.js` files and named exports, one module per file as listed in PLAN §4.4.
- No framework, no TypeScript, no bundler, no CSS framework.
- Use a canvas for the room and the cat, and HTML for menus and the HUD.
- Keep functions small. Comment the purpose where it isn't obvious, and point maths comments at the PLAN section.
- Accessibility: buttons at least 44 × 44 px, a visible focus outline, text contrast at least 4.5:1, nothing that relies on colour alone.

## Commands

- `npm test`: logic tests (Node's built-in runner, `node --test`).
- `npm run serve`: local server at http://localhost:3000. Daniella runs it in her own terminal; never start it in the foreground yourself.
- `/deploy`: tests, bumps the version, commits and pushes to GitHub Pages.
- On Windows, Claude Code usually runs commands in PowerShell, with Git Bash also available. Keep npm scripts shell-neutral (`node`, `npx`, forward slashes). In PowerShell use `curl.exe` (not `curl`) and `Get-FileHash` for SHA-256.

## Git

- Commit after each logical step with a clear message, such as "phase 1: needs decay and catch-up". Commits are local; nothing goes online until `/deploy` or `/finish-phase`.
- Finished phases get the tag `phase-N`.
- Before any command that discards or rewrites work (reset, restore, checkout of files, clean, rebase, branch deletion, `rm`), say in one sentence what it will do and get a yes. **Never force-push.**
- Explain each git step in one plain sentence.
- Never commit `art/source/` or anything personal. The repository is public.

## Working with Daniella

- Explain the why, not just the what.
- Keep follow-ups concise. Use short structured notes for important explanations.
- Correct her directly and honestly when something won't work, and say what would.
- For device steps, say exactly what to tap or click and what she should see.
- When blocked, ask one clear question at a time and offer a default.

## Skills

- `/start-phase N`: begin phase N in plan mode.
- `/deploy`: publish the current state for iPad testing.
- `/handoff`: save progress notes so the next session can continue.
- `/finish-phase N`: confirm the checks, log, commit, tag and push.

Sessions start in plan mode. If plan mode is on when `/deploy`, `/handoff` or `/finish-phase` runs, present its steps as the plan, wait for approval, then carry them out.
