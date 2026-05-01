'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TopBar from '@/components/ui/TopBar';
import Icon from '@/components/ui/Icon';
import { useAuth } from '@/components/auth/AuthProvider';

type LeaseItem = {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  tenantSignedAt: string | null;
  landlordSignedAt: string | null;
  listing: { id: string; title: string; city: string; locality: string };
  landlord: { id: string; name: string | null; phone: string };
};

type ViewingReq = {
  id: string;
  proposedAt: string;
  status: string;
  note: string | null;
  listing: { id: string; title: string; city: string; locality: string };
  conversation: { id: string } | null;
};

type InspectionReq = {
  id: string;
  type: string;
  status: string;
  scheduledAt: string | null;
  feeAmount: number;
  createdAt: string;
  listing: { id: string; title: string; city: string; locality: string };
  inspector: { id: string; name: string | null; phone: string } | null;
};

const VIEWING_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  PENDING:     { label: 'Pending',     bg: 'color-mix(in oklab, var(--n-warn) 18%, transparent)',    color: 'var(--n-warn)' },
  ACCEPTED:    { label: 'Confirmed',   bg: 'var(--n-accent-soft)',                                   color: 'var(--n-accent-ink)' },
  REJECTED:    { label: 'Declined',    bg: 'color-mix(in oklab, var(--n-danger) 12%, transparent)',  color: 'var(--n-danger)' },
  RESCHEDULED: { label: 'Rescheduled', bg: 'color-mix(in oklab, var(--n-warn) 18%, transparent)',    color: 'var(--n-warn)' },
};

const INSP_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  REQUESTED:  { label: 'Requested',   bg: 'color-mix(in oklab, var(--n-warn) 18%, transparent)',    color: 'var(--n-warn)' },
  ASSIGNED:   { label: 'Assigned',    bg: 'var(--n-accent-soft)',                                   color: 'var(--n-accent-ink)' },
  COMPLETED:  { label: 'Completed',   bg: 'color-mix(in oklab, #22c55e 15%, transparent)',          color: '#16a34a' },
  CANCELLED:  { label: 'Cancelled',   bg: 'color-mix(in oklab, var(--n-danger) 12%, transparent)',  color: 'var(--n-danger)' },
};

const TABS = ['Viewings', 'Inspections', 'Leases'] as const;
type Tab = typeof TABS[number];

const LEASE_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  PENDING_SIGNATURES: { label: 'Awaiting signature', bg: 'color-mix(in oklab, var(--n-warn) 18%, transparent)', color: 'var(--n-warn)' },
  SIGNED:      { label: 'Signed',      bg: 'color-mix(in oklab, #22c55e 15%, transparent)', color: '#16a34a' },
  ACTIVE:      { label: 'Active',      bg: 'var(--n-accent-soft)',  color: 'var(--n-accent-ink)' },
  EXPIRED:     { label: 'Expired',     bg: 'var(--n-surface-2)',    color: 'var(--n-muted)' },
  TERMINATED:  { label: 'Terminated',  bg: 'color-mix(in oklab, var(--n-danger) 12%, transparent)', color: 'var(--n-danger)' },
};

export default function ActivityPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>('Viewings');
  const [viewings, setViewings] = useState<ViewingReq[]>([]);
  const [inspections, setInspections] = useState<InspectionReq[]>([]);
  const [leases, setLeases] = useState<LeaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const loadData = useCallback(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      fetch('/api/viewing-requests').then(r => r.json()),
      fetch('/api/inspection-requests').then(r => r.json()),
      fetch('/api/leases').then(r => r.json()),
    ]).then(([vd, id, ld]) => {
      setViewings(vd.viewings ?? []);
      setInspections(id.requests ?? []);
      setLeases(ld.leases ?? []);
    }).finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user && !authLoading) { router.push('/'); return; }
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  useEffect(() => {
    const onFocus = () => loadData();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadData]);

  if (authLoading || (!user && !authLoading)) return null;

  async function cancelViewing(id: string) {
    setCancelling(id);
    await fetch('/api/viewing-requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'REJECTED' }),
    });
    setViewings(vs => vs.map(v => v.id === id ? { ...v, status: 'REJECTED' } : v));
    setCancelling(null);
  }

  const pendingViewings = viewings.filter(v => v.status === 'PENDING').length;
  const activeInspections = inspections.filter(i => i.status === 'REQUESTED' || i.status === 'ASSIGNED').length;

  return (
    <div className="n-root">
      <TopBar />

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px' }}>
        <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6 }}>My activity</div>
        <h1 className="n-display" style={{ fontSize: 44, margin: '0 0 32px', letterSpacing: '-0.02em' }}>Bookings &amp; inspections</h1>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--n-line)', marginBottom: 24 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '10px 20px', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 14, fontWeight: tab === t ? 600 : 400, background: 'transparent',
              color: tab === t ? 'var(--n-ink)' : 'var(--n-muted)',
              borderBottom: `2px solid ${tab === t ? 'var(--n-ink)' : 'transparent'}`,
              marginBottom: -1,
            }}>
              {t}
              {t === 'Viewings' && pendingViewings > 0 && (
                <span className="n-chip" style={{ marginLeft: 8, background: 'var(--n-warn)', color: '#fff', borderColor: 'transparent', fontSize: 10, height: 18, padding: '0 6px' }}>{pendingViewings}</span>
              )}
              {t === 'Inspections' && activeInspections > 0 && (
                <span className="n-chip" style={{ marginLeft: 8, background: 'var(--n-accent)', color: 'var(--n-accent-ink)', borderColor: 'transparent', fontSize: 10, height: 18, padding: '0 6px' }}>{activeInspections}</span>
              )}
              {t === 'Leases' && leases.filter(l => !l.tenantSignedAt).length > 0 && (
                <span className="n-chip" style={{ marginLeft: 8, background: 'var(--n-warn)', color: '#fff', borderColor: 'transparent', fontSize: 10, height: 18, padding: '0 6px' }}>{leases.filter(l => !l.tenantSignedAt).length}</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'grid', gap: 12 }}>
            {[0, 1, 2].map(i => <div key={i} className="n-card" style={{ height: 100, opacity: 0.4 - i * 0.1 }} />)}
          </div>
        ) : tab === 'Viewings' ? (
          viewings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--n-muted)' }}>
              <Icon name="calendar" className="n-ico xl" style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <div style={{ fontWeight: 500, marginBottom: 8 }}>No viewings yet</div>
              <div style={{ fontSize: 14, marginBottom: 24 }}>Request a viewing from any property page.</div>
              <Link href="/search" className="n-btn primary sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Icon name="search" /> Browse listings
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {viewings.map(v => {
                const sc = VIEWING_STATUS[v.status] ?? VIEWING_STATUS.PENDING;
                const dt = new Date(v.proposedAt);
                return (
                  <div key={v.id} className="n-card" style={{ padding: 20, display: 'flex', gap: 16, alignItems: 'center' }}>
                    {/* Date badge */}
                    <div style={{ textAlign: 'center', background: 'var(--n-surface-2)', borderRadius: 10, padding: '8px 12px', minWidth: 56, flexShrink: 0 }}>
                      <div className="n-mono" style={{ fontSize: 10, color: 'var(--n-muted)' }}>{dt.toLocaleDateString('en-PK', { month: 'short' }).toUpperCase()}</div>
                      <div className="n-display" style={{ fontSize: 26, lineHeight: 1 }}>{dt.getDate()}</div>
                      <div className="n-mono" style={{ fontSize: 10, color: 'var(--n-muted)' }}>{dt.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{v.listing.title}</div>
                      <div style={{ fontSize: 13, color: 'var(--n-muted)' }}>{v.listing.locality}, {v.listing.city}</div>
                      {v.note && <div style={{ fontSize: 13, color: 'var(--n-ink)', marginTop: 6, fontStyle: 'italic' }}>"{v.note}"</div>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                      <span className="n-chip" style={{ background: sc.bg, color: sc.color, borderColor: 'transparent' }}>{sc.label}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link href={`/property/${v.listing.id}`} className="n-btn ghost sm">Property</Link>
                        {v.conversation && (
                          <Link href={`/messages/${v.conversation.id}`} className="n-btn ghost sm">Chat</Link>
                        )}
                        {v.status === 'PENDING' && (
                          <button
                            onClick={() => cancelViewing(v.id)}
                            disabled={cancelling === v.id}
                            className="n-btn ghost sm"
                            style={{ color: 'var(--n-danger)' }}
                          >
                            {cancelling === v.id ? '…' : 'Cancel'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : tab === 'Inspections' ? (
          inspections.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--n-muted)' }}>
              <Icon name="stamp" className="n-ico xl" style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <div style={{ fontWeight: 500, marginBottom: 8 }}>No inspections yet</div>
              <div style={{ fontSize: 14, marginBottom: 24 }}>Request an inspection from any property page.</div>
              <Link href="/search" className="n-btn primary sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Icon name="search" /> Browse listings
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {inspections.map(ins => {
                const sc = INSP_STATUS[ins.status] ?? INSP_STATUS.REQUESTED;
                return (
                  <div key={ins.id} className="n-card" style={{ padding: 20, display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--n-surface-2)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <Icon name="stamp" className="n-ico lg" style={{ color: 'var(--n-muted)' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{ins.listing.title}</div>
                      <div style={{ fontSize: 13, color: 'var(--n-muted)' }}>
                        {ins.listing.locality}, {ins.listing.city} · {ins.type.replace('_', '-')} inspection
                      </div>
                      {ins.inspector && (
                        <div style={{ fontSize: 13, color: 'var(--n-accent-ink)', marginTop: 4 }}>
                          Inspector: {ins.inspector.name ?? ins.inspector.phone}
                          {ins.scheduledAt && ` · ${new Date(ins.scheduledAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}`}
                        </div>
                      )}
                      {!ins.inspector && ins.status === 'REQUESTED' && (
                        <div style={{ fontSize: 12, color: 'var(--n-muted)', marginTop: 4 }}>An inspector will be assigned within 24 hours.</div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                      <span className="n-chip" style={{ background: sc.bg, color: sc.color, borderColor: 'transparent' }}>{sc.label}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <span className="n-display" style={{ fontSize: 16 }}>₨ {ins.feeAmount.toLocaleString()}</span>
                        <Link href={`/property/${ins.listing.id}`} className="n-btn ghost sm">Property</Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          leases.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--n-muted)' }}>
              <Icon name="stamp" className="n-ico xl" style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <div style={{ fontWeight: 500, marginBottom: 8 }}>No leases yet</div>
              <div style={{ fontSize: 14 }}>Your landlord will send a lease once you agree on terms.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {leases.map(l => {
                const sc = LEASE_STATUS[l.status] ?? LEASE_STATUS.PENDING_SIGNATURES;
                const mySigned = l.tenantSignedAt;
                return (
                  <div key={l.id} className="n-card" style={{ padding: 20, display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--n-surface-2)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <Icon name="stamp" className="n-ico lg" style={{ color: 'var(--n-muted)' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{l.listing.title}</div>
                      <div style={{ fontSize: 13, color: 'var(--n-muted)' }}>
                        {l.listing.locality}, {l.listing.city} · ₨ {l.monthlyRent.toLocaleString()}/mo
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--n-muted)', marginTop: 3 }}>
                        {new Date(l.startDate).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })} →{' '}
                        {new Date(l.endDate).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                      <span className="n-chip" style={{ background: sc.bg, color: sc.color, borderColor: 'transparent' }}>{sc.label}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link href={`/leases/${l.id}`} className={mySigned ? 'n-btn ghost sm' : 'n-btn primary sm'}>
                          {mySigned ? 'View' : 'Review & sign'}
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}
