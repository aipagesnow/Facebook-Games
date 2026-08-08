import { useState } from 'react';
import { CopyButton } from './CopyButton';
import { CopyField } from './CopyField';
import { getAPI } from '../lib/api';
import {
  formatListingClipboard,
  getUseCasesForListing,
  listingFromGame,
  zipFolderPath,
  type FbListing,
} from '../lib/fbListing';
import type { PublishedGame } from '../types/api';
import { UseCasePickerGuide } from './UseCasePickerGuide';

interface Props {
  game: PublishedGame;
  compact?: boolean;
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
  const [openToast, setOpenToast] = useState<string | null>(null);

  async function openZipFolder() {
    const api = getAPI();
    setOpenToast('Opening Explorer…');
    try {
      // Dedicated Windows-reliable helper (explorer /select,file)
      if (typeof api.openZipHelper === 'function') {
        const res = await api.openZipHelper(zipPath || zipDir || '');
        if (res.ok) {
          setOpenToast('Explorer opened — drag game.zip into Meta’s upload box');
          window.setTimeout(() => setOpenToast(null), 4000);
          return;
        }
        // Fall through with error message
        if (zipPath) {
          const shown = await api.showItemInFolder(zipPath);
          if (shown.ok) {
            setOpenToast('Explorer opened — drag game.zip into Meta');
            window.setTimeout(() => setOpenToast(null), 4000);
            return;
          }
        }
        if (zipDir) {
          const opened = await api.openPath(zipDir);
          if (opened.ok) {
            setOpenToast('Folder opened — drag game.zip into Meta');
            window.setTimeout(() => setOpenToast(null), 4000);
            return;
          }
        }
        setOpenToast(res.error || 'Could not open Explorer');
        window.setTimeout(() => setOpenToast(null), 5000);
        return;
      }

      setOpenToast('Open folder only works in the desktop app (Electron), not browser preview');
      window.setTimeout(() => setOpenToast(null), 4000);
    } catch (err) {
      setOpenToast(err instanceof Error ? err.message : 'Open folder failed');
      window.setTimeout(() => setOpenToast(null), 4000);
    }
  }

  return (
    <div className="fb-listing-panel">
      <div className="header-actions" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
        <CopyButton
          text={allText}
          label="Copy ALL FB fields"
          className="btn btn-primary btn-sm"
        />
        <CopyButton
          text={listing.buildFolder || game.workspacePath || ''}
          label="Copy build folder"
          className="btn btn-sm"
        />
        <CopyButton text={zipPath} label="Copy upload ZIP path" className="btn btn-sm" />
        {game.facebookAppId ? (
          <CopyButton text={game.facebookAppId} label="Copy App ID" className="btn btn-sm" />
        ) : null}
      </div>

      {/* Drag-drop helper for Meta Web hosting */}
      <section className="card upload-zip-helper" style={{ marginBottom: 16 }}>
        <div className="section-title">Meta Web hosting — drag &amp; drop helper</div>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-muted)' }}>
          On Meta, open <strong>Upload Version</strong>. Here, open the folder that contains{' '}
          <code>game.zip</code>, then drag that file into Meta’s box. Copy the version comment
          into <strong>Version Comments</strong>, then click <strong>Upload</strong>.
        </p>
        <div className="header-actions" style={{ flexWrap: 'wrap', marginBottom: 12 }}>
          <button type="button" className="btn btn-primary" onClick={() => void openZipFolder()}>
            Open folder with game.zip
          </button>
          <CopyButton
            text={listing.versionComment || ''}
            label="Copy version comment"
            className="btn btn-sm"
          />
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
        <CopyField
          label="Version comment (paste into Meta “Version Comments”)"
          value={listing.versionComment || ''}
          multiline
        />
        <CopyField
          label="ZIP file (drag this file — not the path text)"
          value={zipPath}
        />
        <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--text-dim)' }}>
          Manual fallback: open Explorer → Desktop → <code>game.zip</code>, or{' '}
          <code>Facebook-Games\games\game.zip</code>
        </p>
      </section>

      <div className="section-title" style={{ marginBottom: 8 }}>
        Meta Create app → Use cases
      </div>
      <UseCasePickerGuide useCases={useCases} gameTitle={listing.title || game.title} />

      <div className="section-title" style={{ margin: '18px 0 8px' }}>
        Listing / store fields
      </div>

      <CopyField label="Title" value={listing.title || ''} />
      <CopyField label="Store hook" value={listing.storeHook || ''} />
      <CopyField
        label="Short description"
        value={listing.shortDescription || ''}
        multiline
      />
      {!compact && (
        <CopyField
          label="Long description"
          value={listing.longDescription || ''}
          multiline
        />
      )}
      <CopyField label="Category" value={listing.category || ''} />
      <CopyField label="Orientation" value={listing.orientation || 'PORTRAIT'} />
      <CopyField label="Tags" value={tags} />
      <CopyField label="Feature bullets" value={bullets} multiline />
      <CopyField
        label="Build folder (source files on PC)"
        value={listing.buildFolder || game.workspacePath || ''}
      />
      <CopyField
        label="Upload ZIP (Meta → Web hosting → Upload Version)"
        value={zipPath}
      />
      <CopyField label="Entry file" value={listing.entryFile || 'index.html'} />
      <CopyField
        label="Privacy policy URL"
        value={listing.privacyPolicyUrl || '(add your URL)'}
      />
      {!compact && (
        <>
          <CopyField label="Icon art brief (1024×1024)" value={listing.iconBrief || ''} multiline />
          <CopyField label="Cover art brief (1600×300)" value={listing.coverBrief || ''} multiline />
          <CopyField label="Share image idea" value={listing.shareImageIdea || ''} multiline />
          <CopyField label="Upload checklist" value={checklist} multiline />
        </>
      )}
    </div>
  );
}
