/**
 * Meta Instant Games → Details → Game Media slots.
 * Paths are under games/<slug>/store-assets/ (create this folder per game).
 */

export type MediaPriority = 'required' | 'optional';

export interface MediaSlot {
  id: string;
  /** Meta Game Media tab name */
  tab: string;
  /** Field name on Meta */
  label: string;
  priority: MediaPriority;
  /** Exact pixel size Meta expects */
  size: string;
  /** Suggested filename in store-assets/ */
  fileName: string;
  /** Short player-facing explanation for Chris */
  whatFor: string;
  /** How to create / what to put in the file */
  howTo: string;
}

/** All Game Media slots Meta shows (required first). */
export const META_MEDIA_SLOTS: MediaSlot[] = [
  {
    id: 'icon1024',
    tab: 'App Icons',
    label: 'App Icon',
    priority: 'required',
    size: '1024 × 1024',
    fileName: 'icon-1024.png',
    whatFor: 'Main game icon everywhere on Facebook / Gaming.',
    howTo:
      'Square PNG. Large simple shapes (e.g. gold letter tiles). High contrast. No tiny text. Must read clearly when scaled down.',
  },
  {
    id: 'icon16',
    tab: 'App Icons',
    label: 'Small App Icon',
    priority: 'required',
    size: '16 × 16',
    fileName: 'icon-16.png',
    whatFor: 'Tiny favicon-style icon Meta uses in some UI chrome.',
    howTo:
      'Do NOT just shrink the 1024 icon (it goes blurry). Draw a sharp pixel-style 16×16 PNG: solid navy background + 2–3 simple gold blocks matching the big icon. Crisp edges, no soft scaling.',
  },
  {
    id: 'cover',
    tab: 'Cover Images',
    label: 'Cover Image',
    priority: 'required',
    size: '1600 × 300',
    fileName: 'cover-1600x300.png',
    whatFor: 'Wide cover banner for the Instant Game listing.',
    howTo:
      'Wide PNG. Title + simple gameplay visual (letter tiles / seed word). Keep important content away from extreme edges.',
  },
  {
    id: 'banner1200',
    tab: 'Banner Images',
    label: 'Banner',
    priority: 'required',
    size: '1200 × 627',
    fileName: 'banner-1200x627.png',
    whatFor: 'Share / discovery banner (Facebook link previews often use this ratio).',
    howTo:
      'PNG ~1.91:1. Game name + one clear hook (e.g. “60s daily word ladder”). Avoid clutter.',
  },
  {
    id: 'previewLandscape',
    tab: 'Preview Videos',
    label: 'Landscape Game Preview Video',
    priority: 'required',
    size: '16:9 (e.g. 1920 × 1080)',
    fileName: 'preview-landscape-16x9.mp4',
    whatFor: 'Required trailer/preview Meta shows for the game.',
    howTo:
      'MP4, landscape 16:9, about 6–15 seconds. Can be a gentle zoom on a key art still, or a short screen capture of play. Keep under ~50MB if possible.',
  },
  {
    id: 'bannerLarge',
    tab: 'Banner Images',
    label: 'Large Landscape Banner',
    priority: 'optional',
    size: '1920 × 1080',
    fileName: 'landscape-1920x1080.png',
    whatFor: 'Optional larger banner for some surfaces.',
    howTo: 'Same style as the required banner, higher resolution. Nice to have, not blocking.',
  },
  {
    id: 'bannerPortrait',
    tab: 'Banner Images',
    label: 'Portrait Banner',
    priority: 'optional',
    size: '1080 × 1920',
    fileName: 'portrait-1080x1920.png',
    whatFor: 'Optional portrait promo art.',
    howTo: 'Phone-shaped 9:16. Logo + tiles. Skip if rushed.',
  },
  {
    id: 'bannerSquare',
    tab: 'Banner Images',
    label: 'Square Banner',
    priority: 'optional',
    size: '1080 × 1080',
    fileName: 'square-1080.png',
    whatFor: 'Optional square promo.',
    howTo: '1:1 square version of icon/cover style. Skip if rushed.',
  },
  {
    id: 'splashPortrait',
    tab: 'Splash Images',
    label: 'Portrait Splash',
    priority: 'optional',
    size: '1080 × 1920',
    fileName: 'portrait-1080x1920.png',
    whatFor: 'Optional splash/loading art.',
    howTo: 'Can reuse portrait banner. Not required for launch.',
  },
  {
    id: 'splashLandscape',
    tab: 'Splash Images',
    label: 'Landscape Splash',
    priority: 'optional',
    size: '1920 × 1080',
    fileName: 'landscape-1920x1080.png',
    whatFor: 'Optional landscape splash.',
    howTo: 'Can reuse large landscape banner. Not required for launch.',
  },
  {
    id: 'previewPortrait',
    tab: 'Preview Videos',
    label: 'Portrait Game Preview Video',
    priority: 'optional',
    size: '9:16',
    fileName: 'preview-portrait-9x16.mp4',
    whatFor: 'Optional phone-format preview video.',
    howTo: 'Same as landscape trailer but vertical. Skip unless you want mobile-native promo.',
  },
  {
    id: 'previewSquare',
    tab: 'Preview Videos',
    label: 'Square Game Preview Video',
    priority: 'optional',
    size: '1:1',
    fileName: 'preview-square-1x1.mp4',
    whatFor: 'Optional square preview video.',
    howTo: 'Optional. Skip for launch.',
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
  return META_MEDIA_SLOTS.filter((s) => s.priority === 'required');
}

export function optionalMediaSlots(): MediaSlot[] {
  return META_MEDIA_SLOTS.filter((s) => s.priority === 'optional');
}
