'use client';

interface LogoProps {
  size?: number;
}

export default function Logo({ size = 22 }: LogoProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M4 20V4l8 8 8-8v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
      </svg>
      <span className="n-display" style={{ fontSize: size * 1.1, letterSpacing: '-0.02em' }}>Nivaas</span>
    </div>
  );
}
