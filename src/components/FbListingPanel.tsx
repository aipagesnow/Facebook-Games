import { useCallback, useEffect, useMemo, useState } from 'react';
import { CopyButton } from './CopyButton';
import { CopyField } from './CopyField';
import { getAPI } from '../lib/api';
import {
  DEFAULT_CATEGORY,
  DEFAULT_PUBLISHER,
  formatListingClipboard,
  getUseCasesForListing,
  isTaglineValid,
  listingFromGame,
  TAGLINE_MAX_CHARS,
  zipFolderPath,
  type FbListing,
} from '../lib/fbListing';
import {
  mediaFilePath,
  META_MEDIA_SLOTS,
  optionalMediaSlots,
  requiredMediaSlots,
  storeAssetsDir,
  type MediaSlot,
} from '../lib/fbMedia';
import type { PublishedGame } from '../types/api';
import { UseCasePickerGuide } from './UseCasePickerGuide';

interface Props {
  game: PublishedGame;
  compact?: boolean;
}

function Section({
  title,
  children,
  hint,
}: {
  title: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <section className="card" style={{ marginBottom: 16 }}>
      <div className="section-title">{title}</div>
      {hint ? (
        <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.45 }}>
          {hint}
        </p>
      ) : null}
      {children}
    </section>
  );
}

function MediaSlotRow({
  slot,
  buildFolder,
  exists,
  onOpenFolder,
  onOpenFile,
}: {
  slot: MediaSlot;
  buildFolder: string;
  exists: boolean | null;
  onOpenFolder: () => void;
  onOpenFile: (path: string) => void;
}) {
  const path = mediaFilePath(buildFolder, slot.fileName);
  const badge =
    slot.priority === 'required' ? (
      <span className="badge" style={{ background: 'rgba(220,80,60,0.2)', color: '#ffb4a8' }}>
        Required
      </span>
    ) : (
      <span className="badge" style={{ background: 'rgba(100,120,150,0.25)', color: 'var(--text-muted)' }}>
        Optional
      </span>
    );

  const status =
    exists === null ? (
      <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Checking…</span>
    ) : exists ? (
      <span style={{ fontSize: 12, color: 'var(--good, #3dd68c)', fontWeight: 700 }}>File ready on disk</span>
    ) : (
      <span style={{ fontSize: 12, color: '#ffb070', fontWeight: 700 }}>Missing — add this file</span>
    );

  return (
    <div
      style={{
        border: '1px solid var(--border, rgba(255,255,255,0.08))',
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
        background: exists ? 'rgba(40,120,70,0.08)' : 'rgba(0,0,0,0.12)',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 6 }}>
        <strong style={{ fontSize: 14 }}>{slot.label}</strong>
        {badge}
        <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{slot.tab}</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>{slot.size}</span>
      </div>
      <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.4 }}>
        <strong style={{ color: 'var(--text)' }}>What it’s for: </strong>
        {slot.whatFor}
      </p>
      <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.4 }}>
        <strong style={{ color: 'var(--text)' }}>What you need to provide: </strong>
        {slot.howTo}
      </p>
      <div style={{ marginBottom: 8 }}>{status}</div>
      <CopyField label={`File path (put file here as ${slot.fileName})`} value={path || '(set game workspace first)'} />
      <div className="header-actions" style={{ flexWrap: 'wrap', marginTop: 4, gap: 6 }}>
        <button type="button" className="btn btn-sm" onClick={onOpenFolder}>
          Open store-assets folder
        </button>
        {exists && path ? (
          <button type="button" className="btn btn-sm" onClick={() => onOpenFile(path)}>
            Show this file in Explorer
          </button>
        ) : null}
        <CopyButton text={path} label="Copy path" className="btn btn-sm" />
      </div>
    </div>
  );
}

export function FbListingPanel({ game, compact }: Props) {
  const listing: FbListing = listingFromGame(game);
  const allText = formatListingClipboard(listing, game.facebookAppId);
  const bullets = (listing.featureBullets || []).map((b) => `• ${b}`).join('\n');
  const tags = (listing.tags || []).join(', ');
  const checklist = (listing.checklist || []).map((c, i) => `${i + 1}. ${c}`).join('\n');
  const useCases = getUseCasesForListing(listing);
  const zipPath = listing.uploadZipPath || '';
  const zipDir = zipFolderPath(zipPath);
  const buildFolder = listing.buildFolder || game.workspacePath || '';
  const assetsDir = storeAssetsDir(buildFolder);
  const privacyLocal =
    listing.privacyPolicyFile ||
    (assetsDir ? `${assetsDir}${assetsDir.includes('\\') ? '\\' : '/'}privacy-word-streak-duels.html` : '');

  const [openToast, setOpenToast] = useState<string | null>(null);
  const [existsMap, setExistsMap] = useState<Record<string, boolean>>({});

  const required = useMemo(() => requiredMediaSlots(), []);
  const optional = useMemo(() => optionalMediaSlots(), []);

  const refreshExists = useCallback(async () => {
    const api = getAPI();
    if (!buildFolder || typeof api.pathExists !== 'function') {
      setExistsMap({});
      return;
    }
    const next: Record<string, boolean> = {};
    for (const slot of META_MEDIA_SLOTS) {
      const p = mediaFilePath(buildFolder, slot.fileName);
      next[slot.id] = p ? await api.pathExists(p) : false;
    }
    if (privacyLocal) {
      next.privacyFile = await api.pathExists(privacyLocal);
    }
    if (assetsDir) {
      next.assetsDir = await api.pathExists(assetsDir);
    }
    setExistsMap(next);
  }, [buildFolder, privacyLocal, assetsDir]);

  useEffect(() => {
    void refreshExists();
  }, [refreshExists]);

  function toast(msg: string, ms = 4000) {
    setOpenToast(msg);
    window.setTimeout(() => setOpenToast(null), ms);
  }

  async function openFolder(path: string, successMsg: string) {
    const api = getAPI();
    try {
      if (typeof api.openPath === 'function' && path) {
        const res = await api.openPath(path);
        toast(res.ok ? successMsg : res.error || 'Could not open folder');
        return;
      }
      toast('Open folder only works in the desktop app (Electron)');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Open failed');
    }
  }

  async function openZipFolder() {
    const api = getAPI();
    toast('Opening Explorer…');
    try {
      if (typeof api.openZipHelper === 'function') {
        const res = await api.openZipHelper(zipPath || zipDir || '');
        if (res.ok) {
          toast('Explorer opened — drag game.zip into Meta’s upload box');
          return;
        }
        if (zipPath) {
          const shown = await api.showItemInFolder(zipPath);
          if (shown.ok) {
            toast('Explorer opened — drag game.zip into Meta');
            return;
          }
        }
        if (zipDir) {
          const opened = await api.openPath(zipDir);
          if (opened.ok) {
            toast('Folder opened — drag game.zip into Meta');
            return;
          }
        }
        toast(res.error || 'Could not open Explorer', 5000);
        return;
      }
      toast('Open folder only works in the desktop app (Electron), not browser preview');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Open folder failed');
    }
  }

  async function showFile(path: string) {
    const api = getAPI();
    if (typeof api.showItemInFolder === 'function') {
      const res = await api.showItemInFolder(path);
      toast(res.ok ? 'File selected in Explorer' : res.error || 'Could not show file');
    }
  }

  return (
    <div className="fb-listing-panel">
      <div className="header-actions" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
        <CopyButton text={allText} label="Copy ALL FB fields" className="btn btn-primary btn-sm" />
        <CopyButton
          text={listing.buildFolder || game.workspacePath || ''}
          label="Copy build folder"
          className="btn btn-sm"
        />
        <CopyButton text={zipPath} label="Copy upload ZIP path" className="btn btn-sm" />
        {game.facebookAppId ? (
          <CopyButton text={game.facebookAppId} label="Copy App ID" className="btn btn-sm" />
        ) : null}
        <button type="button" className="btn btn-sm" onClick={() => void refreshExists()}>
          Refresh media status
        </button>
      </div>

      {openToast && (
        <div
          className="alert"
          style={{
            marginBottom: 12,
            background: 'var(--accent-soft)',
            border: '1px solid rgba(24,119,242,0.35)',
            color: 'var(--text)',
            fontSize: 13,
          }}
        >
          {openToast}
        </div>
      )}

      {/* 1 — Web hosting / zip */}
      <Section
        title="1. Meta Web hosting — upload game code"
        hint="Meta path: Instant Game → Web hosting → Upload Version. Drag game.zip, paste version comment, Upload, then Push to Production."
      >
        <div className="header-actions" style={{ flexWrap: 'wrap', marginBottom: 12 }}>
          <button type="button" className="btn btn-primary" onClick={() => void openZipFolder()}>
            Open folder with game.zip
          </button>
          <CopyButton text={listing.versionComment || ''} label="Copy version comment" className="btn btn-sm" />
        </div>
        <CopyField
          label="Version comment (paste into Meta “Version Comments” — bump each upload)"
          value={listing.versionComment || ''}
          multiline
        />
        <CopyField label="ZIP file path (drag this file into Meta — not the path text)" value={zipPath} />
        <CopyField label="Entry file" value={listing.entryFile || 'index.html'} />
        <CopyField label="Config file" value={listing.configFile || 'fbapp-config.json'} />
        <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--text-dim)' }}>
          Edit version comment in <code>games/…/fb-listing.json</code>, then Refresh studio.
        </p>
      </Section>

      {/* 2 — Use cases */}
      <Section
        title="2. Meta Create app → Use cases"
        hint="At app creation pick only Instant Game. Add Audience Network / ads later under Show ads."
      >
        <UseCasePickerGuide useCases={useCases} gameTitle={listing.title || game.title} />
      </Section>

      {/* 3 — Game Details text */}
      <Section
        title="3. Meta Details → Game Details (text fields)"
        hint="Customize → Details. Copy each field into Meta. Tagline is hard-capped at 40 characters — keep it short for every future game or Meta will cut mid-sentence."
      >
        <CopyField label="Title" value={listing.title || ''} />
        <CopyField
          label="Publisher (studio / Business name — same for every game)"
          value={listing.publisher || DEFAULT_PUBLISHER}
        />
        <CopyField
          label={`Tagline (Meta Details — max ${TAGLINE_MAX_CHARS} chars; currently ${(listing.storeHook || '').length})`}
          value={listing.storeHook || ''}
        />
        {!isTaglineValid(listing.storeHook || '') ? (
          <p style={{ margin: '0 0 10px', fontSize: 12, color: '#ffb070' }}>
            Tagline is empty or over {TAGLINE_MAX_CHARS} characters. Shorten it in{' '}
            <code>fb-listing.json</code> → <code>storeHook</code> before pasting into Meta.
          </p>
        ) : (
          <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--text-dim)' }}>
            Tip for future games: write the tagline first under 40 chars (e.g. “60s puzzle race — beat your
            best!”). Full sentences get cut off in Meta.
          </p>
        )}
        <CopyField label="Short description" value={listing.shortDescription || ''} multiline />
        {!compact && (
          <CopyField label="Long description" value={listing.longDescription || ''} multiline />
        )}
        <CopyField
          label="Category (pick in Meta dropdown)"
          value={listing.category || DEFAULT_CATEGORY}
        />
        <CopyField label="Orientation" value={listing.orientation || 'PORTRAIT'} />
        <CopyField label="Tags (internal notes / store tags)" value={tags} />
        <CopyField label="Feature bullets" value={bullets} multiline />
        <CopyField
          label="Connection experience"
          value={listing.connectionExperience || 'Zero permissions (recommended for Instant Games)'}
        />
        <CopyField
          label="Zero Permissions"
          value={listing.zeroPermissions === false ? 'No' : 'Yes — keep selected'}
        />
      </Section>

      {/* 4 — Game Media */}
      <Section
        title="4. Meta Details → Game Media"
        hint={
          'Red badges on Meta = required. Put files in each game’s store-assets folder (open below). ' +
          'File names must match so the studio can track “ready / missing”. ' +
          'For a new game: create store-assets/ and drop files using the names shown.'
        }
      >
        <div className="header-actions" style={{ flexWrap: 'wrap', marginBottom: 12 }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void openFolder(assetsDir, 'store-assets folder opened')}
          >
            Open store-assets folder
          </button>
          <CopyButton text={assetsDir} label="Copy store-assets path" className="btn btn-sm" />
          <button type="button" className="btn btn-sm" onClick={() => void refreshExists()}>
            Re-check files
          </button>
        </div>
        <CopyField label="store-assets folder (create this under each game)" value={assetsDir || '(set workspace)'} />
        {existsMap.assetsDir === false ? (
          <p style={{ color: '#ffb070', fontSize: 13 }}>
            Folder missing — create <code>store-assets</code> inside the game folder, then drop media files in.
          </p>
        ) : null}

        <div className="section-title" style={{ margin: '14px 0 8px', fontSize: 14 }}>
          Required media (red on Meta)
        </div>
        {required.map((slot) => (
          <MediaSlotRow
            key={slot.id}
            slot={slot}
            buildFolder={buildFolder}
            exists={existsMap[slot.id] ?? null}
            onOpenFolder={() => void openFolder(assetsDir, 'store-assets opened')}
            onOpenFile={(p) => void showFile(p)}
          />
        ))}

        {!compact && (
          <>
            <div className="section-title" style={{ margin: '14px 0 8px', fontSize: 14 }}>
              Optional media (skip for launch if rushed)
            </div>
            {optional.map((slot) => (
              <MediaSlotRow
                key={slot.id}
                slot={slot}
                buildFolder={buildFolder}
                exists={existsMap[slot.id] ?? null}
                onOpenFolder={() => void openFolder(assetsDir, 'store-assets opened')}
                onOpenFile={(p) => void showFile(p)}
              />
            ))}
          </>
        )}
      </Section>

      {/* 5 — Privacy */}
      <Section
        title="5. Privacy policy"
        hint="Meta needs a public HTTPS URL. Host the local HTML file (GitHub Pages, Netlify, your site), then paste the live URL into Details → Privacy policy."
      >
        <CopyField
          label="Privacy policy URL (paste into Meta once hosted)"
          value={listing.privacyPolicyUrl || '(host the HTML file, then paste the public URL here in fb-listing.json)'}
        />
        <CopyField label="Local privacy HTML file" value={privacyLocal || ''} />
        <div className="header-actions" style={{ flexWrap: 'wrap', gap: 6 }}>
          {privacyLocal ? (
            <button type="button" className="btn btn-sm" onClick={() => void showFile(privacyLocal)}>
              Show privacy file in Explorer
            </button>
          ) : null}
          <CopyButton text={privacyLocal} label="Copy local privacy path" className="btn btn-sm" />
        </div>
        <p style={{ margin: '10px 0 0', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.45 }}>
          <strong>What you need:</strong> A page online that states how the game handles data (Facebook Instant
          Games, local scores, optional ads). A ready file is in <code>store-assets</code> / <code>docs</code>.
          After you host it, put the URL in <code>fb-listing.json</code> → <code>privacyPolicyUrl</code> and
          Refresh.
        </p>
      </Section>

      {/* 6 — App page / Live */}
      <Section
        title="6. App Page, Share, Live mode"
        hint="App Page is optional for Instant Games but Meta shows requirements if you create one. Live mode is required for broad public access."
      >
        <CopyField
          label="App Page notes"
          value={
            'Optional. If creating: page name should match the app, you must be app + page admin, page not linked to another app. Path: Details → App Page and Sharing Options.'
          }
          multiline
        />
        <CopyField
          label="Go Live checklist"
          value={
            '1) Production zip latest\n2) Details text complete\n3) Required Game Media uploaded\n4) Privacy URL live\n5) App mode Development → Live / Publish\n6) Test play link on phone Facebook app'
          }
          multiline
        />
      </Section>

      {/* 7 — Monetization */}
      <Section
        title="7. Ads / Monetization (Audience Network)"
        hint="Business: Apex Arcade Studio → Monetization Manager → property = game name → Rewarded Video placement. Put Placement ID in the game code."
      >
        <CopyField
          label="Rewarded placement ID (in-game streak freeze)"
          value={listing.rewardedPlacementId || '(add after creating Rewarded placement)'}
        />
        <CopyField
          label="Publisher / Business (reuse every game)"
          value={listing.publisher || DEFAULT_PUBLISHER}
        />
        <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.45 }}>
          <strong>What you need:</strong> Meta Business unrestricted for ads, Instant Game property, Rewarded
          Video placement, then set <code>WSD_REWARDED_PLACEMENT_ID</code> (or listing field) and re-upload zip.
          Ads often only fill on mobile Facebook; desktop may show “not available”.
        </p>
      </Section>

      {/* 8 — Paths + checklist */}
      <Section title="8. Local paths & launch checklist">
        <CopyField label="Build folder (source files on PC)" value={buildFolder} />
        <CopyField label="Upload ZIP" value={zipPath} />
        {!compact && (
          <>
            <CopyField label="Icon art brief" value={listing.iconBrief || ''} multiline />
            <CopyField label="Cover art brief" value={listing.coverBrief || ''} multiline />
            <CopyField label="Share image idea" value={listing.shareImageIdea || ''} multiline />
            <CopyField label="Video brief" value={listing.videoBrief || ''} multiline />
            <CopyField label="SDK notes" value={listing.sdkNotes || ''} multiline />
            <CopyField label="Upload checklist" value={checklist} multiline />
          </>
        )}
      </Section>
    </div>
  );
}
