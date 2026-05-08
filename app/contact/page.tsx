'use client';

import { useState } from 'react';
import Link from 'next/link';
import TopBar from '@/components/ui/TopBar';
import Icon from '@/components/ui/Icon';

const CHANNELS = [
  {
    icon: 'chat' as const,
    label: 'Email us',
    value: 'hello@rentkarghar.com',
    desc: 'For general enquiries, partnerships, and press.',
    href: 'mailto:hello@rentkarghar.com',
  },
  {
    icon: 'shield' as const,
    label: 'Privacy & legal',
    value: 'privacy@rentkarghar.com',
    desc: 'GDPR / data requests, CNIC deletion, legal notices.',
    href: 'mailto:privacy@rentkarghar.com',
  },
  {
    icon: 'stamp' as const,
    label: 'Inspection support',
    value: 'inspections@rentkarghar.com',
    desc: 'Questions about scheduled inspections or reports.',
    href: 'mailto:inspections@rentkarghar.com',
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    // In production this would POST to /api/contact
    // For now simulate a short delay then mark sent
    await new Promise(r => setTimeout(r, 800));
    setStatus('sent');
  }

  return (
    <div className="n-root">
      <TopBar />

      {/* Hero */}
      <div style={{ padding: 'clamp(48px, 6vw, 72px) 40px 48px', maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
        <div className="n-chip" style={{ marginBottom: 20, display: 'inline-flex' }}>
          <Icon name="chat" style={{ width: 12, height: 12 }} /> Get in touch
        </div>
        <h1 className="n-display" style={{ fontSize: 'clamp(40px, 6vw, 68px)', lineHeight: 1.0, letterSpacing: '-0.03em', margin: '0 0 18px' }}>
          We&apos;d love to hear from you
        </h1>
        <p style={{ fontSize: 16, color: 'var(--n-muted)', lineHeight: 1.65, maxWidth: 500, margin: '0 auto' }}>
          Whether you&apos;re a tenant, landlord, or just curious — drop us a message and we&apos;ll get back to you within 24 hours.
        </p>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 40px 80px', display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 40, alignItems: 'start' }}>

        {/* Left — contact channels */}
        <div style={{ display: 'grid', gap: 14 }}>
          <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 4 }}>Contact channels</div>
          {CHANNELS.map(c => (
            <a key={c.label} href={c.href} className="n-card" style={{ padding: '18px 20px', display: 'flex', gap: 16, alignItems: 'flex-start', textDecoration: 'none', color: 'var(--n-ink)', transition: 'border-color 0.15s' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--n-accent-soft)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Icon name={c.icon} className="n-ico" style={{ color: 'var(--n-accent)' }} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{c.label}</div>
                <div style={{ fontSize: 13, color: 'var(--n-accent)', marginBottom: 4, fontWeight: 500 }}>{c.value}</div>
                <div style={{ fontSize: 12, color: 'var(--n-muted)', lineHeight: 1.5 }}>{c.desc}</div>
              </div>
            </a>
          ))}

          {/* Response time */}
          <div className="n-card" style={{ padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'center', background: 'var(--n-accent-soft)', border: '1px solid rgba(18,166,140,0.3)' }}>
            <Icon name="calendar" className="n-ico" style={{ color: 'var(--n-accent)', flexShrink: 0 }} />
            <div style={{ fontSize: 13, color: 'var(--n-ink)', lineHeight: 1.5 }}>
              <span style={{ fontWeight: 600 }}>Typical response time:</span> under 24 hours on business days.
            </div>
          </div>
        </div>

        {/* Right — contact form */}
        <div className="n-card" style={{ padding: '28px 28px' }}>
          <div style={{ fontWeight: 600, fontSize: 17, marginBottom: 4 }}>Send a message</div>
          <div style={{ fontSize: 13, color: 'var(--n-muted)', marginBottom: 24 }}>We read every message personally.</div>

          {status === 'sent' ? (
            <div style={{ padding: '32px 24px', textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 999, background: 'var(--n-accent-soft)', border: '1.5px solid var(--n-accent)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
                <Icon name="shield" className="n-ico lg" style={{ color: 'var(--n-accent)' }} />
              </div>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Message sent!</div>
              <div style={{ fontSize: 14, color: 'var(--n-muted)', lineHeight: 1.6, marginBottom: 20 }}>
                Thanks for reaching out. We&apos;ll get back to you within 24 hours.
              </div>
              <button className="n-btn ghost sm" onClick={() => { setStatus('idle'); setForm({ name: '', email: '', subject: '', message: '' }); }}>
                Send another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--n-muted)', marginBottom: 6 }}>Your name</label>
                  <input
                    required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ali Hassan"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--n-line)', background: 'var(--n-bg)', color: 'var(--n-ink)', fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--n-muted)', marginBottom: 6 }}>Email address</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="ali@example.com"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--n-line)', background: 'var(--n-bg)', color: 'var(--n-ink)', fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--n-muted)', marginBottom: 6 }}>Subject</label>
                <select
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--n-line)', background: 'var(--n-bg)', color: form.subject ? 'var(--n-ink)' : 'var(--n-muted)', fontSize: 14, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}
                >
                  <option value="">Select a topic…</option>
                  <option value="general">General enquiry</option>
                  <option value="listing">Listing help</option>
                  <option value="inspection">Inspection question</option>
                  <option value="lease">Lease & legal</option>
                  <option value="report">Report a problem</option>
                  <option value="partnership">Partnership / press</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--n-muted)', marginBottom: 6 }}>Message</label>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Tell us how we can help…"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--n-line)', background: 'var(--n-bg)', color: 'var(--n-ink)', fontSize: 14, outline: 'none', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.6 }}
                />
              </div>

              <button
                type="submit"
                disabled={status === 'sending'}
                className="n-btn accent"
                style={{ height: 46, fontSize: 15, justifyContent: 'center' }}
              >
                {status === 'sending' ? 'Sending…' : (
                  <><Icon name="arrow" /> Send message</>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Footer nudge */}
      <div style={{ borderTop: '1px solid var(--n-line)', padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontSize: 13, color: 'var(--n-muted)' }}>© 2026 Rent Kar Ghar</span>
        <div style={{ display: 'flex', gap: 20, fontSize: 13 }}>
          <Link href="/about" style={{ color: 'var(--n-muted)' }}>About</Link>
          <Link href="/terms" style={{ color: 'var(--n-muted)' }}>Terms</Link>
          <Link href="/privacy" style={{ color: 'var(--n-muted)' }}>Privacy</Link>
        </div>
      </div>
    </div>
  );
}
