'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/ui/TopBar';
import Icon from '@/components/ui/Icon';
import TrustBadge from '@/components/ui/TrustBadge';
import TrustScore from '@/components/ui/TrustScore';
import { useAuth } from '@/components/auth/AuthProvider';

type Photo = { url: string; isCover: boolean };
type DashListing = {
  id: string;
  title: string;
  locality: string;
  city: string;
  rentAmount: number;
  status: string;
  createdAt: string;
  ownerVerified: boolean;
  isBoosted: boolean;
  photos: Photo[];
  _count: { conversations: number };
};
type ConvMsg = { body: string; createdAt: string; senderId: string };
type ConvParticipant = { user: { id: string; name?: string; phone: string } };
type DashConv = {
  id: string;
  listing: { id: string; title: string };
  participants: ConvParticipant[];
  messages: ConvMsg[];
};
type ViewingReq = {
  id: string;
  proposedAt: string;
  status: string;
  note: string | null;
  listing: { id: string; title: string; city: string; locality: string };
  requester: { id: string; name?: string; phone: string; verificationTier: string };
  conversation: { id: string } | null;
};
type DashData = {
  stats: { total: number; active: number; draft: number; unread: number; pendingViewings: number };
  listings: DashListing[];
  conversations: DashConv[];
};

const NAV_ITEMS = [
  { k: 'Overview',     ico: 'home' as const,     key: 'overview' },
  { k: 'Listings',     ico: 'file' as const,      key: 'listings' },
  { k: 'Messages',     ico: 'chat' as const,      key: 'messages', href: '/messages' },
  { k: 'Viewings',     ico: 'calendar' as const,  key: 'viewings' },
  { k: 'Settings',     ico: 'user' as const,      key: 'settings' },
];


function StatusChip({ status }: { status: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    ACTIVE:  { bg: 'var(--n-accent-soft)', color: 'var(--n-accent-ink)' },
    DRAFT:   { bg: 'var(--n-surface-2)',   color: 'var(--n-muted)' },
    PAUSED:  { bg: 'color-mix(in oklab, var(--n-warn) 18%, transparent)', color: 'var(--n-warn)' },
    REMOVED: { bg: 'color-mix(in oklab, var(--n-danger) 12%, transparent)', color: 'var(--n-danger)' },
  };
  const c = colors[status] ?? colors.DRAFT;
  return (
    <span className="n-chip" style={{ background: c.bg, color: c.color, borderColor: 'transparent' }}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

async function patchListing(id: string, data: Record<string, unknown>) {
  return fetch(`/api/listings/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState('overview');
  const [viewings, setViewings] = useState<ViewingReq[]>([]);
  const [viewingsLoading, setViewingsLoading] = useState(false);
  const [actioning, setActioning] = useState<string | null>(null);
  const [boostModal, setBoostModal] = useState<string | null>(null); // listingId
  const [boostSuccess, setBoostSuccess] = useState(false);
  const [boostGateway, setBoostGateway] = useState<'JAZZCASH' | 'EASYPAISA' | 'CARD'>('JAZZCASH');
  const [boosting, setBoosting] = useState(false);
  const [leaseModal, setLeaseModal] = useState<string | null>(null); // listingId
  const [leaseTenantPhone, setLeaseTenantPhone] = useState('');
  const [leaseStart, setLeaseStart] = useState('');
  const [leaseEnd, setLeaseEnd] = useState('');
  const [leaseDeposit, setLeaseDeposit] = useState('');
  const [leaseCreating, setLeaseCreating] = useState(false);
  const [leaseCreated, setLeaseCreated] = useState<string | null>(null); // lease id
  const [editModal, setEditModal] = useState<DashListing | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editLocality, setEditLocality] = useState('');
  const [editRent, setEditRent] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editFurnishing, setEditFurnishing] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editPhotos, setEditPhotos] = useState<{ id: string; url: string; isCover: boolean }[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  function openEdit(l: DashListing) {
    setEditModal(l);
    setEditTitle(l.title);
    setEditLocality(l.locality);
    setEditRent(String(l.rentAmount));
    setEditDesc('');
    setEditFurnishing('');
    setEditPhotos(l.photos.map((p, i) => ({ id: String(i), url: p.url, isCover: p.isCover })));
    fetch(`/api/listings/${l.id}/photos`).then(r => r.json()).then(d => {
      if (d.photos) setEditPhotos(d.photos);
    }).catch(() => {});
  }

  async function uploadEditPhotos(files: FileList | null) {
    if (!files || !editModal) return;
    setUploadingPhotos(true);
    const fd = new FormData();
    Array.from(files).forEach(f => fd.append('photos', f));
    const res = await fetch(`/api/listings/${editModal.id}/photos`, { method: 'POST', body: fd });
    if (res.ok) {
      const refreshed = await fetch(`/api/listings/${editModal.id}/photos`).then(r => r.json());
      if (refreshed.photos) setEditPhotos(refreshed.photos);
      await load();
    }
    setUploadingPhotos(false);
  }

  async function deleteEditPhoto(photoId: string) {
    if (!editModal) return;
    setEditPhotos(prev => prev.filter(p => p.id !== photoId));
    await fetch(`/api/listings/${editModal.id}/photos`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoId }),
    });
    await load();
  }

  async function saveEdit() {
    if (!editModal || editSaving) return;
    setEditSaving(true);
    const body: Record<string, unknown> = {};
    if (editTitle.trim())    body.title      = editTitle.trim();
    if (editLocality.trim()) body.locality   = editLocality.trim();
    if (editRent)            body.rentAmount = parseInt(editRent);
    if (editDesc.trim())     body.description = editDesc.trim();
    if (editFurnishing)      body.furnishing  = editFurnishing;
    await patchListing(editModal.id, body);
    await load();
    setEditModal(null);
    setEditSaving(false);
  }

  async function boost() {
    if (!boostModal) return;
    setBoosting(true);
    await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'BOOST', listingId: boostModal, gateway: boostGateway }),
    });
    await load();
    setBoostModal(null);
    setBoosting(false);
    setBoostSuccess(true);
    setTimeout(() => setBoostSuccess(false), 5000);
  }

  async function createLease() {
    if (!leaseModal || !leaseTenantPhone.trim() || !leaseStart || !leaseEnd || !leaseDeposit) return;
    setLeaseCreating(true);
    // Look up tenant by phone
    const userRes = await fetch(`/api/admin/users`).then(r => r.json());
    const tenant = (userRes.users ?? []).find((u: { phone: string; id: string }) => u.phone.replace(/\s/g, '') === leaseTenantPhone.replace(/\s/g, ''));
    if (!tenant) { alert('No user found with that phone number.'); setLeaseCreating(false); return; }
    const listing = data?.listings?.find((l: { id: string; rentAmount: number }) => l.id === leaseModal);
    const res = await fetch('/api/leases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId: leaseModal, tenantId: tenant.id, startDate: leaseStart, endDate: leaseEnd, monthlyRent: listing?.rentAmount ?? 0, securityDeposit: parseInt(leaseDeposit) }),
    });
    if (res.ok) {
      const d = await res.json();
      setLeaseCreated(d.lease.id);
    }
    setLeaseCreating(false);
  }

  async function load() {
    const res = await fetch('/api/dashboard');
    if (res.status === 401) { router.push('/'); return; }
    const d = await res.json();
    setData(d);
  }

  async function loadViewings() {
    setViewingsLoading(true);
    const res = await fetch('/api/viewing-requests');
    if (res.ok) {
      const d = await res.json();
      setViewings(d.viewings ?? []);
    }
    setViewingsLoading(false);
  }

  async function actOnViewing(id: string, status: 'ACCEPTED' | 'REJECTED') {
    setActioning(id);
    await fetch('/api/viewing-requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    await Promise.all([loadViewings(), load()]);
    setActioning(null);
  }

  useEffect(() => {
    if (!user && !authLoading) { router.push('/'); return; }
    if (!user) return;
    load().finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  useEffect(() => {
    if (activeNav === 'viewings') loadViewings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNav]);

  if (authLoading || loading) {
    return (
      <div className="n-root">
        <TopBar role="landlord" />
        <div style={{ display: 'grid', placeItems: 'center', height: '60vh', color: 'var(--n-muted)' }}>
          <span className="n-mono">Loading…</span>
        </div>
      </div>
    );
  }

  if (!user || !data) return null;

  const { stats, listings, conversations } = data;
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user.name?.split(' ')[0] ?? 'there';

  return (
    <div className="n-root">
      <TopBar role="landlord" />

      <div className="n-dash-layout" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: 'calc(100vh - 65px)' }}>
        {/* Sidebar / mobile tab bar */}
        <div className="n-dash-sidebar" style={{ padding: '24px 18px', borderRight: '1px solid var(--n-line)', background: 'var(--n-bg-2)' }}>
          <div className="n-mono" style={{ color: 'var(--n-muted)', padding: '0 10px 10px' }}>Landlord</div>
          {NAV_ITEMS.map(it => {
            const on = activeNav === it.key;
            const el = (
              <div
                key={it.k}
                onClick={() => it.href ? router.push(it.href) : setActiveNav(it.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 10, marginBottom: 2, cursor: 'pointer',
                  background: on ? 'var(--n-surface)' : 'transparent',
                  border: `1px solid ${on ? 'var(--n-line)' : 'transparent'}`,
                  fontSize: 14,
                }}
              >
                <Icon name={it.ico} />
                <span style={{ flex: 1, fontWeight: on ? 500 : 400 }}>{it.k}</span>
                {it.key === 'messages' && stats.unread > 0 && (
                  <span className="n-chip" style={{ height: 20, fontSize: 10.5, padding: '0 7px', background: 'var(--n-accent)', color: 'var(--n-accent-ink)', borderColor: 'transparent' }}>{stats.unread}</span>
                )}
                {it.key === 'listings' && (
                  <span className="n-chip" style={{ height: 20, fontSize: 10.5, padding: '0 7px' }}>{stats.total}</span>
                )}
                {it.key === 'viewings' && stats.pendingViewings > 0 && (
                  <span className="n-chip" style={{ height: 20, fontSize: 10.5, padding: '0 7px', background: 'var(--n-warn)', color: '#fff', borderColor: 'transparent' }}>{stats.pendingViewings}</span>
                )}
              </div>
            );
            return el;
          })}

          <div className="n-dash-trust n-card" style={{ marginTop: 24, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <TrustScore value={
                40
                + (user.verificationTier === 'VERIFIED' ? 25 : user.verificationTier === 'STANDARD' ? 10 : 0)
                + (stats.active > 0 ? 10 : 0)
              } size={44} />
              <div>
                <div className="n-mono" style={{ color: 'var(--n-muted)' }}>Your trust</div>
                <div style={{ fontSize: 13, fontWeight: 500, marginTop: 2 }}>
                  {stats.active > 0 ? 'Active landlord' : 'No listings yet'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="n-dash-main" style={{ padding: '28px 32px', overflowY: 'auto' }}>

          {/* ── Viewings tab ── */}
          {activeNav === 'viewings' && (
            <div>
              <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6 }}>Schedule</div>
              <h2 className="n-display" style={{ fontSize: 40, margin: '0 0 24px', letterSpacing: '-0.02em' }}>Viewing requests</h2>

              {viewingsLoading ? (
                <div style={{ color: 'var(--n-muted)', textAlign: 'center', padding: 40 }}>
                  <span className="n-mono">Loading…</span>
                </div>
              ) : viewings.length === 0 ? (
                <div className="n-card" style={{ padding: 40, textAlign: 'center', color: 'var(--n-muted)' }}>
                  <Icon name="calendar" className="n-ico xl" style={{ margin: '0 auto 12px' }} />
                  <div>No viewing requests yet.</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {viewings.map(v => {
                    const isPending = v.status === 'PENDING';
                    const dt = new Date(v.proposedAt);
                    const dateStr = dt.toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
                    const timeStr = dt.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
                    const statusColors: Record<string, { bg: string; color: string }> = {
                      PENDING:  { bg: 'color-mix(in oklab, var(--n-warn) 18%, transparent)', color: 'var(--n-warn)' },
                      ACCEPTED: { bg: 'var(--n-accent-soft)', color: 'var(--n-accent-ink)' },
                      REJECTED: { bg: 'color-mix(in oklab, var(--n-danger) 12%, transparent)', color: 'var(--n-danger)' },
                    };
                    const sc = statusColors[v.status] ?? statusColors.PENDING;
                    return (
                      <div key={v.id} className="n-card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 18 }}>
                        {/* Date badge */}
                        <div style={{ textAlign: 'center', background: 'var(--n-surface-2)', borderRadius: 10, padding: '10px 14px', minWidth: 64, flexShrink: 0 }}>
                          <div className="n-mono" style={{ fontSize: 11, color: 'var(--n-muted)' }}>{dt.toLocaleDateString('en-PK', { month: 'short' }).toUpperCase()}</div>
                          <div className="n-display" style={{ fontSize: 28, lineHeight: 1 }}>{dt.getDate()}</div>
                          <div className="n-mono" style={{ fontSize: 11, color: 'var(--n-muted)' }}>{timeStr}</div>
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>
                            {v.requester.name ?? v.requester.phone}
                            {v.requester.verificationTier === 'VERIFIED' && (
                              <span className="n-chip verified" style={{ marginLeft: 8, fontSize: 11 }}>NADRA ✓</span>
                            )}
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--n-muted)', marginTop: 2 }}>{v.listing.title} · {v.listing.locality}</div>
                          <div style={{ fontSize: 12, color: 'var(--n-muted)', marginTop: 2 }}>{dateStr}</div>
                          {v.note && <div style={{ fontSize: 13, color: 'var(--n-ink)', marginTop: 6, fontStyle: 'italic' }}>"{v.note}"</div>}
                        </div>

                        {/* Status + actions */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                          <span className="n-chip" style={{ background: sc.bg, color: sc.color, borderColor: 'transparent' }}>
                            {v.status.charAt(0) + v.status.slice(1).toLowerCase()}
                          </span>
                          {isPending && (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                onClick={() => actOnViewing(v.id, 'REJECTED')}
                                disabled={actioning === v.id}
                                className="n-btn ghost sm"
                                style={{ color: 'var(--n-danger)' }}
                              >
                                Decline
                              </button>
                              <button
                                onClick={() => actOnViewing(v.id, 'ACCEPTED')}
                                disabled={actioning === v.id}
                                className="n-btn accent sm"
                                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                              >
                                {actioning === v.id ? '…' : <><Icon name="check" /> Accept</>}
                              </button>
                            </div>
                          )}
                          {v.conversation && (
                            <Link href={`/messages/${v.conversation.id}`} className="n-btn ghost sm" style={{ fontSize: 12 }}>
                              Open chat
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Listings tab ── */}
          {activeNav === 'listings' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                  <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 4 }}>Manage</div>
                  <h2 className="n-display" style={{ fontSize: 36, margin: 0, letterSpacing: '-0.02em' }}>Your listings</h2>
                </div>
                <Link href="/list-property" className="n-btn accent sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="plus" /> New listing
                </Link>
              </div>
              {listings.length === 0 ? (
                <div className="n-card" style={{ padding: 48, textAlign: 'center', color: 'var(--n-muted)' }}>
                  <Icon name="home" className="n-ico xl" style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                  <div style={{ fontWeight: 500, marginBottom: 8 }}>No listings yet</div>
                  <Link href="/list-property" className="n-btn primary sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <Icon name="plus" /> Create first listing
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {listings.map(l => {
                    const cover = l.photos[0]?.url;
                    return (
                      <div key={l.id} className="n-card" style={{ padding: 20, display: 'flex', gap: 16, alignItems: 'center' }}>
                        <div style={{ width: 80, height: 60, borderRadius: 10, background: cover ? `url(${cover}) center/cover` : 'var(--n-surface-2)', flexShrink: 0, display: cover ? undefined : 'grid', placeItems: cover ? undefined : 'center' }}>
                          {!cover && <Icon name="camera" style={{ color: 'var(--n-muted)' }} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</div>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                            <StatusChip status={l.status} />
                            <span className="n-mono" style={{ color: 'var(--n-muted)', fontSize: 12 }}>{l.locality}, {l.city}</span>
                            <span className="n-mono" style={{ color: 'var(--n-muted)', fontSize: 12 }}>{l._count.conversations} enquiries</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0, marginRight: 8 }}>
                          <div className="n-display" style={{ fontSize: 20 }}>₨ {(l.rentAmount / 1000).toFixed(0)}k</div>
                          <div className="n-mono" style={{ color: 'var(--n-muted)', fontSize: 11 }}>per month</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          <Link href={`/property/${l.id}`} className="n-btn ghost sm">View</Link>
                          <button className="n-btn ghost sm" onClick={() => openEdit(l)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Icon name="file" /> Edit
                          </button>
                          {l.status === 'ACTIVE' ? (
                            <button className="n-btn ghost sm" onClick={async () => { await patchListing(l.id, { status: 'PAUSED' }); load(); }}>Pause</button>
                          ) : l.status === 'PAUSED' || l.status === 'DRAFT' ? (
                            <button className="n-btn ghost sm" onClick={async () => { await patchListing(l.id, { status: 'ACTIVE' }); load(); }}>Activate</button>
                          ) : null}
                          {!l.isBoosted && l.status === 'ACTIVE' && (
                            <button className="n-btn ghost sm" onClick={() => setBoostModal(l.id)} style={{ color: 'var(--n-accent-ink)', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Icon name="zap" /> Boost
                            </button>
                          )}
                          {l.status === 'ACTIVE' && (
                            <button className="n-btn ghost sm" onClick={() => { setLeaseModal(l.id); setLeaseCreated(null); setLeaseTenantPhone(''); setLeaseStart(''); setLeaseEnd(''); setLeaseDeposit(''); }} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Icon name="stamp" /> Lease
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Settings tab ── */}
          {activeNav === 'settings' && (
            <div>
              <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 4 }}>Configuration</div>
              <h2 className="n-display" style={{ fontSize: 36, margin: '0 0 24px', letterSpacing: '-0.02em' }}>Settings</h2>
              <div style={{ display: 'grid', gap: 12 }}>
                <div className="n-card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--n-accent-soft)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Icon name="user" className="n-ico lg" style={{ color: 'var(--n-accent-ink)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>Profile &amp; verification</div>
                    <div style={{ fontSize: 13, color: 'var(--n-muted)', marginTop: 2 }}>Update your name, upload CNIC, manage your identity tier</div>
                  </div>
                  <Link href="/account" className="n-btn ghost sm">Open</Link>
                </div>
                <div className="n-card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--n-surface-2)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Icon name="chat" className="n-ico lg" style={{ color: 'var(--n-muted)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>Messages</div>
                    <div style={{ fontSize: 13, color: 'var(--n-muted)', marginTop: 2 }}>View all tenant conversations and enquiries</div>
                  </div>
                  <Link href="/messages" className="n-btn ghost sm">Open</Link>
                </div>
                <div className="n-card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--n-surface-2)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Icon name="shield" className="n-ico lg" style={{ color: 'var(--n-muted)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>Verification tier</div>
                    <div style={{ fontSize: 13, color: 'var(--n-muted)', marginTop: 2 }}>
                      Current tier: <strong>{user.verificationTier}</strong> — {user.verificationTier === 'BASIC' ? 'Upload CNIC to upgrade' : user.verificationTier === 'STANDARD' ? 'Pending NADRA confirmation' : 'Fully verified ✓'}
                    </div>
                  </div>
                  {user.verificationTier === 'BASIC' && <Link href="/account#cnic" className="n-btn primary sm">Verify</Link>}
                </div>
                <div className="n-card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--n-surface-2)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Icon name="file" className="n-ico lg" style={{ color: 'var(--n-muted)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>Leases</div>
                    <div style={{ fontSize: 13, color: 'var(--n-muted)', marginTop: 2 }}>Create and manage digital lease agreements with tenants</div>
                  </div>
                  <Link href="/activity" className="n-btn ghost sm">View</Link>
                </div>
              </div>
            </div>
          )}

          {/* ── Overview tab ── */}
          {(activeNav === 'overview') && (<><div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div className="n-mono" style={{ color: 'var(--n-muted)' }}>{greeting}</div>
              <h2 className="n-display" style={{ fontSize: 40, margin: '6px 0 0', letterSpacing: '-0.02em' }}>
                {firstName} — {stats.active > 0 ? `${stats.active} active listing${stats.active > 1 ? 's' : ''}` : 'no active listings yet'}.
              </h2>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link href="/messages" className="n-btn ghost sm" style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
                <Icon name="chat" /> Messages
                {stats.unread > 0 && (
                  <span style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 999, background: 'var(--n-accent)', color: 'var(--n-accent-ink)', fontSize: 9, display: 'grid', placeItems: 'center', fontWeight: 700 }}>{stats.unread}</span>
                )}
              </Link>
              <Link href="/list-property" className="n-btn accent sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="plus" /> New listing
              </Link>
            </div>
          </div>

          {/* Stats row */}
          <div className="n-stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 24 }}>
            {[
              { k: 'Active listings',    v: String(stats.active),         d: `${stats.draft} draft${stats.draft !== 1 ? 's' : ''}` },
              { k: 'Total listings',     v: String(stats.total),          d: 'All time' },
              { k: 'Unread messages',    v: String(stats.unread),         d: 'Awaiting reply' },
              { k: 'Pending viewings',   v: String(stats.pendingViewings), d: 'Need confirmation' },
            ].map(s => (
              <div key={s.k} className="n-card" style={{ padding: 20 }}>
                <div className="n-mono" style={{ color: 'var(--n-muted)' }}>{s.k}</div>
                <div className="n-display" style={{ fontSize: 40, letterSpacing: '-0.02em', lineHeight: 1, marginTop: 10 }}>{s.v}</div>
                <div style={{ fontSize: 12, color: 'var(--n-muted)', marginTop: 8 }}>{s.d}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, marginTop: 20 }}>
            {/* Listings table */}
            <div className="n-card" style={{ padding: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
                <div style={{ fontWeight: 500 }}>Your listings</div>
                <Link href="/list-property" className="n-btn ghost sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="plus" /> Add
                </Link>
              </div>
              <div className="n-divider" />

              {listings.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--n-muted)' }}>
                  <div style={{ marginBottom: 12 }}>No listings yet.</div>
                  <Link href="/list-property" className="n-btn primary sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Icon name="plus" /> Create first listing
                  </Link>
                </div>
              ) : (
                listings.map((l, i) => {
                  const cover = l.photos[0]?.url;
                  return (
                    <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderTop: i === 0 ? 'none' : '1px solid var(--n-line)' }}>
                      <div style={{ width: 70, height: 52, borderRadius: 8, background: cover ? `url(${cover}) center/cover` : 'var(--n-surface-2)', flexShrink: 0, display: cover ? undefined : 'grid', placeItems: cover ? undefined : 'center' }}>
                        {!cover && <Icon name="camera" style={{ color: 'var(--n-muted)' }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                          <StatusChip status={l.status} />
                          {l.ownerVerified && <TrustBadge kind="owner" size="sm" />}
                          <span className="n-mono" style={{ color: 'var(--n-muted)' }}>{l._count.conversations} enquiries</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', minWidth: 90, flexShrink: 0 }}>
                        <div className="n-display" style={{ fontSize: 18 }}>₨ {(l.rentAmount / 1000).toFixed(0)}k</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <Link href={`/property/${l.id}`} className="n-btn ghost sm">View</Link>
                        {l.status === 'ACTIVE' ? (
                          <button className="n-btn ghost sm" onClick={async () => { await patchListing(l.id, { status: 'PAUSED' }); load(); }}>Pause</button>
                        ) : l.status === 'PAUSED' || l.status === 'DRAFT' ? (
                          <button className="n-btn ghost sm" onClick={async () => { await patchListing(l.id, { status: 'ACTIVE' }); load(); }}>Activate</button>
                        ) : null}
                        {!l.isBoosted && l.status === 'ACTIVE' && (
                          <button
                            className="n-btn ghost sm"
                            onClick={() => setBoostModal(l.id)}
                            style={{ color: 'var(--n-accent-ink)', display: 'flex', alignItems: 'center', gap: 4 }}
                          >
                            <Icon name="zap" /> Boost
                          </button>
                        )}
                        {l.status === 'ACTIVE' && (
                          <button
                            className="n-btn ghost sm"
                            onClick={() => { setLeaseModal(l.id); setLeaseCreated(null); setLeaseTenantPhone(''); setLeaseStart(''); setLeaseEnd(''); setLeaseDeposit(''); }}
                            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                          >
                            <Icon name="stamp" /> Lease
                          </button>
                        )}
                        {l.isBoosted && (
                          <span className="n-chip" style={{ background: 'var(--n-accent-soft)', color: 'var(--n-accent-ink)', borderColor: 'transparent', fontSize: 11 }}>
                            <Icon name="zap" /> Boosted
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right column */}
            <div style={{ display: 'grid', gap: 12 }}>
              {/* Recent messages */}
              <div className="n-card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontWeight: 500 }}>Recent messages</div>
                  <Link href="/messages" className="n-btn ghost sm">View all</Link>
                </div>
                {conversations.length === 0 ? (
                  <div style={{ color: 'var(--n-muted)', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>No messages yet</div>
                ) : (
                  conversations.slice(0, 3).map((conv, i) => {
                    const other = conv.participants.find(p => p.user.id !== user.id);
                    const otherName = other?.user.name ?? other?.user.phone ?? 'Tenant';
                    const lastMsg = conv.messages[0];
                    return (
                      <Link key={conv.id} href={`/messages/${conv.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: i === 0 ? 'none' : '1px solid var(--n-line)', textDecoration: 'none', color: 'var(--n-ink)' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 999, background: 'var(--n-accent-soft)', color: 'var(--n-accent-ink)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                          {otherName[0]?.toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{otherName}</div>
                          {lastMsg && <div className="n-mono" style={{ color: 'var(--n-muted)', fontSize: 11, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{lastMsg.body}</div>}
                        </div>
                        <Icon name="chevronRight" className="n-ico" style={{ color: 'var(--n-muted)', flexShrink: 0 }} />
                      </Link>
                    );
                  })
                )}
              </div>

              {/* Enquiry summary */}
              <div className="n-card" style={{ padding: 20 }}>
                <div style={{ fontWeight: 500, marginBottom: 16 }}>Enquiry summary</div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {[
                    { label: 'Total conversations', value: conversations.length },
                    { label: 'Unread messages',     value: stats.unread },
                    { label: 'Pending viewings',    value: stats.pendingViewings },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--n-line)' }}>
                      <span style={{ fontSize: 13, color: 'var(--n-muted)' }}>{row.label}</span>
                      <span className="n-display" style={{ fontSize: 22 }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          {stats.total === 0 && (
            <div className="n-card" style={{ marginTop: 16, padding: 28, display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, background: 'var(--n-accent-soft)', display: 'grid', placeItems: 'center' }}>
                <Icon name="home" className="n-ico xl" style={{ color: 'var(--n-accent-ink)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 16 }}>List your first property</div>
                <div style={{ color: 'var(--n-muted)', fontSize: 13, marginTop: 4 }}>
                  It takes under 5 minutes. Add photos, set your rent, and go live.
                </div>
              </div>
              <Link href="/list-property" className="n-btn accent" style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <Icon name="plus" /> Create listing
              </Link>
            </div>
          )}
          </>)}
        </div>
      </div>

      {/* Boost modal */}
      {boostModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => setBoostModal(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
          <div className="n-card" style={{ position: 'relative', width: 400, padding: 32, zIndex: 1 }}>
            <button onClick={() => setBoostModal(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--n-muted)' }}>
              <Icon name="close" className="n-ico lg" />
            </button>
            <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6 }}>Feature your listing</div>
            <h2 className="n-display" style={{ fontSize: 28, margin: '0 0 4px' }}>Boost for 7 days</h2>
            <div style={{ fontSize: 13, color: 'var(--n-muted)', marginBottom: 24 }}>
              Your listing appears at the top of search results and gets a Featured badge.
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, padding: '14px 16px', borderRadius: 10, background: 'var(--n-surface-2)' }}>
              <span style={{ fontSize: 14 }}>Boost fee · 7 days</span>
              <span className="n-display" style={{ fontSize: 24 }}>₨ 500</span>
            </div>

            <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 8 }}>Pay via</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
              {(['JAZZCASH', 'EASYPAISA', 'CARD'] as const).map(g => (
                <button
                  key={g}
                  onClick={() => setBoostGateway(g)}
                  style={{
                    padding: '10px 0', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                    fontFamily: 'var(--mono)', fontWeight: boostGateway === g ? 600 : 400,
                    border: `1.5px solid ${boostGateway === g ? 'var(--n-accent)' : 'var(--n-line)'}`,
                    background: boostGateway === g ? 'var(--n-accent-soft)' : 'var(--n-surface-2)',
                    color: boostGateway === g ? 'var(--n-accent-ink)' : 'var(--n-muted)',
                  }}
                >
                  {g === 'JAZZCASH' ? 'JazzCash' : g === 'EASYPAISA' ? 'Easypaisa' : 'Card'}
                </button>
              ))}
            </div>


            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setBoostModal(null)} className="n-btn ghost" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              <button
                onClick={boost}
                disabled={boosting}
                className="n-btn accent"
                style={{ flex: 2, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {boosting ? 'Processing…' : <><Icon name="zap" /> Pay ₨ 500 &amp; boost</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Boost success toast */}
      {boostSuccess && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 300, background: 'var(--n-ink)', color: 'var(--n-bg)', padding: '12px 20px', borderRadius: 999, fontSize: 14, fontWeight: 500, boxShadow: '0 10px 40px rgba(0,0,0,.3)', display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap' }}>
          <Icon name="zap" /> Listing boosted for 7 days — it now appears at the top of search results.
        </div>
      )}

      {/* Lease modal */}
      {leaseModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => setLeaseModal(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
          <div className="n-card" style={{ position: 'relative', width: 480, padding: 28, zIndex: 1 }}>
            <button onClick={() => setLeaseModal(null)} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--n-muted)' }}>
              <Icon name="close" className="n-ico lg" />
            </button>
            <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 4 }}>New lease agreement</div>
            <h3 className="n-display" style={{ fontSize: 26, margin: '0 0 20px' }}>Draft a lease</h3>

            {leaseCreated ? (
              <div>
                <div style={{ padding: '16px', borderRadius: 12, background: 'color-mix(in oklab, #22c55e 15%, transparent)', color: '#16a34a', fontWeight: 500, marginBottom: 16 }}>
                  ✓ Lease created. Share the link with your tenant to sign.
                </div>
                <a
                  href={`/leases/${leaseCreated}`}
                  target="_blank"
                  rel="noreferrer"
                  className="n-btn primary"
                  style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Icon name="arrow" /> Open lease →
                </a>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 14 }}>
                {[
                  { label: "Tenant's phone number", value: leaseTenantPhone, set: setLeaseTenantPhone, placeholder: '03XX-XXXXXXX', type: 'text' },
                  { label: 'Start date', value: leaseStart, set: setLeaseStart, placeholder: '', type: 'date' },
                  { label: 'End date', value: leaseEnd, set: setLeaseEnd, placeholder: '', type: 'date' },
                  { label: 'Security deposit (₨)', value: leaseDeposit, set: setLeaseDeposit, placeholder: 'e.g. 130000', type: 'number' },
                ].map(f => (
                  <div key={f.label}>
                    <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6 }}>{f.label}</div>
                    <input
                      type={f.type}
                      value={f.value}
                      onChange={e => f.set(e.target.value)}
                      placeholder={f.placeholder}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--n-line)', background: 'var(--n-surface-2)', color: 'var(--n-ink)', fontFamily: 'inherit', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
                <button
                  onClick={createLease}
                  disabled={leaseCreating || !leaseTenantPhone || !leaseStart || !leaseEnd || !leaseDeposit}
                  className="n-btn primary"
                  style={{ width: '100%', justifyContent: 'center', height: 44, marginTop: 4 }}
                >
                  {leaseCreating ? 'Creating…' : <><Icon name="check" /> Create lease</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit listing modal */}
      {editModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => setEditModal(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
          <div className="n-card" style={{ position: 'relative', width: 480, padding: 28, zIndex: 1, maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setEditModal(null)} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--n-muted)' }}>
              <Icon name="close" className="n-ico lg" />
            </button>
            <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 4 }}>Edit listing</div>
            <h3 className="n-display" style={{ fontSize: 24, margin: '0 0 20px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{editModal.title}</h3>
            <div style={{ display: 'grid', gap: 14 }}>
              {[
                { label: 'Title', val: editTitle, set: setEditTitle, placeholder: editModal.title },
                { label: 'Locality', val: editLocality, set: setEditLocality, placeholder: editModal.locality },
                { label: 'Monthly rent (₨)', val: editRent, set: setEditRent, placeholder: String(editModal.rentAmount), type: 'number' },
              ].map(f => (
                <div key={f.label}>
                  <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6 }}>{f.label}</div>
                  <input
                    type={f.type ?? 'text'}
                    value={f.val}
                    onChange={e => f.set(e.target.value)}
                    placeholder={f.placeholder}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--n-line)', background: 'var(--n-surface-2)', color: 'var(--n-ink)', fontFamily: 'inherit', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }}
                  />
                </div>
              ))}
              <div>
                <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6 }}>Description</div>
                <textarea
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  placeholder="Update description…"
                  rows={3}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--n-line)', background: 'var(--n-surface-2)', color: 'var(--n-ink)', fontFamily: 'inherit', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box' as const }}
                />
              </div>
              <div>
                <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6 }}>Furnishing</div>
                <select
                  value={editFurnishing}
                  onChange={e => setEditFurnishing(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--n-line)', background: 'var(--n-surface-2)', color: 'var(--n-ink)', fontFamily: 'inherit', fontSize: 14, outline: 'none' }}
                >
                  <option value="">— no change —</option>
                  {['Furnished', 'Semi-furnished', 'Unfurnished'].map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              {/* Photo management */}
              <div>
                <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 8 }}>Photos</div>
                {editPhotos.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 8 }}>
                    {editPhotos.map(ph => (
                      <div key={ph.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', background: `url(${ph.url}) center/cover` }}>
                        {ph.isCover && (
                          <span className="n-mono" style={{ position: 'absolute', top: 4, left: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 9, padding: '2px 5px', borderRadius: 4 }}>Cover</span>
                        )}
                        <button
                          onClick={() => deleteEditPhoto(ph.id)}
                          style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 999, background: 'rgba(0,0,0,0.55)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 12, display: 'grid', placeItems: 'center' }}
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 10, border: '1.5px dashed var(--n-line-2)', cursor: 'pointer', fontSize: 13, color: 'var(--n-muted)' }}>
                  <Icon name="camera" />
                  {uploadingPhotos ? 'Uploading…' : 'Add photos'}
                  <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => uploadEditPhotos(e.target.files)} disabled={uploadingPhotos} />
                </label>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button onClick={() => setEditModal(null)} className="n-btn ghost" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button onClick={saveEdit} disabled={editSaving} className="n-btn primary" style={{ flex: 2, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {editSaving ? 'Saving…' : <><Icon name="check" /> Save changes</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
