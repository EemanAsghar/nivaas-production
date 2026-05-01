import Link from 'next/link';

export const metadata = {
  title: '404 — Page not found · Nivaas',
};

export default function NotFound() {
  return (
    <div className="n-root " style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center' }}>
      <div className="n-mono" style={{ color: 'var(--n-muted)', marginBottom: 12, letterSpacing: '0.08em' }}>
        404 · Not found
      </div>

      <h1 className="n-display" style={{ fontSize: 'clamp(64px, 12vw, 120px)', lineHeight: 1, letterSpacing: '-0.03em', margin: '0 0 20px', color: 'var(--n-ink)' }}>
        Lost?
      </h1>

      <p style={{ fontSize: 17, color: 'var(--n-muted)', maxWidth: 400, lineHeight: 1.6, margin: '0 0 36px' }}>
        That page doesn&apos;t exist — or maybe it was a listing that expired. Either way, let&apos;s get you back on track.
      </p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/" className="n-btn accent" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Back home
        </Link>
        <Link href="/search" className="n-btn ghost" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          Browse listings
        </Link>
      </div>

      <div className="n-mono" style={{ marginTop: 64, color: 'var(--n-muted)', opacity: 0.4, fontSize: 10 }}>
        Nivaas · Rentals you can actually trust
      </div>
    </div>
  );
}
