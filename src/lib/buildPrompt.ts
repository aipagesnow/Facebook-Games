import { otherPlatform, PLATFORM, type ProductKind, type StudioPlatform } from '../platform/config';
import type { PackManifest, PublishedGame } from '../types/api';
import { SHIP_ITEMS, type ShipItem } from './shipBoard';

export interface BuildPromptInput {
  platform: StudioPlatform;
  title: string;
  slug: string;
  kind?: ProductKind;
  oneLiner?: string;
  packPath?: string;
  workspacePath?: string;
  listingFile?: string;
  facebookAppId?: string;
  packageName?: string;
  genre?: string;
  inspiredBy?: string[];
  catalogSkip?: string[];
  sourcePlatform?: StudioPlatform;
  sourcePackPath?: string;
}

export function formatBuildPrompt(input: BuildPromptInput): string {
  const cfg = PLATFORM[input.platform];
  const kind = input.kind || 'game';
  const listing = input.listingFile || cfg.listingFile;
  const workspace =
    input.workspacePath ||
    (input.platform === 'android'
      ? `android-apps/${input.slug}`
      : `games/${input.slug}`);
  const skip = (input.catalogSkip || []).filter(Boolean);
  const checks = SHIP_ITEMS[input.platform].map((i, n) => `${n + 1}. ${i.label}`).join('\n');

  const lines = [
    input.platform === 'android'
      ? `Build this Android ${kind} from the studio info pack. Do the work in this Grok Build chat. No API key.`
      : 'Build this Facebook Instant Game from the studio info pack. Do the work in this Grok Build chat. No API key.',
    '',
    `Platform: ${input.platform === 'android' ? 'Google Play / Android' : 'Facebook Instant Games'}`,
    `Title: ${input.title}`,
    `Slug: ${input.slug}`,
    `Kind: ${kind}`,
    input.oneLiner ? `One-liner: ${input.oneLiner}` : '',
    input.genre ? `Genre: ${input.genre}` : '',
    input.inspiredBy?.length ? `Inspired by / improves on: ${input.inspiredBy.join(', ')}` : '',
    input.packPath ? `Pack path: ${input.packPath}` : '',
    `Workspace (create or update): ${workspace}`,
    `Listing file: ${workspace.replace(/[/\\]+$/, '')}/${listing}`,
    input.facebookAppId ? `Facebook App ID: ${input.facebookAppId}` : '',
    input.packageName ? `Package name: ${input.packageName}` : '',
    input.sourcePlatform
      ? `This title already exists on ${input.sourcePlatform}. Port the loop — do not invent a different game.`
      : '',
    input.sourcePackPath ? `Source pack: ${input.sourcePackPath}` : '',
    '',
    'Do NOT clone or reskin these existing studio titles:',
    skip.length ? skip.map((s) => `- ${s}`).join('\n') : '- (catalog empty)',
    '',
    input.platform === 'android'
      ? [
          'Android ship bar:',
          '- Unique title (not a clone). Capacitor wrap of HTML5 unless the pack says native.',
          '- android-listing.json + store-assets (512 icon, 1024×500 feature graphic, 2+ phone screenshots).',
          '- Signed AAB-ready project. Stub any FBInstant calls. Ads never interrupt the core verb.',
          '- Play Console: Game vs App is permanent — keep kind=' + kind + '.',
        ].join('\n')
      : [
          'Instant Games ship bar:',
          '- Unique game (not a clone). FBInstant lifecycle + one social path.',
          '- fb-listing.json + store-assets (required Meta sizes).',
          '- Zero Permissions, sub-3s load mindset, <30s teachable loop.',
          '- Upload zip as games/game.zip or the path in fb-listing.json.',
        ].join('\n'),
    '',
    'Read the pack docs first (README, pillars, monetization, discovery, live-ops, checklist).',
    '',
    'When you finish, the operator still needs this ship board:',
    checks,
  ];

  return lines.filter((l) => l !== '').join('\n');
}

export function formatPortEvaluationPrompt(input: {
  from: StudioPlatform;
  to: StudioPlatform;
  title: string;
  slug: string;
  kind?: ProductKind;
  oneLiner?: string;
  sourcePackPath: string;
  destPackPath: string;
  destWorkspace: string;
  catalogSkip?: string[];
}): string {
  const toCfg = PLATFORM[input.to];
  const kind = input.kind || 'game';
  const appOnFacebook = input.to === 'facebook' && kind === 'app';

  return [
    `I pasted this from Games Studio. Evaluate whether "${input.title}" should launch on ${toCfg.shortLabel} — or stay only on ${PLATFORM[input.from].shortLabel}.`,
    '',
    'Do this in two phases. Phase 1 is mandatory. Do not start a port until Phase 1 says GO.',
    '',
    'SOURCE (already shipping / building)',
    `- Platform: ${input.from}`,
    `- Title: ${input.title}`,
    `- Slug: ${input.slug}`,
    `- Kind: ${kind}`,
    input.oneLiner ? `- One-liner: ${input.oneLiner}` : '',
    `- Source pack: ${input.sourcePackPath}`,
    '',
    'DESTINATION (candidate only — not approved yet)',
    `- Platform: ${input.to} (${toCfg.productName})`,
    `- Candidate pack I already created: ${input.destPackPath}`,
    `- Would-be workspace: ${input.destWorkspace}`,
    `- Listing file would be: ${toCfg.listingFile}`,
    '',
    appOnFacebook
      ? 'WARNING: This is a utility APP. Facebook Instant Games are games only. Default is LEAVE-ON-PLAY unless you can honestly reshape it into a short-session Instant Game without becoming a different product.'
      : '',
    input.to === 'android' && kind === 'game'
      ? 'Play create-app Game vs App cannot be changed later. If this ports, it must be created as a Game.'
      : '',
    '',
    'PHASE 1 — is a second platform worth it?',
    'Live-research the destination market. Then decide GO or NO-GO.',
    '',
    'NO-GO if any of these are true:',
    '- The loop is a poor fit (e.g. Instant-only social/zero-perm, or Play-only utility).',
    '- You would have to change the core verb so much it is a different product.',
    '- Small-team cost of a second store + live-ops is worse than the upside.',
    '- A near-clone already dominates that store and we have no named UX edge.',
    '',
    'GO only if you can name ≥2 destination-specific reasons (discovery, session context, monetization, or distribution) AND the same core loop still works.',
    '',
    'Write the decision into DEST pack as PORT-DECISION.md (GO or NO-GO, with reasons and sources).',
    'Update dest pack.json status to `ready` on GO, or `archived` on NO-GO.',
    '',
    'PHASE 2 — only if GO',
    `Fill the rest of the dest pack for ${input.to} (platform-specific checklist, discovery sizes, monetization).`,
    'Then you may build. Do not invent a different game. Port the loop.',
    `Workspace: ${input.destWorkspace}`,
    '',
    'Existing studio titles (do not collide):',
    (input.catalogSkip || []).map((s) => `- ${s}`).join('\n') || '- (none)',
    '',
    'Reply in chat with: decision (GO / NO-GO), 3–6 reasons, and the dest pack path.',
  ]
    .filter((l) => l !== '')
    .join('\n');
}

export function catalogSkipLines(titles: string[]): string[] {
  return [...new Set(titles.filter(Boolean))];
}

export function shipLabels(platform: StudioPlatform): ShipItem[] {
  return SHIP_ITEMS[platform];
}

export function buildPromptFromPack(
  platform: StudioPlatform,
  packPath: string,
  manifest: PackManifest | null,
  extras?: { workspacePath?: string; facebookAppId?: string; packageName?: string; catalogSkip?: string[] }
): string {
  return formatBuildPrompt({
    platform,
    title: manifest?.title || manifest?.slug || 'Untitled',
    slug: String(manifest?.slug || manifest?.id || ''),
    kind: manifest?.kind,
    oneLiner: manifest?.oneLiner,
    packPath,
    workspacePath: extras?.workspacePath,
    listingFile: PLATFORM[platform].listingFile,
    facebookAppId: extras?.facebookAppId,
    packageName: extras?.packageName,
    genre: manifest?.genre,
    inspiredBy: manifest?.inspiredBy,
    catalogSkip: extras?.catalogSkip,
    sourcePlatform: manifest?.sourcePlatform,
    sourcePackPath: manifest?.sourcePackPath,
  });
}

export function buildPromptFromLibrary(
  platform: StudioPlatform,
  game: PublishedGame,
  catalogSkip?: string[]
): string {
  return formatBuildPrompt({
    platform,
    title: game.title,
    slug: game.slug || game.id,
    kind: game.kind,
    oneLiner: game.notes,
    packPath: game.packPath ? String(game.packPath) : undefined,
    workspacePath: game.workspacePath ? String(game.workspacePath) : undefined,
    listingFile: PLATFORM[platform].listingFile,
    facebookAppId: game.facebookAppId,
    packageName: game.packageName,
    genre: game.genre,
    catalogSkip,
    sourcePlatform: game.sourcePlatform as StudioPlatform | undefined,
    sourcePackPath: game.sourcePackPath ? String(game.sourcePackPath) : undefined,
  });
}

export { otherPlatform };
