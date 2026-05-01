'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
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
    <div className="n-root " style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center' }}>
      <div className="n-mono" style={{ color: 'var(--n-danger)', marginBottom: 12, letterSpacing: '0.08em' }}>
        Something went wrong
      </div>

      <h1 className="n-display" style={{ fontSize: 'clamp(56px, 10vw, 100px)', lineHeight: 1, letterSpacing: '-0.03em', margin: '0 0 20px', color: 'var(--n-ink)' }}>
        Oops.
      </h1>

      <p style={{ fontSize: 17, color: 'var(--n-muted)', maxWidth: 420, lineHeight: 1.6, margin: '0 0 12px' }}>
        An unexpected error occurred. This is on us — please try again.
      </p>

      {error.digest && (
        <div className="n-mono" style={{ color: 'var(--n-muted)', fontSize: 10, marginBottom: 32, opacity: 0.6 }}>
          ref: {error.digest}
        </div>
      )}

      {!error.digest && <div style={{ marginBottom: 32 }} />}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={unstable_retry}
          className="n-btn accent"
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          Try again
        </button>
        <Link href="/" className="n-btn ghost" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Back home
        </Link>
      </div>

      <div className="n-mono" style={{ marginTop: 64, color: 'var(--n-muted)', opacity: 0.4, fontSize: 10 }}>
        Nivaas · Rentals you can actually trust
      </div>
    </div>
  );
}
