import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';
import { z } from 'zod';

const schema = z.object({
  phone: z.string(),
  code: z.string().length(6),
  role: z.enum(['TENANT', 'LANDLORD']).optional(),
  name: z.string().optional(),
  acceptedTerms: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  let phone = parsed.data.phone.replace(/^0/, '+92');
  if (!phone.startsWith('+')) phone = '+92' + phone;

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const otp = await prisma.oTP.findFirst({
    where: { userId: user.id, code: parsed.data.code, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });

  if (!otp) return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 401 });

  // Mark OTP used
  await prisma.oTP.update({ where: { id: otp.id }, data: { used: true } });

  // Update user profile if provided
  const updateData: Record<string, unknown> = {};
  if (parsed.data.role) updateData.role = parsed.data.role;
  if (parsed.data.name) updateData.name = parsed.data.name;
  if (parsed.data.acceptedTerms) updateData.acceptedTerms = true;

  const updatedUser = await prisma.user.update({ where: { id: user.id }, data: updateData });

  const token = await signToken({ userId: updatedUser.id, role: updatedUser.role, phone: updatedUser.phone });

  const res = NextResponse.json({
    success: true,
    user: { id: updatedUser.id, phone: updatedUser.phone, name: updatedUser.name, role: updatedUser.role },
  });

  res.cookies.set('nivaas_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });

  return res;
}
