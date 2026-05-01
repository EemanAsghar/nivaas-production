'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import { useAuth } from '@/components/auth/AuthProvider';

/* ─── Types ─── */
type AdminListing = {
  id: string; title: string; city: string; locality: string;
  rentAmount: number; status: string; ownerVerified: boolean; createdAt: string;
  photos: { url: string }[];
  landlord: { id: string; name?: string; phone: string; verificationTier: string };
};
type AdminUser = {
  id: string; name?: string; phone: string; role: string;
  verificationTier: string; cnicFrontUrl?: string; cnicBackUrl?: string;
  createdAt: string; isActive: boolean; _count: { listings: number };
};
type Inspector = { id: string; name: string | null; phone: string };
type InspectionReq = {
  id: string; type: string; status: string; scheduledAt: string | null;
  feeAmount: number; createdAt: string;
  listing: { id: string; title: string; city: string; locality: string };
  requester: { id: string; name: string | null; phone: string };
  inspector: Inspector | null;
};

type Tab = 'overview' | 'listings' | 'users' | 'inspections';

/* ─── Helpers ─── */
const STATUS_COLOR: Record<string, string> = {
  ACTIVE: '#16a34a', DRAFT: '#6b6358', PAUSED: '#a86a2a',
  REMOVED: '#9a3a2a', REQUESTED: '#a86a2a', ASSIGNED: '#2f6b4a',
  COMPLETED: '#16a34a', CANCELLED: '#9a3a2a',
};
function Dot({ status }: { status: string }) {
  return <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: STATUS_COLOR[status] ?? '#999', marginRight: 6 }} />;
}
function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ─── Stat card ─── */
function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ background: 'var(--n-surface)', border: '1px solid var(--n-line)', borderRadius: 12, padding: '18px 20px' }}>
      <div style={{ fontSize: 12, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--n-muted)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 32, fontFamily: 'var(--display)', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--n-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

/* ─── Row action button ─── */
function Btn({ children, danger, onClick, disabled }: { children: React.ReactNode; danger?: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '4px 12px', borderRadius: 6, border: '1px solid var(--n-line)',
        background: 'var(--n-surface)', cursor: disabled ? 'default' : 'pointer',
        fontFamily: 'inherit', fontSize: 12, fontWeight: 500, opacity: disabled ? 0.4 : 1,
        color: danger ? 'var(--n-danger)' : 'var(--n-ink)',
      }}
    >
      {children}
    </button>
  );
}

/* ─── Main ─── */
export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [inspections, setInspections] = useState<InspectionReq[]>([]);
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [loading, setLoading] = useState(true);
  const [cnicPreview, setCnicPreview] = useState<{ front: string; back: string; name: string } | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [assignPicks, setAssignPicks] = useState<Record<string, { inspectorId: string; date: string }>>({});
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) router.push('/');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') return;
    Promise.all([
      fetch('/api/admin/listings').then(r => r.json()),
      fetch('/api/admin/users').then(r => r.json()),
      fetch('/api/admin/inspections').then(r => r.json()),
    ]).then(([ld, ud, id]) => {
      setListings(ld.listings ?? []);
      setUsers(ud.users ?? []);
      setInspections(id.requests ?? []);
      setInspectors(id.inspectors ?? []);
    }).finally(() => setLoading(false));
  }, [user]);

  /* ─── Actions ─── */
  async function approveListing(id: string) {
    await fetch('/api/admin/listings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ownerVerified: true, status: 'ACTIVE' }) });
    setListings(ls => ls.map(l => l.id === id ? { ...l, ownerVerified: true, status: 'ACTIVE' } : l));
  }
  async function rejectListing(id: string) {
    await fetch('/api/admin/listings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: 'REMOVED' }) });
    setListings(ls => ls.map(l => l.id === id ? { ...l, status: 'REMOVED' } : l));
  }
  async function verifyUser(id: string) {
    await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, verificationTier: 'VERIFIED' }) });
    setUsers(us => us.map(u => u.id === id ? { ...u, verificationTier: 'VERIFIED' } : u));
  }
  async function suspendUser(id: string, isActive: boolean) {
    await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, isActive }) });
    setUsers(us => us.map(u => u.id === id ? { ...u, isActive } : u));
  }
  async function changeRole(id: string, role: string) {
    await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, role }) });
    setUsers(us => us.map(u => u.id === id ? { ...u, role } : u));
  }
  async function assignInspector(inspectionId: string) {
    const pick = assignPicks[inspectionId];
    if (!pick?.inspectorId || !pick?.date) return;
    setAssigning(inspectionId);
    await fetch('/api/admin/inspections', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: inspectionId, inspectorId: pick.inspectorId, scheduledAt: `${pick.date}T09:00:00`, status: 'ASSIGNED' }),
    });
    setInspections(is => is.map(i => i.id === inspectionId
      ? { ...i, status: 'ASSIGNED', scheduledAt: `${pick.date}T09:00:00`, inspector: inspectors.find(ins => ins.id === pick.inspectorId) ?? null }
      : i
    ));
    setAssigning(null);
  }

  if (authLoading || loading) {
    return (
      <div style={{ background: 'var(--n-bg)', minHeight: '100vh', display: 'grid', placeItems: 'center', color: 'var(--n-muted)', fontFamily: 'var(--mono)', fontSize: 12 }}>
        Loading…
      </div>
    );
  }
  if (!user || user.role !== 'ADMIN') return null;

  /* ─── Derived stats ─── */
  const pendingListings  = listings.filter(l => !l.ownerVerified && l.status !== 'REMOVED');
  const pendingCNICs     = users.filter(u => u.verificationTier === 'STANDARD');
  const openInspections  = inspections.filter(i => i.status === 'REQUESTED');
  const activeListings   = listings.filter(l => l.status === 'ACTIVE');
  const totalRevenue     = inspections.filter(i => i.status === 'COMPLETED').reduce((a, i) => a + i.feeAmount, 0);

  const filteredListings = listings.filter(l =>
    !search || l.title.toLowerCase().includes(search) || l.city.toLowerCase().includes(search) || (l.landlord.name ?? l.landlord.phone).toLowerCase().includes(search)
  );
  const filteredUsers = users.filter(u =>
    !search || (u.name ?? '').toLowerCase().includes(search) || u.phone.includes(search)
  );

  /* ─── Sidebar nav ─── */
  const NAV: { key: Tab; label: string; badge?: number }[] = [
    { key: 'overview',    label: 'Overview' },
    { key: 'listings',    label: 'Listings',    badge: pendingListings.length || undefined },
    { key: 'users',       label: 'Users',       badge: pendingCNICs.length || undefined },
    { key: 'inspections', label: 'Inspections', badge: openInspections.length || undefined },
  ];

  const S = { // shared table cell style
    padding: '12px 16px', fontSize: 13, borderBottom: '1px solid var(--n-line)', verticalAlign: 'middle' as const,
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--n-bg-2)', fontFamily: 'inherit' }}>

      {/* ─── Sidebar ─── */}
      <div style={{ width: 220, flexShrink: 0, background: 'var(--n-surface)', borderRight: '1px solid var(--n-line)', display: 'flex', flexDirection: 'column', padding: '24px 0' }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--n-line)', marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em' }}>Nivaas Admin</div>
          <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--n-muted)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Control panel</div>
        </div>
        {NAV.map(n => (
          <button
            key={n.key}
            onClick={() => setTab(n.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 20px', border: 'none', cursor: 'pointer',
              background: tab === n.key ? 'var(--n-bg-2)' : 'transparent',
              color: tab === n.key ? 'var(--n-ink)' : 'var(--n-muted)',
              fontFamily: 'inherit', fontSize: 14, fontWeight: tab === n.key ? 600 : 400,
              borderLeft: `3px solid ${tab === n.key ? 'var(--n-ink)' : 'transparent'}`,
              textAlign: 'left', width: '100%',
            }}
          >
            {n.label}
            {n.badge ? (
              <span style={{ marginLeft: 'auto', background: '#e53935', color: '#fff', borderRadius: 999, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>
                {n.badge}
              </span>
            ) : null}
          </button>
        ))}
        <div style={{ marginTop: 'auto', padding: '16px 20px', borderTop: '1px solid var(--n-line)' }}>
          <Link href="/" style={{ fontSize: 13, color: 'var(--n-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="arrow" style={{ transform: 'rotate(180deg)' }} /> Back to site
          </Link>
        </div>
      </div>

      {/* ─── Main content ─── */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ padding: '32px 40px', maxWidth: 1000 }}>

          {/* ─── Overview ─── */}
          {tab === 'overview' && (
            <>
              <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 24px', letterSpacing: '-0.02em' }}>Overview</h1>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
                <Stat label="Active listings"    value={activeListings.length} />
                <Stat label="Total users"        value={users.length} />
                <Stat label="Inspection revenue" value={`₨${(totalRevenue/1000).toFixed(0)}k`} />
                <Stat label="Pending actions"    value={pendingListings.length + pendingCNICs.length + openInspections.length} sub="listings + CNICs + inspections" />
              </div>

              <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 12px' }}>Action required</h2>
              <div style={{ display: 'grid', gap: 8, marginBottom: 32 }}>
                {pendingListings.length > 0 && (
                  <div style={{ background: 'var(--n-surface)', border: '1px solid var(--n-line)', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{pendingListings.length} listing{pendingListings.length > 1 ? 's' : ''} pending approval</div>
                      <div style={{ fontSize: 12, color: 'var(--n-muted)', marginTop: 2 }}>Review and approve or remove unverified listings</div>
                    </div>
                    <button onClick={() => setTab('listings')} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--n-line)', background: 'var(--n-ink)', color: 'var(--n-bg)', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer' }}>
                      Review →
                    </button>
                  </div>
                )}
                {pendingCNICs.length > 0 && (
                  <div style={{ background: 'var(--n-surface)', border: '1px solid var(--n-line)', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{pendingCNICs.length} CNIC{pendingCNICs.length > 1 ? 's' : ''} awaiting NADRA confirmation</div>
                      <div style={{ fontSize: 12, color: 'var(--n-muted)', marginTop: 2 }}>Verify identity documents for Standard-tier users</div>
                    </div>
                    <button onClick={() => setTab('users')} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--n-line)', background: 'var(--n-ink)', color: 'var(--n-bg)', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer' }}>
                      Review →
                    </button>
                  </div>
                )}
                {openInspections.length > 0 && (
                  <div style={{ background: 'var(--n-surface)', border: '1px solid var(--n-line)', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{openInspections.length} inspection{openInspections.length > 1 ? 's' : ''} unassigned</div>
                      <div style={{ fontSize: 12, color: 'var(--n-muted)', marginTop: 2 }}>Assign an inspector and schedule a date</div>
                    </div>
                    <button onClick={() => setTab('inspections')} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--n-line)', background: 'var(--n-ink)', color: 'var(--n-bg)', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer' }}>
                      Assign →
                    </button>
                  </div>
                )}
                {pendingListings.length + pendingCNICs.length + openInspections.length === 0 && (
                  <div style={{ background: 'var(--n-surface)', border: '1px solid var(--n-line)', borderRadius: 10, padding: '20px 18px', color: 'var(--n-muted)', fontSize: 14 }}>
                    ✓ Nothing needs your attention right now.
                  </div>
                )}
              </div>

              <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 12px' }}>Recent listings</h2>
              <div style={{ background: 'var(--n-surface)', border: '1px solid var(--n-line)', borderRadius: 12, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {listings.slice(0, 5).map(l => (
                      <tr key={l.id}>
                        <td style={S}><Dot status={l.status} />{l.title}</td>
                        <td style={{ ...S, color: 'var(--n-muted)' }}>{l.city}</td>
                        <td style={{ ...S, color: 'var(--n-muted)' }}>₨{l.rentAmount.toLocaleString()}</td>
                        <td style={{ ...S, color: 'var(--n-muted)' }}>{fmt(l.createdAt)}</td>
                        <td style={S}><Link href={`/property/${l.id}`} style={{ color: 'var(--n-accent-ink)', fontSize: 12 }}>View →</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ─── Listings ─── */}
          {tab === 'listings' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Listings</h1>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value.toLowerCase())}
                  placeholder="Search by title, city or landlord…"
                  style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--n-line)', background: 'var(--n-surface)', color: 'var(--n-ink)', fontFamily: 'inherit', fontSize: 13, outline: 'none', width: 260 }}
                />
              </div>
              <div style={{ background: 'var(--n-surface)', border: '1px solid var(--n-line)', borderRadius: 12, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--n-line)' }}>
                      {['Listing', 'Landlord', 'Rent', 'Status', 'Actions'].map(h => (
                        <th key={h} style={{ ...S, fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--n-muted)', fontWeight: 500, textAlign: 'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredListings.length === 0 && (
                      <tr><td colSpan={5} style={{ ...S, textAlign: 'center', color: 'var(--n-muted)' }}>No listings found.</td></tr>
                    )}
                    {filteredListings.map(l => (
                      <tr key={l.id} style={{ background: !l.ownerVerified && l.status !== 'REMOVED' ? 'color-mix(in oklab, var(--n-warn) 5%, transparent)' : undefined }}>
                        <td style={S}>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>{l.title}</div>
                          <div style={{ fontSize: 11, color: 'var(--n-muted)', marginTop: 1 }}>{l.locality}, {l.city}</div>
                        </td>
                        <td style={{ ...S, color: 'var(--n-muted)', fontSize: 12 }}>{l.landlord.name ?? l.landlord.phone}</td>
                        <td style={{ ...S, fontSize: 13 }}>₨{l.rentAmount.toLocaleString()}</td>
                        <td style={S}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 12 }}>
                            <Dot status={l.status} />{l.status}
                          </span>
                          {l.ownerVerified && <div style={{ fontSize: 10, color: '#16a34a', marginTop: 2, fontFamily: 'var(--mono)' }}>docs verified</div>}
                        </td>
                        <td style={S}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <Link href={`/property/${l.id}`} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--n-line)', background: 'var(--n-surface)', fontSize: 12, color: 'var(--n-ink)' }}>View</Link>
                            {!l.ownerVerified && l.status !== 'REMOVED' && (
                              <Btn onClick={() => approveListing(l.id)}>Approve</Btn>
                            )}
                            {l.status !== 'REMOVED' && (
                              <Btn danger onClick={() => rejectListing(l.id)}>Remove</Btn>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ─── Users ─── */}
          {tab === 'users' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Users</h1>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value.toLowerCase())}
                  placeholder="Search by name or phone…"
                  style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--n-line)', background: 'var(--n-surface)', color: 'var(--n-ink)', fontFamily: 'inherit', fontSize: 13, outline: 'none', width: 260 }}
                />
              </div>
              <div style={{ background: 'var(--n-surface)', border: '1px solid var(--n-line)', borderRadius: 12, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--n-line)' }}>
                      {['User', 'Role', 'Tier', 'Joined', 'Actions'].map(h => (
                        <th key={h} style={{ ...S, fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--n-muted)', fontWeight: 500, textAlign: 'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 && (
                      <tr><td colSpan={5} style={{ ...S, textAlign: 'center', color: 'var(--n-muted)' }}>No users found.</td></tr>
                    )}
                    {filteredUsers.map(u => (
                      <tr key={u.id} style={{ opacity: u.isActive ? 1 : 0.5 }}>
                        <td style={S}>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>{u.name ?? '(no name)'}</div>
                          <div style={{ fontSize: 11, color: 'var(--n-muted)', marginTop: 1, fontFamily: 'var(--mono)' }}>{u.phone}</div>
                        </td>
                        <td style={S}>
                          <select
                            value={u.role}
                            onChange={e => changeRole(u.id, e.target.value)}
                            style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--n-line)', background: 'var(--n-surface)', color: 'var(--n-ink)', fontFamily: 'inherit', fontSize: 12, cursor: 'pointer' }}
                          >
                            {['TENANT', 'LANDLORD', 'INSPECTOR', 'ADMIN'].map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </td>
                        <td style={S}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 12 }}>
                            <Dot status={u.verificationTier === 'VERIFIED' ? 'COMPLETED' : u.verificationTier === 'STANDARD' ? 'ASSIGNED' : 'DRAFT'} />
                            {u.verificationTier}
                          </span>
                        </td>
                        <td style={{ ...S, fontSize: 12, color: 'var(--n-muted)' }}>{fmt(u.createdAt)}</td>
                        <td style={S}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {u.cnicFrontUrl && u.verificationTier === 'STANDARD' && (
                              <Btn onClick={() => setCnicPreview({ front: u.cnicFrontUrl!, back: u.cnicBackUrl ?? '', name: u.name ?? u.phone })}>CNIC</Btn>
                            )}
                            {u.verificationTier === 'STANDARD' && (
                              <Btn onClick={() => verifyUser(u.id)}>Verify</Btn>
                            )}
                            <Btn danger onClick={() => suspendUser(u.id, !u.isActive)}>
                              {u.isActive ? 'Suspend' : 'Restore'}
                            </Btn>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ─── Inspections ─── */}
          {tab === 'inspections' && (
            <>
              <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 20px', letterSpacing: '-0.02em' }}>Inspections</h1>
              <div style={{ background: 'var(--n-surface)', border: '1px solid var(--n-line)', borderRadius: 12, overflow: 'hidden' }}>
                {inspections.length === 0 ? (
                  <div style={{ padding: 48, textAlign: 'center', color: 'var(--n-muted)', fontSize: 14 }}>No inspection requests yet.</div>
                ) : inspections.map((ins, i) => {
                  const pick = assignPicks[ins.id] ?? { inspectorId: ins.inspector?.id ?? '', date: ins.scheduledAt?.split('T')[0] ?? '' };
                  const canAssign = !!pick.inspectorId && !!pick.date && ins.status !== 'COMPLETED' && ins.status !== 'CANCELLED';
                  return (
                    <div key={ins.id} style={{ padding: '18px 24px', borderTop: i === 0 ? 'none' : '1px solid var(--n-line)' }}>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <Dot status={ins.status} />
                            <span style={{ fontWeight: 500, fontSize: 14 }}>{ins.listing.title}</span>
                            <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--n-muted)', background: 'var(--n-surface-2)', padding: '2px 7px', borderRadius: 4 }}>{ins.type}</span>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--n-muted)', marginLeft: 14 }}>
                            {ins.listing.locality}, {ins.listing.city} · by {ins.requester.name ?? ins.requester.phone}
                            {ins.inspector && ` · Inspector: ${ins.inspector.name ?? ins.inspector.phone}`}
                            {ins.scheduledAt && ` · ${fmt(ins.scheduledAt)}`}
                          </div>
                        </div>
                        <div style={{ fontFamily: 'var(--display)', fontSize: 20 }}>₨{ins.feeAmount.toLocaleString()}</div>
                      </div>

                      {canAssign !== false && ins.status !== 'COMPLETED' && ins.status !== 'CANCELLED' && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 12, marginLeft: 14, alignItems: 'center' }}>
                          <select
                            value={pick.inspectorId}
                            onChange={e => setAssignPicks(p => ({ ...p, [ins.id]: { ...pick, inspectorId: e.target.value } }))}
                            style={{ flex: 1, maxWidth: 220, padding: '7px 10px', borderRadius: 7, border: '1px solid var(--n-line)', background: 'var(--n-surface-2)', color: 'var(--n-ink)', fontFamily: 'inherit', fontSize: 13 }}
                          >
                            <option value="">Select inspector…</option>
                            {inspectors.map(insp => <option key={insp.id} value={insp.id}>{insp.name ?? insp.phone}</option>)}
                          </select>
                          <input
                            type="date"
                            value={pick.date}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={e => setAssignPicks(p => ({ ...p, [ins.id]: { ...pick, date: e.target.value } }))}
                            style={{ padding: '7px 10px', borderRadius: 7, border: '1px solid var(--n-line)', background: 'var(--n-surface-2)', color: 'var(--n-ink)', fontFamily: 'inherit', fontSize: 13 }}
                          />
                          <Btn onClick={() => assignInspector(ins.id)} disabled={!pick.inspectorId || !pick.date || assigning === ins.id}>
                            {assigning === ins.id ? '…' : ins.inspector ? 'Reassign' : 'Assign'}
                          </Btn>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── CNIC modal ─── */}
      {cnicPreview && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => setCnicPreview(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'relative', width: 560, background: 'var(--n-surface)', borderRadius: 16, padding: 28, zIndex: 1, border: '1px solid var(--n-line)' }}>
            <button onClick={() => setCnicPreview(null)} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--n-muted)', fontSize: 20 }}>×</button>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--n-muted)', marginBottom: 4 }}>Identity documents</div>
            <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 20 }}>{cnicPreview.name}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[['Front', cnicPreview.front], ['Back', cnicPreview.back]].map(([label, url]) => (
                <div key={label}>
                  <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--n-muted)', textTransform: 'uppercase', marginBottom: 6 }}>CNIC · {label}</div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`CNIC ${label}`} style={{ width: '100%', borderRadius: 8, border: '1px solid var(--n-line)' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
