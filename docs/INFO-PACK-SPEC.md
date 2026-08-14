# Game info pack specification

Each pack is a **folder** under the configured info-packs root:

```
info-packs/
  my-game-slug/
    pack.json              # required
    README.md              # required for status: ready
    FILTER-DECISION.md     # required for status: ready
    PILLARS.md
    AUDIENCE.md
    MONETIZATION.md
    DISCOVERY.md
    LIVEOPS.md
    UPLOAD-CHECKLIST.md
    MARKET-RESEARCH.md      # written by Plan next
    RESEARCH-RUN.json       # written by Plan next
    skeleton/
      index.html
      styles.css
      game.js
```

## pack.json schema (minimum)

```json
{
  "id": "my-game-slug",
  "title": "Display Title",
  "slug": "my-game-slug",
  "status": "candidate | ready | in-production | published | archived",
  "genre": "word | trivia | puzzle | sports | other",
  "oneLiner": "One sentence pitch",
  "inspiredBy": ["Reference title A", "Reference title B"],
  "targetAudience": "Short audience description",
  "createdAt": "YYYY-MM-DD",
  "tags": ["daily", "asynchronous"],
  "scores": {
    "instantGamesDna": 0,
    "naturalSocial": 0,
    "smallTeamBuild": 0,
    "growthTrajectory": 0,
    "absolutePopularityProxy": 0
  },
  "pillars": {
    "coreLoop": "...",
    "social": "...",
    "retention": "...",
    "monetization": "...",
    "discovery": "...",
    "liveOps": "..."
  }
}
```

## Status meanings

| Status | Meaning |
|--------|---------|
| `candidate` | Survived automation but needs human review |
| `ready` | Safe to hand to Grok / build |
| `in-production` | Actively being built |
| `published` | Live on Facebook (also add Library entry) |
| `archived` | Rejected or retired |

## Studio behavior

- Scans **immediate subfolders** of the info-packs path.
- Reads `pack.json` when present.
- Shows absolute path for copy/paste into Grok.
- Does not modify pack files (read-oriented), except **Plan next**, which *creates* a new pack folder after research.

Android / Play packs use a parallel folder (`android-packs/`) and `kind: game | app`. See [`ANDROID-PACK-SPEC.md`](ANDROID-PACK-SPEC.md).

Generated packs also include `MARKET-RESEARCH.md` (sources, rejected ideas) and `RESEARCH-RUN.json` (run metadata).
