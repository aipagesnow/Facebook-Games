import type { MediaSlot } from './fbMedia';

export function formatAssetPrompt(opts: {
  title: string;
  slot: Pick<MediaSlot, 'label' | 'size' | 'fileName' | 'howTo' | 'whatFor'>;
  extraBrief?: string;
  platform: 'facebook' | 'android';
}): string {
  const studio = 'Apex Arcade Studio — premium casual, deep navy + gold, flat lighting, no tiny text';
  return [
    `Create a ${opts.platform === 'android' ? 'Google Play' : 'Facebook Instant Games'} store asset.`,
    `Game/app title: ${opts.title}`,
    `Asset: ${opts.slot.label}`,
    `Exact size: ${opts.slot.size}`,
    `Save as: ${opts.slot.fileName}`,
    `Use: ${opts.slot.whatFor}`,
    opts.extraBrief ? `Art brief: ${opts.extraBrief}` : '',
    `How to make it: ${opts.slot.howTo}`,
    `Style: ${studio}. Large simple shapes, high contrast, readable when small.`,
    'No watermarks, no extra UI chrome, no unreadable micro-text.',
  ]
    .filter(Boolean)
    .join('\n');
}
