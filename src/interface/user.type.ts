export type UserType = 'seeker' | 'eyes' | 'community';

export type UserStatus = 'active' | 'inactive' | 'suspended';

export type AuthProvider = 'email' | 'google' | 'apple';

export type UserGender = 'male' | 'female' | 'other' | 'preferNotToSay';
export type DisabilityStatus = 'yes' | 'no';

export type KycStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;

  userType: UserType;
  status: UserStatus;
  authProvider: AuthProvider;

  email: string;
  phoneNumber: string;
  phoneVerified: boolean;
  emailVerified: boolean;

  appleId: string | null;
  googleId: string | null;

  firstName: string;
  lastName: string;
  gender?: UserGender;
  disability?: DisabilityStatus;
  displayName: string | null;
  avatarUrl: string | null;
  dateOfBirth: string | null;

  countryCode: string;
  country: string;
  city: string;
  state: string;

  latitude: string | null;
  longitude: string | null;

  kycStatus: KycStatus;
  isVerified: boolean;
  verifiedAt: string | null;
  verificationBadge: string | null;

  onboardingStep: number;
  onboardingCompleted: boolean;
  seekerProfileCompleted: boolean;
  eyesProfileCompleted: boolean;
  communityProfileCompleted: boolean;

  ratePerMinute: number | null;
  currency: string | null;

  businessName: string | null;
  businessType: string | null;
  businessDocumentUrl: string | null;

  isVip: boolean;
  isAvailable: boolean;

  walletBalance: string; // kept string because API returns "0.00"
  bonusBalance: string;

  referralCode: string;
  referredByUserId: string | null;

  rating: number | null;

  failedLoginAttempts: number;
  lockedUntil: string | null;
  lastLoginAt: string | null;

  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;

  fcmToken: string | null;
}

export type DocumentType = 'passport' | 'aadhaar' | 'driving_license';

export interface KycStep {
  completed: boolean;
  documentType: DocumentType;
  frontUploaded: boolean;
  backUploaded: boolean;
  required: boolean;
}

export interface FaceVerificationStep {
  completed: boolean;
  uploaded: boolean;
  required: boolean;
}

export interface ProfileStep {
  completed: boolean;
  required: boolean;
  fields: Array<'firstName' | 'lastName' | 'countryCode' | 'country' | 'city'>;
}

export interface OnboardingSteps {
  kyc: KycStep;
  faceVerification: FaceVerificationStep;
  profile: ProfileStep;
}

export enum EMissingChannel {
  EMAIL = 'email',
  MOBILE = 'mobile',
}

export interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  onboardingCompleted: boolean;
  userType: UserType;

  requiresCrossChannelVerification: boolean;
  missingChannel: EMissingChannel;
  isLegacyUser: boolean;
  showVerificationBanner: boolean;

  steps: OnboardingSteps;
}

export interface IEye {
  id: string;
  displayName: string | null;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  ratePerMinute: number;
  currency: string;
  rating: number;
  isAvailable: boolean;
  latitude: number;
  longitude: number;
  distanceKm: number;
}
