import type { RegistrationField } from '@/interface/driverRegistration.type';

// Phone is saved through its dedicated endpoint, outside dynamic form answers.
export const isRegistrationPhoneKey = (key: string) =>
  ['phone', 'phone_number', 'mobile', 'mobile_number'].includes(key);
export const isLocalOnlyPhoneField = (field: RegistrationField) =>
  field.type === 'tel' || isRegistrationPhoneKey(field.key);
