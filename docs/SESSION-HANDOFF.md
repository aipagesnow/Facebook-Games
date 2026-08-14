# Session handoff — Facebook Games Studio + Word Streak Duels

**Last updated:** 2026-08-14 (Plan next research desk added)  
**Status:** Game soft-shipped on Production; studio site + privacy **LIVE**; **Business verification SUBMITTED** (~2 working days). Studio now switches **Facebook Instant Games** ↔ **Android Play** (games + apps).  
**Local project:** Desktop `Facebook-Games` folder  
**Remote:** `origin` / `main` (repo is **public** so free GitHub Pages works)

---

## Resume checklist (when you’re back)

1. Open project folder; optional `git pull` on `main`.  
2. Check Meta: [Security Centre](https://business.facebook.com/settings/security) → **Apex Arcade Studio** → Business verification status.  
3. **If Verified:**
   - [developers.facebook.com](https://developers.facebook.com) → **Word Streak Duels**  
   - Finish any **App Review** items  
   - **Publish** (app still **Unpublished** until then)  
   - Confirm privacy URL in Instant Games **Details**  
   - Friend test: https://www.facebook.com/gaming/play/1593839865675820/  
4. **If Rejected:** read Meta’s reason → fix docs/details → resubmit (see `docs/BUSINESS-VERIFICATION.md`). Screenshot + continue with Grok.  
5. Ads: streak freeze may still no-fill; retest on **Facebook mobile app** after Live/placement matures.

### Quick paths

| Item | Path / value |
|------|----------------|
| Game source | `games/word-streak-duels/` |
| Store assets | `games/word-streak-duels/store-assets/` |
| Upload zip | `games/game.zip` |
| FB listing copy | `games/word-streak-duels/fb-listing.json` + Studio **FB Upload** |
| BV guide | `docs/BUSINESS-VERIFICATION.md` |
| Launch walkthrough | `docs/LAUNCH-WALKTHROUGH.md` |
| Studio website | **LIVE** https://aipagesnow.github.io/Facebook-Games/ |
| Privacy policy URL | **LIVE** https://aipagesnow.github.io/Facebook-Games/privacy-word-streak-duels.html |
| App ID | `1593839865675820` |
| Rewarded placement | `1593839865675820_1595058932220580` |
| Business portfolio | **Apex Arcade Studio** (ID `1711577450147604`) |
| Monetization property | **Word Streak Duels** |
| Publisher (every game) | **Apex Arcade Studio** |
| Category | **Trivia and Word** |
| Tagline (≤40 chars) | `60s daily word ladder — beat your best!` |
| Connection | **Zero permissions** (leave as-is) |
| GitHub Pages | Branch `main` · folder `/docs` · repo **public** |

**Note:** `data/library/*.json` is **gitignored**. If Library empty after clone, re-add in Library UI from `fb-listing.json`.

---

## Where we stopped (2026-08-11 break)

### Business verification (SUBMITTED — waiting)

| Choice / field | What we used |
|----------------|--------------|
| Use case | App requires access to permissions on Meta for Developers |
| Business type | **Sole proprietorship** |
| Officially registered? | **Not yet registered** |
| Legal business name | User’s **real personal name** (not inventing a company) |
| Alternative / trade name | **Apex Arcade Studio** |
| Tax / registration ID | Left blank (optional, no formal registration) |
| Website on form | GitHub Pages studio URL (see note below on email) |
| Name proof | **Business bank statement** type ← personal bank statement photo OK; redact sort code + account number |
| Address proof | Same bank statement OK **if** address visible; else utility bill |
| Submission result | **Information submitted** — Meta said ~**two working days** |
| User action | Clicked Done; taking a break until Meta emails / status updates |

**Email gotcha (resolved for this submit):** Meta locked email domain to `@github.io` when website was github.io. User got past it and submitted successfully. If resubmit ever needed and email is stuck again: go Back, use **phone/SMS** if offered, or use a website domain that has a real mailbox (e.g. custom domain / aivora.digital) — **do not rely on `@github.io` inbox**.

**Do not** start a second verification while this one is pending.

### Public studio site (done this session)

| Item | Detail |
|------|--------|
| Home | `docs/index.html` → https://aipagesnow.github.io/Facebook-Games/ |
| Privacy | `docs/privacy-word-streak-duels.html` (user verified screenshot looks good) |
| Footer | Privacy only — **no Source / GitHub link** |
| Paths scrubbed | No `C:\Users\chris\...` in public docs / `fb-listing.json` |
| Repo visibility | Made **public** (required for free GitHub Pages) |
| App ID + play link on site | OK to stay public |
| Privacy URL for Meta Details | Paste if not already: privacy URL above |

### Already done earlier (still true)

| Step | Status |
|------|--------|
| Instant Game Details text | Done |
| Required Game Media | Done (icons, cover, banner, landscape preview video) |
| Zero permissions | Selected |
| Web hosting Production | Soft-shipped (v1.21) |
| Business Verification | **SUBMITTED — awaiting Meta (~2 working days)** |
| App Review | Pending after BV approved |
| Publish / Live | **Unpublished** until checklist complete |
| Ads | Placement exists; fill often missing |

### Not done / later

- [ ] Business verification **approved** (waiting on Meta)  
- [ ] App Review + Publish (Live)  
- [ ] Friend test without tester role  
- [ ] Real ad fill reliable on mobile  
- [ ] Shared multiplayer leaderboards (deferred)  
- [ ] Optional media / App Page / better preview video  

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
9. **Indie path:** sole prop / not registered / legal name = person; brand = Apex Arcade Studio.  
10. **Public site:** GitHub Pages only; no Source link; no local Windows paths in published files.

---

## Plan next (in-studio research desk, 2026-08-14)

Sidebar **Plan next** copies a Grok Build prompt (catalog baked in). User pastes it into this chat with the project open. No API key.

**Build prompt** on each pack / library card. **Ship board** (`/:platform/ship`) is the per-title Live/Play checklist. **Consider for Android/Facebook** on a pack writes a candidate on the other side + evaluate prompt (GO/NO-GO before any port).

### One-time import (2026-08-14)

**Farm Flapper** (from Desktop `flappy-duck`) is on **both** sides. Do not import more games this way.

| Item | Path |
|------|------|
| Game | `games/farm-flapper/` |
| FB pack | `info-packs/farm-flapper/` |
| FB listing | `games/farm-flapper/fb-listing.json` |
| Android pack | `android-packs/farm-flapper/` |
| Android listing | `android-apps/farm-flapper/android-listing.json` |
| Privacy | `docs/privacy-farm-flapper.html` |
| Package | `com.apexarcade.farmflapper` |
| Tagline | `Flap, shoot eggs, save the farm!` |

- Inventories packs + library + workspaces on **both** platforms (no remakes).
- Default: mostly new titles. Optional: allow a genuine better-version.
- Android can pick game vs app (`auto` / force).
- Writes a full info pack + `MARKET-RESEARCH.md` + skeleton.
- History: Electron userData `research-history.json`.

## Android / Play side (added 2026-08-14)

Sidebar **Facebook | Android** switch remaps Dashboard, Info Packs, Library, and upload.

| Item | Path |
|------|------|
| Android packs | `android-packs/` |
| Sample Play **game** | `android-packs/sample-word-streak-android/` |
| Sample Play **app** | `android-packs/sample-focus-pulse/` |
| Android workspace | `android-apps/<slug>/` |
| WSD Play listing | `android-apps/word-streak-duels/android-listing.json` |
| Android library JSON | `data/android-library/` (gitignored, like FB library) |
| Spec | `docs/ANDROID-PACK-SPEC.md` |

Play create-app **Game vs App cannot be changed later**. Word Streak Duels is a **game**. Focus Pulse is a sample **app**.

HTML5 wrap path: Capacitor around `games/word-streak-duels/` (stub FBInstant; AdMob + Android share). Drop signed `app-release.aab` in the slug folder; **Play Console** page copies listing fields the same way **FB Upload** does for Meta.

## Studio workflow (every future game)

1. Scaffold under `games/<slug>/` + `fb-listing.json` (copy from WSD, edit).  
2. Create `store-assets/` with required media filenames (see FB Upload media section).  
3. Library: App ID, paths.  
4. Studio **FB Upload**: copy fields, open zip folder, check media status.  
5. Meta: Instant Game only at create → Details → Web hosting → Monetization property → BV if needed → Publish.  

---

## Git / save status

Expected after this handoff commit + push:

- Branch: `main`  
- Remote: `origin`  
- Includes: studio Pages site, privacy HTML, BV guide, scrubbed paths, this handoff  

Still local-only (gitignored):

- `data/library/*.json`  
- `node_modules/`, `dist/`  

---

## Suggested order when Meta replies

1. Confirm **Verified** in Security Centre (or fix rejection).  
2. Privacy URL in Instant Games Details (if missing).  
3. App Review items Meta shows.  
4. **Publish** app (Live).  
5. Friend test play link.  
6. Optional: retest freeze ads on mobile.  
7. Optional: next Instant Game using studio.  
