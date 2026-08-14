import type { StudioPlatform, ProductKind } from '../platform/config';

export interface AppSettings {
  infoPacksPath: string;
  publishedGamesPath: string;
  gamesWorkspacePath: string;
  lastOpenedPackId: string | null;
  androidInfoPacksPath: string;
  androidLibraryPath: string;
  androidWorkspacePath: string;
  activePlatform: StudioPlatform;
  researchModel?: string;
  /** True when a key is stored or XAI_API_KEY is in the environment. */
  researchEngine?: 'grok-build' | 'api';
  researchApiReady?: boolean;
  researchApiMasked?: string;
  researchApiFromEnv?: boolean;
  grokBuildReady?: boolean;
  grokBuildPath?: string;
  researchReady?: boolean;
}

export interface PackManifest {
  id?: string;
  title?: string;
  slug?: string;
  status?: 'candidate' | 'ready' | 'in-production' | 'published' | 'archived';
  genre?: string;
  oneLiner?: string;
  inspiredBy?: string[];
  targetAudience?: string;
  createdAt?: string;
  scores?: Record<string, number>;
  pillars?: Record<string, string>;
  tags?: string[];
  /** facebook Instant Game, android Play title, or both */
  platforms?: StudioPlatform[];
  /** Android (and future stores): game vs utility/app */
  kind?: ProductKind;
  generatedBy?: string;
  relationshipToCatalog?: 'new' | 'better-version';
  sourcePlatform?: StudioPlatform;
  sourcePackPath?: string;
  siblingSlug?: string;
  parseError?: string;
  [key: string]: unknown;
}

export interface InfoPackSummary {
  id: string;
  folderName: string;
  absolutePath: string;
  manifest: PackManifest | null;
  mtimeMs: number;
  hasSkeleton: boolean;
  hasReadme: boolean;
}

export interface PackDetail {
  absolutePath: string;
  manifest: PackManifest | null;
  files: Record<string, string>;
  skeletonFiles: string[];
}

export interface PublishedGame {
  id: string;
  filePath?: string;
  title: string;
  slug?: string;
  status?: string;
  facebookAppId?: string;
  /** Android applicationId / Play package name */
  packageName?: string;
  /** Optional numeric Play Console app id */
  playConsoleId?: string;
  kind?: ProductKind;
  publishedAt?: string;
  updatedAt?: string;
  packPath?: string;
  workspacePath?: string;
  notes?: string;
  genre?: string;
  /** Copy-ready fields for developers.facebook Instant Games listing. */
  fbListing?: Record<string, unknown>;
  /** Copy-ready fields for Google Play Console. */
  androidListing?: Record<string, unknown>;
  sourcePlatform?: StudioPlatform;
  sourcePackPath?: string;
  [key: string]: unknown;
}

export interface StudioAPI {
  getSettings: () => Promise<AppSettings>;
  updateSettings: (partial: Partial<AppSettings>) => Promise<AppSettings>;
  pickFolder: () => Promise<string | null>;
  listPacks: (
    platform?: StudioPlatform
  ) => Promise<{ packs: InfoPackSummary[]; error: string | null }>;
  getPackDetail: (
    packPath: string
  ) => Promise<{ pack: PackDetail | null; error: string | null }>;
  listLibrary: (
    platform?: StudioPlatform
  ) => Promise<{ games: PublishedGame[]; error: string | null }>;
  /** Library + info packs + workspace folders merged for FB Upload / Play Console */
  listUploadTargets: (
    platform?: StudioPlatform
  ) => Promise<{ games: PublishedGame[]; error: string | null }>;
  saveLibraryGame: (
    game: Partial<PublishedGame>,
    platform?: StudioPlatform
  ) => Promise<PublishedGame>;
  openPath: (targetPath: string) => Promise<{ ok: boolean; error?: string; path?: string }>;
  showItemInFolder: (targetPath: string) => Promise<{ ok: boolean; error?: string; path?: string }>;
  /** Open Explorer with game.zip / AAB / APK selected (Windows-reliable). */
  openZipHelper: (zipOrFolderPath: string) => Promise<{ ok: boolean; error?: string; path?: string }>;
  pathExists: (targetPath: string) => Promise<boolean>;
  getAppPaths: () => Promise<{ userData: string; projectRoot: string }>;
  setApiKey: (key: string) => Promise<AppSettings>;
  getResearchCatalog: () => Promise<{ items: CatalogItem[]; error: string | null }>;
  buildPlanPrompt: (options: ResearchOptions) => Promise<PlanPromptResult>;
  getResearchHistory: (
    platform?: StudioPlatform
  ) => Promise<{ items: ResearchRun[] }>;
  runResearch: (options: ResearchOptions) => Promise<ResearchResult>;
  cancelResearch?: () => Promise<{ ok: boolean }>;
  onResearchProgress?: (handler: (entry: ResearchLogEntry) => void) => () => void;
  listShipBoards: (
    platform?: StudioPlatform
  ) => Promise<{ boards: ShipBoardRecord[]; error: string | null }>;
  saveShipBoard: (board: ShipBoardRecord) => Promise<ShipBoardRecord>;
  proposeCrossPlatform: (input: CrossProposeInput) => Promise<CrossProposeResult>;
  updatePackStatus: (
    packPath: string,
    status: string
  ) => Promise<{ ok: boolean; error?: string; status?: string }>;
  deleteLibraryGame: (
    id: string,
    platform?: StudioPlatform
  ) => Promise<{ ok: boolean; error?: string }>;
  pathStat: (
    targetPath: string
  ) => Promise<{ exists: boolean; mtimeMs?: number; size?: number; isFile?: boolean }>;
  openExternal: (url: string) => Promise<{ ok: boolean; error?: string }>;
}

export interface ShipBoardRecord {
  slug: string;
  platform: StudioPlatform;
  title: string;
  checks: Record<string, boolean>;
  notes?: string;
  nextAction?: string;
  nextActionDate?: string;
  updatedAt?: string;
  status?: string;
  kind?: ProductKind;
  packPath?: string;
  packFolderName?: string;
  siblingPlatform?: StudioPlatform;
  siblingPackFolder?: string;
}

export interface CrossProposeInput {
  fromPlatform: StudioPlatform;
  packPath: string;
}

export interface CrossProposeResult {
  ok: boolean;
  error?: string;
  alreadyExists?: boolean;
  destPlatform?: StudioPlatform;
  destPackPath?: string;
  destFolderName?: string;
  prompt?: string;
  title?: string;
}

export interface CatalogItem {
  slug: string;
  title: string;
  kind: ProductKind;
  platform: StudioPlatform;
  status: string;
  source: string;
  oneLiner?: string;
  tags?: string[];
  coreLoop?: string;
}

export interface ResearchLogEntry {
  at: string;
  phase: string;
  message: string;
  pct?: number;
}

export interface ResearchOptions {
  platform: StudioPlatform;
  mode?: 'prefer-new' | 'allow-sequel';
  kind?: 'auto' | ProductKind;
}

export interface PlanPromptResult {
  ok: boolean;
  prompt: string;
  promptPath?: string;
  requestId?: string;
  platform?: StudioPlatform;
  mode?: string;
  kind?: string;
  packsRoot?: string;
  catalogCount?: number;
  error?: string;
}

export interface ResearchRun {
  id: string;
  at: string;
  platform: StudioPlatform;
  mode?: string;
  kind?: string;
  ok: boolean;
  dropped?: boolean;
  dropReason?: string;
  slug?: string;
  title?: string;
  packPath?: string;
  status?: string;
  oneLiner?: string;
  productKind?: ProductKind;
}

export interface ResearchResult {
  ok: boolean;
  dropped?: boolean;
  error?: string;
  packPath?: string;
  slug?: string;
  folderName?: string;
  title?: string;
  status?: string;
  kind?: ProductKind;
  oneLiner?: string;
  scores?: Record<string, number>;
  candidates?: Array<Record<string, unknown>>;
  research?: Record<string, unknown>;
  log?: ResearchLogEntry[];
}
