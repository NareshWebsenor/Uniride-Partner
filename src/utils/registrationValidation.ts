import i18n from '@/localizations';
import type { AddressAnswer, Answers, FileAnswer, RegistrationField } from '@/interface/driverRegistration.type';
import { isCurrentDate, parseLocalDate } from '@/utils/driverOnboarding';
import { isLocalOnlyPhoneField } from './registrationContact';

export const REGISTRATION_FILE_LIMIT = 5 * 1024 * 1024;
export const REGISTRATION_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const supportedTypes = new Set(['text', 'email', 'tel', 'number', 'date', 'select', 'checkbox', 'address', 'file']);
const message = (key: string, options?: Record<string, unknown>) => String(i18n.t(`driverRegistration.fields.${key}`, options));
const blank = (value: unknown) => value === undefined || value === null || (typeof value === 'string' && !value.trim());

export function isFileAnswer(value: unknown): value is FileAnswer {
  return typeof value === 'object' && value !== null && 'name' in value &&
    typeof value.name === 'string' && Boolean(value.name.trim()) &&
    (!('expires_on' in value) || typeof value.expires_on === 'string');
}

export function isAddressAnswer(value: unknown): value is AddressAnswer {
  return typeof value === 'object' && value !== null &&
    'line1' in value && typeof value.line1 === 'string' &&
    'city' in value && typeof value.city === 'string' &&
    'country' in value && typeof value.country === 'string';
}

function validateField(field: RegistrationField, value: unknown): string | undefined {
  if (!supportedTypes.has(field.type)) return message('unsupported');
  if (field.type === 'checkbox') {
    return field.required ? value === true ? undefined : message('required')
      : value === undefined || typeof value === 'boolean' ? undefined : message('invalid');
  }
  if (blank(value)) return field.required ? message('required') : undefined;
  if (field.type === 'file') {
    if (!isFileAnswer(value)) return message('uploadRequired');
    if (field.expiry && !value.expires_on) return message('expiryRequired');
    if (value.expires_on && !isCurrentDate(value.expires_on)) return message('expired');
    return;
  }
  if (field.type === 'address') {
    if (!isAddressAnswer(value) || !value.line1.trim() || !value.city.trim() || !/^[A-Z]{2}$/.test(value.country)) {
      return message('addressRequired');
    }
    for (const key of ['line2', 'region', 'postcode'] as const) {
      if (value[key] !== undefined && typeof value[key] !== 'string') return message('invalid');
    }
    return;
  }
  if (typeof value !== 'string') return message('invalid');
  if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return message('email');
  if (field.type === 'tel' && (!/^\+[\d\s()-]+$/.test(value) || value.length < 5 || value.length > 30)) return message('phone');
  if (field.type === 'select' && !field.options.includes(value)) return message('select');
  if (field.type === 'number' && (!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(value.trim()) || !Number.isFinite(Number(value)))) return message('number');
  if (field.type === 'date') {
    if (!parseLocalDate(value)) return message('date');
    if (/expiry|expires_on/i.test(field.key) && !isCurrentDate(value)) return message('expired');
  }
  const rules = field.validation;
  if (!rules) return;
  if (rules.minLength !== undefined && value.length < rules.minLength) return message('minLength', { count: rules.minLength });
  if (rules.maxLength !== undefined && value.length > rules.maxLength) return message('maxLength', { count: rules.maxLength });
  const digits = value.replace(/\D/g, '').length;
  if (rules.minDigits !== undefined && digits < rules.minDigits) return message('minDigits', { count: rules.minDigits });
  if (rules.maxDigits !== undefined && digits > rules.maxDigits) return message('maxDigits', { count: rules.maxDigits });
  if (rules.min !== undefined && Number(value) < rules.min) return message('minimum', { value: rules.min });
  if (rules.max !== undefined && Number(value) > rules.max) return message('maximum', { value: rules.max });
  if (rules.pattern) {
    try {
      if (!new RegExp(rules.pattern).test(value)) return rules.patternMessage || message('invalid');
    } catch { return message('unsupported'); }
  }
}

export function validateAnswers(fields: RegistrationField[], answers: Answers, email: string): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    if (!field.enabled || isLocalOnlyPhoneField(field)) continue;
    const error = validateField(field, field.key === 'email' ? email : answers[field.key]);
    if (error) errors[field.key] = error;
  }
  return errors;
}

/** Only enabled schema keys cross the API boundary; server owns verified email. */
export function cleanAnswers(fields: RegistrationField[], answers: Answers, email: string): Answers {
  const clean: Answers = {};
  for (const field of fields) {
    if (!field.enabled || !supportedTypes.has(field.type) || isLocalOnlyPhoneField(field)) continue;
    const value = field.key === 'email' ? email : answers[field.key];
    if (blank(value)) continue;
    if (field.type === 'address' && isAddressAnswer(value)) {
      clean[field.key] = {
        line1: value.line1.trim(), city: value.city.trim(), country: value.country,
        ...(value.line2 ? { line2: value.line2 } : {}), ...(value.region ? { region: value.region } : {}),
        ...(value.postcode ? { postcode: value.postcode } : {}),
      };
    } else if (field.type === 'file' && isFileAnswer(value)) {
      clean[field.key] = { name: value.name, ...(value.expires_on ? { expires_on: value.expires_on } : {}) };
    } else if (typeof value === 'string' || typeof value === 'boolean') clean[field.key] = value;
  }
  return clean;
}
