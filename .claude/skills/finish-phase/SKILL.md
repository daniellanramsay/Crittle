---
name: finish-phase
description: Close a finished build phase of My Virtual Pet. Confirm every check with Daniella, update the logs, commit, tag and push. Only when Daniella types /finish-phase followed by a phase number.
argument-hint: "[phase number 0-6]"
disable-model-invocation: true
---

Finish Phase $ARGUMENTS of My Virtual Pet.

If plan mode is on, present these steps as your plan, wait for approval, then carry them out.

1. If "$ARGUMENTS" is not a single number from 0 to 6, ask which phase, and stop.
2. Run `npm test`. Every test must pass. If any fails, stop: the phase is not finished.
3. Open `docs/phases/phase-$ARGUMENTS.md` and go through its "Done when" checks one at a time:
   - For checks proved by tests or files, show the evidence in one line: the test name, file or command output.
   - For checks that happen on a device, ask Daniella to confirm each one: yes, no, or a note. Never mark a device check done yourself.
   - If any check is not confirmed, stop. List what is missing and propose the next steps. The phase stays open.
4. When every check is confirmed:
   - For Phase 6 only, do this first: set `APP_VERSION` to `1.0.0` in `src/version.js` and line 1 of `sw.js`, and run `npm test` again, so everything recorded below shows 1.0.0.
   - In the brief, tick every check (`- [x]`) and set the Status line to `Status: Done <date>, tag phase-$ARGUMENTS, version <APP_VERSION>`.
   - In `DECISIONS.md`, fill this phase's row in the phase log (§7). Make sure every pinned version (§4), tuned value (§5), chosen number (§6), addition (§2) and plan change (§3) from this phase is recorded.
   - Delete `docs/HANDOFF.md` if it exists, using `git rm` (Daniella approves).
   - In `README.md`, update the status line near the top so it names the phase just finished and the next one.
5. Commit with the message `phase $ARGUMENTS complete`. Create an annotated tag with `git tag -a phase-$ARGUMENTS -m "Phase $ARGUMENTS complete"`. Push with `git push origin main --follow-tags`; Daniella approves. Never force-push.
6. Summarise in a few lines: what this phase delivered, anything carried forward, and what the next phase needs from Daniella (its "Before this session" list). Remind her to start the next phase in a fresh session.
