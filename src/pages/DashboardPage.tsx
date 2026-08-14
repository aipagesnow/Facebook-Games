import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAPI } from '../lib/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import type { InfoPackSummary, PublishedGame, ShipBoardRecord } from '../types/api';
import { StatusBadge } from '../components/StatusBadge';
import { usePlatform } from '../platform/usePlatform';
import { isFreshPack, isOverdue } from '../lib/storeLinks';

export function DashboardPage() {
  const { platform, config, base, isAndroid } = usePlatform();
  const [packs, setPacks] = useState<InfoPackSummary[]>([]);
  const [games, setGames] = useState<PublishedGame[]>([]);
  const [boards, setBoards] = useState<ShipBoardRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const api = getAPI();
    const [packRes, libRes, shipRes] = await Promise.all([
      api.listPacks(platform),
      api.listLibrary(platform),
      typeof api.listShipBoards === 'function'
        ? api.listShipBoards(platform)
        : Promise.resolve({ boards: [] as ShipBoardRecord[], error: null }),
    ]);
    setPacks(packRes.packs);
    setGames(libRes.games);
    setBoards(shipRes.boards || []);
    setError(packRes.error || libRes.error);
    setLoading(false);
    setLastRefresh(new Date());
  }, [platform]);

  useAutoRefresh(load);

  const readyCount = packs.filter((p) => p.manifest?.status === 'ready').length;
  const inProdCount = packs.filter((p) => p.manifest?.status === 'in-production').length;
  const candidateCount = packs.filter((p) => p.manifest?.status === 'candidate').length;
  const appCount = games.filter((g) => {
    const listingKind = (g.androidListing as { kind?: string } | undefined)?.kind;
    return (g.kind || listingKind) === 'app';
  }).length;
  const gameCount = isAndroid ? games.length - appCount : games.length;
  const recentPacks = packs.slice(0, 4);
  const recentGames = games.slice(0, 4);
  const overdueOps = boards.filter((b) => isOverdue(b.nextActionDate));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>{config.dashboardLead}</p>
          <p className="live-dot" style={{ marginTop: 8 }}>
            Live data
            {lastRefresh
              ? ` · updated ${lastRefresh.toLocaleTimeString()}`
              : loading
                ? ' · loading…'
                : ''}
          </p>
        </div>
        <div className="header-actions">
          <Link className="btn" to={`${base}/packs`}>
            Browse packs
          </Link>
          <Link className="btn" to={`${base}/ship`}>
            Ship board
          </Link>
          <Link className="btn btn-primary" to={`${base}/plan`}>
            {config.planButton}
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {overdueOps.length > 0 && (
        <div className="alert" style={{ marginBottom: 12 }}>
          {overdueOps.length} live-ops action{overdueOps.length === 1 ? '' : 's'} overdue.{' '}
          <Link to={`${base}/ship`}>
            <strong>Open ship board</strong>
          </Link>
          {overdueOps[0]?.nextAction ? ` — next up: ${overdueOps[0].nextAction}` : ''}
        </div>
      )}
      {(() => {
        const newest = packs.find((p) => isFreshPack(p.mtimeMs));
        if (!newest) return null;
        return (
          <div className="alert alert-success">
            Grok just wrote (or you just added){' '}
            <Link to={`${base}/packs/${encodeURIComponent(newest.folderName)}`}>
              <strong>{newest.manifest?.title || newest.folderName}</strong>
            </Link>
            . Open the pack → Copy build prompt, or tick the ship board.
          </div>
        );
      })()}

      <section className="card research-cta" style={{ marginBottom: 16 }}>
        <div>
          <div className="section-title" style={{ marginBottom: 6 }}>
            What should we build next?
          </div>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)', maxWidth: '68ch' }}>
            {config.planLead}
          </p>
        </div>
        <Link className="btn btn-primary" to={`${base}/plan`}>
          {config.planButton}
        </Link>
      </section>

      <div className="grid grid-stats">
        <div className="card stat-card">
          <div className="stat-label">Info packs</div>
          <div className="stat-value">{loading && !packs.length ? '—' : packs.length}</div>
          <div className="stat-hint">Upcoming ideas from research pipeline</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Ready to build</div>
          <div className="stat-value">{loading && !packs.length ? '—' : readyCount}</div>
          <div className="stat-hint">
            {inProdCount} in production · {candidateCount} candidates
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Library</div>
          <div className="stat-value">{loading && !games.length ? '—' : games.length}</div>
          <div className="stat-hint">
            {isAndroid
              ? `${gameCount} game${gameCount === 1 ? '' : 's'} · ${appCount} app${appCount === 1 ? '' : 's'}`
              : config.dashboardLibraryHint}
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Workflow</div>
          <div className="stat-value" style={{ fontSize: 18, paddingTop: 8 }}>
            {config.workflow}
          </div>
          <div className="stat-hint">{config.workflowHint}</div>
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
                      <Link to={`${base}/packs/${encodeURIComponent(p.folderName)}`}>
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
                  <th>{isAndroid ? 'Package' : 'App ID'}</th>
                </tr>
              </thead>
              <tbody>
                {recentGames.map((g) => (
                  <tr key={g.id}>
                    <td>
                      <Link to={`${base}/library`}>{g.title}</Link>
                    </td>
                    <td>
                      <StatusBadge status={g.status} />
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                      {isAndroid ? g.packageName || '—' : g.facebookAppId || '—'}
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
            Click <Link to={`${base}/plan`}><strong>{config.planButton}</strong></Link> — copy
            the prompt, paste into Grok Build on this project, get a new info pack.
          </li>
          <li style={{ marginBottom: 8 }}>
            Open it here → copy the absolute path → paste into Grok to generate the{' '}
            {isAndroid
              ? 'Android game or app + Play Console market assets (AAB, listing, store art).'
              : 'full Instant Game + Facebook market assets.'}
          </li>
          <li style={{ marginBottom: 8 }}>
            Use{' '}
            <Link to={`${base}/upload-guide`}>
              <strong>{config.navUpload}</strong>
            </Link>{' '}
            for one-click copy of listing text, build path, and checklist.
          </li>
          <li>
            Tick the <Link to={`${base}/ship`}><strong>Ship board</strong></Link> until Live /
            Production. If the title might work on the other store, open the pack and{' '}
            <strong>Consider for {isAndroid ? 'Facebook' : 'Android'}</strong> — Grok must
            evaluate GO / NO-GO before any port.
          </li>
        </ol>
      </section>
    </div>
  );
}
