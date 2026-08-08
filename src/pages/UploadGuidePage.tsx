import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getAPI } from '../lib/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import type { PublishedGame } from '../types/api';
import { StatusBadge } from '../components/StatusBadge';
import { FbListingPanel } from '../components/FbListingPanel';
import { CopyButton } from '../components/CopyButton';

export function UploadGuidePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [games, setGames] = useState<PublishedGame[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    const api = getAPI();
    const res =
      typeof api.listUploadTargets === 'function'
        ? await api.listUploadTargets()
        : await api.listLibrary();
    setGames(res.games);
    setError(res.error);
    setLastRefresh(new Date());
  }, []);

  useAutoRefresh(load);

  // Deep-link from Info Pack: /upload-guide?game=word-streak-duels or ?pack=sample-word-streak
  useEffect(() => {
    if (!games.length) return;
    const qGame = searchParams.get('game');
    const qPack = searchParams.get('pack');
    if (qGame) {
      const match = games.find(
        (g) => g.id === qGame || g.slug === qGame || g.id === qGame
      );
      if (match) setActiveId(match.id);
      return;
    }
    if (qPack) {
      const match = games.find(
        (g) =>
          (g as { packFolderName?: string }).packFolderName === qPack ||
          g.packPath?.includes(qPack)
      );
      if (match) setActiveId(match.id);
      return;
    }
    if (!activeId) setActiveId(games[0].id);
  }, [games, searchParams, activeId]);

  const active = games.find((g) => g.id === activeId) || games[0] || null;

  function selectGame(id: string) {
    setActiveId(id);
    setSearchParams({ game: id }, { replace: true });
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Facebook Instant Games upload</h1>
          <p>
            Copy-ready fields for developers.facebook. Games come from your{' '}
            <strong>Library</strong>, <strong>info packs</strong> (ready / in production), and
            built folders under <code>games/</code>.
          </p>
          <p className="live-dot" style={{ marginTop: 8 }}>
            Live targets
            {lastRefresh ? ` · ${lastRefresh.toLocaleTimeString()}` : ''}
            {games.length ? ` · ${games.length} project(s)` : ''}
          </p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {games.length === 0 ? (
        <div className="empty-state">
          <h3>No upload targets yet</h3>
          <p>
            Open an info pack that is <em>ready</em> or <em>in-production</em>, or add a game in
            Library after you build under <code>games/&lt;slug&gt;/</code>.
          </p>
          <div className="header-actions" style={{ justifyContent: 'center' }}>
            <Link className="btn btn-primary" to="/packs">
              Open Info Packs
            </Link>
            <Link className="btn" to="/library">
              Open Library
            </Link>
          </div>
        </div>
      ) : (
        <div className="two-col">
          <section className="card">
            <div className="section-title">Your projects</div>
            <div className="grid" style={{ gap: 8 }}>
              {games.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className={`btn ${active?.id === g.id ? 'btn-primary' : ''}`}
                  style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                  onClick={() => selectGame(g.id)}
                >
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span>{g.title}</span>
                    <span style={{ fontSize: 11, opacity: 0.85, fontWeight: 500 }}>
                      {g.status || 'tracked'}
                      {g.workspacePath ? ' · build ready' : ' · pack only'}
                      {g.facebookAppId ? ' · App ID set' : ''}
                    </span>
                  </span>
                </button>
              ))}
            </div>
            <p style={{ margin: '14px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
              Tip: from an info pack, click <strong>Open FB Upload</strong> to jump straight here
              with that project selected.
            </p>
          </section>

          {active && (
            <section className="card">
              <div className="meta-row" style={{ marginBottom: 8 }}>
                <StatusBadge status={active.status} />
                {active.genre && <span className="badge">{active.genre}</span>}
                {active.workspacePath && <span className="badge">game folder</span>}
              </div>
              <h2 style={{ margin: '0 0 4px', fontSize: 20 }}>{active.title}</h2>
              <p style={{ margin: '0 0 14px', color: 'var(--text-muted)', fontSize: 13 }}>
                Click any Copy button — values go to your clipboard for developers.facebook.
              </p>
              <FbListingPanel game={active} />
            </section>
          )}
        </div>
      )}

      <div className="grid" style={{ gap: 14, marginTop: 16 }}>
        <section className="card">
          <div className="section-title">Non-negotiable technical pillars</div>
          <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-muted)', fontSize: 14 }}>
            <li style={{ marginBottom: 8 }}>
              <strong>Sub-3s perceived load</strong> — smallest initial bundle (ideally under
              ~3–5 MB), progressive loading, loading progress via FBInstant.
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong>Zero Permissions</strong> — required for new Instant Games. No blocking
              permissions screen; Instant Games SDK v8+ patterns.
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong>&lt;30s teachable loop</strong> — learn by playing; meaningful interaction in
              first 3–5 seconds.
            </li>
            <li>
              <strong>Context-aware start</strong> — challenge / share / Gaming Tab entry points.
            </li>
          </ul>
        </section>

        <section className="card">
          <div className="section-title">Discovery assets (upload surfaces)</div>
          <table className="table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Typical size</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>App icon</td>
                <td>
                  <CopyButton text="1024×1024" label="1024×1024" className="btn btn-sm" />
                </td>
                <td>Mandatory; crisp, readable at small sizes</td>
              </tr>
              <tr>
                <td>Cover image</td>
                <td>
                  <CopyButton text="1600×300" label="1600×300" className="btn btn-sm" />
                </td>
                <td>Mandatory; sells the fantasy of the core loop</td>
              </tr>
              <tr>
                <td>Screenshots / video</td>
                <td>varies</td>
                <td>Show social moment (challenge, share, leaderboard)</td>
              </tr>
              <tr>
                <td>Category + tags</td>
                <td>—</td>
                <td>Match trivia / word / puzzle / sports discovery buckets</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="card">
          <div className="section-title">Recommended ship flow</div>
          <ol style={{ margin: 0, paddingLeft: 18, color: 'var(--text-muted)', fontSize: 14 }}>
            <li style={{ marginBottom: 8 }}>
              Open info pack → <strong>Open FB Upload</strong> (or open this page and pick the
              project).
            </li>
            <li style={{ marginBottom: 8 }}>
              Copy upload ZIP / listing fields → Meta Web hosting + Details.
            </li>
            <li style={{ marginBottom: 8 }}>
              Upload <code>game.zip</code> via <strong>Upload Version</strong> (not Debug Mode).
            </li>
            <li>Save App ID under Library → Edit details when you have it.</li>
          </ol>
        </section>
      </div>
    </div>
  );
}
