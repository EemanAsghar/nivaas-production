import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notify } from '@/lib/notify';

// GET — single lease
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const lease = await prisma.lease.findUnique({
    where: { id },
    include: {
      listing: { select: { id: true, title: true, city: true, locality: true, address: true } },
      tenant:  { select: { id: true, name: true, phone: true } },
      landlord:{ select: { id: true, name: true, phone: true } },
    },
  });

  if (!lease) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (lease.tenantId !== session.userId && lease.landlordId !== session.userId && session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Lazy status transition: SIGNED → ACTIVE → EXPIRED
  const now = new Date();
  let transitionStatus: string | null = null;
  if (lease.status === 'SIGNED' && lease.startDate && lease.startDate <= now) transitionStatus = 'ACTIVE';
  if (lease.status === 'ACTIVE' && lease.endDate && lease.endDate <= now)     transitionStatus = 'EXPIRED';
  if (transitionStatus) {
    const refreshed = await prisma.lease.update({
      where: { id },
      data: { status: transitionStatus as never },
      include: {
        listing: { select: { id: true, title: true, city: true, locality: true, address: true } },
        tenant:  { select: { id: true, name: true, phone: true } },
        landlord:{ select: { id: true, name: true, phone: true } },
      },
    });
    return NextResponse.json({ lease: refreshed });
  }

  return NextResponse.json({ lease });
}

// PATCH — sign the lease
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { action } = await req.json(); // 'sign'

  if (action !== 'sign') return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  const lease = await prisma.lease.findUnique({ where: { id } });
  if (!lease) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const isLandlord = lease.landlordId === session.userId;
  const isTenant   = lease.tenantId   === session.userId;
  if (!isLandlord && !isTenant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (lease.status === 'SIGNED') return NextResponse.json({ error: 'Already signed by both parties' }, { status: 400 });

  const now = new Date();
  const data: Record<string, unknown> = {};

  if (isLandlord && !lease.landlordSignedAt) data.landlordSignedAt = now;
  if (isTenant   && !lease.tenantSignedAt)   data.tenantSignedAt   = now;

  // Determine new status
  const landlordSigned = isLandlord ? true : !!lease.landlordSignedAt;
  const tenantSigned   = isTenant   ? true : !!lease.tenantSignedAt;
  if (landlordSigned && tenantSigned) {
    data.status = 'SIGNED';
  }

  const updated = await prisma.lease.update({
    where: { id },
    data,
    include: {
      listing: { select: { id: true, title: true, city: true, locality: true, address: true } },
      tenant:  { select: { id: true, name: true, phone: true } },
      landlord:{ select: { id: true, name: true, phone: true } },
    },
  });

  // Notify the other party
  const otherUserId = isLandlord ? updated.tenantId : updated.landlordId;
  const signerName  = isLandlord ? (updated.landlord.name ?? updated.landlord.phone) : (updated.tenant.name ?? updated.tenant.phone);
  if (landlordSigned && tenantSigned) {
    await notify(updated.tenantId,   'Lease fully signed', `Both parties have signed the lease for ${updated.listing.title}.`, `/leases/${id}`);
    await notify(updated.landlordId, 'Lease fully signed', `Both parties have signed the lease for ${updated.listing.title}.`, `/leases/${id}`);
  } else {
    await notify(otherUserId, 'Lease signed', `${signerName} has signed the lease for ${updated.listing.title}. Your signature is needed.`, `/leases/${id}`);
  }

  return NextResponse.json({ lease: updated });
}
