export type StudioPlatform = 'facebook' | 'android';
export type ProductKind = 'game' | 'app';

export function isStudioPlatform(value: string | undefined | null): value is StudioPlatform {
  return value === 'facebook' || value === 'android';
}

export interface PlatformConfig {
  id: StudioPlatform;
  shortLabel: string;
  productName: string;
  brandMark: string;
  brandTitle: string;
  brandSub: string;
  windowTitle: string;
  navUpload: string;
  uploadTitle: string;
  uploadLead: string;
  storeName: string;
  storeUrlLabel: string;
  idLabel: string;
  idPlaceholder: string;
  workflow: string;
  workflowHint: string;
  libraryTitle: string;
  libraryLead: string;
  packsTitle: string;
  packsLead: string;
  dashboardLead: string;
  dashboardLibraryHint: string;
  emptyLibrary: string;
  emptyPacks: string;
  emptyUpload: string;
  grokVerb: string;
  sidebarFooter: string;
  listingFile: string;
  artifactLabel: string;
  openUploadLabel: string;
  planTitle: string;
  planLead: string;
  planButton: string;
}

export const PLATFORM: Record<StudioPlatform, PlatformConfig> = {
  facebook: {
    id: 'facebook',
    shortLabel: 'Facebook',
    productName: 'Instant Games',
    brandMark: 'IG',
    brandTitle: 'Games Studio',
    brandSub: 'Facebook Instant Games',
    windowTitle: 'Games Studio — Facebook',
    navUpload: 'FB Upload',
    uploadTitle: 'Facebook Instant Games upload',
    uploadLead:
      'Copy-ready fields for developers.facebook. Projects come from Library, info packs (ready / in production), and built folders under games/.',
    storeName: 'developers.facebook',
    storeUrlLabel: 'developers.facebook.com',
    idLabel: 'Facebook App ID',
    idPlaceholder: 'e.g. 1593839865675820',
    workflow: 'Pack → Build → FB',
    workflowHint: 'Copy pack path → paste into Grok → ship Instant Game',
    libraryTitle: 'Library',
    libraryLead:
      'Games you have published (or are tracking) on Facebook Instant Games. Keep App IDs, pack links, workspace paths, and one-click FB listing copy in one place.',
    packsTitle: 'Game info packs',
    packsLead:
      'Upcoming titles from your research pipeline. Open a pack, copy its path, and hand it to Grok to generate the Instant Game and Facebook market package.',
    dashboardLead:
      'Command center for Instant Games: pipeline info packs on the left of your workflow, published library on the right, and everything needed for developers.facebook.',
    dashboardLibraryHint: 'Published / tracked Instant Games',
    emptyLibrary: 'When you publish an Instant Game, add it here for quick access later.',
    emptyPacks:
      'Set the Facebook info packs folder in Settings, or use Plan next game to research and write the first pack.',
    emptyUpload:
      'Open an info pack that is ready or in-production, or add a game in Library after you build under games/<slug>/.',
    grokVerb: 'Build a Facebook Instant Game from this game info pack.',
    sidebarFooter: 'Local studio for research packs → build → developers.facebook Instant Games market.',
    listingFile: 'fb-listing.json',
    artifactLabel: 'Upload ZIP',
    openUploadLabel: 'Open FB Upload',
    planTitle: 'Plan next Instant Game',
    planLead:
      'Build a Grok Build prompt for the next Instant Game. The studio includes your existing catalog so we do not remake a title. Copy, paste into Grok Build on this project, and I do the research.',
    planButton: 'Plan next game',
  },
  android: {
    id: 'android',
    shortLabel: 'Android',
    productName: 'Play apps & games',
    brandMark: 'A',
    brandTitle: 'Games Studio',
    brandSub: 'Android · Google Play',
    windowTitle: 'Games Studio — Android',
    navUpload: 'Play Console',
    uploadTitle: 'Google Play Console upload',
    uploadLead:
      'Copy-ready fields for Play Console. Projects come from the Android Library, Android info packs (ready / in production), and built folders under android-apps/. Games and utility apps use the same pipeline.',
    storeName: 'Play Console',
    storeUrlLabel: 'play.google.com/console',
    idLabel: 'Package name',
    idPlaceholder: 'e.g. com.apexarcade.wordstreakduels',
    workflow: 'Pack → Build → Play',
    workflowHint: 'Copy pack path → paste into Grok → ship AAB to Play',
    libraryTitle: 'Android library',
    libraryLead:
      'Android games and apps you are tracking on Google Play. Keep package names, Play Console IDs, workspaces, and one-click store listing copy in one place.',
    packsTitle: 'Android info packs',
    packsLead:
      'Upcoming Android games and apps from your pipeline. Open a pack, copy its path, and hand it to Grok to generate the Android project plus Play Console market package.',
    dashboardLead:
      'Command center for Android: pipeline info packs, a library of games and apps, and everything needed to ship an AAB on Google Play.',
    dashboardLibraryHint: 'Tracked Play games and apps',
    emptyLibrary: 'When you start an Android game or app, add it here for Play Console copy and paths.',
    emptyPacks:
      'Set the Android info packs folder in Settings, or use Plan next app/game to research and write the first pack.',
    emptyUpload:
      'Open an Android info pack that is ready or in-production, or add a game/app in Library after you build under android-apps/<slug>/.',
    grokVerb: 'Build an Android game or app from this info pack for Google Play.',
    sidebarFooter: 'Local studio for research packs → Android build → Google Play Console.',
    listingFile: 'android-listing.json',
    artifactLabel: 'Release AAB',
    openUploadLabel: 'Open Play Console',
    planTitle: 'Plan next Android app / game',
    planLead:
      'Build a Grok Build prompt for the next Android game or app. The studio includes your existing catalog so we do not remake a title. Copy, paste into Grok Build on this project, and I do the research.',
    planButton: 'Plan next app/game',
  },
};

export function otherPlatform(platform: StudioPlatform): StudioPlatform {
  return platform === 'facebook' ? 'android' : 'facebook';
}
