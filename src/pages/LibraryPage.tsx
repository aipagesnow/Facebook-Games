import { useCallback, useState } from 'react';
import { getAPI } from '../lib/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import type { PublishedGame } from '../types/api';
import { StatusBadge } from '../components/StatusBadge';
import { CopyButton } from '../components/CopyButton';
import { FbListingPanel } from '../components/FbListingPanel';

const emptyForm = {
  title: '',
  slug: '',
  status: 'in-production',
  facebookAppId: '',
  packPath: '',
  workspacePath: '',
  genre: '',
  notes: '',
};

type FormState = typeof emptyForm;

function gameToForm(g: PublishedGame): FormState {
  return {
    title: g.title || '',
    slug: g.slug || g.id || '',
    status: g.status || 'in-production',
    facebookAppId: g.facebookAppId || '',
    packPath: g.packPath ? String(g.packPath) : '',
    workspacePath: g.workspacePath ? String(g.workspacePath) : '',
    genre: g.genre || '',
    notes: g.notes || '',
  };
}

export function LibraryPage() {
  const [games, setGames] = useState<PublishedGame[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [toast, setToast] = useState<string | null>(null);
  /** null = form closed; 'new' = add; string id = edit that game */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    const res = await getAPI().listLibrary();
    setGames(res.games);
    setError(res.error);
    setLastRefresh(new Date());
  }, []);

  useAutoRefresh(refresh);

  function openNew() {
    setForm(emptyForm);
    setEditingId('new');
  }

  function openEdit(g: PublishedGame) {
    setForm(gameToForm(g));
    setEditingId(g.id);
    // scroll form into view-ish
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function closeForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;

    const existing = editingId && editingId !== 'new' ? games.find((x) => x.id === editingId) : null;
    const id =
      (editingId && editingId !== 'new' && editingId) ||
      form.slug.trim() ||
      form.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    await getAPI().saveLibraryGame({
      ...(existing || {}),
      ...form,
      id,
      slug: form.slug.trim() || id,
      facebookAppId: form.facebookAppId.trim(),
      publishedAt: existing?.publishedAt || new Date().toISOString(),
    });

    closeForm();
    setToast(existing ? 'Game updated (App ID saved)' : 'Game saved to library');
    window.setTimeout(() => setToast(null), 2000);
    await refresh();
  }

  async function openPath(path: string) {
    const res = await getAPI().openPath(path);
    if (!res.ok) {
      setToast(res.error || 'Could not open');
      window.setTimeout(() => setToast(null), 2000);
    }
  }

  const formOpen = editingId !== null;
  const isEdit = editingId !== null && editingId !== 'new';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Library</h1>
          <p>
            Games you have published (or are tracking) on Facebook Instant Games. Keep
            App IDs, pack links, workspace paths, and <strong>one-click FB listing copy</strong>{' '}
            in one place.
          </p>
          <p className="live-dot" style={{ marginTop: 8 }}>
            Live data
            {lastRefresh ? ` · ${lastRefresh.toLocaleTimeString()}` : ''}
          </p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn" onClick={() => void refresh()}>
            Refresh now
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => (formOpen ? closeForm() : openNew())}
          >
            {formOpen ? 'Cancel' : 'Add game'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {formOpen && (
        <form className="card form-grid" style={{ marginBottom: 18 }} onSubmit={handleSave}>
          <div className="section-title" style={{ gridColumn: '1 / -1' }}>
            {isEdit ? `Edit: ${form.title || editingId}` : 'Add game'}
          </div>
          <div className="field">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              placeholder="My Instant Game"
            />
          </div>
          <div className="field">
            <label htmlFor="slug">Slug / ID</label>
            <input
              id="slug"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="auto-from-title"
              disabled={isEdit}
            />
          </div>
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="appId">
              Facebook App ID{' '}
              <span style={{ fontWeight: 400, color: 'var(--text-dim)' }}>
                (from Meta URL …/apps/<strong>THIS</strong>/… or App settings → Basic)
              </span>
            </label>
            <input
              id="appId"
              value={form.facebookAppId}
              onChange={(e) => setForm({ ...form, facebookAppId: e.target.value })}
              placeholder="e.g. 1593839865675820"
              autoComplete="off"
              style={{ fontFamily: 'var(--mono)' }}
            />
          </div>
          <div className="field">
            <label htmlFor="status">Status</label>
            <input
              id="status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              placeholder="in-production, published…"
            />
          </div>
          <div className="field">
            <label htmlFor="genre">Genre</label>
            <input
              id="genre"
              value={form.genre}
              onChange={(e) => setForm({ ...form, genre: e.target.value })}
              placeholder="trivia, word, puzzle…"
            />
          </div>
          <div className="field">
            <label htmlFor="packPath">Source info pack path</label>
            <input
              id="packPath"
              value={form.packPath}
              onChange={(e) => setForm({ ...form, packPath: e.target.value })}
              placeholder="C:\...\info-packs\my-game"
            />
          </div>
          <div className="field">
            <label htmlFor="workspace">Game workspace path</label>
            <input
              id="workspace"
              value={form.workspacePath}
              onChange={(e) => setForm({ ...form, workspacePath: e.target.value })}
              placeholder="C:\...\games\my-game"
            />
          </div>
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Live-ops notes, review status, UA campaigns…"
            />
          </div>
          <div>
            <button type="submit" className="btn btn-primary">
              {isEdit ? 'Save changes' : 'Save to library'}
            </button>
          </div>
        </form>
      )}

      {games.length === 0 ? (
        <div className="empty-state">
          <h3>Library is empty</h3>
          <p>When you publish an Instant Game, add it here for quick access later.</p>
          <button type="button" className="btn btn-primary" onClick={openNew}>
            Add first game
          </button>
        </div>
      ) : (
        <div className="grid" style={{ gap: 14 }}>
          {games.map((g) => {
            const open = expandedId === g.id;
            return (
              <article key={g.id} className="card">
                <div className="meta-row">
                  <StatusBadge status={g.status} />
                  {g.genre && <span className="badge">{g.genre}</span>}
                  {g.fbListing ? <span className="badge">FB copy ready</span> : null}
                </div>
                <h2 className="card-title">{g.title}</h2>
                <div className="path-box" style={{ marginTop: 8 }}>
                  <code>
                    App ID: {g.facebookAppId || '(not set — click Edit details)'}
                  </code>
                  {g.facebookAppId ? (
                    <CopyButton text={String(g.facebookAppId)} label="Copy App ID" />
                  ) : null}
                </div>
                {g.notes && <p className="card-desc">{g.notes}</p>}
                {g.packPath && (
                  <div className="path-box">
                    <code>{g.packPath}</code>
                    <CopyButton text={String(g.packPath)} label="Copy pack" />
                  </div>
                )}
                {g.workspacePath && (
                  <div className="path-box">
                    <code>{g.workspacePath}</code>
                    <CopyButton text={String(g.workspacePath)} label="Copy build folder" />
                  </div>
                )}
                <div className="header-actions" style={{ marginTop: 12, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => openEdit(g)}
                  >
                    Edit details (App ID)
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => setExpandedId(open ? null : g.id)}
                  >
                    {open ? 'Hide FB fields' : 'Show FB copy fields'}
                  </button>
                  {g.workspacePath ? (
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => void openPath(String(g.workspacePath))}
                    >
                      Open build folder
                    </button>
                  ) : null}
                </div>
                {open && (
                  <div style={{ marginTop: 16 }}>
                    <div className="section-title">Facebook listing — click Copy on any row</div>
                    <FbListingPanel game={g} />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
