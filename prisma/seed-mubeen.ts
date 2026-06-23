/**
 * Upload all Mubeen Houses photos to R2 and seed the database.
 * Run: npx tsx prisma/seed-mubeen.ts
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

const BASE_DIR = path.join(process.env.HOME!, 'Downloads', 'Mubeen Houses');
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

async function uploadDir(folder: string, key: string): Promise<string[]> {
  const files = fs.readdirSync(folder)
    .filter(f => /\.(jpe?g|png|webp)$/i.test(f))
    .sort();
  const urls: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const filePath = path.join(folder, files[i]);
    const ext = path.extname(files[i]).slice(1).toLowerCase();
    const r2Key = `${key}/${i + 1}.${ext}`;
    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: r2Key,
      Body: fs.readFileSync(filePath),
      ContentType: 'image/jpeg',
      CacheControl: 'public, max-age=31536000',
    }));
    urls.push(`${R2_PUBLIC_URL}/${r2Key}`);
    process.stdout.write(`  ✓ ${files[i]}\n`);
  }
  return urls;
}

// ── Landlord accounts (varied for realism) ───────────────────────────────────
const LANDLORDS = [
  { phone: '+923009001122', name: 'Muhammad Mubeen',  verificationTier: 'VERIFIED'  as const },
  { phone: '+923019001133', name: 'Arshad Mehmood',   verificationTier: 'VERIFIED'  as const },
  { phone: '+923029001144', name: 'Kashif Iqbal',     verificationTier: 'STANDARD'  as const },
  { phone: '+923039001155', name: 'Saira Batool',     verificationTier: 'VERIFIED'  as const },
];

// ── Listing metadata (derived from visual inspection of photos) ───────────────
const LISTINGS: {
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
  areaMarla?: number;
  areaSqft?: number;
  furnishing: string;
  utilities: string[];
  ownerVerified: boolean;
  isBoosted: boolean;
  latitude: number;
  longitude: number;
}[] = [
  {
    folder: 'House 2',
    landlordIdx: 0,
    title: 'Brand-New 3-Bed House — Gulshan Colony, Sialkot',
    description:
      'Newly constructed 5-marla house with premium finishes throughout. ' +
      'Features black marble staircase with gold-tone steel railing, POP false ceiling with LED coves, ' +
      'and a modular kitchen with built-in overhead cabinets. ' +
      'White Italian marble flooring on ground floor. Large windows for natural light. ' +
      'Car porch, separate servants quarters, and a rooftop terrace. ' +
      'Available unfurnished — bring your own furniture and move right in.',
    city: 'Sialkot', locality: 'Gulshan Colony', address: 'Street 7, Gulshan Colony, Sialkot',
    propertyType: 'House', rentAmount: 90000, rooms: 3, bathrooms: 2, areaMarla: 5,
    furnishing: 'Unfurnished', utilities: ['Gas', 'Electricity', 'Water'],
    ownerVerified: true, isBoosted: true, latitude: 32.5019, longitude: 74.5401,
  },
  {
    folder: 'House 3',
    landlordIdx: 1,
    title: 'Furnished 3-Bed House with Drawing Room — Iqbal Town, Sialkot',
    description:
      'Fully furnished house in a prime residential street. ' +
      'Drawing room features a crystal chandelier, designer POP ceiling, and a navy velvet 7-seater sofa set. ' +
      'Open-plan layout connects drawing room to a fitted kitchen. ' +
      'Three bedrooms each with wardrobes and dressing tables. ' +
      'Ceiling fans and inverter ACs in all rooms. Separate laundry area. ' +
      'Ideal for a family relocating to Sialkot.',
    city: 'Sialkot', locality: 'Iqbal Town', address: 'Block C, Iqbal Town, Sialkot',
    propertyType: 'House', rentAmount: 82000, rooms: 3, bathrooms: 2, areaMarla: 5,
    furnishing: 'Furnished', utilities: ['Gas', 'Electricity', 'Water'],
    ownerVerified: true, isBoosted: false, latitude: 32.4963, longitude: 74.5289,
  },
  {
    folder: 'House 4',
    landlordIdx: 2,
    title: '2-Bed Lower Portion — Kot Lakhpat, Sialkot',
    description:
      'Affordable lower portion with tiled entrance corridor and a basic kitchen. ' +
      'Two bedrooms, one bathroom, and a small courtyard. ' +
      'Gas connection available. Electricity metre is separate. ' +
      'Ideal for a small family or couple on a budget. ' +
      'Quiet residential gali, walking distance to local market and mosque.',
    city: 'Sialkot', locality: 'Kot Lakhpat', address: 'Gali No 3, Kot Lakhpat, Sialkot',
    propertyType: 'Portion', rentAmount: 19000, rooms: 2, bathrooms: 1, areaMarla: 3,
    furnishing: 'Unfurnished', utilities: ['Gas', 'Electricity', 'Water'],
    ownerVerified: false, isBoosted: false, latitude: 32.4901, longitude: 74.5198,
  },
  {
    folder: 'House 5',
    landlordIdx: 3,
    title: 'Designer Furnished House — Satellite Town, Gujranwala',
    description:
      'Stunning furnished house with a showroom-quality master bedroom. ' +
      'Features rust-and-cream POP false ceiling with geometric cutouts, pendant Edison lights, ' +
      'and a luxury fabric upholstered headboard with gold chrome inlays. ' +
      'All bedrooms air-conditioned with inverter units. ' +
      'Fitted kitchen with granite countertop. Gated street with CCTV. ' +
      'Two months security deposit required.',
    city: 'Gujranwala', locality: 'Satellite Town', address: 'Phase 2, Satellite Town, Gujranwala',
    propertyType: 'House', rentAmount: 65000, rooms: 3, bathrooms: 2, areaMarla: 5,
    furnishing: 'Furnished', utilities: ['Gas', 'Electricity', 'Water'],
    ownerVerified: true, isBoosted: true, latitude: 32.1781, longitude: 74.2042,
  },
  {
    folder: 'House 6',
    landlordIdx: 0,
    title: 'Traditional Furnished 4-Bed House — Kashmir Road, Sialkot',
    description:
      'Elegant traditionally styled furnished house on Kashmir Road. ' +
      'Grand entrance with a hand-carved solid wood staircase and decorative lattice partition. ' +
      'Drawing room with a crystal chandelier, ornate carved wooden sofa set with glass-top centre table. ' +
      'Designer POP ceilings with layered cornice moulding. ' +
      'Four bedrooms on upper floor, each with attached bath. ' +
      'Small courtyard garden at rear. Available immediately.',
    city: 'Sialkot', locality: 'Kashmir Road', address: 'Near Passport Office, Kashmir Road, Sialkot',
    propertyType: 'House', rentAmount: 76000, rooms: 4, bathrooms: 3, areaMarla: 7,
    furnishing: 'Furnished', utilities: ['Gas', 'Electricity', 'Water'],
    ownerVerified: true, isBoosted: false, latitude: 32.4978, longitude: 74.5332,
  },
  {
    folder: 'House 7',
    landlordIdx: 2,
    title: 'Semi-Furnished Upper Portion — Hajipura Road, Sialkot',
    description:
      'Clean and well-maintained upper portion with a simple POP false ceiling and inverter AC in the main room. ' +
      'Two bedrooms with wood-panel feature walls and built-in wardrobes. ' +
      'Bathroom newly tiled. Common kitchen with gas range. ' +
      'Rooftop access included. Separate electricity metre. ' +
      'Suitable for a working professional or small family.',
    city: 'Sialkot', locality: 'Hajipura Road', address: 'Street 12, Hajipura Road, Sialkot',
    propertyType: 'Portion', rentAmount: 35000, rooms: 2, bathrooms: 1, areaMarla: 3,
    furnishing: 'Semi-furnished', utilities: ['Gas', 'Electricity', 'Water'],
    ownerVerified: false, isBoosted: false, latitude: 32.5057, longitude: 74.5247,
  },
  {
    folder: 'House 8',
    landlordIdx: 1,
    title: 'Affordable Semi-Furnished Portion — Circular Road, Sialkot',
    description:
      'Budget-friendly semi-furnished portion with basic bedroom furniture included. ' +
      'Main bedroom has a wooden wardrobe, dressing table with mirror, and a double bed. ' +
      'Tiled floors, ceiling fans in all rooms. Small separate kitchen. ' +
      'One attached bathroom. Easy access to Circular Road main bus stops. ' +
      'One month advance required. Ideal for working individuals.',
    city: 'Sialkot', locality: 'Circular Road', address: 'Near Allied Hospital, Circular Road, Sialkot',
    propertyType: 'Portion', rentAmount: 22000, rooms: 2, bathrooms: 1, areaMarla: 3,
    furnishing: 'Semi-furnished', utilities: ['Electricity', 'Water'],
    ownerVerified: false, isBoosted: false, latitude: 32.4932, longitude: 74.5264,
  },
  {
    folder: 'House 9',
    landlordIdx: 3,
    title: 'Furnished 3-Bed House — Model Town, Gujranwala',
    description:
      'Well-furnished family house in the heart of Model Town. ' +
      'Master bedroom features a carved wooden bed with purple velvet headboard and gold inlay, ' +
      'plus full-length curtains. Marble flooring throughout. ' +
      'Drawing room with sofa set and coffee table. ' +
      'Three bedrooms, two baths. Fitted kitchen with overhead cabinets. ' +
      'Separate servants bath. Available from 1st June. No Eid advance.',
    city: 'Gujranwala', locality: 'Model Town', address: 'Block B, Model Town, Gujranwala',
    propertyType: 'House', rentAmount: 42000, rooms: 3, bathrooms: 2, areaMarla: 4,
    furnishing: 'Furnished', utilities: ['Gas', 'Electricity', 'Water'],
    ownerVerified: true, isBoosted: false, latitude: 32.1621, longitude: 74.1905,
  },
  {
    folder: 'House 10',
    landlordIdx: 0,
    title: 'Modern 3-Bed House — Defence Road, Sialkot',
    description:
      'Contemporary semi-furnished house with a striking entrance. ' +
      'Large glass-panel wooden main door, black granite staircase with stainless steel railing, ' +
      'and white ceramic tile flooring. ' +
      'Fridge and washing machine included. ' +
      'Three spacious bedrooms with built-in wardrobes. Kitchen has overhead storage. ' +
      'CCTV-covered exterior, covered car porch, and a small front garden.',
    city: 'Sialkot', locality: 'Defence Road', address: 'Near UET Campus, Defence Road, Sialkot',
    propertyType: 'House', rentAmount: 58000, rooms: 3, bathrooms: 2, areaMarla: 5,
    furnishing: 'Semi-furnished', utilities: ['Gas', 'Electricity', 'Water'],
    ownerVerified: true, isBoosted: false, latitude: 32.5074, longitude: 74.5419,
  },
  {
    folder: 'House 11',
    landlordIdx: 1,
    title: 'Traditional 4-Bed House — Paris Road, Sialkot',
    description:
      'Stately traditional house with an ornate carved hardwood double-door entrance topped with ' +
      'hand-crafted Islamic calligraphy panels — a true piece of craftsmanship. ' +
      'Spacious drawing room, a large family lounge, and four generous bedrooms. ' +
      'Marble-tiled entrance lobby and corridors. Large rear courtyard. ' +
      'Unfurnished and ready for your furniture. ' +
      'Quiet street with no through traffic. Available immediately.',
    city: 'Sialkot', locality: 'Paris Road', address: 'Street 3, Paris Road, Sialkot',
    propertyType: 'House', rentAmount: 52000, rooms: 4, bathrooms: 2, areaMarla: 7,
    furnishing: 'Unfurnished', utilities: ['Gas', 'Electricity', 'Water'],
    ownerVerified: true, isBoosted: false, latitude: 32.5011, longitude: 74.5375,
  },
  {
    folder: 'House12',
    landlordIdx: 2,
    title: 'Budget 2-Bed Portion — Rang Pura, Sialkot',
    description:
      'Basic lower portion in an established residential area. ' +
      'Kitchen fitted with upper and lower MDF cabinets and a 2-burner gas stove. ' +
      'Two bedrooms, one bathroom. Tiled floors. ' +
      'Close to schools, shops, and a neighbourhood mosque. ' +
      'Ideal for a budget-conscious family or working couple.',
    city: 'Sialkot', locality: 'Rang Pura', address: 'Main Bazar Road, Rang Pura, Sialkot',
    propertyType: 'Portion', rentAmount: 17000, rooms: 2, bathrooms: 1, areaMarla: 3,
    furnishing: 'Unfurnished', utilities: ['Gas', 'Electricity', 'Water'],
    ownerVerified: false, isBoosted: false, latitude: 32.4867, longitude: 74.5211,
  },
  {
    folder: 'House 13',
    landlordIdx: 3,
    title: 'Furnished House with Large Lounge — Cantt, Gujranwala',
    description:
      'Spacious furnished house with a grand double-height drawing room. ' +
      'Features decorative tiled columns, layered circular POP ceiling, ' +
      'and a complete 7-seater carved wooden sofa set with glass-top table. ' +
      'Large diamond-pattern marble tile flooring. ' +
      'Three bedrooms, two bathrooms, a fitted kitchen, and a rooftop. ' +
      'CCTV and intercom installed. Near Cantt main gate.',
    city: 'Gujranwala', locality: 'Cantt', address: 'Officers Colony, Cantt, Gujranwala',
    propertyType: 'House', rentAmount: 44000, rooms: 3, bathrooms: 2, areaMarla: 5,
    furnishing: 'Furnished', utilities: ['Gas', 'Electricity', 'Water'],
    ownerVerified: true, isBoosted: false, latitude: 32.1714, longitude: 74.1978,
  },
  {
    folder: 'House 14',
    landlordIdx: 0,
    title: 'Luxury Designer House — DHA Phase 6, Lahore',
    description:
      'Ultra-luxury furnished house for discerning tenants. ' +
      'The master suite features dramatic black 3D geometric wall panels, white Carrara marble floors, ' +
      'a bespoke platform bed with integrated LED lighting, and a walk-in dressing area. ' +
      'All three bedrooms have inverter ACs, premium drapes, and attached bathrooms. ' +
      'Chef\'s kitchen with imported appliances. ' +
      'Smart home lighting controls. Two months security deposit. Serious inquiries only.',
    city: 'Lahore', locality: 'DHA Phase 6', address: 'Block M, DHA Phase 6, Lahore',
    propertyType: 'House', rentAmount: 95000, rooms: 3, bathrooms: 3, areaMarla: 5,
    furnishing: 'Furnished', utilities: ['Gas', 'Electricity', 'Water', 'Internet'],
    ownerVerified: true, isBoosted: true, latitude: 31.4372, longitude: 74.2401,
  },
  {
    folder: 'House 15',
    landlordIdx: 1,
    title: 'Furnished 2-Bed House — Cantt, Sialkot',
    description:
      'Modern furnished house ideal for professionals or a small family. ' +
      'Main lounge features a sleek black fabric sofa, wall-mounted Samsung TV, ' +
      'inverter AC, and a striking black mosaic accent wall with LED strip lighting. ' +
      'Two bedrooms with beds and wardrobes. Separate modern bathroom. ' +
      'Small but functional kitchen. Covered parking for one car.',
    city: 'Sialkot', locality: 'Cantt', address: 'Near Sialkot Cantt Railway Station',
    propertyType: 'House', rentAmount: 48000, rooms: 2, bathrooms: 2, areaMarla: 4,
    furnishing: 'Furnished', utilities: ['Gas', 'Electricity', 'Water', 'Internet'],
    ownerVerified: true, isBoosted: false, latitude: 32.5034, longitude: 74.5442,
  },
  {
    folder: 'House 16',
    landlordIdx: 2,
    title: 'Semi-Furnished House with Modern Kitchen — Peoples Colony, Gujranwala',
    description:
      'Well-maintained semi-furnished house with a recently renovated modular kitchen. ' +
      'Kitchen features white lacquered cabinets, granite countertop, hood extractor fan, and a fridge. ' +
      'Grey porcelain tile flooring. ' +
      'Three bedrooms, two bathrooms — master bedroom has an attached bath. ' +
      'Open lounge area. Rooftop available. Generator connection point wired. ' +
      'Peaceful family neighbourhood near a park.',
    city: 'Gujranwala', locality: 'Peoples Colony', address: 'Block 5, Peoples Colony, Gujranwala',
    propertyType: 'House', rentAmount: 62000, rooms: 3, bathrooms: 2, areaMarla: 5,
    furnishing: 'Semi-furnished', utilities: ['Gas', 'Electricity', 'Water'],
    ownerVerified: false, isBoosted: false, latitude: 32.1583, longitude: 74.1843,
  },
  {
    folder: 'House 17',
    landlordIdx: 3,
    title: 'Brand-New Luxury 4-Bed House — Valencia Housing, Sialkot',
    description:
      'Stunning newly built luxury house — never been occupied. ' +
      'Ground floor boasts Calacatta white marble flooring with black inlay, ' +
      'double-height entrance lobby, crystal chandelier, and a custom POP ceiling with gold LED coves. ' +
      'Imported flush doors. Four large bedrooms, all with attached baths and AC points. ' +
      'Ultra-modern open kitchen with an island and imported fittings. ' +
      'Dedicated servant quarters, 2-car porch, rooftop, and a small front lawn. ' +
      'Three months advance. Serious families only.',
    city: 'Sialkot', locality: 'Valencia Housing Scheme', address: 'Block A, Valencia Housing, Sialkot',
    propertyType: 'House', rentAmount: 135000, rooms: 4, bathrooms: 4, areaMarla: 10,
    furnishing: 'Unfurnished', utilities: ['Gas', 'Electricity', 'Water'],
    ownerVerified: true, isBoosted: true, latitude: 32.5099, longitude: 74.5467,
  },
  {
    folder: 'House 18',
    landlordIdx: 2,
    title: 'Single-Storey House — Shahab Pura, Sialkot',
    description:
      'Affordable single-storey house on a corner plot with a covered veranda. ' +
      'Iron gate with covered porch. Two bedrooms, one bathroom. Simple tiled floors. ' +
      'Small kitchen and a separate wash area. ' +
      'Established residential area close to Shahab Pura main bazar. ' +
      'Schools and hospitals within 1 km. Available immediately.',
    city: 'Sialkot', locality: 'Shahab Pura', address: 'Main Road, Shahab Pura, Sialkot',
    propertyType: 'House', rentAmount: 21000, rooms: 2, bathrooms: 1, areaMarla: 4,
    furnishing: 'Unfurnished', utilities: ['Gas', 'Electricity', 'Water'],
    ownerVerified: false, isBoosted: false, latitude: 32.4843, longitude: 74.5161,
  },
  {
    folder: 'House 19',
    landlordIdx: 0,
    title: 'Contemporary Villa — Bahria Town, Lahore',
    description:
      'Architecturally striking contemporary villa in the most sought-after gated community in Lahore. ' +
      'Stone-clad exterior facade with floor-to-ceiling glass panels, frameless glass balcony railings, ' +
      'and a grand double-leaf black-framed gate. ' +
      'Five bedrooms across two floors, four attached baths. ' +
      'Open-plan ground floor with imported marble. ' +
      'Home theatre room, servant quarters, 3-car porch. ' +
      'Bahria Town amenities: parks, supermarkets, hospital, mosque — all within the society.',
    city: 'Lahore', locality: 'Bahria Town', address: 'Sector C, Bahria Town, Lahore',
    propertyType: 'House', rentAmount: 145000, rooms: 5, bathrooms: 4, areaMarla: 10,
    furnishing: 'Unfurnished', utilities: ['Gas', 'Electricity', 'Water', 'Internet'],
    ownerVerified: true, isBoosted: true, latitude: 31.3693, longitude: 74.1758,
  },
  {
    folder: 'House 20',
    landlordIdx: 1,
    title: 'New Double-Storey House — Saddar Road, Sialkot',
    description:
      'Newly constructed double-storey house with a modern yellow-and-brown stone-cladded facade. ' +
      'First-floor balcony with decorative metal railing. Patterned interlocked driveway. ' +
      'Ground floor: drawing room, dining, kitchen, and one bedroom. ' +
      'Upper floor: two bedrooms (both with attached baths) and a family lounge. ' +
      'Rooftop with boundary wall. Car porch fits two vehicles. ' +
      'Unfurnished — move in with your own furniture.',
    city: 'Sialkot', locality: 'Saddar Road', address: 'Near Sialkot Gymkhana, Saddar Road, Sialkot',
    propertyType: 'House', rentAmount: 65000, rooms: 3, bathrooms: 3, areaMarla: 5,
    furnishing: 'Unfurnished', utilities: ['Gas', 'Electricity', 'Water'],
    ownerVerified: true, isBoosted: false, latitude: 32.5042, longitude: 74.5308,
  },
];

async function main() {
  console.log('═══ Mubeen Houses Upload + Seed ═══\n');

  // 1. Upsert landlords
  console.log('Creating landlord accounts…');
  const landlordUsers = await Promise.all(
    LANDLORDS.map(l =>
      prisma.user.upsert({
        where: { phone: l.phone },
        create: { phone: l.phone, name: l.name, role: 'LANDLORD', verificationTier: l.verificationTier, isActive: true, acceptedTerms: true },
        update: { name: l.name },
        select: { id: true, name: true },
      })
    )
  );
  landlordUsers.forEach(u => console.log(`  ✓ ${u.name}`));

  // 2. Clear existing listings for these landlords
  await prisma.listing.deleteMany({ where: { landlordId: { in: landlordUsers.map(u => u.id) } } });
  console.log('\nCleared existing listings for these landlords.\n');

  // 3. Upload + create each listing
  for (const data of LISTINGS) {
    const folderPath = path.join(BASE_DIR, data.folder);
    if (!fs.existsSync(folderPath)) {
      console.log(`⚠ Skipping ${data.folder} — folder not found`);
      continue;
    }

    console.log(`\n📁 ${data.folder} — uploading photos…`);
    const r2Key = `listings/${data.folder.replace(/\s+/g, '').toLowerCase()}`;
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
  }

  console.log(`\n\n✅ Done — ${LISTINGS.length} listings created across ${LANDLORDS.length} landlords.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
