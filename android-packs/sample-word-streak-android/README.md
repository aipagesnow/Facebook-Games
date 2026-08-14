# Word Streak Duels (Android)

## Elevator pitch

Players race a **60-second word ladder** from a shared daily seed. Beat a personal best, protect a streak, and share the chain from a native Android install on Google Play.

## Why this pack exists

The Instant Game already proves the loop. This pack is the **Play Console / Android ship** of the same fantasy: Capacitor (or equivalent) wrap, signed AAB, Play listing, AdMob instead of Audience Network.

## Kind

**Game** — create the Play app as a Game (Word / Puzzle). Do not create it as a utility App.

## Core loop (5-second test)

1. See seed word + timer.
2. Type connected words (last letter → next word).
3. Score = chain length × speed / long-word bonus.
4. One-tap Android share.

## Target session length

2–4 minutes (1–3 rounds + share).

## Build guidance

- Prefer wrapping the existing HTML5 client in `games/word-streak-duels/` with **Capacitor**.
- Stub or strip `FBInstant` calls for Android (share sheet + local storage + AdMob).
- Keep the first WebView paint fast; stream dictionary shards after boot.
- Output lives in `android-apps/word-streak-duels/` with `android-listing.json`.

## Related docs

- `FILTER-DECISION.md` — why this is a Play game, not a new mechanic
- `PILLARS.md` — pillar map for Android
- `AUDIENCE.md` — who installs from Play
- `MONETIZATION.md` — AdMob + optional Play Billing
- `DISCOVERY.md` — Play store graphics
- `LIVEOPS.md` — first 90 days
- `PLAY-CHECKLIST.md` — Play Console readiness
- `skeleton/` — Capacitor-oriented HTML stub (not a vertical slice)
