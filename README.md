
  # Meeting Minutes Generator Tool

  This is a code bundle for Meeting Minutes Generator Tool. The original project is available at https://www.figma.com/design/C0Izo5vvxiAkQkNJznSMED/Meeting-Minutes-Generator-Tool.

  ## Prerequisites
 
  - Node.js 18+ and npm
  - macOS, Windows, or Linux (Electron supported platforms)
 
  ## Install
 
  - Run `npm i` to install all dependencies.
 
  ## Development
 
  The project uses Vite + React for the renderer and Electron for the desktop shell.
 
  - Run `npm run dev`
    - Starts the Vite dev server at `http://localhost:3000/`
    - Builds Electron `main` and `preload` with `vite-plugin-electron`
    - Launches the Electron app pointed at the Vite dev server
 
  - Output during dev
    - Renderer hot reload: immediate updates in the Electron window
    - Built Electron bundles written to `dist-electron/main/` and `dist-electron/preload/`
 
  - Useful scripts
    - `npm start`: Run Electron using the production build (after building)
 
  ## Production Build
 
  There are two steps: build assets, then package installers (optional).
 
  1) Build renderer and Electron bundles
     - Run `npm run build`
     - Outputs:
       - Renderer to `dist/`
       - Electron Main/Preload to `dist-electron/`
     - The app entry for Electron is `main: dist-electron/main/main.js`
 
  2) Package installers (optional, for distribution)
     - Run `npm run dist`
       - Uses `electron-builder` to create platform installers
       - Outputs into `release/`
 
  - Alternative: unpackaged app for quick testing
    - Run `npm run package` to create unpackaged artifacts in `release/`
 
  ## Running the Production Build Locally
 
  - After `npm run build`, run `npm start`
    - Electron will load files from `dist/` and `dist-electron/`
 
  ## API Configuration

The app uses a centralized API configuration system:

- **Global Config**: `src/config/api.ts` contains all API endpoints and base URL
- **Environment Variables**: Set `VITE_API_BASE_URL` in your `.env` file
- **Usage**: Import `buildApiUrl()` and `getApiEndpoint()` in any component

Example `.env` file:
```bash
# Development
VITE_API_BASE_URL=http://localhost:4000

# Production  
VITE_API_BASE_URL=https://api.yourcompany.com
```

## Configuration Overview
 
  - `vite.config.ts`
    - Adds `vite-plugin-electron` with entries:
      - `electron/main.ts` → output `dist-electron/main/main.js`
      - `electron/preload.ts` → output `dist-electron/preload/preload.js`
    - Renderer output: `dist/`
 
  - `package.json` scripts
    - `dev`: Vite dev server + Electron auto-build/launch
    - `build`: Builds renderer and Electron bundles
    - `start`: Runs Electron against the production build
    - `dist`: Builds platform installers via `electron-builder`
 
  - `electron-builder` targets
    - macOS: `dmg`, `zip` (category: Productivity)
    - Windows: `nsis`, `zip`
    - Linux: `AppImage`, `deb`
    - Output directory: `release/`
 
  ## Code Signing & Notarization (Optional)
 
  ### macOS (Signing + Notarization)
 
  - Requirements
    - Apple Developer account (Team ID)
    - Xcode Command Line Tools (`xcode-select --install`)
    - An Apple Developer ID Application certificate in your login keychain, or use env-based signing
 
  - Minimal env setup (auto identity from keychain)
    - `export CSC_IDENTITY_AUTO=true`
 
  - Env setup for Apple notarization (recommended)
    - `export APPLE_ID="your-apple-id@example.com"`
    - `export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"` (App-specific password)
    - `export APPLE_TEAM_ID="YOURTEAMID"`
 
  - Electron Builder config (already present)
    - Targets: `dmg`, `zip`
    - Output: `release/`
    - Electron Builder will sign during `npm run dist`. If `APPLE_ID` vars are present, it will also notarize.
 
  - Entitlements (optional)
    - For hardened runtime and granular permissions, add entitlement files and reference them via `mac.entitlements` and `mac.entitlementsInherit` in `package.json` build config.
 
  - Build
    - `npm run dist` → creates signed DMG/ZIP and notarizes if env vars are set.
 
  - Verify
    - `spctl -a -vv "release/YourApp.dmg"`
    - If notarized: `stapler validate "YourApp.app"` after mount/extract
 
  ### Windows (Code Signing)
 
  - Options
    - Standard code signing certificate (PFX/P12) → reduces SmartScreen warnings over time
    - EV certificate (recommended for immediate SmartScreen reputation)
 
  - Env-based signing with Electron Builder
    - `export CSC_LINK="file:///absolute/path/to/cert.p12"` (or HTTPS URL)
    - `export CSC_KEY_PASSWORD="your-cert-password"`
    - Optional timestamp server is handled by default; customize via `WIN_CSC_LINK` etc. if needed
 
  - Build
    - On Windows host (or CI Windows): `npm run dist` → produces signed `nsis` installer and `zip` in `release/`
 
  - Notes
    - Cross-signing Windows installers from macOS/Linux is supported but Windows-hosted signing is most reliable
    - For EV tokens, configure vendor tooling (e.g., SafeNet) and let Electron Builder call `signtool`
 
  ### Linux (Optional Signing)
 
  - AppImage: You can sign with `--appimage-sign` using `appimagetool`; Electron Builder does not sign AppImage by default
  - deb: Sign repository artifacts (apt) rather than the `.deb` itself in most workflows; for direct `.deb` signing, use `dpkg-sig`
  - rpm: Sign via `rpmsign` with your GPG key
 
  - Build
    - `npm run dist` on Linux → outputs `AppImage` and `deb` to `release/`
 
  ### CI Tips
 
  - Store secrets as CI variables and export them at build time:
    - macOS: `CSC_IDENTITY_AUTO`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`
    - Windows: `CSC_LINK`, `CSC_KEY_PASSWORD`
  - Ensure builds run on their respective OS for best reliability (macOS for `.dmg`, Windows for `.exe`/NSIS)
 
  ## Troubleshooting
 
  - App does not open during `npm run dev`
    - Ensure port `3000` is free and the Vite server starts successfully
    - Re-run `npm run dev` after closing any prior Electron instances
 
  - Black/blank window in production
    - Verify `dist/` and `dist-electron/` are present after `npm run build`
    - Confirm `package.json` has `"main": "dist-electron/main/main.js"`
 
  - Security: Exposed preload API is minimal by default
    - Add safe, explicit bridges in `electron/preload.ts` and consume via `window.electron`
  