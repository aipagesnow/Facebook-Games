# Facebook Games Studio

Local desktop app for building and shipping **Facebook Instant Games**.

- **Dashboard** — overview of pipeline packs + published library  
- **Info Packs** — upcoming games from your research pipeline folder  
- **Library** — games you’ve published / are tracking on developers.facebook  
- **FB Upload** — Instant Games technical + discovery checklist  
- **Settings** — point at your info-pack, library, and workspace folders  

Repo: [github.com/aipagesnow/Facebook-Games](https://github.com/aipagesnow/Facebook-Games)

Local folder: `C:\Users\chris\OneDrive\Desktop\Facebook-Games`

---

## Quick start

```bash
cd C:\Users\chris\OneDrive\Desktop\Facebook-Games
npm install
npm run dev
```

This starts Vite and opens the **Electron** window.  
Browser-only UI preview (no local folder scanning):

```bash
npm run dev:web
```

Production renderer build:

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
