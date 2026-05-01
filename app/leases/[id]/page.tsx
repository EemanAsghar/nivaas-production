'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TopBar from '@/components/ui/TopBar';
import Icon from '@/components/ui/Icon';
import { useAuth } from '@/components/auth/AuthProvider';

type Lease = {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  tenantSignedAt: string | null;
  landlordSignedAt: string | null;
  createdAt: string;
  listing: { id: string; title: string; city: string; locality: string; address: string | null };
  tenant:  { id: string; name: string | null; phone: string };
  landlord:{ id: string; name: string | null; phone: string };
};

type RentPayment = {
  id: string;
  amount: number;
  reference: string | null;
  gateway: string | null;
  paidAt: string | null;
  createdAt: string;
};

const STATUS_CHIP: Record<string, { label: string; bg: string; color: string }> = {
  PENDING_SIGNATURES: { label: 'Awaiting signatures', bg: 'color-mix(in oklab, var(--n-warn) 18%, transparent)', color: 'var(--n-warn)' },
  SIGNED:   { label: 'Fully signed',  bg: 'color-mix(in oklab, #22c55e 15%, transparent)', color: '#16a34a' },
  ACTIVE:   { label: 'Active',        bg: 'var(--n-accent-soft)', color: 'var(--n-accent-ink)' },
  EXPIRED:  { label: 'Expired',       bg: 'var(--n-surface-2)',   color: 'var(--n-muted)' },
  TERMINATED:{ label: 'Terminated',   bg: 'color-mix(in oklab, var(--n-danger) 12%, transparent)', color: 'var(--n-danger)' },
};

function fmt(date: string) {
  return new Date(date).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function LeasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [lease, setLease] = useState<Lease | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [recordingRent, setRecordingRent] = useState(false);
  const [rentMonth, setRentMonth] = useState('');
  const [rentNote, setRentNote] = useState('');

  useEffect(() => {
    if (!authLoading && !user) { router.push('/'); return; }
    if (!user) return;
    Promise.all([
      fetch(`/api/leases/${id}`).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
      fetch(`/api/leases/${id}/payments`).then(r => r.ok ? r.json() : { payments: [] }),
    ])
      .then(([ld, pd]) => { setLease(ld.lease); setPayments(pd.payments ?? []); })
      .catch(() => router.push('/'))
      .finally(() => setLoading(false));
  }, [id, user, authLoading, router]);

  async function recordRent() {
    if (!rentMonth || recordingRent) return;
    setRecordingRent(true);
    const res = await fetch(`/api/leases/${id}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month: rentMonth, note: rentNote }),
    });
    if (res.ok) {
      const d = await res.json();
      setPayments(prev => [d.payment, ...prev]);
      setRentMonth('');
      setRentNote('');
    }
    setRecordingRent(false);
  }

  async function sign() {
    if (!agreed || signing) return;
    setSigning(true);
    const res = await fetch(`/api/leases/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'sign' }),
    });
    if (res.ok) {
      const d = await res.json();
      setLease(d.lease);
    }
    setSigning(false);
  }

  if (authLoading || loading) return (
    <div className="n-root"><TopBar />
      <div style={{ display: 'grid', placeItems: 'center', height: '60vh' }}>
        <span className="n-mono" style={{ color: 'var(--n-muted)' }}>Loading lease…</span>
      </div>
    </div>
  );

  if (!lease || !user) return null;

  const isLandlord    = user.id === lease.landlord.id;
  const isTenant      = user.id === lease.tenant.id;
  const mySignedAt    = isLandlord ? lease.landlordSignedAt : lease.tenantSignedAt;
  const otherSignedAt = isLandlord ? lease.tenantSignedAt   : lease.landlordSignedAt;
  const otherName     = isLandlord ? (lease.tenant.name   ?? lease.tenant.phone)
                                   : (lease.landlord.name ?? lease.landlord.phone);
  const canSign       = !mySignedAt && (isLandlord || isTenant) && lease.status !== 'SIGNED';
  const sc            = STATUS_CHIP[lease.status] ?? STATUS_CHIP.PENDING_SIGNATURES;

  const rowStyle: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', padding: '12px 0',
    borderBottom: '1px solid var(--n-line)', fontSize: 14,
  };

  return (
    <div className="n-root">
      <TopBar />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>

        {/* Header */}
        <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6 }}>Lease agreement</div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
          <h1 className="n-display" style={{ fontSize: 40, margin: 0, letterSpacing: '-0.02em' }}>{lease.listing.title}</h1>
          <span className="n-chip" style={{ background: sc.bg, color: sc.color, borderColor: 'transparent', flexShrink: 0 }}>{sc.label}</span>
        </div>

        {/* Property info */}
        <div className="n-card" style={{ padding: 24, marginBottom: 16 }}>
          <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 12 }}>Property details</div>
          <div style={rowStyle}>
            <span style={{ color: 'var(--n-muted)' }}>Address</span>
            <span style={{ fontWeight: 500 }}>{lease.listing.locality}, {lease.listing.city}{lease.listing.address ? ` — ${lease.listing.address}` : ''}</span>
          </div>
          <div style={rowStyle}>
            <span style={{ color: 'var(--n-muted)' }}>Monthly rent</span>
            <span className="n-display" style={{ fontSize: 20 }}>₨ {lease.monthlyRent.toLocaleString()}</span>
          </div>
          <div style={rowStyle}>
            <span style={{ color: 'var(--n-muted)' }}>Security deposit</span>
            <span style={{ fontWeight: 500 }}>₨ {lease.securityDeposit.toLocaleString()}</span>
          </div>
          <div style={rowStyle}>
            <span style={{ color: 'var(--n-muted)' }}>Lease period</span>
            <span style={{ fontWeight: 500 }}>{fmt(lease.startDate)} → {fmt(lease.endDate)}</span>
          </div>
          <div style={{ ...rowStyle, borderBottom: 'none', paddingBottom: 0 }}>
            <span style={{ color: 'var(--n-muted)' }}>Duration</span>
            <span style={{ fontWeight: 500 }}>
              {Math.round((new Date(lease.endDate).getTime() - new Date(lease.startDate).getTime()) / (30 * 24 * 3600 * 1000))} months
            </span>
          </div>
        </div>

        {/* Parties */}
        <div className="n-card" style={{ padding: 24, marginBottom: 16 }}>
          <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 12 }}>Parties</div>
          {[
            { role: 'Landlord', person: lease.landlord, signedAt: lease.landlordSignedAt },
            { role: 'Tenant',   person: lease.tenant,   signedAt: lease.tenantSignedAt },
          ].map(({ role, person, signedAt }) => (
            <div key={role} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: role === 'Landlord' ? '1px solid var(--n-line)' : 'none' }}>
              <div style={{ width: 40, height: 40, borderRadius: 999, background: 'var(--n-accent-soft)', color: 'var(--n-accent-ink)', display: 'grid', placeItems: 'center', fontWeight: 700, flexShrink: 0 }}>
                {(person.name ?? person.phone)[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{person.name ?? person.phone}</div>
                <div className="n-mono" style={{ color: 'var(--n-muted)', fontSize: 12 }}>{role} · {person.phone}</div>
              </div>
              {signedAt ? (
                <span className="n-chip" style={{ background: 'color-mix(in oklab, #22c55e 15%, transparent)', color: '#16a34a', borderColor: 'transparent' }}>
                  ✓ Signed {fmt(signedAt)}
                </span>
              ) : (
                <span className="n-chip" style={{ color: 'var(--n-muted)' }}>Pending signature</span>
              )}
            </div>
          ))}
        </div>

        {/* Terms summary */}
        <div className="n-card" style={{ padding: 24, marginBottom: 24 }}>
          <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 12 }}>Standard terms</div>
          {[
            'Rent is due on the 1st of each month.',
            'A grace period of 7 days applies before late fees are charged.',
            'The tenant shall not sublet without written landlord consent.',
            'The security deposit is refundable within 30 days of vacating, subject to property condition.',
            'Either party may terminate with 30 days written notice.',
            'The landlord is responsible for structural repairs; the tenant for interior maintenance.',
          ].map((term, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: i < 5 ? '1px solid var(--n-line)' : 'none', fontSize: 13, color: 'var(--n-muted)', lineHeight: 1.5 }}>
              <span style={{ flexShrink: 0, fontWeight: 600, color: 'var(--n-ink)' }}>{i + 1}.</span>
              <span>{term}</span>
            </div>
          ))}
        </div>

        {/* Sign section */}
        {canSign && (
          <div className="n-card" style={{ padding: 24, marginBottom: 16 }}>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Your signature</div>
            <div style={{ fontSize: 13, color: 'var(--n-muted)', marginBottom: 16 }}>
              {otherSignedAt
                ? `${otherName} has already signed. Sign below to finalise the agreement.`
                : `Sign first — ${otherName} will be notified to co-sign.`}
            </div>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 20 }}>
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: 2, accentColor: 'var(--n-accent)' }} />
              <span style={{ fontSize: 13, color: 'var(--n-ink)', lineHeight: 1.5 }}>
                I, <strong>{user.name ?? user.phone}</strong>, confirm that I have read and agree to the terms of this lease agreement. I understand this constitutes a legally binding digital signature.
              </span>
            </label>
            <button
              onClick={sign}
              disabled={!agreed || signing}
              className="n-btn accent"
              style={{ width: '100%', justifyContent: 'center', height: 46 }}
            >
              {signing ? 'Signing…' : <><Icon name="check" /> Sign lease agreement</>}
            </button>
          </div>
        )}

        {mySignedAt && lease.status !== 'SIGNED' && (
          <div className="n-card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 14, background: 'var(--n-accent-soft)' }}>
            <Icon name="check" className="n-ico lg" style={{ color: 'var(--n-accent-ink)', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 500, color: 'var(--n-accent-ink)' }}>You signed on {fmt(mySignedAt)}</div>
              <div style={{ fontSize: 13, color: 'var(--n-accent-ink)', opacity: 0.8, marginTop: 2 }}>
                Waiting for {otherName} to co-sign.
              </div>
            </div>
          </div>
        )}

        {lease.status === 'SIGNED' && (
          <div className="n-card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
            <Icon name="shield" className="n-ico lg" style={{ color: '#16a34a', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, color: '#16a34a' }}>Lease fully signed</div>
              <div style={{ fontSize: 13, color: 'var(--n-muted)', marginTop: 2 }}>Both parties have signed. This agreement is legally binding.</div>
            </div>
          </div>
        )}

        {/* Rent payments */}
        {(lease.status === 'SIGNED' || lease.status === 'ACTIVE') && (
          <div className="n-card" style={{ padding: 24, marginTop: 16 }}>
            <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 12 }}>Rent payments</div>

            {/* Landlord: record payment */}
            {isLandlord && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, marginBottom: 16, alignItems: 'end' }}>
                <div>
                  <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 4, fontSize: 11 }}>Month</div>
                  <input
                    type="month"
                    value={rentMonth}
                    onChange={e => setRentMonth(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--n-line)', background: 'var(--n-surface-2)', color: 'var(--n-ink)', fontFamily: 'inherit', fontSize: 13 }}
                  />
                </div>
                <div>
                  <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 4, fontSize: 11 }}>Note (optional)</div>
                  <input
                    type="text"
                    value={rentNote}
                    onChange={e => setRentNote(e.target.value)}
                    placeholder="e.g. Bank transfer"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--n-line)', background: 'var(--n-surface-2)', color: 'var(--n-ink)', fontFamily: 'inherit', fontSize: 13 }}
                  />
                </div>
                <button
                  onClick={recordRent}
                  disabled={!rentMonth || recordingRent}
                  className="n-btn accent sm"
                  style={{ height: 36, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  {recordingRent ? '…' : <><Icon name="check" /> Record</>}
                </button>
              </div>
            )}

            {payments.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--n-muted)', padding: '12px 0', textAlign: 'center' }}>
                No rent payments recorded yet.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 0 }}>
                {payments.map((p, i) => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: i === 0 ? 'none' : '1px solid var(--n-line)', fontSize: 13 }}>
                    <div>
                      <span style={{ fontWeight: 500 }}>{p.reference ?? '—'}</span>
                      {p.gateway && <span style={{ color: 'var(--n-muted)', marginLeft: 8 }}>{p.gateway}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span className="n-display" style={{ fontSize: 16 }}>₨ {p.amount.toLocaleString()}</span>
                      <span className="n-chip" style={{ background: 'color-mix(in oklab, #22c55e 15%, transparent)', color: '#16a34a', borderColor: 'transparent' }}>Received</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
          <Link href={`/property/${lease.listing.id}`} className="n-btn ghost sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="home" /> Property
          </Link>
          <button
            onClick={() => window.print()}
            className="n-btn ghost sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Icon name="file" /> Print / Save PDF
          </button>
        </div>
      </div>
    </div>
  );
}
