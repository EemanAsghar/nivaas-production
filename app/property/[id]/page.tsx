'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import TopBar from '@/components/ui/TopBar';
import Icon from '@/components/ui/Icon';
import TrustBadge from '@/components/ui/TrustBadge';
import TrustScore from '@/components/ui/TrustScore';
import { useAuth } from '@/components/auth/AuthProvider';

const PropertyMap = dynamic(() => import('@/components/ui/PropertyMap'), { ssr: false });

type ChecklistItem = {
  id: string;
  category: string;
  status: 'PASS' | 'FAIL' | 'FLAG';
  notes?: string;
};

type Inspection = {
  id: string;
  completedAt: string;
  checklistItems: ChecklistItem[];
};

type Listing = {
  id: string;
  title: string;
  description?: string;
  city: string;
  locality: string;
  propertyType: string;
  rentAmount: number;
  rooms: number;
  bathrooms: number;
  areaMarla?: number;
  areaSqft?: number;
  furnishing: string;
  utilities: string[];
  ownerVerified: boolean;
  isBoosted: boolean;
  createdAt: string;
  latitude?: number | null;
  longitude?: number | null;
  photos: { id: string; url: string; isCover: boolean; order: number }[];
  landlord: { id: string; name?: string; verificationTier: string; photoUrl?: string; createdAt: string };
  inspections: Inspection[];
};

type Review = {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  author: { id: string; name?: string | null };
};

function computeTrust(l: Listing) {
  let s = 40;
  if (l.landlord.verificationTier === 'VERIFIED') s += 25;
  else if (l.landlord.verificationTier === 'STANDARD') s += 10;
  if (l.ownerVerified) s += 20;
  if (l.inspections.length > 0) s += 10;
  if (l.photos.length >= 3) s += 5;
  return Math.min(s, 95);
}

function areaStr(l: Listing) {
  if (l.areaMarla) return `${l.areaMarla} marla`;
  if (l.areaSqft) return `${l.areaSqft.toLocaleString()} sqft`;
  return '—';
}

function inspIcon(category: string) {
  if (category.toLowerCase().includes('gas')) return 'gas' as const;
  if (category.toLowerCase().includes('water')) return 'drop' as const;
  if (category.toLowerCase().includes('elect')) return 'bolt' as const;
  return 'home' as const;
}

export default function PropertyDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [msgModal, setMsgModal] = useState(false);
  const [msgText, setMsgText] = useState('');
  const [sending, setSending] = useState(false);
  const [msgError, setMsgError] = useState('');

  const [saved, setSaved] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);

  // Viewing request modal
  const [viewModal, setViewModal] = useState(false);
  const [viewDate, setViewDate] = useState('');
  const [viewTime, setViewTime] = useState('10:00');
  const [viewNote, setViewNote] = useState('');
  const [viewSending, setViewSending] = useState(false);
  const [viewDone, setViewDone] = useState(false);

  // Inspection request modal
  const [inspModal, setInspModal] = useState(false);
  const [inspType, setInspType] = useState<'GENERAL' | 'MOVE_IN' | 'MOVE_OUT'>('GENERAL');
  const [inspGateway, setInspGateway] = useState<'JAZZCASH' | 'EASYPAISA' | 'CARD'>('JAZZCASH');
  const [inspSending, setInspSending] = useState(false);
  const [inspDone, setInspDone] = useState(false);

  // Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewAvg, setReviewAvg] = useState<number | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewDone, setReviewDone] = useState(false);

  useEffect(() => {
    fetch(`/api/listings/${id}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then(d => { if (d) setListing(d.listing); })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetch(`/api/listings/${id}/reviews`)
      .then(r => r.json())
      .then(d => { setReviews(d.reviews ?? []); setReviewAvg(d.avg ?? null); })
      .catch(() => {});
  }, [id]);

  async function submitReview() {
    if (!user || reviewRating === 0) return;
    setReviewSubmitting(true);
    setReviewError('');
    const res = await fetch(`/api/listings/${id}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: reviewRating, comment: reviewComment.trim() || null }),
    });
    const data = await res.json();
    if (!res.ok) { setReviewError(data.error ?? 'Failed to submit'); setReviewSubmitting(false); return; }
    setReviews(prev => [data.review, ...prev]);
    setReviewAvg(prev => prev === null ? reviewRating : Math.round(((prev * (reviews.length) + reviewRating) / (reviews.length + 1)) * 10) / 10);
    setReviewRating(0);
    setReviewComment('');
    setReviewDone(true);
    setReviewSubmitting(false);
  }

  useEffect(() => {
    if (!user) return;
    fetch('/api/saved')
      .then(r => r.json())
      .then(d => setSaved((d.listings ?? []).some((l: { id: string }) => l.id === id)))
      .catch(() => {});
  }, [id, user]);

  async function sendMessage() {
    if (!user) { setMsgError('Please sign in to message the landlord.'); return; }
    if (!msgText.trim()) return;
    setSending(true);
    setMsgError('');
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: id, message: msgText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setMsgError(data.error ?? 'Failed to send'); return; }
      router.push(`/messages/${data.conversationId}`);
    } finally {
      setSending(false);
    }
  }

  async function toggleSave() {
    if (!user) return;
    const method = saved ? 'DELETE' : 'POST';
    await fetch(`/api/listings/${id}/save`, { method });
    setSaved(s => !s);
  }

  async function requestViewing() {
    if (!viewDate) return;
    setViewSending(true);
    const proposedAt = new Date(`${viewDate}T${viewTime}:00`).toISOString();
    await fetch('/api/viewing-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId: id, proposedAt, note: viewNote.trim() || undefined }),
    });
    setViewSending(false);
    setViewDone(true);
    setTimeout(() => { setViewModal(false); setViewDone(false); setViewDate(''); setViewNote(''); }, 2000);
  }

  async function requestInspection() {
    setInspSending(true);
    await fetch('/api/inspection-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId: id, type: inspType, gateway: inspGateway }),
    });
    setInspSending(false);
    setInspDone(true);
    setTimeout(() => { setInspModal(false); setInspDone(false); }, 2000);
  }

  if (loading) {
    return (
      <div className="n-root">
        <TopBar />
        <div style={{ display: 'grid', placeItems: 'center', height: '60vh', color: 'var(--n-muted)' }}>
          <span className="n-mono">Loading…</span>
        </div>
      </div>
    );
  }

  if (notFound || !listing) {
    return (
      <div className="n-root">
        <TopBar />
        <div style={{ display: 'grid', placeItems: 'center', height: '60vh', textAlign: 'center' }}>
          <div>
            <div className="n-display" style={{ fontSize: 48, color: 'var(--n-muted)' }}>404</div>
            <div style={{ color: 'var(--n-muted)', marginTop: 8, marginBottom: 24 }}>This listing doesn&apos;t exist or was removed.</div>
            <Link href="/search" className="n-btn primary sm">Browse listings</Link>
          </div>
        </div>
      </div>
    );
  }

  const p = listing;
  const trust = computeTrust(p);
  const inspection = p.inspections[0];
  const photos = p.photos.sort((a, b) => a.order - b.order);
  const postedDays = Math.floor((Date.now() - new Date(p.createdAt).getTime()) / 86400000);
  const landlordSince = new Date(p.landlord.createdAt).getFullYear();
  const landlordName = p.landlord.name ?? 'Anonymous';

  return (
    <div className="n-root">
      <TopBar />

      {/* Breadcrumb */}
      <div style={{ padding: '16px 40px 0', color: 'var(--n-muted)', fontSize: 13 }}>
        <Link href="/search" style={{ color: 'var(--n-muted)' }}>Rent</Link>
        {' · '}{p.city}{' · '}{p.locality.split(',')[0]}
        {' · '}<span style={{ color: 'var(--n-ink)' }}>{p.title}</span>
      </div>

      {/* Gallery */}
      <div style={{ padding: '18px 40px 0', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gridTemplateRows: '220px 220px', gap: 8, height: 448 }}>
        <div onClick={() => photos[0] && setLightbox(0)} style={{ gridRow: '1 / span 2', borderRadius: 14, background: photos[0] ? `url(${photos[0].url}) center/cover` : 'var(--n-surface-2)', position: 'relative', cursor: photos[0] ? 'zoom-in' : 'default' }}>
          {!photos[0] && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: 'var(--n-muted)' }}><Icon name="camera" className="n-ico xl" /></div>}
          <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', gap: 6 }}>
            {p.landlord.verificationTier === 'VERIFIED' && <TrustBadge kind="nadra" />}
            {inspection && <TrustBadge kind="inspected" />}
            {p.isBoosted && <TrustBadge kind="boost" />}
          </div>
        </div>
        {[1, 2, 3, 4].map(i => (
          <div key={i} onClick={() => photos[i] && setLightbox(i)} style={{ borderRadius: 14, background: photos[i] ? `url(${photos[i].url}) center/cover` : 'var(--n-surface-2)', position: 'relative', cursor: photos[i] ? 'zoom-in' : 'default' }}>
            {i === 4 && photos.length > 5 && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(21,18,14,0.55)', borderRadius: 14, display: 'grid', placeItems: 'center', color: '#f6f3ee', fontWeight: 500 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="camera" /> +{photos.length - 4} photos</span>
              </div>
            )}
            {!photos[i] && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: 'var(--n-muted)' }}><Icon name="camera" /></div>}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setLightbox(null)}
        >
          <button onClick={e => { e.stopPropagation(); setLightbox(i => i !== null && i > 0 ? i - 1 : i); }}
            style={{ position: 'absolute', left: 20, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 999, width: 44, height: 44, cursor: 'pointer', color: '#fff', fontSize: 20, display: 'grid', placeItems: 'center' }}>‹</button>
          <img
            src={photos[lightbox]?.url}
            alt=""
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '88vw', maxHeight: '88vh', borderRadius: 12, objectFit: 'contain', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}
          />
          <button onClick={e => { e.stopPropagation(); setLightbox(i => i !== null && i < photos.length - 1 ? i + 1 : i); }}
            style={{ position: 'absolute', right: 20, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 999, width: 44, height: 44, cursor: 'pointer', color: '#fff', fontSize: 20, display: 'grid', placeItems: 'center' }}>›</button>
          <div style={{ position: 'absolute', bottom: 20, color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{lightbox + 1} / {photos.length}</div>
          <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 999, width: 36, height: 36, cursor: 'pointer', color: '#fff', fontSize: 18, display: 'grid', placeItems: 'center' }}>×</button>
        </div>
      )}

      {/* Main body */}
      <div style={{ padding: '32px 40px 56px', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 40 }}>
        {/* Left */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="n-mono" style={{ color: 'var(--n-muted)' }}>{p.propertyType} · {areaStr(p)} · Posted {postedDays} days ago</div>
              <h1 className="n-display" style={{ fontSize: 'clamp(36px, 4vw, 56px)', lineHeight: 1.0, letterSpacing: '-0.02em', margin: '8px 0 10px', maxWidth: 620 }}>{p.title}</h1>
              <div style={{ color: 'var(--n-muted)', fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="pin" /> {p.locality}, {p.city}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={toggleSave} className="n-btn ghost sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="heart" style={{ color: saved ? 'var(--n-accent)' : undefined }} /> {saved ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 22, marginTop: 28, paddingTop: 24, borderTop: '1px solid var(--n-line)', borderBottom: '1px solid var(--n-line)', paddingBottom: 24 }}>
            {([
              { k: 'Bedrooms',   v: String(p.rooms),      ico: 'bed' as const },
              { k: 'Bathrooms',  v: String(p.bathrooms),  ico: 'bath' as const },
              { k: 'Area',       v: areaStr(p),           ico: 'square' as const },
              { k: 'Furnishing', v: p.furnishing,         ico: 'home' as const },
              { k: 'Utilities',  v: p.utilities.join(' · '), ico: 'bolt' as const },
            ]).map(s => (
              <div key={s.k} style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--n-muted)' }}>
                  <Icon name={s.ico} />
                  <span className="n-mono">{s.k}</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 500, marginTop: 6 }}>{s.v || '—'}</div>
              </div>
            ))}
          </div>

          {/* Description */}
          {p.description && (
            <div style={{ marginTop: 28 }}>
              <h3 className="n-display" style={{ fontSize: 26, margin: '0 0 10px' }}>About this home</h3>
              <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--n-ink-2)', margin: 0, maxWidth: 680 }}>{p.description}</p>
            </div>
          )}

          {/* Inspection report */}
          {inspection && (
            <div className="n-card" style={{ marginTop: 32, padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', background: 'var(--n-ink)', color: 'var(--n-bg)', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 18, alignItems: 'center' }}>
                <Icon name="stamp" className="n-ico xl" />
                <div>
                  <div className="n-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>Nivaas Inspection Report</div>
                  <div className="n-display" style={{ fontSize: 22, marginTop: 2 }}>
                    Utility check — {inspection.checklistItems.filter(i => i.status === 'PASS').length} of {inspection.checklistItems.length} categories pass
                  </div>
                </div>
              </div>
              <div style={{ padding: 24 }}>
                <div style={{ color: 'var(--n-muted)', fontSize: 13, marginBottom: 18 }}>
                  Completed {new Date(inspection.completedAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                  {inspection.checklistItems.map((it, i) => {
                    const pass = it.status === 'PASS';
                    return (
                      <div key={it.id} style={{ padding: '16px 18px', borderTop: '1px solid var(--n-line)', borderLeft: i % 2 === 1 ? '1px solid var(--n-line)' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Icon name={inspIcon(it.category)} className="n-ico lg" />
                            <span style={{ fontSize: 15, fontWeight: 500 }}>{it.category}</span>
                          </div>
                          <span
                            className="n-chip"
                            style={{
                              background: pass ? 'var(--n-accent-soft)' : 'color-mix(in oklab, var(--n-warn) 22%, transparent)',
                              color: pass ? 'var(--n-accent-ink)' : 'var(--n-warn)',
                              borderColor: 'transparent',
                            }}
                          >
                            {pass ? '✓ Pass' : it.status === 'FLAG' ? '◆ Flagged' : '✗ Fail'}
                          </span>
                        </div>
                        {it.notes && <div style={{ fontSize: 13, color: 'var(--n-muted)', marginTop: 8, paddingLeft: 26 }}>{it.notes}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Location map */}
          <div style={{ marginTop: 32 }}>
            <h3 className="n-display" style={{ fontSize: 26, margin: '0 0 12px' }}>In the neighbourhood</h3>
            <div className="n-card" style={{ height: 280, padding: 0, overflow: 'hidden' }}>
              {p.latitude && p.longitude ? (
                <PropertyMap lat={p.latitude} lng={p.longitude} label={p.locality} />
              ) : (
                <div style={{ height: '100%', display: 'grid', placeItems: 'center', background: 'var(--n-surface-2)', color: 'var(--n-muted)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <Icon name="pin" className="n-ico xl" style={{ display: 'block', margin: '0 auto 8px' }} />
                    <span className="n-mono">{p.locality}, {p.city}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Reviews */}
          <div style={{ marginTop: 40 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 20 }}>
              <h3 className="n-display" style={{ fontSize: 26, margin: 0 }}>Reviews</h3>
              {reviewAvg !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 22, fontWeight: 700 }}>{reviewAvg}</span>
                  <span style={{ color: 'var(--n-warn)', fontSize: 18 }}>{'★'.repeat(Math.round(reviewAvg))}{'☆'.repeat(5 - Math.round(reviewAvg))}</span>
                  <span style={{ color: 'var(--n-muted)', fontSize: 13 }}>({reviews.length})</span>
                </div>
              )}
            </div>

            {/* Write a review */}
            {user && !reviewDone && !reviews.find(r => r.author.id === user.id) && (
              <div className="n-card" style={{ padding: 20, marginBottom: 24 }}>
                <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 10 }}>Leave a review</div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                  {[1,2,3,4,5].map(s => (
                    <button key={s} onClick={() => setReviewRating(s)}
                      style={{ fontSize: 26, background: 'none', border: 'none', cursor: 'pointer', color: s <= reviewRating ? 'var(--n-warn)' : 'var(--n-line-2)', padding: '0 2px', lineHeight: 1 }}>
                      ★
                    </button>
                  ))}
                </div>
                <textarea
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  placeholder="Share your experience with this property or landlord…"
                  rows={3}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--n-line)', background: 'var(--n-surface-2)', color: 'var(--n-ink)', fontFamily: 'inherit', fontSize: 14, resize: 'vertical', outline: 'none', boxSizing: 'border-box', marginBottom: 10 }}
                />
                {reviewError && <div style={{ color: 'var(--n-danger)', fontSize: 13, marginBottom: 8 }}>{reviewError}</div>}
                <button onClick={submitReview} disabled={reviewRating === 0 || reviewSubmitting} className="n-btn accent sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {reviewSubmitting ? 'Submitting…' : 'Submit review'}
                </button>
              </div>
            )}
            {reviewDone && (
              <div className="n-card" style={{ padding: 16, marginBottom: 24, background: 'var(--n-accent-soft)', borderColor: 'transparent' }}>
                <span style={{ color: 'var(--n-accent-ink)', fontSize: 14, fontWeight: 500 }}>✓ Review submitted — thank you!</span>
              </div>
            )}

            {/* Review list */}
            {reviews.length === 0 ? (
              <div style={{ color: 'var(--n-muted)', fontSize: 14, padding: '16px 0' }}>No reviews yet. Be the first to review.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {reviews.map(r => (
                  <div key={r.id} className="n-card" style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 999, background: 'var(--n-bg-2)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 13 }}>
                          {(r.author.name ?? 'A')[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500 }}>{r.author.name ?? 'Anonymous'}</div>
                          <div className="n-mono" style={{ color: 'var(--n-muted)', fontSize: 10 }}>
                            {new Date(r.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        </div>
                      </div>
                      <span style={{ color: 'var(--n-warn)', fontSize: 16, letterSpacing: 1 }}>
                        {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                      </span>
                    </div>
                    {r.comment && <p style={{ fontSize: 14, color: 'var(--n-ink-2)', lineHeight: 1.6, margin: 0 }}>{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right rail */}
        <div>
          <div className="n-card" style={{ padding: 24, position: 'sticky', top: 80 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="n-mono" style={{ color: 'var(--n-muted)' }}>Monthly rent</div>
                <div className="n-display" style={{ fontSize: 44, letterSpacing: '-0.02em', lineHeight: 1 }}>₨ {p.rentAmount.toLocaleString()}</div>
                <div style={{ fontSize: 13, color: 'var(--n-muted)', marginTop: 4 }}>Security deposit · ₨ {(p.rentAmount * 2).toLocaleString()} (2 months)</div>
              </div>
              <TrustScore value={trust} size={72} />
            </div>

            <div className="n-divider" style={{ margin: '20px 0' }} />

            {/* Trust breakdown */}
            <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 10 }}>Trust breakdown</div>
            {([
              { k: 'Identity · NADRA matched',  v: p.landlord.verificationTier === 'VERIFIED' ? 100 : p.landlord.verificationTier === 'STANDARD' ? 50 : 0 },
              { k: 'Ownership docs reviewed',   v: p.ownerVerified ? 100 : 0 },
              { k: 'Utility inspection',        v: inspection ? 88 : 0 },
              { k: 'Photos authenticated',      v: p.photos.length >= 3 ? 92 : p.photos.length > 0 ? 60 : 0 },
            ]).map(b => (
              <div key={b.k} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="check" /> {b.k}</span>
                  <span style={{ color: 'var(--n-muted)' }}>{b.v}</span>
                </div>
                <div style={{ height: 4, background: 'var(--n-line)', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${b.v}%`, height: '100%', background: 'var(--n-accent)', transition: 'width .3s' }} />
                </div>
              </div>
            ))}

            <div className="n-divider" style={{ margin: '20px 0' }} />

            {/* Landlord */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 44, height: 44, borderRadius: 999, background: 'var(--n-bg-2)', display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: 18, flexShrink: 0 }}>
                {landlordName[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{landlordName}</span>
                  {p.landlord.verificationTier === 'VERIFIED' && <Icon name="shield" className="n-ico" style={{ color: 'var(--n-accent)' }} />}
                </div>
                <div className="n-mono" style={{ color: 'var(--n-muted)', marginTop: 2 }}>
                  Landlord · {p.landlord.verificationTier} · Since {landlordSince}
                </div>
                <Link href={`/landlord/${p.landlord.id}`} style={{ fontSize: 12, color: 'var(--n-accent-ink)', marginTop: 4, display: 'inline-block' }}>View profile →</Link>
              </div>
            </div>

            {/* CTA buttons */}
            <div style={{ display: 'grid', gap: 8, marginTop: 20 }}>
              <button onClick={() => setMsgModal(true)} className="n-btn accent" style={{ height: 48, justifyContent: 'center', fontSize: 15 }}>
                <Icon name="chat" /> Message landlord
              </button>
              <button onClick={() => user ? setViewModal(true) : setMsgModal(true)} className="n-btn primary" style={{ height: 44, justifyContent: 'center' }}>
                <Icon name="calendar" /> Request viewing
              </button>
              <button onClick={() => user ? setInspModal(true) : setMsgModal(true)} className="n-btn ghost" style={{ height: 44, justifyContent: 'center' }}>
                <Icon name="stamp" /> Request inspection · ₨ 1,800
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Check out this rental on Nivaas: ${p.title} in ${p.locality}, ${p.city} — ₨${p.rentAmount.toLocaleString()}/month\n\nhttps://nivaas.pk/property/${p.id}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="n-btn ghost"
                style={{ height: 40, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Share on WhatsApp
              </a>
            </div>

            <div className="n-mono" style={{ color: 'var(--n-muted-2)', textAlign: 'center', marginTop: 14, lineHeight: 1.5 }}>
              Inspections are optional · Paid via JazzCash / EasyPaisa
            </div>
          </div>
        </div>
      </div>

      {/* Message modal */}
      {msgModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => setMsgModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
          <div className="n-card" style={{ position: 'relative', width: 480, padding: 32, zIndex: 1 }}>
            <button onClick={() => setMsgModal(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--n-muted)' }}>
              <Icon name="close" className="n-ico lg" />
            </button>
            <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6 }}>Contact landlord</div>
            <h2 className="n-display" style={{ fontSize: 28, margin: '0 0 20px' }}>Send a message</h2>
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--n-surface-2)', marginBottom: 14, fontSize: 13, color: 'var(--n-muted)' }}>
              Re: {p.title}
            </div>
            {!user && (
              <div style={{ padding: 14, borderRadius: 10, background: 'color-mix(in oklab, var(--n-warn) 15%, transparent)', color: 'var(--n-warn)', fontSize: 13, marginBottom: 14 }}>
                You need to sign in before messaging a landlord.
              </div>
            )}
            <textarea
              value={msgText}
              onChange={e => setMsgText(e.target.value)}
              placeholder="Hi, I'm interested in this property. Is it still available?"
              rows={4}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--n-line)', background: 'var(--n-surface-2)', color: 'var(--n-ink)', fontFamily: 'inherit', fontSize: 15, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
            />
            {msgError && <div style={{ color: 'var(--n-danger)', fontSize: 13, marginTop: 8 }}>{msgError}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button onClick={() => setMsgModal(false)} className="n-btn ghost" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              <button
                onClick={sendMessage}
                disabled={!msgText.trim() || sending || !user}
                className="n-btn accent"
                style={{ flex: 2, justifyContent: 'center' }}
              >
                {sending ? 'Sending…' : <><Icon name="chat" /> Send message</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Viewing request modal ── */}
      {viewModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => setViewModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
          <div className="n-card" style={{ position: 'relative', width: 440, padding: 32, zIndex: 1 }}>
            <button onClick={() => setViewModal(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--n-muted)' }}>
              <Icon name="close" className="n-ico lg" />
            </button>
            <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6 }}>Schedule</div>
            <h2 className="n-display" style={{ fontSize: 28, margin: '0 0 4px' }}>Request a viewing</h2>
            <div style={{ fontSize: 13, color: 'var(--n-muted)', marginBottom: 24 }}>{p.title}</div>

            {viewDone ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
                <div style={{ fontWeight: 600 }}>Viewing request sent!</div>
                <div style={{ color: 'var(--n-muted)', fontSize: 13, marginTop: 6 }}>The landlord will confirm via messages.</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6 }}>Preferred date</div>
                  <input type="date" value={viewDate} min={new Date().toISOString().split('T')[0]} onChange={e => setViewDate(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--n-line)', background: 'var(--n-surface-2)', color: 'var(--n-ink)', fontFamily: 'inherit', fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6 }}>Preferred time</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                    {['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00'].map(t => (
                      <button key={t} onClick={() => setViewTime(t)} style={{ padding: '8px 0', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--mono)', border: `1px solid ${viewTime === t ? 'var(--n-accent)' : 'var(--n-line)'}`, background: viewTime === t ? 'var(--n-accent-soft)' : 'var(--n-surface-2)', color: viewTime === t ? 'var(--n-accent-ink)' : 'var(--n-muted)' }}>{t}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6 }}>Note (optional)</div>
                  <textarea value={viewNote} onChange={e => setViewNote(e.target.value)} placeholder="e.g. Coming with family, need parking…" rows={2}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--n-line)', background: 'var(--n-surface-2)', color: 'var(--n-ink)', fontFamily: 'inherit', fontSize: 14, resize: 'none', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button onClick={() => setViewModal(false)} className="n-btn ghost" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                  <button onClick={requestViewing} disabled={!viewDate || viewSending} className="n-btn accent" style={{ flex: 2, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {viewSending ? 'Sending…' : <><Icon name="calendar" /> Send request</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Inspection request modal ── */}
      {inspModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => setInspModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
          <div className="n-card" style={{ position: 'relative', width: 420, padding: 32, zIndex: 1 }}>
            <button onClick={() => setInspModal(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--n-muted)' }}>
              <Icon name="close" className="n-ico lg" />
            </button>
            <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6 }}>Professional inspection</div>
            <h2 className="n-display" style={{ fontSize: 28, margin: '0 0 4px' }}>Request inspection</h2>
            <div style={{ fontSize: 13, color: 'var(--n-muted)', marginBottom: 24 }}>{p.title}</div>

            {inspDone ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
                <div style={{ fontWeight: 600 }}>Inspection requested!</div>
                <div style={{ color: 'var(--n-muted)', fontSize: 13, marginTop: 6 }}>An inspector will be assigned within 24 hours.</div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 16 }}>
                  <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 8 }}>Inspection type</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {([['GENERAL', 'General'], ['MOVE_IN', 'Move-in'], ['MOVE_OUT', 'Move-out']] as const).map(([val, label]) => (
                      <button key={val} onClick={() => setInspType(val)} style={{ padding: '10px 0', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', border: `1.5px solid ${inspType === val ? 'var(--n-accent)' : 'var(--n-line)'}`, background: inspType === val ? 'var(--n-accent-soft)' : 'var(--n-surface-2)', color: inspType === val ? 'var(--n-accent-ink)' : 'var(--n-muted)', fontWeight: inspType === val ? 600 : 400 }}>{label}</button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 10, background: 'var(--n-surface-2)', marginBottom: 16 }}>
                  <span style={{ fontSize: 14 }}>Inspection fee</span>
                  <span className="n-display" style={{ fontSize: 22 }}>₨ 1,800</span>
                </div>

                <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 8 }}>Pay via</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
                  {(['JAZZCASH', 'EASYPAISA', 'CARD'] as const).map(g => (
                    <button key={g} onClick={() => setInspGateway(g)} style={{ padding: '10px 0', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: 'var(--mono)', border: `1.5px solid ${inspGateway === g ? 'var(--n-accent)' : 'var(--n-line)'}`, background: inspGateway === g ? 'var(--n-accent-soft)' : 'var(--n-surface-2)', color: inspGateway === g ? 'var(--n-accent-ink)' : 'var(--n-muted)', fontWeight: inspGateway === g ? 600 : 400 }}>
                      {g === 'JAZZCASH' ? 'JazzCash' : g === 'EASYPAISA' ? 'Easypaisa' : 'Card'}
                    </button>
                  ))}
                </div>


                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setInspModal(false)} className="n-btn ghost" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                  <button onClick={requestInspection} disabled={inspSending} className="n-btn accent" style={{ flex: 2, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {inspSending ? 'Processing…' : <><Icon name="stamp" /> Pay &amp; request</>}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
