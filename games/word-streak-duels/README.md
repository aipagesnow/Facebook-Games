# Word Streak Duels

Facebook Instant Game built from info pack `sample-word-streak`.

**One-liner:** Daily word ladders vs friends — beat their streak, share your best chain, back tomorrow for the next ladder.

## Play locally

Open `index.html` in a browser (double-click or any static server).  
`FBInstant` is mocked for local preview. Challenge entry can be simulated:

```
index.html?seed=CRANE&target=50
```

Optional static server from this folder:

```powershell
npx --yes serve .
```

## Core rules

1. Start from the seed word (daily or challenge).
2. 60 seconds on the clock.
3. Each new word must **start with the last letter** of the previous word.
4. Words must be in the bundled dictionary, min 3 letters, no repeats.
5. Score = `word length × 10` + small speed bonus.

## Pack alignment

| Pillar | Implementation |
|--------|----------------|
| Instant loop | Home → play in one tap; gold “need letter” teaches the rule |
| Social | End screen **Challenge a friend** → `shareAsync` with seed + target |
| Retention | Daily seed + theme rotation + streak + freeze reward |
| Monetization | Free daily hint; extra hints / streak freeze via rewarded ad stubs |
| Discovery | Bold letter-tile UI; portrait Instant layout |
| Technical | `initializeAsync` → progress → `startGameAsync`; Zero Permissions; mock SDK offline |

## Upload (developers.facebook)

1. Create Instant Games app product.
2. Upload this folder as the web host / bundle (or zip contents).
3. Include `fbapp-config.json`.
4. Use discovery art from pack `DISCOVERY.md` (icon 1024, cover 1600×300).
5. Confirm Zero Permissions / SDK readiness.
6. Run through pack `UPLOAD-CHECKLIST.md`.

## Files

| File | Role |
|------|------|
| `index.html` | Shell + screens |
| `styles.css` | Portrait Instant UI |
| `game.js` | Loop, streak, social, rewards |
| `words.js` | Compact dictionary shard |
| `fbapp-config.json` | Instant Games config |

## Not in v1 (live-ops later)

- Real Audience Network rewarded video API wiring
- Server-authoritative daily leaderboards
- IAP tile skins
- Large progressive dictionary CDN shards
