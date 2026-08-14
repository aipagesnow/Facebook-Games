import type { PublishedGame } from '../types/api';
import type { ProductKind } from '../platform/config';

/** Default developer / studio name — reuse on every Play listing. */
export const DEFAULT_DEVELOPER = 'Apex Arcade Studio';

/** Play Console app name. Current limit is 50; keep punchy. */
export const PLAY_TITLE_MAX = 50;

/** Play short description hard limit. */
export const PLAY_SHORT_MAX = 80;

/** Play full description hard limit. */
export const PLAY_FULL_MAX = 4000;

/** Release notes per language. */
export const PLAY_RELEASE_NOTES_MAX = 500;

export function isPlayTitleValid(title: string): boolean {
  return (title || '').length > 0 && (title || '').length <= PLAY_TITLE_MAX;
}

export function isPlayShortValid(text: string): boolean {
  return (text || '').length > 0 && (text || '').length <= PLAY_SHORT_MAX;
}

export type AndroidKind = ProductKind;
export type PlayTrack = 'internal' | 'closed' | 'open' | 'production';
export type AndroidWrapper = 'capacitor' | 'cordova' | 'twa' | 'native' | 'unity' | 'other';

/** Copy-ready Google Play Console fields the studio tracks. */
export interface AndroidListing {
  title?: string;
  slug?: string;
  kind?: AndroidKind;
  developer?: string;
  packageName?: string;
  applicationId?: string;
  playConsoleId?: string;
  versionName?: string;
  versionCode?: number | string;
  shortDescription?: string;
  fullDescription?: string;
  /** Store hook / promo line — keep ≤ 80 so it can double as short description. */
  storeHook?: string;
  defaultLanguage?: string;
  category?: string;
  tags?: string[];
  featureBullets?: string[];
  privacyPolicyUrl?: string;
  privacyPolicyFile?: string;
  contactEmail?: string;
  contactWebsite?: string;
  buildFolder?: string;
  /** Signed Android App Bundle for Play → Release → Production / testing tracks */
  uploadAabPath?: string;
  uploadApkPath?: string;
  releaseNotes?: string;
  track?: PlayTrack;
  entryFile?: string;
  wrapper?: AndroidWrapper;
  webSourceFolder?: string;
  minSdk?: string;
  targetSdk?: string;
  contentRating?: string;
  dataSafetyNotes?: string;
  adsDeclared?: boolean;
  targetAudience?: string;
  keystorePath?: string;
  keyAlias?: string;
  signingNotes?: string;
  admobAppId?: string;
  rewardedAdUnit?: string;
  playBilling?: boolean;
  iconBrief?: string;
  featureGraphicBrief?: string;
  screenshotBrief?: string;
  videoBrief?: string;
  promoVideoUrl?: string;
  checklist?: string[];
  sdkNotes?: string;
}

export function defaultPackageName(slug?: string): string {
  const compact = String(slug || 'app')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .replace(/^[0-9]+/, '');
  return `com.apexarcade.${compact || 'app'}`;
}

export function defaultAabPath(buildFolder: string): string {
  if (!buildFolder) return '';
  const trimmed = buildFolder.replace(/[/\\]+$/, '');
  const sep = trimmed.includes('\\') ? '\\' : '/';
  return `${trimmed}${sep}app-release.aab`;
}

export function defaultReleaseNotes(title?: string, versionName?: string): string {
  const name = title || 'Android title';
  const ver = versionName || '1.0';
  const date = new Date().toISOString().slice(0, 10);
  return `${ver} — first Play upload of ${name} (${date}). Portrait, signed AAB.`;
}

export function listingFromGame(game: PublishedGame): AndroidListing {
  const fromFile = (game.androidListing || {}) as AndroidListing;
  const slug = fromFile.slug || game.slug || game.id;
  const kind: AndroidKind = fromFile.kind || game.kind || 'game';
  return {
    title: fromFile.title || game.title,
    slug,
    kind,
    developer: fromFile.developer || DEFAULT_DEVELOPER,
    packageName: fromFile.packageName || fromFile.applicationId || game.packageName || defaultPackageName(slug),
    applicationId: fromFile.applicationId || fromFile.packageName || game.packageName || defaultPackageName(slug),
    playConsoleId: fromFile.playConsoleId || game.playConsoleId || '',
    versionName: fromFile.versionName || '1.0',
    versionCode: fromFile.versionCode ?? 1,
    shortDescription: fromFile.shortDescription || fromFile.storeHook || '',
    fullDescription: fromFile.fullDescription || '',
    storeHook: fromFile.storeHook || fromFile.shortDescription || '',
    defaultLanguage: fromFile.defaultLanguage || 'en-US',
    category: fromFile.category || game.genre || (kind === 'game' ? 'Word' : 'Tools'),
    tags: fromFile.tags || [],
    featureBullets: fromFile.featureBullets || [],
    privacyPolicyUrl: fromFile.privacyPolicyUrl || '',
    privacyPolicyFile: fromFile.privacyPolicyFile || '',
    contactEmail: fromFile.contactEmail || '',
    contactWebsite: fromFile.contactWebsite || '',
    buildFolder: fromFile.buildFolder || game.workspacePath || '',
    uploadAabPath: fromFile.uploadAabPath || defaultAabPath(fromFile.buildFolder || game.workspacePath || ''),
    uploadApkPath: fromFile.uploadApkPath || '',
    releaseNotes:
      fromFile.releaseNotes || defaultReleaseNotes(fromFile.title || game.title, fromFile.versionName),
    track: fromFile.track || 'internal',
    entryFile: fromFile.entryFile || 'index.html',
    wrapper: fromFile.wrapper || 'capacitor',
    webSourceFolder: fromFile.webSourceFolder || '',
    minSdk: fromFile.minSdk || '24',
    targetSdk: fromFile.targetSdk || '35',
    contentRating: fromFile.contentRating || '',
    dataSafetyNotes: fromFile.dataSafetyNotes || '',
    adsDeclared: fromFile.adsDeclared ?? true,
    targetAudience: fromFile.targetAudience || '',
    keystorePath: fromFile.keystorePath || '',
    keyAlias: fromFile.keyAlias || '',
    signingNotes: fromFile.signingNotes || 'Never store the keystore password in this repo.',
    admobAppId: fromFile.admobAppId || '',
    rewardedAdUnit: fromFile.rewardedAdUnit || '',
    playBilling: fromFile.playBilling ?? false,
    iconBrief: fromFile.iconBrief || '',
    featureGraphicBrief: fromFile.featureGraphicBrief || '',
    screenshotBrief: fromFile.screenshotBrief || '',
    videoBrief: fromFile.videoBrief || '',
    promoVideoUrl: fromFile.promoVideoUrl || '',
    checklist: fromFile.checklist || [],
    sdkNotes: fromFile.sdkNotes || '',
  };
}

export function artifactFolderPath(filePath: string): string {
  if (!filePath) return '';
  const normalized = filePath.replace(/[/\\]+$/, '');
  const idx = Math.max(normalized.lastIndexOf('\\'), normalized.lastIndexOf('/'));
  return idx >= 0 ? normalized.slice(0, idx) : normalized;
}

export function formatAndroidListingClipboard(listing: AndroidListing): string {
  const bullets = (listing.featureBullets || []).map((b) => `• ${b}`).join('\n');
  const tags = (listing.tags || []).join(', ');
  const checklist = (listing.checklist || []).map((c, i) => `${i + 1}. ${c}`).join('\n');

  return [
    '=== Google Play Console — listing copy pack ===',
    `Title: ${listing.title || ''}`,
    `Kind: ${listing.kind || 'game'}`,
    `Slug: ${listing.slug || ''}`,
    `Package name: ${listing.packageName || ''}`,
    `Play Console app ID: ${listing.playConsoleId || '(add after you create the app)'}`,
    `Developer: ${listing.developer || DEFAULT_DEVELOPER}`,
    `Category: ${listing.category || ''}`,
    `Default language: ${listing.defaultLanguage || 'en-US'}`,
    `Tags: ${tags}`,
    `Version: ${listing.versionName || '1.0'} (${listing.versionCode ?? 1})`,
    `Track: ${listing.track || 'internal'}`,
    `Wrapper: ${listing.wrapper || 'capacitor'}`,
    '',
    `--- Short description (max ${PLAY_SHORT_MAX}) ---`,
    listing.shortDescription || listing.storeHook || '',
    '',
    '--- Full description ---',
    listing.fullDescription || '',
    '',
    '--- Feature bullets ---',
    bullets,
    '',
    '--- Release ---',
    `AAB: ${listing.uploadAabPath || ''}`,
    `APK (optional sideload): ${listing.uploadApkPath || ''}`,
    `Release notes: ${listing.releaseNotes || ''}`,
    `minSdk: ${listing.minSdk || ''} · targetSdk: ${listing.targetSdk || ''}`,
    '',
    '--- Privacy / policy ---',
    `Privacy policy URL: ${listing.privacyPolicyUrl || '(host HTML then paste public URL)'}`,
    `Privacy local file: ${listing.privacyPolicyFile || ''}`,
    `Data safety: ${listing.dataSafetyNotes || ''}`,
    `Content rating: ${listing.contentRating || ''}`,
    `Ads declared: ${listing.adsDeclared === false ? 'No' : 'Yes'}`,
    `Contact email: ${listing.contactEmail || ''}`,
    `Website: ${listing.contactWebsite || ''}`,
    '',
    '--- Monetization ---',
    `Play Billing: ${listing.playBilling ? 'Yes' : 'No'}`,
    `AdMob app ID: ${listing.admobAppId || '(add after AdMob app)'}`,
    `Rewarded ad unit: ${listing.rewardedAdUnit || ''}`,
    '',
    '--- Signing ---',
    `Keystore: ${listing.keystorePath || '(keep offline / password manager)'}`,
    `Key alias: ${listing.keyAlias || ''}`,
    listing.signingNotes || '',
    '',
    '--- Discovery art briefs ---',
    `Icon: ${listing.iconBrief || ''}`,
    `Feature graphic: ${listing.featureGraphicBrief || ''}`,
    `Screenshots: ${listing.screenshotBrief || ''}`,
    `Video: ${listing.videoBrief || ''}`,
    `Promo YouTube: ${listing.promoVideoUrl || ''}`,
    '',
    '--- SDK / wrapper notes ---',
    listing.sdkNotes || '',
    '',
    '--- Play Console checklist ---',
    checklist,
    '=== end ===',
  ].join('\n');
}
