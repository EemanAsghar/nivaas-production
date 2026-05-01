'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import TopBar from '@/components/ui/TopBar';
import Icon from '@/components/ui/Icon';
import TrustScore from '@/components/ui/TrustScore';

type Photo = { url: string; isCover: boolean };
type Listing = {
  id: string;
  title: string;
  city: string;
  locality: string;
  rentAmount: number;
  propertyType: string;
  rooms: number;
  bathrooms: number;
  photos: Photo[];
};
type LandlordProfile = {
  id: string;
  name: string | null;
  phone: string;
  verificationTier: string;
  photoUrl: string | null;
  createdAt: string;
  listings: Listing[];
};

const TIER_CHIP: Record<string, { label: string; color: string; bg: string }> = {
  VERIFIED: { label: 'NADRA Verified',    color: 'var(--n-accent-ink)', bg: 'var(--n-accent-soft)' },
  STANDARD: { label: 'CNIC Submitted',   color: 'var(--n-warn)',        bg: 'color-mix(in oklab, var(--n-warn) 18%, transparent)' },
  BASIC:    { label: 'Phone Verified',   color: 'var(--n-muted)',       bg: 'var(--n-surface-2)' },
};

function trustScore(l: LandlordProfile) {
  let s = 40;
  if (l.verificationTier === 'VERIFIED') s += 25;
  else if (l.verificationTier === 'STANDARD') s += 10;
  if (l.listings.length > 0) s += 10;
  if (l.listings.length >= 3) s += 5;
  return Math.min(s, 100);
}

export default function LandlordProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [landlord, setLandlord] = useState<LandlordProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/landlord/${id}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => setLandlord(d.landlord))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="n-root"><TopBar />
      <div style={{ display: 'grid', placeItems: 'center', height: '60vh' }}>
        <span className="n-mono" style={{ color: 'var(--n-muted)' }}>Loading…</span>
      </div>
    </div>
  );

  if (!landlord) return (
    <div className="n-root"><TopBar />
      <div style={{ display: 'grid', placeItems: 'center', height: '60vh' }}>
        <span style={{ color: 'var(--n-muted)' }}>Landlord not found.</span>
      </div>
    </div>
  );

  const displayName = landlord.name ?? landlord.phone;
  const tier = TIER_CHIP[landlord.verificationTier] ?? TIER_CHIP.BASIC;
  const score = trustScore(landlord);
  const since = new Date(landlord.createdAt).getFullYear();

  return (
    <div className="n-root">
      <TopBar />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>

        {/* Header card */}
        <div className="n-card" style={{ padding: 28, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 24 }}>
          {/* Avatar */}
          <div style={{
            width: 72, height: 72, borderRadius: 999, flexShrink: 0,
            background: landlord.photoUrl ? `url(${landlord.photoUrl}) center/cover` : 'var(--n-accent-soft)',
            color: 'var(--n-accent-ink)', display: 'grid', placeItems: 'center',
            fontSize: 28, fontWeight: 700,
          }}>
            {!landlord.photoUrl && displayName[0].toUpperCase()}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 className="n-display" style={{ fontSize: 32, margin: '0 0 6px', letterSpacing: '-0.02em' }}>{displayName}</h1>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span className="n-chip" style={{ background: tier.bg, color: tier.color, borderColor: 'transparent' }}>
                {landlord.verificationTier === 'VERIFIED' && <Icon name="shield" />} {tier.label}
              </span>
              <span className="n-mono" style={{ color: 'var(--n-muted)', fontSize: 12 }}>
                Landlord since {since} · {landlord.listings.length} active listing{landlord.listings.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Trust score */}
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <TrustScore value={score} size={56} />
            <div className="n-mono" style={{ color: 'var(--n-muted)', fontSize: 11, marginTop: 4 }}>Trust score</div>
          </div>
        </div>

        {/* Trust breakdown */}
        <div className="n-card" style={{ padding: 20, marginBottom: 24 }}>
          <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 12 }}>Verification</div>
          {[
            { label: 'Phone verified',          done: true },
            { label: 'CNIC submitted',           done: landlord.verificationTier !== 'BASIC' },
            { label: 'NADRA confirmed',          done: landlord.verificationTier === 'VERIFIED' },
            { label: 'Active listing published', done: landlord.listings.length > 0 },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 3 ? '1px solid var(--n-line)' : 'none' }}>
              <div style={{
                width: 20, height: 20, borderRadius: 999, flexShrink: 0,
                background: item.done ? 'color-mix(in oklab, #22c55e 20%, transparent)' : 'var(--n-surface-2)',
                display: 'grid', placeItems: 'center',
              }}>
                {item.done
                  ? <Icon name="check" style={{ color: '#16a34a', fontSize: 11 }} />
                  : <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--n-line-2)', display: 'block' }} />
                }
              </div>
              <span style={{ fontSize: 13, color: item.done ? 'var(--n-ink)' : 'var(--n-muted)' }}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Active listings */}
        <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 10 }}>Active listings</div>
        {landlord.listings.length === 0 ? (
          <div className="n-card" style={{ padding: 40, textAlign: 'center', color: 'var(--n-muted)' }}>
            No active listings at the moment.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {landlord.listings.map(l => {
              const cover = l.photos[0]?.url;
              return (
                <Link key={l.id} href={`/property/${l.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="n-card" style={{ overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.15s', }}>
                    <div style={{
                      height: 160,
                      background: cover ? `url(${cover}) center/cover` : 'var(--n-surface-2)',
                      display: cover ? undefined : 'grid', placeItems: cover ? undefined : 'center',
                    }}>
                      {!cover && <Icon name="camera" className="n-ico xl" style={{ color: 'var(--n-muted)' }} />}
                    </div>
                    <div style={{ padding: 14 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--n-muted)', marginBottom: 8 }}>{l.locality}, {l.city}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="n-display" style={{ fontSize: 18 }}>₨ {(l.rentAmount / 1000).toFixed(0)}k</span>
                        <span className="n-mono" style={{ fontSize: 11, color: 'var(--n-muted)' }}>{l.rooms} bed · {l.bathrooms} bath</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
