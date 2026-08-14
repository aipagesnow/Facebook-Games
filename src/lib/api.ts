import type { StudioAPI } from '../types/api';

/**
 * Prefer Electron bridge when available.
 * In browser-only `npm run dev:web`, fall back to a limited demo API.
 */
function createWebFallback(): StudioAPI {
  const demoSettings = {
    infoPacksPath: '(set path in Electron app — Settings)',
    publishedGamesPath: '(set path in Electron app — Settings)',
    gamesWorkspacePath: '(set path in Electron app — Settings)',
    lastOpenedPackId: null as string | null,
    androidInfoPacksPath: '(set path in Electron app — Settings)',
    androidLibraryPath: '(set path in Electron app — Settings)',
    androidWorkspacePath: '(set path in Electron app — Settings)',
    activePlatform: 'facebook' as const,
    researchEngine: 'grok-build' as const,
    researchApiReady: false,
    researchApiMasked: '',
    researchApiFromEnv: false,
    grokBuildReady: false,
    grokBuildPath: '',
    researchReady: false,
  };

  return {
    getSettings: async () => demoSettings,
    updateSettings: async (partial) => ({ ...demoSettings, ...partial }),
    pickFolder: async () => null,
    listPacks: async () => ({
      packs: [],
      error:
        'Running in browser preview. Use `npm run dev` (Electron) to scan local info-pack folders.',
    }),
    getPackDetail: async () => ({
      pack: null,
      error: 'Pack detail requires Electron.',
    }),
    listLibrary: async () => ({ games: [], error: null }),
    listUploadTargets: async () => ({
      games: [],
      error:
        'Running in browser preview. Use Electron to load packs + library for Facebook / Play Console.',
    }),
    saveLibraryGame: async (game) => ({
      id: game.id || 'demo',
      title: game.title || 'Demo Game',
      ...game,
    }),
    openPath: async () => ({ ok: false, error: 'Requires Electron' }),
    showItemInFolder: async () => ({ ok: false, error: 'Requires Electron' }),
    openZipHelper: async () => ({
      ok: false,
      error: 'Requires Electron app (not browser preview)',
    }),
    pathExists: async () => false,
    getAppPaths: async () => ({ userData: '', projectRoot: '' }),
    setApiKey: async () => demoSettings,
    getResearchCatalog: async () => ({ items: [], error: null }),
    buildPlanPrompt: async () => ({
      ok: false,
      prompt: '',
      error: 'Building a Plan next prompt requires the Electron desktop app.',
    }),
    getResearchHistory: async () => ({ items: [] }),
    runResearch: async () => ({
      ok: false,
      error: 'Planning requires the Electron desktop app (not the browser preview).',
    }),
    cancelResearch: async () => ({ ok: false }),
    listShipBoards: async () => ({ boards: [], error: null }),
    saveShipBoard: async (board) => board,
    proposeCrossPlatform: async () => ({
      ok: false,
      error: 'Cross-platform propose requires the Electron desktop app.',
    }),
    updatePackStatus: async () => ({ ok: false, error: 'Requires Electron' }),
    deleteLibraryGame: async () => ({ ok: false, error: 'Requires Electron' }),
    pathStat: async () => ({ exists: false }),
    openExternal: async () => ({ ok: false, error: 'Requires Electron' }),
  };
}

export function getAPI(): StudioAPI {
  if (typeof window !== 'undefined' && window.fgs) {
    return window.fgs;
  }
  return createWebFallback();
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
