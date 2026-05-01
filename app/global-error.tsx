'use client';

import { useEffect } from 'react';
import './globals.css';

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="theme-graphite" style={{ margin: 0, background: 'var(--n-bg)', color: 'var(--n-ink)', fontFamily: "'Inter Tight', system-ui, sans-serif", minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#e37b66', marginBottom: 12 }}>
          Critical error
        </div>

        <h1 style={{ fontFamily: "'Instrument Serif', 'Times New Roman', serif", fontSize: 'clamp(56px, 10vw, 100px)', lineHeight: 1, letterSpacing: '-0.03em', margin: '0 0 20px', fontWeight: 400 }}>
          Oops.
        </h1>

        <p style={{ fontSize: 17, color: '#9ea5ae', maxWidth: 420, lineHeight: 1.6, margin: '0 0 36px' }}>
          The application ran into a critical error. Please try again or return home.
        </p>

        {error.digest && (
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#6e7580', marginBottom: 36 }}>
            ref: {error.digest}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={unstable_retry}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 40, padding: '0 16px', borderRadius: 999, fontFamily: 'inherit', fontWeight: 600, fontSize: 14, border: 'none', background: '#cafc6b', color: '#0f1a00', cursor: 'pointer' }}
          >
            Try again
          </button>
          <a
            href="/"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 40, padding: '0 16px', borderRadius: 999, fontFamily: 'inherit', fontWeight: 500, fontSize: 14, border: '1px solid #2e343b', background: 'transparent', color: '#f2efe8', cursor: 'pointer', textDecoration: 'none' }}
          >
            ← Back home
          </a>
        </div>

        <div style={{ marginTop: 64, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6e7580', opacity: 0.6 }}>
          Nivaas · Rentals you can actually trust
        </div>
      </body>
    </html>
  );
}
