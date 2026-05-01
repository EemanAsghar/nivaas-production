import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  // Verify user is a participant
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: session.userId } },
  });
  if (!participant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [conversation, messages] = await Promise.all([
    prisma.conversation.findUnique({
      where: { id },
      include: {
        listing: { select: { id: true, title: true, city: true, rentAmount: true } },
        participants: { include: { user: { select: { id: true, name: true, phone: true } } } },
      },
    }),
    prisma.message.findMany({
      where: { conversationId: id },
      include: { sender: { select: { id: true, name: true, phone: true, photoUrl: true } } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.message.updateMany({
      where: { conversationId: id, senderId: { not: session.userId }, status: { not: 'READ' } },
      data: { status: 'READ' },
    }),
  ]);

  return NextResponse.json({ conversation, messages });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { body } = await req.json();
  if (!body?.trim()) return NextResponse.json({ error: 'Message body required' }, { status: 400 });

  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: session.userId } },
  });
  if (!participant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const message = await prisma.message.create({
    data: { conversationId: id, senderId: session.userId, body },
    include: { sender: { select: { id: true, name: true, photoUrl: true } } },
  });

  await prisma.conversation.update({ where: { id }, data: { updatedAt: new Date() } });

  return NextResponse.json({ message }, { status: 201 });
}
