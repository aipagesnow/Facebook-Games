# Apex Arcade Studio — Meta Business Verification fill-out guide

**Business portfolio:** Apex Arcade Studio  
**Business ID:** `1711577450147604`  
**Why:** Unlocks App Review → Publish (Live) for Instant Games (Word Streak Duels first).  
**Screen you have:** Security Centre → **Eligible for verification** → **Start verification** → intro modal **Get started**

> Meta runs this wizard in *your* browser. This doc tells you exactly what to pick and type.  
> **Never invent legal details.** Every field must match real documents (personal is fine for sole / indie).

---

## Indie / solo developer path (no company, first game)

**Yes, you can fill this out correctly.** Meta does not require a registered Ltd/LLC for Business Verification. Thousands of freelancers and first-time game makers verify as a **sole proprietor / individual**.

### Mental model

| Concept | What you use |
|---------|----------------|
| **Portfolio / brand** (already set) | Apex Arcade Studio — fine to keep |
| **Legal business name** | **Your real legal name** (passport / driving licence / bank) |
| **Business type** | Sole proprietorship / individual / not registered company (whatever Meta lists that matches “just me”) |
| **Address** | Your real home / mailing address (on a bill) |
| **Phone** | Your real mobile (you will get a code) |
| **Email** | Your real email |
| **Website** | A free HTTPS page we can host (GitHub Pages) — not “no website” |

### What *not* to do

- Do **not** invent a company registration that doesn’t exist.  
- Do **not** put “Apex Arcade Studio” as **legal** name unless that exact string is on bank/tax/official paper.  
- Do **not** use a fake address or someone else’s documents.  
- Do **not** leave website blank or paste a dead link.

### Documents that usually work for solo indies

Meta’s list is “businessy,” but for sole traders the practical set is:

| Need | Typical solo doc |
|------|------------------|
| Prove **you** (legal name) | Passport / national ID / driving licence (when Meta asks for ID path), **or** bank statement / tax letter in **your** name |
| Prove **address** | Utility bill, council tax, internet/phone bill, bank statement — **your name + same address** |
| Prove **phone** | Same bill if the number is listed, or SMS code during the wizard |

**Utility bill alone** is usually accepted for **address/phone**, not always for legal name. Pair it with a bank statement or government ID if the wizard allows.

If Meta never finds you in a company database → choose **My business isn’t listed** / **None of these match**. That is **normal** for indies.

---

## Before you click Start verification

### 1. Confirm the use-case dropdown (on the Security Centre card)

| Field | Value to use |
|-------|----------------|
| **Select your verification use case** | **App requires access to permissions on Meta for Developers** |

That matches Instant Games / developer app access. Leave it as shown in your screenshot.

### 2. Ignore (for now) the other Security Centre warnings

These do **not** block business verification or shipping:

| Item | Action now |
|------|------------|
| No trusted domains added to peer approval | Skip |
| 1 user without passkey enabled | Optional later |
| Add another admin | Optional (nice for lockout recovery) |
| Peer approval / domain security | Optional |

Green items already done (peer approval on ad accounts, full control limited) — good.

### 3. Gather documents **before** you start

Meta accepts (pick what you actually have). Documents must show **legal business name** and ideally **address** / **phone** matching what you type.

| Document type | Good for | Notes |
|---------------|----------|--------|
| Certificate / Articles of Incorporation | Legal name | Registered companies |
| Business registration / licence | Legal name | Companies House (UK), state registration (US), etc. |
| Government-issued business tax document | Legal name | **Not** self-filed DIY returns alone |
| Business bank statement | Name + address / phone | Recent, clear letterhead |
| Utility bill | **Address and/or phone only** | Must still match legal name when used with name proof |

**Formats:** PDF, JPG, or PNG. Clear, full page, not cropped weirdly, not expired where dates matter.

**Sole trader / trading as Apex Arcade Studio?**  
- Legal name = **your personal legal name** (or registered sole-trader name on tax docs), **not** only the brand unless the brand is on official paperwork.  
- You can usually keep the portfolio display name as Apex Arcade Studio; verification cares about **legal entity name**.  
- If Apex Arcade Studio is **not** on any official paper yet, verify as yourself / your real registered entity, then keep using Apex Arcade Studio as publisher brand in Instant Games Details.

### 4. Website (HTTPS required) — GitHub Pages studio site

We ship a small real-looking studio site under `docs/`:

| Page | Local file | Live URL (after Pages enabled) |
|------|------------|--------------------------------|
| Studio home | `docs/index.html` | `https://aipagesnow.github.io/Facebook-Games/` |
| Privacy | `docs/privacy-word-streak-duels.html` | `https://aipagesnow.github.io/Facebook-Games/privacy-word-streak-duels.html` |

**Meta Business verification → Website field:** use the studio home URL.  
**Instant Games Details → Privacy policy URL:** use the privacy URL.

#### Enable GitHub Pages (one-time)

1. Push latest `docs/` to `main` on https://github.com/aipagesnow/Facebook-Games  
2. GitHub → **Settings → Pages**  
3. **Build and deployment → Source:** Deploy from a branch  
4. **Branch:** `main` · **Folder:** `/docs` · **Save**  
5. Wait 1–2 minutes, then open the studio home URL in a private/incognito window  

Preview locally anytime: open `docs/index.html` in a browser.

---

## Wizard walkthrough (click by click)

### Step A — Start

1. Open [Security Centre](https://business.facebook.com/settings/security) (you are already there).  
2. Under **Business verification**, keep use case as above.  
3. Click **Start verification**.

### Step B — Country / business type

| Field | What to enter |
|-------|----------------|
| **Country** | Country where the **legal** business is registered / you operate from |
| **Business type** | Match reality, e.g. Company / LLC / Sole proprietorship / Partnership |

### Step C — Organisation details (critical)

| Field | Recommended value | Notes |
|-------|-------------------|--------|
| **Legal business name** | Exact name on registration / tax / bank | Must match documents letter-for-letter (Ltd vs Limited, Inc., etc.) |
| **Address** | Real registered / business mailing address | Must match a document if Meta asks for address proof |
| **City / state / postcode** | As on documents | |
| **Phone** | Real number you control | Prefer business line; personal is OK for sole trader if on a bill |
| **Website** | Live `https://…` URL | See website section above |
| **Email** | Real inbox you check | Prefer non-generic if possible (`you@domain`); Gmail can work |

**Display / brand name** (if asked separately): `Apex Arcade Studio`  
**Legal name** (if different): your registered entity or personal legal name.

### Step D — “Is this your business?” list

Meta may search public databases and show matches.

- If you see **your** correct legal entity → select it.  
- If nothing matches → **My business isn’t listed** / **None of these match**.  
- Then Meta will ask for document upload — normal for new/small studios.

### Step E — Confirm you are connected to the business

Pick any method you can complete quickly:

| Method | When to use |
|--------|-------------|
| **Email** | Code to the email you entered |
| **Phone / SMS / WhatsApp** | Code to the phone you entered |
| **Domain verification** | You control DNS / can add meta tag on the website |

Finish the code / domain step, then **Done**.

### Step F — Document upload (if asked)

Upload **1–3** clear documents that together prove:

1. **Legal name** matches what you typed.  
2. **Address and/or phone** match what you typed.

Common winning combo for a small studio:

- Business registration **or** tax certificate (name), **plus**  
- Bank statement or utility bill (name + address/phone).

Wait for the green confirmation that submission was received.

---

## After you submit

| Item | Expectation |
|------|-------------|
| Review time | Often hours–a few days; Meta says up to **~14 business days** |
| Notification | In Meta Business Suite + email |
| If **Verified** | Go straight to App Review → Publish Word Streak Duels |
| If **Rejected** | Read the reason; fix details/docs; resubmit (do not spam resubmits) |

### Ship path after BV is green

1. [developers.facebook.com](https://developers.facebook.com) → **Word Streak Duels**  
2. Finish any **App Review** items  
3. **Publish** (app currently **Unpublished**)  
4. Confirm privacy URL is live in Instant Games **Details**  
5. Friend test: https://www.facebook.com/gaming/play/1593839865675820/

---

## Copy-paste constants (project)

```
Business portfolio:     Apex Arcade Studio
Business portfolio ID:  1711577450147604
Publisher (every game): Apex Arcade Studio
App:                    Word Streak Duels
App ID:                 1593839865675820
Privacy file:           docs/privacy-word-streak-duels.html
Planned privacy URL:    https://aipagesnow.github.io/Facebook-Games/privacy-word-streak-duels.html
Repo:                   https://github.com/aipagesnow/Facebook-Games
```

---

## Fill-in sheet (you complete privately — do not commit secrets)

```
Country:                 ________________
Business type:           ________________
Legal business name:     ________________  (exact on docs)
Trading / brand name:    Apex Arcade Studio
Street address:          ________________
City:                    ________________
State/region:            ________________
Postcode:                ________________
Phone (+country code):   ________________
Website (https):         ________________
Contact email:           ________________
Primary document:        ________________  (type + file ready)
Secondary document:      ________________  (optional but recommended)
```

---

## Red flags that cause rejection

- Legal name does not match documents  
- Address/phone only on a personal bill under a different name  
- Website is dead, `http://` only, or a blank page with no business signal  
- Edited / fake / expired documents  
- Someone else’s company documents  
- Mismatched country vs registration

---

## Related project docs

- `docs/SESSION-HANDOFF.md` — overall ship status  
- `docs/LAUNCH-WALKTHROUGH.md` — Instant Games Details + Live  
- `docs/privacy-word-streak-duels.html` — host this next if website empty  
