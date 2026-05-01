export const APP_NAME = 'Nivaas';
export const APP_TAGLINE = 'Rentals you can actually trust.';
export const SUPPORT_EMAIL = 'support@nivaas.pk';

export const OTP_EXPIRY_MINUTES = 10;
export const OTP_RATE_LIMIT = 3;
export const OTP_RATE_WINDOW_MINUTES = 5;

export const LISTING_FEE_PKR = 2500;
export const INSPECTION_FEE_PKR = 1800;
export const BOOST_FEE_PKR = 1500;
export const BOOST_DURATION_DAYS = 30;

export const TRUST_SCORE = {
  BASE: 40,
  STANDARD_TIER: 10,
  VERIFIED_TIER: 25,
  OWNER_VERIFIED: 20,
  INSPECTED: 10,
  THREE_PHOTOS: 5,
  MAX: 95,
} as const;

export const PROPERTY_TYPES = [
  'House',
  'Apartment',
  'Upper Portion',
  'Lower Portion',
  'Room',
  'Studio',
  'Office',
  'Shop',
] as const;

export const UTILITY_OPTIONS = [
  'Gas',
  'Electricity',
  'Water',
  'Internet',
  'Generator',
  'Solar',
] as const;

export const CITIES_LIST = [
  'Sialkot',
  'Gujranwala',
  'Sargodha',
  'Narowal',
  'Nankana Sahib',
  'Hafizabad',
] as const;

export type CityName = typeof CITIES_LIST[number];
export type PropertyType = typeof PROPERTY_TYPES[number];
