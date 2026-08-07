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
    saveLibraryGame: async (game) => ({
      id: game.id || 'demo',
      title: game.title || 'Demo Game',
      ...game,
    }),
    openPath: async () => ({ ok: false, error: 'Requires Electron' }),
    showItemInFolder: async () => ({ ok: false, error: 'Requires Electron' }),
    pathExists: async () => false,
    getAppPaths: async () => ({ userData: '', projectRoot: '' }),
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
