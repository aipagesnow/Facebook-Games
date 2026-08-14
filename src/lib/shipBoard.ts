import type { StudioPlatform } from '../platform/config';

export interface ShipItem {
  id: string;
  label: string;
  hint?: string;
}

export const SHIP_ITEMS: Record<StudioPlatform, ShipItem[]> = {
  facebook: [
    { id: 'zip', label: 'Production zip uploaded (Upload Version, not Debug)', hint: 'games/game.zip or listing uploadZipPath' },
    { id: 'details', label: 'Instant Games Details text (title, tagline ≤40, short + long)' },
    { id: 'media', label: 'Required Game Media on Meta (icon 1024, 16×16, cover, banner, landscape preview)' },
    { id: 'privacy', label: 'Privacy policy HTTPS URL live in Details' },
    { id: 'zeroPerms', label: 'Zero Permissions confirmed' },
    { id: 'bv', label: 'Business verification approved (or not required)' },
    { id: 'review', label: 'App Review items complete' },
    { id: 'live', label: 'App published / Live' },
    { id: 'playtest', label: 'Play link tested on mobile Facebook app' },
    { id: 'ads', label: 'Rewarded placement tested (fill on mobile)' },
    { id: 'library', label: 'App ID saved in Studio Library' },
  ],
  android: [
    { id: 'kind', label: 'Play app created as Game or App (cannot change later)' },
    { id: 'package', label: 'Package name reserved / applicationId set' },
    { id: 'listing', label: 'Store listing text (name, short ≤80, full description)' },
    { id: 'graphics', label: '512 icon + 1024×500 feature graphic + 2 phone screenshots' },
    { id: 'privacy', label: 'Privacy policy HTTPS URL in Play' },
    { id: 'dataSafety', label: 'Data safety form complete' },
    { id: 'adsDecl', label: 'Ads declaration matches SDKs' },
    { id: 'iarc', label: 'IARC content rating complete' },
    { id: 'audience', label: 'Target audience set (not Designed for Families unless you mean it)' },
    { id: 'aab', label: 'Signed AAB on Internal testing' },
    { id: 'tester', label: 'Tester install from opt-in link works' },
    { id: 'production', label: 'Promoted to Production' },
    { id: 'library', label: 'Package name saved in Android Library' },
  ],
};

export interface ShipBoard {
  slug: string;
  platform: StudioPlatform;
  title: string;
  checks: Record<string, boolean>;
  notes?: string;
  updatedAt?: string;
}

export function emptyChecks(platform: StudioPlatform): Record<string, boolean> {
  const next: Record<string, boolean> = {};
  for (const item of SHIP_ITEMS[platform]) next[item.id] = false;
  return next;
}

export function boardProgress(board: ShipBoard | null | undefined, platform: StudioPlatform): {
  done: number;
  total: number;
  pct: number;
} {
  const items = SHIP_ITEMS[platform];
  const checks = board?.checks || {};
  const done = items.filter((i) => checks[i.id]).length;
  const total = items.length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}
