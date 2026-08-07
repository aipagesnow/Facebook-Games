import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAPI } from '../lib/api';
import type { InfoPackSummary, PublishedGame } from '../types/api';
import { StatusBadge } from '../components/StatusBadge';

export function DashboardPage() {
  const [packs, setPacks] = useState<InfoPackSummary[]>([]);
  const [games, setGames] = useState<PublishedGame[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const api = getAPI();
      const [packRes, libRes] = await Promise.all([api.listPacks(), api.listLibrary()]);
      if (cancelled) return;
      setPacks(packRes.packs);
      setGames(libRes.games);
      setError(packRes.error || libRes.error);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const readyCount = packs.filter((p) => p.manifest?.status === 'ready').length;
  const candidateCount = packs.filter((p) => p.manifest?.status === 'candidate').length;
  const recentPacks = packs.slice(0, 4);
  const recentGames = games.slice(0, 4);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>
            Command center for Instant Games: pipeline info packs on the left of your
            workflow, published library on the right, and everything needed for
            developers.facebook.
          </p>
        </div>
        <div className="header-actions">
          <Link className="btn" to="/packs">
            Browse packs
          </Link>
          <Link className="btn btn-primary" to="/settings">
            Configure folders
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid grid-stats">
        <div className="card stat-card">
          <div className="stat-label">Info packs</div>
          <div className="stat-value">{loading ? '—' : packs.length}</div>
          <div className="stat-hint">Upcoming ideas from research pipeline</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Ready to build</div>
          <div className="stat-value">{loading ? '—' : readyCount}</div>
          <div className="stat-hint">{candidateCount} still candidates</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Library</div>
          <div className="stat-value">{loading ? '—' : games.length}</div>
          <div className="stat-hint">Published / tracked Instant Games</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Workflow</div>
          <div className="stat-value" style={{ fontSize: 18, paddingTop: 8 }}>
            Pack → Build → FB
          </div>
          <div className="stat-hint">Copy pack path → paste into Grok → ship</div>
        </div>
      </div>

      <div className="two-col">
        <section className="card">
          <div className="section-title">Recent info packs</div>
          {recentPacks.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
              No packs yet. Point Settings at your pipeline output folder, or use the
              sample pack in <code>info-packs/</code>.
            </p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Genre</th>
                </tr>
              </thead>
              <tbody>
                {recentPacks.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link to={`/packs/${encodeURIComponent(p.folderName)}`}>
                        {p.manifest?.title || p.folderName}
                      </Link>
                    </td>
                    <td>
                      <StatusBadge status={p.manifest?.status} />
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {p.manifest?.genre || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="card">
          <div className="section-title">Library snapshot</div>
          {recentGames.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
              No published games tracked yet. Add entries from the Library page once a
              title goes live on Facebook.
            </p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>App ID</th>
                </tr>
              </thead>
              <tbody>
                {recentGames.map((g) => (
                  <tr key={g.id}>
                    <td>{g.title}</td>
                    <td>
                      <StatusBadge status={g.status} />
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                      {g.facebookAppId || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="section-title">How this studio fits your pipeline</div>
        <ol style={{ margin: 0, paddingLeft: 18, color: 'var(--text-muted)', fontSize: 14 }}>
          <li style={{ marginBottom: 8 }}>
            Research pipeline (future) drops a <strong>game info pack</strong> into your
            watched folder.
          </li>
          <li style={{ marginBottom: 8 }}>
            Open it here → copy the absolute path → paste into Grok to generate the full
            Instant Game + Facebook market assets.
          </li>
          <li style={{ marginBottom: 8 }}>
            Use the Upload guide for developers.facebook fields, discovery assets, and
            Zero Permissions checklist.
          </li>
          <li>
            After launch, register the game in Library for ongoing live-ops tracking.
          </li>
        </ol>
      </section>
    </div>
  );
}
