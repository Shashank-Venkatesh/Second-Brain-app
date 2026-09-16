# Linux Install & Test Guide — Second Brain

This is a step-by-step walkthrough for getting Second Brain running on a Linux machine and testing it two ways: as the **Electron desktop app** and as the **browser preview**. It expands on `DEVELOPER_SETUP.md` with exact commands, expected output, and fixes for the errors you're most likely to hit on Linux. Every command below was verified on a fresh Ubuntu-based environment before being written down.

---

## 1. Install prerequisites

### 1.1 System packages Electron needs

Electron apps rely on system libraries that aren't always present on a minimal Linux install (servers, WSL, containers, minimal desktop spins). Install them up front so the desktop app doesn't silently fail to open a window later:

**Debian / Ubuntu (apt):**
```bash
sudo apt update
sudo apt install -y \
  libnss3 libatk1.0-0 libatk-bridge2.0-0 libgtk-3-0 \
  libgbm1 libasound2 libxss1 libnotify4 \
  fuse libfuse2
```
`libfuse2` is specifically needed to run the packaged **AppImage** later — without it, double-clicking the AppImage does nothing.

**Fedora (dnf):**
```bash
sudo dnf install -y nss atk at-spi2-atk gtk3 mesa-libgbm alsa-lib libXScrgSaver libnotify fuse fuse-libs
```

**Arch (pacman):**
```bash
sudo pacman -S nss atk at-spi2-atk gtk3 mesa alsa-lib libxss libnotify fuse2
```

### 1.2 Node.js 22+, npm, and Git

Check what you already have:
```bash
node --version
npm --version
git --version
```

If Node is missing or older than 22, install it with `nvm` (works the same across all distros and avoids apt's often-outdated Node packages):
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc      # or ~/.zshrc if you use zsh
nvm install 22
nvm use 22
```

If Git is missing:
```bash
sudo apt install -y git      # Debian/Ubuntu
sudo dnf install -y git      # Fedora
sudo pacman -S git           # Arch
```

---

## 2. Get the project onto your machine

Pick one:

**Clone with Git** (recommended — lets you `git pull` later):
```bash
git clone <repository-url> Second-Brain-app
cd Second-Brain-app
```

**Or download and extract a ZIP:**
```bash
unzip Second-Brain-app.zip -d ~/Second-Brain-app
cd ~/Second-Brain-app
```

Confirm you're in the right place — the folder must contain `package.json`, `src/`, and `electron/`:
```bash
ls package.json src electron
```

---

## 3. Install dependencies

```bash
npm install
```

Expected result: a line like `added 426 packages` and `found 0 vulnerabilities`. You'll likely see a handful of harmless `npm warn deprecated` lines (from transitive packages like `rimraf`/`glob`) — these are safe to ignore.

---

## 4. Test the browser version

The browser preview is the fastest way to check the UI without touching Electron or Gmail credentials.

```bash
npm run dev
```

Expected output:
```
VITE vX.X.X  ready in ~150 ms
➜  Local:   http://localhost:5173/
```

Open `http://localhost:5173/` in your browser (Chrome, Firefox, etc.).

### What to check in the browser version
- The onboarding screen loads and shows the single "Connect Gmail" action.
- Layout responds correctly if you resize the window (this build includes responsive styling).
- Clicking the folder-selection control opens the browser's own directory picker (a fallback — see limitation below).
- Creating a custom domain via the interactive prompt works.

### Known browser-only limitations
- **No native folder picker** — the browser substitutes its own file/directory chooser, which behaves differently from the OS-native one in Electron.
- **No Gmail OAuth** — the loopback OAuth flow only runs inside Electron's main process. Clicking "Connect Gmail" in the browser will not complete authentication.
- **No filesystem writes** — nothing is actually saved to disk from the browser preview; it's UI-only.

Stop the server with `Ctrl+C` when done.

---

## 5. Test the desktop (Electron) app

This is the real end-to-end path: native folder picker, live Gmail OAuth, and actual file writes.

### 5.1 Get Google OAuth credentials
You need a Google Cloud project with the Gmail API enabled and a **Desktop app** OAuth client (see `README.md` → "Gmail OAuth Setup" for the console steps). You'll end up with a client ID and secret.

### 5.2 Launch

```bash
export GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
export GOOGLE_CLIENT_SECRET="your-client-secret"
npm run desktop
```

This runs `npm run build` (TypeScript check + Vite build) and then launches `electron .`. Expect a normal Electron window to open showing the same onboarding screen as the browser preview.

### 5.3 What to check in the desktop app
1. Click "Connect Gmail" — your system's default browser opens for the Google sign-in/consent screen.
2. After granting access, the browser redirects to a local `127.0.0.1` callback and the app window shows a connected state.
3. Choose a local folder using the **native** OS folder picker (this should look like your desktop environment's normal file dialog, not a browser dialog).
4. Select or create a domain (e.g., "Finance", "Travel") to scope the import.
5. Start the import and watch the progress indicator.
6. Once it finishes, open the folder you chose in a file manager or terminal and confirm `.md` files appeared — only for messages matching your domain, capped at 25 messages:
   ```bash
   ls ~/path/you/chose
   cat ~/path/you/chose/some-message.md
   ```
7. Run the import a second time and confirm no duplicate files are created (import is idempotent by message ID).

### 5.4 Root / container / CI environments
If you're testing inside a container or as the `root` user, Electron's sandbox will refuse to start with:
```
Running as root without --no-sandbox is not supported.
```
This is expected — Chromium's sandbox blocks root by design. On a normal desktop Linux user account this never comes up. If you must test as root, run:
```bash
./node_modules/.bin/electron . --no-sandbox
```
Only do this in a disposable/test environment, not on your everyday machine.

---

## 6. Build and lint checks

Run these before considering a change "done" — they mirror what's listed in `PROJECT_PROGRESS.md`'s update log:

```bash
npm run build
npm run lint
node --check electron/main.cjs
node --check electron/preload.cjs
node --check electron/gmail-oauth.cjs
```

All five should complete with no errors and no output beyond the build summary.

---

## 7. Package a Linux installer (optional)

```bash
npm run package
```

This produces an **AppImage** and a **.deb** file under `dist/`. To test the AppImage:
```bash
cd dist
chmod +x *.AppImage
./Second-Brain-*.AppImage
```
If nothing happens when you run it, it's almost always the missing `libfuse2`/`fuse` package from step 1.1.

To test the `.deb`:
```bash
sudo dpkg -i dist/*.deb
```

Unsigned local builds will show an "unverified developer" style warning on first launch — that's expected for local/dev builds and isn't a bug.

---

## 8. Quick troubleshooting reference

| Symptom | Likely cause | Fix |
|---|---|---|
| `OAuth configuration error` | Env vars not set in the same shell session | Re-export `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`, then re-run `npm run desktop` in that same terminal |
| Google redirects but app never connects | Wrong OAuth client type, or firewall blocking loopback | Confirm the client is type **Desktop app**; allow local connections to `127.0.0.1` |
| No files imported after a successful run | Domain doesn't match any subject/content, or wrong folder selected | Pick a domain keyword you know appears in real emails; re-confirm the folder path |
| Browser preview can't pick a real folder | Expected — native picker is Electron-only | Use `npm run desktop` for real folder selection |
| AppImage does nothing when double-clicked | Missing `libfuse2`/`fuse` | Install it (step 1.1), then retry |
| Electron exits immediately with a sandbox error | Running as `root` (container/CI) | Add `--no-sandbox` for testing only, per section 5.4 |
| `npm install` warns about deprecated packages | Transitive dependencies (`rimraf`, `glob`, etc.) | Safe to ignore — not a functional issue |

---

## Related project docs
- `README.md` — project overview and Gmail OAuth setup.
- `PROJECT_PROGRESS.md` — living implementation log, current status, and known limitations.
- `DEVELOPER_SETUP.md` — original cross-platform (Linux/Windows/macOS) setup guide this document expands on for Linux.
