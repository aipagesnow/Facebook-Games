# Session handoff — Facebook Games Studio

**Last updated:** 2026-08-08  
**Status:** Local + GitHub in sync on `main`  
**Repo:** https://github.com/aipagesnow/Facebook-Games  
**Local:** `C:\Users\chris\OneDrive\Desktop\Facebook-Games`

---

## Where we are

We have a working **local Electron app** (Facebook Games Studio) for managing Instant Games work: info packs from research, a library of published/tracked games, and Facebook upload guidance. The long-term goal is **~3 Instant Games per week** to developers.facebook, with Chris spending more time **testing** games than wrestling setup.

The **research → game info pack pipeline is not built yet**. Chris will start getting packs into `info-packs/`. Grok can help set up that pipeline when needed.

---

## How to open the app

- Double-click **Desktop:** `Facebook Games Studio`  
  or  
- `C:\Users\chris\OneDrive\Desktop\Facebook-Games\Launch Facebook Games Studio.bat`

First moments may show a console (“Preparing…”) while it rebuilds the UI, then the app window opens.

**Dev mode** (when editing the studio itself):

```powershell
cd C:\Users\chris\OneDrive\Desktop\Facebook-Games
npm run dev
```

---

## Intended end-to-end workflow

```
1. Qualified game info pack drops into:
   C:\Users\chris\OneDrive\Desktop\Facebook-Games\info-packs\<game-slug>\

2. Open Studio → Info Packs → open pack

3. Click "Copy Grok prompt" (tailored per pack: path + title + one-liner + build instructions)

4. Paste prompt into Grok chat

5. Grok builds unique Instant Game under games/<slug>/,
   aligns Facebook marketplace / upload info from pack docs,
   updates library / pack status so Dashboard reflects progress

6. Chris tests the game thoroughly

7. Upload to developers.facebook Instant Games market

8. Register / update Library (App ID, paths, notes)
```

**Bridge today:** Chris pastes the prompt into Grok (no in-app AI button yet). That is intentional and correct for now.

---

## Info packs folder

| Item | Detail |
|------|--------|
| **Default path** | `...\Facebook-Games\info-packs` |
| **Rule** | One subfolder per pack |
| **Required for `ready`** | See `docs/INFO-PACK-SPEC.md` |
| **Sample pack** | `info-packs/sample-word-streak/` (status `ready`) |
| **Settings** | Can repoint paths under Settings in the app |

Sample pack includes: `pack.json`, FILTER-DECISION, README, PILLARS, AUDIENCE, MONETIZATION, DISCOVERY, LIVEOPS, UPLOAD-CHECKLIST, and bare `skeleton/` (FBInstant lifecycle + share stub).

---

## App features already working

| Screen | What it does |
|--------|----------------|
| **Dashboard** | Counts + recent packs + library snapshot |
| **Info Packs** | Scans info-packs folder; open Explorer; copy path |
| **Pack detail** | Docs viewer, pillars, scores, skeleton list, **Copy Grok prompt** |
| **Library** | Add/track published games (App ID, pack path, workspace) |
| **FB Upload** | Instant Games technical + discovery checklist (Zero Permissions, load, assets) |
| **Settings** | info-packs path, library path, games workspace |

**Bug fixed this session:** blank black window on double-click — stale build used BrowserRouter on `file://`. Fixed with **HashRouter** + launcher always runs `npm run build` before open.

---

## Design decisions (locked for now)

Documented fully in `docs/DESIGN-JUDGMENT.md`:

1. **Pillars** for Instant Games: instant core loop, native social, retention, hybrid monetization, discovery + live ops, plus technical non-negotiables (sub-3s mindset, Zero Permissions, &lt;30s teach, context-aware).
2. **Filter:** multi-stage (hard gates → opportunity → execution), not pure weighted score alone.
3. **Pipeline shape when built:** **single long pass** (simpler/reliable), with strict fail-fast gates + drop mediocre packs — not multi-desk send-back yet.
4. **Skeleton level:** bare HTML/JS + FBInstant lifecycle + **one** social stub (not a full vertical slice), so games stay unique.
5. **Genres in focus:** trivia, word, simple puzzle, light sports — short-session, social, ad-friendly.

---

## Project layout (key paths)

```
Facebook-Games/
  Launch Facebook Games Studio.bat   ← double-click launch
  Create Desktop Shortcut.ps1
  electron/                          ← main + preload (filesystem IPC)
  src/                               ← React UI
  info-packs/                        ← incoming qualified packs
  games/                             ← built games (empty until first build)
  data/library/                      ← published game JSON records
  docs/
    DESIGN-JUDGMENT.md
    INFO-PACK-SPEC.md
    SESSION-HANDOFF.md               ← this file
  README.md
```

---

## Git state at handoff

| Item | Value |
|------|--------|
| Branch | `main` |
| Remote | `origin` → https://github.com/aipagesnow/Facebook-Games.git |
| Commits | `3db501f` initial scaffold · `04e264c` blank-window / launcher fix · *(plus this handoff commit)* |
| Working tree | Should be clean after handoff commit + push |

`node_modules/` and `dist/` are gitignored (rebuilt on launch).

---

## What is NOT done yet

- [ ] Research automation pipeline (daily research → scoring → pack drop)
- [ ] First real game built from a pack into `games/` via Grok (sample pack ready for this)
- [ ] In-app “mark in production” / auto-detect `games/<slug>` on dashboard
- [ ] Richer Grok prompt (genre, scores, inspiredBy, full doc summary)
- [ ] Packaged single `.exe` installer (optional; `.bat` launch works)
- [ ] Live Facebook upload automation (out of scope for now — manual upload after test)

---

## Suggested next session (tomorrow+)

1. Confirm app still opens via Desktop / `.bat`.
2. Either:
   - **A)** Paste sample pack Grok prompt and do **first full game build** end-to-end, or  
   - **B)** Start designing/implementing the **research → info pack pipeline**.
3. Keep improving studio for faster Facebook marketplace upload + better pack→game handoff.
4. Target operating rhythm: **3 games/week**, Chris heavy on testing.

---

## Quick reminders for Grok (next chat)

- Workspace / project path: `C:\Users\chris\OneDrive\Desktop\Facebook-Games`
- Read this file + `docs/DESIGN-JUDGMENT.md` + `docs/INFO-PACK-SPEC.md` if context is cold.
- When user pastes a pack prompt/path: read the pack folder, build under `games/`, update library/status, keep Instant Games + Zero Permissions constraints.
- User may ask for pipeline help later — prefer simple single-pass automation first.
