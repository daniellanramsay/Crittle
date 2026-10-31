---
name: deploy
description: Publish the current state of My Virtual Pet to GitHub Pages for testing on the iPad and the installed laptop app. Only when Daniella types /deploy.
disable-model-invocation: true
---

Deploy My Virtual Pet to GitHub Pages.

If plan mode is on, present steps 1 to 6 as your plan, wait for approval, then carry them out.

1. Run `npm test`. If any test fails, stop, report it, and do not deploy.
2. Work out the new version:
   - Read `APP_VERSION` from `src/version.js`. The format is `0.N.x`.
   - N is the number of the latest `phase-*` tag plus 1, or 0 if there is no tag. Run `git tag --list "phase-*"` to check.
   - If the current version's N matches, raise x by one. If it does not, use `0.N.1`.
   - Write the new value to `src/version.js` and to line 1 of `sw.js` (`const APP_VERSION = '…';`).
   - Run `npm test` again; `tests/version.test.js` checks that the two match.
3. Run `git add -A`, then `git status --short`. Show Daniella the list of files. Check that nothing under `art/source/`, no `node_modules/`, and nothing personal is included. If something is wrong, stop and say what.
4. Commit with the message `deploy <version>: <one-line summary of what changed since the last deploy>`.
5. Push with `git push origin main`. Daniella approves the push prompt. If the push is rejected, explain why in plain words and stop. Never force-push.
6. Tell Daniella:
   - the version number, and that it shows in the corner of the app
   - the app's address (from `git remote get-url origin`: `https://<username>.github.io/<repository>/`)
   - to wait 1 to 2 minutes; on github.com the repository's Actions tab shows "pages build and deployment" with a green tick when it is live
   - if the iPad still shows the old version, to close the app fully (swipe up and hold, then swipe it away), open it again, and wait another minute if needed
   - which test script to run now: the iPad steps in the current phase brief
