import { useCallback, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { copyText, getAPI } from '../lib/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import type { CrossProposeResult, PackDetail } from '../types/api';
import { StatusBadge } from '../components/StatusBadge';
import { CopyButton } from '../components/CopyButton';
import { usePlatform } from '../platform/usePlatform';
import { otherPlatform } from '../platform/config';
import { buildPromptFromPack } from '../lib/buildPrompt';

const DOC_ORDER = [
  'MARKET-RESEARCH.md',
  'FILTER-DECISION.md',
  'README.md',
  'PILLARS.md',
  'AUDIENCE.md',
  'MONETIZATION.md',
  'DISCOVERY.md',
  'LIVEOPS.md',
  'UPLOAD-CHECKLIST.md',
  'PLAY-CHECKLIST.md',
  'PORT-DECISION.md',
  'EVALUATE-PROMPT.md',
  'SOURCE-NOTES.md',
];

export function PackDetailPage() {
  const { folderName } = useParams();
  const { platform, config, base, isAndroid } = usePlatform();
  const [detail, setDetail] = useState<PackDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeDoc, setActiveDoc] = useState<string>('README.md');
  const [toast, setToast] = useState<string | null>(null);
  const [catalogSkip, setCatalogSkip] = useState<string[]>([]);
  const [portResult, setPortResult] = useState<CrossProposeResult | null>(null);
  const [portBusy, setPortBusy] = useState(false);
  const docPicked = useRef(false);
  const lastFolder = useRef<string | undefined>(undefined);
  if (folderName !== lastFolder.current) {
    lastFolder.current = folderName;
    docPicked.current = false;
  }

  const load = useCallback(async () => {
    if (!folderName) return;
    const api = getAPI();
    const settings = await api.getSettings();
    const list = await api.listPacks(platform);
    const match = list.packs.find((p) => p.folderName === folderName);
    const packsRoot = isAndroid ? settings.androidInfoPacksPath : settings.infoPacksPath;
    const packPath =
      match?.absolutePath || `${packsRoot}\\${folderName}`.replace(/\\+/g, '\\');
    if (typeof api.getResearchCatalog === 'function') {
      const cat = await api.getResearchCatalog();
      setCatalogSkip((cat.items || []).map((i) => i.title).filter(Boolean));
    }
    const res = await api.getPackDetail(packPath);
    if (res.error || !res.pack) {
      setError(res.error || 'Pack not found');
      setDetail(null);
      return;
    }
    setDetail(res.pack);
    setError(null);
    if (!docPicked.current) {
      const docs = Object.keys(res.pack.files);
      const preferred = DOC_ORDER.find((d) => docs.includes(d)) || docs[0];
      if (preferred) setActiveDoc(preferred);
      docPicked.current = true;
    }
  }, [folderName, platform, isAndroid]);

  useAutoRefresh(load);

  async function considerOtherPlatform() {
    if (!detail) return;
    setPortBusy(true);
    setPortResult(null);
    try {
      const res = await getAPI().proposeCrossPlatform({
        fromPlatform: platform,
        packPath: detail.absolutePath,
      });
      setPortResult(res);
      if (res.ok && res.prompt) {
        await copyText(res.prompt);
        setToast('Candidate pack created on the other side — evaluate prompt copied');
        window.setTimeout(() => setToast(null), 2800);
      } else if (!res.ok) {
        setToast(res.error || 'Could not send to other platform');
        window.setTimeout(() => setToast(null), 2800);
      }
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Send failed');
      window.setTimeout(() => setToast(null), 2800);
    } finally {
      setPortBusy(false);
    }
  }

  async function changeStatus(status: string) {
    if (!detail) return;
    const res = await getAPI().updatePackStatus(detail.absolutePath, status);
    if (!res.ok) {
      setToast(res.error || 'Could not update status');
      window.setTimeout(() => setToast(null), 2000);
      return;
    }
    setToast(`Status → ${status}`);
    window.setTimeout(() => setToast(null), 1600);
    await load();
  }

  async function openPath(path: string) {
    const res = await getAPI().openPath(path);
    if (!res.ok) {
      setToast(res.error || 'Failed to open');
      window.setTimeout(() => setToast(null), 2000);
    }
  }

  if (error) {
    return (
      <div>
        <Link className="btn btn-sm" to={`${base}/packs`}>
          ← Back
        </Link>
        <div className="alert alert-error" style={{ marginTop: 16 }}>
          {error}
        </div>
      </div>
    );
  }

  if (!detail) {
    return <p style={{ color: 'var(--text-muted)' }}>Loading pack…</p>;
  }

  const m = detail.manifest;
  const docs = DOC_ORDER.filter((d) => detail.files[d]).concat(
    Object.keys(detail.files).filter((d) => d !== 'pack.json' && !DOC_ORDER.includes(d))
  );

  const buildPrompt = buildPromptFromPack(platform, detail.absolutePath, m, {
    catalogSkip,
  });
  const dest = otherPlatform(platform);
  const isPortCandidate = m?.generatedBy === 'cross-platform-consider';

  const uploadGameId = m?.slug || m?.id || folderName || '';
  const uploadQuery = new URLSearchParams();
  if (uploadGameId) uploadQuery.set('game', uploadGameId);
  if (folderName) uploadQuery.set('pack', folderName);

  return (
    <div>
      <div className="page-header">
        <div>
          <Link
            to={`${base}/packs`}
            style={{ color: 'var(--text-dim)', fontSize: 13, display: 'inline-block', marginBottom: 8 }}
          >
            ← All packs
          </Link>
          <h1>{m?.title || folderName}</h1>
          <p>{m?.oneLiner || 'Game info pack detail'}</p>
        </div>
        <div className="header-actions" style={{ flexWrap: 'wrap' }}>
          <CopyButton text={detail.absolutePath} label="Copy pack path" className="btn" />
          <CopyButton text={buildPrompt} label="Copy build prompt" className="btn btn-primary" />
          <Link className="btn" to={`${base}/ship`}>
            Ship board
          </Link>
          <Link className="btn" to={`${base}/upload-guide?${uploadQuery.toString()}`}>
            {config.openUploadLabel}
          </Link>
        </div>
      </div>

      <div className="meta-row" style={{ marginBottom: 16 }}>
        <StatusBadge status={m?.status} />
        <label className="status-inline">
          <span>Set status</span>
          <select
            value={m?.status || 'candidate'}
            onChange={(e) => void changeStatus(e.target.value)}
          >
            <option value="candidate">candidate</option>
            <option value="ready">ready</option>
            <option value="in-production">in-production</option>
            <option value="published">published</option>
            <option value="archived">archived</option>
          </select>
        </label>
        {m?.kind && (
          <span className={`badge ${m.kind === 'app' ? 'badge-app' : 'badge-game'}`}>{m.kind}</span>
        )}
        {m?.genre && <span className="badge">{m.genre}</span>}
        {isPortCandidate && <span className="badge badge-candidate">port candidate — evaluate first</span>}
        {m?.sourcePlatform && (
          <span className="badge">from {m.sourcePlatform}</span>
        )}
        {(m?.tags || []).map((t) => (
          <span key={t} className="badge">
            {t}
          </span>
        ))}
      </div>

      <section className="card" style={{ marginBottom: 16 }}>
        <div className="section-title">Other platform</div>
        {isPortCandidate ? (
          <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--text-muted)' }}>
            This pack was sent from <strong>{m?.sourcePlatform}</strong>. Do not build yet. Copy
            the evaluate prompt, paste into Grok Build, and let it decide GO or NO-GO for{' '}
            {config.shortLabel}.
          </p>
        ) : (
          <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--text-muted)' }}>
            Not every title should ship on both stores. If you think this one might, send a{' '}
            <strong>candidate</strong> pack to {dest === 'android' ? 'Android' : 'Facebook'}. Grok
            must evaluate whether a port is worth it before any build.
          </p>
        )}
        <div className="header-actions" style={{ flexWrap: 'wrap' }}>
          {isPortCandidate && detail.files['EVALUATE-PROMPT.md'] ? (
            <CopyButton
              text={detail.files['EVALUATE-PROMPT.md']}
              label="Copy evaluate prompt"
              className="btn btn-primary"
            />
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              disabled={portBusy}
              onClick={() => void considerOtherPlatform()}
            >
              {portBusy
                ? 'Sending…'
                : dest === 'android'
                  ? 'Consider for Android'
                  : 'Consider for Facebook'}
            </button>
          )}
          <Link className="btn" to={`${base}/ship`}>
            Open ship board
          </Link>
        </div>
        {portResult?.ok && portResult.destFolderName && (
          <div style={{ marginTop: 14 }}>
            <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--text-muted)' }}>
              Candidate created: <strong>{portResult.title}</strong> on {portResult.destPlatform}.
              Evaluate prompt is copied — paste it into Grok Build.
            </p>
            <div className="header-actions" style={{ flexWrap: 'wrap' }}>
              {portResult.prompt ? (
                <CopyButton text={portResult.prompt} label="Copy evaluate prompt again" className="btn" />
              ) : null}
              <Link
                className="btn btn-primary"
                to={`/${portResult.destPlatform}/packs/${encodeURIComponent(portResult.destFolderName)}`}
              >
                Open {portResult.destPlatform} candidate
              </Link>
            </div>
            {portResult.prompt ? <pre className="markdown-block plan-prompt">{portResult.prompt}</pre> : null}
          </div>
        )}
        {portResult && !portResult.ok && (
          <div className="alert alert-error" style={{ marginTop: 12 }}>
            {portResult.error}
          </div>
        )}
      </section>

      <div className="path-box" style={{ marginBottom: 16 }}>
        <code>{detail.absolutePath}</code>
        <button type="button" className="btn btn-sm" onClick={() => openPath(detail.absolutePath)}>
          Open folder
        </button>
      </div>

      <div className="two-col">
        <section className="card">
          <div className="section-title">Pack documents</div>
          <div className="header-actions" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
            {docs.map((doc) => (
              <button
                key={doc}
                type="button"
                className={`btn btn-sm ${activeDoc === doc ? 'btn-primary' : ''}`}
                onClick={() => setActiveDoc(doc)}
              >
                {doc.replace('.md', '')}
              </button>
            ))}
          </div>
          {activeDoc && detail.files[activeDoc] ? (
            <pre className="markdown-block">{detail.files[activeDoc]}</pre>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No document selected.</p>
          )}
        </section>

        <div className="grid" style={{ gap: 14 }}>
          <section className="card">
            <div className="section-title">Why this idea</div>
            {m?.inspiredBy?.length ? (
              <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--text-muted)' }}>
                Inspired by / improves on: <strong>{m.inspiredBy.join(', ')}</strong>
              </p>
            ) : (
              <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--text-muted)' }}>
                See FILTER-DECISION.md for multi-stage scoring notes.
              </p>
            )}
            {m?.pillars && (
              <div className="pillar-list">
                {Object.entries(m.pillars).map(([k, v]) => (
                  <div key={k} className="pillar-item">
                    <strong>{k}</strong>
                    <span style={{ color: 'var(--text-muted)' }}>{v}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card">
            <div className="section-title">Skeleton</div>
            {detail.skeletonFiles.length === 0 ? (
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                No skeleton/ folder in this pack yet.
              </p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--text-muted)' }}>
                {detail.skeletonFiles.map((f) => (
                  <li key={f} style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>
                    skeleton/{f}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <div className="section-title">Scores</div>
            {m?.scores ? (
              <div className="pillar-list">
                {Object.entries(m.scores).map(([k, v]) => (
                  <div key={k} className="pillar-item">
                    <strong>{k}</strong>
                    <span>{String(v)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                No scores in pack.json
              </p>
            )}
          </section>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
