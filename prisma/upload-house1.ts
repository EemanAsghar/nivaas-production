/**
 * Upload house1 photos to R2 and patch seed-listings.ts with real URLs.
 *
 * Usage:
 *   1. Save all 7 photos into a folder (default: ~/Desktop/house1)
 *   2. npx tsx prisma/upload-house1.ts
 *   3. npx tsx prisma/seed-listings.ts
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config();

const PHOTOS_DIR = path.join(process.env.HOME!, 'Downloads', 'House1');
const LISTING_KEY = 'house1';

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const MIME: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg',
  png: 'image/png', webp: 'image/webp',
};

async function upload(filePath: string, key: string): Promise<string> {
  const ext = path.extname(filePath).slice(1).toLowerCase();
  const body = fs.readFileSync(filePath);
  await client.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    Body: body,
    ContentType: MIME[ext] ?? 'image/jpeg',
    CacheControl: 'public, max-age=31536000',
  }));
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

async function main() {
  if (!fs.existsSync(PHOTOS_DIR)) {
    console.error(`Folder not found: ${PHOTOS_DIR}`);
    console.error('Save your photos there and re-run.');
    process.exit(1);
  }

  const files = fs.readdirSync(PHOTOS_DIR)
    .filter(f => /\.(jpe?g|png|webp)$/i.test(f))
    .sort();

  if (files.length === 0) {
    console.error('No image files found in', PHOTOS_DIR);
    process.exit(1);
  }

  console.log(`Uploading ${files.length} photo(s)…`);
  const urls: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const filePath = path.join(PHOTOS_DIR, files[i]);
    const ext = path.extname(files[i]).slice(1).toLowerCase();
    const key = `listings/${LISTING_KEY}/${i + 1}.${ext}`;
    const url = await upload(filePath, key);
    urls.push(url);
    console.log(`  ✓ ${files[i]} → ${url}`);
  }

  // Patch seed-listings.ts in place
  const seedPath = path.join(__dirname, 'seed-listings.ts');
  let src = fs.readFileSync(seedPath, 'utf8');
  const replacement = `const HOUSE1_PHOTOS: string[] = [\n${urls.map(u => `  '${u}',`).join('\n')}\n];`;
  src = src.replace(/const HOUSE1_PHOTOS: string\[\] = \[[\s\S]*?\];/, replacement);
  fs.writeFileSync(seedPath, src, 'utf8');

  console.log(`\nPatched seed-listings.ts with ${urls.length} real URLs.`);
  console.log('Now run: npx tsx prisma/seed-listings.ts');
}

main().catch(e => { console.error(e); process.exit(1); });
