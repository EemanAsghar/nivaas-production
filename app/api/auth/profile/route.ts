import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, role, acceptedTerms } = await req.json();

  const data: Record<string, unknown> = {};
  if (name) data.name = name;
  if (role) data.role = role;
  if (acceptedTerms) data.acceptedTerms = true;

  const user = await prisma.user.update({
    where: { id: session.userId },
    data,
    select: { id: true, phone: true, name: true, role: true },
  });

  return NextResponse.json({ user });
}
