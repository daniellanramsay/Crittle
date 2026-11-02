# Crittle
A hand-tracked virtual cat for a Windows laptop and an iPad. You pet it, feed it, play with it and teach it tricks with your hand in front of the camera. It installs as its own app, with its own taskbar icon on the laptop and Home Screen icon on the iPad.

**Status:** Phase 0 complete (1 November 2026): hand tracking runs in the installed app on the laptop and the iPad, including offline. Next: Phase 1.

---

## Start here

1. Read this page (5 minutes).
2. Do the one-time setup in [`docs/SETUP.md`](docs/SETUP.md) (about 45 minutes).
3. Read the nine decisions in [`DECISIONS.md`](DECISIONS.md) and decide, or keep the defaults.
4. Open Claude Code in this folder and send the prompt in [`KICKOFF-PROMPT.md`](KICKOFF-PROMPT.md).
5. From then on follow [`docs/WORKFLOW.md`](docs/WORKFLOW.md): one phase per session, tested on both devices.

## What's in this folder

| File | What it is | Mainly for |
| --- | --- | --- |
| `README.md` | This page | You |
| `KICKOFF-PROMPT.md` | The first message to send Claude, fully explained | You, then Claude |
| `CLAUDE.md` | Standing rules Claude Code loads in every session | Claude Code |
| `DECISIONS.md` | Live record: decisions, additions, plan changes, versions, tuned values, phase log | Both |
| `docs/PLAN.md` | The full v1 specification | Claude Code, and you for reference |
| `docs/WORKFLOW.md` | How each phase session runs: testing, deploying, fixing problems | You |
| `docs/SETUP.md` | One-time setup | You |
| `docs/ART-GUIDE.md` | How to draw the cat in Krita so the game can use it | You (by Phase 5) |
| `docs/phases/phase-0.md` … `phase-6.md` | A brief, test script and checklist for each phase | Claude Code, then you for testing |
| `.claude/settings.json` | Starts every Claude Code session in plan mode; always asks before pushing or discarding work | Claude Code |
| `.claude/skills/` | The `/start-phase`, `/deploy`, `/handoff` and `/finish-phase` commands | Claude Code |
| `claude-setup/` | Removed. It held the two `.claude` items above until step 0 of the kickoff installed them, with your approval, on 31 Oct 2026. | — |
| `art/source/` | Where your Krita files go; kept out of the public repository | You |
| `.gitignore`, `.gitattributes` | git housekeeping | git |

App code (`index.html`, `src/`, `vendor/` and the rest) arrives from Phase 0 onward.

## The seven phases

| Phase | Result |
| --- | --- |
| 0 | Prove the risky parts: hand tracking runs inside the installed app on both devices |
| 1 | The cat lives: needs, energy, sleep and saving, played by touch and mouse |
| 2 | Hands: petting, feeding and playing by hand |
| 3 | The rig and animations: a moving cut-out cat |
| 4 | Tricks: thumb taps, training and learning speeds |
| 5 | Looks and your art: the creator, breeds, patterns and your drawings |
| 6 | App shell and polish: name, icons, offline, mini view, pop-out window, tutorial, backup |

## Worth knowing before you start

- **The repository is public.** Free GitHub Pages needs a public repository, so the code, the plan and every committed file can be seen. Your Krita files stay out (`art/source/` is git-ignored), and commits use GitHub's private email.
- **The iPad asks for camera permission each time the app starts.** This is how iPadOS treats Home Screen web apps, which is why the camera starts from a button.
- **Deleting the app from the iPad Home Screen deletes its saved cat.** From Phase 6 on, export a backup first.
- **Renaming:** the folder can be renamed any time. Renaming the GitHub repository changes the app's web address, so do it before Phase 6 if you can (`docs/WORKFLOW.md` §13).
- **The online plan doc** matches this folder's plan except for the changes listed in `DECISIONS.md` §3. During the build, this folder is the source of truth.
