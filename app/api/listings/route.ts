import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { notify } from '@/lib/notify';
import { z } from 'zod';

const createSchema = z.object({
  title: z.string().min(5),
  description: z.string().optional(),
  city: z.string(),
  locality: z.string(),
  propertyType: z.string(),
  rentAmount: z.number().int().positive(),
  rooms: z.number().int().min(1),
  bathrooms: z.number().int().min(1),
  areaMarla: z.number().optional(),
  areaSqft: z.number().int().optional(),
  furnishing: z.enum(['Furnished', 'Semi-furnished', 'Unfurnished']),
  utilities: z.array(z.string()),
  listingType: z.enum(['EXCLUSIVE_RIGHT', 'EXCLUSIVE_AGENCY', 'OPEN']).default('OPEN'),
});

// GET /api/listings — list all active listings (with filters)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get('city');
  const minRent = searchParams.get('minRent');
  const maxRent = searchParams.get('maxRent');
  const rooms = searchParams.get('rooms');
  const furnishing = searchParams.get('furnishing');
  const verifiedOnly = searchParams.get('verifiedOnly') === 'true';
  const page = parseInt(searchParams.get('page') ?? '1');
  const limit = parseInt(searchParams.get('limit') ?? '20');

  const where: Record<string, unknown> = { status: 'ACTIVE' };
  if (city) where.city = { contains: city, mode: 'insensitive' };
  if (minRent || maxRent) {
    where.rentAmount = {};
    if (minRent) (where.rentAmount as Record<string, number>).gte = parseInt(minRent);
    if (maxRent) (where.rentAmount as Record<string, number>).lte = parseInt(maxRent);
  }
  if (rooms) where.rooms = { gte: parseInt(rooms) };
  if (furnishing) where.furnishing = furnishing;
  if (verifiedOnly) where.landlord = { verificationTier: 'VERIFIED' };

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: {
        photos: { where: { isCover: true }, take: 1 },
        landlord: { select: { id: true, name: true, verificationTier: true, photoUrl: true } },
      },
      orderBy: [{ isBoosted: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.listing.count({ where }),
  ]);

  return NextResponse.json({ listings, total, page, pages: Math.ceil(total / limit) });
}

// POST /api/listings — create a new listing (landlord only)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'LANDLORD' && session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only landlords can create listings' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const listing = await prisma.listing.create({
    data: { ...parsed.data, landlordId: session.userId, status: 'DRAFT' },
  });

  // Notify users whose saved searches match this listing
  const matchingSearches = await prisma.savedSearch.findMany({
    where: {
      city: { equals: parsed.data.city, mode: 'insensitive' },
      userId: { not: session.userId },
      AND: [
        parsed.data.rentAmount
          ? { OR: [{ maxRent: null }, { maxRent: { gte: parsed.data.rentAmount } }] }
          : {},
        parsed.data.rooms
          ? { OR: [{ minRooms: null }, { minRooms: { lte: parsed.data.rooms } }] }
          : {},
        parsed.data.propertyType
          ? { OR: [{ propType: null }, { propType: parsed.data.propertyType }] }
          : {},
      ],
    },
  });

  await Promise.all(
    matchingSearches.map((s: { userId: string; label: string | null }) =>
      notify(
        s.userId,
        'New listing matches your search',
        `A new ${parsed.data.propertyType} in ${parsed.data.city} matches your saved search${s.label ? ` "${s.label}"` : ''}.`,
        `/property/${listing.id}`
      )
    )
  );

  return NextResponse.json({ listing }, { status: 201 });
}
