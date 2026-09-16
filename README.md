# Second Brain

Second Brain is a local-first desktop application for turning selected Gmail knowledge into an AI-ready personal vault. The application is being prepared for Linux, Windows, and macOS.

## Development

```bash
npm install
npm run dev
```

Build and lint the renderer:

```bash
npm run build
npm run lint
```

Launch Electron locally with Gmail OAuth configured:

```bash
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com" \\
GOOGLE_CLIENT_SECRET="your-client-secret" \\
npm run desktop
```

Create installers with `npm run package`. Build each platform's artifact on that platform.

## Gmail OAuth Setup

1. Create a Google Cloud project and enable the Gmail API.
2. Configure the OAuth consent screen and add the test account when needed.
3. Create an OAuth client for a **Desktop app**.
4. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` before launching Electron.

The app requests only the Gmail read-only scope. Authentication opens in the system browser, returns through a loopback callback on `127.0.0.1`, verifies a cryptographic state value, and stores the returned token using Electron's OS-backed encryption. No Gmail data is retrieved yet.

See [PROJECT_PROGRESS.md](PROJECT_PROGRESS.md) for the living implementation log, decisions, limitations, and next milestones.

For laptop download and testing instructions, see [DEVELOPER_SETUP.md](DEVELOPER_SETUP.md).
