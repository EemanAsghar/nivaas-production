import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const LANDLORD_PHONE = '+923001234567';

// Unsplash photos — house interiors, exteriors, apartments (freely usable)
const PHOTOS = {
  modern_living: [
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80',
    'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=900&q=80',
    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=900&q=80',
  ],
  cozy_apartment: [
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900&q=80',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900&q=80',
    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=900&q=80',
  ],
  house_exterior: [
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=900&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80',
    'https://images.unsplash.com/photo-1582063289852-62e3ba2747f8?w=900&q=80',
  ],
  studio: [
    'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=900&q=80',
    'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=900&q=80',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=900&q=80',
  ],
  family_home: [
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=900&q=80',
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=900&q=80',
    'https://images.unsplash.com/photo-1575517111839-3a3843ee7f5d?w=900&q=80',
  ],
  penthouse: [
    'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=900&q=80',
    'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=900&q=80',
    'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=900&q=80',
  ],
  shop: [
    'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=900&q=80',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900&q=80',
  ],
  ground_floor: [
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=80',
    'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=900&q=80',
    'https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=900&q=80',
  ],
};

const LISTINGS = [
  {
    title: '3-Bed Modern House in Gulshan Colony',
    description: 'Spacious newly-built house with marble flooring, designer kitchen, and a dedicated car porch. NADRA-verified landlord. Ideal for a family of 4–6.',
    city: 'Sialkot',
    locality: 'Gulshan Colony',
    propertyType: 'House',
    rentAmount: 55000,
    rooms: 3,
    bathrooms: 2,
    areaMarla: 7,
    furnishing: 'Semi-furnished',
    utilities: ['Gas', 'Electricity', 'Water'],
    ownerVerified: true,
    isBoosted: true,
    latitude: 32.4986,
    longitude: 74.5361,
    photos: PHOTOS.family_home,
  },
  {
    title: 'Furnished 2-Bed Apartment — Model Town',
    description: 'A bright, fully furnished apartment on the 3rd floor with a city view. Includes sofa set, beds, wardrobes, and air conditioning in every room.',
    city: 'Lahore',
    locality: 'Model Town',
    propertyType: 'Apartment',
    rentAmount: 72000,
    rooms: 2,
    bathrooms: 2,
    areaSqft: 1100,
    furnishing: 'Furnished',
    utilities: ['Gas', 'Electricity', 'Water', 'Internet'],
    ownerVerified: true,
    isBoosted: false,
    latitude: 31.4826,
    longitude: 74.3294,
    photos: PHOTOS.modern_living,
  },
  {
    title: 'Studio Apartment near Faisalabad Clock Tower',
    description: 'Compact and modern studio — perfect for working professionals or students. Includes kitchen counter, attached bath, and 24/7 security guard.',
    city: 'Faisalabad',
    locality: 'D-Ground',
    propertyType: 'Studio',
    rentAmount: 18000,
    rooms: 1,
    bathrooms: 1,
    areaSqft: 420,
    furnishing: 'Furnished',
    utilities: ['Electricity', 'Water'],
    ownerVerified: false,
    isBoosted: false,
    latitude: 31.4180,
    longitude: 73.0790,
    photos: PHOTOS.studio,
  },
  {
    title: 'Upper Portion — 4 Marla in Cant Area',
    description: 'Freshly painted upper portion with separate entrance. Peaceful street, near schools and markets. Gas and electricity with separate metres.',
    city: 'Gujranwala',
    locality: 'Cantt',
    propertyType: 'Portion',
    rentAmount: 28000,
    rooms: 2,
    bathrooms: 1,
    areaMarla: 4,
    furnishing: 'Unfurnished',
    utilities: ['Gas', 'Electricity', 'Water'],
    ownerVerified: true,
    isBoosted: false,
    latitude: 32.1553,
    longitude: 74.1831,
    photos: PHOTOS.ground_floor,
  },
  {
    title: 'Luxury 4-Bed Villa — Valencia Town',
    description: 'Premium villa in Valencia Town with a private lawn, servant quarters, and imported tiles. Fully fitted kitchen with cooking range. One month deposit.',
    city: 'Lahore',
    locality: 'Valencia Town',
    propertyType: 'House',
    rentAmount: 130000,
    rooms: 4,
    bathrooms: 3,
    areaMarla: 10,
    furnishing: 'Furnished',
    utilities: ['Gas', 'Electricity', 'Water', 'Internet'],
    ownerVerified: true,
    isBoosted: true,
    latitude: 31.5147,
    longitude: 74.2686,
    photos: PHOTOS.penthouse,
  },
  {
    title: 'Ground Floor 3-Bed in Johar Town',
    description: 'Ground floor with easy access, large drawing room, 3 bedrooms, 2 bathrooms, and a small garden. Easy parking. Near Johar Town commercial market.',
    city: 'Lahore',
    locality: 'Johar Town',
    propertyType: 'House',
    rentAmount: 65000,
    rooms: 3,
    bathrooms: 2,
    areaMarla: 5,
    furnishing: 'Unfurnished',
    utilities: ['Gas', 'Electricity', 'Water'],
    ownerVerified: true,
    isBoosted: false,
    latitude: 31.4697,
    longitude: 74.2728,
    photos: PHOTOS.house_exterior,
  },
  {
    title: '1-Bed Cozy Apartment in Satellite Town',
    description: 'Well-maintained 1-bedroom apartment on quiet street. Ideal for couples or single professionals. Balcony with garden view. Two months deposit.',
    city: 'Rawalpindi',
    locality: 'Satellite Town',
    propertyType: 'Apartment',
    rentAmount: 32000,
    rooms: 1,
    bathrooms: 1,
    areaSqft: 650,
    furnishing: 'Semi-furnished',
    utilities: ['Gas', 'Electricity', 'Water'],
    ownerVerified: false,
    isBoosted: false,
    latitude: 33.6218,
    longitude: 73.0747,
    photos: PHOTOS.cozy_apartment,
  },
  {
    title: 'Single Room — Ladies Only, Near FC College',
    description: 'Clean single room with attached bath, WiFi included. Ladies only. Common kitchen access. Separate main gate with intercom. Walking distance to FC College.',
    city: 'Lahore',
    locality: 'Ferozepur Road',
    propertyType: 'Room',
    rentAmount: 12000,
    rooms: 1,
    bathrooms: 1,
    areaSqft: 200,
    furnishing: 'Furnished',
    utilities: ['Electricity', 'Water', 'Internet'],
    ownerVerified: false,
    isBoosted: false,
    latitude: 31.5089,
    longitude: 74.3204,
    photos: PHOTOS.studio,
  },
  {
    title: 'Commercial Shop — Ground Floor Mall Road',
    description: 'Prime commercial space on Mall Road ground floor. Roller shutter, heavy electricity connection, 24/7 access. Suitable for retail, office, or salon.',
    city: 'Sialkot',
    locality: 'Mall Road',
    propertyType: 'Shop',
    rentAmount: 45000,
    rooms: 1,
    bathrooms: 1,
    areaSqft: 350,
    furnishing: 'Unfurnished',
    utilities: ['Electricity'],
    ownerVerified: true,
    isBoosted: false,
    latitude: 32.4927,
    longitude: 74.5313,
    photos: PHOTOS.shop,
  },
  {
    title: '5-Marla Family House — Khayaban-e-Amin',
    description: 'Well-maintained family house with lawn, double storey, 3 beds plus drawing room. Generator backup, CCTV cameras, and dedicated parking. Near school and mosque.',
    city: 'Lahore',
    locality: 'Khayaban-e-Amin',
    propertyType: 'House',
    rentAmount: 80000,
    rooms: 3,
    bathrooms: 3,
    areaMarla: 5,
    furnishing: 'Semi-furnished',
    utilities: ['Gas', 'Electricity', 'Water'],
    ownerVerified: true,
    isBoosted: true,
    latitude: 31.4423,
    longitude: 74.2441,
    photos: PHOTOS.family_home,
  },
];

async function main() {
  console.log('Seeding listings…');

  // Upsert a demo landlord user
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

  // Remove old seed listings for this landlord
  await prisma.listing.deleteMany({ where: { landlordId: landlord.id } });
  console.log('Cleared existing listings for landlord.');

  for (const data of LISTINGS) {
    const { photos, ...fields } = data;
    const listing = await prisma.listing.create({
      data: {
        ...fields,
        landlordId: landlord.id,
        status: 'ACTIVE',
        photos: {
          create: photos.map((url, i) => ({
            url,
            isCover: i === 0,
            order: i,
          })),
        },
      },
    });
    console.log(`  ✓ ${listing.title}`);
  }

  console.log(`\nDone — ${LISTINGS.length} listings created.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
