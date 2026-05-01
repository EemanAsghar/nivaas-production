import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: {
      title: true,
      city: true,
      locality: true,
      rentAmount: true,
      propertyType: true,
      rooms: true,
      description: true,
      photos: { where: { isCover: true }, take: 1 },
    },
  });

  if (!listing) {
    return { title: 'Property not found — Nivaas' };
  }

  const title = `${listing.title} — ₨${listing.rentAmount.toLocaleString()}/mo | Nivaas`;
  const description =
    listing.description?.slice(0, 155) ??
    `${listing.rooms}-bed ${listing.propertyType.toLowerCase()} for rent in ${listing.locality}, ${listing.city}. Verified listing on Nivaas.`;

  const coverPhoto = listing.photos[0]?.url;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      ...(coverPhoto ? { images: [{ url: coverPhoto, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(coverPhoto ? { images: [coverPhoto] } : {}),
    },
  };
}

export default function PropertyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
