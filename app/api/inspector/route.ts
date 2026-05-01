import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function requireInspector() {
  const session = await getSession();
  if (!session || session.role !== 'INSPECTOR') return null;
  return session;
}

// GET — inspector's assigned inspections
export async function GET() {
  const session = await requireInspector();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const inspections = await prisma.inspectionRequest.findMany({
    where: { inspectorId: session.userId },
    include: {
      listing: { select: { id: true, title: true, city: true, locality: true, address: true } },
      requester: { select: { id: true, name: true, phone: true } },
      checklistItems: true,
    },
    orderBy: [{ status: 'asc' }, { scheduledAt: 'asc' }],
  });

  return NextResponse.json({ inspections });
}

// PATCH — submit checklist and mark inspection complete
export async function PATCH(req: NextRequest) {
  const session = await requireInspector();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, checklist } = await req.json() as {
    id: string;
    checklist: { category: string; status: string; notes?: string }[];
  };

  if (!id || !Array.isArray(checklist) || checklist.length === 0) {
    return NextResponse.json({ error: 'id and checklist are required' }, { status: 400 });
  }

  const inspection = await prisma.inspectionRequest.findUnique({ where: { id } });
  if (!inspection) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (inspection.inspectorId !== session.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (inspection.status === 'COMPLETED') return NextResponse.json({ error: 'Already completed' }, { status: 400 });

  // Delete existing checklist items and replace with new ones
  await prisma.inspectionItem.deleteMany({ where: { inspectionId: id } });
  await prisma.inspectionItem.createMany({
    data: checklist.map(item => ({
      inspectionId: id,
      category: item.category,
      status: item.status,
      notes: item.notes ?? null,
    })),
  });

  const updated = await prisma.inspectionRequest.update({
    where: { id },
    data: { status: 'COMPLETED', completedAt: new Date() },
    include: { checklistItems: true },
  });

  return NextResponse.json({ inspection: updated });
}
