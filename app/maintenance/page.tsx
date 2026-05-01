'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/ui/TopBar';
import Icon from '@/components/ui/Icon';
import { useAuth } from '@/components/auth/AuthProvider';

type Request = {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  landlordNote: string | null;
  photoUrls: string[];
  createdAt: string;
  resolvedAt: string | null;
  listing: { id: string; title: string; city: string; locality: string };
  tenant: { id: string; name: string | null; phone: string };
};

const CATEGORIES = ['Plumbing', 'Electrical', 'Gas', 'Structural', 'Pest Control', 'Other'];
const PRIORITIES  = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  OPEN:        { label: 'Open',        bg: 'color-mix(in oklab,var(--n-warn) 18%,transparent)', color: 'var(--n-warn)' },
  IN_PROGRESS: { label: 'In progress', bg: 'color-mix(in oklab,var(--n-accent) 18%,transparent)', color: 'var(--n-accent-ink)' },
  RESOLVED:    { label: 'Resolved',    bg: 'var(--n-accent-soft)', color: 'var(--n-accent-ink)' },
  CLOSED:      { label: 'Closed',      bg: 'var(--n-surface-2)', color: 'var(--n-muted)' },
};

const PRIORITY_META: Record<string, { label: string; color: string }> = {
  LOW:    { label: 'Low',    color: 'var(--n-muted)' },
  NORMAL: { label: 'Normal', color: 'var(--n-ink)' },
  HIGH:   { label: 'High',   color: 'var(--n-warn)' },
  URGENT: { label: 'Urgent', color: 'var(--n-danger)' },
};

function Chip({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META.OPEN;
  return (
    <span className="n-chip" style={{ background: m.bg, color: m.color, borderColor: 'transparent' }}>{m.label}</span>
  );
}

export default function MaintenancePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('ALL'); // ALL | OPEN | IN_PROGRESS | RESOLVED | CLOSED

  // New request form (tenant)
  const [showForm,    setShowForm]    = useState(false);
  const [formTitle,   setFormTitle]   = useState('');
  const [formDesc,    setFormDesc]    = useState('');
  const [formCat,     setFormCat]     = useState('');
  const [formPri,     setFormPri]     = useState('NORMAL');
  const [formListing, setFormListing] = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [submitMsg,   setSubmitMsg]   = useState('');

  // Landlord actions
  const [updating, setUpdating] = useState<string | null>(null);

  // Tenant's active leases (to know which listings they can file for)
  const [myListings, setMyListings] = useState<{ id: string; title: string }[]>([]);

  const isTenant   = user?.role === 'TENANT';
  const isLandlord = user?.role === 'LANDLORD';

  async function load() {
    const res = await fetch('/api/maintenance');
    if (res.ok) {
      const d = await res.json();
      setRequests(d.requests ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!user && !authLoading) { router.push('/'); return; }
    if (!user) return;
    load();

    // For tenant: fetch their conversations to get listing options
    if (user.role === 'TENANT') {
      fetch('/api/conversations')
        .then(r => r.json())
        .then(d => {
          const seen = new Set<string>();
          const listings: { id: string; title: string }[] = [];
          for (const c of d.conversations ?? []) {
            if (!seen.has(c.listing.id)) {
              seen.add(c.listing.id);
              listings.push({ id: c.listing.id, title: c.listing.title });
            }
          }
          setMyListings(listings);
        })
        .catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  async function submitRequest() {
    if (!formTitle.trim() || !formDesc.trim() || !formCat || !formListing) return;
    setSubmitting(true); setSubmitMsg('');
    const res = await fetch('/api/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId: formListing, title: formTitle.trim(), description: formDesc.trim(), category: formCat, priority: formPri }),
    });
    if (res.ok) {
      setSubmitMsg('Request submitted. Your landlord has been notified.');
      setFormTitle(''); setFormDesc(''); setFormCat(''); setFormPri('NORMAL');
      setShowForm(false);
      await load();
    } else {
      const d = await res.json();
      setSubmitMsg(d.error ?? 'Failed to submit.');
    }
    setSubmitting(false);
  }

  async function updateStatus(id: string, status: string, landlordNote?: string) {
    setUpdating(id);
    await fetch('/api/maintenance', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, ...(landlordNote !== undefined ? { landlordNote } : {}) }),
    });
    await load();
    setUpdating(null);
  }

  const filtered = filter === 'ALL' ? requests : requests.filter(r => r.status === filter);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1px solid var(--n-line)', background: 'var(--n-surface-2)',
    color: 'var(--n-ink)', fontFamily: 'inherit', fontSize: 14,
    outline: 'none', boxSizing: 'border-box',
  };

  if (authLoading || (!user && !authLoading)) return null;

  return (
    <div className="n-root">
      <TopBar />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 4 }}>
              {isTenant ? 'Tenant' : 'Landlord'}
            </div>
            <h1 className="n-display" style={{ fontSize: 44, margin: 0, letterSpacing: '-0.02em' }}>
              Maintenance
            </h1>
          </div>
          {isTenant && (
            <button
              onClick={() => setShowForm(v => !v)}
              className="n-btn accent"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Icon name="plus" /> Report issue
            </button>
          )}
        </div>

        {/* Submit form (tenant) */}
        {isTenant && showForm && (
          <div className="n-card" style={{ padding: 24, marginBottom: 24 }}>
            <div style={{ fontWeight: 600, marginBottom: 16 }}>Report a maintenance issue</div>
            <div style={{ display: 'grid', gap: 12 }}>
              {myListings.length > 0 ? (
                <div>
                  <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6, fontSize: 11 }}>Property</div>
                  <select value={formListing} onChange={e => setFormListing(e.target.value)} style={inputStyle}>
                    <option value="">Select property…</option>
                    {myListings.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                  </select>
                </div>
              ) : (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--n-surface-2)', fontSize: 13, color: 'var(--n-muted)' }}>
                  You need an active conversation with a landlord to file a maintenance request.
                </div>
              )}
              <div>
                <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6, fontSize: 11 }}>Issue title</div>
                <input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="e.g. Kitchen tap leaking" style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6, fontSize: 11 }}>Category</div>
                  <select value={formCat} onChange={e => setFormCat(e.target.value)} style={inputStyle}>
                    <option value="">Select…</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6, fontSize: 11 }}>Priority</div>
                  <select value={formPri} onChange={e => setFormPri(e.target.value)} style={inputStyle}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6, fontSize: 11 }}>Description</div>
                <textarea
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  placeholder="Describe the issue in detail…"
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
            </div>
            {submitMsg && (
              <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, fontSize: 13, background: submitMsg.includes('submitted') ? 'var(--n-accent-soft)' : 'color-mix(in oklab,var(--n-danger) 12%,transparent)', color: submitMsg.includes('submitted') ? 'var(--n-accent-ink)' : 'var(--n-danger)' }}>
                {submitMsg}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={() => setShowForm(false)} className="n-btn ghost sm" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              <button
                onClick={submitRequest}
                disabled={submitting || !formTitle.trim() || !formDesc.trim() || !formCat || !formListing}
                className="n-btn accent"
                style={{ flex: 2, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {submitting ? 'Submitting…' : <><Icon name="check" /> Submit request</>}
              </button>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
          {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`n-chip${filter === f ? ' dark' : ''}`}
              style={{ cursor: 'pointer', height: 32 }}
            >
              {f === 'ALL' ? 'All' : STATUS_META[f]?.label ?? f}
              {f !== 'ALL' && (
                <span style={{ marginLeft: 4, opacity: 0.6 }}>
                  {requests.filter(r => r.status === f).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div style={{ display: 'grid', gap: 12 }}>
            {[0, 1, 2].map(i => <div key={i} className="n-card" style={{ height: 100, opacity: 0.3 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="n-card" style={{ padding: 48, textAlign: 'center', color: 'var(--n-muted)' }}>
            <Icon name="home" className="n-ico xl" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
            <div style={{ fontWeight: 500, marginBottom: 4 }}>No requests yet</div>
            {isTenant && <div style={{ fontSize: 13 }}>Use "Report issue" to submit your first maintenance request.</div>}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {filtered.map(r => {
              const pri = PRIORITY_META[r.priority] ?? PRIORITY_META.NORMAL;
              return (
                <div key={r.id} className="n-card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    {/* Category icon box */}
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--n-surface-2)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <Icon name={r.category === 'Plumbing' ? 'drop' : r.category === 'Electrical' ? 'bolt' : r.category === 'Gas' ? 'gas' : 'home'} className="n-ico lg" style={{ color: 'var(--n-muted)' }} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{r.title}</div>
                        <Chip status={r.status} />
                        <span style={{ fontSize: 12, color: pri.color, fontWeight: 500 }}>{pri.label}</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--n-muted)', marginBottom: 6 }}>
                        {r.listing.title} · {r.listing.locality}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--n-ink)', marginBottom: 8, lineHeight: 1.5 }}>{r.description}</div>

                      <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--n-muted)', flexWrap: 'wrap' }}>
                        <span className="n-mono">{r.category}</span>
                        <span>·</span>
                        <span>{isLandlord ? `From: ${r.tenant.name ?? r.tenant.phone}` : ''}</span>
                        <span className="n-mono">{new Date(r.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        {r.resolvedAt && <span style={{ color: 'var(--n-accent-ink)' }}>Resolved {new Date(r.resolvedAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}</span>}
                      </div>

                      {r.landlordNote && (
                        <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 10, background: 'var(--n-surface-2)', fontSize: 13, borderLeft: '3px solid var(--n-line-2)' }}>
                          <span style={{ fontWeight: 500 }}>Landlord note: </span>{r.landlordNote}
                        </div>
                      )}

                      {/* Landlord actions */}
                      {isLandlord && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                          {r.status === 'OPEN' && (
                            <button
                              onClick={() => updateStatus(r.id, 'IN_PROGRESS')}
                              disabled={updating === r.id}
                              className="n-btn ghost sm"
                              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              <Icon name="zap" /> Mark in-progress
                            </button>
                          )}
                          {(r.status === 'OPEN' || r.status === 'IN_PROGRESS') && (
                            <button
                              onClick={() => updateStatus(r.id, 'RESOLVED')}
                              disabled={updating === r.id}
                              className="n-btn accent sm"
                              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              {updating === r.id ? '…' : <><Icon name="check" /> Mark resolved</>}
                            </button>
                          )}
                          {r.status === 'RESOLVED' && (
                            <button
                              onClick={() => updateStatus(r.id, 'CLOSED')}
                              disabled={updating === r.id}
                              className="n-btn ghost sm"
                            >
                              Close
                            </button>
                          )}
                        </div>
                      )}
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
