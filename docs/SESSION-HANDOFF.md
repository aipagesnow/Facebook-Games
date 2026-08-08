# Session handoff — Facebook Games Studio + Word Streak Duels

**Last updated:** 2026-08-08 (break / lock-in)  
**Status:** Studio improved + first Instant Game playable on Facebook (tester). Local + GitHub should match after this handoff push.  
**Repo:** https://github.com/aipagesnow/Facebook-Games  
**Local:** `C:\Users\chris\OneDrive\Desktop\Facebook-Games`

---

## Resume checklist (next session)

1. Open project folder above (or pull `main` from GitHub).  
2. Launch studio: double-click `Launch Facebook Games Studio.bat` or Desktop shortcut.  
3. Game source: `games/word-streak-duels/`  
4. Upload zip: `games/game.zip` (also Desktop `game.zip` after rebuild)  
5. Facebook app: **Word Streak Duels** — App ID **`1593839865675820`**  
6. Meta: Web hosting → latest zip → **Push to Production** if code changed since last upload.  
7. Play: `https://www.facebook.com/gaming/play/1593839865675820/`  
8. Testers: **App roles → Roles → Testers** (not “Test users”). They accept at https://developers.facebook.com/requests/ then use the short play link. No developer account required for testers.

---

## Where we are

### Facebook Games Studio (Electron app)

Working local studio for Instant Games workflow:

| Area | Status |
|------|--------|
| Dashboard / Packs / Library / Settings | Working |
| **Auto-refresh** (focus + ~12s poll + sidebar Refresh) | Working |
| **FB Upload** page | Library + packs + `games/` merged via `upload:listTargets` |
| Pack detail → **Open FB Upload** | Deep-link `?game=` / `?pack=` |
| Library **Edit details (App ID)** | Working |
| Copy fields + **Copy ALL FB fields** | Working |
| Meta **use-case guide** (Instant Game only at create) | Working |
| **Open folder with game.zip** (Explorer `/select`) | Working |
| Version comment + zip path copy | Working |

**Stack:** Electron + React + Vite + TypeScript.

### Word Streak Duels (first game)

Built from `info-packs/sample-word-streak/` → `games/word-streak-duels/`.

| Feature | Notes |
|---------|--------|
| Core loop | 60s word ladder; need gold last-letter |
| Dictionary | ~315k words (`words.js`) + core guarantees |
| **Names** | `names.js` ~1k first names playable; **Names week** seed theme |
| Daily seed | UTC day → theme + seed from large themed pools (auto-changes) |
| Daily / Friends tabs | Separate panels; friends = private ranks + invite |
| Leaderboards | FBInstant `getLeaderboardAsync` daily + friends boards (API) |
| Challenge / invite | `shareAsync` with seed + target score |
| Custom keyboard | On-screen QWERTY + large **GO** under keys (no hints) |
| Music | Menu = chilled ambient; Play = brighter loop; mute persists |
| SFX | Word ok/bad, keys, start/end, timer |
| FBInstant CDN | `fbinstant.6.3.js` required for hosting upload |
| Upload bundle | `games/game.zip` (~0.9 MB) |

**Pack status:** `info-packs/sample-word-streak/pack.json` → `in-production`.

**Library (local only — gitignored):**  
`data/library/word-streak-duels.json` holds App ID, paths, `fbListing`. Re-create in Library UI if missing after clone.

---

## Key paths

```
Facebook-Games/
  Launch Facebook Games Studio.bat
  electron/                 main + preload (IPC, upload targets, Explorer open)
  src/                      Studio UI
  info-packs/sample-word-streak/
  games/word-streak-duels/  ← game source
    index.html, styles.css, game.js, audio.js, words.js, names.js, fbapp-config.json
  games/game.zip            ← Meta Web hosting upload
  docs/
    SESSION-HANDOFF.md      ← this file
    DESIGN-JUDGMENT.md
    INFO-PACK-SPEC.md
  data/library/             local JSON (gitignored)
```

### Meta Instant Games upload (remember)

1. Web hosting → **Upload Version** → drag `game.zip` (not Debug Mode).  
2. Version comment (copy from studio FB Upload).  
3. **Push to Production** or Play fails with “no production version”.  
4. SDK CDN must be in `index.html` or Meta rejects zip.

### App creation notes (locked)

- Use case: **only** “Launch an Instant Game…” (Audience Network greys out — OK).  
- Business portfolio: can skip for now.  
- Contact email: not shown to players.  
- Testers: **Roles**, not **Test users** (fake accounts).

---

## What is NOT done yet

- [ ] Research → info pack automation pipeline  
- [ ] Discovery assets (1024 icon, 1600×300 cover) generated/uploaded  
- [ ] Real rewarded ads (Audience Network wiring; freeze still stub)  
- [ ] Full public Publish / App Review / business verification if required  
- [ ] Music polish beyond procedural Web Audio (optional)  
- [ ] Confirm friends leaderboard with real second player  
- [ ] Packaged `.exe` installer (optional; `.bat` works)

---

## Suggested next session

1. Confirm latest `game.zip` is on **Production** and mobile play feels right (keyboard, GO, menu music).  
2. One full **challenge** test with a tester.  
3. Optional: store art from `DISCOVERY.md` / studio copy fields.  
4. Or start **game #2** from a new info pack / research pipeline.  
5. Target rhythm: **~3 Instant Games/week**, Chris heavy on testing.

---

## Git notes

- Branch: `main`  
- Remote: `origin` → https://github.com/aipagesnow/Facebook-Games.git  
- `node_modules/`, `dist/`, `data/library/*.json` are gitignored.  
- After clone: `npm install`, then launch `.bat` (builds UI).  
- Rebuild game zip after game edits (or ask Grok): zip contents of `games/word-streak-duels` essentials into `games/game.zip`.

### Quick rebuild game zip (PowerShell idea)

From `games/word-streak-duels`, zip:  
`index.html`, `styles.css`, `game.js`, `audio.js`, `words.js`, `names.js`, `fbapp-config.json`  
→ `../game.zip`

---

## Quick reminders for Grok (cold start)

- Project path: `C:\Users\chris\OneDrive\Desktop\Facebook-Games`  
- Read this file + pack docs when context is cold.  
- Instant Games constraints: Zero Permissions, sub-3s mindset, FBInstant lifecycle, CDN SDK.  
- Do not use App roles **Test users** for real people — use **Roles → Testers**.  
- Prefer small, shippable updates; re-upload zip + Production after game changes.
