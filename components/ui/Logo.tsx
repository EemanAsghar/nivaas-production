'use client';

interface LogoProps {
  size?: number;
}

export default function Logo({ size = 22 }: LogoProps) {
  const h = size;
  const iconW = Math.round(h * 0.9);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      {/* R-house icon */}
      <svg width={iconW} height={h} viewBox="0 0 32 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* House roof */}
        <path d="M16 2L2 13H6V32H26V13H30L16 2Z" fill="#12A68C" fillOpacity="0.18" stroke="#12A68C" strokeWidth="2" strokeLinejoin="round" />
        {/* R letterform inside house */}
        <path d="M12 18H16C18.2 18 20 19.8 20 22C20 24.2 18.2 26 16 26H12V18Z" stroke="#F8F4EE" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <line x1="12" y1="18" x2="12" y2="30" stroke="#F8F4EE" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M16 26L20 30" stroke="#F8F4EE" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
      {/* Brand name */}
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
