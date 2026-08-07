# Filter decision — Word Streak Duels

Reference title walked through the multi-stage filter: **social word / trivia family** (e.g. Words With Friends–style + Instant-style word apps like AHA/WOW pattern).

## Stage 1 — Hard gates (PASS)

| Gate | Result | Notes |
|------|--------|-------|
| Short-session + social + ad-friendly | **PASS** | 60-second ladder rounds; challenge/share is native; hints fit rewarded ads. |
| Small team can polish core loop | **PASS** | Word list + input UI + score + one social API. Art can stay tile-simple. |
| Sub-3s load + Zero Permissions + &lt;30s teach | **PASS** | Tiny first bundle (UI + top dictionary shard). Zero Permissions: no login wall. Tutorial = first ladder with one tip toast. |

Edge case watched: dictionary size can bloat load time — **mitigate with progressive dictionary load**.

## Stage 2 — Opportunity & differentiation (STRONG)

Room for a small team vs entrenched word titles:

1. **Faster onboarding** — no multi-screen rules; first tile is playable in &lt;5s.
2. **Stronger native challenge** — every run ends with one-tap “Challenge friend with this seed”.
3. **Cleaner ad moments** — hint / streak freeze only after fail or end-of-round, never mid-input.
4. **Context-aware** — Messenger thread seed words vs solo Gaming Tab daily ladder.

Category is stable-high for Instant Games (word/trivia dominate MAU charts) with room for fresher challenge UX rather than displacing decade-old brands on pure content volume.

## Stage 3 — Execution realism & pillar coverage (STRONG)

| Pillar | Fit |
|--------|-----|
| Instant core loop | Excellent |
| Native social / viral | Excellent (challenges, leaderboards, share chains) |
| Retention | Strong (daily seed + streak) |
| Hybrid monetization | Strong if ads stay optional/power-up |
| Discovery + live ops | Strong (themes, seasonal word packs) |

**Live-ops burden (first 3–6 months):**  
Medium-low. Need: daily seed generation, 1–2 theme packs/month, light dictionary curation, weekly leaderboard reset. No heavy content pipeline like trivia question writing at scale if dictionary is solid.

## Decision

**PROMOTE to ready pack.** Survives all hard gates; differentiation is clear without fighting the mechanic; live-ops is realistic for a small team.
