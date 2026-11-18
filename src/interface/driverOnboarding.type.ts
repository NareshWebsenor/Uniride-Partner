import type { ReactNode } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { TRootStack } from "./navigation.type";
import type { ImageSourcePropType } from "react-native";

export type DrivingPreference = "fleet" | "own";
export type VehicleType = "car" | "bike";
export type ProfileStage = "driver" | "vehicle";
export type DocumentKind =
  | "license"
  | "photo"
  | "government"
  | "rc"
  | "pollution"
  | "insurance";

export interface LocalUpload {
  uri: string;
  name: string;
  mime: string;
  size: number;
}

export interface DocumentDraft {
  front?: LocalUpload;
  back?: LocalUpload;
  number: string;
  provider: string;
  validUntil: string;
  submitted: boolean;
}

export interface VehicleModelDraft {
  make: string;
  model: string;
  variant: string;
  year: string;
  submitted: boolean;
}

export interface BankDetailsDraft {
  bankName: string;
  holderName: string;
  accountNumber: string;
  confirmAccountNumber: string;
  iban: string;
}

export type TDriverOnboardingStack = {
  EarningLocationScreen: undefined;
  ChooseVehicleTypeScreen: undefined;
  DrivingPreferenceScreen: undefined;
  ProfileScreen: { stage: ProfileStage };
  DrivingLicenseScreen: undefined;
  ProfilePictureScreen: undefined;
  GovernmentIdScreen: undefined;
  VehicleModelScreen: undefined;
  VehicleRcScreen: undefined;
  PollutionCertificateScreen: undefined;
  VehicleInsuranceScreen: undefined;
  BankDetailsScreen: undefined;
};

export type OnboardingScreenProps<Route extends keyof TDriverOnboardingStack> =
  NativeStackScreenProps<TRootStack, Route>;

export interface OnboardingLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  onBack: () => void;
  onContinue: () => void;
  continueLabel?: string;
  disabled?: boolean;
  testID: string;
}

export interface UploadFieldProps {
  label: string;
  actionLabel: string;
  value?: LocalUpload;
  onChange: (value: LocalUpload | undefined) => void;
  imagesOnly?: boolean;
  large?: boolean;
  testID: string;
  error?: string;
}

export interface OnboardingDateFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  testID: string;
  error?: string;
}

export interface OnboardingDocumentFormProps {
  kind: DocumentKind;
  onBack: () => void;
  onSaved: () => void;
}

export interface DriverOnboardingDraft {
  firstName: string;
  city: string;
  referral: string;
  vehicleType?: VehicleType;
  preference?: DrivingPreference;
  documents: Record<DocumentKind, DocumentDraft>;
  vehicle: VehicleModelDraft;
  bank: BankDetailsDraft;
}

export interface DriverOnboardingStore extends DriverOnboardingDraft {
  start: (firstName: string) => void;
  clear: () => void;
  completePreview: () => boolean;
  setCity: (value: string) => void;
  setReferral: (value: string) => void;
  setVehicleType: (value: VehicleType) => void;
  setPreference: (value: DrivingPreference) => void;
  updateDocument: (
    kind: DocumentKind,
    value: Partial<Omit<DocumentDraft, "submitted">>
  ) => void;
  commitDocument: (kind: DocumentKind) => boolean;
  updateVehicle: (value: Partial<Omit<VehicleModelDraft, "submitted">>) => void;
  commitVehicle: () => boolean;
  updateBank: (value: Partial<BankDetailsDraft>) => void;
}

export interface OnboardingChoiceCardProps {
  title: string;
  description: string;
  badges: string[];
  variant?: "driver" | "car" | "bike";
  selected: boolean;
  onPress: () => void;
  image?: ImageSourcePropType;
  icon?: "car-outline" | "bicycle-outline";
  testID: string;
}

export interface OnboardingProgressProps {
  stage: 1 | 2 | 3;
}
