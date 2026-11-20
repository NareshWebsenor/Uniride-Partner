import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import i18n from '@/localizations';
import LoginScreen from '@/screens/auth/LoginScreen';
import { Button, Checkbox, TextInput } from '@/components/ui';
import type { TRootStack } from '@/interface/navigation.type';
import type { DriverLoginResponse, RegistrationForm } from '@/interface/driverRegistration.type';
import { isValidEmail, maskEmail, passwordRules } from '@/utils/authPreview';
import { useThemeStore } from '@/store/themeStore';
import { loginDriver, sendEmailCode, setRegistrationPassword, setRegistrationPhone, verifyEmailCode } from '@/service/rest/auth';
import { clearRegistrationCredential, getRegistrationCredential, saveDriverSession, saveRegistrationCredential } from '@/service/driverSession';
import { DriverApiError } from '@/service/rest/driverClient';
import { clearRegistrationDraft, useRegistrationStore } from '@/store/registrationStore';
import { clearRegistrationEntry, registrationEntryAnswers } from '@/service/registrationEntry';

const mockNavigation = { reset: jest.fn(), replace: jest.fn() };
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'), useNavigation: () => mockNavigation,
}));
jest.mock('@/service/rest/auth', () => ({
  setRegistrationPassword: jest.fn(), setRegistrationPhone: jest.fn(), sendEmailCode: jest.fn(), verifyEmailCode: jest.fn(), loginDriver: jest.fn(),
}));
jest.mock('@/service/driverSession', () => ({
  clearRegistrationCredential: jest.fn(), getRegistrationCredential: jest.fn(),
  saveDriverSession: jest.fn(), saveRegistrationCredential: jest.fn(),
}));
type Navigation = NativeStackScreenProps<TRootStack, 'LoginScreen'>['navigation'];
const loginResponse: DriverLoginResponse = { session: 'session', token_type: 'Bearer', expires_in: 43200,
  user: { id: 'user', driver_id: 'driver', email: 'test@gmail.com', name: 'Test', actor_type: 'driver', permissions: [], mfa_required: false } };
let tree: Renderer.ReactTestRenderer;
const input = (id: string) => tree.root.findAllByType(TextInput).find(node => node.props.testID === id)!;
const button = (id: string) => tree.root.findAllByType(Button).find(node => node.props.testID === id)!;
const change = async (id: string, value: string) => act(async () => input(id).props.onChangeText(value));
const press = async (id: string) => act(async () => button(id).props.onPress());
const register = async () => {
  await act(async () => tree.root.findAllByProps({ testID: 'register-tab' })[0].props.onPress());
  await change('first-name', 'Test');
  await change('last-name', 'Driver');
  await change('email', 'test@gmail.com');
};
const enterCode = async (code = '123456') => {
  await register(); await press('entry-continue'); await change('email-otp', code);
};
const mount = async () => act(async () => {
  tree = Renderer.create(<SafeAreaProvider><LoginScreen
    navigation={mockNavigation as unknown as Navigation} route={{ key: 'auth', name: 'LoginScreen' }}
  /></SafeAreaProvider>);
});
beforeEach(async () => {
  jest.clearAllMocks(); jest.useFakeTimers(); jest.setSystemTime(1_800_000_000_000);
  jest.mocked(getRegistrationCredential).mockResolvedValue(null);
  jest.mocked(clearRegistrationCredential).mockResolvedValue(undefined);
  jest.mocked(saveRegistrationCredential).mockResolvedValue(undefined);
  jest.mocked(saveDriverSession).mockResolvedValue(undefined);
  jest.mocked(sendEmailCode).mockResolvedValue({ message: 'Sent', expires_in: 600, email_sent: true });
  jest.mocked(verifyEmailCode).mockResolvedValue({ state: 'invited', application_id: 'app', token: 'registration-token', reason: null });
  jest.mocked(loginDriver).mockResolvedValue(loginResponse);
  jest.mocked(setRegistrationPassword).mockResolvedValue({ password_set: true });
  jest.mocked(setRegistrationPhone).mockResolvedValue({ phone: '+919876543210' });
  await clearRegistrationDraft(); await clearRegistrationEntry(); await i18n.changeLanguage('en'); await mount();
});
afterEach(async () => { await act(async () => tree?.unmount()); jest.useRealTimers(); });

test('email masking, validation and preserved password utility', () => {
  expect(maskEmail('test@gmail.com')).toBe('t**t@gmail.com');
  expect(maskEmail('a@gmail.com')).toBe('a**@gmail.com');
  expect(maskEmail('ab@gmail.com')).toBe('a**@gmail.com');
  expect(maskEmail('invalid')).toBe('***');
  expect(isValidEmail('test@gmail.com')).toBe(true);
  expect(isValidEmail('test@')).toBe(false);
  expect(Object.values(passwordRules('abcdefgh')).every(Boolean)).toBe(false);
  expect(Object.values(passwordRules('12345678')).every(Boolean)).toBe(false);
  expect(Object.values(passwordRules('abcdefg1')).every(Boolean)).toBe(true);
});
test('register preserves first/last name and email, hides unsupported Google/forgot and gates six-digit OTP', async () => {
  const loginText = JSON.stringify(tree.toJSON());
  expect(loginText).not.toContain(String(i18n.t('partnerAuth.google')));
  expect(loginText).not.toContain(String(i18n.t('partnerAuth.forgot')));
  await register();
  expect(input('first-name').props.value).toBe('Test');
  expect(input('last-name').props.value).toBe('Driver');
  expect(input('login-password')).toBeUndefined();
  await change('first-name', ''); await press('entry-continue');
  expect(sendEmailCode).not.toHaveBeenCalled(); expect(input('first-name').props.error).toBeTruthy();
  await change('first-name', 'Test');
  await change('email', 'invalid'); await press('entry-continue');
  expect(sendEmailCode).not.toHaveBeenCalled(); expect(input('email').props.error).toBeTruthy();
  await change('email', ' TEST@gmail.com '); await press('entry-continue');
  expect(sendEmailCode).toHaveBeenCalledWith({ first_name: 'Test', last_name: 'Driver', email: 'test@gmail.com' });
  expect(JSON.stringify(tree.toJSON())).toContain('t**t@gmail.com');
  expect(input('email-otp').props.value).toBe(''); expect(input('email-otp').props.maxLength).toBe(6);
  await change('email-otp', '1234'); expect(button('step-continue').props.disabled).toBe(true);
  await press('step-continue'); expect(verifyEmailCode).not.toHaveBeenCalled();
  await change('email-otp', '123456'); expect(button('step-continue').props.disabled).toBe(false);
  expect(input('mobile-number')).toBeUndefined(); expect(input('create-password')).toBeUndefined();
});
test('dev OTP prefills but verification still needs explicit continue', async () => {
  jest.mocked(sendEmailCode).mockResolvedValueOnce({ message: 'Sent', expires_in: 600, email_sent: true, development_code: '482913' });
  await register(); await press('entry-continue');
  expect(input('email-otp').props.value).toBe('482913');
  expect(verifyEmailCode).not.toHaveBeenCalled();
  await press('step-continue'); expect(verifyEmailCode).toHaveBeenCalledWith('test@gmail.com', '482913');
});
test('production ignores dev OTP even if a response contains it', async () => {
  const previous = Reflect.get(global, '__DEV__'); Reflect.set(global, '__DEV__', false);
  try {
    jest.mocked(sendEmailCode).mockResolvedValueOnce({ message: 'Sent', expires_in: 600, email_sent: true, development_code: '482913' });
    await register(); await press('entry-continue');
    expect(input('email-otp').props.value).toBe('');
    expect(button('step-continue').props.disabled).toBe(true);
  } finally { Reflect.set(global, '__DEV__', previous); }
});
test('resend waits 60 seconds and replaces the previous development code', async () => {
  jest.mocked(sendEmailCode)
    .mockResolvedValueOnce({ message: 'Sent', expires_in: 600, email_sent: true, development_code: '123456' })
    .mockResolvedValueOnce({ message: 'Sent again', expires_in: 600, email_sent: true, development_code: '654321' });
  await register(); await press('entry-continue');
  expect(button('resend').props.disabled).toBe(true);
  await press('resend'); expect(sendEmailCode).toHaveBeenCalledTimes(1);
  await act(async () => jest.advanceTimersByTime(60_000));
  expect(button('resend').props.disabled).toBe(false);
  await press('resend'); expect(input('email-otp').props.value).toBe('654321');
  expect(button('resend').props.disabled).toBe(true);
});
test.each(['invited', 'changes_requested'] as const)('verification %s securely saves registration token then opens the original mobile step', async state => {
  jest.mocked(verifyEmailCode).mockResolvedValueOnce({ state, application_id: 'app', token: 'registration-token', reason: 'Fix licence' });
  await enterCode(); await press('step-continue');
  expect(saveRegistrationCredential).toHaveBeenCalledWith({ applicationId: 'app', token: 'registration-token', email: 'test@gmail.com' });
  expect(input('mobile-number')).toBeDefined();
  expect(button('step-continue').props.disabled).toBe(false);
  expect(mockNavigation.replace).not.toHaveBeenCalled();
  expect(saveDriverSession).not.toHaveBeenCalled();
});
test.each(['', '9876543210'])('optional mobile %s saves only when filled; password must save before Terms', async phone => {
  await enterCode(); await press('step-continue');
  jest.mocked(getRegistrationCredential).mockResolvedValue({ token: 'registration-token', applicationId: 'app', email: 'test@gmail.com' });
  await change('mobile-number', phone);
  expect(button('step-continue').props.disabled).toBe(false);
  await press('step-continue');
  if (phone) expect(setRegistrationPhone).toHaveBeenCalledWith('registration-token', '+919876543210');
  else expect(setRegistrationPhone).not.toHaveBeenCalled();
  expect(input('create-password').props.editable).toBe(true);
  expect(button('step-continue').props.disabled).toBe(true);
  await change('create-password', 'Ravi@1234');
  await change('confirm-password', 'wrong');
  expect(button('step-continue').props.disabled).toBe(true);
  await change('confirm-password', 'Ravi@1234');
  jest.mocked(getRegistrationCredential).mockResolvedValue({ token: 'registration-token', applicationId: 'app', email: 'test@gmail.com' });
  await press('step-continue');
  expect(setRegistrationPassword).toHaveBeenCalledWith('registration-token', 'Ravi@1234');
  expect(saveRegistrationCredential).toHaveBeenLastCalledWith({ token: 'registration-token', applicationId: 'app', email: 'test@gmail.com', passwordSet: true });
  expect(button('step-continue').props.disabled).toBe(true);
  await press('step-continue'); expect(mockNavigation.replace).not.toHaveBeenCalled();
  await act(async () => tree.root.findByType(Checkbox).props.onValueChange(true));
  await press('step-continue');
  expect(mockNavigation.replace).toHaveBeenCalledWith('DriverRegistrationScreen');
  const form: RegistrationForm = {
    application_id: 'app', email: 'test@gmail.com', state: 'invited', source: 'self',
    driver_type: null, drive_mode: null, vehicle: null, form_version: 1,
    expires_at: '2030-01-01T00:00:00Z', reason: null, answers: {},
    fields: ['first_name', 'last_name', 'phone', 'accept_terms'].map(key => ({
      key, label: key, type: key === 'accept_terms' ? 'checkbox' : 'text',
      required: true, enabled: true, expiry: false, options: [],
    })),
  };
  expect(await registrationEntryAnswers(form)).toEqual({ first_name: 'Test', last_name: 'Driver', accept_terms: true });
  const entries = await AsyncStorage.multiGet(await AsyncStorage.getAllKeys());
  expect(JSON.stringify(entries)).not.toMatch(/Ravi@1234|registration-token|9876543210/);
  expect(loginDriver).not.toHaveBeenCalled(); expect(saveDriverSession).not.toHaveBeenCalled();
});

test('phone submission waits for success, disables editing and blocks duplicate taps', async () => {
  await enterCode(); await press('step-continue');
  await change('mobile-number', '9812345678');
  jest.mocked(getRegistrationCredential).mockResolvedValue({ token: 'registration-token', applicationId: 'app', email: 'test@gmail.com' });
  let finish!: (value: { phone: string }) => void;
  jest.mocked(setRegistrationPhone).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  await press('step-continue');
  expect(input('mobile-number').props.editable).toBe(false);
  expect(input('create-password')).toBeUndefined();
  expect(button('step-continue').props.loading).toBe(true);
  await press('step-continue'); expect(setRegistrationPhone).toHaveBeenCalledTimes(1);
  await act(async () => finish({ phone: '+919812345678' }));
  expect(input('create-password')).toBeDefined();
});
test('phone validation failure preserves the number and allows retry', async () => {
  await enterCode(); await press('step-continue');
  await change('mobile-number', '9812345678');
  jest.mocked(getRegistrationCredential).mockResolvedValue({ token: 'registration-token', applicationId: 'app', email: 'test@gmail.com' });
  jest.mocked(setRegistrationPhone).mockRejectedValueOnce(new DriverApiError(400, 'validation_failed', 'Invalid phone number.'));
  await press('step-continue');
  expect(input('mobile-number').props.value).toBe('9812345678');
  expect(input('mobile-number').props.editable).toBe(true);
  expect(JSON.stringify(tree.toJSON())).toContain('Invalid phone number.');
  await press('step-continue');
  expect(input('create-password')).toBeDefined();
});
test('phone cannot save without the matching registration credential', async () => {
  await enterCode(); await press('step-continue');
  await change('mobile-number', '9812345678');
  await press('step-continue');
  expect(setRegistrationPhone).not.toHaveBeenCalled();
  expect(clearRegistrationCredential).toHaveBeenCalledTimes(1);
  expect(input('email')).toBeDefined();
});
test('password API failure stays on password step and retry succeeds', async () => {
  await enterCode(); await press('step-continue'); await press('step-continue');
  await change('create-password', 'Ravi@1234'); await change('confirm-password', 'Ravi@1234');
  jest.mocked(getRegistrationCredential).mockResolvedValue({ token: 'registration-token', applicationId: 'app', email: 'test@gmail.com' });
  jest.mocked(setRegistrationPassword).mockRejectedValueOnce(new DriverApiError(400, 'validation_failed', 'Choose a stronger password.'));
  await press('step-continue');
  expect(input('create-password')).toBeDefined();
  expect(JSON.stringify(tree.toJSON())).toContain('Choose a stronger password.');
  expect(saveRegistrationCredential).not.toHaveBeenCalledWith(expect.objectContaining({ passwordSet: true }));
  await press('step-continue');
  expect(tree.root.findByType(Checkbox)).toBeDefined();
});

test.each([false, true])('registration resume respects confirmed password status %s', async passwordSet => {
  await act(async () => tree.unmount());
  jest.mocked(getRegistrationCredential).mockResolvedValue({ token: 'registration-token', applicationId: 'app', email: 'test@gmail.com', passwordSet });
  await mount();
  if (passwordSet) expect(mockNavigation.replace).toHaveBeenCalledWith('DriverRegistrationScreen');
  else {
    expect(input('mobile-number')).toBeDefined();
    expect(button('step-continue').props.disabled).toBe(false);
    expect(mockNavigation.replace).not.toHaveBeenCalled();
  }
  expect(setRegistrationPassword).not.toHaveBeenCalled();
});

test('password submission waits for API; duplicate taps do not send twice', async () => {
  await enterCode(); await press('step-continue'); await press('step-continue');
  await change('create-password', 'Ravi@1234'); await change('confirm-password', 'Ravi@1234');
  jest.mocked(getRegistrationCredential).mockResolvedValue({ token: 'registration-token', applicationId: 'app', email: 'test@gmail.com' });
  let finish!: (value: { password_set: true }) => void;
  jest.mocked(setRegistrationPassword).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  await press('step-continue');
  expect(input('create-password').props.editable).toBe(false);
  await press('step-continue'); expect(setRegistrationPassword).toHaveBeenCalledTimes(1);
  await act(async () => finish({ password_set: true }));
  expect(tree.root.findByType(Checkbox)).toBeDefined();
});

test.each(['pending_review', 'activation_pending'] as const)('verification %s opens matching status and clears registration credential', async state => {
  jest.mocked(verifyEmailCode).mockResolvedValueOnce({ state, application_id: 'app' });
  await enterCode(); await press('step-continue');
  expect(clearRegistrationCredential).toHaveBeenCalledTimes(1);
  expect(mockNavigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'RegistrationStatusScreen', params: { state, email: 'test@gmail.com' } }] });
  expect(useRegistrationStore.getState().draft?.status).toBe(state);
});
test('active verification returns to password login rather than opening Home', async () => {
  jest.mocked(verifyEmailCode).mockResolvedValueOnce({ state: 'active', application_id: 'app' });
  await enterCode(); await press('step-continue');
  expect(input('login-password')).toBeDefined();
  expect(input('email').props.value).toBe('test@gmail.com');
  expect(mockNavigation.reset).not.toHaveBeenCalled();
  expect(saveDriverSession).not.toHaveBeenCalled();
});
test('wrong or expired email OTP preserves server message and returns to email entry', async () => {
  jest.mocked(verifyEmailCode).mockRejectedValueOnce(new DriverApiError(401, 'invalid_code', 'The code has expired.'));
  await enterCode(); await press('step-continue');
  expect(input('email')).toBeDefined(); expect(input('email-otp')).toBeUndefined();
  expect(JSON.stringify(tree.toJSON())).toContain('The code has expired.');
  expect(clearRegistrationCredential).toHaveBeenCalledTimes(1);
});
test('401 credential cleanup failure stays handled and offers the storage error at email entry', async () => {
  jest.mocked(verifyEmailCode).mockRejectedValueOnce(new DriverApiError(401, 'invalid_code', 'The code has expired.'));
  jest.mocked(clearRegistrationCredential).mockRejectedValueOnce(new Error('secure storage unavailable'));
  await enterCode(); await press('step-continue');
  expect(input('email')).toBeDefined();
  expect(JSON.stringify(tree.toJSON())).toContain(String(i18n.t('driverRegistration.storageFailed')));
  expect(button('entry-continue').props.loading).toBe(false);
  expect(mockNavigation.replace).not.toHaveBeenCalled();
  expect(mockNavigation.reset).not.toHaveBeenCalled();
});
test('rate limit disables requests for the Retry-After countdown', async () => {
  jest.mocked(sendEmailCode).mockRejectedValueOnce(new DriverApiError(429, 'rate_limited', 'Please wait.', 71));
  await register(); await press('entry-continue');
  expect(button('entry-continue').props.disabled).toBe(true);
  expect(JSON.stringify(tree.toJSON())).toContain('Please wait.');
  await press('entry-continue'); expect(sendEmailCode).toHaveBeenCalledTimes(1);
  await act(async () => jest.advanceTimersByTime(70_000));
  expect(button('entry-continue').props.disabled).toBe(true);
  await act(async () => jest.advanceTimersByTime(1000));
  expect(button('entry-continue').props.disabled).toBe(false);
});
test('login validates inputs and waits for secure save before Home navigation', async () => {
  await press('entry-continue'); expect(loginDriver).not.toHaveBeenCalled();
  let finishSave!: () => void;
  jest.mocked(saveDriverSession).mockImplementationOnce(() => new Promise(resolve => { finishSave = resolve; }));
  await change('email', 'test@gmail.com'); await change('login-password', 'example'); await press('entry-continue');
  expect(loginDriver).toHaveBeenCalledWith('test@gmail.com', 'example');
  expect(saveDriverSession).toHaveBeenCalledWith(loginResponse);
  expect(mockNavigation.reset).not.toHaveBeenCalled();
  expect(button('entry-continue').props.loading).toBe(true);
  await press('entry-continue'); expect(loginDriver).toHaveBeenCalledTimes(1);
  await act(async () => finishSave());
  expect(mockNavigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'MainStack' }] });
});
test('login storage failure does not open Home', async () => {
  jest.mocked(saveDriverSession).mockRejectedValueOnce(new Error('storage failure'));
  await change('email', 'test@gmail.com'); await change('login-password', 'example'); await press('entry-continue');
  expect(mockNavigation.reset).not.toHaveBeenCalled();
  expect(JSON.stringify(tree.toJSON())).toContain(String(i18n.t('driverRegistration.requestFailed')));
});
test('visible auth copy responds to Hindi and dark mode', async () => {
  await act(async () => { await i18n.changeLanguage('hi'); await useThemeStore.getState().setPreference('dark'); });
  expect(JSON.stringify(tree.toJSON())).toContain('रजिस्टर करें');
  expect(JSON.stringify(tree.toJSON())).toContain(useThemeStore.getState().themeColor.surface);
  await act(async () => { await i18n.changeLanguage('en'); await useThemeStore.getState().setPreference('light'); });
});
