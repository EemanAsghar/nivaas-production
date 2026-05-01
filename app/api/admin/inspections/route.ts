import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notify } from '@/lib/notify';

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return null;
  return session;
}

// GET — all inspection requests + list of available inspectors
export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [requests, inspectors] = await Promise.all([
    prisma.inspectionRequest.findMany({
      include: {
        listing: { select: { id: true, title: true, city: true, locality: true } },
        requester: { select: { id: true, name: true, phone: true } },
        inspector: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.findMany({
      where: { role: 'INSPECTOR', isActive: true },
      select: { id: true, name: true, phone: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return NextResponse.json({ requests, inspectors });
}

// PATCH — assign inspector, set scheduledAt, or update status
export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, inspectorId, scheduledAt, status } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (inspectorId !== undefined) data.inspectorId = inspectorId;
  if (scheduledAt !== undefined) data.scheduledAt = new Date(scheduledAt);
  if (status !== undefined) data.status = status;

  const updated = await prisma.inspectionRequest.update({
    where: { id },
    data,
    include: {
      listing: { select: { title: true } },
      requester: { select: { id: true } },
    },
  });

  // Notify inspector when assigned
  if (inspectorId) {
    const dateLabel = scheduledAt
      ? new Date(scheduledAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })
      : 'TBD';
    await notify(inspectorId, 'Inspection assigned', `You have been assigned a ${updated.type.replace('_', '-')} inspection for ${updated.listing.title} on ${dateLabel}.`, '/inspector');
  }

  // Notify requester when inspector assigned or status changed
  if (inspectorId || status) {
    const msg = inspectorId
      ? `An inspector has been assigned to your inspection for ${updated.listing.title}.`
      : `Your inspection for ${updated.listing.title} status updated to ${(status as string).toLowerCase().replace('_', ' ')}.`;
    await notify(updated.requester.id, 'Inspection update', msg, '/activity');
  }

  return NextResponse.json({ request: updated });
}
