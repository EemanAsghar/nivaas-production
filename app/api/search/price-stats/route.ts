import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/search/price-stats?city=Sialkot&type=House&rooms=3
// Returns avg/min/max rent for matching active listings
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city  = searchParams.get('city');
  const type  = searchParams.get('type');
  const rooms = searchParams.get('rooms');

  if (!city) return NextResponse.json({ error: 'city required' }, { status: 400 });

  const where: Record<string, unknown> = {
    status: 'ACTIVE',
    city: { equals: city, mode: 'insensitive' },
  };
  if (type)  where.propertyType = type;
  if (rooms) where.rooms = { gte: parseInt(rooms) };

  const listings = await prisma.listing.findMany({
    where,
    select: { rentAmount: true },
    take: 200,
  });

  if (!listings.length) return NextResponse.json({ count: 0, avg: null, min: null, max: null });

  const rents = listings.map(l => l.rentAmount);
  const avg = Math.round(rents.reduce((a, b) => a + b, 0) / rents.length);
  const min = Math.min(...rents);
  const max = Math.max(...rents);

  return NextResponse.json({ count: rents.length, avg, min, max });
}
