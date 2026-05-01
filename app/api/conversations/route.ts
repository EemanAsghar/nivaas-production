import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET — list conversations for current user
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const conversations = await prisma.conversation.findMany({
    where: { participants: { some: { userId: session.userId } } },
    include: {
      listing: { select: { id: true, title: true, city: true, rentAmount: true } },
      participants: { include: { user: { select: { id: true, name: true, phone: true, photoUrl: true } } } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({ conversations });
}

// POST — start a conversation on a listing
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { listingId, message } = await req.json();
  if (!listingId || !message) {
    return NextResponse.json({ error: 'listingId and message are required' }, { status: 400 });
  }

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

  // Check if conversation already exists between these two users on this listing
  const existing = await prisma.conversation.findFirst({
    where: {
      listingId,
      participants: { some: { userId: session.userId } },
    },
  });

  if (existing) {
    // Add message to existing conversation
    await prisma.message.create({
      data: { conversationId: existing.id, senderId: session.userId, body: message },
    });
    await prisma.conversation.update({ where: { id: existing.id }, data: { updatedAt: new Date() } });
    return NextResponse.json({ conversationId: existing.id });
  }

  // Create new conversation
  const conversation = await prisma.conversation.create({
    data: {
      listingId,
      participants: {
        create: [
          { userId: session.userId },
          { userId: listing.landlordId },
        ],
      },
      messages: {
        create: { senderId: session.userId, body: message },
      },
    },
  });

  return NextResponse.json({ conversationId: conversation.id }, { status: 201 });
}
