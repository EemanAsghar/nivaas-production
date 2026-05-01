import TopBar from '@/components/ui/TopBar';

export default function Loading() {
  return (
    <div className="n-root">
      <TopBar role="landlord" />
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: 'calc(100vh - 65px)' }}>
        <div style={{ padding: '24px 18px', borderRight: '1px solid var(--n-line)', background: 'var(--n-bg-2)', display: 'grid', gap: 8, alignContent: 'start' }}>
          {[0,1,2,3,4].map(i => <div key={i} style={{ height: 40, borderRadius: 10, background: 'var(--n-line)', opacity: 0.3 - i * 0.04 }} />)}
        </div>
        <div style={{ padding: '28px 32px', display: 'grid', gap: 16, alignContent: 'start' }}>
          <div style={{ height: 48, width: '50%', borderRadius: 10, background: 'var(--n-line)', opacity: 0.4 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[0,1,2,3].map(i => <div key={i} className="n-card" style={{ height: 100, opacity: 0.35 }} />)}
          </div>
          <div className="n-card" style={{ height: 300, opacity: 0.3 }} />
        </div>
      </div>
    </div>
  );
}
