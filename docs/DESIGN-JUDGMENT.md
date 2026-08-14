# Design judgment — pipeline, filter, skeleton, info packs

This document captures professional recommendations that feed **Facebook Games Studio** (this app). The research pipeline now lives **inside the studio** as **Plan next** (Facebook and Android each have their own desk). It is the single long pass recommended below: inventory → live research → filter → red team → one pack.

---

## 1. Practical filter test (high-MAU pattern: social word / Instant word-trivia family)

Walked through the **three-stage filter** using the chart reality of top Instant Games: word & trivia dominate MAU; social word play (Words With Friends–class) plus Instant-style ultra-light word apps (AHA/WOW pattern) are the reference family.

### Stage 1 — Hard gates

| Gate | Verdict |
|------|---------|
| Short-session, social, ad-friendly | **Clear pass** — 30–90s rounds, challenges/shares, post-round rewarded ads. |
| Small team can polish the core loop | **Clear pass** — dictionary + input + score + one social path. |
| Sub-3s load, Zero Permissions, &lt;30s teachable loop | **Pass with one watch-out** — dictionary size can blow the bundle; progressive loading is mandatory. |

Nothing was “maybe” at this stage if the idea stays pure word-ladder/speed-chain. Fuzziness appears only if you smuggle in heavy content ops (thousands of hand-authored trivia questions).

### Stage 2 — Opportunity & differentiation

Clear room for a small team **without fighting the mechanic**:

- Faster first play than legacy social word titles (no multi-screen onboarding).
- Challenge-first end screen (every run produces a friend CTA).
- Cleaner ad moments (never mid-input).
- Context-aware seeds (Messenger challenge vs Gaming Tab daily).

Absolute chart position of decade-old brands is **not** the reason to build — growth of the *format* and room to improve onboarding/social is.

### Stage 3 — Execution realism & pillar coverage

All non-negotiable pillars weave in elegantly. Live-ops burden for 3–6 months is **medium-low** (daily seeds, light theme packs) vs high for trivia content factories.

**Decision for the sample pack:** promote to `ready`.

---

## 2. What the exercise surfaces

### Strengths of the filter

- **Hard gates kill bad platform fits fast** — long-session or weak-social ideas die early.
- **Small-team realism** is the right second gate for your situation; it blocks “chart clone of an impossible production.”
- **Differentiation stage** forces “improve onboarding / social / ads” rather than “copy MAU.”

### Fuzzy / incomplete spots to tighten later

1. **“Room to improve” needs a concrete checklist** — e.g. must name ≥2 specific UX edges vs named references, or fail Stage 2.
2. **Live-ops burden scoring is still subjective** — add a simple rubric: hours/week content, systems complexity (1–5), dependency on external licensing.
3. **Dictionary / content licensing** is a hidden hard gate for word games (word list rights, offensive-word filter).
4. **Monetization “clean fit”** should require an explicit “ads never interrupt core verb” rule as a Stage 1 sub-gate.
5. **Technical load budget** should be estimated at Stage 1 with a max initial asset list, not only asserted.

These do not break the filter; they make borderline cases less “maybe.”

---

## 3. Infrastructure: single long pass vs multi-desk

**Recommendation for you right now: single long pass (research → ideas → filter stages → critique → package), with the multi-stage filter embedded inside that pass.**

### Why this matches your constraints

| Goal | Single long pass | Multi-desk with send-back |
|------|------------------|---------------------------|
| Simplicity to build | High | Low (state, queues, retries) |
| Reliability / debug | Easier end-to-end logs | Fragile orchestration |
| Quality | Good if filter is strict + critique is strong | Higher ceiling, higher cost |
| Your stated priority | Aligns | Overkill until volume is high |

### Risk you accept (and how we mitigate)

- **Risk:** borderline ideas get only surface critique → mediocre packs.  
- **Mitigation (without multi-desk complexity):**
  1. Embed the **3-stage filter as hard code/path** inside the one run (fail-fast exits).
  2. Add a **final “red team” critique step** that can **drop** a pack (not ship it) if scores are mid.
  3. Prefer **fewer high-quality packs per day** over many average ones.
  4. Human open-in-studio review before status flips to `ready` (this app’s job).

### When to graduate to multi-desk

Only when you are producing many packs/week and repeatedly see the same failure mode (e.g. social hooks always weak). Then add one feedback loop — not four departments.

**Bottom line:** protect **maintainability first**; protect quality with **strict gates + drop-on-fail**, not with complex workflow engines yet.

---

## 4. Is the bare HTML/JS skeleton useful?

**Yes — keep it**, with a clear role.

### Problem the skeleton solves that prose does not

- Proves the pack author thought about **FBInstant lifecycle order** (`initializeAsync` → progress → `startGameAsync`).
- Gives a **runnable contract** for one social API (`shareAsync` / challenge payload shape).
- Removes blank-page friction so a developer (or Grok) starts from platform-correct wiring, not from a generic HTML game.

### Constraints / costs it introduces

- Skeleton can **rot** if SDK versions change (Zero Permissions / v8+).
- Risk of **false confidence** if people ship the skeleton skin-deep — mitigate by labeling it `skeleton/` and stating “not a vertical slice.”
- Maintenance: keep it **tiny** (few files, no build step).

### Completeness level (agreed)

**Bare HTML/JS + lifecycle + one social stub** is the right default for unique creative outcomes.  
Do **not** ship a polished vertical slice in the pack; that pushes clones and over-constrains art/feel.

---

## 5. Non-code elements every pack should include

Minimum set (enforced by studio + future pipeline):

| File | Purpose |
|------|---------|
| `pack.json` | Machine-readable metadata for the dashboard |
| `FILTER-DECISION.md` | Why it survived Stage 1–3; named references; risks |
| `README.md` | Pitch, core loop, 5-second test, build notes |
| `PILLARS.md` | How each pillar is expressed in *this* game |
| `AUDIENCE.md` | Who, session context, messaging |
| `MONETIZATION.md` | Ad/IAP placements + fun-kill checks |
| `DISCOVERY.md` | Icon/cover/share/video guidance + category |
| `LIVEOPS.md` | 90-day cadence + analytics events |
| `UPLOAD-CHECKLIST.md` | developers.facebook field readiness |
| `skeleton/` | Lifecycle + one social stub only |

### Optional but high value later

- `COMPETITIVE-NOTES.md` — 3 screenshots descriptions of gaps in rivals  
- `ANALYTICS-EVENTS.json` — event schema  
- `ASSET-PROMPTS.md` — image gen prompts for icon/cover  
- `RISKS.md` — policy, IP, content moderation  

### Developer “three questions” test

A pack is complete when a competent Instant Games dev no longer needs to ask:

1. **Why this idea (vs the chart leaders it references)?** → FILTER-DECISION  
2. **What exactly is in v1 vs live-ops later?** → README + LIVEOPS  
3. **What do I upload to Facebook and what technical bar must I hit?** → UPLOAD-CHECKLIST + skeleton  

If any of those are unanswered, the pack is not `ready`.

---

## 6. How this maps to Facebook Games Studio (this app)

```
[Research pipeline — future]
        ↓ writes
[info-packs/<slug>/]  ←── Settings path
        ↓ scanned by
[Studio: Dashboard | Info Packs | Library | FB Upload]
        ↓ copy path / Grok prompt
[You + Grok build unique game in games/]
        ↓ publish
[Library entry + App ID + live-ops notes]
```

The studio does **not** replace the pipeline. It is the **operator console** and **library of record** for Instant Games shipping on developers.facebook.
