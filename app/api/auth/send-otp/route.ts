import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateOTP } from '@/lib/auth';
import { sendOtpEmail } from '@/lib/email';
import { z } from 'zod';

const schema = z.object({
  phone: z.string().regex(/^(\+92|0)?3\d{9}$/, 'Invalid Pakistani mobile number'),
  email: z.string().email('Invalid email address').optional(),
});

// In-memory IP rate limiter (resets on server restart — good enough for serverless)
const ipStore = new Map<string, { count: number; resetAt: number }>();

function checkIpLimit(ip: string): boolean {
  const now = Date.now();
  const window = 60_000; // 1 minute
  const maxPerWindow = 10;
  const entry = ipStore.get(ip);
  if (!entry || entry.resetAt < now) {
    ipStore.set(ip, { count: 1, resetAt: now + window });
    return true;
  }
  if (entry.count >= maxPerWindow) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  // IP-level guard: max 10 OTP requests/minute per IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!checkIpLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  let phone = parsed.data.phone.replace(/^0/, '+92');
  if (!phone.startsWith('+')) phone = '+92' + phone;

  const user = await prisma.user.upsert({
    where: { phone },
    create: { phone, email: parsed.data.email ?? null, role: 'TENANT' },
    update: parsed.data.email ? { email: parsed.data.email } : {},
    select: { id: true, email: true },
  });

  // Rate limit: max 3 OTPs per phone per 5 minutes
  const windowStart = new Date(Date.now() - 5 * 60 * 1000);
  const recentCount = await prisma.oTP.count({
    where: { userId: user.id, createdAt: { gte: windowStart } },
  });
  if (recentCount >= 3) {
    return NextResponse.json({ error: 'Too many requests. Please wait a few minutes.' }, { status: 429 });
  }

  await prisma.oTP.updateMany({
    where: { userId: user.id, used: false },
    data: { used: true },
  });

  const code = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await prisma.oTP.create({ data: { userId: user.id, code, expiresAt } });

  const email = parsed.data.email ?? user.email;
  if (email && process.env.RESEND_API_KEY) {
    await sendOtpEmail(email, code).catch(err => console.error('[Resend]', err));
    return NextResponse.json({ success: true, message: `OTP sent to ${email}` });
  }

  // Dev fallback — return OTP in response
  console.log(`[DEV] OTP for ${phone}: ${code}`);
  return NextResponse.json({ success: true, message: 'OTP sent', _dev_otp: code });
}
