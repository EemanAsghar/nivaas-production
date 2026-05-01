import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const city        = searchParams.get('city') ?? '';
  const locality    = searchParams.get('locality') ?? '';
  const q           = searchParams.get('q') ?? '';
  const minRent     = searchParams.get('minRent');
  const maxRent     = searchParams.get('maxRent');
  const rooms       = searchParams.get('rooms');
  const propertyType = searchParams.get('type');
  const furnishing  = searchParams.get('furnishing');
  const verified    = searchParams.get('verified') === 'true' || searchParams.get('verifiedOnly') === 'true';
  const inspected   = searchParams.get('inspected') === 'true';
  const sort        = searchParams.get('sort') ?? 'newest'; // newest | price_asc | price_desc
  const page        = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit       = Math.min(50, parseInt(searchParams.get('limit') ?? '20'));

  const where: Record<string, unknown> = {
    status: 'ACTIVE',
    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
  };

  if (city) where.city = { contains: city, mode: 'insensitive' };
  if (locality) where.locality = { contains: locality, mode: 'insensitive' };
  if (q) where.OR = [
    { title:    { contains: q, mode: 'insensitive' } },
    { locality: { contains: q, mode: 'insensitive' } },
    { city:     { contains: q, mode: 'insensitive' } },
  ];
  if (propertyType) where.propertyType = propertyType;
  if (furnishing) where.furnishing = furnishing;
  if (rooms) where.rooms = { gte: parseInt(rooms) };

  if (minRent || maxRent) {
    where.rentAmount = {};
    if (minRent) (where.rentAmount as Record<string, number>).gte = parseInt(minRent);
    if (maxRent) (where.rentAmount as Record<string, number>).lte = parseInt(maxRent);
  }

  if (verified) {
    where.landlord = { verificationTier: { in: ['STANDARD', 'VERIFIED'] } };
  }

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: {
        photos: { orderBy: { isCover: 'desc' }, take: 4 },
        landlord: { select: { id: true, name: true, verificationTier: true } },
        inspections: inspected ? { where: { status: 'COMPLETED' }, take: 1 } : false,
      },
      orderBy: sort === 'price_asc'
        ? [{ isBoosted: 'desc' }, { rentAmount: 'asc' }]
        : sort === 'price_desc'
        ? [{ isBoosted: 'desc' }, { rentAmount: 'desc' }]
        : [{ isBoosted: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.listing.count({ where }),
  ]);

  // Filter inspected if needed (after query since it's a relation)
  const filtered = inspected ? listings.filter((l: { inspections: unknown[] }) => l.inspections.length > 0) : listings;

  return NextResponse.json({ listings: filtered, total, page, pages: Math.ceil(total / limit) });
}
