'use client';

import { useEffect, useState } from 'react';

export default function ComingSoon() {
  const [logoDown, setLogoDown] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showSub, setShowSub] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setLogoDown(true), 300);
    const t2 = setTimeout(() => setShowText(true), 1100);
    const t3 = setTimeout(() => setShowSub(true), 1700);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #0F2340;
          font-family: 'Inter Tight', system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        .wrapper {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          position: relative;
          overflow: hidden;
        }

        /* Background glow */
        .wrapper::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -60%);
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(18,166,140,0.12) 0%, transparent 70%);
          pointer-events: none;
        }

        .logo-wrap {
          transform: translateY(-120px);
          opacity: 0;
          transition: transform 0.75s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease;
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 48px;
        }
        .logo-wrap.down {
          transform: translateY(0);
          opacity: 1;
        }

        .logo-icon {
          flex-shrink: 0;
        }

        .logo-text {
          font-weight: 700;
          font-size: 28px;
          letter-spacing: -0.04em;
          color: #F8F4EE;
          line-height: 1;
        }

        .coming-soon {
          font-family: 'Instrument Serif', serif;
          font-size: clamp(56px, 10vw, 100px);
          line-height: 0.95;
          letter-spacing: -0.03em;
          color: #F8F4EE;
          text-align: center;
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .coming-soon em {
          font-style: italic;
          color: #12A68C;
        }
        .coming-soon.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .sub {
          margin-top: 24px;
          font-size: 16px;
          color: #8aabb8;
          text-align: center;
          max-width: 380px;
          line-height: 1.65;
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .sub.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .divider {
          width: 40px;
          height: 2px;
          background: #12A68C;
          border-radius: 2px;
          margin: 32px auto 0;
          opacity: 0;
          transition: opacity 0.5s ease 0.2s;
        }
        .divider.visible { opacity: 1; }

        .dots {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }
        .dot {
          position: absolute;
          border-radius: 999px;
          background: rgba(18,166,140,0.15);
          animation: float 8s ease-in-out infinite;
        }
        .dot:nth-child(1) { width: 300px; height: 300px; top: -80px; right: -60px; animation-delay: 0s; }
        .dot:nth-child(2) { width: 200px; height: 200px; bottom: -40px; left: -60px; animation-delay: 2s; }
        .dot:nth-child(3) { width: 120px; height: 120px; bottom: 20%; right: 10%; animation-delay: 4s; background: rgba(232,150,58,0.08); }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-18px); }
        }
      `}</style>

      <div className="wrapper">
        {/* Floating bg blobs */}
        <div className="dots">
          <div className="dot" />
          <div className="dot" />
          <div className="dot" />
        </div>

        {/* Logo drops down */}
        <div className={`logo-wrap ${logoDown ? 'down' : ''}`}>
          <svg className="logo-icon" width="44" height="44" viewBox="0 0 86 88" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polyline points="12,82 12,36 43,6 74,28 74,56" stroke="#4A94CB" strokeWidth="13" fill="none" strokeLinecap="square" strokeLinejoin="miter"/>
            <path d="M 74 56 Q 74 72 56 72 L 12 72" stroke="#4A94CB" strokeWidth="13" fill="none" strokeLinecap="square"/>
            <line x1="56" y1="72" x2="76" y2="84" stroke="#4A94CB" strokeWidth="13" strokeLinecap="square"/>
            <rect x="46" y="28" width="9" height="9" fill="#4A94CB"/>
            <rect x="57" y="28" width="9" height="9" fill="#4A94CB"/>
            <rect x="46" y="39" width="9" height="9" fill="#4A94CB"/>
            <rect x="57" y="39" width="9" height="9" fill="#4A94CB"/>
          </svg>
          <span className="logo-text">Rent Kar Ghar</span>
        </div>

        {/* Coming soon text */}
        <h1 className={`coming-soon ${showText ? 'visible' : ''}`}>
          Coming <em>soon.</em>
        </h1>

        <div className={`divider ${showSub ? 'visible' : ''}`} />

        <p className={`sub ${showSub ? 'visible' : ''}`}>
          Pakistan&apos;s verified rental marketplace is almost here —
          NADRA-verified landlords, real inspections, zero middlemen.
        </p>
      </div>
    </>
  );
}
