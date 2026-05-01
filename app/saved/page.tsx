'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TopBar from '@/components/ui/TopBar';
import Icon from '@/components/ui/Icon';
import TrustBadge from '@/components/ui/TrustBadge';
import TrustScore from '@/components/ui/TrustScore';
import type { BadgeKind } from '@/lib/data';
import { useAuth } from '@/components/auth/AuthProvider';

type SavedListing = {
  id: string;
  title: string;
  locality: string;
  city: string;
  rentAmount: number;
  rooms: number;
  bathrooms: number;
  areaMarla: number | null;
  areaSqft: number | null;
  propertyType: string;
  furnishing: string;
  isBoosted: boolean;
  ownerVerified: boolean;
  createdAt: string;
  savedAt: string;
  photos: { url: string; isCover: boolean }[];
  landlord: { id: string; name: string | null; verificationTier: string };
  _count: { conversations: number };
};

function trustScore(l: SavedListing) {
  let score = 40;
  if (l.landlord.verificationTier === 'VERIFIED') score += 25;
  else if (l.landlord.verificationTier === 'STANDARD') score += 10;
  if (l.ownerVerified) score += 20;
  if (l.photos.length >= 3) score += 5;
  if (l.isBoosted) score += 5;
  return Math.min(score, 95);
}

function badges(l: SavedListing): BadgeKind[] {
  const b: BadgeKind[] = [];
  if (l.landlord.verificationTier === 'VERIFIED') b.push('nadra');
  if (l.ownerVerified) b.push('owner');
  if (l.isBoosted) b.push('boost');
  return b;
}

function areaStr(l: SavedListing) {
  if (l.areaMarla) return `${l.areaMarla} marla`;
  if (l.areaSqft) return `${l.areaSqft.toLocaleString()} sqft`;
  return null;
}

function daysAgo(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

export default function SavedPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [listings, setListings] = useState<SavedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  async function load() {
    const res = await fetch('/api/saved');
    if (res.status === 401) { router.push('/'); return; }
    const data = await res.json();
    setListings(data.saved ?? []);
  }

  useEffect(() => {
    if (!user && !authLoading) { router.push('/'); return; }
    if (!user) return;
    load().finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  async function unsave(id: string) {
    setRemoving(id);
    await fetch(`/api/listings/${id}/save`, { method: 'DELETE' });
    setListings(prev => prev.filter(l => l.id !== id));
    setRemoving(null);
  }

  if (authLoading || (!user && !authLoading)) return null;

  return (
    <div className="n-root">
      <TopBar />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6 }}>My list</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
          <h1 className="n-display" style={{ fontSize: 44, margin: 0, letterSpacing: '-0.02em' }}>Saved listings</h1>
          {!loading && listings.length > 0 && (
            <span className="n-mono" style={{ color: 'var(--n-muted)', paddingBottom: 6 }}>{listings.length} saved</span>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'grid', gap: 12 }}>
            {[0, 1, 2].map(i => (
              <div key={i} className="n-card" style={{ height: 140, opacity: 0.4, background: 'var(--n-surface-2)' }} />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--n-muted)' }}>
            <Icon name="home" className="n-ico xl" style={{ margin: '0 auto 16px', opacity: 0.4 }} />
            <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>No saved listings yet</div>
            <div style={{ fontSize: 14, marginBottom: 24 }}>
              Tap the bookmark on any listing to save it here for later.
            </div>
            <Link href="/search" className="n-btn primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon name="pin" /> Browse listings
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {listings.map(l => {
              const cover = l.photos[0]?.url;
              const area = areaStr(l);
              const score = trustScore(l);
              const bs = badges(l);
              const saved = daysAgo(l.savedAt);

              return (
                <div key={l.id} className="n-card" style={{ display: 'flex', gap: 0, overflow: 'hidden' }}>
                  {/* Photo */}
                  <Link href={`/property/${l.id}`} style={{ flexShrink: 0, display: 'block' }}>
                    <div style={{
                      width: 200, height: 140,
                      background: cover ? `url(${cover}) center/cover` : 'var(--n-surface-2)',
                      display: cover ? undefined : 'grid', placeItems: cover ? undefined : 'center',
                    }}>
                      {!cover && <Icon name="camera" style={{ color: 'var(--n-muted)' }} />}
                    </div>
                  </Link>

                  {/* Info */}
                  <div style={{ flex: 1, padding: '18px 20px', display: 'flex', gap: 16 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        {bs.map(b => <TrustBadge key={b} kind={b} size="sm" />)}
                        {l.isBoosted && <span className="n-chip" style={{ background: 'var(--n-accent-soft)', color: 'var(--n-accent-ink)', borderColor: 'transparent', fontSize: 11 }}>Featured</span>}
                      </div>
                      <Link href={`/property/${l.id}`} style={{ color: 'var(--n-ink)', textDecoration: 'none' }}>
                        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</div>
                      </Link>
                      <div style={{ fontSize: 13, color: 'var(--n-muted)', marginBottom: 10 }}>
                        {l.locality}, {l.city}
                      </div>
                      <div className="n-mono" style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--n-muted)', flexWrap: 'wrap' }}>
                        <span>{l.rooms} bed · {l.bathrooms} bath</span>
                        {area && <span>{area}</span>}
                        <span style={{ textTransform: 'capitalize' }}>{l.furnishing.toLowerCase()}</span>
                      </div>
                    </div>

                    {/* Right: price + actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', flexShrink: 0 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div className="n-display" style={{ fontSize: 22, letterSpacing: '-0.02em' }}>
                          ₨ {l.rentAmount.toLocaleString()}
                        </div>
                        <div className="n-mono" style={{ fontSize: 11, color: 'var(--n-muted)' }}>/month</div>
                        <div style={{ marginTop: 6 }}>
                          <TrustScore value={score} size={32} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                        <div className="n-mono" style={{ fontSize: 11, color: 'var(--n-muted)' }}>
                          Saved {saved === 0 ? 'today' : `${saved}d ago`}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => unsave(l.id)}
                            disabled={removing === l.id}
                            className="n-btn ghost sm"
                            style={{ color: 'var(--n-danger)', display: 'flex', alignItems: 'center', gap: 4 }}
                          >
                            <Icon name="close" />
                            {removing === l.id ? 'Removing…' : 'Remove'}
                          </button>
                          <Link href={`/property/${l.id}`} className="n-btn primary sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Icon name="arrow" /> View
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
