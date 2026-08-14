# Android info pack specification

Each pack is a **folder** under the configured Android info-packs root (`android-packs/` by default):

```
android-packs/
  my-slug/
    pack.json              # required
    README.md              # required for status: ready
    FILTER-DECISION.md
    PILLARS.md
    AUDIENCE.md
    MONETIZATION.md
    DISCOVERY.md
    LIVEOPS.md
    PLAY-CHECKLIST.md      # Play Console readiness
    MARKET-RESEARCH.md     # written by Plan next
    RESEARCH-RUN.json      # written by Plan next
    skeleton/
      index.html
      styles.css
      game.js
```

## pack.json extras (Android)

```json
{
  "kind": "game | app",
  "platforms": ["android"]
}
```

- **`kind: "game"`** — create the Play listing as a Game. Category is a game bucket (Word, Puzzle, …).
- **`kind: "app"`** — create the Play listing as an App. Category is a utility bucket (Tools, Productivity, …). This choice **cannot be changed** later on Play Console.

Facebook Instant Game packs stay under `info-packs/` and do not need `kind`.

## Workspace contract

Built Android titles live under `android-apps/<slug>/`:

| File | Purpose |
|------|---------|
| `android-listing.json` | Copy-ready Play Console fields |
| `store-assets/` | 512 icon, 1024×500 feature graphic, phone screenshots |
| `app-release.aab` | Signed bundle dropped here for upload |

HTML5 games can wrap an existing `games/<slug>/` folder (Capacitor). Utility apps can be a new Capacitor or native project in the same workspace.

## Status meanings

Same as Facebook packs: `candidate` → `ready` → `in-production` → `published` / `archived`.
