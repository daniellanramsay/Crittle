---
name: handoff
description: Save notes so a paused phase of My Virtual Pet can continue in a fresh session. Only when Daniella types /handoff.
disable-model-invocation: true
---

Write a handoff so the next session can continue this phase without losing anything.

If plan mode is on, present steps 1 to 4 as your plan, wait for approval, then carry them out.

1. Run `npm test` and note the result. Do not fix anything now.
2. Write `docs/HANDOFF.md`, replacing any earlier version, with these sections:
   - **Phase and date:** phase number, today's date, current `APP_VERSION`, latest commit (`git log --oneline -1`).
   - **Where we are:** two or three sentences.
   - **Done this session:** files created or changed, with one line each; tests added and whether they pass.
   - **Next step:** the exact next action, specific enough to start on without rereading the conversation.
   - **Remaining from the brief:** the build steps and "Done when" checks not yet finished.
   - **Decisions made this session:** each one, and confirm it is already in `DECISIONS.md`. If any are not, add them there now.
   - **Device results so far:** what Daniella has reported from the laptop and the iPad, with versions.
   - **Open questions and known problems:** each with what is known so far.
   - **Do not redo:** approaches already tried that failed, and why.
3. Commit with the message `phase <N>: handoff notes`. Do not push.
4. Tell Daniella the handoff is saved, and that the next session starts with `/start-phase <N>`, which reads the handoff first.
