'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TopBar from '@/components/ui/TopBar';
import Icon from '@/components/ui/Icon';
import { useAuth } from '@/components/auth/AuthProvider';

type Notification = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

function timeAgo(date: string) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/'); return; }
    if (!user) return;
    fetch('/api/notifications')
      .then(r => r.json())
      .then(d => setNotifications(d.notifications ?? []))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  async function markRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
  }

  async function markAllRead() {
    setMarkingAll(true);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });
    setMarkingAll(false);
  }

  const unread = notifications.filter(n => !n.read).length;

  if (authLoading || loading) return (
    <div className="n-root"><TopBar />
      <div style={{ display: 'grid', placeItems: 'center', height: '60vh' }}>
        <span className="n-mono" style={{ color: 'var(--n-muted)' }}>Loading…</span>
      </div>
    </div>
  );

  return (
    <div className="n-root">
      <TopBar />
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px' }}>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6 }}>Inbox</div>
            <h1 className="n-display" style={{ fontSize: 40, margin: 0, letterSpacing: '-0.02em' }}>
              Notifications
              {unread > 0 && (
                <span className="n-chip" style={{ marginLeft: 12, verticalAlign: 'middle', background: 'var(--n-accent)', color: 'var(--n-accent-ink)', borderColor: 'transparent', fontSize: 13 }}>{unread}</span>
              )}
            </h1>
          </div>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              disabled={markingAll}
              className="n-btn ghost sm"
              style={{ marginTop: 8 }}
            >
              Mark all read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="n-card" style={{ padding: '60px 40px', textAlign: 'center' }}>
            <Icon name="chat" className="n-ico xl" style={{ color: 'var(--n-muted)', margin: '0 auto 16px', opacity: 0.4 }} />
            <div style={{ fontWeight: 500, marginBottom: 8 }}>All caught up</div>
            <div style={{ fontSize: 14, color: 'var(--n-muted)' }}>Notifications about your viewings, leases, and messages will appear here.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {notifications.map(n => {
              const content = (
                <div
                  key={n.id}
                  onClick={() => !n.read && markRead(n.id)}
                  className="n-card"
                  style={{
                    padding: 18,
                    display: 'flex',
                    gap: 14,
                    alignItems: 'flex-start',
                    cursor: n.read ? 'default' : 'pointer',
                    background: n.read ? undefined : 'color-mix(in oklab, var(--n-accent) 6%, var(--n-surface))',
                    borderColor: n.read ? undefined : 'var(--n-accent)',
                  }}
                >
                  <div style={{
                    width: 8, height: 8, borderRadius: 999, marginTop: 6, flexShrink: 0,
                    background: n.read ? 'var(--n-line)' : 'var(--n-accent)',
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: n.read ? 400 : 600, fontSize: 14, marginBottom: 2 }}>{n.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--n-muted)', lineHeight: 1.5 }}>{n.body}</div>
                    <div className="n-mono" style={{ color: 'var(--n-muted)', fontSize: 11, marginTop: 6 }}>{timeAgo(n.createdAt)}</div>
                  </div>
                  {n.link && <Icon name="chevronRight" className="n-ico" style={{ color: 'var(--n-muted)', flexShrink: 0, marginTop: 2 }} />}
                </div>
              );

              return n.link ? (
                <Link key={n.id} href={n.link} style={{ textDecoration: 'none', color: 'inherit' }} onClick={() => !n.read && markRead(n.id)}>
                  {content}
                </Link>
              ) : content;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
