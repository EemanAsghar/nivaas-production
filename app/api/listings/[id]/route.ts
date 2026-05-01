import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { order: 'asc' } },
      landlord: { select: { id: true, name: true, phone: true, verificationTier: true, photoUrl: true, createdAt: true } },
      inspections: {
        where: { status: 'COMPLETED' },
        include: { checklistItems: true },
        orderBy: { completedAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ listing });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (listing.landlordId !== session.userId && session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const updated = await prisma.listing.update({ where: { id }, data: body });
  return NextResponse.json({ listing: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (listing.landlordId !== session.userId && session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.listing.update({ where: { id }, data: { status: 'REMOVED' } });
  return NextResponse.json({ success: true });
}
