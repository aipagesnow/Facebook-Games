import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAPI } from '../lib/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import type { InfoPackSummary } from '../types/api';
import { StatusBadge } from '../components/StatusBadge';
import { CopyButton } from '../components/CopyButton';
import { usePlatform } from '../platform/usePlatform';
import { isFreshPack } from '../lib/storeLinks';

export function PacksPage() {
  const { platform, config, base, isAndroid } = usePlatform();
  const [packs, setPacks] = useState<InfoPackSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await getAPI().listPacks(platform);
    setPacks(res.packs);
    setError(res.error);
    setLoading(false);
    setLastRefresh(new Date());
  }, [platform]);

  useAutoRefresh(refresh);

  async function openFolder(path: string) {
    const res = await getAPI().openPath(path);
    if (!res.ok) {
      setToast(res.error || 'Could not open folder');
      window.setTimeout(() => setToast(null), 2200);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{config.packsTitle}</h1>
          <p>{config.packsLead}</p>
          <p className="live-dot" style={{ marginTop: 8 }}>
            Live scan
            {lastRefresh ? ` · ${lastRefresh.toLocaleTimeString()}` : ''}
          </p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn" onClick={() => void refresh()} disabled={loading}>
            {loading ? 'Scanning…' : 'Refresh now'}
          </button>
          <Link className="btn btn-primary" to={`${base}/plan`}>
            {config.planButton}
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {(() => {
        const newest = packs.find((p) => isFreshPack(p.mtimeMs));
        if (!newest) return null;
        return (
          <div className="alert alert-success">
            New pack on disk:{' '}
            <Link to={`${base}/packs/${encodeURIComponent(newest.folderName)}`}>
              <strong>{newest.manifest?.title || newest.folderName}</strong>
            </Link>
            {' — '}open it, copy the build prompt, or send it to the other platform.
          </div>
        );
      })()}

      {!loading && packs.length === 0 && !error && (
        <div className="empty-state">
          <h3>No info packs found</h3>
          <p>
            {config.emptyPacks}
          </p>
          <div className="header-actions" style={{ justifyContent: 'center' }}>
            <Link className="btn btn-primary" to={`${base}/plan`}>
              {config.planButton}
            </Link>
            <Link className="btn" to={`${base}/settings`}>
              Open Settings
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cards">
        {packs.map((pack) => {
          const title = pack.manifest?.title || pack.folderName;
          const oneLiner = pack.manifest?.oneLiner || 'No summary in pack.json yet.';
          return (
            <article key={pack.id} className="card">
              <div className="meta-row">
                <StatusBadge status={pack.manifest?.status} />
                {pack.manifest?.genre && (
                  <span className="badge">{pack.manifest.genre}</span>
                )}
                {isFreshPack(pack.mtimeMs) && <span className="badge badge-ready">new</span>}
                {pack.hasSkeleton && <span className="badge">skeleton</span>}
                {isAndroid && pack.manifest?.kind && (
                  <span className={`badge ${pack.manifest.kind === 'app' ? 'badge-app' : 'badge-game'}`}>
                    {pack.manifest.kind}
                  </span>
                )}
              </div>
              <h2 className="card-title">
                <Link to={`${base}/packs/${encodeURIComponent(pack.folderName)}`}>{title}</Link>
              </h2>
              <p className="card-desc">{oneLiner}</p>
              <div className="path-box">
                <code title={pack.absolutePath}>{pack.absolutePath}</code>
                <CopyButton text={pack.absolutePath} />
              </div>
              <div className="header-actions" style={{ marginTop: 12 }}>
                <Link
                  className="btn btn-sm btn-primary"
                  to={`${base}/packs/${encodeURIComponent(pack.folderName)}`}
                >
                  Open pack
                </Link>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => openFolder(pack.absolutePath)}
                >
                  Open in Explorer
                </button>
                <Link className="btn btn-sm" to={`${base}/ship`}>
                  Ship board
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
