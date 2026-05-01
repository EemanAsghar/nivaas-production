'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TopBar from '@/components/ui/TopBar';
import Icon from '@/components/ui/Icon';
import { useAuth } from '@/components/auth/AuthProvider';

type Payment = {
  id: string;
  type: string;
  amount: number;
  status: string;
  gateway: string | null;
  reference: string | null;
  paidAt: string | null;
  createdAt: string;
  listingId: string | null;
};

const TYPE_LABEL: Record<string, string> = {
  LISTING_FEE:  'Listing fee',
  BOOST:        'Listing boost',
  INSPECTION:   'Inspection',
  VERIFICATION: 'CNIC verification',
  RENT:         'Rent payment',
};

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  COMPLETED: { bg: 'color-mix(in oklab, #22c55e 15%, transparent)', color: '#16a34a' },
  PENDING:   { bg: 'color-mix(in oklab, var(--n-warn) 18%, transparent)', color: 'var(--n-warn)' },
  FAILED:    { bg: 'color-mix(in oklab, var(--n-danger) 12%, transparent)', color: 'var(--n-danger)' },
  REFUNDED:  { bg: 'var(--n-surface-2)', color: 'var(--n-muted)' },
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PaymentsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/'); return; }
    if (!user) return;
    fetch('/api/payments')
      .then(r => r.json())
      .then(d => setPayments(d.payments ?? []))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const total = payments.filter(p => p.status === 'COMPLETED').reduce((s, p) => s + p.amount, 0);

  if (authLoading || loading) return (
    <div className="n-root"><TopBar />
      <div style={{ display: 'grid', placeItems: 'center', height: '60vh' }}>
        <span className="n-mono" style={{ color: 'var(--n-muted)' }}>Loading…</span>
      </div>
    </div>
  );

  return (
    <div className="n-root">
      <TopBar />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>

        <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6 }}>Finance</div>
        <h1 className="n-display" style={{ fontSize: 44, margin: '0 0 8px', letterSpacing: '-0.02em' }}>Payment history</h1>
        <p style={{ color: 'var(--n-muted)', marginBottom: 32 }}>All transactions on your account.</p>

        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Total paid',       value: `₨ ${total.toLocaleString()}` },
            { label: 'Transactions',     value: String(payments.length) },
            { label: 'Last payment',     value: payments[0] ? fmtDate(payments[0].createdAt) : '—' },
          ].map(s => (
            <div key={s.label} className="n-card" style={{ padding: 18 }}>
              <div className="n-mono" style={{ color: 'var(--n-muted)', fontSize: 11 }}>{s.label}</div>
              <div className="n-display" style={{ fontSize: 24, marginTop: 6 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {payments.length === 0 ? (
          <div className="n-card" style={{ padding: '56px 32px', textAlign: 'center' }}>
            <Icon name="file" className="n-ico xl" style={{ color: 'var(--n-muted)', margin: '0 auto 12px', opacity: 0.4 }} />
            <div style={{ fontWeight: 500, marginBottom: 6 }}>No payments yet</div>
            <div style={{ fontSize: 14, color: 'var(--n-muted)' }}>Payments for listings, inspections and verifications will appear here.</div>
          </div>
        ) : (
          <div className="n-card" style={{ padding: 0, overflow: 'hidden' }}>
            {payments.map((p, i) => {
              const ss = STATUS_STYLE[p.status] ?? STATUS_STYLE.PENDING;
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderTop: i === 0 ? 'none' : '1px solid var(--n-line)' }}>
                  {/* Icon */}
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--n-surface-2)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Icon name={p.type === 'RENT' ? 'home' : p.type === 'BOOST' ? 'zap' : p.type === 'INSPECTION' ? 'stamp' : 'shield'} className="n-ico" style={{ color: 'var(--n-muted)' }} />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{TYPE_LABEL[p.type] ?? p.type}</div>
                    <div className="n-mono" style={{ color: 'var(--n-muted)', fontSize: 11, marginTop: 2 }}>
                      {p.reference && `Ref: ${p.reference} · `}{fmtDate(p.paidAt ?? p.createdAt)}
                      {p.gateway && ` · ${p.gateway}`}
                    </div>
                  </div>

                  {/* Amount + status */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div className="n-display" style={{ fontSize: 18 }}>₨ {p.amount.toLocaleString()}</div>
                    <span className="n-chip" style={{ background: ss.bg, color: ss.color, borderColor: 'transparent', fontSize: 11, marginTop: 4, display: 'inline-block' }}>
                      {p.status.charAt(0) + p.status.slice(1).toLowerCase()}
                    </span>
                  </div>

                  {/* Listing link */}
                  {p.listingId && (
                    <Link href={`/property/${p.listingId}`} className="n-btn ghost sm" style={{ flexShrink: 0 }}>
                      View
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
