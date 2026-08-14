import { useEffect, useState } from 'react';
import { getAPI } from '../lib/api';
import type { AppSettings } from '../types/api';

type PathField =
  | 'infoPacksPath'
  | 'publishedGamesPath'
  | 'gamesWorkspacePath'
  | 'androidInfoPacksPath'
  | 'androidLibraryPath'
  | 'androidWorkspacePath';

export function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [apiKeyDraft, setApiKeyDraft] = useState('');
  const [appPaths, setAppPaths] = useState<{ userData: string; projectRoot: string } | null>(
    null
  );

  useEffect(() => {
    async function load() {
      const api = getAPI();
      setSettings(await api.getSettings());
      setAppPaths(await api.getAppPaths());
    }
    load();
  }, []);

  async function pick(field: PathField) {
    const path = await getAPI().pickFolder();
    if (!path || !settings) return;
    const next = await getAPI().updateSettings({ [field]: path });
    setSettings(next);
    setToast('Folder updated');
    window.setTimeout(() => setToast(null), 1600);
  }

  async function saveField(field: PathField, value: string) {
    const next = await getAPI().updateSettings({ [field]: value });
    setSettings(next);
    setToast('Saved');
    window.setTimeout(() => setToast(null), 1600);
  }

  async function saveApiKey() {
    const key = apiKeyDraft.trim();
    if (!key) return;
    const next = await getAPI().setApiKey(key);
    setSettings(next);
    setApiKeyDraft('');
    setToast('API key saved locally');
    window.setTimeout(() => setToast(null), 1600);
  }

  async function saveEngine(engine: 'grok-build' | 'api') {
    const next = await getAPI().updateSettings({ researchEngine: engine });
    setSettings(next);
    setToast(engine === 'grok-build' ? 'Using Grok Build' : 'Using xAI API');
    window.setTimeout(() => setToast(null), 1600);
  }

  async function clearApiKey() {
    const next = await getAPI().setApiKey('');
    setSettings(next);
    setApiKeyDraft('');
    setToast('Saved key cleared');
    window.setTimeout(() => setToast(null), 1600);
  }

  if (!settings) {
    return <p style={{ color: 'var(--text-muted)' }}>Loading settings…</p>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>
            Point the studio at Facebook and Android pipeline folders. The sidebar switch
            chooses which set of paths the dashboard, packs, library, and upload pages scan.
          </p>
        </div>
      </div>

      <div className="card form-grid">
        <div className="section-title" style={{ gridColumn: '1 / -1' }}>
          Facebook Instant Games
        </div>
        <div className="field">
          <label>Info packs folder (pipeline output)</label>
          <div className="field-row">
            <input
              value={settings.infoPacksPath}
              onChange={(e) => setSettings({ ...settings, infoPacksPath: e.target.value })}
              onBlur={(e) => saveField('infoPacksPath', e.target.value)}
            />
            <button type="button" className="btn" onClick={() => pick('infoPacksPath')}>
              Browse
            </button>
          </div>
        </div>

        <div className="field">
          <label>Published library folder</label>
          <div className="field-row">
            <input
              value={settings.publishedGamesPath}
              onChange={(e) =>
                setSettings({ ...settings, publishedGamesPath: e.target.value })
              }
              onBlur={(e) => saveField('publishedGamesPath', e.target.value)}
            />
            <button type="button" className="btn" onClick={() => pick('publishedGamesPath')}>
              Browse
            </button>
          </div>
        </div>

        <div className="field">
          <label>Games workspace root</label>
          <div className="field-row">
            <input
              value={settings.gamesWorkspacePath}
              onChange={(e) =>
                setSettings({ ...settings, gamesWorkspacePath: e.target.value })
              }
              onBlur={(e) => saveField('gamesWorkspacePath', e.target.value)}
            />
            <button type="button" className="btn" onClick={() => pick('gamesWorkspacePath')}>
              Browse
            </button>
          </div>
        </div>
      </div>

      <div className="card form-grid" style={{ marginTop: 16 }}>
        <div className="section-title" style={{ gridColumn: '1 / -1' }}>
          Android · Google Play
        </div>
        <div className="field">
          <label>Android info packs folder</label>
          <div className="field-row">
            <input
              value={settings.androidInfoPacksPath || ''}
              onChange={(e) =>
                setSettings({ ...settings, androidInfoPacksPath: e.target.value })
              }
              onBlur={(e) => saveField('androidInfoPacksPath', e.target.value)}
            />
            <button type="button" className="btn" onClick={() => pick('androidInfoPacksPath')}>
              Browse
            </button>
          </div>
        </div>

        <div className="field">
          <label>Android library folder</label>
          <div className="field-row">
            <input
              value={settings.androidLibraryPath || ''}
              onChange={(e) =>
                setSettings({ ...settings, androidLibraryPath: e.target.value })
              }
              onBlur={(e) => saveField('androidLibraryPath', e.target.value)}
            />
            <button type="button" className="btn" onClick={() => pick('androidLibraryPath')}>
              Browse
            </button>
          </div>
        </div>

        <div className="field">
          <label>Android apps / games workspace</label>
          <div className="field-row">
            <input
              value={settings.androidWorkspacePath || ''}
              onChange={(e) =>
                setSettings({ ...settings, androidWorkspacePath: e.target.value })
              }
              onBlur={(e) => saveField('androidWorkspacePath', e.target.value)}
            />
            <button type="button" className="btn" onClick={() => pick('androidWorkspacePath')}>
              Browse
            </button>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
          Games and utility apps share this workspace (<code>android-apps/&lt;slug&gt;/</code>).
          Put <code>android-listing.json</code> and <code>app-release.aab</code> in each slug folder.
        </p>
      </div>

      <div className="card form-grid" style={{ marginTop: 16 }}>
        <div className="section-title" style={{ gridColumn: '1 / -1' }}>
          Market research
        </div>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
          Plan next builds a prompt from your catalog. You paste it into Grok Build on this
          project. No API key. The xAI key below is only an unused optional fallback.
        </p>
        <div className="field">
          <label>Research engine</label>
          <select
            value={settings.researchEngine === 'api' ? 'api' : 'grok-build'}
            onChange={(e) => void saveEngine(e.target.value === 'api' ? 'api' : 'grok-build')}
          >
            <option value="grok-build">Grok Build (this project / grok CLI) — recommended</option>
            <option value="api">xAI API key (optional fallback)</option>
          </select>
        </div>
        {settings.grokBuildPath ? (
          <div className="path-box" style={{ gridColumn: '1 / -1' }}>
            <code>grok CLI: {settings.grokBuildPath}</code>
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
            grok.exe not found on PATH. Keep Grok Build open on this folder and Plan next will
            still work — that chat claims the inbox job.
          </p>
        )}
        <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--text-dim)', gridColumn: '1 / -1' }}>
          Optional API fallback (only used if you pick “xAI API key” above, or if Grok Build cannot
          finish and a key is saved):
        </p>
        <div className="field">
          <label>xAI API key</label>
          <div className="field-row">
            <input
              type="password"
              value={apiKeyDraft}
              onChange={(e) => setApiKeyDraft(e.target.value)}
              placeholder={
                settings.researchApiReady
                  ? `Saved ${settings.researchApiMasked || '••••'}`
                  : 'xai-…'
              }
              autoComplete="off"
              style={{ fontFamily: 'var(--mono)' }}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => void saveApiKey()}
              disabled={!apiKeyDraft.trim()}
            >
              Save key
            </button>
          </div>
        </div>
        <div className="header-actions" style={{ gridColumn: '1 / -1' }}>
          {settings.researchApiReady ? (
            <span className="badge badge-ready">
              {settings.researchApiFromEnv ? 'Using XAI_API_KEY from env' : 'Key saved'}
            </span>
          ) : (
            <span className="badge">No API key — Grok Build does not need one</span>
          )}
          {settings.researchApiReady && !settings.researchApiFromEnv && (
            <button type="button" className="btn btn-sm" onClick={() => void clearApiKey()}>
              Clear saved key
            </button>
          )}
        </div>
      </div>

      {appPaths && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="section-title">App data</div>
          <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--text-muted)' }}>
            Settings file lives under Electron userData:
          </p>
          <div className="path-box">
            <code>{appPaths.userData}</code>
          </div>
          <p style={{ margin: '12px 0 8px', fontSize: 13, color: 'var(--text-muted)' }}>
            Project root:
          </p>
          <div className="path-box">
            <code>{appPaths.projectRoot}</code>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
