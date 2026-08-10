# Session handoff — Facebook Games Studio + Word Streak Duels

**Last updated:** 2026-08-10 (business verification fill-out)  
**Status:** Game soft-shipped on Production; Details media largely done; **Business verification in progress** (Security Centre eligible) → then App Review → Publish (Live).  
**Repo:** (local git remote `origin`)  
**Local:** project root folder (not published)

---

## Resume checklist (now)

1. Open project folder (or `git pull` on `main`).  
2. **Meta first:** [Security Centre](https://business.facebook.com/settings/security) → Apex Arcade Studio → **Start verification**.  
   Full fill-out guide: `docs/BUSINESS-VERIFICATION.md`  
3. Use case dropdown: **App requires access to permissions on Meta for Developers**.  
4. When Business Verification approved → **App Review** → **Publish** (app still shows **Unpublished**).  
5. Confirm privacy policy URL is hosted and pasted in Details if Meta requires it.  
6. Final public test: https://www.facebook.com/gaming/play/1593839865675820/  
7. Ads: streak freeze may still no-fill; retest on **Facebook mobile app** after verification/placement matures.

### Quick paths

| Item | Path / value |
|------|----------------|
| Game source | `games/word-streak-duels/` |
| Store assets | `games/word-streak-duels/store-assets/` |
| Desktop launch pack | `Desktop\WSD-Launch-Assets\` |
| Upload zip | `games/game.zip` + Desktop `game.zip` |
| FB listing copy | `games/word-streak-duels/fb-listing.json` + Studio **FB Upload** |
| Studio website (GitHub Pages) | **LIVE** `https://aipagesnow.github.io/Facebook-Games/` (repo public, `/docs` on main) |
| Privacy HTML | **LIVE** `https://aipagesnow.github.io/Facebook-Games/privacy-word-streak-duels.html` |
| Launch walkthrough | `docs/LAUNCH-WALKTHROUGH.md` |
| App ID | `1593839865675820` |
| Rewarded placement | `1593839865675820_1595058932220580` |
| Business | **Apex Arcade Studio** (ID `1711577450147604`) |
| Monetization property | **Word Streak Duels** |
| Publisher (every game) | **Apex Arcade Studio** |
| Category | **Trivia and Word** |
| Tagline (≤40 chars) | `60s daily word ladder — beat your best!` |
| Connection | **Zero permissions** (leave as-is) |

**Note:** `data/library/*.json` is **gitignored**. Local Library entry has App ID + fbListing; if missing after clone, re-add in Library UI and paste from `fb-listing.json`.

---

## Where we stopped (2026-08-10)

### Done today (locked in)

#### Word Streak Duels (v1.21 game)

- Solo home only (no Daily/Challenge tabs).  
- Personal bests card (no fake #1 leaderboard).  
- Share score / play link; clearer status lines (share/ad on secondary line only).  
- Streak freezes explained; rewarded ad wired to placement ID.  
- Play-only music; names week removed + name blocklist; long-word bonuses + SFX.  
- Fixed Meta board names + context handling + local score store (shared cloud ranks deferred).  
- Production soft ship tested desktop + mobile (ads not filling yet — expected).

#### Meta setup progress

| Step | Status |
|------|--------|
| Instant Game Details text | Done (tagline, publisher, category, descriptions) |
| Required Game Media | Done (icons, cover, banner, landscape preview video) |
| Portrait/square preview video | Skipped (later) |
| App Page | Skipped (optional later) |
| Zero permissions | Selected |
| Web hosting Production | Soft-shipped |
| Business Verification | **Eligible — use `docs/BUSINESS-VERIFICATION.md`** |
| App Review | Pending after BV |
| Publish / Live | **Unpublished** until checklist complete |
| Ads | Placement created; fill often missing (mobile better than desktop) |

#### Facebook Games Studio improvements

- **FB Upload** expanded into numbered sections: hosting, use cases, Game Details, **Game Media** (required/optional slots with paths + explanations + file ready/missing), privacy, Live checklist, monetization.  
- `src/lib/fbMedia.ts` — Meta media slot definitions for reuse on every game.  
- `src/lib/fbListing.ts` — `publisher`, `DEFAULT_PUBLISHER`, Tagline (not “Store hook”), `TAGLINE_MAX_CHARS` (40), rewarded placement field, connection experience.  
- Version comment prefers `games/<slug>/fb-listing.json`.  
- electron main merge for versionComment from on-disk listing.

### Not done / later

- [ ] Business verification complete  
- [ ] App Review + Publish (Live)  
- [ ] Public privacy URL live (file ready; host e.g. GitHub Pages)  
- [ ] Real ad fill reliable  
- [ ] Shared multiplayer leaderboards (Meta context limits; own server option later)  
- [ ] Optional media: portrait/square videos, splash polish  
- [ ] Optional Facebook App Page for the game  
- [ ] Better gameplay preview video (screen record) if desired  

---

## Product decisions (don’t re-litigate)

1. **Solo launch** — personal bests + share; not multiplayer cloud ranks.  
2. **Publisher** always **Apex Arcade Studio**.  
3. **Taglines ≤ 40 characters** for Meta Details.  
4. **Category:** Trivia and Word.  
5. **Ads:** rewarded only after scored round (streak freeze).  
6. **App Page:** optional later.  
7. **Zero permissions:** keep.  
8. **One Business** for all games; **one Monetization property per game**.  

---

## Studio workflow (every future game)

1. Scaffold under `games/<slug>/` + `fb-listing.json` (copy from WSD, edit).  
2. Create `store-assets/` with required media filenames (see FB Upload media section).  
3. Library: App ID, paths.  
4. Studio **FB Upload**: copy fields, open zip folder, check media status.  
5. Meta: Instant Game only at create → Details → Web hosting → Monetization property → BV if needed → Publish.  

---

## Git / save status

After this handoff commit + push:

- Branch: `main`  
- Remote: `origin`  
- Includes: game source, store-assets, studio FB Upload media UI, docs (handoff, launch walkthrough, privacy HTML), pack one-liner updates, `games/game.zip`  

Still local-only (gitignored):

- `data/library/*.json`  
- `node_modules/`, `dist/`  

---

## Suggested order (ship)

1. **Business verification** for Apex Arcade Studio — follow `docs/BUSINESS-VERIFICATION.md`.  
2. Host privacy HTML (GitHub Pages) → paste URL in Details if required.  
3. App Review items Meta shows.  
4. Publish app (Live).  
5. Friend test without tester role.  
6. Optional: retest freeze ads on mobile.  
7. Optional: next Instant Game using improved studio.  
