'use client';

import { useState } from 'react';
import Link from 'next/link';
import Icon from './Icon';
import { useAuth } from '@/components/auth/AuthProvider';

export default function OnboardingBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (!user || dismissed) return null;

  const needsName = !user.name;
  const needsVerification = user.verificationTier === 'BASIC';

  if (!needsName && !needsVerification) return null;

  const steps = [
    needsName && {
      icon: 'user' as const,
      label: 'Add your name',
      desc: 'So landlords know who they\'re talking to',
      href: '/account',
      done: false,
    },
    needsVerification && {
      icon: 'shield' as const,
      label: 'Verify your identity',
      desc: 'Upload CNIC to unlock higher-trust listings',
      href: '/account#verify',
      done: false,
    },
  ].filter(Boolean) as { icon: 'user' | 'shield'; label: string; desc: string; href: string; done: boolean }[];

  return (
    <div style={{
      background: 'var(--n-accent-soft)',
      borderBottom: '1px solid var(--n-line)',
      padding: '12px 40px',
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div className="n-mono" style={{ color: 'var(--n-accent-ink)', whiteSpace: 'nowrap' }}>
            Complete your profile
          </div>
          {steps.map(s => (
            <Link
              key={s.href}
              href={s.href}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 12px', borderRadius: 8,
                background: 'rgba(0,0,0,0.06)',
                color: 'var(--n-accent-ink)', fontSize: 13, fontWeight: 500,
                whiteSpace: 'nowrap',
              }}
            >
              <Icon name={s.icon} />
              {s.label}
            </Link>
          ))}
        </div>
        <button
          onClick={() => setDismissed(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--n-accent-ink)', opacity: 0.6, padding: 4, flexShrink: 0 }}
          aria-label="Dismiss"
        >
          <Icon name="close" className="n-ico" />
        </button>
      </div>
    </div>
  );
}
