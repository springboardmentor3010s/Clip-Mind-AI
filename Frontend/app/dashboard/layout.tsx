'use client';
import { useAuth, AuthProvider } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ROLE_COLORS, ROLE_LABELS } from '@/lib/api';

const NAV_ITEMS = [
  { href: '/dashboard', icon: '🏠', label: 'Dashboard', roles: ['ALL'] },
  { href: '/videos', icon: '🎬', label: 'My Videos', roles: ['ADMIN', 'CONTENT_CREATOR', 'EDUCATOR'] },
  { href: '/browse', icon: '🔍', label: 'Browse', roles: ['ALL'] },
  { href: '/bookmarks', icon: '🔖', label: 'Saved Bookmarks', roles: ['ALL'] },
  { href: '/upload', icon: '⬆️', label: 'Upload Video', roles: ['ADMIN', 'CONTENT_CREATOR', 'EDUCATOR'] },
  { href: '/analytics', icon: '📊', label: 'Analytics', roles: ['ADMIN', 'CONTENT_CREATOR', 'EDUCATOR'] },
  { href: '/classroom', icon: '🏫', label: 'Classroom Hub', roles: ['ADMIN', 'EDUCATOR'] },
  { href: '/profile', icon: '👤', label: 'Profile & History', roles: ['ALL'] },
  { href: '/admin', icon: '🛡️', label: 'Admin Panel', roles: ['ADMIN'] },
];

function AppSidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const visibleNav = NAV_ITEMS.filter((item) =>
    item.roles.includes('ALL') || item.roles.includes(user?.role || '')
  );

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <>
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 99,
          }}
        />
      )}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10 }} onClick={onClose}>
            <span style={{ fontSize: '1.4rem' }}>🎬</span>
            <span className="sidebar-logo-mark">
              Clip<span className="text-gradient">Mind</span> AI
            </span>
          </Link>
          <button
            className="btn btn-ghost btn-sm mobile-close-btn"
            onClick={onClose}
            style={{ fontSize: '1.2rem', padding: '4px 8px', display: 'none' }}
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Navigation</div>
          {visibleNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/dashboard') ? 'active' : ''}`}
              onClick={onClose}
            >
              <span style={{ fontSize: '1rem' }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <Link
            href="/profile"
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 10px',
              marginBottom: 8,
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)',
              textDecoration: 'none',
              border: '1px solid var(--border-subtle)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(79,142,247,0.3)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
          >
            <div className="avatar avatar-sm" style={{ background: 'var(--gradient-primary)' }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <span className={`badge ${ROLE_COLORS[user?.role || '']}`} style={{ fontSize: '0.6rem', padding: '1px 7px' }}>{ROLE_LABELS[user?.role || '']}</span>
            </div>
          </Link>
          <button onClick={logout} className="nav-link" style={{ width: '100%', color: 'var(--accent-rose)' }}>
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading]);

  useEffect(() => {
    // Close mobile drawer on route change
    setMobileMenuOpen(false);
  }, [pathname]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: '2.5rem' }}>🎬</span>
        <div className="spinner spinner-lg" />
        <p>Loading ClipMind AI...</p>
      </div>
    </div>
  );

  if (!user) return null;

  const pageTitle = NAV_ITEMS.find((n) => pathname === n.href || (pathname.startsWith(n.href + '/') && n.href !== '/dashboard'))?.label || 'Dashboard';

  return (
    <div className="app-layout">
      <AppSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <div className="main-content">
        <div className="topbar">
          <button
            className="btn btn-ghost hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ padding: '6px 10px', fontSize: '1.2rem', marginRight: 4, display: 'none' }}
            aria-label="Toggle navigation menu"
          >
            ☰
          </button>
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{pageTitle}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {user?.role !== 'LEARNER' && (
              <Link href="/upload" className="btn btn-primary btn-sm">
                ⬆️ Upload
              </Link>
            )}
            <Link href="/profile" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <div className="avatar avatar-sm" style={{ background: 'var(--gradient-primary)' }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </Link>
          </div>
        </div>
        <div className="page-content fade-in">{children}</div>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider><DashboardShell>{children}</DashboardShell></AuthProvider>;
}
