export interface AppSettings {
  infoPacksPath: string;
  publishedGamesPath: string;
  gamesWorkspacePath: string;
  lastOpenedPackId: string | null;
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
  publishedAt?: string;
  updatedAt?: string;
  packPath?: string;
  workspacePath?: string;
  notes?: string;
  genre?: string;
  /** Copy-ready fields for developers.facebook Instant Games listing. */
  fbListing?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface StudioAPI {
  getSettings: () => Promise<AppSettings>;
  updateSettings: (partial: Partial<AppSettings>) => Promise<AppSettings>;
  pickFolder: () => Promise<string | null>;
  listPacks: () => Promise<{ packs: InfoPackSummary[]; error: string | null }>;
  getPackDetail: (
    packPath: string
  ) => Promise<{ pack: PackDetail | null; error: string | null }>;
  listLibrary: () => Promise<{ games: PublishedGame[]; error: string | null }>;
  /** Library + info packs + games/ folders merged for FB Upload page */
  listUploadTargets: () => Promise<{ games: PublishedGame[]; error: string | null }>;
  saveLibraryGame: (game: Partial<PublishedGame>) => Promise<PublishedGame>;
  openPath: (targetPath: string) => Promise<{ ok: boolean; error?: string; path?: string }>;
  showItemInFolder: (targetPath: string) => Promise<{ ok: boolean; error?: string; path?: string }>;
  /** Open Explorer with game.zip selected (Windows-reliable). */
  openZipHelper: (zipOrFolderPath: string) => Promise<{ ok: boolean; error?: string; path?: string }>;
  pathExists: (targetPath: string) => Promise<boolean>;
  getAppPaths: () => Promise<{ userData: string; projectRoot: string }>;
}
