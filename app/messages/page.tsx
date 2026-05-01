'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TopBar from '@/components/ui/TopBar';
import Icon from '@/components/ui/Icon';
import { useAuth } from '@/components/auth/AuthProvider';

type Message = { id: string; body: string; createdAt: string; senderId: string };
type Participant = { user: { id: string; name?: string; phone: string } };
type Conversation = {
  id: string;
  updatedAt: string;
  listing: { id: string; title: string; city: string; rentAmount: number };
  participants: Participant[];
  messages: Message[];
};

function timeAgo(date: string) {
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export default function MessagesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user && !authLoading) { router.push('/'); return; }
    if (!user) return;
    const load = () =>
      fetch('/api/conversations')
        .then(r => r.json())
        .then(d => setConversations(d.conversations ?? []))
        .finally(() => setLoading(false));
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, [user, authLoading, router]);

  if (authLoading || (!user && !authLoading)) return null;

  return (
    <div className="n-root">
      <TopBar />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 40px' }}>
        <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6 }}>Inbox</div>
        <h1 className="n-display" style={{ fontSize: 44, margin: '0 0 28px', letterSpacing: '-0.02em' }}>Messages</h1>

        {loading ? (
          <div style={{ display: 'grid', gap: 8 }}>
            {[0, 1, 2].map(i => (
              <div key={i} className="n-card" style={{ height: 80, opacity: 0.4 }} />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="n-card" style={{ padding: 48, textAlign: 'center' }}>
            <Icon name="chat" className="n-ico xl" style={{ color: 'var(--n-muted)', margin: '0 auto 12px' }} />
            <div style={{ color: 'var(--n-muted)', marginBottom: 16 }}>No conversations yet.</div>
            <Link href="/search" className="n-btn primary sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon name="search" /> Browse listings
            </Link>
          </div>
        ) : (
          <div className="n-card" style={{ padding: 0, overflow: 'hidden' }}>
            {conversations.map((conv, i) => {
              const other = conv.participants.find(p => p.user.id !== user?.id);
              const otherName = other?.user.name ?? other?.user.phone ?? 'Unknown';
              const lastMsg = conv.messages[0];

              return (
                <Link
                  key={conv.id}
                  href={`/messages/${conv.id}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '16px 20px',
                    borderTop: i === 0 ? 'none' : '1px solid var(--n-line)',
                    textDecoration: 'none', color: 'var(--n-ink)',
                    background: 'var(--n-surface)',
                    transition: 'background .15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--n-surface-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--n-surface)')}
                >
                  {/* Avatar */}
                  <div style={{ width: 44, height: 44, borderRadius: 999, background: 'var(--n-accent-soft)', color: 'var(--n-accent-ink)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                    {otherName[0]?.toUpperCase()}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{otherName}</div>
                      {lastMsg && <div className="n-mono" style={{ color: 'var(--n-muted)', fontSize: 11, flexShrink: 0 }}>{timeAgo(lastMsg.createdAt)}</div>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--n-accent)', marginTop: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                      {conv.listing.title} · ₨ {conv.listing.rentAmount.toLocaleString()}/mo
                    </div>
                    {lastMsg && (
                      <div style={{ fontSize: 13, color: 'var(--n-muted)', marginTop: 3, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                        {lastMsg.senderId === user?.id ? 'You: ' : ''}{lastMsg.body}
                      </div>
                    )}
                  </div>

                  <Icon name="chevronRight" className="n-ico" style={{ color: 'var(--n-muted)', flexShrink: 0 }} />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
