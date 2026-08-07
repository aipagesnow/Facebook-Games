import { useEffect, useState } from 'react';
import { getAPI } from '../lib/api';
import type { PublishedGame } from '../types/api';
import { StatusBadge } from '../components/StatusBadge';
import { CopyButton } from '../components/CopyButton';

const emptyForm = {
  title: '',
  slug: '',
  status: 'published',
  facebookAppId: '',
  packPath: '',
  workspacePath: '',
  genre: '',
  notes: '',
};

export function LibraryPage() {
  const [games, setGames] = useState<PublishedGame[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [toast, setToast] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function refresh() {
    const res = await getAPI().listLibrary();
    setGames(res.games);
    setError(res.error);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    const id =
      form.slug.trim() ||
      form.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    await getAPI().saveLibraryGame({
      ...form,
      id,
      slug: id,
      publishedAt: new Date().toISOString(),
    });
    setForm(emptyForm);
    setShowForm(false);
    setToast('Game saved to library');
    window.setTimeout(() => setToast(null), 1800);
    await refresh();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Library</h1>
          <p>
            Games you have published (or are tracking) on Facebook Instant Games. Keep
            App IDs, pack links, and workspace paths in one place.
          </p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn" onClick={refresh}>
            Refresh
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? 'Cancel' : 'Add game'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <form className="card form-grid" style={{ marginBottom: 18 }} onSubmit={handleSave}>
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
            />
          </div>
          <div className="field">
            <label htmlFor="appId">Facebook App ID</label>
            <input
              id="appId"
              value={form.facebookAppId}
              onChange={(e) => setForm({ ...form, facebookAppId: e.target.value })}
              placeholder="from developers.facebook.com"
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
          <div className="field">
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
              Save to library
            </button>
          </div>
        </form>
      )}

      {games.length === 0 ? (
        <div className="empty-state">
          <h3>Library is empty</h3>
          <p>When you publish an Instant Game, add it here for quick access later.</p>
          <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>
            Add first game
          </button>
        </div>
      ) : (
        <div className="grid grid-cards">
          {games.map((g) => (
            <article key={g.id} className="card">
              <div className="meta-row">
                <StatusBadge status={g.status} />
                {g.genre && <span className="badge">{g.genre}</span>}
              </div>
              <h2 className="card-title">{g.title}</h2>
              {g.facebookAppId && (
                <p className="card-desc" style={{ fontFamily: 'var(--mono)' }}>
                  App ID: {g.facebookAppId}
                </p>
              )}
              {g.notes && <p className="card-desc">{g.notes}</p>}
              {g.packPath && (
                <div className="path-box">
                  <code>{g.packPath}</code>
                  <CopyButton text={String(g.packPath)} />
                </div>
              )}
              {g.workspacePath && (
                <div className="path-box">
                  <code>{g.workspacePath}</code>
                  <CopyButton text={String(g.workspacePath)} label="Copy workspace" />
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
