import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { copyText, getAPI } from '../lib/api';
import { usePlatform } from '../platform/usePlatform';
import { CopyButton } from '../components/CopyButton';
import type { CatalogItem } from '../types/api';

export function PlanNextPage() {
  const { platform, config, base, isAndroid } = usePlatform();
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [mode, setMode] = useState<'prefer-new' | 'allow-sequel'>('prefer-new');
  const [kind, setKind] = useState<'auto' | 'game' | 'app'>('auto');
  const [building, setBuilding] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [promptPath, setPromptPath] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const api = getAPI();
    const cat =
      typeof api.getResearchCatalog === 'function'
        ? await api.getResearchCatalog()
        : { items: [] as CatalogItem[], error: 'Research API unavailable' };
    setCatalog(cat.items || []);
    setLoadError(cat.error || null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPrompt('');
    setPromptPath('');
    setCopied(false);
    setError(null);
  }, [platform]);

  const thisPlatform = catalog.filter((c) => c.platform === platform);
  const otherPlatform = catalog.filter((c) => c.platform !== platform);

  async function buildPrompt() {
    setBuilding(true);
    setError(null);
    setCopied(false);
    try {
      const api = getAPI();
      if (typeof api.buildPlanPrompt !== 'function') {
        setError('Building a prompt needs the desktop app (not the browser preview).');
        return;
      }
      const res = await api.buildPlanPrompt({
        platform,
        mode,
        kind: isAndroid ? kind : 'game',
      });
      if (!res.ok || !res.prompt) {
        setError(res.error || 'Could not build the prompt.');
        return;
      }
      setPrompt(res.prompt);
      setPromptPath(res.promptPath || '');
      const ok = await copyText(res.prompt);
      if (ok) {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2500);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBuilding(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{config.planTitle}</h1>
          <p>{config.planLead}</p>
        </div>
        <div className="header-actions">
          <Link className="btn" to={`${base}/packs`}>
            Open Info Packs
          </Link>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void buildPrompt()}
            disabled={building}
          >
            {building ? 'Building prompt…' : config.planButton}
          </button>
        </div>
      </div>

      {loadError && <div className="alert alert-error">{loadError}</div>}

      <p className="live-dot" style={{ marginBottom: 16 }}>
        Copy a prompt → paste into Grok Build on this project
      </p>

      <div className="two-col">
        <section className="card">
          <div className="section-title">How this run works</div>
          <ol style={{ margin: 0, paddingLeft: 18, color: 'var(--text-muted)', fontSize: 14 }}>
            <li style={{ marginBottom: 8 }}>
              The studio inventories every pack, library entry, and workspace on <strong>both</strong>{' '}
              platforms and bakes that list into the prompt so we do not remake what you have.
            </li>
            <li style={{ marginBottom: 8 }}>
              Click <strong>{config.planButton}</strong> — the prompt is copied to your clipboard.
            </li>
            <li style={{ marginBottom: 8 }}>
              Open <strong>Grok Build</strong> with this <code>Facebook-Games</code> folder, and paste.
            </li>
            <li>
              Grok researches the {isAndroid ? 'Play' : 'Instant Games'} market and writes a full
              info pack into {isAndroid ? <code>android-packs/</code> : <code>info-packs/</code>}.
            </li>
          </ol>
        </section>

        <section className="card">
          <div className="section-title">Run options</div>
          <div className="field" style={{ marginBottom: 12 }}>
            <label htmlFor="mode">Novelty</label>
            <select
              id="mode"
              value={mode}
              onChange={(e) =>
                setMode(e.target.value === 'allow-sequel' ? 'allow-sequel' : 'prefer-new')
              }
              disabled={building}
            >
              <option value="prefer-new">Mostly new titles (default)</option>
              <option value="allow-sequel">New, or a genuine better version of something we have</option>
            </select>
          </div>
          {isAndroid && (
            <div className="field" style={{ marginBottom: 12 }}>
              <label htmlFor="kind">Play kind</label>
              <select
                id="kind"
                value={kind}
                onChange={(e) => {
                  const v = e.target.value;
                  setKind(v === 'game' || v === 'app' ? v : 'auto');
                }}
                disabled={building}
              >
                <option value="auto">Auto — pick game or app from the market</option>
                <option value="game">Game only</option>
                <option value="app">App only</option>
              </select>
            </div>
          )}
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
            Default is a <strong>new</strong> {isAndroid ? 'app or game' : 'Instant Game'}. A
            sequel is only allowed if you flip the option and the research can name ≥2 UX edges vs
            your existing title.
          </p>
        </section>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginTop: 16 }}>
          {error}
        </div>
      )}

      {prompt && (
        <section className="card" style={{ marginTop: 16, borderColor: 'rgba(61,214,140,0.35)' }}>
          <div className="section-title">Paste this into Grok Build</div>
          <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-muted)' }}>
            {copied
              ? 'Copied to the clipboard. Open Grok Build on this Facebook-Games folder and paste.'
              : 'Copy the prompt, then paste it into Grok Build with this project open.'}
          </p>
          <div className="header-actions" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
            <CopyButton text={prompt} label="Copy prompt" className="btn btn-primary" />
            {promptPath ? (
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => void getAPI().showItemInFolder(promptPath)}
              >
                Show prompt file
              </button>
            ) : null}
          </div>
          <pre className="markdown-block plan-prompt">{prompt}</pre>
        </section>
      )}

      <div className="two-col" style={{ marginTop: 16 }}>
        <section className="card">
          <div className="section-title">
            Already on {config.shortLabel} ({thisPlatform.length})
          </div>
          {thisPlatform.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
              Nothing on this side yet. First run has a clean slate.
            </p>
          ) : (
            <ul className="catalog-list">
              {thisPlatform.map((item) => (
                <li key={`${item.platform}-${item.slug}-${item.source}`}>
                  <strong>{item.title}</strong>
                  <span>
                    {item.kind} · {item.source} · {item.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card">
          <div className="section-title">
            Also in the studio ({otherPlatform.length} on the other platform)
          </div>
          {otherPlatform.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
              No titles on the other platform. Cross-platform remakes will still be blocked unless
              you allow a better version.
            </p>
          ) : (
            <ul className="catalog-list">
              {otherPlatform.map((item) => (
                <li key={`${item.platform}-${item.slug}-${item.source}`}>
                  <strong>{item.title}</strong>
                  <span>
                    {item.platform} · {item.kind} · {item.source}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

    </div>
  );
}
