export function formatRent(amount: number): string {
  if (amount >= 100000) return `₨ ${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₨ ${(amount / 1000).toFixed(0)}k`;
  return `₨ ${amount}`;
}

export function formatRentFull(amount: number): string {
  return `₨ ${amount.toLocaleString()}`;
}

export function daysAgo(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

export function daysAgoLabel(dateStr: string): string {
  const d = daysAgo(dateStr);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  return `${d}d ago`;
}

export function computeTrustScore({
  verificationTier,
  ownerVerified,
  photoCount,
  hasInspection,
  isBoosted,
}: {
  verificationTier: string;
  ownerVerified: boolean;
  photoCount: number;
  hasInspection?: boolean;
  isBoosted?: boolean;
}): number {
  let score = 40;
  if (verificationTier === 'VERIFIED') score += 25;
  else if (verificationTier === 'STANDARD') score += 10;
  if (ownerVerified) score += 20;
  if (hasInspection) score += 10;
  if (photoCount >= 3) score += 5;
  if (isBoosted) score += 5;
  return Math.min(score, 95);
}

export function areaLabel(marla?: number | null, sqft?: number | null): string {
  if (marla) return `${marla} marla`;
  if (sqft) return `${sqft.toLocaleString()} sqft`;
  return '—';
}

export function phoneNormalize(raw: string): string {
  let phone = raw.replace(/^0/, '+92');
  if (!phone.startsWith('+')) phone = '+92' + phone;
  return phone;
}

export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}
