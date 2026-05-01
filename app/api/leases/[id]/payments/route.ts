import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const lease = await prisma.lease.findUnique({ where: { id } });
  if (!lease) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (lease.tenantId !== session.userId && lease.landlordId !== session.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const payments = await prisma.payment.findMany({
    where: { listingId: lease.listingId, type: 'RENT', userId: lease.tenantId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ payments });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const lease = await prisma.lease.findUnique({ where: { id } });
  if (!lease) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (lease.landlordId !== session.userId) {
    return NextResponse.json({ error: 'Only the landlord can record rent payments' }, { status: 403 });
  }

  const { month, note } = await req.json(); // month: "2025-04" ISO month string

  const payment = await prisma.payment.create({
    data: {
      userId:    lease.tenantId,
      listingId: lease.listingId,
      type:      'RENT',
      amount:    lease.monthlyRent,
      status:    'COMPLETED',
      reference: month ?? new Date().toISOString().slice(0, 7),
      gateway:   note ?? null,
      paidAt:    new Date(),
    },
  });

  return NextResponse.json({ payment }, { status: 201 });
}
