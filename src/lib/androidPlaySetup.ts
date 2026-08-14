/**
 * Google Play Console create-app + launch setup guidance.
 * Labels match Play Console as of 2026.
 */

export type SetupPick = 'required' | 'recommended' | 'optional' | 'skip';

export interface PlaySetupStep {
  name: string;
  pick: SetupPick;
  why: string;
}

export const DEFAULT_PLAY_SETUP: PlaySetupStep[] = [
  {
    name: 'Create app — App or game',
    pick: 'required',
    why: 'Pick Game for playable titles, App for utilities. This switches Play categories and some policy forms. You cannot change it later.',
  },
  {
    name: 'Default language + app name',
    pick: 'required',
    why: 'en-US is the studio default. App name ≤ 50 characters (keep it punchy — this is the Play title).',
  },
  {
    name: 'Free or paid',
    pick: 'required',
    why: 'Apex Arcade titles are Free. Paid downloads cannot be switched to free later.',
  },
  {
    name: 'Declarations (Play policies / US export / news)',
    pick: 'required',
    why: 'Accept Play Developer Program policies. This is not a news app. Confirm the declarations that apply; do not invent a company if you are a sole prop.',
  },
  {
    name: 'Store listing (main)',
    pick: 'required',
    why: 'Short description (80), full description (4000), 512 icon, 1024×500 feature graphic, at least two phone screenshots.',
  },
  {
    name: 'App category + tags',
    pick: 'required',
    why: 'Games: Word / Puzzle / Trivia-style buckets. Apps: pick the real utility category (Tools, Productivity, etc.). Tags help discovery.',
  },
  {
    name: 'Privacy policy URL',
    pick: 'required',
    why: 'Public HTTPS page. Host the local HTML (GitHub Pages is fine) then paste the live URL into App content → Privacy policy.',
  },
  {
    name: 'App content — Data safety',
    pick: 'required',
    why: 'Declare what you collect. A local-only Capacitor game with ads must still declare AdMob / advertising ID if those SDKs are present.',
  },
  {
    name: 'App content — Ads declaration',
    pick: 'required',
    why: 'Yes if AdMob / any ads SDK ships. Must match Data safety.',
  },
  {
    name: 'App content — Content rating (IARC)',
    pick: 'required',
    why: 'Questionnaire. Casual word / puzzle with no user-generated chat usually rates Everyone / PEGI 3. Finish before production.',
  },
  {
    name: 'App content — Target audience',
    pick: 'required',
    why: '18+ (or 13+ if you truly designed for teens). Do not target children — that triggers Designed for Families rules you do not want for ad-supported games.',
  },
  {
    name: 'App content — News app',
    pick: 'skip',
    why: 'Not a news app.',
  },
  {
    name: 'App access / login credentials',
    pick: 'recommended',
    why: 'If any screen is behind a gate, provide a reviewer login. Local-only games with no login: state “no login required”.',
  },
  {
    name: 'Internal testing track',
    pick: 'recommended',
    why: 'Upload the first AAB to Internal testing, add your Gmail as a tester, install from the opt-in link. Do not jump to Production on v1.',
  },
  {
    name: 'Closed / open testing',
    pick: 'optional',
    why: 'Use if you want a wider pre-launch group. Skip for a solo first ship — Internal → Production is enough.',
  },
  {
    name: 'Production release',
    pick: 'required',
    why: 'After testers confirm install + core loop, promote the same AAB (or a newer versionCode) to Production. Complete the “Let us know when your app is ready” dashboard items first.',
  },
  {
    name: 'Play App Signing',
    pick: 'required',
    why: 'Let Google manage the app signing key. You keep the upload keystore. Back up the upload keystore offline — losing it blocks updates.',
  },
  {
    name: 'Play Games services',
    pick: 'optional',
    why: 'Leaderboards / achievements. Skip for v1 local personal-bests. Add later if you want Play-native social.',
  },
  {
    name: 'Play Billing / IAP',
    pick: 'optional',
    why: 'Only if you sell digital items. Ads-only titles skip this.',
  },
];

export function setupForKind(kind?: 'game' | 'app'): PlaySetupStep[] {
  if (kind === 'app') {
    return DEFAULT_PLAY_SETUP.map((step) => {
      if (step.name === 'Play Games services') {
        return {
          ...step,
          pick: 'skip' as const,
          why: 'Utility apps do not need Play Games services.',
        };
      }
      return step;
    });
  }
  return DEFAULT_PLAY_SETUP;
}

export function pickLabel(pick: SetupPick): string {
  if (pick === 'required') return 'Required';
  if (pick === 'recommended') return 'Recommended';
  if (pick === 'optional') return 'Optional';
  return 'Skip';
}

export function stepsToSelect(steps: PlaySetupStep[]): PlaySetupStep[] {
  return steps.filter((s) => s.pick !== 'skip');
}

export function formatPlaySetupClipboard(steps: PlaySetupStep[]): string {
  const lines = ['=== Play Console — create & launch setup ===', ''];
  for (const step of steps) {
    lines.push(`[${pickLabel(step.pick).toUpperCase()}] ${step.name}`);
    lines.push(`  ${step.why}`);
    lines.push('');
  }
  lines.push('=== end ===');
  return lines.join('\n');
}
