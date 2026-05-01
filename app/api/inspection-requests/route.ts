import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notify } from '@/lib/notify';

// POST — tenant requests an inspection for a listing
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { listingId, type, gateway } = await req.json();
  if (!listingId || !type) {
    return NextResponse.json({ error: 'listingId and type are required' }, { status: 400 });
  }
  if (!['MOVE_IN', 'MOVE_OUT', 'GENERAL'].includes(type)) {
    return NextResponse.json({ error: 'Invalid inspection type' }, { status: 400 });
  }

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

  // Mock payment for inspection fee
  await prisma.payment.create({
    data: {
      userId: session.userId,
      listingId,
      type: 'INSPECTION',
      amount: 1800,
      gateway: gateway ?? 'JAZZCASH',
      status: 'COMPLETED',
      reference: `DEMO-INSP-${Date.now()}`,
      paidAt: new Date(),
    },
  });

  const request = await prisma.inspectionRequest.create({
    data: {
      listingId,
      requesterId: session.userId,
      type,
      status: 'REQUESTED',
      feeAmount: 1800,
    },
  });

  // Notify all admins
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
  await Promise.all(admins.map(a =>
    notify(a.id, 'New inspection request', `${type.replace('_', '-')} inspection requested for ${listing.title}`, '/admin')
  ));

  return NextResponse.json({ request }, { status: 201 });
}

// GET — tenant's own inspection requests
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const requests = await prisma.inspectionRequest.findMany({
    where: { requesterId: session.userId },
    include: {
      listing: { select: { id: true, title: true, city: true, locality: true } },
      inspector: { select: { id: true, name: true, phone: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ requests });
}
