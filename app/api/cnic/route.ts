import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadToR2 } from '@/lib/r2';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const front = formData.get('cnicFront') as File | null;
  const back  = formData.get('cnicBack')  as File | null;

  if (!front || !back) {
    return NextResponse.json({ error: 'Both CNIC sides are required' }, { status: 400 });
  }

  const useR2 = !!(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID);

  let frontUrl: string;
  let backUrl: string;

  if (useR2) {
    const frontExt = front.name.split('.').pop() ?? 'jpg';
    const backExt  = back.name.split('.').pop()  ?? 'jpg';
    [frontUrl, backUrl] = await Promise.all([
      uploadToR2(`cnic/${session.userId}/front-${Date.now()}.${frontExt}`, Buffer.from(await front.arrayBuffer()), front.type || 'image/jpeg'),
      uploadToR2(`cnic/${session.userId}/back-${Date.now()}.${backExt}`,   Buffer.from(await back.arrayBuffer()),  back.type  || 'image/jpeg'),
    ]);
  } else {
    const dir = path.join(process.cwd(), 'public', 'uploads', 'cnic', session.userId);
    await mkdir(dir, { recursive: true });
    const frontFile = `front-${Date.now()}.${front.name.split('.').pop() ?? 'jpg'}`;
    const backFile  = `back-${Date.now()}.${back.name.split('.').pop()  ?? 'jpg'}`;
    await Promise.all([
      writeFile(path.join(dir, frontFile), Buffer.from(await front.arrayBuffer())),
      writeFile(path.join(dir, backFile),  Buffer.from(await back.arrayBuffer())),
    ]);
    frontUrl = `/uploads/cnic/${session.userId}/${frontFile}`;
    backUrl  = `/uploads/cnic/${session.userId}/${backFile}`;
  }

  const user = await prisma.user.update({
    where: { id: session.userId },
    data: { cnicFrontUrl: frontUrl, cnicBackUrl: backUrl, verificationTier: 'STANDARD' },
    select: { id: true, name: true, verificationTier: true },
  });

  return NextResponse.json({ user });
}
