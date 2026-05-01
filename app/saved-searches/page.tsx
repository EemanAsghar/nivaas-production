'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import TopBar from '@/components/ui/TopBar';
import Icon from '@/components/ui/Icon';
import { useAuth } from '@/components/auth/AuthProvider';

interface SavedSearch {
  id: string;
  city: string;
  maxRent: number | null;
  minRooms: number | null;
  propType: string | null;
  label: string | null;
  createdAt: string;
}

function buildSearchUrl(s: SavedSearch) {
  const p: Record<string, string> = { city: s.city };
  if (s.maxRent) p.maxRent = String(s.maxRent);
  if (s.minRooms) p.rooms = String(s.minRooms);
  if (s.propType) p.type = s.propType;
  return '/search?' + new URLSearchParams(p).toString();
}

function describeSearch(s: SavedSearch) {
  const parts: string[] = [s.city];
  if (s.propType) parts.push(s.propType);
  if (s.minRooms) parts.push(`${s.minRooms}+ beds`);
  if (s.maxRent) parts.push(`under ₨${(s.maxRent / 1000).toFixed(0)}k`);
  return parts.join(' · ');
}

export default function SavedSearchesPage() {
  const { user, loading: authLoading } = useAuth();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch('/api/saved-searches')
      .then(r => r.json())
      .then(d => setSearches(d.searches ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  async function deleteSearch(id: string) {
    if (deletingId) return;
    setDeletingId(id);
    setSearches(prev => prev.filter(s => s.id !== id));
    await fetch('/api/saved-searches', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }).catch(() => {
      fetch('/api/saved-searches').then(r => r.json()).then(d => setSearches(d.searches ?? []));
    });
    setDeletingId(null);
  }

  if (!authLoading && !user) {
    return (
      <div className="n-root">
        <TopBar />
        <div style={{ textAlign: 'center', padding: '80px 40px', color: 'var(--n-muted)' }}>
          <Icon name="search" className="n-ico xl" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--n-ink)', marginBottom: 8 }}>Sign in to view saved searches</div>
          <div style={{ fontSize: 14, marginBottom: 24 }}>Save your search filters and get notified when new listings match.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="n-root">
      <TopBar />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 className="n-display" style={{ fontSize: 36, marginBottom: 6 }}>Saved searches</h1>
            <div style={{ fontSize: 14, color: 'var(--n-muted)' }}>Get notified when new listings match your filters.</div>
          </div>
          <Link href="/search" className="n-btn primary sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="search" /> New search
          </Link>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gap: 10 }}>
            {[0, 1, 2].map(i => <div key={i} className="n-card" style={{ height: 80, opacity: 0.4 }} />)}
          </div>
        ) : searches.length === 0 ? (
          <div className="n-card" style={{ padding: '48px 32px', textAlign: 'center' }}>
            <Icon name="search" className="n-ico xl" style={{ color: 'var(--n-muted)', margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 500, marginBottom: 8 }}>No saved searches yet</div>
            <div style={{ fontSize: 14, color: 'var(--n-muted)', marginBottom: 20 }}>Save a search from the listings page to get alerts.</div>
            <Link href="/search" className="n-btn primary sm">Browse listings</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {searches.map(s => (
              <div key={s.id} className="n-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--n-accent-soft)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Icon name="pin" style={{ color: 'var(--n-accent-ink)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 2 }}>{s.label ?? s.city}</div>
                  <div className="n-mono" style={{ color: 'var(--n-muted)' }}>{describeSearch(s)}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <Link href={buildSearchUrl(s)} className="n-btn ghost sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    View <Icon name="arrow" />
                  </Link>
                  <button
                    onClick={() => deleteSearch(s.id)}
                    disabled={deletingId === s.id}
                    className="n-btn ghost sm"
                    style={{ color: 'var(--n-danger)', borderColor: 'transparent', padding: '0 10px' }}
                  >
                    <Icon name="close" />
                  </button>
                </div>
              </div>
            ))}
            <div className="n-mono" style={{ color: 'var(--n-muted)', textAlign: 'right', marginTop: 4 }}>
              {searches.length}/10 saved
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
