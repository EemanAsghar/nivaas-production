import Link from 'next/link';
import TopBar from '@/components/ui/TopBar';
import Icon from '@/components/ui/Icon';

export const metadata = {
  title: 'About — Rent Kar Ghar',
  description: 'The story behind Rent Kar Ghar — why we built Pakistan\'s first verified rental marketplace.',
};

const STATS = [
  { value: '6+', label: 'Cities covered' },
  { value: '100%', label: 'NADRA-verified landlords' },
  { value: '₨0', label: 'Broker fees' },
  { value: '24h', label: 'Avg. response time' },
];

export default function AboutPage() {
  return (
    <div className="n-root">
      <TopBar />

      {/* Hero */}
      <div style={{ padding: 'clamp(48px, 7vw, 80px) 40px 56px', maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
        <div className="n-chip" style={{ marginBottom: 20, display: 'inline-flex' }}>
          <Icon name="shield" style={{ width: 12, height: 12 }} /> Our story
        </div>
        <h1 className="n-display" style={{ fontSize: 'clamp(40px, 6vw, 72px)', lineHeight: 1.0, letterSpacing: '-0.03em', margin: '0 0 24px' }}>
          We built this because{' '}
          <em style={{ color: 'var(--n-accent)', fontStyle: 'italic' }}>renting in Pakistan is broken.</em>
        </h1>
        <p style={{ fontSize: 17, color: 'var(--n-muted)', lineHeight: 1.7, maxWidth: 620, margin: '0 auto' }}>
          Finding a rental home in Punjab meant relying on unreliable brokers, unverified listings, and zero transparency.
          Rent Kar Ghar was built to fix exactly that.
        </p>
      </div>

      {/* Stats */}
      <div style={{ background: 'var(--n-surface)', borderTop: '1px solid var(--n-line)', borderBottom: '1px solid var(--n-line)', padding: '48px 40px' }}>
        <div className="n-stats-row" style={{ maxWidth: 860, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
          {STATS.map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div className="n-display" style={{ fontSize: 42, letterSpacing: '-0.03em', color: 'var(--n-accent)', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: 'var(--n-muted)', marginTop: 8, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Problem / Solution */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '64px 40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
        <div>
          <div className="n-mono" style={{ color: 'var(--n-warn)', marginBottom: 12 }}>The problem</div>
          <h2 className="n-display" style={{ fontSize: 36, margin: '0 0 20px', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            A market built on mistrust
          </h2>
          <div style={{ display: 'grid', gap: 14 }}>
            {[
              'Brokers charging 1–2 month commissions with no accountability',
              'Fake listings pulling in hopeful tenants',
              'No way to verify if the landlord actually owns the property',
              'Move-in disputes with no paper trail',
              'Harassment and discrimination with zero recourse',
            ].map(point => (
              <div key={point} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 14, color: 'var(--n-muted)', lineHeight: 1.6 }}>
                <div style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--n-warn)', marginTop: 6, flexShrink: 0 }} />
                {point}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="n-mono" style={{ color: 'var(--n-accent)', marginBottom: 12 }}>Our solution</div>
          <h2 className="n-display" style={{ fontSize: 36, margin: '0 0 20px', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            Verified. Transparent. Yours.
          </h2>
          <div style={{ display: 'grid', gap: 14 }}>
            {[
              'NADRA identity verification for every landlord on the platform',
              'Owner-confirmed listings — admin-approved before going live',
              'Professional inspections by our trained team',
              'Digital leases with e-signatures and full legal standing',
              'Zero broker fees — ever',
            ].map(point => (
              <div key={point} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 14, color: 'var(--n-muted)', lineHeight: 1.6 }}>
                <div style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--n-accent)', marginTop: 6, flexShrink: 0 }} />
                {point}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mission */}
      <div style={{ background: 'var(--n-bg-2)', borderTop: '1px solid var(--n-line)', borderBottom: '1px solid var(--n-line)', padding: '64px 40px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
          <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 16 }}>Our mission</div>
          <blockquote className="n-display" style={{ fontSize: 'clamp(24px, 3.5vw, 40px)', lineHeight: 1.2, letterSpacing: '-0.02em', color: 'var(--n-ink)', margin: '0 0 24px', fontStyle: 'italic' }}>
            &ldquo;Make renting in Pakistan as safe, simple, and trustworthy as it should be.&rdquo;
          </blockquote>
          <p style={{ fontSize: 15, color: 'var(--n-muted)', lineHeight: 1.6 }}>
            We started in Punjab&apos;s mid-sized cities — Sialkot, Gujranwala, Sargodha, Narowal, Nankana Sahib, Hafizabad —
            the places big platforms ignore. Every feature we&apos;ve built serves one goal: a tenant and landlord who can trust each other.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: 'var(--n-surface)', borderTop: '1px solid var(--n-line)', padding: '56px 40px', textAlign: 'center' }}>
        <h2 className="n-display" style={{ fontSize: 44, margin: '0 0 16px', letterSpacing: '-0.02em' }}>Ready to find your home?</h2>
        <p style={{ fontSize: 16, color: 'var(--n-muted)', marginBottom: 28 }}>Browse verified listings. No broker. No surprises.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/search" className="n-btn accent" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 48, fontSize: 15, padding: '0 28px' }}>
            <Icon name="search" /> Browse listings
          </Link>
          <Link href="/contact" className="n-btn ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 48, fontSize: 15, padding: '0 28px' }}>
            <Icon name="chat" /> Get in touch
          </Link>
        </div>
      </div>
    </div>
  );
}
