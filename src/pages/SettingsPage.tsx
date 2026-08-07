import { useEffect, useState } from 'react';
import { getAPI } from '../lib/api';
import type { AppSettings } from '../types/api';

export function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [toast, setToast] = useState<string | null>(null);
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

  async function pick(field: keyof AppSettings) {
    const path = await getAPI().pickFolder();
    if (!path || !settings) return;
    const next = await getAPI().updateSettings({ [field]: path });
    setSettings(next);
    setToast('Folder updated');
    window.setTimeout(() => setToast(null), 1600);
  }

  async function saveField(field: keyof AppSettings, value: string) {
    const next = await getAPI().updateSettings({ [field]: value });
    setSettings(next);
    setToast('Saved');
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
            Point the studio at your research pipeline output, published library folder,
            and game workspaces. These paths power the dashboard and copy-paste workflow.
          </p>
        </div>
      </div>

      <div className="card form-grid">
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
