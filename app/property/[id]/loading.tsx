import TopBar from '@/components/ui/TopBar';

export default function Loading() {
  return (
    <div className="n-root">
      <TopBar />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 40px', display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32, alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ height: 480, borderRadius: 14, background: 'var(--n-line)', opacity: 0.4 }} />
          <div style={{ height: 24, width: '60%', borderRadius: 8, background: 'var(--n-line)', opacity: 0.3 }} />
          <div style={{ height: 16, width: '40%', borderRadius: 8, background: 'var(--n-line)', opacity: 0.2 }} />
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          <div className="n-card" style={{ height: 280, opacity: 0.4 }} />
          <div className="n-card" style={{ height: 120, opacity: 0.3 }} />
        </div>
      </div>
    </div>
  );
}
