export type BadgeKind = 'nadra' | 'inspected' | 'exclusive' | 'boost' | 'owner';

export interface City {
  name: string;
  tier: number;
  hero: string;
  lat: number;
  lng: number;
}

export const CITIES: City[] = [
  { name: 'Sialkot',       tier: 2, lat: 32.4945, lng: 74.5229, hero: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&w=800&q=60' },
  { name: 'Gujranwala',    tier: 2, lat: 32.1877, lng: 74.1945, hero: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&w=800&q=60' },
  { name: 'Sargodha',      tier: 2, lat: 32.0836, lng: 72.6711, hero: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&w=800&q=60' },
  { name: 'Narowal',       tier: 3, lat: 32.1037, lng: 74.8736, hero: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&w=800&q=60' },
  { name: 'Nankana Sahib', tier: 3, lat: 31.4500, lng: 73.7100, hero: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&w=800&q=60' },
  { name: 'Hafizabad',     tier: 3, lat: 32.0714, lng: 73.6878, hero: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&w=800&q=60' },
  // Extra cities present in demo data
  { name: 'Lahore',        tier: 1, lat: 31.5204, lng: 74.3587, hero: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&w=800&q=60' },
  { name: 'Rawalpindi',    tier: 1, lat: 33.6007, lng: 73.0679, hero: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&w=800&q=60' },
  { name: 'Faisalabad',    tier: 1, lat: 31.4504, lng: 73.1350, hero: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&w=800&q=60' },
];

export const CITY_COORDS: Record<string, { lat: number; lng: number }> = Object.fromEntries(
  CITIES.map(c => [c.name, { lat: c.lat, lng: c.lng }])
);
