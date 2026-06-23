import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notify } from '@/lib/notify';

const DEMO_INSPECTOR_PHONE = '+923009876543';

// Realistic checklist auto-generated when scheduled time passes
const AUTO_CHECKLIST = [
  { category: 'Electrical',       status: 'PASS', notes: 'All sockets tested and functional. MCB/fuse box in good condition. No exposed wiring observed. Earth leakage tested — within safe limits.' },
  { category: 'Gas',              status: 'PASS', notes: 'Gas meter reading recorded. All connections checked with soap solution — no leaks detected. Stove burners and geysers operating normally.' },
  { category: 'Water / Plumbing', status: 'FLAG', notes: 'Water pressure adequate. Minor drip noted at kitchen mixer tap — washer replacement recommended within 30 days. All drainage clear.' },
  { category: 'Structural',       status: 'PASS', notes: 'Walls, ceiling and floors inspected. No dampness, cracks or subsidence observed. Doors and windows seal properly. Roof access confirmed watertight.' },
];

// Lazy auto-complete: if a scheduled inspection's time has passed, generate its report
async function autoCompleteIfDue(inspectionId: string) {
  const inspection = await prisma.inspectionRequest.findUnique({
    where: { id: inspectionId },
    include: { checklistItems: true },
  });
  if (!inspection || inspection.status !== 'ASSIGNED') return;
  if (!inspection.scheduledAt || inspection.scheduledAt > new Date()) return;

  await prisma.inspectionItem.deleteMany({ where: { inspectionId } });
  await prisma.inspectionItem.createMany({
    data: AUTO_CHECKLIST.map(item => ({ inspectionId, ...item })),
  });
  await prisma.inspectionRequest.update({
    where: { id: inspectionId },
    data: { status: 'COMPLETED', completedAt: new Date() },
  });
  await notify(
    inspection.requesterId,
    'Inspection report ready',
    'Your property inspection has been completed. View the full report in your activity.',
    `/activity`
  );
}

// POST — tenant requests an inspection
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { listingId, type, gateway } = await req.json();
  if (!listingId || !type) return NextResponse.json({ error: 'listingId and type are required' }, { status: 400 });
  if (!['MOVE_IN', 'MOVE_OUT', 'GENERAL'].includes(type)) return NextResponse.json({ error: 'Invalid inspection type' }, { status: 400 });

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

  // Record payment (mock gateway — always succeeds for demo)
  await prisma.payment.create({
    data: {
      userId: session.userId,
      listingId,
      type: 'INSPECTION',
      amount: 1800,
      gateway: gateway ?? 'JAZZCASH',
      status: 'COMPLETED',
      reference: `RKG-INSP-${Date.now()}`,
      paidAt: new Date(),
    },
  });

  // Find (or create) the demo inspector
  const inspector = await prisma.user.upsert({
    where: { phone: DEMO_INSPECTOR_PHONE },
    create: {
      phone: DEMO_INSPECTOR_PHONE,
      name: 'Tariq Hussain',
      role: 'INSPECTOR',
      verificationTier: 'VERIFIED',
      isActive: true,
      acceptedTerms: true,
    },
    update: {},
    select: { id: true, name: true },
  });

  // Schedule for tomorrow 10 am — realistic next-business-day assignment
  // For demo the auto-complete fires as soon as scheduledAt passes (2 min from now)
  const scheduledAt = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3-hour minimum inspection window

  const request = await prisma.inspectionRequest.create({
    data: {
      listingId,
      requesterId: session.userId,
      inspectorId: inspector.id,
      type,
      status: 'ASSIGNED',
      scheduledAt,
      feeAmount: 1800,
    },
    include: {
      listing: { select: { id: true, title: true, city: true, locality: true } },
      inspector: { select: { id: true, name: true, phone: true } },
    },
  });

  // Notify requester and inspector
  await notify(
    session.userId,
    'Inspector assigned',
    `${inspector.name} has been assigned to your ${type.replace('_', '-').toLowerCase()} inspection for ${listing.title}. Expected within 24 hours.`,
    '/activity'
  );

  return NextResponse.json({ request }, { status: 201 });
}

// GET — tenant's own inspection requests (with lazy auto-complete)
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const requests = await prisma.inspectionRequest.findMany({
    where: { requesterId: session.userId },
    include: {
      listing: { select: { id: true, title: true, city: true, locality: true } },
      inspector: { select: { id: true, name: true, phone: true } },
      checklistItems: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Lazy auto-complete any that are past their scheduled time
  const due = requests.filter(r => r.status === 'ASSIGNED' && r.scheduledAt && r.scheduledAt <= new Date());
  await Promise.all(due.map(r => autoCompleteIfDue(r.id)));

  // Re-fetch if anything was auto-completed
  if (due.length > 0) {
    const refreshed = await prisma.inspectionRequest.findMany({
      where: { requesterId: session.userId },
      include: {
        listing: { select: { id: true, title: true, city: true, locality: true } },
        inspector: { select: { id: true, name: true, phone: true } },
        checklistItems: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ requests: refreshed });
  }

  return NextResponse.json({ requests });
}
