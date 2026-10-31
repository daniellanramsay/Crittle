# One-time setup

About 45 to 60 minutes, done once before Phase 0. Tick each step as you go.

## 1. Check what's already installed

Open PowerShell (Start, type "PowerShell", press Enter) and run these one at a time:

```powershell
git --version
node --version
npm --version
claude --version
```

- **git:** any 2.x version is fine.
- **node:** v22 or newer.
- **claude:** any version means Claude Code is installed.

Anything that says "is not recognized" needs installing (steps 2, 3 and 8).

- [ ] Versions checked

## 2. Install Git for Windows (if missing)

1. Download it from https://git-scm.com/download/win and run the installer.
2. Keep the default choices. They include Git Credential Manager, which handles signing in to GitHub, and Git Bash, which Claude Code can use alongside PowerShell.
3. Close PowerShell, open it again, and run `git --version`.

- [ ] git installed

## 3. Install Node.js LTS (if missing)

1. Download the LTS installer from https://nodejs.org and run it with the default choices.
2. Open a new PowerShell window and run `node --version`. It should show v22 or newer.

Why Node is needed: it runs the local test server (`npm run serve`), the logic tests (`npm test`) and the art tool in Phase 5. The app itself does not need it.

- [ ] Node.js installed

## 4. GitHub account and private email

1. Sign in, or create a free account, at https://github.com.
2. Go to Settings → Emails and tick **Keep my email addresses private**. Copy the address shown there; it ends in `@users.noreply.github.com`.
3. In PowerShell, run these two commands, using your own name and the address you copied:

```powershell
git config --global user.name "Daniella"
git config --global user.email "PASTE-THE-NOREPLY-ADDRESS-HERE"
```

Why: every commit records an email address, and this repository will be public. The noreply address keeps your real email out of it.

- [ ] git name and private email set

## 5. Create the empty repository

1. On github.com, click **+** (top right), then **New repository**.
2. Repository name: `Crittle` (`DECISIONS.md` §3). The name becomes part of the app's web address.
3. Choose **Public**.
4. Leave **Add a README**, **.gitignore** and **license** all off. The repository must start empty.
5. Click **Create repository**, then copy the HTTPS address shown, for example `https://github.com/YOUR-USERNAME/Crittle.git`. Claude Code asks for it in Phase 0.

Your app's web address will be `https://YOUR-USERNAME.github.io/Crittle/`.

Why public: GitHub Pages is free only for public repositories, so anyone can see what you commit. Your Krita files stay out because `art/source/` is git-ignored. You switch GitHub Pages on in Phase 0, after the first upload.

- [ ] Empty public repository created; HTTPS address saved

## 6. Laptop camera and browser

1. Open Windows Settings → Privacy & security → Camera. Switch on **Camera access**, **Let apps access your camera** and **Let desktop apps access your camera**. Edge counts as a desktop app.
2. Open the Camera app once to check the webcam works, then close it. Only one app can use the camera at a time.
3. Update Edge: in Edge, open Settings and more (…) → Help and feedback → About Microsoft Edge.

- [ ] Webcam works; Edge is up to date

## 7. iPad

1. Go to Settings → General → About and check the iPadOS version. iPadOS 26 is recommended, because sites added to the Home Screen then open as web apps by default. iPadOS 16.4 is the minimum this plan assumes (MediaPipe needs 16, and 16.4 improved Home Screen web apps).
2. Go to Settings → Apps → Safari → Camera and choose **Ask** or **Allow**, not **Deny**.
3. Expect the installed app to ask for camera permission each time it starts. That is normal for Home Screen web apps.

- [ ] iPad checked

## 8. Claude Code

1. If `claude --version` failed in step 1, install Claude Code by following the official instructions at https://code.claude.com/docs/en/overview.
2. In PowerShell, run `cd C:\Users\danie\MyVirtualPet`, then `claude`.
3. When asked whether you trust this folder, choose yes.
4. Type `/exit`.

**Using the Claude desktop app instead:** its Code tab runs Claude Code on this laptop, so opening this folder there counts, and `claude --version` in step 1 may then fail without harm. `docs/WORKFLOW.md` §3 lists how the app differs from the terminal.

You don't install anything into `.claude` yourself. The project's settings and its four commands wait in the `claude-setup` folder, and Claude Code copies them into `.claude` as step 0 of the kickoff prompt, after you approve. The kickoff then checks that plan mode and the commands work.

- [ ] Claude Code opens in this folder, and the folder is trusted

## 9. Decisions

Open `DECISIONS.md` §1 and read D1 to D9. Decide now or keep the defaults. You confirm them with Claude in the kickoff session.

- [ ] Decisions read

## 10. Art (optional now; needed by Phase 5)

Install Krita from https://krita.org if you don't have it, and read `docs/ART-GUIDE.md`. You can start drawing any time.

---

## Done

- [ ] git, node, npm and claude all show versions
- [ ] git name and private email set
- [ ] Empty public repository created; HTTPS address saved
- [ ] Webcam works; Edge updated
- [ ] iPad Safari camera not set to Deny
- [ ] Claude Code opens in this folder, and the folder is trusted

**Next:** open Claude Code in this folder and send the prompt in `KICKOFF-PROMPT.md`.
