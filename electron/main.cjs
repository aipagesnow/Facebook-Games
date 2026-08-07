const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');

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
      const data = JSON.parse(await fsp.readFile(filePath, 'utf8'));
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

ipcMain.handle('library:save', async (_e, game) => {
  const settings = await readSettings();
  await fsp.mkdir(settings.publishedGamesPath, { recursive: true });
  const id = game.id || game.slug || `game-${Date.now()}`;
  const filePath = path.join(settings.publishedGamesPath, `${id}.json`);
  const payload = {
    ...game,
    id,
    updatedAt: new Date().toISOString(),
  };
  await fsp.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8');
  return payload;
});

ipcMain.handle('shell:openPath', async (_e, targetPath) => {
  if (!(await pathExists(targetPath))) {
    return { ok: false, error: 'Path does not exist' };
  }
  const err = await shell.openPath(targetPath);
  return err ? { ok: false, error: err } : { ok: true };
});

ipcMain.handle('shell:showItem', async (_e, targetPath) => {
  if (!(await pathExists(targetPath))) {
    return { ok: false, error: 'Path does not exist' };
  }
  shell.showItemInFolder(targetPath);
  return { ok: true };
});

ipcMain.handle('fs:exists', async (_e, targetPath) => pathExists(targetPath));

ipcMain.handle('app:getPaths', async () => ({
  userData: getDataDir(),
  projectRoot: path.join(__dirname, '..'),
}));
