const path = require('path');
const fsp = require('fs/promises');

async function pathExists(p) {
  try {
    await fsp.access(p);
    return true;
  } catch {
    return false;
  }
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function otherPlatform(p) {
  return p === 'android' ? 'facebook' : 'android';
}

function formatPortPrompt({ from, to, title, slug, kind, oneLiner, sourcePackPath, destPackPath, destWorkspace, catalogSkip }) {
  const appOnFacebook = to === 'facebook' && kind === 'app';
  const skip = (catalogSkip || []).map((s) => `- ${s}`).join('\n') || '- (none)';
  return [
    `I pasted this from Games Studio. Evaluate whether "${title}" should launch on ${to === 'android' ? 'Android / Google Play' : 'Facebook Instant Games'} — or stay only on ${from === 'android' ? 'Android' : 'Facebook'}.`,
    '',
    'Do this in two phases. Phase 1 is mandatory. Do not start a port until Phase 1 says GO.',
    '',
    'SOURCE (already shipping / building)',
    `- Platform: ${from}`,
    `- Title: ${title}`,
    `- Slug: ${slug}`,
    `- Kind: ${kind || 'game'}`,
    oneLiner ? `- One-liner: ${oneLiner}` : '',
    `- Source pack: ${sourcePackPath}`,
    '',
    'DESTINATION (candidate only — not approved yet)',
    `- Platform: ${to}`,
    `- Candidate pack already created: ${destPackPath}`,
    `- Would-be workspace: ${destWorkspace}`,
    '',
    appOnFacebook
      ? 'WARNING: This is a utility APP. Facebook Instant Games are games only. Default is LEAVE-ON-PLAY unless you can honestly reshape it into a short-session Instant Game without becoming a different product.'
      : '',
    to === 'android' && (kind || 'game') === 'game'
      ? 'Play create-app Game vs App cannot be changed later. If this ports, create it as a Game.'
      : '',
    '',
    'PHASE 1 — is a second platform worth it?',
    'Live-research the destination market. Then decide GO or NO-GO.',
    '',
    'NO-GO if any of these are true:',
    '- The loop is a poor fit for the destination (Instant-only social/zero-perm, or Play-only utility).',
    '- You would have to change the core verb so much it is a different product.',
    '- Small-team cost of a second store + live-ops is worse than the upside.',
    '- A near-clone already dominates that store and we have no named UX edge.',
    '',
    'GO only if you can name ≥2 destination-specific reasons (discovery, session context, monetization, or distribution) AND the same core loop still works.',
    '',
    'Write DEST pack PORT-DECISION.md (GO or NO-GO, reasons, sources).',
    'Set dest pack.json status to `ready` on GO, or `archived` on NO-GO.',
    '',
    'PHASE 2 — only if GO',
    `Fill the rest of the dest pack for ${to} (platform checklist, discovery sizes, monetization).`,
    'Then you may build. Do not invent a different game. Port the loop.',
    `Workspace: ${destWorkspace}`,
    '',
    'Existing studio titles (do not collide):',
    skip,
    '',
    'Reply in chat with: decision (GO / NO-GO), 3–6 reasons, and the dest pack path.',
  ]
    .filter((l) => l !== '')
    .join('\n');
}

async function uniqueFolder(root, base) {
  let name = base || `port-${Date.now()}`;
  if (!(await pathExists(path.join(root, name)))) return name;
  let n = 2;
  while (await pathExists(path.join(root, `${base}-${n}`))) n += 1;
  return `${base}-${n}`;
}

async function proposeCrossPlatform({
  fromPlatform,
  packPath,
  destPacksRoot,
  destWorkspaceRoot,
  catalogSkip,
}) {
  const from = fromPlatform === 'android' ? 'android' : 'facebook';
  const to = otherPlatform(from);
  if (!(await pathExists(packPath))) {
    return { ok: false, error: `Source pack not found: ${packPath}` };
  }
  if (!destPacksRoot) {
    return { ok: false, error: 'Destination packs folder is not set (Settings).' };
  }

  let manifest = {};
  const manifestPath = path.join(packPath, 'pack.json');
  if (await pathExists(manifestPath)) {
    try {
      manifest = JSON.parse(await fsp.readFile(manifestPath, 'utf8'));
    } catch (err) {
      return { ok: false, error: `Could not read source pack.json: ${err.message || err}` };
    }
  }

  const title = manifest.title || path.basename(packPath);
  const slug = slugify(manifest.slug || manifest.id || path.basename(packPath));
  const kind = manifest.kind === 'app' ? 'app' : 'game';

  await fsp.mkdir(destPacksRoot, { recursive: true });
  const folderName = await uniqueFolder(destPacksRoot, slug);
  const destPath = path.join(destPacksRoot, folderName);
  await fsp.mkdir(destPath, { recursive: true });

  const destWorkspace = path.join(destWorkspaceRoot || '', slug);
  const destManifest = {
    id: folderName,
    title,
    slug,
    status: 'candidate',
    kind,
    platforms: [to],
    genre: manifest.genre || '',
    oneLiner: manifest.oneLiner || '',
    inspiredBy: manifest.inspiredBy || [],
    targetAudience: manifest.targetAudience || '',
    createdAt: new Date().toISOString().slice(0, 10),
    tags: manifest.tags || [],
    pillars: manifest.pillars || {},
    generatedBy: 'cross-platform-consider',
    sourcePlatform: from,
    sourcePackPath: packPath,
    siblingSlug: slug,
    relationshipToCatalog: 'better-version',
  };

  const readmeBits = [];
  for (const name of ['README.md', 'FILTER-DECISION.md', 'PILLARS.md']) {
    const full = path.join(packPath, name);
    if (await pathExists(full)) {
      readmeBits.push(`## From ${from} \`${name}\`\n\n${await fsp.readFile(full, 'utf8')}`);
    }
  }

  const files = {
    'pack.json': JSON.stringify(destManifest, null, 2) + '\n',
    'README.md': [
      `# ${title} — ${to} candidate`,
      '',
      `Candidate port from **${from}**. Not approved yet.`,
      '',
      manifest.oneLiner || '',
      '',
      'Paste the studio **Evaluate other platform** prompt into Grok Build.',
      'Grok must decide GO or NO-GO before any port work.',
      '',
      `Source pack: \`${packPath}\``,
      '',
    ].join('\n'),
    'PORT-DECISION.md': [
      `# Port decision — ${title} → ${to}`,
      '',
      'Status: **pending evaluation**.',
      '',
      'Grok Build fills this after Phase 1:',
      '',
      '- Decision: GO / NO-GO',
      '- Why (destination market + fit + cost)',
      '- Sources',
      '- If NO-GO: leave live only on ' + from,
      '- If GO: upgrade this pack to `ready` and fill platform docs',
      '',
    ].join('\n'),
    'SOURCE-NOTES.md': readmeBits.join('\n\n---\n\n') || `(no source docs found in ${packPath})\n`,
  };

  for (const [name, content] of Object.entries(files)) {
    await fsp.writeFile(path.join(destPath, name), content, 'utf8');
  }

  const prompt = formatPortPrompt({
    from,
    to,
    title,
    slug,
    kind,
    oneLiner: manifest.oneLiner || '',
    sourcePackPath: packPath,
    destPackPath: destPath,
    destWorkspace,
    catalogSkip,
  });

  await fsp.writeFile(path.join(destPath, 'EVALUATE-PROMPT.md'), prompt + '\n', 'utf8');

  return {
    ok: true,
    destPlatform: to,
    destPackPath: destPath,
    destFolderName: folderName,
    prompt,
    title,
    kind,
  };
}

module.exports = { proposeCrossPlatform, otherPlatform };
