/**
 * Upload all 19 rooms (rentkarghar/) to R2 and seed the database.
 * Run: npx tsx prisma/seed-rooms.ts
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const BASE_DIR = path.join(process.env.HOME!, 'Downloads', 'Nivaas', 'rentkarghar');
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

async function uploadDir(folder: string, r2Prefix: string): Promise<string[]> {
  const files = fs.readdirSync(folder)
    .filter(f => /\.(jpe?g|png|webp)$/i.test(f))
    .sort();
  const urls: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const filePath = path.join(folder, files[i]);
    const ext = path.extname(files[i]).slice(1).toLowerCase();
    const key = `${r2Prefix}/${i + 1}.${ext}`;
    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: fs.readFileSync(filePath),
      ContentType: 'image/jpeg',
      CacheControl: 'public, max-age=31536000',
    }));
    urls.push(`${R2_PUBLIC_URL}/${key}`);
    process.stdout.write(`    ✓ ${files[i]}\n`);
  }
  return urls;
}

const LANDLORDS = [
  { phone: '+923451234567', name: 'Khalid Mehmood',  verificationTier: 'VERIFIED' as const },
  { phone: '+923011234568', name: 'Nasir Hussain',   verificationTier: 'VERIFIED' as const },
];

const ROOMS: {
  folder: string;
  landlordIdx: number;
  title: string;
  description: string;
  city: string;
  locality: string;
  address: string;
  propertyType: string;
  rentAmount: number;
  rooms: number;
  bathrooms: number;
  areaSqft?: number;
  areaMarla?: number;
  furnishing: string;
  utilities: string[];
  ownerVerified: boolean;
  isBoosted: boolean;
  latitude: number;
  longitude: number;
}[] = [
  {
    folder: 'Room no1',
    landlordIdx: 0,
    title: 'Furnished Single Room — Gulshan Colony, Sialkot',
    description:
      'Clean and comfortable furnished single room on the ground floor of a well-maintained residential building. ' +
      'Includes a single bed, study table, ceiling fan, and a built-in wall cabinet. ' +
      'Shared bathroom on the same floor. Kitchen access shared with two other rooms. ' +
      'Electricity and gas charges split equally. Ideal for a working professional or student. ' +
      'One month advance required. No couples. Males only.',
    city: 'Sialkot', locality: 'Gulshan Colony',
    address: 'Building no 4, Street 2, Gulshan Colony, Sialkot',
    propertyType: 'Room', rentAmount: 8500, rooms: 1, bathrooms: 1, areaSqft: 140,
    furnishing: 'Furnished', utilities: ['Electricity', 'Water'],
    ownerVerified: true, isBoosted: false, latitude: 32.5021, longitude: 74.5399,
  },
  {
    folder: 'Room no2',
    landlordIdx: 0,
    title: 'Furnished Room with Attached Bath — Gulshan Colony, Sialkot',
    description:
      'Spacious furnished room with private attached bathroom — a rare find at this price. ' +
      'Room includes a double bed, wooden wardrobe, ceiling fan, and a study corner. ' +
      'Shared kitchen access on the same floor. Tiled floors. ' +
      'First floor with good natural light. ' +
      'Electricity metre is shared — cost divided equally among residents. ' +
      'Peaceful building, no loud music policy. Males only.',
    city: 'Sialkot', locality: 'Gulshan Colony',
    address: 'Building no 4, Street 2, Gulshan Colony, Sialkot',
    propertyType: 'Room', rentAmount: 11000, rooms: 1, bathrooms: 1, areaSqft: 180,
    furnishing: 'Furnished', utilities: ['Electricity', 'Water'],
    ownerVerified: true, isBoosted: false, latitude: 32.5021, longitude: 74.5399,
  },
  {
    folder: 'Room no3',
    landlordIdx: 0,
    title: 'AC Room for Rent — Gulshan Colony, Sialkot',
    description:
      'Well-maintained air-conditioned room on the first floor. ' +
      'Includes a single bed, wardrobe, and a wall-mounted 1-ton AC. ' +
      'Attached bathroom with modern fittings. ' +
      'Shared kitchen and dining area with one other room. ' +
      'Electricity bills calculated separately for AC usage on a sub-metre. ' +
      'Quiet environment — suitable for office-going individuals. Males only.',
    city: 'Sialkot', locality: 'Gulshan Colony',
    address: 'Building no 4, Street 2, Gulshan Colony, Sialkot',
    propertyType: 'Room', rentAmount: 14000, rooms: 1, bathrooms: 1, areaSqft: 160,
    furnishing: 'Furnished', utilities: ['Electricity', 'Water'],
    ownerVerified: true, isBoosted: true, latitude: 32.5022, longitude: 74.5400,
  },
  {
    folder: 'Room no4',
    landlordIdx: 0,
    title: 'Double Room — Ground Floor — Gulshan Colony, Sialkot',
    description:
      'Large double room on the ground floor, suitable for two people sharing. ' +
      'Furnished with two single beds, a ceiling fan, wooden shelves, and window curtains. ' +
      'Shared bathroom with one other room. Separate shoe rack and storage cabinet outside. ' +
      'Kitchen shared with three other residents. ' +
      'Good ventilation with a large window opening to the building courtyard. ' +
      'Gas is included. Electricity split equally.',
    city: 'Sialkot', locality: 'Gulshan Colony',
    address: 'Building no 4, Street 2, Gulshan Colony, Sialkot',
    propertyType: 'Room', rentAmount: 17000, rooms: 1, bathrooms: 1, areaSqft: 220,
    furnishing: 'Furnished', utilities: ['Gas', 'Electricity', 'Water'],
    ownerVerified: true, isBoosted: false, latitude: 32.5020, longitude: 74.5398,
  },
  {
    folder: 'Room no5',
    landlordIdx: 0,
    title: 'Semi-Furnished Room — Near Sialkot Bazar',
    description:
      'Budget-friendly semi-furnished room in a central location — walking distance to main bazar. ' +
      'Includes a ceiling fan and a wall-mounted mirror. Bring your own bed/furniture or negotiate. ' +
      'Attached bathroom with basic fittings. ' +
      'Small balcony opens out to the street — good airflow. ' +
      'Separate electricity metre. Gas available in shared kitchen. ' +
      'No pets. One month advance. Families and singles welcome.',
    city: 'Sialkot', locality: 'Gulshan Colony',
    address: 'Building no 4, Street 2, Gulshan Colony, Sialkot',
    propertyType: 'Room', rentAmount: 9000, rooms: 1, bathrooms: 1, areaSqft: 150,
    furnishing: 'Semi-furnished', utilities: ['Gas', 'Electricity', 'Water'],
    ownerVerified: true, isBoosted: false, latitude: 32.5019, longitude: 74.5401,
  },
  {
    folder: 'Room no6',
    landlordIdx: 0,
    title: 'Furnished Corner Room — Top Floor — Gulshan Colony, Sialkot',
    description:
      'Bright corner room on the top floor — best natural light in the building. ' +
      'Two windows, tiled floor, false ceiling with an elegant ceiling fan. ' +
      'Furnished with a double bed, wardrobe, and dressing table. ' +
      'Attached clean bathroom. Rooftop access included. ' +
      'Shared kitchen is fully equipped with a 2-burner gas stove, exhaust fan, and overhead cabinets. ' +
      'Excellent cross-ventilation. Perfect for someone who wants their own space.',
    city: 'Sialkot', locality: 'Gulshan Colony',
    address: 'Building no 4, Street 2, Gulshan Colony, Sialkot',
    propertyType: 'Room', rentAmount: 13500, rooms: 1, bathrooms: 1, areaSqft: 200,
    furnishing: 'Furnished', utilities: ['Gas', 'Electricity', 'Water'],
    ownerVerified: true, isBoosted: false, latitude: 32.5023, longitude: 74.5402,
  },
  {
    folder: 'Room no7',
    landlordIdx: 0,
    title: 'Large Furnished Room with Sitting Area — Gulshan Colony, Sialkot',
    description:
      'Generously sized furnished room with a separate sitting nook — ideal for a couple or two friends. ' +
      'Features a sofa, centre table, double bed, wardrobe, and ceiling fan. ' +
      'Attached bathroom — newly tiled with a geyser fitted. ' +
      'Private balcony for this room. Shared kitchen on the same floor. ' +
      'Building has 24-hour water supply via roof-top tank. ' +
      'CCTV in common areas. No noise after 10 PM. Two months advance.',
    city: 'Sialkot', locality: 'Gulshan Colony',
    address: 'Building no 4, Street 2, Gulshan Colony, Sialkot',
    propertyType: 'Room', rentAmount: 18000, rooms: 1, bathrooms: 1, areaSqft: 260,
    furnishing: 'Furnished', utilities: ['Gas', 'Electricity', 'Water'],
    ownerVerified: true, isBoosted: true, latitude: 32.5021, longitude: 74.5397,
  },
  {
    folder: 'Room no8',
    landlordIdx: 0,
    title: 'Affordable Unfurnished Room — Gulshan Colony, Sialkot',
    description:
      'Simple unfurnished room at one of the best prices in the area. ' +
      'Tiled floor, ceiling fan point, and one window. ' +
      'Shared bathroom on the same floor — maintained daily. ' +
      'Shared kitchen with gas stove and basic utensils. ' +
      'Water supply is continuous — overhead tank. ' +
      'Ideal for someone who already has their own furniture. ' +
      'Month-to-month tenancy available. No advance required.',
    city: 'Sialkot', locality: 'Gulshan Colony',
    address: 'Building no 4, Street 2, Gulshan Colony, Sialkot',
    propertyType: 'Room', rentAmount: 7500, rooms: 1, bathrooms: 1, areaSqft: 130,
    furnishing: 'Unfurnished', utilities: ['Electricity', 'Water'],
    ownerVerified: true, isBoosted: false, latitude: 32.5020, longitude: 74.5396,
  },
  {
    folder: 'Room no9',
    landlordIdx: 1,
    title: 'Furnished Room with TV Lounge Access — Gulshan Colony, Sialkot',
    description:
      'Well-furnished room in the second wing of the building. ' +
      'Includes a single bed, wardrobe, study table, and ceiling fan. ' +
      'Attached bathroom with a new geyser. ' +
      'Access to a shared TV lounge on the same floor — sofa, LED TV, and AC. ' +
      'Shared kitchen with full gas setup. WIFI available (shared cost). ' +
      'Clean, professional environment — most residents are IT/factory workers. Males only.',
    city: 'Sialkot', locality: 'Gulshan Colony',
    address: 'Building no 4, Wing B, Gulshan Colony, Sialkot',
    propertyType: 'Room', rentAmount: 12000, rooms: 1, bathrooms: 1, areaSqft: 165,
    furnishing: 'Furnished', utilities: ['Gas', 'Electricity', 'Water', 'Internet'],
    ownerVerified: true, isBoosted: false, latitude: 32.5024, longitude: 74.5404,
  },
  {
    folder: 'Room no10',
    landlordIdx: 1,
    title: 'Room for Rent — Near Paris Road, Sialkot',
    description:
      'Clean furnished room near the Paris Road junction — excellent transport links. ' +
      'Room includes a wooden double bed, two pillows, side table, and a ceiling fan. ' +
      'Separate attached bathroom with basic fittings. ' +
      'Shared kitchen with gas and basic cookware. ' +
      'Water supply from rooftop tank — no shortages. ' +
      'The building has a watchman on duty at night. Suitable for working males.',
    city: 'Sialkot', locality: 'Paris Road',
    address: 'Near Paris Road Chowk, Sialkot',
    propertyType: 'Room', rentAmount: 10500, rooms: 1, bathrooms: 1, areaSqft: 155,
    furnishing: 'Furnished', utilities: ['Gas', 'Electricity', 'Water'],
    ownerVerified: true, isBoosted: false, latitude: 32.5009, longitude: 74.5388,
  },
  {
    folder: 'Room no11',
    landlordIdx: 1,
    title: 'Spacious AC Room — Paris Road Area, Sialkot',
    description:
      'Large air-conditioned room in a prime residential block close to Paris Road. ' +
      'Furnished with a king-size bed, wardrobe, study desk, and a 1.5-ton inverter AC. ' +
      'Attached bathroom — freshly tiled with imported fittings. ' +
      'Separate geyser in bathroom. Room has two windows for cross-ventilation. ' +
      'Shared kitchen — fully equipped. WiFi (Stormfiber) available in the building. ' +
      'Electricity calculated on individual sub-metre. Available immediately.',
    city: 'Sialkot', locality: 'Paris Road',
    address: 'Near Paris Road Chowk, Sialkot',
    propertyType: 'Room', rentAmount: 19000, rooms: 1, bathrooms: 1, areaSqft: 240,
    furnishing: 'Furnished', utilities: ['Gas', 'Electricity', 'Water', 'Internet'],
    ownerVerified: true, isBoosted: true, latitude: 32.5010, longitude: 74.5390,
  },
  {
    folder: 'Room no12',
    landlordIdx: 1,
    title: 'Two-Room Suite — Paris Road, Sialkot',
    description:
      'Rare two-room suite on the first floor — bedroom plus a separate sitting room. ' +
      'Bedroom furnished with double bed, wardrobe, and dressing table. ' +
      'Sitting room has a sofa set, centre table, and a wall-mounted TV bracket. ' +
      'One attached bathroom — clean and tiled. ' +
      'Semi-private kitchen (shared with one other suite only). ' +
      'Best value for a couple or person needing extra working space. ' +
      'One month security deposit. Available from 1st of next month.',
    city: 'Sialkot', locality: 'Paris Road',
    address: 'Near Paris Road Chowk, Sialkot',
    propertyType: 'Room', rentAmount: 22000, rooms: 2, bathrooms: 1, areaSqft: 320,
    furnishing: 'Semi-furnished', utilities: ['Gas', 'Electricity', 'Water'],
    ownerVerified: true, isBoosted: false, latitude: 32.5008, longitude: 74.5386,
  },
  {
    folder: 'Room no 13',
    landlordIdx: 1,
    title: 'Single Room — Ground Floor — Iqbal Town, Sialkot',
    description:
      'Neat single room in a well-kept building in Iqbal Town. ' +
      'Ground floor — easy access, no stairs. ' +
      'Furnished with a single bed, study table, wall shelf, and ceiling fan. ' +
      'Shared bathroom — maintained by building staff. Shared kitchen access. ' +
      'Mosque within 2 minutes walking distance. Local market 5 minutes away. ' +
      'Safe neighbourhood with street lights. Suited for students and office workers.',
    city: 'Sialkot', locality: 'Iqbal Town',
    address: 'Block A, Iqbal Town, Sialkot',
    propertyType: 'Room', rentAmount: 8000, rooms: 1, bathrooms: 1, areaSqft: 135,
    furnishing: 'Furnished', utilities: ['Electricity', 'Water'],
    ownerVerified: true, isBoosted: false, latitude: 32.4965, longitude: 74.5291,
  },
  {
    folder: 'Room no 14',
    landlordIdx: 1,
    title: 'Furnished Room with Balcony — Iqbal Town, Sialkot',
    description:
      'Bright furnished room with a private balcony overlooking a tree-lined street. ' +
      'Includes a double bed, wardrobe, ceiling fan, and curtain rods with curtains. ' +
      'Attached modern bathroom with a geyser. ' +
      'Large balcony — perfect for morning tea. ' +
      'Shared kitchen with two other rooms — gas, overhead cabinets, utensils provided. ' +
      'Building has 24-hour security and a rooftop drying area. Families and singles welcome.',
    city: 'Sialkot', locality: 'Iqbal Town',
    address: 'Block A, Iqbal Town, Sialkot',
    propertyType: 'Room', rentAmount: 15000, rooms: 1, bathrooms: 1, areaSqft: 190,
    furnishing: 'Furnished', utilities: ['Gas', 'Electricity', 'Water'],
    ownerVerified: true, isBoosted: false, latitude: 32.4967, longitude: 74.5293,
  },
  {
    folder: 'Room no15',
    landlordIdx: 0,
    title: 'Budget Room — Near Sialkot General Hospital',
    description:
      'Affordable furnished room just 7 minutes walk from Sialkot General Hospital — ideal for medical staff or patients\' attendants. ' +
      'Single bed, ceiling fan, and a wall-mounted coat rack. ' +
      'Shared bathroom on the same floor — cleaned daily. ' +
      'Shared kitchen with basic setup. Water is 24 hours. ' +
      'Month-to-month rent available. Very close to main road for easy commute.',
    city: 'Sialkot', locality: 'Cantt',
    address: 'Near Sialkot General Hospital, Cantt, Sialkot',
    propertyType: 'Room', rentAmount: 7000, rooms: 1, bathrooms: 1, areaSqft: 120,
    furnishing: 'Furnished', utilities: ['Electricity', 'Water'],
    ownerVerified: false, isBoosted: false, latitude: 32.5036, longitude: 74.5445,
  },
  {
    folder: 'Room no16',
    landlordIdx: 0,
    title: 'AC Furnished Room — Cantt Area, Sialkot',
    description:
      'Modern AC-equipped furnished room in the Cantt area of Sialkot. ' +
      'Room features a double bed, wardrobe, 1-ton AC, and a study table with chair. ' +
      'Attached clean bathroom with an electric geyser. ' +
      'Shared modular kitchen with 4-burner gas hob, fridge, and microwave. ' +
      'Electricity billed via individual sub-metre — pay only what you use. ' +
      'Building is CCTV-monitored and has a main gate with a chowkidar.',
    city: 'Sialkot', locality: 'Cantt',
    address: 'Near Sialkot General Hospital, Cantt, Sialkot',
    propertyType: 'Room', rentAmount: 16500, rooms: 1, bathrooms: 1, areaSqft: 185,
    furnishing: 'Furnished', utilities: ['Gas', 'Electricity', 'Water'],
    ownerVerified: true, isBoosted: false, latitude: 32.5038, longitude: 74.5447,
  },
  {
    folder: 'Room no17',
    landlordIdx: 1,
    title: 'Premium Furnished Room with AC — Defence Road, Sialkot',
    description:
      'Top-floor premium room with the best view in the building — Defence Road, Sialkot. ' +
      'Tastefully furnished with a king-size bed, European-style wardrobe, dressing mirror, ' +
      'inverter AC (1.5 ton), and imported curtains. ' +
      'Attached bathroom with a rain-head shower and an imported geyser. ' +
      'Shared chef\'s kitchen on the same floor. High-speed WiFi (100 Mbps). ' +
      'Rooftop terrace access. Ideal for a professional or expat. Two months advance.',
    city: 'Sialkot', locality: 'Defence Road',
    address: 'Near UET Campus, Defence Road, Sialkot',
    propertyType: 'Room', rentAmount: 24000, rooms: 1, bathrooms: 1, areaSqft: 250,
    furnishing: 'Furnished', utilities: ['Gas', 'Electricity', 'Water', 'Internet'],
    ownerVerified: true, isBoosted: true, latitude: 32.5075, longitude: 74.5420,
  },
  {
    folder: 'Room no18',
    landlordIdx: 1,
    title: 'Furnished Room — Quiet Street — Rang Pura, Sialkot',
    description:
      'Comfortable furnished room in a quiet residential lane in Rang Pura. ' +
      'Room furnished with a single bed, wardrobe, ceiling fan, and study table. ' +
      'Attached bathroom — clean and well-maintained. ' +
      'Shared kitchen with two other rooms — gas and basic utensils available. ' +
      'Very quiet block — no commercial activity. ' +
      'Close to Rang Pura market, pharmacy, and a primary school. ' +
      'One month security deposit. Suitable for families or working individuals.',
    city: 'Sialkot', locality: 'Rang Pura',
    address: 'Street 5, Rang Pura, Sialkot',
    propertyType: 'Room', rentAmount: 9500, rooms: 1, bathrooms: 1, areaSqft: 155,
    furnishing: 'Furnished', utilities: ['Gas', 'Electricity', 'Water'],
    ownerVerified: false, isBoosted: false, latitude: 32.4869, longitude: 74.5215,
  },
  {
    folder: 'Room no19',
    landlordIdx: 1,
    title: 'Large Room Suite with Drawing Room — Rang Pura, Sialkot',
    description:
      'The most spacious option in this building — a bedroom plus a small attached drawing room. ' +
      'Bedroom has a double bed, wardrobe, dressing table, and a ceiling fan. ' +
      'Drawing room furnished with a 3-seater sofa and a tea table — perfect for guests or working from home. ' +
      'Private attached bathroom with geyser. ' +
      'Access to shared fully equipped kitchen. Building has a rooftop. ' +
      'Ideal for a couple or a professional needing extra space. Two months advance.',
    city: 'Sialkot', locality: 'Rang Pura',
    address: 'Street 5, Rang Pura, Sialkot',
    propertyType: 'Room', rentAmount: 20000, rooms: 2, bathrooms: 1, areaSqft: 300,
    furnishing: 'Furnished', utilities: ['Gas', 'Electricity', 'Water'],
    ownerVerified: false, isBoosted: false, latitude: 32.4871, longitude: 74.5217,
  },
];

async function main() {
  console.log('═══ Rooms Upload + Seed ═══\n');

  console.log('Creating landlord accounts…');
  const landlordUsers = await Promise.all(
    LANDLORDS.map(l =>
      prisma.user.upsert({
        where: { phone: l.phone },
        create: {
          phone: l.phone,
          name: l.name,
          role: 'LANDLORD',
          verificationTier: l.verificationTier,
          isActive: true,
          acceptedTerms: true,
        },
        update: { name: l.name },
        select: { id: true, name: true },
      })
    )
  );
  landlordUsers.forEach(u => console.log(`  ✓ ${u.name}`));

  await prisma.listing.deleteMany({ where: { landlordId: { in: landlordUsers.map(u => u.id) } } });
  console.log('\nCleared existing listings for these landlords.\n');

  let created = 0;
  for (const data of ROOMS) {
    const folderPath = path.join(BASE_DIR, data.folder);
    if (!fs.existsSync(folderPath)) {
      console.log(`⚠ Skipping "${data.folder}" — folder not found at ${folderPath}`);
      continue;
    }

    console.log(`\n📁 ${data.folder} — uploading photos…`);
    const r2Key = `listings/rooms/${data.folder.replace(/\s+/g, '-').toLowerCase()}`;
    const photoUrls = await uploadDir(folderPath, r2Key);

    const { folder, landlordIdx, ...fields } = data;
    const landlord = landlordUsers[landlordIdx];

    await prisma.listing.create({
      data: {
        ...fields,
        landlordId: landlord.id,
        status: 'ACTIVE',
        photos: {
          create: photoUrls.map((url, i) => ({ url, isCover: i === 0, order: i })),
        },
      },
    });
    console.log(`  ✓ Listed: ${data.title}`);
    created++;
  }

  console.log(`\n\n✅ Done — ${created} room listings created.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
