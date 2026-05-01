import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ count: 0 });

  const myConversationIds = await prisma.conversationParticipant.findMany({
    where: { userId: session.userId },
    select: { conversationId: true },
  });

  const ids = myConversationIds.map((p: { conversationId: string }) => p.conversationId);
  if (ids.length === 0) return NextResponse.json({ count: 0 });

  const count = await prisma.message.count({
    where: {
      conversationId: { in: ids },
      senderId: { not: session.userId },
      status: { not: 'READ' },
    },
  });

  return NextResponse.json({ count });
}
