/**
 * Meta "Create an app → Use cases" picker guidance for Instant Games.
 * Labels match the developers.facebook.com creation UI as of 2026-08.
 */

export type UseCasePick = 'required' | 'recommended' | 'optional' | 'skip';

export interface MetaUseCaseAdvice {
  /** Exact (or near-exact) title on Meta's use-case list */
  name: string;
  pick: UseCasePick;
  why: string;
}

/** Default Instant Games path — used when a game has no custom overrides. */
export const DEFAULT_INSTANT_GAME_USE_CASES: MetaUseCaseAdvice[] = [
  {
    name: 'Launch an Instant Game on Facebook and Messenger',
    pick: 'required',
    why: 'This is the product you are shipping. Always select this for every Instant Game app. On Meta’s create form this often greys out incompatible use cases — that is expected.',
  },
  {
    name: 'Advertise on your app with Meta Audience Network',
    pick: 'skip',
    why: 'Usually greyed out once Instant Game is selected (incompatible at create time). Do not uncheck Instant Game to force this. Rewarded ads / Audience Network for Instant Games are set up later inside the Instant Games product on the app dashboard, not on this use-case step.',
  },
  {
    name: 'Authenticate and request data from users with Facebook Login',
    pick: 'skip',
    why: 'New Instant Games should use Zero Permissions — not classic Facebook Login. Login adds friction and the wrong connection path.',
  },
  {
    name: 'Create & manage ads with Marketing API',
    pick: 'skip',
    why: 'For running Facebook ad campaigns as an advertiser API, not for shipping the Instant Game itself.',
  },
  {
    name: 'Create & manage app ads with Meta Ads Manager',
    pick: 'skip',
    why: 'Mobile app install ads for native apps — not Instant Games host setup.',
  },
  {
    name: 'Measure ad performance data with Marketing API',
    pick: 'skip',
    why: 'Advertiser analytics stack — not needed to create the Instant Game app.',
  },
  {
    name: 'Capture & manage ad leads with Marketing API',
    pick: 'skip',
    why: 'Lead gen for businesses — not Instant Games.',
  },
  {
    name: 'Access the Threads API',
    pick: 'skip',
    why: 'Threads social API — unrelated to Instant Games.',
  },
  {
    name: 'Create & manage ads with ads MCP server',
    pick: 'skip',
    why: 'Ads tooling for agents/advertisers — not game host.',
  },
  {
    name: 'Manage products with Catalog API',
    pick: 'skip',
    why: 'Product catalogs / shops — not Instant Games.',
  },
  {
    name: 'Allow users to transfer their data to other apps',
    pick: 'skip',
    why: 'Data portability product — not needed for Instant Games v1.',
  },
  {
    name: 'Engage with customers on Messenger from Meta',
    pick: 'skip',
    why: 'Business Page Messenger bots — Instant Games already live inside Messenger without this use case.',
  },
  {
    name: 'Share or create fundraisers on Facebook and Instagram',
    pick: 'skip',
    why: 'Fundraising — not games.',
  },
  {
    name: 'Manage messaging & content on Instagram',
    pick: 'skip',
    why: 'Instagram creator/business tools — not Instant Games.',
  },
  {
    name: 'Access the Live Video API',
    pick: 'skip',
    why: 'Live streaming API — not Instant Games.',
  },
  {
    name: 'Embed Facebook, Instagram and Threads content in other websites',
    pick: 'skip',
    why: 'oEmbed for websites — not Instant Games.',
  },
  {
    name: 'Manage everything on your Page',
    pick: 'skip',
    why: 'Page management API — not Instant Games host.',
  },
  {
    name: 'Join ThreatExchange',
    pick: 'skip',
    why: 'Security signal sharing — not games.',
  },
  {
    name: 'Connect with customers through WhatsApp',
    pick: 'skip',
    why: 'WhatsApp Business — not Instant Games on Facebook/Messenger.',
  },
  {
    name: 'Create an app without a use case',
    pick: 'skip',
    why: 'Empty shell. You want Instant Games product attached from day one.',
  },
  {
    name: 'Other',
    pick: 'skip',
    why: 'Legacy path Meta is retiring. Do not use for new Instant Games.',
  },
];

export function pickLabel(pick: UseCasePick): string {
  switch (pick) {
    case 'required':
      return 'SELECT — required';
    case 'recommended':
      return 'SELECT — recommended';
    case 'optional':
      return 'Optional';
    case 'skip':
      return 'Do not select';
  }
}

export function useCasesToSelect(list: MetaUseCaseAdvice[]): MetaUseCaseAdvice[] {
  return list.filter((u) => u.pick === 'required' || u.pick === 'recommended' || u.pick === 'optional');
}

export function formatUseCasesClipboard(list: MetaUseCaseAdvice[]): string {
  const select = useCasesToSelect(list);
  const skip = list.filter((u) => u.pick === 'skip');
  return [
    '=== Meta Create app → Use cases (Instant Games) ===',
    '',
    'SELECT these checkboxes:',
    ...select.map((u) => `☑ ${u.name}\n   (${pickLabel(u.pick)}) ${u.why}`),
    '',
    'Leave unchecked (skip):',
    ...skip.map((u) => `☐ ${u.name}`),
    '',
    'Tip: Filter “Featured” is fine — Instant Game is on that list. Audience Network is under All / Ads.',
    '=== end ===',
  ].join('\n');
}

/**
 * Merge per-game overrides (by exact name) on top of Instant Games defaults.
 * Games that only need Instant Game (no ads) can set Audience Network to skip.
 */
export function resolveUseCases(
  overrides?: Partial<MetaUseCaseAdvice>[] | MetaUseCaseAdvice[] | null
): MetaUseCaseAdvice[] {
  const base = DEFAULT_INSTANT_GAME_USE_CASES.map((u) => ({ ...u }));
  if (!overrides?.length) return base;

  for (const o of overrides) {
    if (!o?.name) continue;
    const idx = base.findIndex((b) => b.name.toLowerCase() === o.name!.toLowerCase());
    if (idx >= 0) {
      base[idx] = { ...base[idx], ...o, name: base[idx].name };
    } else {
      base.push({
        name: o.name,
        pick: o.pick || 'optional',
        why: o.why || 'Custom for this game.',
      });
    }
  }
  return base;
}
