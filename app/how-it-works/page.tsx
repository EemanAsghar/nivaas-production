import Link from 'next/link';
import TopBar from '@/components/ui/TopBar';
import Icon from '@/components/ui/Icon';

const STEPS = [
  {
    n: '01',
    title: 'Search verified listings',
    body: 'Browse rentals across six mid-sized Punjab cities. Every listing shows a Trust Score so you know exactly how verified it is before you visit.',
    icon: 'search' as const,
  },
  {
    n: '02',
    title: 'Message the landlord directly',
    body: 'No middlemen. Send a message, ask questions, and request a viewing — all from within the platform.',
    icon: 'chat' as const,
  },
  {
    n: '03',
    title: 'Request a professional inspection',
    body: 'Optional but recommended. A Nivaas inspector visits the property and checks gas, electricity, water, and structure. You get a full report.',
    icon: 'stamp' as const,
  },
  {
    n: '04',
    title: 'NADRA-verified identity',
    body: 'Landlords and tenants both verify their identity through CNIC upload + NADRA confirmation. Fake listings and fraudulent tenants are screened out.',
    icon: 'shield' as const,
  },
];

const TRUST_FACTORS = [
  { label: 'Phone verified',        points: 'Base',   desc: 'Every account starts with OTP verification.' },
  { label: 'CNIC uploaded',         points: '+10',    desc: 'CNIC submitted and pending NADRA confirmation.' },
  { label: 'NADRA confirmed',       points: '+25',    desc: 'Identity fully verified with NADRA.' },
  { label: 'Owner-verified listing',points: '+20',    desc: 'Admin has confirmed the landlord owns the property.' },
  { label: 'Professional inspection',points: '+10',   desc: 'A Nivaas inspector has visited the property.' },
  { label: '3+ photos uploaded',    points: '+5',     desc: 'Listing has at least 3 real photos.' },
];

const CITIES = ['Sialkot', 'Gujranwala', 'Sargodha', 'Narowal', 'Nankana Sahib', 'Hafizabad'];

export default function HowItWorksPage() {
  return (
    <div className="n-root">
      <TopBar />

      {/* Hero */}
      <div style={{ padding: '64px 40px 48px', maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
        <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 14 }}>Transparency · Trust · No BS</div>
        <h1 className="n-display" style={{ fontSize: 'clamp(48px, 7vw, 84px)', lineHeight: 0.95, letterSpacing: '-0.025em', margin: '0 0 24px' }}>
          How Nivaas works
        </h1>
        <p style={{ fontSize: 18, color: 'var(--n-muted)', lineHeight: 1.6, maxWidth: 560, margin: '0 auto 36px' }}>
          A rental platform built for cities that were being ignored — with verified identities, real inspections, and zero middlemen.
        </p>
        <Link href="/search" className="n-btn accent" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 48, fontSize: 15, padding: '0 28px' }}>
          <Icon name="search" /> Start browsing
        </Link>
      </div>

      {/* Steps */}
      <div id="how-it-works" style={{ maxWidth: 860, margin: '0 auto', padding: '0 40px 64px' }}>
        <div style={{ display: 'grid', gap: 16 }}>
          {STEPS.map((s, i) => (
            <div key={s.n} id={s.n === '03' ? 'inspections' : s.n === '04' ? 'verify' : undefined} className="n-card" style={{ padding: 28, display: 'grid', gridTemplateColumns: '48px 1fr', gap: 24, alignItems: 'start' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: i === 0 ? 'var(--n-accent-soft)' : 'var(--n-surface-2)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Icon name={s.icon} className="n-ico lg" style={{ color: i === 0 ? 'var(--n-accent-ink)' : 'var(--n-muted)' }} />
              </div>
              <div>
                <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 6 }}>Step {s.n}</div>
                <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontSize: 15, color: 'var(--n-muted)', lineHeight: 1.6 }}>{s.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust score explained */}
      <div style={{ background: 'var(--n-bg-2)', borderTop: '1px solid var(--n-line)', borderBottom: '1px solid var(--n-line)', padding: '64px 40px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 8 }}>Scoring system</div>
          <h2 className="n-display" style={{ fontSize: 44, margin: '0 0 8px', letterSpacing: '-0.02em' }}>The Trust Score</h2>
          <p style={{ fontSize: 16, color: 'var(--n-muted)', marginBottom: 36, maxWidth: 520, lineHeight: 1.6 }}>
            Every listing gets a score from 40–95 based on how much we know about the landlord and property. Higher means safer.
          </p>
          <div style={{ display: 'grid', gap: 10 }}>
            {TRUST_FACTORS.map(f => (
              <div key={f.label} className="n-card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ minWidth: 52, textAlign: 'center' }}>
                  <span className="n-display" style={{ fontSize: 22, color: 'var(--n-accent-ink)' }}>{f.points}</span>
                </div>
                <div style={{ width: 1, height: 32, background: 'var(--n-line)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{f.label}</div>
                  <div style={{ fontSize: 13, color: 'var(--n-muted)', marginTop: 2 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cities */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '64px 40px' }}>
        <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 8 }}>Coverage</div>
        <h2 className="n-display" style={{ fontSize: 44, margin: '0 0 24px', letterSpacing: '-0.02em' }}>Six cities. Fully covered.</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {CITIES.map(c => (
            <Link key={c} href={`/search?city=${encodeURIComponent(c)}`} className="n-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'var(--n-ink)' }}>
              <Icon name="pin" style={{ color: 'var(--n-accent-ink)', flexShrink: 0 }} />
              <span style={{ fontWeight: 500 }}>{c}</span>
              <Icon name="arrow" className="n-ico" style={{ color: 'var(--n-muted)', marginLeft: 'auto' }} />
            </Link>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: 'var(--n-bg-2)', borderTop: '1px solid var(--n-line)', padding: '64px 40px', textAlign: 'center' }}>
        <h2 className="n-display" style={{ fontSize: 48, margin: '0 0 16px', letterSpacing: '-0.02em' }}>Ready to find your next home?</h2>
        <p style={{ fontSize: 16, color: 'var(--n-muted)', marginBottom: 32 }}>Browse verified listings. No broker fees. No surprises.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/search" className="n-btn accent" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 48, fontSize: 15, padding: '0 28px' }}>
            <Icon name="search" /> Browse listings
          </Link>
          <Link href="/list-property" className="n-btn ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 48, fontSize: 15, padding: '0 28px' }}>
            <Icon name="plus" /> List your property
          </Link>
        </div>
      </div>
    </div>
  );
}
