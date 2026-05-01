'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';
import Icon from './Icon';
import AuthModal from '@/components/auth/AuthModal';
import { useAuth } from '@/components/auth/AuthProvider';

interface TopBarProps {
  role?: 'tenant' | 'landlord';
}

const menuLinkStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '12px 14px', borderRadius: 10,
  color: 'var(--n-ink)', fontSize: 15, fontWeight: 500,
};

export default function TopBar({ role = 'tenant' }: TopBarProps) {
  const { user, loading, refresh, logout } = useAuth();
  const pathname = usePathname();
  const [showAuth, setShowAuth] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    fetch('/api/conversations/unread')
      .then(r => r.json())
      .then(d => setUnread(d.count ?? 0))
      .catch(() => {});
    fetch('/api/notifications')
      .then(r => r.json())
      .then(d => setNotifCount((d.notifications ?? []).filter((n: { read: boolean }) => !n.read).length))
      .catch(() => {});
  }, [user]);

  const isLandlord  = user?.role === 'LANDLORD';
  const isInspector = user?.role === 'INSPECTOR';
  const closeDrawer = () => setDrawerOpen(false);

  return (
    <>
      {/* ─── TopBar ─── */}
      <div
        className="n-topbar-inner"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 40px', borderBottom: '1px solid var(--n-line)',
          background: 'var(--n-bg)', position: 'sticky', top: 0, zIndex: 100,
        }}
      >
        {/* Left: logo + nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
          <Link href="/"><Logo /></Link>
          <nav className="n-topbar-nav" style={{ display: 'flex', gap: 22, fontSize: 14, color: 'var(--n-muted)' }}>
            {[
              { href: '/search', label: 'Rent' },
              { href: '/how-it-works', label: 'How it works' },
            ].map(({ href, label }) => {
              const active = pathname === href || pathname.startsWith(href + '/');
              return (
                <Link key={href} href={href} style={{ color: active ? 'var(--n-ink)' : 'var(--n-muted)', fontWeight: active ? 600 : 400, borderBottom: active ? '2px solid var(--n-ink)' : '2px solid transparent', paddingBottom: 2, transition: 'color 0.15s' }}>
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: city + auth (desktop) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Hamburger — mobile only */}
          <button
            className="n-topbar-hamburger"
            onClick={() => setDrawerOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--n-ink)', padding: 4 }}
            aria-label="Open menu"
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <line x1="3" y1="6" x2="19" y2="6" />
              <line x1="3" y1="11" x2="19" y2="11" />
              <line x1="3" y1="16" x2="19" y2="16" />
            </svg>
          </button>

          {/* Notification bell */}
          {user && (
            <Link href="/notifications" className="n-hide-mobile" style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: 6, borderRadius: 999, color: 'var(--n-ink)' }}>
              <Icon name="chat" className="n-ico" />
              {notifCount > 0 && (
                <span style={{ position: 'absolute', top: 2, right: 2, width: 14, height: 14, borderRadius: 999, background: 'var(--n-danger)', color: '#fff', fontSize: 8, display: 'grid', placeItems: 'center', fontWeight: 700 }}>{notifCount}</span>
              )}
            </Link>
          )}

          {/* Desktop auth */}
          {loading ? (
            <div className="n-hide-mobile" style={{ width: 80, height: 32, borderRadius: 999, background: 'var(--n-line)', opacity: 0.5 }} />
          ) : user ? (
            <div className="n-hide-mobile" style={{ position: 'relative' }}>
              <button
                onClick={() => setShowUserMenu(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, border: '1px solid var(--n-line)', background: 'var(--n-surface)', cursor: 'pointer', color: 'var(--n-ink)' }}
              >
                <div style={{ width: 26, height: 26, borderRadius: 999, background: 'var(--n-accent-soft)', color: 'var(--n-accent-ink)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 12 }}>
                  {(user.name ?? user.phone)[0].toUpperCase()}
                </div>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{user.name ?? user.phone}</span>
                <Icon name="chevronDown" className="n-ico" />
              </button>

              {showUserMenu && (
                <div className="n-card" style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, minWidth: 200, padding: 8, zIndex: 200 }}>
                  {isLandlord && (
                    <Link href="/dashboard" onClick={() => setShowUserMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, color: 'var(--n-ink)', fontSize: 14, fontWeight: 500 }}>
                      <Icon name="home" /> Dashboard
                    </Link>
                  )}
                  {isInspector && (
                    <Link href="/inspector" onClick={() => setShowUserMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, color: 'var(--n-ink)', fontSize: 14, fontWeight: 500 }}>
                      <Icon name="stamp" /> My inspections
                    </Link>
                  )}
                  <Link href="/messages" onClick={() => setShowUserMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, color: 'var(--n-ink)', fontSize: 14 }}>
                    <Icon name="chat" /> Messages
                    {unread > 0 && (
                      <span className="n-chip" style={{ marginLeft: 'auto', background: 'var(--n-danger)', color: '#fff', borderColor: 'transparent', fontSize: 10, height: 18, padding: '0 6px' }}>{unread}</span>
                    )}
                  </Link>
                  <Link href="/notifications" onClick={() => setShowUserMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, color: 'var(--n-ink)', fontSize: 14 }}>
                    <Icon name="chat" /> Notifications
                    {notifCount > 0 && (
                      <span className="n-chip" style={{ marginLeft: 'auto', background: 'var(--n-danger)', color: '#fff', borderColor: 'transparent', fontSize: 10, height: 18, padding: '0 6px' }}>{notifCount}</span>
                    )}
                  </Link>
                  <Link href="/activity" onClick={() => setShowUserMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, color: 'var(--n-ink)', fontSize: 14 }}>
                    <Icon name="calendar" /> My bookings
                  </Link>
                  <Link href="/saved" onClick={() => setShowUserMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, color: 'var(--n-ink)', fontSize: 14 }}>
                    <Icon name="heart" /> Saved listings
                  </Link>
                  <Link href="/maintenance" onClick={() => setShowUserMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, color: 'var(--n-ink)', fontSize: 14 }}>
                    <Icon name="home" /> Maintenance
                  </Link>
                  <Link href="/saved-searches" onClick={() => setShowUserMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, color: 'var(--n-ink)', fontSize: 14 }}>
                    <Icon name="search" /> Saved searches
                  </Link>
                  <Link href="/account" onClick={() => setShowUserMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, color: 'var(--n-ink)', fontSize: 14 }}>
                    <Icon name="user" /> Account
                  </Link>
                  <Link href="/payments" onClick={() => setShowUserMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, color: 'var(--n-ink)', fontSize: 14 }}>
                    <Icon name="file" /> Payments
                  </Link>
                  <Link href="/list-property" onClick={() => setShowUserMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, color: 'var(--n-ink)', fontSize: 14 }}>
                    <Icon name="plus" /> List a property
                  </Link>
                  <div className="n-divider" style={{ margin: '6px 0' }} />
                  <button
                    onClick={async () => { await logout(); setShowUserMenu(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, color: 'var(--n-danger)', fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', width: '100%', fontFamily: 'inherit' }}
                  >
                    <Icon name="close" /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="n-hide-mobile" style={{ display: 'flex', gap: 8 }}>
              <button className="n-btn ghost sm" onClick={() => setShowAuth(true)}>Sign in</button>
              {role === 'landlord' || isLandlord ? (
                <Link href="/dashboard" className="n-btn primary sm">Dashboard</Link>
              ) : (
                <Link href="/list-property" className="n-btn primary sm" onClick={(e) => { if (!user) { e.preventDefault(); setShowAuth(true); } }}>
                  List a property
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Mobile drawer ─── */}
      {drawerOpen && (
        <div className="n-drawer">
          <div className="n-drawer-overlay" onClick={closeDrawer} />
          <div className="n-drawer-panel">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Logo />
              <button onClick={closeDrawer} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--n-muted)', padding: 4 }}>
                <Icon name="close" className="n-ico lg" />
              </button>
            </div>

            {/* User avatar / sign in */}
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, background: 'var(--n-surface-2)', marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 999, background: 'var(--n-accent-soft)', color: 'var(--n-accent-ink)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 15 }}>
                  {(user.name ?? user.phone)[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{user.name ?? user.phone}</div>
                  <div className="n-mono" style={{ color: 'var(--n-muted)' }}>{user.role}</div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <button className="n-btn ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setShowAuth(true); closeDrawer(); }}>Sign in</button>
              </div>
            )}

            <div className="n-divider" style={{ margin: '8px 0' }} />

            {/* Nav links */}
            <Link href="/search" onClick={closeDrawer} style={menuLinkStyle}><Icon name="pin" /> Rent a home</Link>
            <Link href="/how-it-works" onClick={closeDrawer} style={menuLinkStyle}><Icon name="sparkle" /> How it works</Link>
            {user && (
              <Link href="/messages" onClick={closeDrawer} style={{ ...menuLinkStyle, justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Icon name="chat" /> Messages</span>
                {unread > 0 && <span className="n-chip" style={{ background: 'var(--n-danger)', color: '#fff', borderColor: 'transparent', fontSize: 11 }}>{unread}</span>}
              </Link>
            )}
            {user && (
              <Link href="/notifications" onClick={closeDrawer} style={{ ...menuLinkStyle, justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Icon name="chat" /> Notifications</span>
                {notifCount > 0 && <span className="n-chip" style={{ background: 'var(--n-danger)', color: '#fff', borderColor: 'transparent', fontSize: 11 }}>{notifCount}</span>}
              </Link>
            )}
            {user && <Link href="/activity" onClick={closeDrawer} style={menuLinkStyle}><Icon name="calendar" /> My bookings</Link>}
            {user && <Link href="/saved" onClick={closeDrawer} style={menuLinkStyle}><Icon name="heart" /> Saved listings</Link>}
            {user && <Link href="/maintenance" onClick={closeDrawer} style={menuLinkStyle}><Icon name="home" /> Maintenance</Link>}
            {user && <Link href="/saved-searches" onClick={closeDrawer} style={menuLinkStyle}><Icon name="search" /> Saved searches</Link>}
            {user && <Link href="/account" onClick={closeDrawer} style={menuLinkStyle}><Icon name="user" /> Account</Link>}
            {user && <Link href="/payments" onClick={closeDrawer} style={menuLinkStyle}><Icon name="file" /> Payments</Link>}
            {isLandlord  && <Link href="/dashboard" onClick={closeDrawer} style={menuLinkStyle}><Icon name="home" /> Dashboard</Link>}
            {isInspector && <Link href="/inspector" onClick={closeDrawer} style={menuLinkStyle}><Icon name="stamp" /> My inspections</Link>}
            {(user || !user) && <Link href="/list-property" onClick={closeDrawer} style={menuLinkStyle}><Icon name="plus" /> List a property</Link>}

            {user && (
              <>
                <div className="n-divider" style={{ margin: '8px 0' }} />
                <button
                  onClick={async () => { await logout(); closeDrawer(); }}
                  style={{ ...menuLinkStyle, background: 'none', border: 'none', cursor: 'pointer', width: '100%', color: 'var(--n-danger)', fontFamily: 'inherit' }}
                >
                  <Icon name="close" /> Sign out
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSuccess={() => { refresh(); setShowAuth(false); }}
        />
      )}
    </>
  );
}
