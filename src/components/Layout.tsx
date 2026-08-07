import { NavLink, Outlet } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard', icon: '◆', end: true },
  { to: '/packs', label: 'Info Packs', icon: '◎' },
  { to: '/library', label: 'Library', icon: '▣' },
  { to: '/upload-guide', label: 'FB Upload', icon: '↑' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
];

export function Layout() {
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
