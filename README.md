# Facebook Games Studio

Local desktop app for building and shipping **Facebook Instant Games**.

- **Dashboard** — overview of pipeline packs + published library  
- **Info Packs** — upcoming games from your research pipeline folder  
- **Library** — games you’ve published / are tracking on developers.facebook  
- **FB Upload** — Instant Games technical + discovery checklist  
- **Settings** — point at your info-pack, library, and workspace folders  

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

1. Research pipeline (future) drops a pack into `info-packs/` (or any folder you set).  
2. Open **Info Packs** → select a pack → **Copy pack path** or **Copy Grok prompt**.  
3. Paste into Grok to generate a unique Instant Game + market assets.  
4. Use **FB Upload** checklist when configuring developers.facebook.  
5. After launch, add the title under **Library** (App ID, paths, notes).

---

## Sample pack

`info-packs/sample-word-streak/` — full example including filter decision, pillars, monetization, discovery, live-ops, upload checklist, and a bare FBInstant skeleton.

---

## Design notes

- Pipeline / filter / skeleton recommendations: [`docs/DESIGN-JUDGMENT.md`](docs/DESIGN-JUDGMENT.md)  
- Pack folder contract: [`docs/INFO-PACK-SPEC.md`](docs/INFO-PACK-SPEC.md)  

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
