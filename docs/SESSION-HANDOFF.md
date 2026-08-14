# Session handoff — Games Studio

**Last updated:** 2026-08-14 (break — Farm Flapper harvest balloon shipped, studio dual-platform locked in)  
**Local project:** `C:\Users\chris\OneDrive\Desktop\Facebook-Games`  
**Remote:** `origin` / `main` — https://github.com/aipagesnow/Facebook-Games  
**How to resume:** `git pull` on `main`, open Grok Build on this folder, relaunch `Launch Facebook Games Studio.bat`  
**Latest commit at this pause:** confirm with `git log -1` (handoff + JSON comma fix after `865ff4a` harvest balloon)

---

## Where we stopped (2026-08-14 break)

Taking a break. Studio + Farm Flapper improvements are **committed and pushed**. Do not import more games by dropping a folder — future titles use **Plan next → paste into Grok Build**.

### Done this stretch (lock this in)

| Area | What landed |
|------|-------------|
| Dual studio | Sidebar **Facebook / Android** switch. Separate packs, library, Play Console vs FB Upload |
| Plan next | Builds a **paste prompt** (catalog included). No API key |
| Build prompt | **Copy build prompt** on pack + library |
| Ship board | Per-title checklist + live-ops next action / date |
| Cross-platform | **Consider for Android/Facebook** → candidate pack + **evaluate GO/NO-GO** before any port |
| QoL | New-pack banner, art prompts, store links, pack status, library remove, ZIP/AAB dates |
| Farm Flapper | One-time import on **both** sides; visual polish; **harvest balloon** (multiplier = eggs hauled into balloon only) |

### Farm Flapper — pick up here

Playable source (Facebook **and** Android wrap the same files): `games/farm-flapper/`

| Item | Value |
|------|--------|
| Title | Farm Flapper |
| Slug | `farm-flapper` |
| FB pack | `info-packs/farm-flapper/` |
| FB listing | `games/farm-flapper/fb-listing.json` |
| Upload zip (when you make it) | `games/farm-flapper-upload.zip` — **not** Word Streak’s `games/game.zip` |
| Android pack | `android-packs/farm-flapper/` (PORT-DECISION = **GO**) |
| Android workspace | `android-apps/farm-flapper/` |
| Package | `com.apexarcade.farmflapper` — create Play app as **Game** |
| Privacy draft | `docs/privacy-farm-flapper.html` (not necessarily live on Pages yet) |
| Tagline | `Flap, shoot eggs, save the farm!` |
| Latest play feel | Balloon on the right lowers a basket; eggs in the basket are **not** scored until hoisted into the gondola. Crash before hoist = those eggs lost |
| Android listing version | v1.3 / versionCode 3 (confirm in `android-apps/farm-flapper/android-listing.json`) |

**Still needed for Farm Flapper (next session):**

1. Store art (use **Copy art prompt** on FB Upload / Play Console media rows).
2. Zip Instant Game → Meta Upload Version.
3. Capacitor wrap + signed AAB for Play Internal testing.
4. Host privacy HTML on GitHub Pages if not already (`docs/privacy-farm-flapper.html`).
5. Create Meta Instant Game app + Play Console Game; save App ID / package in Library.
6. Tick **Ship board** as you go.

Original Desktop `flappy-duck` folder was **not** modified. Studio copy is the source of truth now.

### Word Streak Duels — still waiting on Meta

Unchanged from the earlier break: **Business verification SUBMITTED**. Next is Verified → App Review → Publish (Live). Details below.

---

## Resume checklist (when you’re back)

1. `cd` to Desktop `Facebook-Games`; `git pull` on `main`.
2. Open Grok Build pointed at this project.
3. Double-click `Launch Facebook Games Studio.bat`.
4. **Meta BV:** [Security Centre](https://business.facebook.com/settings/security) → **Apex Arcade Studio**.
5. **If Verified:** [developers.facebook.com](https://developers.facebook.com) → **Word Streak Duels** → finish **App Review** → **Publish** (app is still **Unpublished** until then) → confirm privacy URL in Instant Games **Details** → friend test: https://www.facebook.com/gaming/play/1593839865675820/
6. **If Rejected:** read Meta’s reason → `docs/BUSINESS-VERIFICATION.md` → screenshot + continue with Grok. Do **not** start a second verification while one is pending.
7. Optional: Farm Flapper media + zip / AAB (list above).
8. Future **new** titles: Facebook or Android → **Plan next** → paste prompt here. Do **not** drop another folder in.
9. Ads (WSD): streak freeze may still no-fill; retest on **Facebook mobile app** after Live/placement matures.

---

## Quick paths

### Word Streak Duels

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

### Farm Flapper

| Item | Path / value |
|------|----------------|
| Shared playable | `games/farm-flapper/` (`index.html`, `game.js`, `style.css`) |
| Harvest mechanic | `games/farm-flapper/game.js` — `harvest` object, `updateHarvest`, `drawHarvestRig` |
| Facebook pack | `info-packs/farm-flapper/` |
| Android pack | `android-packs/farm-flapper/` |
| Android listing | `android-apps/farm-flapper/android-listing.json` |
| Privacy draft | `docs/privacy-farm-flapper.html` |
| Plan-next skill | `.grok/skills/plan-next/SKILL.md` |

**Note:** `data/library/*.json` and `data/android-library/*.json` are **gitignored**. If Library is empty after clone, re-add in Library UI from `fb-listing.json` / `android-listing.json`.

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

### Not done / later (Word Streak)

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
4. **Category (WSD):** Trivia and Word.
5. **Ads:** rewarded only after scored round (streak freeze).
6. **App Page:** optional later.
7. **Zero permissions:** keep.
8. **One Business** for all games; **one Monetization property per game**.
9. **Indie path:** sole prop / not registered / legal name = person; brand = Apex Arcade Studio.
10. **Public site:** GitHub Pages only; no Source link; no local Windows paths in published files.
11. **No more folder-drop imports.** Farm Flapper was the one-time exception. New titles: Plan next → paste into Grok Build.
12. **Plan next is a paste prompt**, not an in-app LLM call. No `XAI_API_KEY` required.
13. **Cross-platform:** candidate pack first; Grok writes **GO / NO-GO** before any port. Farm Flapper is already **GO**.

---

## How the studio works now (do not re-litigate)

- **Facebook | Android** switch is the top of the sidebar.
- **Plan next** = copy prompt → paste into Grok Build on this repo. No xAI key required.
- **Copy build prompt** = after a pack exists, paste here to implement the game.
- **Ship board** = what is actually done toward Live / Production.
- **Consider for other platform** = optional. Writes a *candidate* pack. Grok must **GO / NO-GO** before a port. Farm Flapper already has a **GO** because this import was requested on both stores.
- **Do not** add more games by copying a Desktop folder. Farm Flapper was the exception.

---

## Git / save status at this pause

Expected after the handoff commit + push:

- Branch: `main`
- Remote: `origin`
- Includes: dual-platform studio, Plan/build/ship/cross-platform, Farm Flapper import + visual polish + harvest balloon, this handoff

Still local-only (gitignored):

- `data/library/*.json` and `data/android-library/*.json` (Library UI)
- `data/ship-boards/**/*.json` (checklist ticks)
- `data/research-inbox/*.json`
- `node_modules/`, `dist/`

If Library is empty after a fresh clone, re-add Farm Flapper / Word Streak from their `fb-listing.json` / `android-listing.json` in the Library UI.

---

## Android / Play side (added 2026-08-14)

Sidebar **Facebook | Android** switch remaps Dashboard, Info Packs, Library, and upload.

| Item | Path |
|------|------|
| Android packs | `android-packs/` |
| Sample Play **game** | `android-packs/sample-word-streak-android/` |
| Sample Play **app** | `android-packs/sample-focus-pulse/` |
| Android workspace | `android-apps/<slug>/` |
| WSD Play listing | `android-apps/word-streak-duels/android-listing.json` |
| Farm Flapper Play listing | `android-apps/farm-flapper/android-listing.json` |
| Android library JSON | `data/android-library/` (gitignored, like FB library) |
| Spec | `docs/ANDROID-PACK-SPEC.md` |

Play create-app **Game vs App cannot be changed later**. Word Streak Duels and Farm Flapper are **games**. Focus Pulse is a sample **app**.

HTML5 wrap path: Capacitor around `games/<slug>/` (stub FBInstant; AdMob + Android share). Drop signed `app-release.aab` in the slug folder; **Play Console** page copies listing fields the same way **FB Upload** does for Meta.

---

## Studio workflow (every future game)

1. Facebook or Android → **Plan next** → copy the generated prompt → paste into Grok Build.
2. Grok writes the info pack / Android pack. Do **not** drop a Desktop folder.
3. After pack exists, **Copy build prompt** → paste here to implement under `games/<slug>/` + `fb-listing.json` (or Android workspace).
4. Create `store-assets/` with required media filenames (see FB Upload / Play Console media section).
5. Library: App ID, paths.
6. Studio **FB Upload** / **Play Console**: copy fields, open zip/AAB folder, check media status.
7. Meta: Instant Game only at create → Details → Web hosting → Monetization property → BV if needed → Publish.
8. Play: create as **Game** or **App** (cannot change later) → listing → signed AAB → Internal testing.

---

## Suggested order when Meta replies

1. Confirm **Verified** in Security Centre (or fix rejection).
2. Privacy URL in Instant Games Details (if missing).
3. App Review items Meta shows.
4. **Publish** app (Live).
5. Friend test play link.
6. Optional: retest freeze ads on mobile.
7. Optional: Farm Flapper store art / zip / AAB, or next Instant Game using Plan next.
