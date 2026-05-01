'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TopBar from '@/components/ui/TopBar';
import Icon from '@/components/ui/Icon';
import { useAuth } from '@/components/auth/AuthProvider';

type ChecklistItem = { category: string; status: string; notes: string };

type Inspection = {
  id: string;
  type: string;
  status: string;
  scheduledAt: string | null;
  completedAt: string | null;
  feeAmount: number;
  listing: { id: string; title: string; city: string; locality: string; address: string | null };
  requester: { id: string; name: string | null; phone: string };
  checklistItems: { id: string; category: string; status: string; notes: string | null }[];
};

const CATEGORIES = ['Electrical', 'Gas', 'Water / Plumbing', 'Structural'];

const STATUS_CHIP: Record<string, { bg: string; color: string }> = {
  ASSIGNED:  { bg: 'var(--n-accent-soft)', color: 'var(--n-accent-ink)' },
  COMPLETED: { bg: 'color-mix(in oklab, #22c55e 15%, transparent)', color: '#16a34a' },
  CANCELLED: { bg: 'color-mix(in oklab, var(--n-danger) 12%, transparent)', color: 'var(--n-danger)' },
};

const ITEM_OPTIONS = [
  { label: 'Pass', value: 'PASS', color: '#16a34a' },
  { label: 'Flag', value: 'FLAG', color: 'var(--n-warn)' },
  { label: 'Fail', value: 'FAIL', color: 'var(--n-danger)' },
];

export default function InspectorPortal() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<Record<string, ChecklistItem>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'INSPECTOR')) { router.push('/'); return; }
    if (!user) return;
    fetch('/api/inspector')
      .then(r => r.json())
      .then(d => setInspections(d.inspections ?? []))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  function openChecklist(ins: Inspection) {
    const initial: Record<string, ChecklistItem> = {};
    CATEGORIES.forEach(cat => {
      const existing = ins.checklistItems.find(i => i.category === cat);
      initial[cat] = { category: cat, status: existing?.status ?? 'PASS', notes: existing?.notes ?? '' };
    });
    setChecklist(initial);
    setActive(ins.id);
    setDone(null);
  }

  function updateItem(cat: string, field: 'status' | 'notes', val: string) {
    setChecklist(prev => ({ ...prev, [cat]: { ...prev[cat], [field]: val } }));
  }

  async function submit() {
    if (!active) return;
    setSubmitting(true);
    const res = await fetch('/api/inspector', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: active, checklist: Object.values(checklist) }),
    });
    if (res.ok) {
      setInspections(prev => prev.map(i => i.id === active ? { ...i, status: 'COMPLETED', completedAt: new Date().toISOString(), checklistItems: Object.values(checklist).map((c, idx) => ({ id: idx.toString(), ...c, notes: c.notes || null })) } : i));
      setDone(active);
      setActive(null);
    }
    setSubmitting(false);
  }

  if (authLoading || loading) return (
    <div className="n-root"><TopBar />
      <div style={{ display: 'grid', placeItems: 'center', height: '60vh' }}><span className="n-mono" style={{ color: 'var(--n-muted)' }}>Loading…</span></div>
    </div>
  );

  if (!user || user.role !== 'INSPECTOR') return null;

  const pending   = inspections.filter(i => i.status === 'ASSIGNED');
  const completed = inspections.filter(i => i.status === 'COMPLETED');

  const inputStyle = {
    width: '100%', padding: '8px 12px', borderRadius: 8,
    border: '1px solid var(--n-line)', background: 'var(--n-surface-2)',
    color: 'var(--n-ink)', fontFamily: 'inherit', fontSize: 13, outline: 'none',
  };

  return (
    <div className="n-root">
      <TopBar />
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px' }}>
        <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6 }}>Inspector portal</div>
        <h1 className="n-display" style={{ fontSize: 44, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          My inspections
        </h1>
        <p style={{ fontSize: 14, color: 'var(--n-muted)', marginBottom: 32 }}>
          {pending.length} pending · {completed.length} completed
        </p>

        {inspections.length === 0 ? (
          <div className="n-card" style={{ padding: 48, textAlign: 'center', color: 'var(--n-muted)' }}>
            <Icon name="stamp" className="n-ico xl" style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <div>No inspections assigned yet.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {inspections.map(ins => {
              const sc = STATUS_CHIP[ins.status] ?? STATUS_CHIP.ASSIGNED;
              const isActive = active === ins.id;
              const isDone = done === ins.id;
              return (
                <div key={ins.id} className="n-card" style={{ padding: 0, overflow: 'hidden' }}>
                  {/* Header row */}
                  <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--n-surface-2)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <Icon name="stamp" className="n-ico lg" style={{ color: 'var(--n-muted)' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{ins.listing.title}</div>
                      <div style={{ fontSize: 13, color: 'var(--n-muted)', marginTop: 2 }}>
                        {ins.listing.locality}, {ins.listing.city}
                        {ins.listing.address && ` · ${ins.listing.address}`}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--n-muted)', marginTop: 2 }}>
                        {ins.type.replace('_', '-')} inspection · Requested by {ins.requester.name ?? ins.requester.phone}
                        {ins.scheduledAt && ` · ${new Date(ins.scheduledAt).toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short' })}`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                      <span className="n-chip" style={{ background: sc.bg, color: sc.color, borderColor: 'transparent' }}>{ins.status}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link href={`/property/${ins.listing.id}`} className="n-btn ghost sm">Property</Link>
                        {ins.status === 'ASSIGNED' && (
                          <button
                            onClick={() => isActive ? setActive(null) : openChecklist(ins)}
                            className={isActive ? 'n-btn ghost sm' : 'n-btn primary sm'}
                          >
                            {isActive ? 'Cancel' : 'Fill checklist'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Completed checklist summary */}
                  {ins.status === 'COMPLETED' && ins.checklistItems.length > 0 && (
                    <div style={{ borderTop: '1px solid var(--n-line)', padding: '12px 20px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {ins.checklistItems.map(item => (
                        <span key={item.id} className="n-chip" style={{
                          background: item.status === 'PASS' ? 'color-mix(in oklab, #22c55e 15%, transparent)' : item.status === 'FLAG' ? 'color-mix(in oklab, var(--n-warn) 18%, transparent)' : 'color-mix(in oklab, var(--n-danger) 12%, transparent)',
                          color: item.status === 'PASS' ? '#16a34a' : item.status === 'FLAG' ? 'var(--n-warn)' : 'var(--n-danger)',
                          borderColor: 'transparent', fontSize: 12,
                        }}>
                          {item.category}: {item.status}
                        </span>
                      ))}
                      {ins.completedAt && (
                        <span className="n-mono" style={{ color: 'var(--n-muted)', fontSize: 11, marginLeft: 'auto', alignSelf: 'center' }}>
                          Completed {new Date(ins.completedAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Checklist form */}
                  {isActive && (
                    <div style={{ borderTop: '1px solid var(--n-line)', padding: '20px' }}>
                      <div style={{ fontWeight: 500, marginBottom: 16 }}>Inspection checklist</div>
                      <div style={{ display: 'grid', gap: 12 }}>
                        {CATEGORIES.map(cat => {
                          const item = checklist[cat];
                          return (
                            <div key={cat} className="n-card" style={{ padding: '14px 16px', background: 'var(--n-surface-2)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: item.notes !== undefined ? 10 : 0 }}>
                                <div style={{ fontWeight: 500, fontSize: 14, flex: 1 }}>{cat}</div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  {ITEM_OPTIONS.map(opt => (
                                    <button
                                      key={opt.value}
                                      onClick={() => updateItem(cat, 'status', opt.value)}
                                      style={{
                                        padding: '5px 14px', borderRadius: 999, border: `1px solid ${item.status === opt.value ? opt.color : 'var(--n-line)'}`,
                                        background: item.status === opt.value ? `color-mix(in oklab, ${opt.color} 15%, transparent)` : 'transparent',
                                        color: item.status === opt.value ? opt.color : 'var(--n-muted)',
                                        fontFamily: 'inherit', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                                      }}
                                    >
                                      {opt.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <input
                                value={item.notes}
                                onChange={e => updateItem(cat, 'notes', e.target.value)}
                                placeholder={`Notes for ${cat.toLowerCase()}…`}
                                style={inputStyle}
                              />
                            </div>
                          );
                        })}
                      </div>

                      {isDone && (
                        <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 10, background: 'color-mix(in oklab, #22c55e 15%, transparent)', color: '#16a34a', fontWeight: 500 }}>
                          ✓ Inspection marked complete.
                        </div>
                      )}

                      <button
                        onClick={submit}
                        disabled={submitting}
                        className="n-btn accent"
                        style={{ marginTop: 16, width: '100%', justifyContent: 'center', height: 44 }}
                      >
                        {submitting ? 'Submitting…' : <><Icon name="check" /> Mark inspection complete</>}
                      </button>
                    </div>
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
