import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const rows = await prisma.listing.groupBy({
    by: ['city'],
    where: { status: 'ACTIVE' },
    _count: { _all: true },
  });

  const counts: Record<string, number> = {};
  for (const r of rows) {
    counts[r.city] = r._count._all;
  }

  return NextResponse.json({ counts });
}
