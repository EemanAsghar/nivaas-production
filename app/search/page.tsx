'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import TopBar from '@/components/ui/TopBar';
import OnboardingBanner from '@/components/ui/OnboardingBanner';
import Icon from '@/components/ui/Icon';
import TrustBadge from '@/components/ui/TrustBadge';
import { useAuth } from '@/components/auth/AuthProvider';
import type { BadgeKind } from '@/lib/data';
import { CITIES, CITY_COORDS } from '@/lib/data';
import dynamic from 'next/dynamic';

const ListingsMap = dynamic(() => import('@/components/ui/ListingsMap'), { ssr: false });

interface ApiListing {
  id: string;
  title: string;
  locality: string;
  city: string;
  rentAmount: number;
  latitude: number | null;
  longitude: number | null;
  rooms: number;
  bathrooms: number;
  areaMarla: number | null;
  areaSqft: number | null;
  propertyType: string;
  furnishing: string;
  utilities: string[];
  isBoosted: boolean;
  ownerVerified: boolean;
  createdAt: string;
  photos: { url: string; isCover: boolean }[];
  landlord: { id: string; name: string | null; verificationTier: string };
}

const RENT_OPTIONS = [
  { label: 'Any budget', value: '' },
  { label: 'Under ₨20k', value: '20000' },
  { label: 'Under ₨40k', value: '40000' },
  { label: 'Under ₨60k', value: '60000' },
  { label: 'Under ₨80k', value: '80000' },
  { label: 'Under ₨1.2L', value: '120000' },
];

const BED_OPTIONS = [
  { label: 'Any', value: '' },
  { label: '1+', value: '1' },
  { label: '2+', value: '2' },
  { label: '3+', value: '3' },
  { label: '4+', value: '4' },
];

const FURNISHING_OPTIONS = [
  { label: 'Any', value: '' },
  { label: 'Furnished', value: 'Furnished' },
  { label: 'Semi-furnished', value: 'Semi-furnished' },
  { label: 'Unfurnished', value: 'Unfurnished' },
];

const SORT_OPTIONS = [
  { label: 'Newest first', value: 'newest' },
  { label: 'Price: low → high', value: 'price_asc' },
  { label: 'Price: high → low', value: 'price_desc' },
];

const TYPE_OPTIONS = [
  { label: 'Any type', value: '' },
  { label: 'House', value: 'House' },
  { label: 'Apartment', value: 'Apartment' },
  { label: 'Studio', value: 'Studio' },
  { label: 'Portion', value: 'Portion' },
  { label: 'Room', value: 'Room' },
  { label: 'Shop', value: 'Shop' },
];

function badges(l: ApiListing): BadgeKind[] {
  const b: BadgeKind[] = [];
  if (l.landlord.verificationTier === 'VERIFIED') b.push('nadra');
  if (l.ownerVerified) b.push('owner');
  if (l.isBoosted) b.push('boost');
  return b;
}

function coverPhoto(l: ApiListing) {
  return l.photos.find(p => p.isCover)?.url ?? l.photos[0]?.url ?? '';
}

function daysAgo(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function fmt(n: number) {
  if (n >= 100000) return `₨${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`;
  if (n >= 1000) return `₨${Math.round(n / 1000)}k`;
  return `₨${n}`;
}

export default function SearchPage() {
  const searchParams = useSearchParams();

  const [city,         setCity]         = useState(searchParams.get('city') ?? '');
  const [locality,     setLocality]     = useState(searchParams.get('locality') ?? '');
  const [maxRent,      setMaxRent]      = useState(searchParams.get('maxRent') ?? '');
  const [minRooms,     setMinRooms]     = useState(searchParams.get('rooms') ?? '');
  const [furnishing,   setFurnishing]   = useState(searchParams.get('furnishing') ?? '');
  const [verifiedOnly, setVerifiedOnly] = useState(searchParams.get('verifiedOnly') === 'true');
  const [query,        setQuery]        = useState(searchParams.get('q') ?? '');
  const [sort,         setSort]         = useState(searchParams.get('sort') ?? 'newest');
  const [propType,     setPropType]     = useState(searchParams.get('type') ?? '');

  const [cityOpen,    setCityOpen]    = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen,    setSortOpen]    = useState(false);
  const [showMap,     setShowMap]     = useState(false);

  const { user } = useAuth();
  const [savedIds,       setSavedIds]       = useState<Set<string>>(new Set());
  const [savingId,       setSavingId]       = useState<string | null>(null);
  const [saveSearchOpen, setSaveSearchOpen] = useState(false);
  const [saveLabel,      setSaveLabel]      = useState('');
  const [savingSearch,   setSavingSearch]   = useState(false);
  const [savedSearchMsg, setSavedSearchMsg] = useState<string | null>(null);

  const [listings, setListings] = useState<ApiListing[]>([]);
  const [total,    setTotal]    = useState(0);
  const [pages,    setPages]    = useState(1);
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [sel,      setSel]      = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildUrl = useCallback((overrides: Record<string, string> = {}) => {
    const p: Record<string, string> = {
      ...(city && { city }),
      ...(locality && { locality }),
      ...(maxRent && { maxRent }),
      ...(minRooms && { rooms: minRooms }),
      ...(furnishing && { furnishing }),
      ...(verifiedOnly && { verifiedOnly: 'true' }),
      ...(query && { q: query }),
      ...(sort !== 'newest' && { sort }),
      ...(propType && { type: propType }),
      page: String(page),
      ...overrides,
    };
    return '/api/search?' + new URLSearchParams(p).toString();
  }, [city, locality, maxRent, minRooms, furnishing, verifiedOnly, query, sort, propType, page]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(buildUrl());
      const data = await res.json();
      setListings(data.listings ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
      setSel(prev => data.listings?.find((l: ApiListing) => l.id === prev) ? prev : data.listings?.[0]?.id ?? null);
    } finally {
      setLoading(false);
    }
  }, [buildUrl]);

  useEffect(() => { setPage(1); }, [city, locality, maxRent, minRooms, furnishing, verifiedOnly, query, sort, propType]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(load, query ? 350 : 0);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [load, query]);

  useEffect(() => {
    const close = () => { setCityOpen(false); setFiltersOpen(false); setSortOpen(false); setSaveSearchOpen(false); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch('/api/saved')
      .then(r => r.json())
      .then(d => setSavedIds(new Set((d.listings ?? []).map((l: { id: string }) => l.id))))
      .catch(() => {});
  }, [user]);

  async function toggleSave(e: React.MouseEvent, listingId: string) {
    e.stopPropagation();
    if (!user || savingId === listingId) return;
    setSavingId(listingId);
    const isSaved = savedIds.has(listingId);
    setSavedIds(prev => { const n = new Set(prev); isSaved ? n.delete(listingId) : n.add(listingId); return n; });
    await fetch(`/api/listings/${listingId}/save`, { method: isSaved ? 'DELETE' : 'POST' }).catch(() => {
      setSavedIds(prev => { const n = new Set(prev); isSaved ? n.add(listingId) : n.delete(listingId); return n; });
    });
    setSavingId(null);
  }

  async function saveSearch() {
    if (!user || savingSearch) return;
    setSavingSearch(true);
    const res = await fetch('/api/saved-searches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city, maxRent: maxRent || null, minRooms: minRooms || null, propType: propType || null, label: saveLabel || null }),
    }).catch(() => null);
    setSavingSearch(false);
    setSaveSearchOpen(false);
    setSaveLabel('');
    if (res?.ok) {
      setSavedSearchMsg('Search saved!');
      setTimeout(() => setSavedSearchMsg(null), 3500);
    }
  }

  function stopProp(e: React.MouseEvent) { e.stopPropagation(); }

  const selectedProp = listings.find(l => l.id === sel) ?? listings[0];

  // Count active filters (excluding city and sort)
  const activeFilterCount = [locality, maxRent, minRooms, furnishing, propType, verifiedOnly].filter(Boolean).length;

  const dropStyle: React.CSSProperties = {
    position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 300,
    background: 'var(--n-surface)', border: '1px solid var(--n-line)',
    borderRadius: 14, boxShadow: '0 20px 60px -10px rgba(0,0,0,.2)', padding: 8,
  };

  const dropItem = (label: string, active: boolean, onClick: () => void) => (
    <button
      key={label}
      onClick={onClick}
      style={{
        display: 'block', width: '100%', textAlign: 'left', padding: '9px 14px',
        borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14,
        background: active ? 'var(--n-accent-soft)' : 'transparent',
        color: active ? 'var(--n-accent-ink)' : 'var(--n-ink)',
        fontWeight: active ? 500 : 400,
      }}
    >
      {active ? '✓ ' : ''}{label}
    </button>
  );

  const clearFilters = () => {
    setLocality(''); setMaxRent(''); setMinRooms(''); setFurnishing('');
    setVerifiedOnly(false); setQuery(''); setPropType(''); setSort('newest');
  };

  return (
    <div className="n-root">
      <TopBar />
      <OnboardingBanner />

      {/* ── Filter bar ── */}
      <div style={{
        padding: '10px 24px', borderBottom: '1px solid var(--n-line)',
        background: 'var(--n-bg)', position: 'sticky', top: 57, zIndex: 90,
      }}>
        <div className="n-search-filters" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

          {/* Search input */}
          <div style={{
            flex: 1, minWidth: 0,
            display: 'flex', alignItems: 'center', gap: 10,
            height: 40, padding: '0 14px', borderRadius: 10,
            border: '1px solid var(--n-line)', background: 'var(--n-surface)',
          }}>
            <Icon name="search" style={{ color: 'var(--n-muted)', flexShrink: 0 }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search listings…"
              style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, background: 'transparent', color: 'var(--n-ink)', fontFamily: 'inherit' }}
            />
            {query && (
              <button onClick={() => setQuery('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--n-muted)', padding: 0, display: 'flex' }}>
                <Icon name="close" className="n-ico" />
              </button>
            )}
          </div>

          {/* City */}
          <div style={{ position: 'relative', flexShrink: 0 }} onClick={stopProp}>
            <button
              onClick={() => { setCityOpen(v => !v); setFiltersOpen(false); setSortOpen(false); }}
              className="n-btn ghost sm"
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: city ? 'var(--n-ink)' : undefined, color: city ? 'var(--n-bg)' : undefined, borderColor: city ? 'var(--n-ink)' : undefined }}
            >
              <Icon name="pin" /> {city || 'All cities'} <Icon name="chevronDown" className="n-ico" />
            </button>
            {cityOpen && (
              <div style={{ ...dropStyle, minWidth: 180 }}>
                {dropItem('All cities', city === '', () => { setCity(''); setCityOpen(false); })}
                {CITIES.map(c => dropItem(c.name, city === c.name, () => { setCity(c.name); setCityOpen(false); }))}
              </div>
            )}
          </div>

          {/* Filters */}
          <div style={{ position: 'relative', flexShrink: 0 }} onClick={stopProp}>
            <button
              onClick={() => { setFiltersOpen(v => !v); setCityOpen(false); setSortOpen(false); }}
              className="n-btn ghost sm"
              style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative', ...(activeFilterCount > 0 ? { background: 'var(--n-accent-soft)', borderColor: 'var(--n-accent)', color: 'var(--n-accent-ink)' } : {}) }}
            >
              <Icon name="filter" />
              Filters
              {activeFilterCount > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: 999, background: 'var(--n-accent)', color: '#fff', fontSize: 11, fontWeight: 700, marginLeft: 2 }}>
                  {activeFilterCount}
                </span>
              )}
              <Icon name="chevronDown" className="n-ico" />
            </button>

            {filtersOpen && (
              <div style={{ ...dropStyle, minWidth: 300, left: 0 }}>
                <div style={{ padding: '4px 10px 10px' }}>

                  {/* Locality */}
                  <div style={{ marginBottom: 16 }}>
                    <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6, fontSize: 11 }}>Neighbourhood / area</div>
                    <input
                      value={locality}
                      onChange={e => setLocality(e.target.value)}
                      placeholder={`e.g. Model Town, Gulshan Colony…`}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid var(--n-line)', background: 'var(--n-surface-2)', color: 'var(--n-ink)', fontFamily: 'inherit', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }}
                    />
                  </div>

                  {/* Max rent */}
                  <div style={{ marginBottom: 16 }}>
                    <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6, fontSize: 11 }}>Max rent</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {RENT_OPTIONS.map(o => (
                        <button key={o.value} onClick={() => setMaxRent(o.value)}
                          className={`n-chip${maxRent === o.value ? ' verified' : ''}`}
                          style={{ cursor: 'pointer', border: maxRent === o.value ? undefined : '1px solid var(--n-line)' }}>
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bedrooms */}
                  <div style={{ marginBottom: 16 }}>
                    <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6, fontSize: 11 }}>Bedrooms</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {BED_OPTIONS.map(o => (
                        <button key={o.value} onClick={() => setMinRooms(o.value)}
                          className={`n-chip${minRooms === o.value ? ' verified' : ''}`}
                          style={{ cursor: 'pointer' }}>
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Property type */}
                  <div style={{ marginBottom: 16 }}>
                    <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6, fontSize: 11 }}>Property type</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {TYPE_OPTIONS.map(o => (
                        <button key={o.value} onClick={() => setPropType(o.value)}
                          className={`n-chip${propType === o.value ? ' verified' : ''}`}
                          style={{ cursor: 'pointer' }}>
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Furnishing */}
                  <div style={{ marginBottom: 16 }}>
                    <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6, fontSize: 11 }}>Furnishing</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {FURNISHING_OPTIONS.map(o => (
                        <button key={o.value} onClick={() => setFurnishing(o.value)}
                          className={`n-chip${furnishing === o.value ? ' verified' : ''}`}
                          style={{ cursor: 'pointer' }}>
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* NADRA verified */}
                  <div style={{ marginBottom: 16 }}>
                    <button
                      onClick={() => setVerifiedOnly(v => !v)}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: 10,
                        border: `1px solid ${verifiedOnly ? 'var(--n-accent)' : 'var(--n-line)'}`,
                        background: verifiedOnly ? 'var(--n-accent-soft)' : 'transparent',
                        color: verifiedOnly ? 'var(--n-accent-ink)' : 'var(--n-ink)',
                        cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
                        display: 'flex', alignItems: 'center', gap: 8,
                      }}
                    >
                      <Icon name="shield" /> NADRA verified landlords only
                      {verifiedOnly && <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--n-accent-ink)' }}>✓</span>}
                    </button>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--n-line)', paddingTop: 12 }}>
                    <button
                      onClick={() => { setLocality(''); setMaxRent(''); setMinRooms(''); setFurnishing(''); setVerifiedOnly(false); setPropType(''); }}
                      className="n-btn ghost sm"
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      Clear filters
                    </button>
                    {user && (
                      <button
                        onClick={() => { setFiltersOpen(false); setSaveSearchOpen(true); }}
                        className="n-btn sm"
                        style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <Icon name="heart" /> Save search
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sort */}
          <div style={{ position: 'relative', flexShrink: 0 }} onClick={stopProp}>
            <button
              onClick={() => { setSortOpen(v => !v); setCityOpen(false); setFiltersOpen(false); }}
              className="n-btn ghost sm"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {SORT_OPTIONS.find(o => o.value === sort)?.label ?? 'Sort'}
              <Icon name="chevronDown" className="n-ico" />
            </button>
            {sortOpen && (
              <div style={{ ...dropStyle, minWidth: 200, left: 'auto', right: 0 }}>
                {SORT_OPTIONS.map(o => dropItem(o.label, sort === o.value, () => { setSort(o.value); setSortOpen(false); }))}
              </div>
            )}
          </div>

          {/* Result count + map toggle */}
          <div className="n-mono" style={{ color: 'var(--n-muted)', fontSize: 12, flexShrink: 0, whiteSpace: 'nowrap' }}>
            {loading ? '…' : `${total} result${total !== 1 ? 's' : ''}`}
          </div>
          <button
            className="n-show-mobile n-btn ghost sm"
            onClick={() => setShowMap(v => !v)}
            style={{ display: 'none', alignItems: 'center', gap: 6, flexShrink: 0 }}
          >
            <Icon name="map" /> {showMap ? 'List' : 'Map'}
          </button>
        </div>

        {/* Active filter pills row */}
        {(locality || maxRent || minRooms || propType || furnishing || verifiedOnly || query) && (
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {locality && (
              <span className="n-chip verified" style={{ gap: 6 }}>
                {locality}
                <button onClick={() => setLocality('')} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'inherit' }}><Icon name="close" className="n-ico" style={{ width: 12, height: 12 }} /></button>
              </span>
            )}
            {query && (
              <span className="n-chip" style={{ gap: 6 }}>
                &ldquo;{query}&rdquo;
                <button onClick={() => setQuery('')} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--n-muted)' }}><Icon name="close" className="n-ico" style={{ width: 12, height: 12 }} /></button>
              </span>
            )}
            {maxRent && (
              <span className="n-chip verified" style={{ gap: 6 }}>
                {RENT_OPTIONS.find(o => o.value === maxRent)?.label}
                <button onClick={() => setMaxRent('')} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'inherit' }}><Icon name="close" className="n-ico" style={{ width: 12, height: 12 }} /></button>
              </span>
            )}
            {minRooms && (
              <span className="n-chip verified" style={{ gap: 6 }}>
                {minRooms}+ beds
                <button onClick={() => setMinRooms('')} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'inherit' }}><Icon name="close" className="n-ico" style={{ width: 12, height: 12 }} /></button>
              </span>
            )}
            {propType && (
              <span className="n-chip verified" style={{ gap: 6 }}>
                {propType}
                <button onClick={() => setPropType('')} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'inherit' }}><Icon name="close" className="n-ico" style={{ width: 12, height: 12 }} /></button>
              </span>
            )}
            {furnishing && (
              <span className="n-chip verified" style={{ gap: 6 }}>
                {furnishing}
                <button onClick={() => setFurnishing('')} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'inherit' }}><Icon name="close" className="n-ico" style={{ width: 12, height: 12 }} /></button>
              </span>
            )}
            {verifiedOnly && (
              <span className="n-chip verified" style={{ gap: 6 }}>
                NADRA verified
                <button onClick={() => setVerifiedOnly(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'inherit' }}><Icon name="close" className="n-ico" style={{ width: 12, height: 12 }} /></button>
              </span>
            )}
            <button onClick={clearFilters} style={{ fontSize: 12, color: 'var(--n-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '0 4px' }}>
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Save search popover */}
      {saveSearchOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 120 }} onClick={() => setSaveSearchOpen(false)}>
          <div style={{ background: 'var(--n-surface)', border: '1px solid var(--n-line)', borderRadius: 16, padding: 20, width: 320, boxShadow: '0 24px 80px rgba(0,0,0,.25)' }} onClick={stopProp}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Save this search</div>
            <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 14, fontSize: 11 }}>
              {city}{propType ? ` · ${propType}` : ''}{minRooms ? ` · ${minRooms}+ beds` : ''}{maxRent ? ` · ${fmt(parseInt(maxRent))}` : ''}
            </div>
            <input
              value={saveLabel}
              onChange={e => setSaveLabel(e.target.value)}
              placeholder="Label (optional, e.g. Sialkot 2BR)"
              autoFocus
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--n-line)', background: 'var(--n-surface-2)', color: 'var(--n-ink)', fontFamily: 'inherit', fontSize: 14, outline: 'none', marginBottom: 12, boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setSaveSearchOpen(false)} className="n-btn ghost sm" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              <button onClick={saveSearch} disabled={savingSearch} className="n-btn primary sm" style={{ flex: 1, justifyContent: 'center' }}>
                {savingSearch ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {savedSearchMsg && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 500, background: 'var(--n-ink)', color: 'var(--n-bg)', padding: '12px 20px', borderRadius: 999, fontSize: 14, fontWeight: 500, boxShadow: '0 10px 40px rgba(0,0,0,.3)', display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap' }}>
          <Icon name="heart" /> {savedSearchMsg}
        </div>
      )}

      {/* ── Split layout ── */}
      <div className="n-search-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 420px', minHeight: 'calc(100vh - 120px)' }}>

        {/* Left — cards */}
        <div className="n-search-list" style={{ padding: '20px 24px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ display: 'grid', gap: 12 }}>
              {[0, 1, 2, 3].map(i => <div key={i} className="n-card" style={{ height: 200, opacity: 0.35 }} />)}
            </div>
          ) : listings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--n-muted)' }}>
              <Icon name="home" className="n-ico xl" style={{ margin: '0 auto 12px', display: 'block' }} />
              <div style={{ fontWeight: 500, marginBottom: 6 }}>No listings found</div>
              <div className="n-mono" style={{ marginBottom: 20, fontSize: 12 }}>Try adjusting your filters</div>
              <button onClick={clearFilters} className="n-btn primary sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Icon name="close" /> Clear filters
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {listings.map(p => {
                const cover = coverPhoto(p);
                const isSelected = sel === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSel(p.id)}
                    style={{
                      borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
                      background: 'var(--n-surface)',
                      border: `1px solid ${isSelected ? 'var(--n-ink)' : 'var(--n-line)'}`,
                      boxShadow: isSelected ? '0 0 0 3px var(--n-bg-2), 0 12px 40px -20px rgba(0,0,0,.25)' : 'var(--n-shadow)',
                      transition: 'all .18s',
                      display: 'grid', gridTemplateColumns: '200px 1fr',
                    }}
                  >
                    {/* Photo */}
                    <div style={{
                      position: 'relative', background: cover ? `url(${cover}) center/cover` : 'var(--n-surface-2)',
                      display: 'grid', placeItems: 'center', minHeight: 172,
                    }}>
                      {!cover && <Icon name="camera" className="n-ico xl" style={{ color: 'var(--n-muted)' }} />}
                      {p.isBoosted && (
                        <span style={{ position: 'absolute', top: 10, left: 10, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: 11, fontWeight: 600, backdropFilter: 'blur(4px)' }}>
                          <Icon name="zap" className="n-ico" style={{ width: 12, height: 12 }} /> Boosted
                        </span>
                      )}
                      <button
                        onClick={e => toggleSave(e, p.id)}
                        style={{ position: 'absolute', bottom: 10, right: 10, width: 30, height: 30, borderRadius: 999, border: 'none', background: 'rgba(255,255,255,0.92)', display: 'grid', placeItems: 'center', cursor: 'pointer', color: savedIds.has(p.id) ? 'var(--n-danger)' : 'var(--n-muted)' }}
                      >
                        <Icon name="heart" className="n-ico" style={{ width: 14, height: 14 }} />
                      </button>
                    </div>

                    {/* Content */}
                    <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', gap: 5, marginBottom: 8, flexWrap: 'wrap' }}>
                          {badges(p).map(b => <TrustBadge key={b} kind={b} size="sm" />)}
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.3, marginBottom: 4 }}>{p.title}</div>
                        <div style={{ fontSize: 13, color: 'var(--n-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Icon name="pin" className="n-ico" style={{ width: 12, height: 12 }} />
                          {p.locality} · {p.city}
                        </div>
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--n-muted)', fontSize: 12, marginBottom: 12, marginTop: 10 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Icon name="bed" className="n-ico" style={{ width: 13, height: 13 }} /> {p.rooms} bed</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Icon name="bath" className="n-ico" style={{ width: 13, height: 13 }} /> {p.bathrooms} bath</span>
                          {p.areaMarla && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Icon name="square" className="n-ico" style={{ width: 13, height: 13 }} /> {p.areaMarla}M</span>}
                          <span className="n-mono" style={{ marginLeft: 'auto', fontSize: 11 }}>{p.propertyType}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <div className="n-display" style={{ fontSize: 22, letterSpacing: '-0.02em' }}>₨ {p.rentAmount.toLocaleString()}</div>
                            <div className="n-mono" style={{ color: 'var(--n-muted)', fontSize: 10 }}>/month · {daysAgo(p.createdAt)}d ago</div>
                          </div>
                          <Link
                            href={`/property/${p.id}`}
                            onClick={e => e.stopPropagation()}
                            className="n-btn sm primary"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            View <Icon name="arrow" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!loading && pages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '24px 0 8px' }}>
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="n-btn ghost sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon name="arrow" style={{ transform: 'rotate(180deg)' }} /> Prev
              </button>
              {Array.from({ length: pages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === pages || Math.abs(n - page) <= 1)
                .map((n, idx, arr) => (
                  <>
                    {idx > 0 && arr[idx - 1] !== n - 1 && <span key={`e${n}`} style={{ color: 'var(--n-muted)', fontSize: 13 }}>…</span>}
                    <button key={n} onClick={() => setPage(n)} className={n === page ? 'n-btn primary sm' : 'n-btn ghost sm'} style={{ minWidth: 36, justifyContent: 'center' }}>
                      {n}
                    </button>
                  </>
                ))}
              <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="n-btn ghost sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                Next <Icon name="arrow" />
              </button>
            </div>
          )}
        </div>

        {/* Right — real Leaflet map */}
        <div className="n-search-map" style={{ position: 'sticky', top: 120, height: 'calc(100vh - 120px)', borderLeft: '1px solid var(--n-line)', display: showMap ? 'block' : undefined, overflow: 'hidden' }}>
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <ListingsMap
              listings={listings}
              selected={sel}
              city={city}
              cityLat={CITY_COORDS[city]?.lat ?? 31.5204}
              cityLng={CITY_COORDS[city]?.lng ?? 74.3587}
              onSelect={setSel}
            />

            {/* Selected listing card — floats over map */}
            {selectedProp && (
              <div style={{
                position: 'absolute', bottom: 16, left: 16, right: 16, zIndex: 1000,
                background: 'var(--n-surface)', border: '1px solid var(--n-line)',
                borderRadius: 14, padding: 12,
                display: 'grid', gridTemplateColumns: '88px 1fr', gap: 12, alignItems: 'center',
                boxShadow: '0 12px 40px rgba(0,0,0,.18)',
              }}>
                <div style={{ width: 88, height: 66, borderRadius: 10, background: coverPhoto(selectedProp) ? `url(${coverPhoto(selectedProp)}) center/cover` : 'var(--n-surface-2)', display: 'grid', placeItems: 'center' }}>
                  {!coverPhoto(selectedProp) && <Icon name="camera" style={{ color: 'var(--n-muted)' }} />}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3, marginBottom: 2 }}>{selectedProp.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--n-muted)', marginBottom: 8 }}>{selectedProp.locality}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="n-display" style={{ fontSize: 18 }}>₨ {selectedProp.rentAmount.toLocaleString()}</div>
                    <Link href={`/property/${selectedProp.id}`} className="n-btn sm primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '0 10px', height: 28, fontSize: 12 }}>
                      View <Icon name="arrow" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
