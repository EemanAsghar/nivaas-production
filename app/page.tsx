'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import TopBar from '@/components/ui/TopBar';
import OnboardingBanner from '@/components/ui/OnboardingBanner';
import Logo from '@/components/ui/Logo';
import Icon from '@/components/ui/Icon';
import TrustBadge from '@/components/ui/TrustBadge';
import { useAuth } from '@/components/auth/AuthProvider';
import { CITIES } from '@/lib/data';

type ApiListing = {
  id: string;
  title: string;
  locality: string;
  city: string;
  rentAmount: number;
  rooms: number;
  bathrooms: number;
  areaMarla?: number;
  areaSqft?: number;
  ownerVerified: boolean;
  isBoosted: boolean;
  createdAt: string;
  photos: { url: string; isCover: boolean }[];
  landlord: { name: string; verificationTier: string };
};

function badgesFor(l: ApiListing): string[] {
  const b: string[] = [];
  if (l.landlord.verificationTier === 'VERIFIED') b.push('nadra');
  if (l.ownerVerified) b.push('owner');
  if (l.isBoosted) b.push('boost');
  return b;
}

function areaStr(l: ApiListing) {
  if (l.areaMarla) return `${l.areaMarla} marla`;
  if (l.areaSqft) return `${l.areaSqft.toLocaleString()} sqft`;
  return '—';
}

export default function Home() {
  const { user } = useAuth();
  const [searchCity, setSearchCity] = useState('');
  const [maxRent, setMaxRent] = useState('');
  const [rooms, setRooms] = useState('');
  const [featured, setFeatured] = useState<ApiListing[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [cityCounts, setCityCounts] = useState<Record<string, number>>({});
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);

  function buildSearchUrl() {
    const p = new URLSearchParams();
    if (searchCity) p.set('city', searchCity);
    if (maxRent) p.set('maxRent', maxRent);
    if (rooms) p.set('rooms', rooms);
    const qs = p.toString();
    return qs ? `/search?${qs}` : '/search';
  }

  useEffect(() => {
    fetch('/api/listings/counts')
      .then(r => r.json())
      .then(d => setCityCounts(d.counts ?? {}))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch('/api/saved')
      .then(r => r.json())
      .then(d => setSavedIds(new Set((d.listings ?? []).map((l: { id: string }) => l.id))))
      .catch(() => {});
  }, [user]);

  async function toggleSave(e: React.MouseEvent, listingId: string) {
    e.preventDefault();
    if (!user || savingId === listingId) return;
    setSavingId(listingId);
    const isSaved = savedIds.has(listingId);
    setSavedIds(prev => { const n = new Set(prev); isSaved ? n.delete(listingId) : n.add(listingId); return n; });
    await fetch(`/api/listings/${listingId}/save`, { method: isSaved ? 'DELETE' : 'POST' }).catch(() => {
      setSavedIds(prev => { const n = new Set(prev); isSaved ? n.add(listingId) : n.delete(listingId); return n; });
    });
    setSavingId(null);
  }

  useEffect(() => {
    setFeaturedLoading(true);
    fetch('/api/listings?limit=6&sort=newest')
      .then(r => r.json())
      .then(d => setFeatured(d.listings ?? []))
      .catch(() => setFeatured([]))
      .finally(() => setFeaturedLoading(false));
  }, []);

  return (
    <div className="n-root">
      <TopBar />
      <OnboardingBanner />

      {/* ── Hero ── */}
      <div style={{
        background: 'var(--n-bg)',
        borderBottom: '1px solid var(--n-line)',
        padding: 'clamp(48px, 7vw, 88px) 40px clamp(40px, 5vw, 64px)',
        textAlign: 'center',
      }}>
        <div className="n-chip" style={{ marginBottom: 20, display: 'inline-flex' }}>
          <Icon name="shield" style={{ width: 12, height: 12 }} /> Punjab&apos;s verified rental marketplace
        </div>
        <h1 className="n-display" style={{
          fontSize: 'clamp(36px, 5.5vw, 72px)', lineHeight: 1.04, letterSpacing: '-0.03em',
          color: 'var(--n-ink)', margin: '0 auto 18px', maxWidth: 820,
        }}>
          Rent a home you can{' '}
          <em style={{ color: 'var(--n-accent)', fontStyle: 'italic' }}>actually trust</em>
        </h1>
        <p style={{ fontSize: 16, color: 'var(--n-muted)', maxWidth: 480, margin: '0 auto 36px', lineHeight: 1.65 }}>
          NADRA-verified landlords, owner-confirmed listings, and professional inspections — across six Punjab cities.
        </p>

        {/* Search bar — desktop */}
        <div className="n-hide-mobile" style={{
          maxWidth: 720, margin: '0 auto',
          background: 'var(--n-surface)',
          border: '1px solid var(--n-line)',
          borderRadius: 16, padding: 6,
          display: 'grid', gridTemplateColumns: '1.2fr 0.9fr 0.8fr auto', gap: 0,
          boxShadow: '0 4px 24px rgba(21,18,14,0.08)',
        }}>
          <div style={{ padding: '10px 18px', borderRight: '1px solid var(--n-line)' }}>
            <div style={{ fontSize: 10, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--n-muted-2)', marginBottom: 4 }}>City</div>
            <select value={searchCity} onChange={e => setSearchCity(e.target.value)}
              style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', color: 'var(--n-ink)', fontFamily: 'inherit', fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>
              <option value="">All cities</option>
              {CITIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ padding: '10px 18px', borderRight: '1px solid var(--n-line)' }}>
            <div style={{ fontSize: 10, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--n-muted-2)', marginBottom: 4 }}>Max rent</div>
            <select value={maxRent} onChange={e => setMaxRent(e.target.value)}
              style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', color: 'var(--n-ink)', fontFamily: 'inherit', fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>
              <option value="">Any budget</option>
              <option value="20000">Under ₨20k</option>
              <option value="40000">Under ₨40k</option>
              <option value="60000">Under ₨60k</option>
              <option value="80000">Under ₨80k</option>
              <option value="120000">Under ₨1.2L</option>
            </select>
          </div>
          <div style={{ padding: '10px 18px' }}>
            <div style={{ fontSize: 10, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--n-muted-2)', marginBottom: 4 }}>Bedrooms</div>
            <select value={rooms} onChange={e => setRooms(e.target.value)}
              style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', color: 'var(--n-ink)', fontFamily: 'inherit', fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>
              <option value="">Any</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>
          </div>
          <Link href={buildSearchUrl()} className="n-btn accent" style={{ height: 'auto', padding: '0 28px', margin: 0, justifyContent: 'center', borderRadius: 11, fontSize: 15 }}>
            <Icon name="search" /> Search
          </Link>
        </div>

        {/* Mobile search */}
        <Link href={buildSearchUrl()} className="n-btn accent n-show-mobile" style={{ display: 'none', justifyContent: 'center', height: 50, fontSize: 16, borderRadius: 14, margin: '0 auto', padding: '0 32px' }}>
          <Icon name="search" /> Search{searchCity ? ` in ${searchCity}` : ''}
        </Link>

        {/* Quick filter chips */}
        <div style={{ marginTop: 18, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { label: 'NADRA verified', q: '?verifiedOnly=true' },
            { label: 'Furnished', q: '?furnishing=Furnished' },
            { label: 'Under ₨30k', q: '?maxRent=30000' },
            { label: 'Family homes', q: '?type=House' },
            { label: 'Studios', q: '?type=Studio' },
          ].map(t => (
            <Link key={t.label} href={`/search${t.q}`} className="n-chip" style={{ cursor: 'pointer', fontSize: 13, height: 30, padding: '0 14px' }}>
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Featured listings ── */}
      <div style={{ padding: '40px 40px 48px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div className="n-mono" style={{ color: 'var(--n-muted)' }}>Latest listings</div>
            <h2 className="n-display" style={{ fontSize: 36, margin: '4px 0 0', letterSpacing: '-0.02em' }}>New this week.</h2>
          </div>
          <Link href="/search" className="n-btn ghost sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            Browse all <Icon name="arrow" />
          </Link>
        </div>

        {featuredLoading ? (
          <div className="n-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div key={i} className="n-card" style={{ height: 340, opacity: 0.35 }} />
            ))}
          </div>
        ) : featured.length === 0 ? (
          <div className="n-card" style={{ padding: 56, textAlign: 'center' }}>
            <Icon name="home" className="n-ico xl" style={{ color: 'var(--n-muted)', margin: '0 auto 14px', display: 'block' }} />
            <div style={{ color: 'var(--n-muted)', marginBottom: 20, fontSize: 15 }}>No listings yet — be the first.</div>
            <Link href="/list-property" className="n-btn primary sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon name="plus" /> List a property
            </Link>
          </div>
        ) : (
          <div className="n-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {featured.map(p => (
              <Link key={p.id} href={`/property/${p.id}`} className="n-card" style={{ overflow: 'hidden', padding: 0, display: 'block', textDecoration: 'none' }}>
                <div style={{ position: 'relative', height: 240, background: p.photos[0] ? `url(${p.photos[0].url}) center/cover` : 'var(--n-surface-2)' }}>
                  {!p.photos[0] && (
                    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
                      <Icon name="camera" className="n-ico xl" style={{ color: 'var(--n-muted)' }} />
                    </div>
                  )}
                  {p.photos[0] && (
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)' }} />
                  )}
                  <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 5 }}>
                    {badgesFor(p).includes('nadra') && <TrustBadge kind="nadra" size="sm" />}
                    {badgesFor(p).includes('boost') && <TrustBadge kind="boost" size="sm" />}
                  </div>
                  <button
                    onClick={e => toggleSave(e, p.id)}
                    style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 999, border: 'none', background: 'rgba(255,255,255,0.92)', display: 'grid', placeItems: 'center', cursor: 'pointer', color: savedIds.has(p.id) ? 'var(--n-danger)' : 'var(--n-muted)' }}
                  >
                    <Icon name="heart" />
                  </button>
                  {p.photos[0] && (
                    <div style={{ position: 'absolute', bottom: 14, left: 14 }}>
                      <span className="n-display" style={{ fontSize: 22, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>₨ {p.rentAmount.toLocaleString()}</span>
                      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginLeft: 4 }}>/mo</span>
                    </div>
                  )}
                </div>
                <div style={{ padding: '16px 18px' }}>
                  <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 4, lineHeight: 1.3 }}>{p.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--n-muted)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Icon name="pin" style={{ width: 12, height: 12 }} className="n-ico" />{p.locality}, {p.city}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: 'var(--n-muted)', fontSize: 13 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="bed" /> {p.rooms} bed</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="bath" /> {p.bathrooms} bath</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="square" /> {areaStr(p)}</span>
                    {!p.photos[0] && (
                      <span className="n-display" style={{ marginLeft: 'auto', fontSize: 20 }}>₨ {p.rentAmount.toLocaleString()}<span style={{ fontSize: 13, fontFamily: 'inherit', color: 'var(--n-muted)', fontWeight: 400 }}>/mo</span></span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Browse by city ── */}
      <div style={{ padding: '0 40px 48px', borderTop: '1px solid var(--n-line)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', margin: '40px 0 18px' }}>
          <div>
            <div className="n-mono" style={{ color: 'var(--n-muted)' }}>Browse by city</div>
            <h2 className="n-display" style={{ fontSize: 36, margin: '4px 0 0', letterSpacing: '-0.02em' }}>Six cities, fully covered.</h2>
          </div>
          <Link href="/search" style={{ fontSize: 14, color: 'var(--n-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            All listings <Icon name="arrow" />
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
          {CITIES.map(c => (
            <Link
              key={c.name}
              href={`/search?city=${encodeURIComponent(c.name)}`}
              className="n-card hoverable"
              style={{ padding: 0, overflow: 'hidden', display: 'block', textDecoration: 'none' }}
            >
              <div style={{ height: 100, background: `url(${c.hero}) center/cover`, position: 'relative' }}>
                <span className="n-chip" style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(21,18,14,0.7)', color: '#f6f3ee', border: 'none', backdropFilter: 'blur(6px)', fontSize: 11 }}>
                  Tier {c.tier}
                </span>
              </div>
              <div style={{ padding: '10px 12px 12px' }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{c.name}</div>
                <div className="n-mono" style={{ color: 'var(--n-muted)', marginTop: 3, fontSize: 10 }}>{(cityCounts[c.name] ?? 0).toLocaleString()} listings</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ padding: '28px 40px', color: 'var(--n-muted)', fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Logo size={16} />
          <span>© 2026 Nivaas · An Abstrak Digital product</span>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          <Link href="/terms" style={{ color: 'var(--n-muted)' }}>Terms</Link>
          <Link href="/privacy" style={{ color: 'var(--n-muted)' }}>Privacy</Link>
          <Link href="/how-it-works" style={{ color: 'var(--n-muted)' }}>Help</Link>
        </div>
      </div>
    </div>
  );
}
