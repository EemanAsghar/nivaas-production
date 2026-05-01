export default function Loading() {
  return (
    <div className="n-root" style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
      <span className="n-mono" style={{ color: 'var(--n-muted)' }}>Loading…</span>
    </div>
  );
}
