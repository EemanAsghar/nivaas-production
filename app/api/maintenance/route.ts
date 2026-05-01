import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET  — list requests (tenant sees their own; landlord sees on their listings)
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const listingId = searchParams.get('listingId');

  const where: Record<string, unknown> = {};

  if (session.role === 'TENANT') {
    where.tenantId = session.userId;
  } else if (session.role === 'LANDLORD') {
    where.listing = { landlordId: session.userId };
  } else if (session.role === 'ADMIN') {
    // admin sees all
  } else {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (listingId) where.listingId = listingId;

  const requests = await prisma.maintenanceRequest.findMany({
    where,
    include: {
      listing: { select: { id: true, title: true, city: true, locality: true } },
      tenant:  { select: { id: true, name: true, phone: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ requests });
}

// POST — tenant creates a request
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'TENANT' && session.role !== 'ADMIN')
    return NextResponse.json({ error: 'Only tenants can submit maintenance requests' }, { status: 403 });

  const body = await req.json();
  const { listingId, title, description, category, priority } = body;

  if (!listingId || !title?.trim() || !description?.trim() || !category)
    return NextResponse.json({ error: 'listingId, title, description and category are required' }, { status: 400 });

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

  const request = await prisma.maintenanceRequest.create({
    data: {
      listingId,
      tenantId: session.userId,
      title: title.trim(),
      description: description.trim(),
      category,
      priority: priority ?? 'NORMAL',
    },
    include: {
      listing: { select: { id: true, title: true, landlordId: true } },
    },
  });

  // Notify the landlord
  const { notify } = await import('@/lib/notify');
  await notify(
    request.listing.landlordId,
    'New maintenance request',
    `${title.trim()} — ${category} issue reported for "${request.listing.title}"`,
    `/maintenance`
  ).catch(() => {});

  return NextResponse.json({ request }, { status: 201 });
}

// PATCH — landlord updates status / adds note
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { id, status, landlordNote } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const existing = await prisma.maintenanceRequest.findUnique({
    where: { id },
    include: { listing: true },
  });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (session.role === 'LANDLORD' && existing.listing.landlordId !== session.userId)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const update: Record<string, unknown> = {};
  if (status) {
    update.status = status;
    if (status === 'RESOLVED') update.resolvedAt = new Date();
  }
  if (landlordNote !== undefined) update.landlordNote = landlordNote;

  const updated = await prisma.maintenanceRequest.update({ where: { id }, data: update });

  // Notify tenant of status change
  if (status && status !== existing.status) {
    const { notify } = await import('@/lib/notify');
    await notify(
      existing.tenantId,
      'Maintenance update',
      `Your request "${existing.title}" is now ${status.toLowerCase().replace('_', ' ')}`,
      `/maintenance`
    ).catch(() => {});
  }

  return NextResponse.json({ request: updated });
}
