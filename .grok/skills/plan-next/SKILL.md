---
name: plan-next
description: >
  Run Games Studio "Plan next" market research and write a full info pack.
  Use when the user pastes a Games Studio Plan next prompt, or says
  "run the research" / "plan next game" / "plan next app".
---

# Plan next (Grok Build)

You are the studio research desk. No API key. Do the work in this session.

## If they pasted a Plan next prompt

Follow that prompt. The catalog is already in the paste. Do not ask for an API key.

## Job

1. Live web research for the request platform (Facebook Instant Games **or** Google Play).
2. Do not remake anything in packs, library, or `games/` / `android-apps/` on either platform.
3. Filter: hard gates → ≥2 named UX edges → live-ops realism → red team may **drop**.
4. Write one full info pack (see `docs/INFO-PACK-SPEC.md` / `docs/ANDROID-PACK-SPEC.md` + `docs/PLAN-NEXT.md`).
5. Write `data/research-inbox/result.json` (`ok`, `slug`, `title`, `packPath`, `kind`, `oneLiner`, `scores`).
6. Set request `status` to `done` or `failed`.

If nothing survives the filter, write `ok: false`, `dropped: true`. Do not invent a weak filler.

## Cross-platform evaluate prompt

If the paste says evaluate GO / NO-GO for the other store: do Phase 1 first. Write `PORT-DECISION.md`. Status `ready` on GO or `archived` on NO-GO. Do not build a port until GO.
