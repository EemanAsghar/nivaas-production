import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notify } from '@/lib/notify';

// GET — viewing requests for the landlord (their listings) or tenant (their requests)
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get('status'); // optional: PENDING | ACCEPTED | REJECTED

  const where: Record<string, unknown> = session.role === 'LANDLORD'
    ? { listing: { landlordId: session.userId } }
    : { requesterId: session.userId };

  if (statusFilter) where.status = statusFilter;

  const viewings = await prisma.viewingRequest.findMany({
    where,
    include: {
      listing: { select: { id: true, title: true, city: true, locality: true } },
      requester: { select: { id: true, name: true, phone: true, verificationTier: true } },
      conversation: { select: { id: true } },
    },
    orderBy: { proposedAt: 'asc' },
  });

  return NextResponse.json({ viewings });
}

// POST — create a viewing request (also sends a message in the conversation)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { listingId, conversationId, proposedAt, note } = await req.json();
  if (!listingId || !proposedAt) {
    return NextResponse.json({ error: 'listingId and proposedAt are required' }, { status: 400 });
  }

  const proposedDate = new Date(proposedAt);
  if (isNaN(proposedDate.getTime())) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
  }

  // Verify user is a participant in the conversation (if conversationId provided)
  if (conversationId) {
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: session.userId } },
    });
    if (!participant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const viewing = await prisma.viewingRequest.create({
    data: {
      listingId,
      conversationId: conversationId ?? '',
      requesterId: session.userId,
      proposedAt: proposedDate,
      note: note ?? null,
      status: 'PENDING',
    },
  });

  // Send a system message in the conversation
  if (conversationId) {
    const dateStr = proposedDate.toLocaleString('en-PK', {
      weekday: 'short', day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit',
    });
    await prisma.message.create({
      data: {
        conversationId,
        senderId: session.userId,
        body: `📅 Viewing requested for ${dateStr}${note ? ` — ${note}` : ''}`,
      },
    });
    await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
  }

  // Notify the landlord
  const listingRecord = await prisma.listing.findUnique({ where: { id: listingId }, select: { landlordId: true, title: true } });
  if (listingRecord) {
    const requester = await prisma.user.findUnique({ where: { id: session.userId }, select: { name: true, phone: true } });
    const who = requester?.name ?? requester?.phone ?? 'Someone';
    await notify(listingRecord.landlordId, 'New viewing request', `${who} wants to view ${listingRecord.title}`, '/dashboard');
  }

  return NextResponse.json({ viewing }, { status: 201 });
}

// PATCH — accept / reject a viewing request
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, status } = await req.json();
  if (!id || !['ACCEPTED', 'REJECTED', 'RESCHEDULED'].includes(status)) {
    return NextResponse.json({ error: 'id and valid status required' }, { status: 400 });
  }

  const viewing = await prisma.viewingRequest.findUnique({
    where: { id },
    include: { listing: { select: { landlordId: true } } },
  });
  if (!viewing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const isLandlord = viewing.listing.landlordId === session.userId;
  const isRequester = viewing.requesterId === session.userId;
  if (!isLandlord && !isRequester && session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const updated = await prisma.viewingRequest.update({ where: { id }, data: { status } });

  if (viewing.conversationId) {
    const dateStr = new Date(viewing.proposedAt).toLocaleString('en-PK', {
      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
    const body =
      status === 'ACCEPTED'   ? `✅ Viewing confirmed for ${dateStr}. See you then!` :
      status === 'REJECTED'   ? `❌ Viewing request for ${dateStr} was declined. Feel free to propose a new time.` :
      status === 'RESCHEDULED'? `🔄 Viewing request rescheduled — a new time will be proposed shortly.` :
      `Viewing status updated to ${status.toLowerCase()}.`;

    await prisma.message.create({
      data: { conversationId: viewing.conversationId, senderId: session.userId, body },
    });
    await prisma.conversation.update({ where: { id: viewing.conversationId }, data: { updatedAt: new Date() } });
  }

  // Notify the other party
  const notifyUserId = isLandlord ? viewing.requesterId : viewing.listing.landlordId;
  const dateStr2 = new Date(viewing.proposedAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' });
  const notifBody =
    status === 'ACCEPTED'    ? `Your viewing on ${dateStr2} has been confirmed.` :
    status === 'REJECTED'    ? `Your viewing request for ${dateStr2} was declined.` :
    `Your viewing request for ${dateStr2} has been rescheduled.`;
  await notify(notifyUserId, 'Viewing update', notifBody, `/messages/${viewing.conversationId}`);

  return NextResponse.json({ viewing: updated });
}
