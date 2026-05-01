import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reviews = await prisma.review.findMany({
    where: { listingId: id },
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { id: true, name: true, photoUrl: true, createdAt: true } } },
  });
  const avg = reviews.length
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : null;
  return NextResponse.json({ reviews, avg, count: reviews.length });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const { id } = await params;
  const { rating, comment } = await req.json();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be 1–5' }, { status: 400 });
  }

  const existing = await prisma.review.findUnique({
    where: { listingId_authorId: { listingId: id, authorId: session.userId } },
  });
  if (existing) {
    return NextResponse.json({ error: 'You have already reviewed this listing' }, { status: 409 });
  }

  const review = await prisma.review.create({
    data: { listingId: id, authorId: session.userId, rating, comment: comment?.trim() || null },
    include: { author: { select: { id: true, name: true, photoUrl: true, createdAt: true } } },
  });

  return NextResponse.json({ review }, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const { id } = await params;
  await prisma.review.deleteMany({
    where: { listingId: id, authorId: session.userId },
  });
  return NextResponse.json({ success: true });
}
