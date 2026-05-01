import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const FEE_TABLE: Record<string, number> = {
  LISTING_FEE:  1500,
  BOOST:        500,
  INSPECTION:   1800,
  VERIFICATION: 300,
};

// POST — mock payment (no real gateway integration)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { type, listingId, gateway } = await req.json();

  if (!type || !FEE_TABLE[type]) {
    return NextResponse.json({ error: 'Invalid payment type' }, { status: 400 });
  }
  if (!['JAZZCASH', 'EASYPAISA', 'CARD'].includes(gateway ?? '')) {
    return NextResponse.json({ error: 'Invalid gateway — use JAZZCASH, EASYPAISA, or CARD' }, { status: 400 });
  }

  const amount = FEE_TABLE[type];

  // Simulate payment processing (always succeeds in demo mode)
  const payment = await prisma.payment.create({
    data: {
      userId:    session.userId,
      listingId: listingId ?? null,
      type,
      amount,
      gateway,
      status:    'COMPLETED',
      reference: `DEMO-${Date.now()}`,
      paidAt:    new Date(),
    },
  });

  // Side-effects
  if (type === 'LISTING_FEE' && listingId) {
    await prisma.listing.update({
      where: { id: listingId },
      data: { status: 'ACTIVE' },
    });
  }

  if (type === 'BOOST' && listingId) {
    await prisma.listing.update({
      where: { id: listingId },
      data: { isBoosted: true, boostExpiresAt: new Date(Date.now() + 7 * 86400000) },
    });
  }

  if (type === 'VERIFICATION') {
    await prisma.user.update({
      where: { id: session.userId },
      data: { verificationTier: 'STANDARD' },
    });
  }

  return NextResponse.json({ payment }, { status: 201 });
}

// GET — payment history for current user
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payments = await prisma.payment.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ payments });
}
