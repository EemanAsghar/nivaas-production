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
  if (n >= 1000)   return `₨${Math.round(n / 1000)}k`;
  return `₨${n}`;
}

function ListingCard({ l }: { l: Listing }) {
  const cover = l.photos.find(p => p.isCover) ?? l.photos[0];
  const badges: BadgeKind[] = [];
  if (l.landlord.verificationTier === 'VERIFIED') badges.push('nadra');
  if (l.isBoosted) badges.push('boost');

  return (
    <Link href={`/property/${l.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div className="n-card" style={{ overflow: 'hidden', cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.18s, box-shadow 0.18s, border-color 0.18s' }}
        onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-3px)'; el.style.boxShadow = 'var(--n-shadow-lg)'; el.style.borderColor = 'var(--n-line-2)'; }}
        onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = ''; el.style.boxShadow = ''; el.style.borderColor = ''; }}
      >
        {/* Photo */}
        <div style={{ height: 210, background: 'var(--n-surface-2)', position: 'relative', flexShrink: 0 }}>
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover.url} alt={l.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div className="n-photo-fallback" style={{ width: '100%', height: '100%' }}>
              <Icon name="home" className="n-ico xl" />
            </div>
          )}
          {/* Overlay gradient */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,35,64,0.45) 0%, transparent 50%)' }} />
          {/* Badges */}
          <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 5 }}>
            {badges.map(b => <TrustBadge key={b} kind={b} />)}
            {l.isBoosted && <span style={{ background: 'var(--n-warn)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999, letterSpacing: '0.05em' }}>FEATURED</span>}
          </div>
          {/* Rent on photo */}
          <div style={{ position: 'absolute', bottom: 10, left: 12, fontWeight: 700, fontSize: 18, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,.5)' }}>
            {formatRent(l.rentAmount)}<span style={{ fontSize: 12, fontWeight: 400, opacity: 0.8 }}>/mo</span>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '14px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--n-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</div>
          <div style={{ fontSize: 13, color: 'var(--n-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="pin" style={{ width: 12, height: 12 }} />{l.locality}, {l.city}
          </div>
          <div style={{ display: 'flex', gap: 14, fontSize: 13, color: 'var(--n-muted)', marginTop: 6 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="bed" style={{ width: 13, height: 13 }} />{l.rooms} bed</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="bath" style={{ width: 13, height: 13 }} />{l.bathrooms} bath</span>
            {l.areaMarla && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="square" style={{ width: 13, height: 13 }} />{l.areaMarla} marla</span>}
            <span style={{ marginLeft: 'auto', background: 'var(--n-surface-2)', borderRadius: 999, padding: '1px 8px', fontSize: 11 }}>{l.furnishing}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="n-card" style={{ overflow: 'hidden' }}>
      <div className="n-skeleton" style={{ height: 210 }} />
      <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="n-skeleton" style={{ height: 16, width: '70%', borderRadius: 6 }} />
        <div className="n-skeleton" style={{ height: 13, width: '50%', borderRadius: 6 }} />
        <div className="n-skeleton" style={{ height: 13, width: '60%', borderRadius: 6 }} />
      </div>
    </div>
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

      {/* ── Hero ─────────────────────────────────────────── */}
      <section style={{ background: 'var(--n-bg)', padding: 'clamp(64px, 10vw, 96px) clamp(16px, 5vw, 40px) clamp(56px, 8vw, 80px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Background glow */}
        <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', width: 800, height: 600, background: 'radial-gradient(ellipse, rgba(18,166,140,0.09) 0%, transparent 65%)', pointerEvents: 'none', userSelect: 'none' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(to right, transparent, rgba(18,166,140,0.3), transparent)' }} />

        <div style={{ position: 'relative', maxWidth: 720, margin: '0 auto' }}>
          <p className="n-mono" style={{ color: 'var(--n-accent)', marginBottom: 16, letterSpacing: '0.1em', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--n-accent)' }} />
            Pakistan&apos;s Verified Rental Marketplace
          </p>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(38px, 7vw, 72px)', lineHeight: 1.05, letterSpacing: '-0.025em', color: 'var(--n-ink)', margin: '0 0 20px' }}>
            Find your next home,{' '}
            <em style={{ color: 'var(--n-accent)', fontStyle: 'italic' }}>verified.</em>
          </h1>
          <p style={{ color: 'var(--n-muted)', fontSize: 'clamp(15px, 2.5vw, 17px)', maxWidth: 500, margin: '0 auto 40px', lineHeight: 1.7 }}>
            NADRA-verified landlords, physical inspections, digital leases — zero middlemen, across Punjab.
          </p>

          {/* Search bar */}
          <div style={{ display: 'flex', maxWidth: 520, margin: '0 auto 20px', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--n-line-2)', background: 'var(--n-surface)', boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 16, color: 'var(--n-muted)', flexShrink: 0 }}>
              <Icon name="pin" />
            </div>
            <select
              value={city}
              onChange={e => setCity(e.target.value)}
              style={{ flex: 1, padding: '14px 12px', background: 'transparent', border: 'none', color: city ? 'var(--n-ink)' : 'var(--n-muted)', fontFamily: 'inherit', fontSize: 15, outline: 'none', cursor: 'pointer' }}
            >
              <option value="">All cities in Punjab</option>
              {CITIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
            <button onClick={handleSearch} className="n-btn accent" style={{ borderRadius: 0, height: 'auto', padding: '0 24px', fontSize: 15, borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
              <Icon name="search" /> Search
            </button>
          </div>

          {/* Quick pills */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { label: 'Furnished',   qs: 'furnishing=Furnished' },
              { label: 'Under ₨40k', qs: 'maxRent=40000' },
              { label: 'Sialkot',    qs: 'city=Sialkot' },
              { label: 'Gujranwala', qs: 'city=Gujranwala' },
              { label: 'Sargodha',   qs: 'city=Sargodha' },
            ].map(q => (
              <button
                key={q.label}
                onClick={() => router.push(`/search?${q.qs}`)}

                style={{ padding: '6px 14px', borderRadius: 999, border: '1px solid var(--n-line-2)', background: 'var(--n-surface-2)', color: 'var(--n-muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color 0.15s, color 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--n-ink)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--n-accent)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = ''; (e.currentTarget as HTMLButtonElement).style.borderColor = ''; }}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust strip ──────────────────────────────────── */}
      <div style={{ borderTop: '1px solid var(--n-line)', borderBottom: '1px solid var(--n-line)', background: 'var(--n-surface)', padding: '18px clamp(16px, 5vw, 40px)' }}>
        <div style={{ maxWidth: 920, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 'clamp(20px, 5vw, 52px)', flexWrap: 'wrap' }}>
          {[
            { icon: 'shield', label: 'NADRA-verified landlords' },
            { icon: 'stamp',  label: 'Physical inspections' },
            { icon: 'user',   label: 'Zero middlemen' },
            { icon: 'file',   label: 'Digital lease agreements' },
          ].map(({ icon, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--n-muted)', fontSize: 13, fontWeight: 500 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--n-accent-soft)', display: 'grid', placeItems: 'center' }}>
                <Icon name={icon as Parameters<typeof Icon>[0]['name']} style={{ color: 'var(--n-accent)', width: 15, height: 15 }} />
              </div>
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Featured listings ─────────────────────────────── */}
      <section style={{ maxWidth: 1120, margin: '0 auto', padding: 'clamp(48px, 6vw, 72px) clamp(16px, 5vw, 40px)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32, gap: 16, flexWrap: 'wrap' }}>
          <div>
            <p className="n-mono" style={{ color: 'var(--n-accent)', marginBottom: 6 }}>Live listings</p>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(26px, 4vw, 40px)', color: 'var(--n-ink)', margin: 0 }}>Featured properties</h2>
            <p style={{ color: 'var(--n-muted)', fontSize: 14, marginTop: 6 }}>Hand-picked verified rentals available now</p>
          </div>
          <Link href="/search" className="n-btn ghost sm" style={{ flexShrink: 0 }}>View all listings →</Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 18 }}>
          {loading
            ? [1,2,3].map(i => <SkeletonCard key={i} />)
            : listings.length === 0
              ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '64px 0', color: 'var(--n-muted)' }}>
                  <Icon name="home" className="n-ico xl" style={{ display: 'block', margin: '0 auto 12px', opacity: 0.4 }} />
                  <p style={{ fontSize: 15 }}>No listings yet — check back soon.</p>
                </div>
              )
              : listings.map(l => <ListingCard key={l.id} l={l} />)
          }
        </div>
      </section>

      {/* ── Browse by city ────────────────────────────────── */}
      <section style={{ background: 'var(--n-surface)', borderTop: '1px solid var(--n-line)', padding: 'clamp(48px, 6vw, 72px) clamp(16px, 5vw, 40px)' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ marginBottom: 32 }}>
            <p className="n-mono" style={{ color: 'var(--n-accent)', marginBottom: 6 }}>Our cities</p>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(26px, 4vw, 40px)', color: 'var(--n-ink)', margin: '0 0 6px' }}>Browse by city</h2>
            <p style={{ color: 'var(--n-muted)', fontSize: 14 }}>Live across 6 cities in Punjab</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 170px), 1fr))', gap: 12 }}>
            {CITIES.map(c => (
              <Link key={c.name} href={`/search?city=${encodeURIComponent(c.name)}`} style={{ textDecoration: 'none' }}>
                <div className="n-card" style={{ overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.18s, box-shadow 0.18s, border-color 0.18s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-3px)'; el.style.boxShadow = 'var(--n-shadow-lg)'; el.style.borderColor = 'var(--n-line-2)'; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = ''; el.style.boxShadow = ''; el.style.borderColor = ''; }}
                >
                  <div style={{ height: 88, backgroundImage: `url(${c.hero})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(9,24,42,0.75) 0%, rgba(9,24,42,0.1) 60%)' }} />
                  </div>
                  <div style={{ padding: '10px 14px', fontWeight: 600, fontSize: 14, color: 'var(--n-ink)' }}>{c.name}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section style={{ padding: 'clamp(48px, 6vw, 72px) clamp(16px, 5vw, 40px)', background: 'var(--n-bg)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <p className="n-mono" style={{ color: 'var(--n-accent)', marginBottom: 6 }}>Simple process</p>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(26px, 4vw, 40px)', margin: '0 0 40px' }}>Rent with confidence</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
            {[
              { step: '01', icon: 'search', title: 'Browse listings',   desc: 'Search verified properties across Punjab with filters for city, rent, and size.' },
              { step: '02', icon: 'shield', title: 'Verify the landlord', desc: 'Every landlord is NADRA-verified. See their identity confirmation before you reach out.' },
              { step: '03', icon: 'stamp',  title: 'Get an inspection',  desc: 'Book a physical utility inspection before moving in. Gas, water, electrical — all checked.' },
              { step: '04', icon: 'file',   title: 'Sign digitally',     desc: 'Sign your lease agreement online. Both parties get a legally documented PDF.' },
            ].map(s => (
              <div key={s.step} className="n-card" style={{ padding: '24px 20px', textAlign: 'left', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 16, right: 16, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--n-line-2)', letterSpacing: '0.05em' }}>{s.step}</div>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--n-accent-soft)', display: 'grid', placeItems: 'center', marginBottom: 14 }}>
                  <Icon name={s.icon as Parameters<typeof Icon>[0]['name']} style={{ color: 'var(--n-accent)', width: 18, height: 18 }} />
                </div>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8, color: 'var(--n-ink)' }}>{s.title}</div>
                <div style={{ fontSize: 13, color: 'var(--n-muted)', lineHeight: 1.65 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section style={{ borderTop: '1px solid var(--n-line)', background: 'var(--n-surface)', padding: 'clamp(56px, 8vw, 88px) clamp(16px, 5vw, 40px)', textAlign: 'center' }}>
        <p className="n-mono" style={{ color: 'var(--n-accent)', marginBottom: 12 }}>For landlords</p>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(28px, 4.5vw, 48px)', color: 'var(--n-ink)', marginBottom: 14, maxWidth: 560, margin: '0 auto 14px' }}>
          Own a property?{' '}
          <em style={{ color: 'var(--n-accent)', fontStyle: 'italic' }}>List it free.</em>
        </h2>
        <p style={{ color: 'var(--n-muted)', maxWidth: 420, margin: '0 auto 32px', fontSize: 16, lineHeight: 1.65 }}>
          Reach verified tenants across Punjab. No upfront fees — pay only when a deal closes.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/list-property" className="n-btn accent lg">
            <Icon name="plus" /> List your property
          </Link>
          <Link href="/how-it-works" className="n-btn ghost lg">
            Learn how it works
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--n-line)', padding: '28px clamp(16px, 5vw, 40px)', background: 'var(--n-bg-2)' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <span style={{ fontFamily: 'var(--mono)', color: 'var(--n-muted)', fontSize: 11, letterSpacing: '0.05em' }}>© 2026 RENT KAR GHAR</span>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {[['About', '/about'], ['How it works', '/how-it-works'], ['Contact', '/contact'], ['Privacy', '/privacy'], ['Terms', '/terms']].map(([label, href]) => (
              <Link key={href} href={href} style={{ color: 'var(--n-muted)', fontSize: 13 }}>{label}</Link>
            ))}
          </div>
        </div>
      </footer>
    </>
  );
}
