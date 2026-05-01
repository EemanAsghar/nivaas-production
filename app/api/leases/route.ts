import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notify } from '@/lib/notify';

// GET — leases for the current user (as landlord or tenant)
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const leases = await prisma.lease.findMany({
    where: {
      OR: [{ landlordId: session.userId }, { tenantId: session.userId }],
    },
    include: {
      listing: { select: { id: true, title: true, city: true, locality: true } },
      tenant:  { select: { id: true, name: true, phone: true } },
      landlord:{ select: { id: true, name: true, phone: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Lazy status transitions
  const now = new Date();
  const toUpdate = leases.filter(l =>
    (l.status === 'SIGNED' && l.startDate && l.startDate <= now) ||
    (l.status === 'ACTIVE' && l.endDate   && l.endDate   <= now)
  );
  if (toUpdate.length > 0) {
    await Promise.all(toUpdate.map(l =>
      prisma.lease.update({
        where: { id: l.id },
        data: { status: l.status === 'SIGNED' ? 'ACTIVE' : 'EXPIRED' },
      })
    ));
    // Re-fetch with updated statuses
    const updated = await prisma.lease.findMany({
      where: { OR: [{ landlordId: session.userId }, { tenantId: session.userId }] },
      include: {
        listing: { select: { id: true, title: true, city: true, locality: true } },
        tenant:  { select: { id: true, name: true, phone: true } },
        landlord:{ select: { id: true, name: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ leases: updated });
  }

  return NextResponse.json({ leases });
}

// POST — landlord creates a lease draft
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'LANDLORD' && session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only landlords can create leases' }, { status: 403 });
  }

  const { listingId, tenantId, startDate, endDate, monthlyRent, securityDeposit } = await req.json();
  if (!listingId || !tenantId || !startDate || !endDate || !monthlyRent || !securityDeposit) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.landlordId !== session.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const lease = await prisma.lease.create({
    data: {
      listingId,
      tenantId,
      landlordId: session.userId,
      startDate:  new Date(startDate),
      endDate:    new Date(endDate),
      monthlyRent: parseInt(monthlyRent),
      securityDeposit: parseInt(securityDeposit),
      status: 'PENDING_SIGNATURES',
    },
    include: {
      listing: { select: { id: true, title: true, city: true, locality: true } },
      tenant:  { select: { id: true, name: true, phone: true } },
      landlord:{ select: { id: true, name: true, phone: true } },
    },
  });

  // Notify the tenant a lease has been drafted for them
  await notify(tenantId, 'New lease agreement', `${listing.title} — your landlord has drafted a lease for you to review and sign.`, `/leases/${lease.id}`);

  return NextResponse.json({ lease }, { status: 201 });
}
