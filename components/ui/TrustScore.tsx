'use client';

interface TrustScoreProps {
  value: number;
  size?: number;
}

export default function TrustScore({ value, size = 64 }: TrustScoreProps) {
  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;
  const off = c * (1 - value / 100);
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-block', flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--n-line)" strokeWidth="3" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="var(--n-accent)" strokeWidth="3"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
        <span className="n-display" style={{ fontSize: size * 0.42 }}>{value}</span>
        <span className="n-mono" style={{ fontSize: 8, color: 'var(--n-muted)', marginTop: 2 }}>TRUST</span>
      </div>
    </div>
  );
}
