# developers.facebook Instant Games — upload checklist

## App setup

- [ ] Create app / Instant Games product on developers.facebook.com
- [ ] Configure Instant Games host URLs / bundle upload
- [ ] Zero Permissions / network-enabled zero permissions readiness (SDK v8+)
- [ ] App icon 1024×1024 uploaded
- [ ] Cover image 1600×300 uploaded
- [ ] Category + description + privacy policy URL

## Build quality

- [ ] `FBInstant.initializeAsync` + `startGameAsync` correct
- [ ] Loading progress updates
- [ ] Works in embedded player / Instant Games environment
- [ ] No blocking custom login
- [ ] Sub-3s target on mid mobile (measure)
- [ ] Bundle size reviewed; progressive loading for heavy assets

## Social / platform features

- [ ] At least one social path live (share, invite, context update, or leaderboard)
- [ ] Context entry handled (solo vs challenge)
- [ ] Score posting if using leaderboards/tournaments

## Monetization (if used)

- [ ] Audience Network / ads placement approved
- [ ] Rewarded placements only on intentional moments
- [ ] IAP products configured if shipping paid items

## Review hygiene

- [ ] No crashes on cold start
- [ ] Clear content rating
- [ ] No misleading store art
- [ ] Localization plan if claiming multi-language
