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
  const file = formData.get('avatar') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const ext = file.name.split('.').pop() ?? 'jpg';
  const buffer = Buffer.from(await file.arrayBuffer());
  const useR2 = !!(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID);

  let photoUrl: string;
  if (useR2) {
    const { uploadToR2: upload } = await import('@/lib/r2');
    photoUrl = await upload(`avatars/${session.userId}.${ext}`, buffer, file.type || 'image/jpeg');
  } else {
    const dir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    await mkdir(dir, { recursive: true });
    const filename = `${session.userId}.${ext}`;
    await writeFile(path.join(dir, filename), buffer);
    photoUrl = `/uploads/avatars/${filename}`;
  }

  const user = await prisma.user.update({
    where: { id: session.userId },
    data: { photoUrl },
    select: { id: true, name: true, photoUrl: true },
  });

  return NextResponse.json({ user });
}
