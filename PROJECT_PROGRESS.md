# Second Brain App Progress

This is the living project log for the Second Brain desktop application. Update this file in the same change whenever project work is completed, a decision changes, or a blocker is discovered.

## Product Goal

Build a downloadable desktop application for Linux, Windows, and macOS that:

- Authenticates securely with the user's Gmail account.
- Lets the user choose a domain or topic of interest.
- Collects only mail-related data relevant to that selected domain.
- Stores the collected data in a directory selected by the user.
- Makes the local data available as context for future AI chat.
- Keeps the user in control of authentication, data scope, local storage, and deletion.

## Current Status

**Phase:** Domain-scoped Gmail import

**Overall:** The app now opens with a minimal, single-action onboarding flow, requires a local folder after Gmail connection, and imports only messages matching the selected domain. AI chat ingestion is not connected yet.

## Completed

- Created a React 19 + TypeScript + Vite application.
- Added a responsive local-first dashboard experience.
- Added initial product flows for:
  - Selecting a knowledge domain.
  - Starting Gmail connection.
  - Choosing a local storage directory.
  - Viewing indexed-mail status.
- Added Electron and electron-builder development dependencies for cross-platform packaging.
- Confirmed the Vite production build passes with `npm run build`.
- Added an Electron main process and sandboxed preload bridge.
- Added `desktop` and `package` scripts for local launch and installer builds.
- Added electron-builder targets for AppImage/deb, NSIS, and DMG.
- Connected the vault folder controls to a native directory picker through a typed IPC method.
- Added Gmail OAuth using a loopback callback and the `gmail.readonly` scope.
- Added OAuth state verification and OS-backed encrypted token storage.
- Simplified onboarding to one primary Gmail action with short privacy cues.
- Deferred domain choice until after connection and made folder selection optional.
- Added responsive onboarding and workspace styling for desktop and mobile.
- Added domain-scoped Gmail search with a 25-message limit.
- Added local Markdown export for matching messages only.
- Required an explicit folder choice before import and added import progress feedback.
- Added a developer handoff guide for downloading, configuring, testing, and packaging the app on Linux, Windows, and macOS.
- Corrected visible product branding to Second Brain.
- Fixed browser-preview click behavior for folder selection and custom domain creation.
- Corrected the browser fallback to open a directory chooser rather than a file chooser.
- Expanded the developer guide with ZIP download, Git clone, local folder verification, and installer output instructions.

## In Progress

- Improve the desktop shell's filesystem write and authentication workflows.
- Define typed IPC contracts for the renderer's future main-process operations.
- Verify Gmail OAuth with a configured Google Cloud desktop client.
- Add Gmail message pagination, richer message-body extraction, and attachment policy.

## Planned Work

### Desktop Application

- Add Electron main and preload processes.
- Load the Vite renderer in development and packaged builds.
- Add packaging targets for Linux, Windows, and macOS.
- Expose only narrowly scoped, typed IPC methods to the renderer.

### Gmail Integration

- Implement OAuth 2.0 using the system browser and a local callback flow.
- Store tokens securely using the operating system credential store.
- Request the smallest practical Gmail scopes.
- Let the user define, preview, and confirm the search scope before retrieval.
- Support cancellation, progress, retry, and disconnect/revoke actions.
- Never send mail content to a remote service without explicit user consent.

### Local Data

- Let the user select and confirm an export directory.
- Store normalized mail metadata and content in a documented local format.
- Include an index manifest with source, timestamp, domain, and sync status.
- Handle duplicates, incremental sync, failed messages, and deletion.
- Make the local data portable and easy for the user to inspect or remove.

### AI Chat

- Add a local index/retrieval layer over the exported data.
- Show which local sources support each answer.
- Add model-provider configuration and an explicit privacy warning before remote AI use.
- Support local models where practical.

### Quality and Release

- Add unit tests for domain filtering, normalization, deduplication, and sync recovery.
- Add end-to-end tests for OAuth states, directory selection, cancellation, and packaging smoke tests.
- Add a privacy and threat model review before real Gmail data is enabled.
- Update user documentation with setup, permissions, storage, deletion, and troubleshooting.
- Produce signed installers and release notes for all supported desktop platforms.

## Technical Decisions

| Decision | Rationale |
| --- | --- |
| React + TypeScript + Vite | Fast UI development with a small, typed frontend foundation. |
| Electron | Provides one desktop runtime and packaging path for Linux, Windows, and macOS. |
| Local-first storage | The user's mail-derived knowledge remains under the user's directory control. |
| Main/preload/renderer separation | Keeps OAuth, filesystem access, and secrets out of the renderer. |
| Narrow Gmail scopes | Reduces privacy and security exposure. |
| Progressive onboarding | Ask for one decision at a time so first-run setup stays short and understandable. |

## Known Limitations

- Gmail OAuth requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from a configured Google Cloud project.
- Gmail import requires configured OAuth credentials and a live authenticated account.
- The first import is capped at 25 matching messages and currently stores message snippets, not full bodies or attachments.
- Existing files are not overwritten, so repeated imports are currently idempotent by message ID.
- No AI provider or local retrieval engine is connected yet.
- Installer artifacts have not been built or signed yet.

## Update Log

### 2026-09-16

- Added this living progress log.
- Recorded the current React/Vite foundation and Electron packaging preparation.
- Documented the planned Gmail, local storage, AI, testing, privacy, and release work.
- Added `electron/main.cjs` and `electron/preload.cjs` with context isolation, disabled Node integration, and sandboxing.
- Added cross-platform electron-builder configuration and verified `npm run build` passes.
- Added the native folder picker IPC path and verified the renderer build passes again.
- Added the Gmail OAuth main-process flow, typed renderer bridge, setup documentation, and verified `npm run build` and `npm run lint` pass.
- Reworked first-run onboarding into a single-action welcome screen, deferred advanced choices, added responsive styling, and verified `npm run build` and `npm run lint` pass.
- Added domain-filtered Gmail retrieval, local Markdown export, required folder selection, import status feedback, and verified `npm run build` and `npm run lint` pass.
- Added `DEVELOPER_SETUP.md`, linked it from the README, and documented laptop testing prerequisites and platform commands.
- Updated the renderer branding and HTML title to Second Brain; verified build, lint, and whitespace checks pass.
- Added a browser directory-picker fallback and interactive custom-domain prompt; verified `npm run build` and `npm run lint` pass.
- Verified the corrected directory chooser with another successful build and lint run.
- Documented both local download methods and clarified that current testing uses source builds rather than published installers.

## Update Rules

When making project changes:

1. Update **Current Status** and the relevant phase section.
2. Add a dated entry to **Update Log** describing what changed and what was verified.
3. Record new architectural choices in **Technical Decisions**.
4. Move finished items from **In Progress** or **Planned Work** into **Completed**.
5. Record blockers and security/privacy concerns under **Known Limitations** until resolved.
6. Keep entries factual and concise; link to important repository files when those files exist.
