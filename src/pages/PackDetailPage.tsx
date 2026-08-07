import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getAPI } from '../lib/api';
import type { PackDetail } from '../types/api';
import { StatusBadge } from '../components/StatusBadge';
import { CopyButton } from '../components/CopyButton';

const DOC_ORDER = [
  'FILTER-DECISION.md',
  'README.md',
  'PILLARS.md',
  'AUDIENCE.md',
  'MONETIZATION.md',
  'DISCOVERY.md',
  'LIVEOPS.md',
  'UPLOAD-CHECKLIST.md',
];

export function PackDetailPage() {
  const { folderName } = useParams();
  const [detail, setDetail] = useState<PackDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeDoc, setActiveDoc] = useState<string>('README.md');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!folderName) return;
      const api = getAPI();
      const settings = await api.getSettings();
      // list packs to resolve absolute path by folder name
      const list = await api.listPacks();
      const match = list.packs.find((p) => p.folderName === folderName);
      if (!match) {
        // try join settings path
        const guessed = `${settings.infoPacksPath}\\${folderName}`.replace(
          /\\+/g,
          '\\'
        );
        const res = await api.getPackDetail(guessed);
        if (cancelled) return;
        if (res.error || !res.pack) {
          setError(res.error || 'Pack not found');
          setDetail(null);
          return;
        }
        setDetail(res.pack);
        setError(null);
        return;
      }
      const res = await api.getPackDetail(match.absolutePath);
      if (cancelled) return;
      if (res.error || !res.pack) {
        setError(res.error || 'Failed to load pack');
        setDetail(null);
        return;
      }
      setDetail(res.pack);
      setError(null);
      const docs = Object.keys(res.pack.files);
      const preferred = DOC_ORDER.find((d) => docs.includes(d)) || docs[0];
      if (preferred) setActiveDoc(preferred);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [folderName]);

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
        <Link className="btn btn-sm" to="/packs">
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

  const grokPrompt = [
    'Build a Facebook Instant Game from this game info pack.',
    `Pack path: ${detail.absolutePath}`,
    m?.title ? `Title: ${m.title}` : '',
    m?.oneLiner ? `One-liner: ${m.oneLiner}` : '',
    '',
    'Use the pack docs (pillars, monetization, discovery, live-ops, upload checklist)',
    'and the bare HTML/JS skeleton with FBInstant lifecycle.',
    'Produce a unique game (not a clone) ready for developers.facebook Instant Games.',
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <div>
      <div className="page-header">
        <div>
          <Link
            to="/packs"
            style={{ color: 'var(--text-dim)', fontSize: 13, display: 'inline-block', marginBottom: 8 }}
          >
            ← All packs
          </Link>
          <h1>{m?.title || folderName}</h1>
          <p>{m?.oneLiner || 'Game info pack detail'}</p>
        </div>
        <div className="header-actions">
          <CopyButton text={detail.absolutePath} label="Copy pack path" className="btn" />
          <CopyButton text={grokPrompt} label="Copy Grok prompt" className="btn btn-primary" />
        </div>
      </div>

      <div className="meta-row" style={{ marginBottom: 16 }}>
        <StatusBadge status={m?.status} />
        {m?.genre && <span className="badge">{m.genre}</span>}
        {(m?.tags || []).map((t) => (
          <span key={t} className="badge">
            {t}
          </span>
        ))}
      </div>

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
