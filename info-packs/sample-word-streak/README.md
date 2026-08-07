# Word Streak Duels

## Elevator pitch

Players race a **60-second word ladder** from a shared seed. Beat friends asynchronously, protect a daily streak, and share your longest chain.

## Why this pack exists

Word and trivia titles dominate Facebook Instant Games high-MAU charts. This pack is not a clone brief — it is a **differentiated angle**: ultra-fast first play, challenge-first social design, and ad placements that never interrupt typing.

## Core loop (5-second test)

1. See seed word + timer.
2. Type connected words (last letter → next word, or ladder rule defined in build).
3. Score = length × speed bonus.
4. One-tap challenge / share.

## Target session length

2–4 minutes (1–3 rounds + social action).

## Build guidance

- Start from `skeleton/` (FBInstant lifecycle + share stub).
- Keep initial download tiny; stream dictionary shards after `startGameAsync`.
- Prefer unique art direction and SFX so the game does not feel like a reskin of existing chart leaders.

## Related docs

- `FILTER-DECISION.md` — multi-stage scoring walkthrough
- `PILLARS.md` — pillar implementation map
- `AUDIENCE.md` — who this is for
- `MONETIZATION.md` — ads + IAP
- `DISCOVERY.md` — store / discovery assets
- `LIVEOPS.md` — first 90 days
- `UPLOAD-CHECKLIST.md` — developers.facebook readiness
