import type { PublishedGame } from '../types/api';
import {
  formatUseCasesClipboard,
  resolveUseCases,
  type MetaUseCaseAdvice,
} from './fbUseCases';

/** Fields you paste into developers.facebook Instant Games listing / notes. */
export interface FbListing {
  title?: string;
  slug?: string;
  shortDescription?: string;
  longDescription?: string;
  storeHook?: string;
  category?: string;
  orientation?: string;
  tags?: string[];
  featureBullets?: string[];
  privacyPolicyUrl?: string;
  buildFolder?: string;
  /** Zip file path for Meta Web hosting → Upload Version */
  uploadZipPath?: string;
  /** Optional text for Meta "Version Comments" on Upload New Version */
  versionComment?: string;
  entryFile?: string;
  configFile?: string;
  zeroPermissions?: boolean;
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
    category: fromFile.category || game.genre || '',
    orientation: fromFile.orientation || 'PORTRAIT',
    tags: fromFile.tags || [],
    featureBullets: fromFile.featureBullets || [],
    privacyPolicyUrl: fromFile.privacyPolicyUrl || '',
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
    `Category: ${listing.category || ''}`,
    `Orientation: ${listing.orientation || 'PORTRAIT'}`,
    `Tags: ${tags}`,
    `Zero Permissions: ${listing.zeroPermissions === false ? 'No' : 'Yes'}`,
    '',
    useCasesText,
    '',
    '--- Store hook ---',
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
    '--- Build upload ---',
    `Folder (source): ${listing.buildFolder || ''}`,
    `Upload ZIP (Meta Web hosting → Upload Version): ${listing.uploadZipPath || ''}`,
    `Version comment: ${listing.versionComment || ''}`,
    `Entry file: ${listing.entryFile || 'index.html'}`,
    `Config: ${listing.configFile || 'fbapp-config.json'}`,
    '',
    '--- Privacy policy URL ---',
    listing.privacyPolicyUrl || '(paste your URL)',
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
