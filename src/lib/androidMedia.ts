/**
 * Google Play Console → Main store listing graphics.
 * Paths are under android-apps/<slug>/store-assets/ (create this folder per title).
 */

export type MediaPriority = 'required' | 'optional';

export interface MediaSlot {
  id: string;
  /** Play Console section */
  tab: string;
  label: string;
  priority: MediaPriority;
  size: string;
  fileName: string;
  whatFor: string;
  howTo: string;
}

export const PLAY_MEDIA_SLOTS: MediaSlot[] = [
  {
    id: 'icon512',
    tab: 'Store listing',
    label: 'High-res icon',
    priority: 'required',
    size: '512 × 512',
    fileName: 'icon-512.png',
    whatFor: 'Play Store icon on phones, tablets, and web Play.',
    howTo:
      'Square PNG, 32-bit with alpha allowed. Large simple shapes, high contrast, no tiny text. Do not use the Facebook 1024 icon uncropped if it has extra chrome — Play wants a tight 512 mark.',
  },
  {
    id: 'feature',
    tab: 'Store listing',
    label: 'Feature graphic',
    priority: 'required',
    size: '1024 × 500',
    fileName: 'feature-1024x500.png',
    whatFor: 'Wide promo banner at the top of the Play listing and in ads surfaces.',
    howTo:
      'PNG or JPEG. Title + one clear gameplay or product visual. Keep text in the safe center — edges get cropped on some devices.',
  },
  {
    id: 'phone1',
    tab: 'Phone screenshots',
    label: 'Phone screenshot 1',
    priority: 'required',
    size: '16:9 or 9:16 (min 320px, max 3840px)',
    fileName: 'phone-screenshot-1.png',
    whatFor: 'First screenshot in the Play store carousel — the most important store image after the icon.',
    howTo:
      'Show the core loop in one frame (game: seed + tiles + timer; app: primary screen). JPEG or 24-bit PNG. Minimum two phone screenshots required.',
  },
  {
    id: 'phone2',
    tab: 'Phone screenshots',
    label: 'Phone screenshot 2',
    priority: 'required',
    size: '16:9 or 9:16 (min 320px, max 3840px)',
    fileName: 'phone-screenshot-2.png',
    whatFor: 'Second required phone screenshot.',
    howTo: 'Show a second beat: end screen / share / settings / a key feature. Same size family as screenshot 1.',
  },
  {
    id: 'phone3',
    tab: 'Phone screenshots',
    label: 'Phone screenshot 3',
    priority: 'optional',
    size: '16:9 or 9:16',
    fileName: 'phone-screenshot-3.png',
    whatFor: 'Optional extra phone screenshot.',
    howTo: 'Streak, shop, or onboarding if it sells the product. Skip if rushed.',
  },
  {
    id: 'phone4',
    tab: 'Phone screenshots',
    label: 'Phone screenshot 4',
    priority: 'optional',
    size: '16:9 or 9:16',
    fileName: 'phone-screenshot-4.png',
    whatFor: 'Optional extra phone screenshot.',
    howTo: 'Skip if rushed.',
  },
  {
    id: 'sevenInch',
    tab: '7-inch tablet',
    label: '7-inch tablet screenshot',
    priority: 'optional',
    size: '16:9 or 9:16',
    fileName: 'tablet-7-screenshot-1.png',
    whatFor: 'Tablet listing art. Required only if you claim 7-inch tablet support.',
    howTo: 'Capture on a 7-inch-class layout or letterbox the phone UI cleanly. Skip if phone-only.',
  },
  {
    id: 'tenInch',
    tab: '10-inch tablet',
    label: '10-inch tablet screenshot',
    priority: 'optional',
    size: '16:9 or 9:16',
    fileName: 'tablet-10-screenshot-1.png',
    whatFor: 'Large tablet listing art.',
    howTo: 'Skip if phone-only.',
  },
];

export function storeAssetsDir(buildFolder: string): string {
  if (!buildFolder) return '';
  const trimmed = buildFolder.replace(/[/\\]+$/, '');
  const sep = trimmed.includes('\\') ? '\\' : '/';
  return `${trimmed}${sep}store-assets`;
}

export function mediaFilePath(buildFolder: string, fileName: string): string {
  const dir = storeAssetsDir(buildFolder);
  if (!dir || !fileName) return '';
  const sep = dir.includes('\\') ? '\\' : '/';
  return `${dir}${sep}${fileName}`;
}

export function requiredMediaSlots(): MediaSlot[] {
  return PLAY_MEDIA_SLOTS.filter((s) => s.priority === 'required');
}

export function optionalMediaSlots(): MediaSlot[] {
  return PLAY_MEDIA_SLOTS.filter((s) => s.priority === 'optional');
}
