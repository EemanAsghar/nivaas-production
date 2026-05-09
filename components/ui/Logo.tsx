'use client';

interface LogoProps {
  size?: number;
}

export default function Logo({ size = 42 }: LogoProps) {
  return (
    <svg
      viewBox="0 0 100 112"
      xmlns="http://www.w3.org/2000/svg"
      style={{ height: size, width: 'auto', display: 'block', flexShrink: 0 }}
      aria-label="Rent Kar Ghar"
      role="img"
    >
      {/*
        R-house mark: one compound path (evenodd) carves the hollow interior
        out of the outer silhouette, then the 4 window squares sit inside.
      */}
      <path
        fillRule="evenodd"
        fill="var(--n-accent)"
        d={[
          // ── Outer silhouette (clockwise) ──────────────────────────────
          'M 8,104',
          'L 8,32',
          'L 48,5',       // roof peak
          'L 88,32',
          'L 88,70',      // bottom of P-bump outer edge
          'Q 88,82 76,82',// curve around bottom of bump
          'L 60,82',      // body right, where leg roots
          'L 80,104',     // leg bottom-right
          'L 67,104',     // leg bottom-left
          'L 46,82',      // leg top-left
          'L 22,82',
          'L 22,104',
          'Z',

          // ── Inner hollow (counter-clockwise → evenodd cuts it out) ────
          'M 22,35',
          'L 75,35',
          'Q 83,35 83,51.5',
          'Q 83,68 75,68',
          'L 22,68',
          'Z',
        ].join(' ')}
      />

      {/* 2×2 window — filled teal squares inside the hollow */}
      <rect fill="var(--n-accent)" x="28" y="41" width="13" height="11" rx="1" />
      <rect fill="var(--n-accent)" x="44" y="41" width="13" height="11" rx="1" />
      <rect fill="var(--n-accent)" x="28" y="55" width="13" height="11" rx="1" />
      <rect fill="var(--n-accent)" x="44" y="55" width="13" height="11" rx="1" />
    </svg>
  );
}
