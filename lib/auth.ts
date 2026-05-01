import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? 'fallback-secret');

export interface SessionPayload {
  userId: string;
  role: string;
  phone: string;
}

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('nivaas_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

// Generates a 6-digit OTP (in prod this would call Twilio)
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
