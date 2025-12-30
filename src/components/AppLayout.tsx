import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const links = [
  { to: '/', label: 'Overview' },
  { to: '/events', label: 'Events' },
  { to: '/prayers', label: 'Prayers' },
  { to: '/users', label: 'Users' },
  { to: '/notifications', label: 'Notifications' },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Failed to log out', err);
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="logo-mark">HPN Admin</div>
        <div className="nav-links">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span>{link.label}</span>
            </NavLink>
          ))}
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">His Presence Newcastle</p>
            <h1>Admin Control</h1>
          </div>
          <div className="topbar-actions">
            <div className="user-chip">
              <div className="dot" />
              <div>
                <div className="chip-label">{user?.name || user?.email}</div>
                <div className="chip-subtext">{user?.role}</div>
              </div>
            </div>
            <button className="btn ghost" onClick={handleLogout} type="button">
              Logout
            </button>
          </div>
        </header>

        <main className="content">{children}</main>
      </div>
    </div>
  );
}
