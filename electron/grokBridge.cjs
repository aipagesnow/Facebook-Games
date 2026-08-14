/**
 * Bridge: Plan next → Grok Build (no xAI API key).
 *
 * 1. Write a queued job to data/research-inbox/
 * 2. If a Grok Build chat is watching this project, it claims the job.
 * 3. Otherwise spawn `grok -p` with the user's logged-in Grok Build CLI.
 */

const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const { spawn, spawnSync } = require('child_process');
const os = require('os');

const CLAIM_WAIT_MS = 10_000;
const POLL_MS = 800;
const GROK_TIMEOUT_MS = 12 * 60 * 1000;

function inboxDir(projectRoot) {
  return path.join(projectRoot, 'data', 'research-inbox');
}

async function ensureInbox(projectRoot) {
  const dir = inboxDir(projectRoot);
  await fsp.mkdir(dir, { recursive: true });
  return dir;
}

async function readJsonSafe(file) {
  try {
    return JSON.parse(await fsp.readFile(file, 'utf8'));
  } catch {
    return null;
  }
}

async function writeJson(file, data) {
  await fsp.writeFile(file, JSON.stringify(data, null, 2), 'utf8');
}

function findGrokExe() {
  if (process.env.GROK_BIN && fs.existsSync(process.env.GROK_BIN)) {
    return process.env.GROK_BIN;
  }
  const home = os.homedir();
  const candidates = [
    path.join(home, '.grok', 'bin', process.platform === 'win32' ? 'grok.exe' : 'grok'),
    path.join(home, '.local', 'bin', 'grok'),
    path.join(process.env.LOCALAPPDATA || '', 'grok', 'grok.exe'),
  ];
  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p;
  }
  try {
    const cmd = process.platform === 'win32' ? 'where' : 'which';
    const r = spawnSync(cmd, ['grok'], { encoding: 'utf8', windowsHide: true });
    const line = String(r.stdout || '')
      .split(/\r?\n/)
      .map((s) => s.trim())
      .find((s) => s && !s.toLowerCase().includes('info:'));
    if (line && fs.existsSync(line)) return line;
  } catch {
    /* ignore */
  }
  return '';
}

function buildPrompt({ request, catalog, packsRoot }) {
  const isAndroid = request.platform === 'android';
  const catalogLines = (catalog || [])
    .map(
      (c) =>
        `- [${c.platform}/${c.source}/${c.status}] ${c.title} (slug:${c.slug}, kind:${c.kind}) ${c.oneLiner || ''}`
    )
    .join('\n');

  return `I pasted this from Games Studio → Plan next. You are Grok Build with this Facebook-Games project open. Do the research yourself in this chat and write the info pack on disk. Do not ask for an API key.

REQUEST
- id: ${request.id}
- platform: ${request.platform}
- mode: ${request.mode}
- kind preference: ${request.kind}
- packs folder (WRITE HERE): ${packsRoot}

EXISTING CATALOG (do not duplicate titles, slugs, or reskins):
${catalogLines || '(empty)'}

WHAT TO DO
1. Do live web research for ${
    isAndroid
      ? 'Google Play casual games AND utility apps (charts, Sensor Tower / data.ai commentary, Play policy)'
      : 'Facebook Instant Games / Gaming Tab / Messenger play (word, trivia, puzzle, sports; Meta constraints)'
  }.
2. Inventory is already above. Skip anything already packed, in the library, or in games/ / android-apps/.
3. Run the studio filter: Stage 1 hard gates (short session, small team, ads never interrupt core verb, no licensed IP factory) → Stage 2 ≥2 named UX edges vs named references → Stage 3 live-ops realism → red team that can DROP the idea.
4. Mode "${request.mode}" means ${
    request.mode === 'allow-sequel'
      ? 'a genuine better-version of an existing studio title is allowed if you name ≥2 UX edges'
      : 'MOSTLY TOTALLY NEW — do not sequel unless nothing else survives'
  }.
5. ${
    isAndroid
      ? request.kind === 'auto'
        ? 'Pick game OR app — whichever is the stronger Play bet for Apex Arcade Studio.'
        : `Winner MUST be kind=${request.kind}.`
      : 'Winner MUST be an Instant Game (kind=game). Zero Permissions, sub-3s load, <30s teachable loop.'
  }
6. If nothing is good enough, say so clearly and do not invent a weak filler pack.

WRITE A FULL PACK under ${packsRoot}/<slug>/ :
- pack.json (status ready, platforms:[${request.platform}], kind, scores, pillars, generatedBy:"studio-plan-next")
- README.md, FILTER-DECISION.md, PILLARS.md, AUDIENCE.md, MONETIZATION.md, DISCOVERY.md, LIVEOPS.md
- ${isAndroid ? 'PLAY-CHECKLIST.md' : 'UPLOAD-CHECKLIST.md'}
- MARKET-RESEARCH.md (sources with URLs, rejected ideas, why this wins)
- RESEARCH-RUN.json
- skeleton/index.html, skeleton/styles.css, skeleton/game.js (tiny stub only)

When the pack is written, reply in this chat with the title, slug, folder path, one-liner, and why it won.

Publisher: Apex Arcade Studio. Unique title. Unique kebab slug.
Read docs/PLAN-NEXT.md, docs/INFO-PACK-SPEC.md, docs/ANDROID-PACK-SPEC.md, docs/DESIGN-JUDGMENT.md if you need the contract.
`;
}

async function buildPastePrompt({ projectRoot, packsRoot, catalog, options }) {
  const dir = await ensureInbox(projectRoot);
  const request = {
    id: `plan-${Date.now()}`,
    status: 'paste',
    createdAt: new Date().toISOString(),
    platform: options.platform === 'android' ? 'android' : 'facebook',
    mode: options.mode === 'allow-sequel' ? 'allow-sequel' : 'prefer-new',
    kind:
      options.platform === 'facebook'
        ? 'game'
        : options.kind === 'game' || options.kind === 'app'
          ? options.kind
          : 'auto',
    packsRoot,
    engine: 'paste-into-grok-build',
  };
  const prompt = buildPrompt({ request, catalog, packsRoot });
  const promptPath = path.join(dir, 'prompt.md');
  await fsp.writeFile(promptPath, prompt, 'utf8');
  await writeJson(path.join(dir, 'request.json'), request);
  return {
    ok: true,
    prompt,
    promptPath,
    requestId: request.id,
    platform: request.platform,
    mode: request.mode,
    kind: request.kind,
    packsRoot,
    catalogCount: (catalog || []).length,
  };
}

let activeChild = null;

function killActive() {
  if (activeChild && !activeChild.killed) {
    try {
      if (process.platform === 'win32' && activeChild.pid) {
        spawn('taskkill', ['/pid', String(activeChild.pid), '/t', '/f'], {
          windowsHide: true,
          stdio: 'ignore',
        });
      } else {
        activeChild.kill('SIGTERM');
      }
    } catch {
      /* ignore */
    }
  }
  activeChild = null;
}

function spawnGrok({ grokPath, projectRoot, promptPath, onLine }) {
  return new Promise((resolve) => {
    const args = [
      '--prompt-file',
      promptPath,
      '--cwd',
      projectRoot,
      '--output-format',
      'streaming-json',
      '--yolo',
      '--no-plan',
      '--no-auto-update',
    ];
    const child = spawn(grokPath, args, {
      cwd: projectRoot,
      windowsHide: true,
      env: { ...process.env, GROK_DISABLE_AUTOUPDATER: '1' },
    });
    activeChild = child;
    let buf = '';
    let lastText = '';
    const handleChunk = (chunk) => {
      buf += String(chunk);
      const lines = buf.split(/\r?\n/);
      buf = lines.pop() || '';
      for (const line of lines) {
        if (!line.trim()) continue;
        if (typeof onLine === 'function') onLine(line);
        try {
          const ev = JSON.parse(line);
          if (ev.type === 'text' && ev.data) lastText = String(ev.data).slice(0, 240);
          if (ev.type === 'error') lastText = ev.message || ev.data || 'Grok error';
        } catch {
          /* not json */
        }
      }
    };
    child.stdout.on('data', handleChunk);
    child.stderr.on('data', (c) => {
      const s = String(c);
      if (s.trim() && typeof onLine === 'function') onLine(JSON.stringify({ type: 'log', data: s.slice(0, 200) }));
    });
    const timer = setTimeout(() => {
      killActive();
      resolve({ ok: false, error: 'Grok Build timed out.', lastText });
    }, GROK_TIMEOUT_MS);
    child.on('close', (code) => {
      clearTimeout(timer);
      if (activeChild === child) activeChild = null;
      resolve({ ok: code === 0, code, lastText });
    });
    child.on('error', (err) => {
      clearTimeout(timer);
      if (activeChild === child) activeChild = null;
      resolve({ ok: false, error: err.message || String(err), lastText });
    });
  });
}

function parseGrokLine(line) {
  try {
    const ev = JSON.parse(line);
    if (ev.type === 'tool_call') {
      return {
        phase: 'research',
        message: ev.title || ev.toolName || 'Grok is working…',
      };
    }
    if (ev.type === 'thought' && ev.data) {
      return { phase: 'research', message: String(ev.data).replace(/\s+/g, ' ').slice(0, 180) };
    }
    if (ev.type === 'text' && ev.data) {
      return { phase: 'write', message: String(ev.data).replace(/\s+/g, ' ').slice(0, 180) };
    }
    if (ev.type === 'error') {
      return { phase: 'error', message: ev.message || 'Grok error' };
    }
    if (ev.type === 'end') {
      return { phase: 'done', message: 'Grok Build finished this run.' };
    }
  } catch {
    /* ignore */
  }
  return null;
}

async function waitForResult({ dir, requestId, timeoutMs, onTick }) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const req = await readJsonSafe(path.join(dir, 'request.json'));
    const result = await readJsonSafe(path.join(dir, 'result.json'));
    if (typeof onTick === 'function') onTick(req, result);
    if (result && result.id === requestId) return { request: req, result };
    if (req && req.id === requestId && (req.status === 'failed' || req.status === 'cancelled')) {
      return { request: req, result: result || { ok: false, error: req.error || req.status } };
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
  return { request: null, result: null, timedOut: true };
}

async function runViaGrokBuild({
  projectRoot,
  packsRoot,
  catalog,
  options,
  onProgress,
}) {
  const emit = (phase, message, pct) => {
    if (typeof onProgress === 'function') {
      onProgress({ at: new Date().toISOString(), phase, message, pct });
    }
  };

  const dir = await ensureInbox(projectRoot);
  const grokPath = findGrokExe();
  const request = {
    id: `plan-${Date.now()}`,
    status: 'queued',
    createdAt: new Date().toISOString(),
    platform: options.platform,
    mode: options.mode || 'prefer-new',
    kind: options.kind || 'auto',
    packsRoot,
    engine: 'grok-build',
  };

  const prompt = buildPrompt({ request, catalog, packsRoot });
  const promptPath = path.join(dir, 'prompt.md');
  await fsp.writeFile(promptPath, prompt, 'utf8');
  await writeJson(path.join(dir, 'request.json'), request);
  // Clear stale result so we don't pick up a previous run
  try {
    await fsp.unlink(path.join(dir, 'result.json'));
  } catch {
    /* none */
  }

  emit(
    'inbox',
    'Posted the job to Grok Build. If that chat is open on this project, it will pick this up…',
    12
  );

  // Wait briefly for an interactive Grok Build session (this chat) to claim the job
  const claimDeadline = Date.now() + CLAIM_WAIT_MS;
  let claimedBySession = false;
  while (Date.now() < claimDeadline) {
    const req = await readJsonSafe(path.join(dir, 'request.json'));
    if (req && req.id === request.id && (req.status === 'claimed' || req.status === 'running')) {
      claimedBySession = true;
      break;
    }
    if (req && req.id === request.id && req.status === 'done') {
      const result = await readJsonSafe(path.join(dir, 'result.json'));
      if (result) return { ...result, engine: 'grok-build' };
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }

  if (claimedBySession) {
    emit('research', 'Grok Build (this project chat) claimed the job. Waiting for the pack…', 30);
    const waited = await waitForResult({
      dir,
      requestId: request.id,
      timeoutMs: GROK_TIMEOUT_MS,
      onTick: (req) => {
        if (req && req.lastMessage) emit('research', req.lastMessage, req.pct || 50);
      },
    });
    if (waited.result) return { ...waited.result, engine: 'grok-build' };
    return {
      ok: false,
      error:
        'Grok Build claimed the job but did not finish in time. Check the Grok chat, or click Plan next again.',
    };
  }

  if (!grokPath) {
    return {
      ok: false,
      needsGrokChat: true,
      error:
        'No Grok Build chat claimed this job, and grok.exe is not on PATH. Keep Grok Build open on this project and click Plan next again — or run `grok` from a terminal in this folder.',
      promptPath,
      requestId: request.id,
    };
  }

  emit('research', `Starting Grok Build CLI (${path.basename(grokPath)}) with your login — no API key…`, 24);
  await writeJson(path.join(dir, 'request.json'), {
    ...request,
    status: 'running',
    worker: 'grok-cli',
    grokPath,
  });

  const spawned = await spawnGrok({
    grokPath,
    projectRoot,
    promptPath,
    onLine: (line) => {
      const parsed = parseGrokLine(line);
      if (parsed) emit(parsed.phase, parsed.message, 45);
    },
  });

  const after = await readJsonSafe(path.join(dir, 'result.json'));
  if (after && after.ok) {
    emit('done', `Pack ready: ${after.title || after.slug}`, 100);
    return { ...after, engine: 'grok-build' };
  }

  if (spawned.ok && after) return { ...after, engine: 'grok-build' };

  if (!spawned.ok && spawned.error) {
    return {
      ok: false,
      error: `Grok Build CLI could not start: ${spawned.error}. If Grok Build is open on this folder, click Plan next again so that chat can claim the job.`,
      promptPath,
    };
  }

  return {
    ok: false,
    error:
      after && after.error
        ? after.error
        : 'Grok Build finished but did not write a pack (filter may have dropped every idea). Check data/research-inbox/ or the Grok chat.',
    dropped: Boolean(after && after.dropped),
    promptPath,
  };
}

module.exports = {
  findGrokExe,
  inboxDir,
  ensureInbox,
  readJsonSafe,
  writeJson,
  buildPrompt,
  buildPastePrompt,
  runViaGrokBuild,
  killActive,
  CLAIM_WAIT_MS,
};
