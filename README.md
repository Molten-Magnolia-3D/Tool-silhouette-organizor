# Pocketplate

Windows desktop studio for **Molten Magnolia 3D**. Photograph a tool on paper, trace its silhouette, arrange pockets on a plate, and export a binary STL you can slice.

This repository is the GitHub home for the installed Windows app. Every push to `main` publishes a new GitHub Release. The Setup installer checks that release after launch, every five minutes, and when the window is focused, then downloads in the background.

## Install

Download **[Pocketplate-Setup.exe](https://github.com/Molten-Magnolia-3D/Tool-silhouette-organizor/releases/latest/download/Pocketplate-Setup.exe)** from the latest release.

Windows SmartScreen may warn because the build is unsigned. Choose **More info** → **Run anyway**.

## Shop workflow

1. Load the sample drawer or **Open photo and trace**.
2. Drag pockets, rotate the selected tool, set plate size / depth / clearance.
3. Switch to **Print preview**, then **Export STL**.
4. Slice flat on the bed. No supports.

## Develop

```bash
npm install
npm test
npm run dev
```

Electron shell:

```bash
npm run dev:electron
```

Windows installer (on a Windows runner or machine):

```bash
npm run build:win
```

`.github/workflows/windows.yml` stamps a unique semver from `GITHUB_RUN_NUMBER`, builds the NSIS installer, and uploads `Pocketplate-Setup-*.exe`, `latest.yml`, and the blockmap so `electron-updater` can download the next shop build.
