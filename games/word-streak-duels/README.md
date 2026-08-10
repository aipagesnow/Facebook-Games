# Word Streak Duels

Facebook Instant Game (solo launch v1.21) by **Apex Arcade Studio**.

**One-liner:** 60-second daily word ladder — beat your best, keep your streak, share your score.

**App ID:** `1593839865675820`  
**Play:** https://www.facebook.com/gaming/play/1593839865675820/

## Play locally

Open `index.html` in a browser (FBInstant is mocked). Optional:

```powershell
npx --yes serve .
```

Challenge entry simulation:

```
index.html?seed=CRANE&target=50
```

## Core rules

1. Start from today’s seed word.
2. 60 seconds on the clock.
3. Each new word must **start with the last letter** of the previous word.
4. Valid dictionary words, min 3 letters, no repeats.
5. Score = length × 10 + small speed bonus + long-word bonus (7+).

## Features (shipped)

| Feature | Notes |
|---------|--------|
| Solo home | Play, My bests, Share |
| Daily seed + themes | UTC day rotation |
| Personal bests | On-device |
| Streak + freezes | Freeze via rewarded ad |
| Share score | Link / Meta share |
| Play-only music | Silent menus |

## Monetization

- Rewarded video placement: `1593839865675820_1595058932220580`
- Offer only after a scored round (never mid-play)

## Upload (Meta)

1. Zip essentials → `games/game.zip` (see Desktop `game.zip`).
2. Instant Games → Web hosting → Upload Version → Push to Production.
3. Fill **Details** from `fb-listing.json` (or Studio FB Upload copy pack).
4. Upload art from `store-assets/`.
5. Privacy URL: host `privacy-word-streak-duels.html` (see `docs/` and `store-assets/`).
6. Switch app to **Live** when ready for public.

## Files

| File | Role |
|------|------|
| `index.html` | Shell + screens |
| `styles.css` | Portrait Instant UI |
| `game.js` | Loop, streak, share, ads |
| `audio.js` | Music + SFX |
| `words.js` | Dictionary |
| `names.js` | Name blocklist |
| `fbapp-config.json` | Instant Games config |
| `fb-listing.json` | Meta listing copy pack |
| `store-assets/` | Icon, cover, privacy |

## Later

- Shared multiplayer leaderboards
- Stronger ad fill / more placements
- IAP cosmetics
