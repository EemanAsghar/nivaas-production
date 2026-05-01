import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const searches = await prisma.savedSearch.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ searches });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { city, maxRent, minRooms, propType, label } = await req.json();
  if (!city) return NextResponse.json({ error: 'city required' }, { status: 400 });

  const existing = await prisma.savedSearch.count({ where: { userId: session.userId } });
  if (existing >= 10) return NextResponse.json({ error: 'Max 10 saved searches' }, { status: 400 });

  const search = await prisma.savedSearch.create({
    data: {
      userId: session.userId,
      city,
      maxRent: maxRent ? parseInt(maxRent) : null,
      minRooms: minRooms ? parseInt(minRooms) : null,
      propType: propType || null,
      label: label || null,
    },
  });

  return NextResponse.json({ search }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  await prisma.savedSearch.deleteMany({ where: { id, userId: session.userId } });
  return NextResponse.json({ success: true });
}
