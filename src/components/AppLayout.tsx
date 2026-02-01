import type { ReactNode } from 'react';
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const links = [
  { to: '/', label: 'Overview' },
  { to: '/attendance', label: 'Attendance' },
  { to: '/events', label: 'Events' },
  { to: '/prayers', label: 'Prayers' },
  { to: '/users', label: 'Users' },
  { to: '/notifications', label: 'Notifications' },
  { to: '/tools', label: 'Tools' },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="logo-mark">HPN Admin</div>
        <div className="nav-links">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span>{link.label}</span>
            </NavLink>
          ))}
        </div>
      </aside>

      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      <div className="main">
        <header className="topbar">
          <button
            className="hamburger"
            aria-label="Toggle navigation"
            onClick={() => setSidebarOpen((s) => !s)}
            type="button"
          >
            <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 1.75H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M0 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M0 12.25H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
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
