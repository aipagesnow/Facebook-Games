import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAPI } from '../lib/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { usePlatform } from '../platform/usePlatform';
import { StatusBadge } from '../components/StatusBadge';
import { SHIP_ITEMS, boardProgress } from '../lib/shipBoard';
import { isOverdue } from '../lib/storeLinks';
import type { ShipBoardRecord } from '../types/api';

export function ShipBoardPage() {
  const { platform, base, isAndroid, config } = usePlatform();
  const [boards, setBoards] = useState<ShipBoardRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await getAPI().listShipBoards(platform);
    setBoards(res.boards || []);
    setError(res.error);
  }, [platform]);

  useAutoRefresh(load);

  async function toggle(board: ShipBoardRecord, id: string) {
    const next: ShipBoardRecord = {
      ...board,
      checks: { ...(board.checks || {}), [id]: !board.checks?.[id] },
    };
    setBoards((list) => list.map((b) => (b.slug === board.slug ? next : b)));
    await getAPI().saveShipBoard(next);
  }

  async function saveNotes(board: ShipBoardRecord, notes: string) {
    const next = { ...board, notes };
    setBoards((list) => list.map((b) => (b.slug === board.slug ? next : b)));
    await getAPI().saveShipBoard(next);
  }

  async function saveLiveOps(board: ShipBoardRecord, patch: Partial<ShipBoardRecord>) {
    const next = { ...board, ...patch };
    setBoards((list) => list.map((b) => (b.slug === board.slug ? next : b)));
    await getAPI().saveShipBoard(next);
  }

  const items = SHIP_ITEMS[platform];
  const other = isAndroid ? 'facebook' : 'android';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Ship board</h1>
          <p>
            One checklist per title on {config.shortLabel}. Tick what is actually done. This is the
            “what do I do today” view — not store copy.
          </p>
        </div>
        <div className="header-actions">
          <Link className="btn" to={`${base}/library`}>
            Library
          </Link>
          <Link className="btn btn-primary" to={`${base}/upload-guide`}>
            {config.navUpload}
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {boards.length === 0 ? (
        <div className="empty-state">
          <h3>No titles on this side yet</h3>
          <p>Add a library entry or create an info pack. Ship rows appear automatically.</p>
          <Link className="btn btn-primary" to={`${base}/packs`}>
            Open Info Packs
          </Link>
        </div>
      ) : (
        <div className="grid" style={{ gap: 14 }}>
          {boards.map((board) => {
            const prog = boardProgress(board, platform);
            const open = openSlug === board.slug;
            return (
              <article key={board.slug} className="card">
                <div className="meta-row">
                  <StatusBadge status={board.status} />
                  {board.kind && (
                    <span className={`badge ${board.kind === 'app' ? 'badge-app' : 'badge-game'}`}>
                      {board.kind}
                    </span>
                  )}
                  <span className="badge">
                    {prog.done}/{prog.total} ship steps
                  </span>
                  {board.siblingPackFolder ? (
                    <span className="badge badge-ready">Also on {other}</span>
                  ) : (
                    <span className="badge">This platform only</span>
                  )}
                  {board.nextActionDate && isOverdue(board.nextActionDate) ? (
                    <span className="badge badge-candidate">live-ops overdue</span>
                  ) : board.nextActionDate ? (
                    <span className="badge">next {board.nextActionDate}</span>
                  ) : null}
                </div>
                <h2 className="card-title">{board.title}</h2>
                <div className="research-meter" style={{ margin: '10px 0 12px' }}>
                  <div className="research-meter-bar" style={{ width: `${prog.pct}%` }} />
                </div>
                <div className="header-actions" style={{ flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => setOpenSlug(open ? null : board.slug)}
                  >
                    {open ? 'Hide checklist' : 'Open checklist'}
                  </button>
                  {board.packFolderName || board.packPath ? (
                    <Link
                      className="btn btn-sm"
                      to={`${base}/packs/${encodeURIComponent(board.packFolderName || board.slug)}`}
                    >
                      Open pack
                    </Link>
                  ) : null}
                  {board.siblingPackFolder ? (
                    <Link className="btn btn-sm" to={`/${other}/packs/${encodeURIComponent(board.siblingPackFolder)}`}>
                      Open {other} pack
                    </Link>
                  ) : null}
                </div>
                {open && (
                  <div style={{ marginTop: 14 }}>
                    <div className="use-case-list">
                      {items.map((item) => (
                        <label
                          key={item.id}
                          className={`use-case-row ${board.checks?.[item.id] ? 'use-case-required' : ''}`}
                          style={{ cursor: 'pointer', gridTemplateColumns: '24px 1fr' }}
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(board.checks?.[item.id])}
                            onChange={() => void toggle(board, item.id)}
                          />
                          <div className="use-case-body">
                            <strong>{item.label}</strong>
                            {item.hint ? <span>{item.hint}</span> : null}
                          </div>
                        </label>
                      ))}
                    </div>
                    <div className="field" style={{ marginTop: 14 }}>
                      <label htmlFor={`next-${board.slug}`}>Next live-ops action</label>
                      <input
                        id={`next-${board.slug}`}
                        defaultValue={board.nextAction || ''}
                        onBlur={(e) => void saveLiveOps(board, { nextAction: e.target.value })}
                        placeholder="e.g. sports theme week seed, retest ads on mobile"
                      />
                    </div>
                    <div className="field" style={{ marginTop: 10 }}>
                      <label htmlFor={`when-${board.slug}`}>Do it by</label>
                      <input
                        id={`when-${board.slug}`}
                        type="date"
                        defaultValue={board.nextActionDate || ''}
                        onBlur={(e) => void saveLiveOps(board, { nextActionDate: e.target.value })}
                      />
                    </div>
                    <div className="field" style={{ marginTop: 10 }}>
                      <label htmlFor={`notes-${board.slug}`}>Notes</label>
                      <textarea
                        id={`notes-${board.slug}`}
                        rows={3}
                        defaultValue={board.notes || ''}
                        onBlur={(e) => void saveNotes(board, e.target.value)}
                        placeholder="Waiting on Meta BV, tester email, etc."
                      />
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
