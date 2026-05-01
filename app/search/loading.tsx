import TopBar from '@/components/ui/TopBar';

export default function Loading() {
  return (
    <div className="n-root">
      <TopBar />
      <div style={{ padding: '14px 40px', borderBottom: '1px solid var(--n-line)', background: 'var(--n-bg)' }}>
        <div style={{ height: 36, width: 600, borderRadius: 999, background: 'var(--n-line)', opacity: 0.5 }} />
      </div>
      <div style={{ padding: '20px 40px', display: 'grid', gap: 10 }}>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="n-card" style={{ height: 160, opacity: 0.4 - i * 0.06 }} />
        ))}
      </div>
    </div>
  );
}
