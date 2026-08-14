/**
 * In-studio market research → info pack.
 * Single long pass: inventory → live web research (Grok + web_search) →
 * 3-stage filter + red team → write pack. Runs in Electron main only.
 */

const path = require('path');
const fsp = require('fs/promises');
const fs = require('fs');
const { runViaGrokBuild, findGrokExe, killActive, buildPastePrompt } = require('./grokBridge.cjs');

const XAI_BASE = 'https://api.x.ai/v1';
const DEFAULT_MODEL = 'grok-4.6';
const MIN_SCORE = 7;
const MIN_AVG = 7.5;

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function normText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokenSet(value) {
  return new Set(
    normText(value)
      .split(' ')
      .filter((w) => w.length > 2)
  );
}

function jaccard(a, b) {
  const A = tokenSet(a);
  const B = tokenSet(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter += 1;
  return inter / (A.size + B.size - inter);
}

function maskKey(key) {
  const k = String(key || '');
  if (!k) return '';
  if (k.length <= 8) return '••••';
  return `${k.slice(0, 4)}••••${k.slice(-4)}`;
}

function loadDotEnv(projectRoot) {
  const envPath = path.join(projectRoot, '.env');
  if (!fs.existsSync(envPath)) return;
  try {
    const raw = fs.readFileSync(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq < 1) continue;
      const name = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[name]) process.env[name] = val;
    }
  } catch {
    /* ignore */
  }
}

function resolveApiKey(settings) {
  return (
    (settings && settings.xaiApiKey && String(settings.xaiApiKey).trim()) ||
    process.env.XAI_API_KEY ||
    ''
  );
}

async function pathExists(p) {
  try {
    await fsp.access(p);
    return true;
  } catch {
    return false;
  }
}

function parseJsonLoose(raw) {
  return JSON.parse(String(raw || '').replace(/^\uFEFF/, '').trim());
}

function catalogEntry({ slug, title, kind, platform, status, source, oneLiner, tags, coreLoop }) {
  const s = slugify(slug || title);
  return {
    slug: s,
    title: title || s,
    kind: kind === 'app' ? 'app' : 'game',
    platform,
    status: status || 'unknown',
    source,
    oneLiner: oneLiner || '',
    tags: Array.isArray(tags) ? tags : [],
    coreLoop: coreLoop || '',
    mechanicKey: [kind || 'game', ...(Array.isArray(tags) ? tags.slice(0, 3) : [])]
      .map((t) => normText(t))
      .filter(Boolean)
      .join('|'),
  };
}

async function listWorkspaceSlugs(rootDir) {
  if (!(await pathExists(rootDir))) return [];
  const entries = await fsp.readdir(rootDir, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules')
    .map((e) => e.name);
}

/**
 * Inventory every known title across Facebook + Android so we do not
 * re-propose something already packed, in development, or published.
 */
async function buildCatalog({ listInfoPacks, listPublishedGames, pathsFacebook, pathsAndroid }) {
  const items = [];
  const seen = new Set();

  function add(entry) {
    if (!entry.slug) return;
    const key = `${entry.platform}:${entry.slug}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push(entry);
  }

  async function ingestPlatform(platform, roots) {
    const packRes = await listInfoPacks(roots.packs);
    for (const pack of packRes.packs || []) {
      const m = pack.manifest || {};
      add(
        catalogEntry({
          slug: m.slug || m.id || pack.folderName,
          title: m.title || pack.folderName,
          kind: m.kind || 'game',
          platform,
          status: m.status || 'pack',
          source: 'info-pack',
          oneLiner: m.oneLiner || '',
          tags: m.tags || [],
          coreLoop: m.pillars && m.pillars.coreLoop ? m.pillars.coreLoop : '',
        })
      );
    }

    const lib = await listPublishedGames(roots.library);
    for (const g of lib.games || []) {
      add(
        catalogEntry({
          slug: g.slug || g.id,
          title: g.title || g.slug || g.id,
          kind: g.kind || (g.androidListing && g.androidListing.kind) || 'game',
          platform,
          status: g.status || 'library',
          source: 'library',
          oneLiner: g.notes || '',
          tags: g.genre ? [g.genre] : [],
          coreLoop: '',
        })
      );
    }

    const slugs = await listWorkspaceSlugs(roots.workspace);
    for (const folder of slugs) {
      add(
        catalogEntry({
          slug: folder,
          title: folder,
          kind: 'game',
          platform,
          status: 'workspace',
          source: 'workspace',
          oneLiner: '',
          tags: [],
          coreLoop: '',
        })
      );
    }
  }

  await ingestPlatform('facebook', pathsFacebook);
  await ingestPlatform('android', pathsAndroid);

  return items;
}

function findConflicts(winner, catalog, { platform, mode }) {
  const conflicts = [];
  const title = winner.title || '';
  const slug = slugify(winner.slug || winner.title);
  const mechanic = normText((winner.tags || []).slice(0, 3).join(' '));

  for (const item of catalog) {
    if (item.slug === slug) {
      conflicts.push({
        type: 'slug',
        item,
        message: `Slug "${slug}" already exists on ${item.platform} (${item.source}).`,
      });
    }
    if (jaccard(item.title, title) >= 0.72) {
      conflicts.push({
        type: 'title',
        item,
        message: `Title too close to existing "${item.title}" (${item.platform} / ${item.source}).`,
      });
    }
    if (
      mode !== 'allow-sequel' &&
      winner.relationshipToCatalog !== 'better-version' &&
      item.platform === platform &&
      mechanic &&
      item.tags &&
      item.tags.length &&
      jaccard(item.tags.join(' '), (winner.tags || []).join(' ')) >= 0.8 &&
      jaccard(item.coreLoop || item.oneLiner, winner.coreLoop || winner.oneLiner || '') >= 0.55
    ) {
      conflicts.push({
        type: 'mechanic',
        item,
        message: `Core loop overlaps "${item.title}" too closely. Propose a different verb, not a reskin.`,
      });
    }
  }

  if (winner.relationshipToCatalog === 'better-version' && mode === 'prefer-new') {
    conflicts.push({
      type: 'sequel-blocked',
      item: null,
      message:
        'Planner is in “mostly new” mode. A better-version / sequel was proposed — reject unless the user chose “allow better version”.',
    });
  }

  return conflicts;
}

function extractOutputText(data) {
  if (!data) return '';
  if (typeof data.output_text === 'string' && data.output_text.trim()) return data.output_text;
  const parts = [];
  for (const item of data.output || []) {
    if (item.type === 'message') {
      for (const c of item.content || []) {
        if ((c.type === 'output_text' || c.type === 'text') && c.text) parts.push(c.text);
      }
    } else if (item.type === 'output_text' && item.text) {
      parts.push(item.text);
    }
  }
  return parts.join('\n');
}

function parseJsonFromModel(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) throw new Error('Model returned an empty response.');
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fence ? fence[1] : trimmed;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('Model did not return a JSON object.');
  return JSON.parse(raw.slice(start, end + 1));
}

async function callGrok({ apiKey, model, system, user, timeoutMs }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs || 8 * 60 * 1000);
  try {
    const res = await fetch(`${XAI_BASE}/responses`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || DEFAULT_MODEL,
        store: false,
        input: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        tools: [{ type: 'web_search' }],
      }),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data.error?.message || data.message || `xAI HTTP ${res.status}`;
      const err = new Error(msg);
      err.status = res.status;
      throw err;
    }
    return {
      text: extractOutputText(data),
      citations: data.citations || [],
      raw: data,
    };
  } catch (err) {
    if (err && err.name === 'AbortError') {
      throw new Error('Research timed out talking to Grok. Try again.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function buildSystemPrompt(platform) {
  const isAndroid = platform === 'android';
  return [
    'You are the in-house market-research desk for Apex Arcade Studio.',
    'You produce ONE next title (not a backlog) after live web research.',
    isAndroid
      ? 'Platform: Google Play (Android). Titles may be a GAME or a utility APP. Game vs App cannot be changed later on Play Console.'
      : 'Platform: Facebook Instant Games only. Output MUST be a GAME (never a utility app). Zero Permissions, sub-3s load, <30s teachable loop.',
    '',
    'Studio constraints (non-negotiable):',
    '- Solo / tiny team. No content factories, no licensed IP, no heavy multiplayer netcode for v1.',
    '- Hybrid ads OK only if ads never interrupt the core verb.',
    '- Prefer formats with proven demand AND a named gap vs chart leaders.',
    '- Do NOT clone an existing studio title. New mechanic / new job-to-be-done, unless explicitly allowed as a better-version with ≥2 named UX edges.',
    '- Publisher brand: Apex Arcade Studio. Casual, premium, fast sessions.',
    '',
    'You MUST use web_search. Look up current (as of today) charts and commentary for:',
    isAndroid
      ? 'Google Play free games / casual / word / puzzle / hypercasual / utility app breakouts; Sensor Tower / data.ai / Play best-of lists; policy gotchas (Families, IAP).'
      : 'Facebook Instant Games / Gaming Tab / Messenger play patterns; word, trivia, puzzle, sports Instant hits; Meta Instant Games technical constraints.',
    'Cite real URLs in research.sources. If a chart is paywalled, say so and use multiple public corroborating sources.',
    '',
    'Filter (fail-fast, then red-team the winner):',
    'Stage 1 hard gates: short-session, social-or-shareable, ad-friendly, small-team polishable, tech budget honest, ads never interrupt core verb, content/licensing OK.',
    'Stage 2: name ≥2 specific UX edges vs named references. “It is popular” is not differentiation.',
    'Stage 3: live-ops hours/week, systems complexity 1–5, pillar coverage. Medium-low live-ops preferred.',
    'Red team: try to kill the idea (clone risk, policy, content ops, discovery, retention). If it dies, pick the next candidate. If none survive, decision=drop.',
    '',
    'Scoring 1–10. Ship only if every listed score ≥ 7 and average ≥ 7.5.',
    isAndroid
      ? 'Scores: playFit, smallTeamBuild, differentiation, monetizationFit, retentionRealism, discoveryClarity.'
      : 'Scores: instantGamesDna, naturalSocial, smallTeamBuild, growthTrajectory, differentiation, retentionRealism.',
    '',
    'Return ONLY one JSON object (no markdown, no preamble) matching the schema in the user message.',
    'docs.* markdown must be complete operator-ready copy (not placeholders). MARKET_RESEARCH must include sources and what you rejected.',
  ].join('\n');
}

function buildUserPrompt({ platform, mode, kind, catalog, extraFeedback }) {
  const isAndroid = platform === 'android';
  const catalogLines = catalog
    .map(
      (c) =>
        `- [${c.platform}/${c.source}/${c.status}] ${c.title} (slug:${c.slug}, kind:${c.kind}) ${c.oneLiner || ''} tags:${(c.tags || []).join(',')}`
    )
    .join('\n');

  return [
    `Research date: ${new Date().toISOString().slice(0, 10)}`,
    `Target platform: ${platform}`,
    `Planner mode: ${mode === 'allow-sequel' ? 'new OR a genuine better-version of an existing studio title' : 'MOSTLY TOTALLY NEW — do not sequel unless there is no better new idea'}`,
    isAndroid
      ? `Product kind preference: ${kind === 'auto' ? 'pick game OR app — whichever has the stronger Play opportunity for this studio' : kind}`
      : 'Product kind: game only',
    '',
    'EXISTING STUDIO CATALOG (do not duplicate; do not reskin):',
    catalogLines || '(empty catalog)',
    '',
    extraFeedback ? `PREVIOUS ATTEMPT REJECTED:\n${extraFeedback}\n` : '',
    'JSON schema to return:',
    JSON.stringify(
      {
        decision: 'ship | drop',
        dropReason: '',
        research: {
          asOf: 'YYYY-MM-DD',
          platformNotes: '',
          chartReality: ['what is actually winning on this platform right now'],
          sources: [{ title: '', url: 'https://', takeaway: '' }],
          whiteSpace: ['gaps a small team can own'],
          risks: ['policy, discovery, content ops'],
        },
        candidatesConsidered: [
          {
            title: '',
            kind: isAndroid ? 'game|app' : 'game',
            oneLiner: '',
            verdict: 'winner|runner-up|drop',
            why: '',
          },
        ],
        winner: {
          title: '',
          slug: 'kebab-case',
          kind: isAndroid ? 'game|app' : 'game',
          genre: '',
          oneLiner: '',
          inspiredBy: ['Named reference A', 'Named reference B'],
          targetAudience: '',
          tags: ['tag'],
          relationshipToCatalog: 'new',
          improvesOn: '',
          coreLoop: '',
          fiveSecondTest: ['1', '2', '3'],
          differentiation: ['UX edge vs named ref', 'second edge'],
          scores: isAndroid
            ? {
                playFit: 8,
                smallTeamBuild: 8,
                differentiation: 8,
                monetizationFit: 8,
                retentionRealism: 8,
                discoveryClarity: 8,
              }
            : {
                instantGamesDna: 8,
                naturalSocial: 8,
                smallTeamBuild: 8,
                growthTrajectory: 8,
                differentiation: 8,
                retentionRealism: 8,
              },
          pillars: {
            coreLoop: '',
            social: '',
            retention: '',
            monetization: '',
            discovery: '',
            liveOps: '',
          },
          stage1: {
            sessionFit: '',
            smallTeam: '',
            techBudget: '',
            adsNeverInterruptCore: '',
            contentLicensing: '',
            verdict: 'pass',
          },
          stage2: { namedReferences: [], uxEdges: [], verdict: 'pass' },
          stage3: {
            liveOpsHoursPerWeek: 2,
            systemsComplexity: 2,
            pillarCoverage: '',
            verdict: 'pass',
          },
          redTeam: { attacks: ['...'], survives: true, notes: '' },
        },
        docs: {
          README: 'markdown',
          FILTER_DECISION: 'markdown',
          PILLARS: 'markdown',
          AUDIENCE: 'markdown',
          MONETIZATION: 'markdown',
          DISCOVERY: 'markdown',
          LIVEOPS: 'markdown',
          UPLOAD_CHECKLIST: isAndroid ? '' : 'markdown Instant Games checklist',
          PLAY_CHECKLIST: isAndroid ? 'markdown Play Console checklist' : '',
          MARKET_RESEARCH: 'markdown with sources, rejected ideas, why this wins',
        },
      },
      null,
      2
    ),
    '',
    'Generate 5–8 candidates internally, filter them, red-team the winner, then fill docs for the winner only.',
    'Title must be unique vs the catalog. Slug kebab-case, unique.',
    'If nothing is good enough, decision=drop and explain. Do not invent a weak filler pack.',
  ].join('\n');
}

function scoreStats(scores) {
  const nums = Object.values(scores || {})
    .map((n) => Number(n))
    .filter((n) => Number.isFinite(n));
  if (!nums.length) return { min: 0, avg: 0, nums: [] };
  const min = Math.min(...nums);
  const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
  return { min, avg, nums };
}

function validatePayload(payload, { platform, kind, catalog, mode }) {
  const errors = [];
  if (!payload || typeof payload !== 'object') return ['Empty payload'];
  if (payload.decision === 'drop') {
    return [`Research dropped every candidate: ${payload.dropReason || 'no reason given'}`];
  }
  if (payload.decision !== 'ship') errors.push('decision must be ship or drop');

  const w = payload.winner || {};
  if (!w.title) errors.push('Missing winner.title');
  if (!w.oneLiner) errors.push('Missing winner.oneLiner');
  if (!w.coreLoop) errors.push('Missing winner.coreLoop');
  if (!Array.isArray(w.inspiredBy) || w.inspiredBy.length < 2) {
    errors.push('Need ≥2 named inspiredBy references');
  }
  if (!Array.isArray(w.differentiation) || w.differentiation.length < 2) {
    errors.push('Need ≥2 named differentiation edges');
  }
  if (platform === 'facebook' && w.kind && w.kind !== 'game') {
    errors.push('Facebook Instant Games must be kind=game');
  }
  if (platform === 'android' && kind !== 'auto' && w.kind && w.kind !== kind) {
    errors.push(`User asked for kind=${kind} but winner is ${w.kind}`);
  }
  if (w.stage1 && w.stage1.verdict && w.stage1.verdict !== 'pass') {
    errors.push(`Stage 1 failed: ${w.stage1.verdict}`);
  }
  if (w.stage2 && w.stage2.verdict && w.stage2.verdict !== 'pass') {
    errors.push(`Stage 2 failed: ${w.stage2.verdict}`);
  }
  if (w.stage3 && w.stage3.verdict && w.stage3.verdict !== 'pass') {
    errors.push(`Stage 3 failed: ${w.stage3.verdict}`);
  }
  if (w.redTeam && w.redTeam.survives === false) {
    errors.push('Red team killed the winner');
  }
  const { min, avg } = scoreStats(w.scores);
  if (min < MIN_SCORE) errors.push(`A score is below ${MIN_SCORE} (min=${min})`);
  if (avg < MIN_AVG) errors.push(`Average score ${avg.toFixed(2)} is below ${MIN_AVG}`);

  const docs = payload.docs || {};
  const requiredDocs = [
    'README',
    'FILTER_DECISION',
    'PILLARS',
    'AUDIENCE',
    'MONETIZATION',
    'DISCOVERY',
    'LIVEOPS',
    'MARKET_RESEARCH',
  ];
  if (platform === 'android') requiredDocs.push('PLAY_CHECKLIST');
  else requiredDocs.push('UPLOAD_CHECKLIST');
  for (const key of requiredDocs) {
    if (!docs[key] || String(docs[key]).trim().length < 80) {
      errors.push(`docs.${key} is missing or too thin`);
    }
  }

  const conflicts = findConflicts(w, catalog, { platform, mode });
  for (const c of conflicts) errors.push(c.message);

  const sources = (payload.research && payload.research.sources) || [];
  if (sources.length < 2) errors.push('Need at least 2 cited research.sources with URLs');

  return errors;
}

function uniqueSlug(base, catalog, platform) {
  let slug = slugify(base) || `title-${Date.now()}`;
  const taken = new Set(
    catalog.filter((c) => c.platform === platform).map((c) => c.slug)
  );
  if (!taken.has(slug)) return slug;
  let n = 2;
  while (taken.has(`${slug}-${n}`)) n += 1;
  return `${slug}-${n}`;
}

function facebookSkeleton(title) {
  const safe = title.replace(/</g, '');
  return {
    'index.html': `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
    <title>${safe} — Skeleton</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <div id="app">
      <header>
        <h1>${safe}</h1>
        <p id="status">Booting…</p>
      </header>
      <main>
        <p class="hint">FBInstant lifecycle stub only — not a vertical slice.</p>
        <button id="shareBtn" type="button">Share stub</button>
      </main>
    </div>
    <script src="game.js"></script>
  </body>
</html>
`,
    'styles.css': `html,body{margin:0;min-height:100%;font-family:system-ui,sans-serif;background:#0b1220;color:#eef2ff}
#app{padding:24px 18px}h1{margin:0 0 8px;font-size:22px}.hint{color:#93a4bd}
button{margin-top:12px;padding:10px 14px;border:0;border-radius:10px;background:#1877f2;color:#fff;font-weight:700}
`,
    'game.js': `/* Bare Instant Games lifecycle + one social stub. Not a shippable game. */
(function () {
  const status = document.getElementById('status');
  const share = document.getElementById('shareBtn');
  const mock = {
    initializeAsync: () => Promise.resolve(),
    setLoadingProgress: () => {},
    startGameAsync: () => Promise.resolve(),
    shareAsync: (p) => Promise.resolve(p),
  };
  const IG = typeof FBInstant !== 'undefined' ? FBInstant : mock;
  IG.initializeAsync()
    .then(() => {
      IG.setLoadingProgress(100);
      return IG.startGameAsync();
    })
    .then(() => {
      if (status) status.textContent = 'Ready';
    })
    .catch((err) => {
      if (status) status.textContent = String(err && err.message ? err.message : err);
    });
  if (share) {
    share.addEventListener('click', () => {
      IG.shareAsync({ intent: 'REQUEST', text: '${safe} — can you beat me?' }).catch(() => {});
    });
  }
})();
`,
  };
}

function androidSkeleton(title, kind) {
  const safe = title.replace(/</g, '');
  return {
    'index.html': `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>${safe} — Android skeleton</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <main>
      <p class="kicker">${kind === 'app' ? 'Play app' : 'Play game'} · Capacitor stub</p>
      <h1>${safe}</h1>
      <p>Boot shell only — not a vertical slice. Wire storage, share, and ads in game.js.</p>
      <button type="button" id="share">Share stub</button>
    </main>
    <script src="game.js"></script>
  </body>
</html>
`,
    'styles.css': `html,body{margin:0;min-height:100%;font-family:system-ui,sans-serif;background:#0b1220;color:#eef2ff}
main{padding:28px 20px}.kicker{text-transform:uppercase;letter-spacing:.08em;font-size:11px;color:#8aefb8}
button{margin-top:12px;padding:10px 14px;border:0;border-radius:10px;background:#3ddc84;font-weight:700}
`,
    'game.js': `/* Bare Android WebView / Capacitor stub. */
(function () {
  const btn = document.getElementById('share');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const payload = { title: ${JSON.stringify(safe)}, text: 'Play ${safe.replace(/'/g, '')}.' };
    if (navigator.share) {
      try { await navigator.share(payload); } catch (e) { /* cancelled */ }
      return;
    }
    console.log('Share stub', payload);
  });
})();
`,
  };
}

async function writePack({ packsRoot, platform, payload, catalog, model, mode, kind }) {
  const w = payload.winner;
  const slug = uniqueSlug(w.slug || w.title, catalog, platform);
  const folder = path.join(packsRoot, slug);
  if (await pathExists(folder)) {
    throw new Error(`Pack folder already exists: ${folder}`);
  }
  await fsp.mkdir(path.join(folder, 'skeleton'), { recursive: true });

  const scores = w.scores || {};
  const { min, avg } = scoreStats(scores);
  const status = min >= 8 && avg >= 8.2 ? 'ready' : 'ready';

  const manifest = {
    id: slug,
    title: w.title,
    slug,
    status,
    kind: platform === 'android' ? w.kind || kind || 'game' : 'game',
    platforms: [platform],
    genre: w.genre || '',
    oneLiner: w.oneLiner,
    inspiredBy: w.inspiredBy || [],
    targetAudience: w.targetAudience || '',
    createdAt: new Date().toISOString().slice(0, 10),
    generatedBy: 'studio-plan-next',
    relationshipToCatalog: w.relationshipToCatalog || 'new',
    tags: w.tags || [],
    scores,
    pillars: w.pillars || {},
    research: {
      model,
      mode,
      asOf: (payload.research && payload.research.asOf) || new Date().toISOString().slice(0, 10),
      decision: payload.decision,
    },
  };

  const docs = payload.docs || {};
  const files = {
    'pack.json': JSON.stringify(manifest, null, 2),
    'README.md': String(docs.README || '').trim() + '\n',
    'FILTER-DECISION.md': String(docs.FILTER_DECISION || '').trim() + '\n',
    'PILLARS.md': String(docs.PILLARS || '').trim() + '\n',
    'AUDIENCE.md': String(docs.AUDIENCE || '').trim() + '\n',
    'MONETIZATION.md': String(docs.MONETIZATION || '').trim() + '\n',
    'DISCOVERY.md': String(docs.DISCOVERY || '').trim() + '\n',
    'LIVEOPS.md': String(docs.LIVEOPS || '').trim() + '\n',
    'MARKET-RESEARCH.md': String(docs.MARKET_RESEARCH || '').trim() + '\n',
  };
  if (platform === 'android') {
    files['PLAY-CHECKLIST.md'] = String(docs.PLAY_CHECKLIST || '').trim() + '\n';
  } else {
    files['UPLOAD-CHECKLIST.md'] = String(docs.UPLOAD_CHECKLIST || '').trim() + '\n';
  }

  const runMeta = {
    writtenAt: new Date().toISOString(),
    platform,
    mode,
    kindPreference: kind,
    model,
    slug,
    title: w.title,
    candidatesConsidered: payload.candidatesConsidered || [],
    research: payload.research || {},
    scores,
    redTeam: w.redTeam || {},
  };
  files['RESEARCH-RUN.json'] = JSON.stringify(runMeta, null, 2);

  for (const [name, content] of Object.entries(files)) {
    await fsp.writeFile(path.join(folder, name), content, 'utf8');
  }

  const skeleton =
    platform === 'android'
      ? androidSkeleton(w.title, manifest.kind)
      : facebookSkeleton(w.title);
  for (const [name, content] of Object.entries(skeleton)) {
    await fsp.writeFile(path.join(folder, 'skeleton', name), content, 'utf8');
  }

  return { folder, slug, manifest };
}

async function appendHistory(dataDir, record) {
  const file = path.join(dataDir, 'research-history.json');
  let list = [];
  try {
    list = parseJsonLoose(await fsp.readFile(file, 'utf8'));
    if (!Array.isArray(list)) list = [];
  } catch {
    list = [];
  }
  list.unshift(record);
  list = list.slice(0, 40);
  await fsp.writeFile(file, JSON.stringify(list, null, 2), 'utf8');
  return list;
}

async function readHistory(dataDir) {
  const file = path.join(dataDir, 'research-history.json');
  try {
    const list = parseJsonLoose(await fsp.readFile(file, 'utf8'));
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function createResearchController(ctx) {
  let running = false;

  async function getCatalog() {
    const settings = await ctx.readSettings();
    return buildCatalog({
      listInfoPacks: ctx.listInfoPacks,
      listPublishedGames: ctx.listPublishedGames,
      pathsFacebook: ctx.pathsFor(settings, 'facebook'),
      pathsAndroid: ctx.pathsFor(settings, 'android'),
    });
  }

  async function buildPromptForPaste(options) {
    const platform = options.platform === 'android' ? 'android' : 'facebook';
    const mode = options.mode === 'allow-sequel' ? 'allow-sequel' : 'prefer-new';
    const kind =
      platform === 'facebook'
        ? 'game'
        : options.kind === 'game' || options.kind === 'app'
          ? options.kind
          : 'auto';
    const settings = await ctx.readSettings();
    const catalog = await getCatalog();
    const roots = ctx.pathsFor(settings, platform);
    return buildPastePrompt({
      projectRoot: ctx.projectRoot,
      packsRoot: roots.packs,
      catalog,
      options: { platform, mode, kind },
    });
  }

  async function run(options, onProgress) {
    if (running) {
      return { ok: false, error: 'A research run is already in progress.' };
    }
    running = true;
    const log = [];
    const emit = (phase, message, pct) => {
      const entry = { at: new Date().toISOString(), phase, message, pct };
      log.push(entry);
      if (typeof onProgress === 'function') onProgress(entry);
    };

    try {
      const platform = options.platform === 'android' ? 'android' : 'facebook';
      const mode = options.mode === 'allow-sequel' ? 'allow-sequel' : 'prefer-new';
      const kind =
        platform === 'facebook'
          ? 'game'
          : options.kind === 'game' || options.kind === 'app'
            ? options.kind
            : 'auto';

      emit('start', `Planning next ${platform === 'android' ? 'Android app/game' : 'Instant Game'}…`, 4);

      const settings = await ctx.readSettings();
      loadDotEnv(ctx.projectRoot);
      const apiKey = resolveApiKey(settings);
      const engine = options.engine === 'api' || settings.researchEngine === 'api' ? 'api' : 'grok-build';

      emit('inventory', 'Scanning packs, library, and workspaces on both platforms…', 10);
      const catalog = await getCatalog();
      emit(
        'inventory',
        `Catalog has ${catalog.length} existing title(s). These will be blocked from duplication.`,
        16
      );

      if (engine === 'grok-build') {
        const roots = ctx.pathsFor(settings, platform);
        const viaBuild = await runViaGrokBuild({
          projectRoot: ctx.projectRoot,
          packsRoot: roots.packs,
          catalog,
          options: { platform, mode, kind },
          onProgress: emit,
        });
        if (viaBuild && viaBuild.ok) {
          const record = {
            id: `run-${Date.now()}`,
            at: new Date().toISOString(),
            platform,
            mode,
            kind,
            ok: true,
            slug: viaBuild.slug,
            title: viaBuild.title,
            packPath: viaBuild.packPath,
            status: viaBuild.status || 'ready',
            scores: viaBuild.scores,
            oneLiner: viaBuild.oneLiner,
            productKind: viaBuild.kind,
            engine: 'grok-build',
          };
          await appendHistory(ctx.dataDir, record);
          return { ...viaBuild, log };
        }
        if (viaBuild && viaBuild.dropped) {
          await appendHistory(ctx.dataDir, {
            id: `run-${Date.now()}`,
            at: new Date().toISOString(),
            platform,
            mode,
            kind,
            ok: false,
            dropped: true,
            dropReason: viaBuild.error,
            engine: 'grok-build',
          });
          return { ...viaBuild, log };
        }
        if (apiKey) {
          emit('research', 'Grok Build handoff did not finish — falling back to xAI API key…', 22);
        } else {
          return {
            ok: false,
            error: viaBuild && viaBuild.error ? viaBuild.error : 'Grok Build did not complete the plan.',
            needsGrokChat: viaBuild && viaBuild.needsGrokChat,
            promptPath: viaBuild && viaBuild.promptPath,
            log,
          };
        }
      } else if (!apiKey) {
        return {
          ok: false,
          error:
            'Research engine is set to xAI API but no key is saved. Switch back to Grok Build (default) or add a key in Settings.',
          log,
        };
      }

      const model = settings.researchModel || DEFAULT_MODEL;
      const system = buildSystemPrompt(platform);
      let user = buildUserPrompt({ platform, mode, kind, catalog });
      let payload = null;
      let lastErrors = [];

      for (let attempt = 1; attempt <= 2; attempt += 1) {
        emit(
          'research',
          attempt === 1
            ? `Live market research via ${model} + web search (this can take a minute)…`
            : 'Retrying with filter feedback…',
          attempt === 1 ? 28 : 62
        );
        const grok = await callGrok({
          apiKey,
          model,
          system,
          user,
          timeoutMs: 8 * 60 * 1000,
        });
        emit('parse', 'Reading research JSON…', attempt === 1 ? 70 : 78);
        try {
          payload = parseJsonFromModel(grok.text);
        } catch (err) {
          lastErrors = [err.message || String(err)];
          user = buildUserPrompt({
            platform,
            mode,
            kind,
            catalog,
            extraFeedback: lastErrors.join('\n'),
          });
          continue;
        }
        if (Array.isArray(grok.citations) && grok.citations.length && payload.research) {
          const extra = grok.citations
            .map((c) => (typeof c === 'string' ? c : c.url || c))
            .filter(Boolean);
          payload.research.citationsFromTool = extra;
        }
        lastErrors = validatePayload(payload, { platform, kind, catalog, mode });
        if (!lastErrors.length) break;
        emit('filter', `Quality gate failed: ${lastErrors[0]}`, 80);
        user = buildUserPrompt({
          platform,
          mode,
          kind,
          catalog,
          extraFeedback: lastErrors.join('\n'),
        });
        payload = null;
      }

      if (!payload) {
        return {
          ok: false,
          error: `Research did not produce a valid pack. ${lastErrors.join(' ')}`,
          log,
        };
      }

      if (payload.decision === 'drop') {
        const record = {
          id: `run-${Date.now()}`,
          at: new Date().toISOString(),
          platform,
          mode,
          kind,
          ok: false,
          dropped: true,
          dropReason: payload.dropReason || 'No candidate survived the filter.',
          candidates: payload.candidatesConsidered || [],
        };
        await appendHistory(ctx.dataDir, record);
        return {
          ok: false,
          dropped: true,
          error: payload.dropReason || 'No candidate survived the red team. Nothing written.',
          payload,
          log,
        };
      }

      emit('write', 'Writing info pack to disk…', 88);
      const roots = ctx.pathsFor(settings, platform);
      await fsp.mkdir(roots.packs, { recursive: true });
      const written = await writePack({
        packsRoot: roots.packs,
        platform,
        payload,
        catalog,
        model,
        mode,
        kind,
      });

      const record = {
        id: `run-${Date.now()}`,
        at: new Date().toISOString(),
        platform,
        mode,
        kind,
        ok: true,
        slug: written.slug,
        title: written.manifest.title,
        packPath: written.folder,
        status: written.manifest.status,
        scores: written.manifest.scores,
        oneLiner: written.manifest.oneLiner,
        productKind: written.manifest.kind,
      };
      await appendHistory(ctx.dataDir, record);
      emit('done', `Pack ready: ${written.manifest.title}`, 100);

      return {
        ok: true,
        packPath: written.folder,
        slug: written.slug,
        folderName: written.slug,
        title: written.manifest.title,
        status: written.manifest.status,
        kind: written.manifest.kind,
        oneLiner: written.manifest.oneLiner,
        scores: written.manifest.scores,
        candidates: payload.candidatesConsidered || [],
        research: payload.research || {},
        log,
      };
    } catch (err) {
      return {
        ok: false,
        error: err && err.message ? err.message : String(err),
        log,
      };
    } finally {
      running = false;
    }
  }

  return {
    getCatalog,
    buildPromptForPaste,
    run,
    cancel: () => {
      killActive();
      running = false;
    },
    readHistory: () => readHistory(ctx.dataDir),
    isRunning: () => running,
    resolveApiKey,
    maskKey,
    loadDotEnv,
    findGrokExe,
    DEFAULT_MODEL,
  };
}

module.exports = {
  createResearchController,
  resolveApiKey,
  maskKey,
  loadDotEnv,
  findGrokExe,
  DEFAULT_MODEL,
};
