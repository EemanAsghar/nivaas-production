'use client';

import Icon from './Icon';
import type { BadgeKind } from '@/lib/data';

const badgeConfig: Record<BadgeKind, { label: string; icon: Parameters<typeof Icon>[0]['name'] }> = {
  nadra:     { label: 'NADRA Verified', icon: 'shield'   },
  inspected: { label: 'Inspected',      icon: 'stamp'    },
  exclusive: { label: 'Exclusive',      icon: 'sparkle'  },
  boost:     { label: 'Boosted',        icon: 'zap'      },
  owner:     { label: 'Owner Verified', icon: 'badge'    },
};

interface TrustBadgeProps {
  kind: BadgeKind;
  size?: 'sm' | 'md';
}

export default function TrustBadge({ kind, size = 'md' }: TrustBadgeProps) {
  const cfg = badgeConfig[kind];
  if (!cfg) return null;
  const isVerified = kind === 'nadra' || kind === 'inspected';
  return (
    <span
      className={`n-chip${isVerified ? ' verified' : ''}`}
      style={{ height: size === 'sm' ? 22 : 26, fontSize: size === 'sm' ? 11 : 12 }}
    >
      <Icon name={cfg.icon} className="n-ico" />
      {cfg.label}
    </span>
  );
}
