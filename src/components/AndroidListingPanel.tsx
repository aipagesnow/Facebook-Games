import { useCallback, useEffect, useMemo, useState } from 'react';
import { CopyButton } from './CopyButton';
import { CopyField } from './CopyField';
import { getAPI } from '../lib/api';
import {
  DEFAULT_DEVELOPER,
  PLAY_SHORT_MAX,
  PLAY_TITLE_MAX,
  artifactFolderPath,
  formatAndroidListingClipboard,
  isPlayShortValid,
  isPlayTitleValid,
  listingFromGame,
  type AndroidListing,
} from '../lib/androidListing';
import {
  PLAY_MEDIA_SLOTS,
  mediaFilePath,
  optionalMediaSlots,
  requiredMediaSlots,
  storeAssetsDir,
  type MediaSlot,
} from '../lib/androidMedia';
import { setupForKind } from '../lib/androidPlaySetup';
import type { PublishedGame } from '../types/api';
import { PlaySetupGuide } from './PlaySetupGuide';
import { formatAssetPrompt } from '../lib/assetPrompts';
import { formatMtime, playConsoleHome, playStorePublic } from '../lib/storeLinks';

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
  title,
  extraBrief,
}: {
  slot: MediaSlot;
  buildFolder: string;
  exists: boolean | null;
  onOpenFolder: () => void;
  onOpenFile: (path: string) => void;
  title?: string;
  extraBrief?: string;
}) {
  const path = mediaFilePath(buildFolder, slot.fileName);
  const artPrompt = formatAssetPrompt({
    title: title || 'Studio title',
    slot,
    extraBrief,
    platform: 'android',
  });
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
      <CopyField label={`File path (put file here as ${slot.fileName})`} value={path || '(set workspace first)'} />
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
        <CopyButton text={artPrompt} label="Copy art prompt" className="btn btn-sm" />
      </div>
    </div>
  );
}

export function AndroidListingPanel({ game, compact }: Props) {
  const listing: AndroidListing = listingFromGame(game);
  const allText = formatAndroidListingClipboard(listing);
  const bullets = (listing.featureBullets || []).map((b) => `• ${b}`).join('\n');
  const tags = (listing.tags || []).join(', ');
  const checklist = (listing.checklist || []).map((c, i) => `${i + 1}. ${c}`).join('\n');
  const setup = setupForKind(listing.kind);
  const aabPath = listing.uploadAabPath || '';
  const aabDir = artifactFolderPath(aabPath);
  const buildFolder = listing.buildFolder || game.workspacePath || '';
  const assetsDir = storeAssetsDir(buildFolder);
  const privacyLocal = listing.privacyPolicyFile || '';

  const [openToast, setOpenToast] = useState<string | null>(null);
  const [existsMap, setExistsMap] = useState<Record<string, boolean>>({});
  const [aabMtime, setAabMtime] = useState('');

  const required = useMemo(() => requiredMediaSlots(), []);
  const optional = useMemo(() => optionalMediaSlots(), []);

  const refreshExists = useCallback(async () => {
    const api = getAPI();
    if (!buildFolder || typeof api.pathExists !== 'function') {
      setExistsMap({});
      return;
    }
    const next: Record<string, boolean> = {};
    for (const slot of PLAY_MEDIA_SLOTS) {
      const p = mediaFilePath(buildFolder, slot.fileName);
      next[slot.id] = p ? await api.pathExists(p) : false;
    }
    if (privacyLocal) next.privacyFile = await api.pathExists(privacyLocal);
    if (assetsDir) next.assetsDir = await api.pathExists(assetsDir);
    if (aabPath && typeof api.pathStat === 'function') {
      const st = await api.pathStat(aabPath);
      next.aab = Boolean(st.exists);
      setAabMtime(st.exists && st.mtimeMs ? formatMtime(st.mtimeMs) : '');
    } else if (aabPath) {
      next.aab = await api.pathExists(aabPath);
    }
    setExistsMap(next);
  }, [buildFolder, privacyLocal, assetsDir, aabPath]);

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

  async function openAabFolder() {
    const api = getAPI();
    toast('Opening Explorer…');
    try {
      if (typeof api.openZipHelper === 'function') {
        const res = await api.openZipHelper(aabPath || aabDir || '');
        if (res.ok) {
          toast('Explorer opened — upload this AAB in Play Console → Release');
          return;
        }
      }
      if (aabPath && typeof api.showItemInFolder === 'function') {
        const shown = await api.showItemInFolder(aabPath);
        if (shown.ok) {
          toast('Explorer opened — upload this AAB in Play Console');
          return;
        }
      }
      if (aabDir) {
        const opened = await api.openPath(aabDir);
        if (opened.ok) {
          toast('Folder opened — find app-release.aab');
          return;
        }
      }
      toast('Could not open Explorer. Check the AAB path.', 5000);
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
    <div className="android-listing-panel">
      <div className="header-actions" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
        <CopyButton text={allText} label="Copy ALL Play fields" className="btn btn-primary btn-sm" />
        <CopyButton
          text={listing.buildFolder || game.workspacePath || ''}
          label="Copy build folder"
          className="btn btn-sm"
        />
        <CopyButton text={aabPath} label="Copy AAB path" className="btn btn-sm" />
        {listing.packageName ? (
          <CopyButton text={listing.packageName} label="Copy package name" className="btn btn-sm" />
        ) : null}
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => void getAPI().openExternal(playConsoleHome())}
        >
          Open Play Console
        </button>
        {listing.packageName ? (
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => void getAPI().openExternal(playStorePublic(listing.packageName))}
          >
            Open Play listing
          </button>
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
            border: '1px solid rgba(61,220,132,0.35)',
            color: 'var(--text)',
            fontSize: 13,
          }}
        >
          {openToast}
        </div>
      )}

      <Section
        title="1. Play Console — upload the Android App Bundle"
        hint="Play path: Release → Testing → Internal testing (first) → Create new release. Upload the signed .aab, paste release notes, review, then roll out."
      >
        <div className="header-actions" style={{ flexWrap: 'wrap', marginBottom: 12 }}>
          <button type="button" className="btn btn-primary" onClick={() => void openAabFolder()}>
            Open folder with AAB
          </button>
          <CopyButton text={listing.releaseNotes || ''} label="Copy release notes" className="btn btn-sm" />
        </div>
        {existsMap.aab === false ? (
          <p style={{ color: '#ffb070', fontSize: 13, marginTop: 0 }}>
            AAB not on disk yet — build a signed bundle, save it as <code>app-release.aab</code> in the Android
            workspace, then refresh.
          </p>
        ) : null}
        <CopyField
          label="Release notes (Play → this release — bump versionCode each upload)"
          value={listing.releaseNotes || ''}
          multiline
        />
        <CopyField label="AAB file path (upload this file — not the path text)" value={aabPath} />
        <p style={{ margin: '0 0 10px', fontSize: 12, color: aabMtime ? 'var(--text-dim)' : '#ffb070' }}>
          {aabMtime
            ? `AAB last modified: ${aabMtime}`
            : 'AAB not on disk yet — do not upload a missing/stale bundle.'}
        </p>
        <CopyField label="Optional APK (sideload / debug only — Play wants AAB)" value={listing.uploadApkPath || '—'} />
        <CopyField label="Version name" value={String(listing.versionName || '1.0')} />
        <CopyField label="Version code (integer, must increase)" value={String(listing.versionCode ?? 1)} />
        <CopyField label="Release track" value={listing.track || 'internal'} />
        <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--text-dim)' }}>
          Edit listing fields in <code>android-apps/…/android-listing.json</code>, then Refresh studio.
        </p>
      </Section>

      <Section
        title="2. Play Console — create app & launch setup"
        hint="play.google.com/console → Create app. Pick Game or App once — it cannot be changed. Complete dashboard items before Production."
      >
        <PlaySetupGuide steps={setup} title={listing.title || game.title} />
      </Section>

      <Section
        title="3. Store listing — identity & text"
        hint="Main store listing. Title ≤ 50 characters. Short description is hard-capped at 80. Full description ≤ 4000."
      >
        <CopyField label="Kind (set at Create app — cannot change later)" value={listing.kind || 'game'} />
        <CopyField
          label={`App name (Play title — max ${PLAY_TITLE_MAX}; currently ${(listing.title || '').length})`}
          value={listing.title || ''}
        />
        {!isPlayTitleValid(listing.title || '') ? (
          <p style={{ margin: '0 0 10px', fontSize: 12, color: '#ffb070' }}>
            Title is empty or over {PLAY_TITLE_MAX} characters. Shorten it in <code>android-listing.json</code>.
          </p>
        ) : null}
        <CopyField label="Developer name (same for every Apex Arcade title)" value={listing.developer || DEFAULT_DEVELOPER} />
        <CopyField label="Package name / applicationId" value={listing.packageName || ''} />
        <CopyField label="Play Console app ID (numeric, after create)" value={listing.playConsoleId || '(add after you create the app)'} />
        <CopyField label="Default language" value={listing.defaultLanguage || 'en-US'} />
        <CopyField
          label={`Short description (max ${PLAY_SHORT_MAX}; currently ${(listing.shortDescription || listing.storeHook || '').length})`}
          value={listing.shortDescription || listing.storeHook || ''}
          multiline
        />
        {!isPlayShortValid(listing.shortDescription || listing.storeHook || '') ? (
          <p style={{ margin: '0 0 10px', fontSize: 12, color: '#ffb070' }}>
            Short description is empty or over {PLAY_SHORT_MAX} characters.
          </p>
        ) : null}
        {!compact && (
          <CopyField label="Full description (max 4000)" value={listing.fullDescription || ''} multiline />
        )}
        <CopyField label="Category (Play dropdown)" value={listing.category || ''} />
        <CopyField label="Tags" value={tags} />
        <CopyField label="Feature bullets (use in full description)" value={bullets} multiline />
      </Section>

      <Section
        title="4. Store listing — graphics"
        hint="Put files in each title’s store-assets folder. File names must match so the studio can track ready / missing."
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
        <CopyField label="store-assets folder (create this under each Android title)" value={assetsDir || '(set workspace)'} />
        {existsMap.assetsDir === false ? (
          <p style={{ color: '#ffb070', fontSize: 13 }}>
            Folder missing — create <code>store-assets</code> inside the Android workspace, then drop media files in.
          </p>
        ) : null}

        <div className="section-title" style={{ margin: '14px 0 8px', fontSize: 14 }}>
          Required graphics
        </div>
        {required.map((slot) => (
          <MediaSlotRow
            key={slot.id}
            slot={slot}
            buildFolder={buildFolder}
            exists={existsMap[slot.id] ?? null}
            onOpenFolder={() => void openFolder(assetsDir, 'store-assets opened')}
            onOpenFile={(p) => void showFile(p)}
            title={listing.title || game.title}
            extraBrief={
              slot.id === 'icon512'
                ? listing.iconBrief
                : slot.id === 'feature'
                  ? listing.featureGraphicBrief
                  : listing.screenshotBrief
            }
          />
        ))}

        {!compact && (
          <>
            <div className="section-title" style={{ margin: '14px 0 8px', fontSize: 14 }}>
              Optional graphics
            </div>
            {optional.map((slot) => (
              <MediaSlotRow
                key={slot.id}
                slot={slot}
                buildFolder={buildFolder}
                exists={existsMap[slot.id] ?? null}
                onOpenFolder={() => void openFolder(assetsDir, 'store-assets opened')}
                onOpenFile={(p) => void showFile(p)}
                title={listing.title || game.title}
                extraBrief={listing.screenshotBrief}
              />
            ))}
          </>
        )}
        <CopyField label="Promo video (YouTube URL)" value={listing.promoVideoUrl || '(optional)'} />
      </Section>

      <Section
        title="5. Privacy, Data safety, content rating"
        hint="Play needs a public HTTPS privacy URL plus completed App content forms before Production."
      >
        <CopyField
          label="Privacy policy URL (paste into Play once hosted)"
          value={listing.privacyPolicyUrl || '(host the HTML file, then paste the public URL in android-listing.json)'}
        />
        <CopyField label="Local privacy HTML file" value={privacyLocal || ''} />
        <div className="header-actions" style={{ flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {privacyLocal ? (
            <button type="button" className="btn btn-sm" onClick={() => void showFile(privacyLocal)}>
              Show privacy file in Explorer
            </button>
          ) : null}
          <CopyButton text={privacyLocal} label="Copy local privacy path" className="btn btn-sm" />
        </div>
        <CopyField label="Data safety notes" value={listing.dataSafetyNotes || ''} multiline />
        <CopyField label="Content rating / IARC notes" value={listing.contentRating || ''} />
        <CopyField label="Ads declared" value={listing.adsDeclared === false ? 'No' : 'Yes — declare advertising ID if AdMob ships'} />
        <CopyField label="Target audience" value={listing.targetAudience || ''} />
        <CopyField label="Contact email" value={listing.contactEmail || ''} />
        <CopyField label="Contact website" value={listing.contactWebsite || ''} />
      </Section>

      <Section
        title="6. Build, wrapper, signing"
        hint="HTML5 Instant Games wrap cleanly with Capacitor. Native / TWA / Unity are also valid — set wrapper in android-listing.json."
      >
        <CopyField label="Wrapper" value={listing.wrapper || 'capacitor'} />
        <CopyField label="Web / game source folder (if wrapping HTML5)" value={listing.webSourceFolder || ''} />
        <CopyField label="Entry file" value={listing.entryFile || 'index.html'} />
        <CopyField label="minSdk / targetSdk" value={`${listing.minSdk || '24'} / ${listing.targetSdk || '35'}`} />
        <CopyField label="Keystore path (do not commit the file)" value={listing.keystorePath || ''} />
        <CopyField label="Key alias" value={listing.keyAlias || ''} />
        <CopyField label="Signing notes" value={listing.signingNotes || ''} multiline />
        <CopyField label="SDK / wrapper notes" value={listing.sdkNotes || ''} multiline />
      </Section>

      <Section
        title="7. Monetization (AdMob / Play Billing)"
        hint="Ads-only titles: AdMob app + rewarded unit. Digital goods: Play Billing. Do not sideload a third-party IAP SDK."
      >
        <CopyField label="Play Billing" value={listing.playBilling ? 'Yes' : 'No'} />
        <CopyField label="AdMob app ID" value={listing.admobAppId || '(add after creating the AdMob app)'} />
        <CopyField label="Rewarded ad unit" value={listing.rewardedAdUnit || ''} />
        <CopyField label="Developer / seller" value={listing.developer || DEFAULT_DEVELOPER} />
      </Section>

      <Section title="8. Local paths & launch checklist">
        <CopyField label="Android workspace (source / Capacitor project)" value={buildFolder} />
        <CopyField label="Release AAB" value={aabPath} />
        {!compact && (
          <>
            <CopyField label="Icon art brief" value={listing.iconBrief || ''} multiline />
            <CopyField label="Feature graphic brief" value={listing.featureGraphicBrief || ''} multiline />
            <CopyField label="Screenshot brief" value={listing.screenshotBrief || ''} multiline />
            <CopyField label="Video brief" value={listing.videoBrief || ''} multiline />
            <CopyField label="Play Console checklist" value={checklist} multiline />
          </>
        )}
      </Section>
    </div>
  );
}
