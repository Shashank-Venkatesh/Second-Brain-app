# Developer Setup Guide

This guide explains how to download, run, and test Second Brain on a Linux, Windows, or macOS laptop.

## Requirements

- Git
- Node.js 22 or newer
- npm
- A desktop environment supported by Electron
- A Google Cloud project with the Gmail API enabled for real Gmail testing

Check the installed tools:

```bash
node --version
npm --version
git --version
```

## Download the Project

### Option A: Download a ZIP

1. Open the project's repository page in your browser.
2. Select **Code**, then **Download ZIP**.
3. Extract the ZIP to a folder such as `Documents/Second-Brain-app`.
4. Open a terminal in the extracted `Second-Brain-app` folder.

The folder opened in the terminal must contain `package.json`, `src/`, and `electron/`.

### Option B: Clone with Git

Clone the repository and enter the project directory:

```bash
git clone <repository-url>
cd Second-Brain-app
```

Replace `<repository-url>` with the repository URL supplied by the project owner. For example:

```bash
git clone https://github.com/your-account/Second-Brain-app.git
cd Second-Brain-app
```

The ZIP and Git methods produce the same local project. Git is useful when you want to receive future updates with `git pull`.

## Install Dependencies

```bash
npm install
```

## Test the Browser Preview

Start the frontend development server:

```bash
npm run dev
```

Open the local URL shown in the terminal. The browser preview supports the onboarding and workspace UI. Native folder selection and live Gmail OAuth require Electron.

Stop the development server with `Ctrl+C`.

## Test the Desktop App

Set the Google OAuth credentials in the same terminal session used to launch Electron.

Linux and macOS:

```bash
export GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
export GOOGLE_CLIENT_SECRET="your-client-secret"
npm run desktop
```

Windows PowerShell:

```powershell
$env:GOOGLE_CLIENT_ID = "your-client-id.apps.googleusercontent.com"
$env:GOOGLE_CLIENT_SECRET = "your-client-secret"
npm run desktop
```

The app opens a browser window for Gmail authentication. After authentication:

1. Choose the local directory where the vault files should be saved.
2. Select the domain to import.
3. Start the domain import.
4. Confirm that only matching Markdown files appear in the selected directory.

Do not use personal Gmail credentials in an untrusted build. Use a dedicated test account where possible.

## Configure Gmail OAuth

In Google Cloud Console:

1. Create or select a project.
2. Enable the Gmail API.
3. Configure the OAuth consent screen.
4. Add the test Gmail account as a test user if the app is not published.
5. Create an OAuth client with the **Desktop app** application type.
6. Export the client ID and secret as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

The app requests the Gmail read-only scope. OAuth tokens are stored using Electron OS-backed encryption in the application user-data directory.

## Build and Lint

Run the checks before sharing a change:

```bash
npm run build
npm run lint
node --check electron/main.cjs
node --check electron/gmail-oauth.cjs
node --check electron/preload.cjs
```

## Create a Local Installer

```bash
npm run package
```

Build on the target operating system:

- Linux creates AppImage and deb artifacts.
- Windows creates an NSIS installer.
- macOS creates a DMG.

The installers are written to the `dist/` directory when packaging succeeds. Unsigned local builds may show platform security warnings.

## Current Test Scope

The current implementation verifies:

- Minimal onboarding UI.
- Gmail OAuth callback and state validation.
- Native folder selection.
- Domain-scoped Gmail search.
- Local Markdown export for matching messages.
- Renderer build and lint checks.

The current implementation does not yet provide full message-body extraction, attachment import, pagination beyond the first 25 matching messages, AI chat, or signed installers.

## Troubleshooting

### OAuth configuration error

Confirm both environment variables are set in the same terminal session used to run `npm run desktop`.

### Google redirects but the app does not connect

Confirm the Google OAuth client is a **Desktop app** client and that the Gmail API is enabled. Check that the local firewall permits loopback connections on `127.0.0.1`.

### No files are imported

Check that the selected domain appears in the message subject or searchable Gmail content. Confirm that a real directory was selected and that the account contains matching messages.

### The browser preview cannot select a native folder

Run `npm run desktop`. Native folder selection is intentionally available through Electron, not the browser renderer.

## Project Documentation

- [README.md](README.md) contains the short project overview.
- [PROJECT_PROGRESS.md](PROJECT_PROGRESS.md) is the living implementation log.
- This file explains how another developer can download and test the project locally.
