import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAPI } from '../lib/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import type { InfoPackSummary } from '../types/api';
import { StatusBadge } from '../components/StatusBadge';
import { CopyButton } from '../components/CopyButton';

export function PacksPage() {
  const [packs, setPacks] = useState<InfoPackSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await getAPI().listPacks();
    setPacks(res.packs);
    setError(res.error);
    setLoading(false);
    setLastRefresh(new Date());
  }, []);

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
          <h1>Game info packs</h1>
          <p>
            Upcoming titles from your research pipeline. Open a pack, copy its path, and
            hand it to Grok to generate the Instant Game and Facebook market package.
          </p>
          <p className="live-dot" style={{ marginTop: 8 }}>
            Live scan
            {lastRefresh ? ` · ${lastRefresh.toLocaleTimeString()}` : ''}
          </p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn" onClick={() => void refresh()} disabled={loading}>
            {loading ? 'Scanning…' : 'Refresh now'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {!loading && packs.length === 0 && !error && (
        <div className="empty-state">
          <h3>No info packs found</h3>
          <p>
            Set the info packs folder in Settings. When your automated research pipeline
            is live, finished packs will appear here automatically.
          </p>
          <Link className="btn btn-primary" to="/settings">
            Open Settings
          </Link>
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
                {pack.hasSkeleton && <span className="badge">skeleton</span>}
              </div>
              <h2 className="card-title">
                <Link to={`/packs/${encodeURIComponent(pack.folderName)}`}>{title}</Link>
              </h2>
              <p className="card-desc">{oneLiner}</p>
              <div className="path-box">
                <code title={pack.absolutePath}>{pack.absolutePath}</code>
                <CopyButton text={pack.absolutePath} />
              </div>
              <div className="header-actions" style={{ marginTop: 12 }}>
                <Link
                  className="btn btn-sm btn-primary"
                  to={`/packs/${encodeURIComponent(pack.folderName)}`}
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
              </div>
            </article>
          );
        })}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
