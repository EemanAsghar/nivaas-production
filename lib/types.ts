export type VerificationTier = 'BASIC' | 'STANDARD' | 'VERIFIED';
export type UserRole = 'TENANT' | 'LANDLORD' | 'INSPECTOR' | 'ADMIN';
export type ListingStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'REMOVED';
export type FurnishingType = 'Furnished' | 'Semi-furnished' | 'Unfurnished';
export type InspectionStatus = 'REQUESTED' | 'ASSIGNED' | 'COMPLETED' | 'CANCELLED';
export type ViewingStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'RESCHEDULED';
export type PaymentGateway = 'JAZZCASH' | 'EASYPAISA' | 'CARD';
export type PaymentType = 'LISTING_FEE' | 'INSPECTION_FEE' | 'BOOST';
export type MessageStatus = 'SENT' | 'DELIVERED' | 'READ';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
}

export interface ApiError {
  error: string;
}

export interface PhotoDto {
  id: string;
  url: string;
  isCover: boolean;
  order: number;
}

export interface LandlordSummary {
  id: string;
  name: string | null;
  verificationTier: VerificationTier;
  photoUrl: string | null;
}

export interface ListingSummary {
  id: string;
  title: string;
  city: string;
  locality: string;
  rentAmount: number;
  rooms: number;
  bathrooms: number;
  areaMarla: number | null;
  areaSqft: number | null;
  propertyType: string;
  furnishing: FurnishingType;
  isBoosted: boolean;
  ownerVerified: boolean;
  createdAt: string;
  photos: PhotoDto[];
  landlord: LandlordSummary;
}
