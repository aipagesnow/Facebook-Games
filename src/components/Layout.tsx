import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { requestStudioRefresh } from '../hooks/useAutoRefresh';

const links = [
  { to: '/', label: 'Dashboard', icon: '◆', end: true },
  { to: '/packs', label: 'Info Packs', icon: '◎' },
  { to: '/library', label: 'Library', icon: '▣' },
  { to: '/upload-guide', label: 'FB Upload', icon: '↑' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
];

export function Layout() {
  const [pulse, setPulse] = useState(false);

  function handleRefresh() {
    requestStudioRefresh();
    setPulse(true);
    window.setTimeout(() => setPulse(false), 900);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">IG</div>
          <div className="brand-text">
            <div className="brand-title">Games Studio</div>
            <div className="brand-sub">Facebook Instant Games</div>
          </div>
        </div>

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
            library / games show up without restarting.
          </p>
        </div>

        <div className="sidebar-footer">
          Local studio for research packs → build →
          developers.facebook Instant Games market.
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
