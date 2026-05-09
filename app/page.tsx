'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/ui/TopBar';
import TrustBadge from '@/components/ui/TrustBadge';
import Icon from '@/components/ui/Icon';
import { CITIES } from '@/lib/data';
import type { BadgeKind } from '@/lib/data';

interface Listing {
  id: string;
  title: string;
  city: string;
  locality: string;
  rentAmount: number;
  rooms: number;
  bathrooms: number;
  areaMarla: number | null;
  areaSqft: number | null;
  propertyType: string;
  furnishing: string;
  isBoosted: boolean;
  ownerVerified: boolean;
  photos: { url: string; isCover: boolean }[];
  landlord: { name: string | null; verificationTier: string };
}

function formatRent(n: number) {
  if (n >= 100000) return `₨${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`;
  if (n >= 1000) return `₨${(n / 1000).toFixed(0)}k`;
  return `₨${n}`;
}

function ListingCard({ l }: { l: Listing }) {
  const cover = l.photos.find(p => p.isCover) ?? l.photos[0];
  const badges: BadgeKind[] = [];
  if (l.ownerVerified) badges.push('nadra');
  if (l.isBoosted) badges.push('boost');

  return (
    <Link href={`/property/${l.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="n-card" style={{ overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
      >
        {/* Photo */}
        <div style={{ height: 200, background: 'var(--n-surface-2)', position: 'relative', margin: '-1px -1px 0' }}>
          {cover ? (
            <img src={cover.url} alt={l.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: 'var(--n-muted)' }}>
              <Icon name="home" className="n-ico lg" />
            </div>
          )}
          {l.isBoosted && (
            <span style={{ position: 'absolute', top: 10, left: 10, background: 'var(--n-warn)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999, letterSpacing: '0.04em' }}>FEATURED</span>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '14px 16px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
            <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--n-accent)' }}>{formatRent(l.rentAmount)}<span style={{ fontSize: 12, color: 'var(--n-muted)', fontWeight: 400 }}>/mo</span></div>
            <span style={{ fontSize: 12, color: 'var(--n-muted)', background: 'var(--n-surface-2)', padding: '2px 8px', borderRadius: 999 }}>{l.propertyType}</span>
          </div>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, color: 'var(--n-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.title}</div>
          <div style={{ fontSize: 13, color: 'var(--n-muted)', marginBottom: 10 }}>{l.locality}, {l.city}</div>
          <div style={{ display: 'flex', gap: 12, fontSize: 13, color: 'var(--n-muted)', marginBottom: 10 }}>
            <span><b style={{ color: 'var(--n-ink)' }}>{l.rooms}</b> bed</span>
            <span><b style={{ color: 'var(--n-ink)' }}>{l.bathrooms}</b> bath</span>
            {l.areaMarla && <span><b style={{ color: 'var(--n-ink)' }}>{l.areaMarla}</b> marla</span>}
            {l.areaSqft && !l.areaMarla && <span><b style={{ color: 'var(--n-ink)' }}>{l.areaSqft}</b> sqft</span>}
            <span style={{ marginLeft: 'auto', color: 'var(--n-muted)', fontStyle: 'italic' }}>{l.furnishing}</span>
          </div>
          {badges.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {badges.map(b => <TrustBadge key={b} kind={b} />)}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [city, setCity] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/listings?limit=6&sort=boosted')
      .then(r => r.json())
      .then(d => setListings(d.listings ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleSearch() {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <>
      <TopBar />

      {/* ── Hero ── */}
      <section style={{ background: 'var(--n-bg)', padding: '80px 24px 72px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* glow */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -60%)', width: 700, height: 500, background: 'radial-gradient(circle, rgba(18,166,140,0.10) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <p className="n-mono" style={{ color: 'var(--n-accent)', marginBottom: 12, fontSize: 13, letterSpacing: '0.08em' }}>PAKISTAN&apos;S VERIFIED RENTAL MARKETPLACE</p>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(40px, 7vw, 72px)', lineHeight: 1.05, letterSpacing: '-0.02em', color: 'var(--n-ink)', margin: '0 auto 20px', maxWidth: 700 }}>
          Find your next home,<br /><em style={{ color: 'var(--n-accent)', fontStyle: 'italic' }}>verified.</em>
        </h1>
        <p style={{ color: 'var(--n-muted)', fontSize: 17, maxWidth: 480, margin: '0 auto 40px', lineHeight: 1.65 }}>
          NADRA-verified landlords, real inspections, zero middlemen — across Punjab.
        </p>

        {/* Search bar */}
        <div style={{ display: 'flex', gap: 0, maxWidth: 540, margin: '0 auto', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--n-line)', background: 'var(--n-surface)' }}>
          <select
            value={city}
            onChange={e => setCity(e.target.value)}
            style={{ flex: 1, padding: '14px 16px', background: 'transparent', border: 'none', color: city ? 'var(--n-ink)' : 'var(--n-muted)', fontFamily: 'inherit', fontSize: 15, outline: 'none', cursor: 'pointer' }}
          >
            <option value="">All cities</option>
            {CITIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
          <button
            onClick={handleSearch}
            className="n-btn accent"
            style={{ borderRadius: 0, padding: '14px 28px', fontSize: 15, gap: 8 }}
          >
            <Icon name="search" className="n-ico" /> Search
          </button>
        </div>

        {/* Quick links */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
          {['Furnished', 'Under ₨40k', 'Sialkot', 'Lahore', 'Gujranwala'].map(q => (
            <button
              key={q}
              onClick={() => {
                const params = new URLSearchParams();
                if (q === 'Furnished') params.set('furnishing', 'Furnished');
                else if (q.startsWith('Under')) params.set('maxRent', '40000');
                else params.set('city', q);
                router.push(`/search?${params.toString()}`);
              }}
              style={{ padding: '6px 14px', borderRadius: 999, border: '1px solid var(--n-line)', background: 'var(--n-surface)', color: 'var(--n-muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {q}
            </button>
          ))}
        </div>
      </section>

      {/* ── Trust strip ── */}
      <div style={{ borderTop: '1px solid var(--n-line)', borderBottom: '1px solid var(--n-line)', background: 'var(--n-surface)', padding: '20px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 48, flexWrap: 'wrap' }}>
          {[
            { icon: 'shield', label: 'NADRA-verified landlords' },
            { icon: 'stamp', label: 'Physical inspections' },
            { icon: 'user', label: 'Zero middlemen' },
            { icon: 'file', label: 'Digital lease agreements' },
          ].map(({ icon, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--n-muted)', fontSize: 14 }}>
              <Icon name={icon as Parameters<typeof Icon>[0]['name']} className="n-ico" style={{ color: 'var(--n-accent)' }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Featured listings ── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(26px, 4vw, 38px)', color: 'var(--n-ink)', margin: 0 }}>Featured listings</h2>
            <p style={{ color: 'var(--n-muted)', fontSize: 14, marginTop: 4 }}>Verified properties available now</p>
          </div>
          <Link href="/search" className="n-btn ghost sm" style={{ flexShrink: 0 }}>View all →</Link>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="n-card" style={{ height: 340, background: 'var(--n-surface-2)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--n-muted)' }}>
            <Icon name="home" className="n-ico lg" style={{ marginBottom: 12 }} />
            <p>No listings yet — check back soon.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {listings.map(l => <ListingCard key={l.id} l={l} />)}
          </div>
        )}
      </section>

      {/* ── City grid ── */}
      <section style={{ background: 'var(--n-surface)', borderTop: '1px solid var(--n-line)', padding: '64px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(26px, 4vw, 38px)', color: 'var(--n-ink)', marginBottom: 8 }}>Browse by city</h2>
          <p style={{ color: 'var(--n-muted)', fontSize: 14, marginBottom: 32 }}>We&apos;re live across Punjab</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
            {CITIES.map(c => (
              <Link key={c.name} href={`/search?city=${encodeURIComponent(c.name)}`} style={{ textDecoration: 'none' }}>
                <div className="n-card" style={{ overflow: 'hidden', cursor: 'pointer', padding: 0, transition: 'transform 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
                >
                  <div style={{ height: 90, backgroundImage: `url(${c.hero})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,35,64,0.8) 0%, transparent 60%)' }} />
                  </div>
                  <div style={{ padding: '10px 14px', fontWeight: 600, fontSize: 14, color: 'var(--n-ink)' }}>{c.name}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ textAlign: 'center', padding: '80px 24px', background: 'var(--n-bg)' }}>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(28px, 4vw, 44px)', color: 'var(--n-ink)', marginBottom: 12 }}>
          Own a property? <em style={{ color: 'var(--n-accent)', fontStyle: 'italic' }}>List it free.</em>
        </h2>
        <p style={{ color: 'var(--n-muted)', maxWidth: 440, margin: '0 auto 32px', fontSize: 16, lineHeight: 1.65 }}>
          Reach verified tenants across Punjab. Your listing goes live in minutes.
        </p>
        <Link href="/list-property" className="n-btn accent" style={{ padding: '14px 32px', fontSize: 16 }}>
          List your property →
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid var(--n-line)', padding: '32px 24px', background: 'var(--n-surface)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <span className="n-mono" style={{ color: 'var(--n-muted)', fontSize: 13 }}>© 2026 Rent Kar Ghar</span>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {[['About', '/about'], ['How it works', '/how-it-works'], ['Contact', '/contact'], ['Privacy', '/privacy'], ['Terms', '/terms']].map(([label, href]) => (
              <Link key={href} href={href} style={{ color: 'var(--n-muted)', fontSize: 13, textDecoration: 'none' }}>{label}</Link>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  );
}
