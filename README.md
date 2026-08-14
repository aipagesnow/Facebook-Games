# Games Studio

Local desktop app for building and shipping **Facebook Instant Games** and **Android games / apps** on Google Play.

Use the **Facebook / Android** switch in the sidebar to flip the whole studio: dashboard, info packs, library, and store upload.

**Plan next** (per platform) builds a prompt from your catalog. Copy it, paste into Grok Build on this project, and Grok does the research and writes the pack. No API key.

## Facebook side

- **Dashboard** — overview of pipeline packs + published library  
- **Plan next** — live Instant Games market research → writes one new info pack  
- **Info Packs** — upcoming Instant Games from your research pipeline folder  
- **Library** — games you’ve published / are tracking on developers.facebook  
- **Ship board** — per-title Live / Production checklist  
- **FB Upload** — Instant Games technical + discovery checklist  
- **Settings** — Facebook + Android folder paths  

## Android side

- **Dashboard** — Android packs + Play library (games and apps)  
- **Plan next** — live Play market research for a **game or app** → writes one new info pack  
- **Info Packs** — upcoming Android titles (`kind: game` or `kind: app`)  
- **Library** — package names, Play Console IDs, workspaces  
- **Ship board** — per-title Play Console launch checklist  
- **Play Console** — copy-ready listing, AAB path, store graphics, Data safety / IARC  
- Same Settings page (Android folders are a separate group)  

Default Android folders:

- `android-packs/` — info packs  
- `data/android-library/` — library JSON (gitignored)  
- `android-apps/<slug>/` — Capacitor / native workspace + `android-listing.json` + `app-release.aab`  

---

## Quick start (double-click)

**Easiest:** double-click  
`Launch Facebook Games Studio.bat`  
in this folder.

Optional Desktop icon (run once in PowerShell from this folder):

```powershell
powershell -ExecutionPolicy Bypass -File ".\Create Desktop Shortcut.ps1"
```

Then double-click **Facebook Games Studio** on your Desktop.

First launch may take a minute (install + build). After that it opens quickly.

### Dev mode (hot reload while editing the studio)

```bash
cd path/to/Facebook-Games
npm install
npm run dev
```

Browser-only UI preview (no local folder scanning):

```bash
npm run dev:web
```

Production build + start from terminal:

```bash
npm run build
npm start
```

---

## Typical workflow

1. **Plan next game** (Facebook side) — live market research writes a pack into `info-packs/`.  
2. Open **Info Packs** → select a pack → **Copy pack path** or **Copy Grok prompt**.  
3. Paste into Grok to generate a unique Instant Game + market assets.  
4. Use **FB Upload** checklist when configuring developers.facebook.  
5. After launch, add the title under **Library** (App ID, paths, notes).

### Android / Play

1. **Plan next app/game** (Android side) — live Play research writes a pack into `android-packs/` (`kind: game` or `kind: app`).  
2. Open **Android → Info Packs** → copy path / Grok prompt.  
3. Scaffold under `android-apps/<slug>/` with `android-listing.json` + Play `store-assets/`.  
4. Use **Play Console** to copy listing text, check graphics, and open the AAB folder.  
5. Upload the signed AAB to Internal testing first, then Production. Save the package name in Library.

---

## Sample pack

- `info-packs/sample-word-streak/` — Instant Game example (filter, pillars, FBInstant skeleton).  
- `android-packs/sample-word-streak-android/` — same title as a **Play game** (Capacitor wrap + Play checklist).  
- `android-packs/sample-focus-pulse/` — example **Android app** (utility, not a game).

---

## Design notes

- Pipeline / filter / skeleton recommendations: [`docs/DESIGN-JUDGMENT.md`](docs/DESIGN-JUDGMENT.md)  
- Pack folder contract: [`docs/INFO-PACK-SPEC.md`](docs/INFO-PACK-SPEC.md)  
- Android pack + Play workspace contract: [`docs/ANDROID-PACK-SPEC.md`](docs/ANDROID-PACK-SPEC.md)  

### Genre DNA this studio is built around

High-MAU Instant Games patterns: **trivia, word, simple puzzle, light sports** — with non-negotiables:

- Sub-3s load mindset  
- Zero Permissions  
- &lt;30s teachable loop  
- Native social / viral loops  
- Hybrid monetization (rewarded + light IAP)  
- Discovery assets + live ops  

---

## Stack

- Electron (local filesystem, folder pickers)  
- React + Vite + TypeScript  
- No cloud required for core dashboard  

---

## Git

```bash
git add .
git commit -m "Initial Facebook Games Studio scaffold"
git push -u origin main
```

If `gh` is not authenticated, use GitHub Desktop or `git push` with your usual credentials.
