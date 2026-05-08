'use client';

interface LogoProps {
  size?: number;
}

export default function Logo({ size = 22 }: LogoProps) {
  const h = size;
  const w = Math.round(h * 0.98);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      {/* R-house mark — matches actual brand logo */}
      <svg width={w} height={h} viewBox="0 0 86 88" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Left stem → roof peak → right wall */}
        <polyline
          points="12,82 12,36 43,6 74,28 74,56"
          stroke="#4A94CB"
          strokeWidth="13"
          fill="none"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
        {/* R bowl arc */}
        <path
          d="M 74 56 Q 74 72 56 72 L 12 72"
          stroke="#4A94CB"
          strokeWidth="13"
          fill="none"
          strokeLinecap="square"
        />
        {/* R diagonal leg */}
        <line x1="56" y1="72" x2="76" y2="84" stroke="#4A94CB" strokeWidth="13" strokeLinecap="square"/>
        {/* Window — 2×2 panes */}
        <rect x="46" y="28" width="9" height="9" fill="#4A94CB"/>
        <rect x="57" y="28" width="9" height="9" fill="#4A94CB"/>
        <rect x="46" y="39" width="9" height="9" fill="#4A94CB"/>
        <rect x="57" y="39" width="9" height="9" fill="#4A94CB"/>
      </svg>
      <span style={{
        fontFamily: "'Inter Tight', system-ui, sans-serif",
        fontWeight: 700,
        fontSize: size * 0.72,
        letterSpacing: '-0.03em',
        color: 'var(--n-ink)',
        lineHeight: 1,
      }}>
        Rent Kar Ghar
      </span>
    </div>
  );
}
