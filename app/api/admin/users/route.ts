import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return null;
  return session;
}

// GET — all users (paginated)
export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const tier = searchParams.get('tier');
  const role = searchParams.get('role');

  const users = await prisma.user.findMany({
    where: {
      ...(tier ? { verificationTier: tier as never } : {}),
      ...(role ? { role: role as never } : {}),
    },
    select: {
      id: true, name: true, phone: true, role: true,
      verificationTier: true, cnicFrontUrl: true, cnicBackUrl: true,
      cnicVerifiedAt: true, createdAt: true, isActive: true,
      _count: { select: { listings: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return NextResponse.json({ users });
}

// PATCH — update a user (verificationTier, role, isActive)
export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, verificationTier, role, isActive } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (verificationTier) data.verificationTier = verificationTier;
  if (role) data.role = role;
  if (isActive !== undefined) data.isActive = isActive;
  if (verificationTier === 'VERIFIED') data.cnicVerifiedAt = new Date();

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, phone: true, role: true, verificationTier: true },
  });

  return NextResponse.json({ user });
}
