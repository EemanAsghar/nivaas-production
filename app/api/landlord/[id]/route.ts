import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const landlord = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      phone: true,
      verificationTier: true,
      photoUrl: true,
      createdAt: true,
      listings: {
        where: { status: 'ACTIVE' },
        include: { photos: { where: { isCover: true }, take: 1 } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!landlord) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ landlord });
}
