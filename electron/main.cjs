const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const { spawn } = require('child_process');
const { createResearchController, maskKey, resolveApiKey, loadDotEnv, findGrokExe } = require('./research.cjs');
const { proposeCrossPlatform } = require('./crossPlatform.cjs');

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);
const DEFAULT_SETTINGS = {
  infoPacksPath: '',
  publishedGamesPath: '',
  gamesWorkspacePath: '',
  lastOpenedPackId: null,
  xaiApiKey: '',
  researchModel: 'grok-4.6',
  researchEngine: 'grok-build',
  androidInfoPacksPath: '',
  androidLibraryPath: '',
  androidWorkspacePath: '',
  activePlatform: 'facebook',
};

function normalizePlatform(value) {
  return value === 'android' ? 'android' : 'facebook';
}

function pathsFor(settings, platform) {
  const p = normalizePlatform(platform);
  if (p === 'android') {
    return {
      platform: p,
      packs: settings.androidInfoPacksPath,
      library: settings.androidLibraryPath,
      workspace: settings.androidWorkspacePath,
      listingFile: 'android-listing.json',
    };
  }
  return {
    platform: p,
    packs: settings.infoPacksPath,
    library: settings.publishedGamesPath,
    workspace: settings.gamesWorkspacePath,
    listingFile: 'fb-listing.json',
  };
}

function getDataDir() {
  return path.join(app.getPath('userData'), 'facebook-games-studio');
}

function getSettingsPath() {
  return path.join(getDataDir(), 'settings.json');
}

async function ensureDataDir() {
  await fsp.mkdir(getDataDir(), { recursive: true });
}

function withProjectDefaults(settings) {
  const projectRoot = path.join(__dirname, '..');
  const next = { ...settings };
  if (!next.infoPacksPath) next.infoPacksPath = path.join(projectRoot, 'info-packs');
  if (!next.publishedGamesPath) next.publishedGamesPath = path.join(projectRoot, 'data', 'library');
  if (!next.gamesWorkspacePath) next.gamesWorkspacePath = path.join(projectRoot, 'games');
  if (!next.androidInfoPacksPath) next.androidInfoPacksPath = path.join(projectRoot, 'android-packs');
  if (!next.androidLibraryPath) next.androidLibraryPath = path.join(projectRoot, 'data', 'android-library');
  if (!next.androidWorkspacePath) next.androidWorkspacePath = path.join(projectRoot, 'android-apps');
  if (!next.activePlatform) next.activePlatform = 'facebook';
  return next;
}

async function readSettings() {
  await ensureDataDir();
  const settingsPath = getSettingsPath();
  try {
    const raw = await fsp.readFile(settingsPath, 'utf8');
    return withProjectDefaults({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
  } catch {
    // Seed defaults relative to project when running from source
    const projectRoot = path.join(__dirname, '..');
    const seeded = {
      ...DEFAULT_SETTINGS,
      infoPacksPath: path.join(projectRoot, 'info-packs'),
      publishedGamesPath: path.join(projectRoot, 'data', 'library'),
      gamesWorkspacePath: path.join(projectRoot, 'games'),
      androidInfoPacksPath: path.join(projectRoot, 'android-packs'),
      androidLibraryPath: path.join(projectRoot, 'data', 'android-library'),
      androidWorkspacePath: path.join(projectRoot, 'android-apps'),
    };
    await fsp.writeFile(settingsPath, JSON.stringify(seeded, null, 2), 'utf8');
    return seeded;
  }
}

function publicSettings(settings) {
  const { xaiApiKey, ...rest } = settings;
  const projectRoot = path.join(__dirname, '..');
  loadDotEnv(projectRoot);
  const resolved = resolveApiKey(settings);
  const grokPath = findGrokExe();
  return {
    ...rest,
    researchEngine: settings.researchEngine === 'api' ? 'api' : 'grok-build',
    researchApiReady: Boolean(resolved),
    researchApiMasked: maskKey(settings.xaiApiKey || process.env.XAI_API_KEY || ''),
    researchApiFromEnv: Boolean(process.env.XAI_API_KEY) && !settings.xaiApiKey,
    grokBuildReady: Boolean(grokPath),
    grokBuildPath: grokPath || '',
    researchReady: true,
  };
}

async function writeSettings(partial) {
  const current = await readSettings();
  const incoming = { ...(partial || {}) };
  delete incoming.researchApiReady;
  delete incoming.researchApiMasked;
  delete incoming.researchApiFromEnv;
  delete incoming.grokBuildReady;
  delete incoming.grokBuildPath;
  delete incoming.researchReady;
  const next = { ...current, ...incoming };
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
    'PLAY-CHECKLIST.md',
    'MARKET-RESEARCH.md',
    'RESEARCH-RUN.json',
    'PORT-DECISION.md',
    'EVALUATE-PROMPT.md',
    'SOURCE-NOTES.md',
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

let mainWindow = null;
let research = null;

function emitResearchProgress(entry) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('research:progress', entry);
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    title: 'Games Studio',
    backgroundColor: '#0b0f14',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow = win;
  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null;
  });

  if (isDev) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  loadDotEnv(path.join(__dirname, '..'));
  research = createResearchController({
    projectRoot: path.join(__dirname, '..'),
    dataDir: getDataDir(),
    readSettings,
    listInfoPacks,
    listPublishedGames,
    pathsFor,
  });
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// --- IPC ---

ipcMain.handle('settings:get', async () => publicSettings(await readSettings()));

ipcMain.handle('settings:update', async (_e, partial) =>
  publicSettings(await writeSettings(partial))
);

ipcMain.handle('settings:setApiKey', async (_e, key) => {
  const value = String(key || '').trim();
  return publicSettings(await writeSettings({ xaiApiKey: value }));
});

ipcMain.handle('research:catalog', async () => {
  const items = await research.getCatalog();
  return { items, error: null };
});

ipcMain.handle('research:buildPrompt', async (_e, options) => {
  return research.buildPromptForPaste(options || {});
});

ipcMain.handle('research:history', async (_e, platform) => {
  const all = await research.readHistory();
  const items = platform ? all.filter((r) => r.platform === platform) : all;
  return { items };
});

ipcMain.handle('research:run', async (_e, options) => {
  return research.run(options || {}, emitResearchProgress);
});

ipcMain.handle('research:cancel', async () => {
  if (research) research.cancel();
  return { ok: true };
});

function shipBoardDir(platform) {
  const projectRoot = path.join(__dirname, '..');
  return path.join(projectRoot, 'data', 'ship-boards', normalizePlatform(platform));
}

ipcMain.handle('ship:list', async (_e, platform) => {
  const p = normalizePlatform(platform);
  const settings = await readSettings();
  const roots = pathsFor(settings, p);
  const other = pathsFor(settings, p === 'android' ? 'facebook' : 'android');
  const dir = shipBoardDir(p);
  await fsp.mkdir(dir, { recursive: true });

  const bySlug = new Map();
  const packRes = await listInfoPacks(roots.packs);
  const lib = await listPublishedGames(roots.library);
  const otherPacks = await listInfoPacks(other.packs);

  function siblingFolder(slug, title) {
    const hit = (otherPacks.packs || []).find((pack) => {
      const m = pack.manifest || {};
      return (
        m.slug === slug ||
        m.siblingSlug === slug ||
        pack.folderName === slug ||
        (title && m.title && String(m.title).toLowerCase() === String(title).toLowerCase())
      );
    });
    return hit ? hit.folderName : '';
  }

  for (const pack of packRes.packs || []) {
    const m = pack.manifest || {};
    const slug = m.slug || m.id || pack.folderName;
    bySlug.set(slug, {
      slug,
      platform: p,
      title: m.title || pack.folderName,
      status: m.status || 'pack',
      kind: m.kind || 'game',
      packPath: pack.absolutePath,
      packFolderName: pack.folderName,
      checks: {},
      siblingPlatform: p === 'android' ? 'facebook' : 'android',
      siblingPackFolder: siblingFolder(slug, m.title),
    });
  }
  for (const g of lib.games || []) {
    const slug = g.slug || g.id;
    const existing = bySlug.get(slug) || {
      slug,
      platform: p,
      title: g.title,
      checks: {},
    };
    bySlug.set(slug, {
      ...existing,
      title: g.title || existing.title,
      status: g.status || existing.status,
      kind: g.kind || existing.kind,
      packPath: existing.packPath || g.packPath || '',
      packFolderName: existing.packFolderName || slug,
      siblingPlatform: p === 'android' ? 'facebook' : 'android',
      siblingPackFolder: existing.siblingPackFolder || siblingFolder(slug, g.title),
    });
  }

  try {
    const files = await fsp.readdir(dir);
    for (const name of files) {
      if (!name.endsWith('.json')) continue;
      try {
        const raw = JSON.parse(await fsp.readFile(path.join(dir, name), 'utf8'));
        const slug = raw.slug || path.basename(name, '.json');
        const existing = bySlug.get(slug) || { slug, platform: p, title: raw.title || slug, checks: {} };
        bySlug.set(slug, {
          ...existing,
          ...raw,
          slug,
          platform: p,
          title: raw.title || existing.title,
          checks: raw.checks || {},
          packPath: existing.packPath || raw.packPath || '',
          siblingPackFolder: existing.siblingPackFolder || raw.siblingPackFolder || '',
        });
      } catch {
        /* skip */
      }
    }
  } catch {
    /* no dir */
  }

  const boards = Array.from(bySlug.values()).sort((a, b) =>
    String(a.title || '').localeCompare(String(b.title || ''))
  );
  return { boards, error: packRes.error || lib.error || null };
});

ipcMain.handle('ship:save', async (_e, board) => {
  const p = normalizePlatform(board && board.platform);
  const slug = String((board && board.slug) || '').trim();
  if (!slug) return { error: 'Missing slug' };
  const dir = shipBoardDir(p);
  await fsp.mkdir(dir, { recursive: true });
  const payload = {
    ...board,
    slug,
    platform: p,
    updatedAt: new Date().toISOString(),
  };
  await fsp.writeFile(path.join(dir, `${slug}.json`), JSON.stringify(payload, null, 2), 'utf8');
  return payload;
});

ipcMain.handle('cross:propose', async (_e, input) => {
  const from = normalizePlatform(input && input.fromPlatform);
  const settings = await readSettings();
  const dest = pathsFor(settings, from === 'android' ? 'facebook' : 'android');
  let catalogSkip = [];
  try {
    const items = await research.getCatalog();
    catalogSkip = items.map((i) => i.title).filter(Boolean);
  } catch {
    catalogSkip = [];
  }
  return proposeCrossPlatform({
    fromPlatform: from,
    packPath: input.packPath,
    destPacksRoot: dest.packs,
    destWorkspaceRoot: dest.workspace,
    catalogSkip,
  });
});

ipcMain.handle('dialog:pickFolder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory'],
  });
  if (result.canceled || !result.filePaths[0]) return null;
  return result.filePaths[0];
});

ipcMain.handle('packs:list', async (_e, platform) => {
  const settings = await readSettings();
  const roots = pathsFor(settings, platform);
  return listInfoPacks(roots.packs);
});

ipcMain.handle('packs:detail', async (_e, packPath) => readPackDetail(packPath));

ipcMain.handle('library:list', async (_e, platform) => {
  const settings = await readSettings();
  const roots = pathsFor(settings, platform);
  return listPublishedGames(roots.library);
});

/**
 * Library + info packs (ready / in-production / published) merged for FB Upload or Play Console.
 * Pulls fb-listing.json or android-listing.json from the workspace slug when present.
 */
ipcMain.handle('upload:listTargets', async (_e, platform) => {
  const settings = await readSettings();
  const roots = pathsFor(settings, platform);
  const lib = await listPublishedGames(roots.library);
  const packRes = await listInfoPacks(roots.packs);
  const byId = new Map();
  const isAndroid = roots.platform === 'android';

  for (const g of lib.games) {
    byId.set(g.id, { ...g, source: g.source || 'library' });
  }

  for (const pack of packRes.packs || []) {
    const m = pack.manifest || {};
    const status = m.status || 'candidate';
    const slug = m.slug || m.id || pack.folderName;
    const id = slug;
    const workspacePath = path.join(roots.workspace || '', slug);
    const hasGame = await pathExists(workspacePath);
    const include =
      hasGame ||
      ['ready', 'in-production', 'published'].includes(status) ||
      byId.has(id);

    if (!include) continue;

    let diskListing = null;
    const listingPath = path.join(workspacePath, roots.listingFile);
    if (await pathExists(listingPath)) {
      try {
        diskListing = parseJsonLoose(await fsp.readFile(listingPath, 'utf8'));
      } catch {
        diskListing = null;
      }
    }

    const existing = byId.get(id);

    if (isAndroid) {
      const aabCandidate = path.join(workspacePath, 'app-release.aab');
      const aabAlt = path.join(roots.workspace || '', `${slug}-release.aab`);
      let uploadAabPath = (diskListing && diskListing.uploadAabPath) || '';
      if (!uploadAabPath) {
        if (await pathExists(aabCandidate)) uploadAabPath = aabCandidate;
        else if (await pathExists(aabAlt)) uploadAabPath = aabAlt;
        else uploadAabPath = aabCandidate;
      }

      const synthesized = {
        id,
        title: m.title || existing?.title || pack.folderName,
        slug,
        kind: m.kind || existing?.kind || (diskListing && diskListing.kind) || 'game',
        status: existing?.status || status,
        genre: m.genre || existing?.genre,
        packPath: pack.absolutePath,
        workspacePath: hasGame ? workspacePath : existing?.workspacePath || '',
        packageName:
          existing?.packageName ||
          (diskListing && (diskListing.packageName || diskListing.applicationId)) ||
          '',
        playConsoleId: existing?.playConsoleId || (diskListing && diskListing.playConsoleId) || '',
        notes: existing?.notes || m.oneLiner || '',
        source: existing ? 'library+pack' : hasGame ? 'pack+app' : 'pack',
        packFolderName: pack.folderName,
        androidListing: {
          title: m.title,
          slug,
          kind: m.kind || 'game',
          shortDescription: m.oneLiner || '',
          fullDescription: m.oneLiner || '',
          storeHook: m.oneLiner || '',
          category: m.genre || '',
          tags: m.tags || [],
          featureBullets: m.pillars
            ? Object.values(m.pillars).filter(Boolean).slice(0, 5)
            : [],
          buildFolder: hasGame ? workspacePath : '',
          uploadAabPath,
          entryFile: 'index.html',
          wrapper: 'capacitor',
          ...(existing?.androidListing || {}),
          ...(diskListing || {}),
          buildFolder:
            (diskListing && diskListing.buildFolder) ||
            (existing?.androidListing && existing.androidListing.buildFolder) ||
            (hasGame ? workspacePath : existing?.workspacePath || ''),
          uploadAabPath:
            (diskListing && diskListing.uploadAabPath) ||
            (existing?.androidListing && existing.androidListing.uploadAabPath) ||
            uploadAabPath,
          releaseNotes:
            (diskListing && diskListing.releaseNotes) ||
            (existing?.androidListing && existing.androidListing.releaseNotes) ||
            '',
        },
      };

      byId.set(
        id,
        existing
          ? {
              ...existing,
              ...synthesized,
              packageName: existing.packageName || synthesized.packageName,
              playConsoleId: existing.playConsoleId || synthesized.playConsoleId,
              notes: existing.notes || synthesized.notes,
              status: existing.status || synthesized.status,
              kind: existing.kind || synthesized.kind,
              androidListing: synthesized.androidListing,
              packPath: pack.absolutePath,
              packFolderName: pack.folderName,
              workspacePath: synthesized.workspacePath || existing.workspacePath,
            }
          : synthesized
      );
      continue;
    }

    const zipCandidate = path.join(roots.workspace || '', 'game.zip');
    const zipAlt = `${workspacePath}-upload.zip`;
    let uploadZipPath = (diskListing && diskListing.uploadZipPath) || '';
    if (!uploadZipPath) {
      if (await pathExists(zipCandidate)) uploadZipPath = zipCandidate;
      else if (await pathExists(zipAlt)) uploadZipPath = zipAlt;
      else uploadZipPath = zipCandidate;
    }

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
        ...(diskListing || {}),
        buildFolder:
          (diskListing && diskListing.buildFolder) ||
          (existing?.fbListing && existing.fbListing.buildFolder) ||
          (hasGame ? workspacePath : existing?.workspacePath || ''),
        uploadZipPath:
          (diskListing && diskListing.uploadZipPath) ||
          (existing?.fbListing && existing.fbListing.uploadZipPath) ||
          uploadZipPath,
        versionComment:
          (diskListing && diskListing.versionComment) ||
          (existing?.fbListing && existing.fbListing.versionComment) ||
          '',
      },
    };

    byId.set(
      id,
      existing
        ? {
            ...existing,
            ...synthesized,
            facebookAppId: existing.facebookAppId || synthesized.facebookAppId,
            notes: existing.notes || synthesized.notes,
            status: existing.status || synthesized.status,
            fbListing: synthesized.fbListing,
            packPath: pack.absolutePath,
            packFolderName: pack.folderName,
            workspacePath: synthesized.workspacePath || existing.workspacePath,
          }
        : synthesized
    );
  }

  const games = Array.from(byId.values()).sort((a, b) =>
    String(a.title || '').localeCompare(String(b.title || ''))
  );
  return {
    games,
    error: lib.error || packRes.error || null,
  };
});

ipcMain.handle('library:save', async (_e, game, platform) => {
  const settings = await readSettings();
  const roots = pathsFor(settings, platform);
  await fsp.mkdir(roots.library, { recursive: true });
  const id = game.id || game.slug || `game-${Date.now()}`;
  const filePath = path.join(roots.library, `${id}.json`);
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
  const lower = p.toLowerCase();
  if (lower.endsWith('.zip')) {
    candidates.push(path.join(path.dirname(p), 'game.zip'));
    candidates.push(path.join(app.getPath('desktop'), 'game.zip'));
  }
  if (lower.endsWith('.aab') || lower.endsWith('.apk')) {
    candidates.push(path.join(path.dirname(p), 'app-release.aab'));
    candidates.push(path.join(path.dirname(p), 'app-release.apk'));
  }
  const projectGames = path.join(__dirname, '..', 'games', 'game.zip');
  candidates.push(projectGames);
  const projectAab = path.join(__dirname, '..', 'android-apps');
  candidates.push(path.join(projectAab, 'word-streak-duels', 'app-release.aab'));

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

ipcMain.handle('fs:stat', async (_e, targetPath) => {
  const p = normalizeFsPath(targetPath);
  if (!p) return { exists: false };
  try {
    const st = await fsp.stat(p);
    return {
      exists: true,
      mtimeMs: st.mtimeMs,
      size: st.size,
      isFile: st.isFile(),
    };
  } catch {
    return { exists: false };
  }
});

ipcMain.handle('shell:openExternal', async (_e, url) => {
  const u = String(url || '').trim();
  if (!/^https?:\/\//i.test(u)) return { ok: false, error: 'Not an http(s) URL' };
  try {
    await shell.openExternal(u);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err && err.message ? err.message : String(err) };
  }
});

ipcMain.handle('packs:setStatus', async (_e, packPath, status) => {
  const allowed = ['candidate', 'ready', 'in-production', 'published', 'archived'];
  const next = String(status || '');
  if (!allowed.includes(next)) return { ok: false, error: 'Invalid status' };
  const p = normalizeFsPath(packPath);
  const manifestPath = path.join(p, 'pack.json');
  if (!(await pathExists(manifestPath))) return { ok: false, error: 'pack.json not found' };
  try {
    const raw = parseJsonLoose(await fsp.readFile(manifestPath, 'utf8'));
    raw.status = next;
    await fsp.writeFile(manifestPath, JSON.stringify(raw, null, 2) + '\n', 'utf8');
    return { ok: true, status: next };
  } catch (err) {
    return { ok: false, error: err && err.message ? err.message : String(err) };
  }
});

ipcMain.handle('library:delete', async (_e, id, platform) => {
  const settings = await readSettings();
  const roots = pathsFor(settings, platform);
  const safe = String(id || '').replace(/[^a-zA-Z0-9._-]/g, '');
  if (!safe) return { ok: false, error: 'Missing id' };
  const filePath = path.join(roots.library, `${safe}.json`);
  if (!(await pathExists(filePath))) return { ok: false, error: 'Library file not found' };
  await fsp.unlink(filePath);
  return { ok: true };
});

ipcMain.handle('app:getPaths', async () => ({
  userData: getDataDir(),
  projectRoot: path.join(__dirname, '..'),
}));
