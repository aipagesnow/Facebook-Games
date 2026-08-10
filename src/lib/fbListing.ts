import type { PublishedGame } from '../types/api';
import {
  formatUseCasesClipboard,
  resolveUseCases,
  type MetaUseCaseAdvice,
} from './fbUseCases';

/** Default Meta Business / studio name — reuse on every Instant Game Details form. */
export const DEFAULT_PUBLISHER = 'Apex Arcade Studio';

/** Default category label for Meta Details (Trivia & Word). */
export const DEFAULT_CATEGORY = 'Trivia and Word';

/** Meta Details Tagline hard limit (UI shows 40/40). Keep storeHook ≤ this. */
export const TAGLINE_MAX_CHARS = 40;

/** True if tagline fits Meta’s Details field. */
export function isTaglineValid(tagline: string): boolean {
  return (tagline || '').length > 0 && (tagline || '').length <= TAGLINE_MAX_CHARS;
}

/**
 * Suggest a short tagline for future games (fits Meta 40-char limit).
 * Prefer under 38 so punctuation isn’t tight.
 */
export function suggestShortTagline(genreHook: string): string {
  const base = (genreHook || 'Play free Instant Games').trim();
  if (base.length <= TAGLINE_MAX_CHARS) return base;
  return base.slice(0, TAGLINE_MAX_CHARS - 1).trimEnd() + '…';
}

/** Fields you paste into developers.facebook Instant Games listing / notes. */
export interface FbListing {
  title?: string;
  slug?: string;
  shortDescription?: string;
  longDescription?: string;
  /** Meta Details “Tagline” (also stored historically as storeHook). Max ~40 chars. */
  storeHook?: string;
  /** Meta Details “Publisher” — usually the Business / studio name. */
  publisher?: string;
  category?: string;
  orientation?: string;
  tags?: string[];
  featureBullets?: string[];
  privacyPolicyUrl?: string;
  /** Local path to privacy HTML before it is hosted publicly */
  privacyPolicyFile?: string;
  buildFolder?: string;
  /** Zip file path for Meta Web hosting → Upload Version */
  uploadZipPath?: string;
  /** Optional text for Meta "Version Comments" on Upload New Version */
  versionComment?: string;
  entryFile?: string;
  configFile?: string;
  zeroPermissions?: boolean;
  /** Connection experience: Zero Permissions (recommended for Instant Games) */
  connectionExperience?: string;
  /** Audience Network rewarded placement ID */
  rewardedPlacementId?: string;
  sdkNotes?: string;
  iconBrief?: string;
  coverBrief?: string;
  shareImageIdea?: string;
  videoBrief?: string;
  checklist?: string[];
  /** Per-game overrides for Meta Create app → Use cases */
  useCaseOverrides?: MetaUseCaseAdvice[];
  /** Resolved list (optional cache); prefer resolve via getUseCasesForListing */
  useCases?: MetaUseCaseAdvice[];
}

export function listingFromGame(game: PublishedGame): FbListing {
  const fromFile = (game.fbListing || {}) as FbListing;
  return {
    title: fromFile.title || game.title,
    slug: fromFile.slug || game.slug || game.id,
    shortDescription: fromFile.shortDescription || '',
    longDescription: fromFile.longDescription || '',
    storeHook: fromFile.storeHook || '',
    publisher: fromFile.publisher || DEFAULT_PUBLISHER,
    category: fromFile.category || DEFAULT_CATEGORY || game.genre || '',
    orientation: fromFile.orientation || 'PORTRAIT',
    tags: fromFile.tags || [],
    featureBullets: fromFile.featureBullets || [],
    privacyPolicyUrl: fromFile.privacyPolicyUrl || '',
    privacyPolicyFile: fromFile.privacyPolicyFile || '',
    buildFolder: fromFile.buildFolder || game.workspacePath || '',
    uploadZipPath:
      fromFile.uploadZipPath ||
      defaultUploadZipPath(fromFile.buildFolder || game.workspacePath || ''),
    versionComment:
      fromFile.versionComment ||
      defaultVersionComment(
        fromFile.title || game.title,
        fromFile.slug || game.slug || game.id
      ),
    entryFile: fromFile.entryFile || 'index.html',
    configFile: fromFile.configFile || 'fbapp-config.json',
    zeroPermissions: fromFile.zeroPermissions ?? true,
    connectionExperience:
      fromFile.connectionExperience || 'Zero permissions (recommended for Instant Games)',
    rewardedPlacementId: fromFile.rewardedPlacementId || '',
    sdkNotes: fromFile.sdkNotes || '',
    iconBrief: fromFile.iconBrief || '',
    coverBrief: fromFile.coverBrief || '',
    shareImageIdea: fromFile.shareImageIdea || '',
    videoBrief: fromFile.videoBrief || '',
    checklist: fromFile.checklist || [],
    useCaseOverrides: fromFile.useCaseOverrides || fromFile.useCases,
  };
}

export function getUseCasesForListing(listing: FbListing): MetaUseCaseAdvice[] {
  return resolveUseCases(listing.useCaseOverrides || listing.useCases);
}

/**
 * Convention: games/my-slug → games/game.zip (simple name Meta accepts easily).
 * Per-game override via fbListing.uploadZipPath when multiple titles share a folder.
 */
export function defaultUploadZipPath(buildFolder: string): string {
  if (!buildFolder) return '';
  const trimmed = buildFolder.replace(/[/\\]+$/, '');
  const sep = trimmed.includes('\\') ? '\\' : '/';
  const parts = trimmed.split(/[/\\]/);
  parts[parts.length - 1] = 'game.zip';
  return parts.join(sep);
}

export function defaultVersionComment(title?: string, slug?: string): string {
  const name = title || slug || 'Instant Game';
  const date = new Date().toISOString().slice(0, 10);
  return `v1.0 first upload — ${name} (${date}). Core HTML/JS Instant Game, Zero Permissions ready, portrait.`;
}

/** Parent folder of the zip (open this in Explorer for drag-and-drop). */
export function zipFolderPath(uploadZipPath: string): string {
  if (!uploadZipPath) return '';
  const normalized = uploadZipPath.replace(/[/\\]+$/, '');
  const idx = Math.max(normalized.lastIndexOf('\\'), normalized.lastIndexOf('/'));
  return idx >= 0 ? normalized.slice(0, idx) : normalized;
}

/** One clipboard paste with every FB field labeled — good for notes / form fill. */
export function formatListingClipboard(listing: FbListing, appId?: string): string {
  const bullets = (listing.featureBullets || []).map((b) => `• ${b}`).join('\n');
  const tags = (listing.tags || []).join(', ');
  const checklist = (listing.checklist || []).map((c, i) => `${i + 1}. ${c}`).join('\n');
  const useCasesText = formatUseCasesClipboard(getUseCasesForListing(listing));

  return [
    '=== Facebook Instant Games — listing copy pack ===',
    `Title: ${listing.title || ''}`,
    `Slug: ${listing.slug || ''}`,
    `App ID: ${appId || '(add after you create the app)'}`,
    `Publisher: ${listing.publisher || DEFAULT_PUBLISHER}`,
    `Category: ${listing.category || ''}`,
    `Orientation: ${listing.orientation || 'PORTRAIT'}`,
    `Tags: ${tags}`,
    `Zero Permissions: ${listing.zeroPermissions === false ? 'No' : 'Yes'}`,
    '',
    useCasesText,
    '',
    '--- Tagline (Meta Details, max ~40 chars) ---',
    listing.storeHook || '',
    '',
    '--- Short description ---',
    listing.shortDescription || '',
    '',
    '--- Long description ---',
    listing.longDescription || '',
    '',
    '--- Feature bullets ---',
    bullets,
    '',
    '--- Connection experience ---',
    listing.connectionExperience || 'Zero permissions',
    '',
    '--- Build upload ---',
    `Folder (source): ${listing.buildFolder || ''}`,
    `Upload ZIP (Meta Web hosting → Upload Version): ${listing.uploadZipPath || ''}`,
    `Version comment: ${listing.versionComment || ''}`,
    `Entry file: ${listing.entryFile || 'index.html'}`,
    `Config: ${listing.configFile || 'fbapp-config.json'}`,
    '',
    '--- Privacy ---',
    `Privacy policy URL: ${listing.privacyPolicyUrl || '(host HTML then paste public URL)'}`,
    `Privacy local file: ${listing.privacyPolicyFile || '(store-assets/privacy-….html)'}`,
    '',
    '--- Monetization ---',
    `Rewarded placement ID: ${listing.rewardedPlacementId || '(from Monetization Manager)'}`,
    '',
    '--- Discovery art briefs ---',
    `Icon: ${listing.iconBrief || ''}`,
    `Cover: ${listing.coverBrief || ''}`,
    `Share image: ${listing.shareImageIdea || ''}`,
    `Video: ${listing.videoBrief || ''}`,
    '',
    '--- SDK notes ---',
    listing.sdkNotes || '',
    '',
    '--- Upload checklist ---',
    checklist,
    '=== end ===',
  ].join('\n');
}
