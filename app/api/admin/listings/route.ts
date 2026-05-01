import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return null;
  return session;
}

// GET — all listings with filters
export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  const listings = await prisma.listing.findMany({
    where: status ? { status: status as never } : undefined,
    include: {
      photos: { where: { isCover: true }, take: 1 },
      landlord: { select: { id: true, name: true, phone: true, verificationTier: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json({ listings });
}

// PATCH — approve/reject listing (ownerVerified, status)
export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, ownerVerified, status } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (ownerVerified !== undefined) data.ownerVerified = ownerVerified;
  if (status) data.status = status;

  const listing = await prisma.listing.update({ where: { id }, data });
  return NextResponse.json({ listing });
}
