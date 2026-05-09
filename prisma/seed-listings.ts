import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const LANDLORD_PHONE = '+923001234567';

// House 1 — real photos uploaded to R2
// Replace these URLs after running: npx tsx prisma/upload-house1.ts
const HOUSE1_PHOTOS: string[] = [
  'https://pub-da19753ecc00486c99f2b2a5f8b51f15.r2.dev/listings/house1/1.jpeg',
  'https://pub-da19753ecc00486c99f2b2a5f8b51f15.r2.dev/listings/house1/2.jpeg',
  'https://pub-da19753ecc00486c99f2b2a5f8b51f15.r2.dev/listings/house1/3.jpeg',
  'https://pub-da19753ecc00486c99f2b2a5f8b51f15.r2.dev/listings/house1/4.jpeg',
  'https://pub-da19753ecc00486c99f2b2a5f8b51f15.r2.dev/listings/house1/5.jpeg',
  'https://pub-da19753ecc00486c99f2b2a5f8b51f15.r2.dev/listings/house1/6.jpeg',
  'https://pub-da19753ecc00486c99f2b2a5f8b51f15.r2.dev/listings/house1/7.jpeg',
];

const LISTINGS = [
  {
    title: 'Fully Furnished House — Sialkot',
    description:
      'Well-maintained furnished house with diamond-pattern marble flooring throughout. ' +
      'Spacious drawing room with antique wooden cabinet and curtains. ' +
      'Separate dining area with 6-seater carved wooden dining set and display cabinet. ' +
      'AC + ceiling fan in every room. Three bedrooms each with wooden double bed, wardrobe, ' +
      'and side tables. Clean white-tiled bathrooms with modern fittings. ' +
      'Small garden visible from dining window. Peaceful residential street. ' +
      'Direct from landlord — no brokerage. One month security deposit.',
    city: 'Sialkot',
    locality: 'Paris Road',
    address: 'Street 4, Paris Road, Sialkot',
    propertyType: 'House',
    rentAmount: 45000,
    rooms: 3,
    bathrooms: 2,
    areaMarla: 5,
    furnishing: 'Furnished',
    utilities: ['Gas', 'Electricity', 'Water'],
    ownerVerified: true,
    isBoosted: true,
    latitude: 32.5007,
    longitude: 74.5388,
    photos: HOUSE1_PHOTOS,
  },
];

async function main() {
  console.log('Seeding listings…');

  const landlord = await prisma.user.upsert({
    where: { phone: LANDLORD_PHONE },
    create: {
      phone: LANDLORD_PHONE,
      name: 'Demo Landlord',
      role: 'LANDLORD',
      verificationTier: 'VERIFIED',
      isActive: true,
      acceptedTerms: true,
    },
    update: {},
  });
  console.log(`  ✓ Landlord: ${landlord.id}`);

  await prisma.listing.deleteMany({ where: { landlordId: landlord.id } });
  console.log('  ✓ Cleared old listings');

  for (const data of LISTINGS) {
    const { photos, ...fields } = data;
    const listing = await prisma.listing.create({
      data: {
        ...fields,
        landlordId: landlord.id,
        status: 'ACTIVE',
        photos: {
          create: photos.map((url, i) => ({ url, isCover: i === 0, order: i })),
        },
      },
    });
    console.log(`  ✓ ${listing.title}`);
  }

  console.log(`\nDone — ${LISTINGS.length} listing(s) created.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
