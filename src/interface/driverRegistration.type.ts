export type ApplicationState = 'invited' | 'changes_requested' | 'pending_review' | 'activation_pending' | 'active';
export type EditableState = 'invited' | 'changes_requested';
export type DriveMode = 'fleet_partner' | 'own_vehicle';
export type FileAnswer = { name: string; expires_on?: string };
export type AddressAnswer = { line1: string; line2?: string; city: string; region?: string; postcode?: string; country: string };
export type Answer = string | boolean | FileAnswer | AddressAnswer;
export type Answers = Record<string, Answer>;
export type RegistrationField = {
  key: string; label: string; type: 'text' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'checkbox' | 'address' | 'file';
  required: boolean; enabled: boolean; options: string[]; expiry: boolean;
  validation?: { minLength?: number; maxLength?: number; minDigits?: number; maxDigits?: number; min?: number; max?: number; pattern?: string; patternMessage?: string };
};
export type Vehicle = {
  model_id: string; fuel_type_id?: string; year: number; registration_number: string; colour: string;
  documents: { registration_certificate: FileAnswer; insurance: FileAnswer; pollution_certificate?: FileAnswer };
};
export type VehicleDraft = {
  type_id: string; brand_id: string; model_id: string; fuel_type_id: string;
  year: string; registration_number: string; colour: string;
  documents: { registration_certificate?: FileAnswer; insurance?: FileAnswer; pollution_certificate?: FileAnswer };
};
export type VehicleOptions = {
  types: { type_id: string; name: string }[];
  brands: { brand_id: string; type_id: string; name: string }[];
  models: { model_id: string; brand_id: string; type_id: string; name: string; passenger_capacity: number; luggage_capacity: number; fuel_types: { fuel_type_id: string; name: string }[] }[];
};
export type RegistrationForm = {
  application_id: string; state: ApplicationState; source: string; email: string;
  driver_type: null; drive_mode: DriveMode | null; vehicle: Vehicle | null;
  form_version: number; expires_at: string; reason: string | null; answers: Answers; fields: RegistrationField[];
};
export type VerifyResponse =
  | { state: EditableState; application_id: string; token: string; reason: string | null }
  | { state: 'pending_review' | 'activation_pending' | 'active'; application_id: string };
export type EmailCodeResponse = { message: string; expires_in: number; email_sent: boolean; development_code?: string };
export type EmailCodePayload = { first_name: string; last_name: string; email: string };
export type SubmitPayload = { token: string; answers: Answers; drive_mode: DriveMode; vehicle?: Vehicle };
export type DriverLoginResponse = {
  session: string; token_type: 'Bearer'; expires_in: number;
  user: { id: string; driver_id: string; email: string; name: string; actor_type: 'driver'; permissions: string[]; mfa_required: boolean };
};
export type RegistrationCredential = { token: string; applicationId: string; email: string; expiresAt?: string; passwordSet?: boolean };
