---
name: start-phase
description: Begin a build phase of My Virtual Pet in plan mode. Only when Daniella types /start-phase followed by a phase number.
argument-hint: "[phase number 0-6]"
disable-model-invocation: true
---

Start Phase $ARGUMENTS of My Virtual Pet.

1. If "$ARGUMENTS" is not a single number from 0 to 6, ask which phase to start, and stop.
2. Check that you are in plan mode. If you are not, ask Daniella to press Shift+Tab until the status bar shows "plan mode on", and wait.
3. Read, in this order:
   - `DECISIONS.md` (all of it)
   - `docs/HANDOFF.md`, if it exists (a paused phase; continue from it rather than starting over)
   - `docs/phases/phase-$ARGUMENTS.md`
   - every `docs/PLAN.md` section the brief lists under "Read before planning"
4. Check the project state and report it in two or three lines:
   - `git status --short`, `git log --oneline -5` and `git tag`
   - For phases 1 to 6, the tag for the previous phase must exist. If it does not, say which phase is unfinished, and stop.
   - Mention any uncommitted changes and ask what to do with them before planning.
5. Go through the brief's "Before this session" list. Ask Daniella about anything you cannot check yourself, such as a decision in `DECISIONS.md` that is not yet confirmed but is needed by this phase.
6. Present the plan with these headings:
   - **Goal:** one sentence.
   - **Files:** every file you will create or change, with one line each on why.
   - **Order of work:** numbered steps, matching the brief's build list.
   - **Tests:** each test file and what it proves.
   - **How each "Done when" check will be met:** one line per check.
   - **Numbers the plan does not give:** your proposals, for approval. They are recorded in `DECISIONS.md` §6.
   - **Additions:** anything outside the brief, each with its reason, or "None".
   - **Problems found:** anything in the plan that is unclear, contradictory or will not work, each with the smallest fix, or "None".
   - **Questions:** numbered, each with a suggested default.
7. Stop and wait for approval. Do not change any file in this step.

After approval, build exactly the approved plan. Run `npm test` after each module, commit after each logical step, and when the build is done, give Daniella the brief's laptop test script.
