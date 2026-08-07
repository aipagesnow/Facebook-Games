# Pillar implementation map

## 1. Instant core loop + frictionless start

- First paint: seed word + input + timer only.
- `FBInstant.initializeAsync` → load minimal assets → `setLoadingProgress` → `startGameAsync`.
- Zero Permissions: no custom permission UI; use supported social APIs only.
- Teach by doing: first fail shows one tip; no multi-page tutorial.

## 2. Native social / viral mechanics

- End-of-round: `shareAsync` or context update with score + seed.
- `createAsync` / challenge flow for friend rematch.
- Optional leaderboard for daily ladder.
- Context-aware: if opened from a challenge, auto-load opponent seed and target score.

## 3. Retention hooks

- Daily ladder seed (UTC or local day).
- Streak counter; freeze via rewarded ad.
- Weekly themed word list (live-ops).

## 4. Hybrid monetization

- Rewarded: hint (reveal next letter), streak freeze, second daily ladder.
- IAP (light): tile themes, trail VFX, remove interstitial only if interstitial is used sparingly between sessions (never mid-round).

## 5. Discovery assets + live ops

- Icon: high-contrast letter tiles, 2–3 letters max readable at 48px.
- Cover: two player avatars + chain of words (social promise).
- Live ops: theme weeks, limited seeds, seasonal dictionaries.

## 6. Continuous iteration

Instrument: load time, D1/D7, challenge send rate, share rate, rewarded completion, IAP conversion, streak retention.
