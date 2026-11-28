import { cleanAnswers, validateAnswers } from '@/utils/registrationValidation';
import type { RegistrationField } from '@/interface/driverRegistration.type';

const field = (value: Partial<RegistrationField>): RegistrationField => ({
  key: 'field', label: 'Configured field', type: 'text', enabled: true,
  required: false, options: [], expiry: false, ...value,
});
const email = 'verified@example.test';
const errors = (spec: Partial<RegistrationField>, answer: unknown) =>
  validateAnswers([field(spec)], { field: answer } as Parameters<typeof validateAnswers>[1], email);

test('phone stays optional and never reaches answers, including required legacy schema and custom tel keys', () => {
  const fields = [field({ key: 'phone', required: true }), field({ key: 'contact_number', type: 'tel', required: true })];
  expect(validateAnswers(fields, {}, email)).toEqual({});
  expect(cleanAnswers(fields, { phone: '+919876543210', contact_number: '+971501234567' }, email)).toEqual({});
});

test('required controls distinguish false, zero string, whitespace and empty objects', () => {
  expect(errors({ required: true }, '  ')).toHaveProperty('field');
  expect(errors({ type: 'number', required: true }, '0')).toEqual({});
  expect(errors({ type: 'checkbox', required: true }, false)).toHaveProperty('field');
  expect(errors({ type: 'checkbox', required: true }, true)).toEqual({});
  expect(errors({ type: 'checkbox' }, false)).toEqual({});
  expect(errors({ type: 'address' }, {})).toHaveProperty('field');
  expect(errors({ enabled: false, required: true }, '')).toEqual({});
});

test.each([
  ['email', 'wrong'], ['number', 'NaN'],
  ['number', 42], ['number', '2abc'], ['number', 'Infinity'], ['date', '2025-02-30'],
] as const)('%s rejects malformed answer %s', (type, value) => {
  expect(errors({ type }, value)).toHaveProperty('field');
});

test('email and disabled/unknown keys never enter submitted answers', () => {
  const fields = [field({ key: 'email', type: 'email', required: true }), field({ key: 'hidden', enabled: false })];
  const answers = { email: 'attacker@example.test', hidden: 'private', injected: 'extra' };
  expect(validateAnswers(fields, answers, email)).toEqual({});
  expect(cleanAnswers(fields, answers, email)).toEqual({});
});

test('select values are exact and number answer remains string', () => {
  expect(errors({ type: 'select', options: ['Full time'] }, 'full time')).toHaveProperty('field');
  expect(errors({ type: 'select', options: ['Full time'] }, 'Full time')).toEqual({});
  expect(cleanAnswers([field({ type: 'number' })], { field: '42' }, email)).toEqual({ field: '42' });
});

test('date of birth may be past; expiry date cannot', () => {
  expect(errors({ type: 'date' }, '1990-01-02')).toEqual({});
  expect(validateAnswers([field({ key: 'licence_expires_on', type: 'date' })], { licence_expires_on: '1990-01-02' }, email)).toHaveProperty('licence_expires_on');
});

test('file requires an uploaded name and current expiry when configured', () => {
  expect(errors({ type: 'file', expiry: true }, { uri: 'file://local.jpg' })).toHaveProperty('field');
  expect(errors({ type: 'file', expiry: true }, { name: 'uploaded.jpg' })).toHaveProperty('field');
  expect(errors({ type: 'file', expiry: true }, { name: 'uploaded.jpg', expires_on: '2000-01-01' })).toHaveProperty('field');
  expect(errors({ type: 'file', expiry: true }, { name: 'uploaded.jpg', expires_on: '2099-01-01' })).toEqual({});
  expect(errors({ type: 'file' }, { name: 'uploaded.pdf' })).toEqual({});
});

test('address validates required parts and preserves text postcode', () => {
  expect(errors({ type: 'address' }, { line1: 'Road 1', city: 'Dubai', country: 'UAE' })).toHaveProperty('field');
  const value = { line1: 'Road 1', city: 'Dubai', country: 'AE', postcode: '00000' };
  expect(errors({ type: 'address' }, value)).toEqual({});
  expect(cleanAnswers([field({ type: 'address' })], { field: value }, email)).toEqual({ field: value });
});

test.each([
  [{ minLength: 3 }, 'ab'], [{ maxLength: 2 }, 'abc'],
  [{ minDigits: 3 }, 'AB12'], [{ maxDigits: 2 }, 'A123'],
  [{ min: 10 }, '9'], [{ max: 10 }, '11'],
])('configured rule %o is checked', (validation, answer) => {
  expect(errors({ validation }, answer)).toHaveProperty('field');
});

test('patternMessage stays verbatim and bad schema regex cannot silently pass', () => {
  const validation = { pattern: '^[A-Z0-9-]+$', patternMessage: 'Use capitals, digits and dashes.' };
  expect(errors({ validation }, 'lowercase')).toEqual({ field: validation.patternMessage });
  expect(errors({ validation }, 'DL-123')).toEqual({});
  expect(errors({ validation: { pattern: '[' } }, 'anything')).toHaveProperty('field');
});

test('unknown enabled field types fail closed', () => {
  const unknown = JSON.parse('{"type":"new-server-type"}') as Partial<RegistrationField>;
  expect(errors(unknown, undefined)).toHaveProperty('field');
});
