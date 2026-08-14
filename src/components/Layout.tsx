import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { requestStudioRefresh } from '../hooks/useAutoRefresh';
import { getAPI } from '../lib/api';
import { usePlatform } from '../platform/usePlatform';
import type { StudioPlatform } from '../platform/config';

export function Layout() {
  const [pulse, setPulse] = useState(false);
  const { platform, config, base } = usePlatform();
  const navigate = useNavigate();
  const location = useLocation();

  const links = [
    { to: base, label: 'Dashboard', icon: '◆', end: true },
    { to: `${base}/plan`, label: 'Plan next', icon: '✦' },
    { to: `${base}/packs`, label: 'Info Packs', icon: '◎' },
    { to: `${base}/library`, label: 'Library', icon: '▣' },
    { to: `${base}/ship`, label: 'Ship board', icon: '☑' },
    { to: `${base}/upload-guide`, label: config.navUpload, icon: '↑' },
    { to: `${base}/settings`, label: 'Settings', icon: '⚙' },
  ];

  useEffect(() => {
    document.title = config.windowTitle;
    document.documentElement.dataset.platform = platform;
  }, [config.windowTitle, platform]);

  function handleRefresh() {
    requestStudioRefresh();
    setPulse(true);
    window.setTimeout(() => setPulse(false), 900);
  }

  function switchPlatform(next: StudioPlatform) {
    if (next === platform) return;
    const rest = location.pathname.replace(/^\/(facebook|android)/, '') || '';
    navigate(`/${next}${rest}${location.search}`);
    void getAPI().updateSettings({ activePlatform: next });
  }

  return (
    <div className="app-shell" data-platform={platform}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">{config.brandMark}</div>
          <div className="brand-text">
            <div className="brand-title">{config.brandTitle}</div>
            <div className="brand-sub">{config.brandSub}</div>
          </div>
        </div>

        <div className="platform-switch" role="tablist" aria-label="Build platform">
          <button
            type="button"
            role="tab"
            aria-selected={platform === 'facebook'}
            className={platform === 'facebook' ? 'active' : undefined}
            onClick={() => switchPlatform('facebook')}
          >
            Facebook
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={platform === 'android'}
            className={platform === 'android' ? 'active' : undefined}
            onClick={() => switchPlatform('android')}
          >
            Android
          </button>
        </div>
        <p className="platform-switch-hint">
          {platform === 'facebook'
            ? 'Instant Games for Facebook / Messenger'
            : 'Games and apps for Google Play'}
        </p>

        <nav className="nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              <span className="nav-icon">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-tools">
          <button type="button" className="btn btn-sm sidebar-refresh" onClick={handleRefresh}>
            {pulse ? 'Refreshed' : 'Refresh data'}
          </button>
          <p className="sidebar-hint">
            Auto-reloads when you return to this window, and every few seconds, so new packs /
            library / builds show up without restarting.
          </p>
        </div>

        <div className="sidebar-footer">{config.sidebarFooter}</div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
