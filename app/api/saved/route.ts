import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const saved = await prisma.savedListing.findMany({
    where: { userId: session.userId },
    include: {
      listing: {
        include: {
          photos: { orderBy: { isCover: 'desc' }, take: 1 },
          landlord: { select: { id: true, name: true, verificationTier: true } },
          _count: { select: { conversations: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ saved: saved.map(s => ({ ...s.listing, savedAt: s.createdAt })) });
}
