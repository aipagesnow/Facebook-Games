const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const { spawn } = require('child_process');

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);
const DEFAULT_SETTINGS = {
  infoPacksPath: '',
  publishedGamesPath: '',
  gamesWorkspacePath: '',
  lastOpenedPackId: null,
};

function getDataDir() {
  return path.join(app.getPath('userData'), 'facebook-games-studio');
}

function getSettingsPath() {
  return path.join(getDataDir(), 'settings.json');
}

async function ensureDataDir() {
  await fsp.mkdir(getDataDir(), { recursive: true });
}

async function readSettings() {
  await ensureDataDir();
  const settingsPath = getSettingsPath();
  try {
    const raw = await fsp.readFile(settingsPath, 'utf8');
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // Seed defaults relative to project when running from source
    const projectRoot = path.join(__dirname, '..');
    const seeded = {
      ...DEFAULT_SETTINGS,
      infoPacksPath: path.join(projectRoot, 'info-packs'),
      publishedGamesPath: path.join(projectRoot, 'data', 'library'),
      gamesWorkspacePath: path.join(projectRoot, 'games'),
    };
    await fsp.writeFile(settingsPath, JSON.stringify(seeded, null, 2), 'utf8');
    return seeded;
  }
}

async function writeSettings(partial) {
  const current = await readSettings();
  const next = { ...current, ...partial };
  await fsp.writeFile(getSettingsPath(), JSON.stringify(next, null, 2), 'utf8');
  return next;
}

async function pathExists(p) {
  try {
    await fsp.access(p);
    return true;
  } catch {
    return false;
  }
}

async function listInfoPacks(rootDir) {
  if (!(await pathExists(rootDir))) {
    return { packs: [], error: `Info packs folder not found: ${rootDir}` };
  }

  const entries = await fsp.readdir(rootDir, { withFileTypes: true });
  const packs = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('.')) continue;

    const packPath = path.join(rootDir, entry.name);
    const manifestPath = path.join(packPath, 'pack.json');
    let manifest = null;

    if (await pathExists(manifestPath)) {
      try {
        manifest = JSON.parse(await fsp.readFile(manifestPath, 'utf8'));
      } catch (err) {
        manifest = { parseError: String(err) };
      }
    }

    let mtimeMs = 0;
    try {
      const stat = await fsp.stat(packPath);
      mtimeMs = stat.mtimeMs;
    } catch {
      /* ignore */
    }

    packs.push({
      id: entry.name,
      folderName: entry.name,
      absolutePath: packPath,
      manifest,
      mtimeMs,
      hasSkeleton: await pathExists(path.join(packPath, 'skeleton')),
      hasReadme: await pathExists(path.join(packPath, 'README.md')),
    });
  }

  packs.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return { packs, error: null };
}

function parseJsonLoose(raw) {
  const text = String(raw || '').replace(/^\uFEFF/, '').trim();
  return JSON.parse(text);
}

async function listPublishedGames(rootDir) {
  if (!(await pathExists(rootDir))) {
    await fsp.mkdir(rootDir, { recursive: true });
    return { games: [], error: null };
  }

  const entries = await fsp.readdir(rootDir, { withFileTypes: true });
  const games = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
    const filePath = path.join(rootDir, entry.name);
    try {
      const data = parseJsonLoose(await fsp.readFile(filePath, 'utf8'));
      games.push({
        id: path.basename(entry.name, '.json'),
        filePath,
        ...data,
      });
    } catch {
      /* skip corrupt entries */
    }
  }

  games.sort((a, b) => {
    const da = a.publishedAt || a.updatedAt || '';
    const db = b.publishedAt || b.updatedAt || '';
    return db.localeCompare(da);
  });

  return { games, error: null };
}

async function readPackDetail(packPath) {
  if (!(await pathExists(packPath))) {
    return { error: 'Pack path does not exist', pack: null };
  }

  const files = {};
  const candidates = [
    'pack.json',
    'README.md',
    'PILLARS.md',
    'MONETIZATION.md',
    'DISCOVERY.md',
    'LIVEOPS.md',
    'AUDIENCE.md',
    'FILTER-DECISION.md',
    'UPLOAD-CHECKLIST.md',
  ];

  for (const name of candidates) {
    const full = path.join(packPath, name);
    if (await pathExists(full)) {
      files[name] = await fsp.readFile(full, 'utf8');
    }
  }

  let skeletonFiles = [];
  const skeletonDir = path.join(packPath, 'skeleton');
  if (await pathExists(skeletonDir)) {
    const walk = async (dir, prefix = '') => {
      const list = await fsp.readdir(dir, { withFileTypes: true });
      for (const item of list) {
        const rel = prefix ? `${prefix}/${item.name}` : item.name;
        if (item.isDirectory()) {
          await walk(path.join(dir, item.name), rel);
        } else {
          skeletonFiles.push(rel);
        }
      }
    };
    await walk(skeletonDir);
  }

  let manifest = null;
  if (files['pack.json']) {
    try {
      manifest = JSON.parse(files['pack.json']);
    } catch (err) {
      manifest = { parseError: String(err) };
    }
  }

  return {
    error: null,
    pack: {
      absolutePath: packPath,
      manifest,
      files,
      skeletonFiles,
    },
  };
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    title: 'Facebook Games Studio',
    backgroundColor: '#0b0f14',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// --- IPC ---

ipcMain.handle('settings:get', async () => readSettings());

ipcMain.handle('settings:update', async (_e, partial) => writeSettings(partial));

ipcMain.handle('dialog:pickFolder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory'],
  });
  if (result.canceled || !result.filePaths[0]) return null;
  return result.filePaths[0];
});

ipcMain.handle('packs:list', async () => {
  const settings = await readSettings();
  return listInfoPacks(settings.infoPacksPath);
});

ipcMain.handle('packs:detail', async (_e, packPath) => readPackDetail(packPath));

ipcMain.handle('library:list', async () => {
  const settings = await readSettings();
  return listPublishedGames(settings.publishedGamesPath);
});

/**
 * Library games + info packs (ready / in-production / published) merged for FB Upload.
 * Pulls fb-listing.json from games/<slug> when present so packs show upload fields.
 */
ipcMain.handle('upload:listTargets', async () => {
  const settings = await readSettings();
  const lib = await listPublishedGames(settings.publishedGamesPath);
  const packRes = await listInfoPacks(settings.infoPacksPath);
  const byId = new Map();

  for (const g of lib.games) {
    byId.set(g.id, { ...g, source: g.source || 'library' });
  }

  for (const pack of packRes.packs || []) {
    const m = pack.manifest || {};
    const status = m.status || 'candidate';
    if (!['ready', 'in-production', 'published'].includes(status) && !m.slug) {
      // still include if game folder exists
    }
    const slug = m.slug || m.id || pack.folderName;
    const id = slug;
    const workspacePath = path.join(settings.gamesWorkspacePath || '', slug);
    const hasGame = await pathExists(workspacePath);
    const include =
      hasGame ||
      ['ready', 'in-production', 'published'].includes(status) ||
      byId.has(id);

    if (!include) continue;

    let fbListing = null;
    const listingPath = path.join(workspacePath, 'fb-listing.json');
    if (await pathExists(listingPath)) {
      try {
        fbListing = parseJsonLoose(await fsp.readFile(listingPath, 'utf8'));
      } catch {
        fbListing = null;
      }
    }

    const zipCandidate = path.join(settings.gamesWorkspacePath || '', 'game.zip');
    const zipAlt = `${workspacePath}-upload.zip`;
    let uploadZipPath = (fbListing && fbListing.uploadZipPath) || '';
    if (!uploadZipPath) {
      if (await pathExists(zipCandidate)) uploadZipPath = zipCandidate;
      else if (await pathExists(zipAlt)) uploadZipPath = zipAlt;
      else uploadZipPath = zipCandidate;
    }

    const existing = byId.get(id);
    const synthesized = {
      id,
      title: m.title || existing?.title || pack.folderName,
      slug,
      status: existing?.status || status,
      genre: m.genre || existing?.genre,
      packPath: pack.absolutePath,
      workspacePath: hasGame ? workspacePath : existing?.workspacePath || '',
      facebookAppId: existing?.facebookAppId || '',
      notes: existing?.notes || m.oneLiner || '',
      source: existing ? 'library+pack' : hasGame ? 'pack+game' : 'pack',
      packFolderName: pack.folderName,
      fbListing: {
        title: m.title,
        slug,
        shortDescription: m.oneLiner || '',
        longDescription: m.oneLiner || '',
        storeHook: m.oneLiner || '',
        category: m.genre || '',
        orientation: 'PORTRAIT',
        tags: m.tags || [],
        featureBullets: m.pillars
          ? Object.values(m.pillars).filter(Boolean).slice(0, 5)
          : [],
        buildFolder: hasGame ? workspacePath : '',
        uploadZipPath,
        entryFile: 'index.html',
        configFile: 'fbapp-config.json',
        zeroPermissions: true,
        ...(existing?.fbListing || {}),
        ...(fbListing || {}),
        buildFolder:
          (fbListing && fbListing.buildFolder) ||
          (existing?.fbListing && existing.fbListing.buildFolder) ||
          (hasGame ? workspacePath : existing?.workspacePath || ''),
        uploadZipPath:
          (fbListing && fbListing.uploadZipPath) ||
          (existing?.fbListing && existing.fbListing.uploadZipPath) ||
          uploadZipPath,
      },
    };

    byId.set(id, existing ? { ...synthesized, ...existing, fbListing: synthesized.fbListing, packPath: pack.absolutePath, packFolderName: pack.folderName, workspacePath: synthesized.workspacePath || existing.workspacePath } : synthesized);
  }

  const games = Array.from(byId.values()).sort((a, b) =>
    String(a.title || '').localeCompare(String(b.title || ''))
  );
  return {
    games,
    error: lib.error || packRes.error || null,
  };
});

ipcMain.handle('library:save', async (_e, game) => {
  const settings = await readSettings();
  await fsp.mkdir(settings.publishedGamesPath, { recursive: true });
  const id = game.id || game.slug || `game-${Date.now()}`;
  const filePath = path.join(settings.publishedGamesPath, `${id}.json`);
  let existing = {};
  try {
    existing = parseJsonLoose(await fsp.readFile(filePath, 'utf8'));
  } catch {
    /* new entry */
  }
  const payload = {
    ...existing,
    ...game,
    id,
    updatedAt: new Date().toISOString(),
  };
  await fsp.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8');
  return payload;
});

function normalizeFsPath(targetPath) {
  if (!targetPath || typeof targetPath !== 'string') return '';
  // Fix accidental double-escaping from copy/paste or JSON quirks
  let p = targetPath.trim().replace(/\\\\/g, '\\');
  try {
    p = path.normalize(p);
  } catch {
    /* keep cleaned string */
  }
  return p;
}

async function openInExplorer(targetPath, { selectFile = false } = {}) {
  const p = normalizeFsPath(targetPath);
  if (!p) return { ok: false, error: 'Empty path' };
  if (!(await pathExists(p))) {
    return { ok: false, error: `Path does not exist: ${p}` };
  }

  // Windows: explorer.exe is the most reliable (Electron shell can fail or open behind)
  if (process.platform === 'win32') {
    try {
      if (selectFile) {
        // Note: no space after /select, — required by explorer
        spawn('explorer.exe', [`/select,${p}`], {
          detached: true,
          stdio: 'ignore',
        }).unref();
      } else {
        const dir = (await fsp.stat(p)).isDirectory() ? p : path.dirname(p);
        spawn('explorer.exe', [dir], {
          detached: true,
          stdio: 'ignore',
        }).unref();
      }
      return { ok: true, path: p };
    } catch (err) {
      return { ok: false, error: String(err && err.message ? err.message : err) };
    }
  }

  if (selectFile) {
    shell.showItemInFolder(p);
    return { ok: true, path: p };
  }
  const err = await shell.openPath(p);
  return err ? { ok: false, error: err } : { ok: true, path: p };
}

ipcMain.handle('shell:openPath', async (_e, targetPath) => openInExplorer(targetPath, { selectFile: false }));

ipcMain.handle('shell:showItem', async (_e, targetPath) =>
  openInExplorer(targetPath, { selectFile: true })
);

/** Always open the folder that contains the zip (or the path itself if a folder). */
ipcMain.handle('shell:openZipHelper', async (_e, zipOrFolderPath) => {
  const p = normalizeFsPath(zipOrFolderPath);
  if (!p) return { ok: false, error: 'No zip path configured' };

  // If file missing, try sibling Desktop game.zip / games folder fallbacks
  const candidates = [p];
  if (p.toLowerCase().endsWith('.zip')) {
    candidates.push(path.join(path.dirname(p), 'game.zip'));
    candidates.push(path.join(app.getPath('desktop'), 'game.zip'));
  }
  const projectGames = path.join(__dirname, '..', 'games', 'game.zip');
  candidates.push(projectGames);

  let found = null;
  for (const c of candidates) {
    if (c && (await pathExists(c))) {
      found = c;
      break;
    }
  }
  if (!found) {
    // Open games folder even if zip missing
    const gamesDir = path.join(__dirname, '..', 'games');
    if (await pathExists(gamesDir)) {
      return openInExplorer(gamesDir, { selectFile: false });
    }
    return {
      ok: false,
      error: `Could not find game.zip. Tried: ${candidates.filter(Boolean).join(' | ')}`,
    };
  }
  return openInExplorer(found, { selectFile: true });
});

ipcMain.handle('fs:exists', async (_e, targetPath) => pathExists(targetPath));

ipcMain.handle('app:getPaths', async () => ({
  userData: getDataDir(),
  projectRoot: path.join(__dirname, '..'),
}));
