# Word Streak Duels — Full public launch walkthrough

**Studio business:** Apex Arcade Studio  
**Game property:** Word Streak Duels  
**App ID:** `1593839865675820`  
**Play link:** https://www.facebook.com/gaming/play/1593839865675820/  
**Build:** v1.21 solo launch (latest `games/game.zip`)

---

## A. Confirm Production build

1. Open [developers.facebook.com/apps](https://developers.facebook.com/apps) → **Word Streak Duels**.
2. **Use cases → Launch Instant Game → Customize → Web hosting**.
3. Latest version should be Production. If you need to re-upload:
   - Drag Desktop / `games/game.zip`
   - Version comment (from Studio FB Upload or below)
   - **Push to Production**

**Version comment (v1.21):**

```
v1.21 solo launch: personal bests, share score, streak freezes + rewarded ad placement 1593839865675820_1595058932220580, long-word bonuses, play-only music.
```

---

## B. Fill Instant Games Details (store listing)

**Path:** Customize use case → **Details**

Copy from Facebook Games Studio → Library / FB Upload → **Copy ALL FB fields**, or paste from below.

### Publisher
```
Apex Arcade Studio
```
(Your Meta Business / studio name — same for every game.)

### Tagline
```
60-second daily word ladder — beat your best, keep your streak
```

### Short description
```
60-second daily word ladder. Chain words from today's seed, beat your best, keep your streak, and share your score with friends.
```

### Long description
```
Play a fast 60-second word ladder every day.

Start from today's seed word. Each new word must begin with the last letter of the previous one. Build the longest chain you can before time runs out.

• Daily seed that changes every day (themed weeks)
• Personal bests on today's ladder
• Daily streak with optional streak freezes
• Long-word bonus points for bigger plays
• Share your score so friends can try to beat you
• Instant play — no login wall

Perfect for a quick brain break. Come back tomorrow for a new seed!
```

### Category
`Trivia and Word` (Meta Details dropdown)

### Orientation
Portrait

### Publisher
Your name or **Apex Arcade Studio**

### Privacy policy URL
Host this file publicly, then paste the URL:

- Local file: `docs/privacy-word-streak-duels.html`  
- Also in: `games/word-streak-duels/store-assets/privacy-word-streak-duels.html`

**Easy host options:**
1. Push repo to GitHub → enable GitHub Pages on `/docs` →  
   `https://aipagesnow.github.io/Facebook-Games/privacy-word-streak-duels.html`  
2. Or upload the HTML to any HTTPS host and paste that URL.

Until the URL is live, Meta may keep Details incomplete.

---

## C. Upload discovery art

**Folder:** `games/word-streak-duels/store-assets/`

| Asset | File | Size |
|-------|------|------|
| App icon | `icon-1024.png` | 1024×1024 |
| Cover | `cover-1600x300.png` | 1600×300 |

In **Details → Game Media / App Icons / Cover**:
1. Upload icon (large + small if asked; small can be a scaled copy)
2. Upload cover / banner as required

---

## D. Switch app to Live

1. App dashboard top or **App settings → Basic** (or Publish flow).
2. Change mode from **Development** to **Live**.
3. Complete any prompts (privacy, category, contact email).
4. Confirm **Unpublished** badge is gone / status shows Live.

**Note:** If Meta asks for more review items, finish them; Instant Games requirements vary.

---

## E. Final smoke test (public path)

1. Open play link on **phone Facebook app** (not only Customize Play).
2. Play a full round.
3. My bests, Share score, freeze button (ads may still be no-fill).
4. Ask one friend (non-tester if Live) to open the link.

---

## F. Studio app (for every future game)

Use **Facebook Games Studio** for each new title:

| Studio page | Use for |
|-------------|---------|
| **Library** | App ID, status, notes |
| **FB Upload** | Zip path, version comment, **Copy ALL FB fields** |
| **Packs** | Info pack → game scaffold |
| Listing file | `games/<slug>/fb-listing.json` |

**Per-game Meta setup checklist (reuse forever):**
1. Create Instant Game use case only at app create  
2. Business: Apex Arcade Studio  
3. Monetization property = game name  
4. Rewarded placement → put ID in game  
5. Leaderboards optional later  
6. Zip upload + Details + Live  
7. Privacy HTML + icon + cover  

---

## G. Ads reality check

- Placement ID in build: `1593839865675820_1595058932220580`
- Fill can take time; desktop often has no ads
- Best test: mobile Facebook app after Production

---

## Done when

- [ ] Production = latest zip  
- [ ] Details filled (solo copy)  
- [ ] Icon + cover uploaded  
- [ ] Privacy URL works in browser  
- [ ] App **Live**  
- [ ] Play link works for a friend without tester role (if Live allows)
