import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [listings, conversations, unread, pendingViewings] = await Promise.all([
    prisma.listing.findMany({
      where: { landlordId: session.userId },
      include: {
        photos: { where: { isCover: true }, take: 1 },
        _count: { select: { conversations: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.conversation.findMany({
      where: { participants: { some: { userId: session.userId } } },
      include: {
        listing: { select: { id: true, title: true, city: true } },
        participants: {
          where: { userId: { not: session.userId } },
          include: { user: { select: { id: true, name: true, phone: true } } },
        },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    }),
    prisma.message.count({
      where: {
        conversation: { participants: { some: { userId: session.userId } } },
        senderId: { not: session.userId },
        status: { in: ['SENT', 'DELIVERED'] },
      },
    }),
    prisma.viewingRequest.count({
      where: {
        listing: { landlordId: session.userId },
        status: 'PENDING',
      },
    }),
  ]);

  const active = listings.filter((l: { status: string }) => l.status === 'ACTIVE').length;
  const draft = listings.filter((l: { status: string }) => l.status === 'DRAFT').length;

  return NextResponse.json({
    stats: { total: listings.length, active, draft, unread, pendingViewings },
    listings,
    conversations,
  });
}
