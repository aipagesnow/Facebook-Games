# Live ops — first 90 days

## Cadence

| Frequency | Action |
|-----------|--------|
| Daily | New ladder seed + push/context reminder where allowed |
| Weekly | Leaderboard reset + small reward frame |
| Bi-weekly | Theme pack (movies, sports, food…) |
| Monthly | Cosmetic drop or limited tile skin |

## Content needs (small team)

- Seed generator + manual quality pass (15–30 min/day or batch weekly)
- Theme word lists (one designer/dev hour every 2 weeks)
- Balance pass on scoring if inflate appears

## Analytics events (minimum)

- `game_start`, `round_complete`, `challenge_sent`, `share_complete`
- `rewarded_offer`, `rewarded_complete`
- `streak_increment`, `streak_break`
- `load_time_ms`, `tutorial_skip`

## Kill criteria / pivot signals

- Challenge send rate &lt; 5% of rounds after week 2 → strengthen end-screen CTA
- D1 &lt; platform baseline for genre → tighten first-session reward
- Load p75 &gt; 3s → cut initial dictionary further
