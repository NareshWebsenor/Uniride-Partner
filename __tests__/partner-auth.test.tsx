import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import i18n from '@/localizations';
import LoginScreen from '@/screens/auth/LoginScreen';
import { Button, TextInput } from '@/components/ui';
import type { TRootStack } from '@/interface/navigation.type';
import type { DriverLoginResponse } from '@/interface/driverRegistration.type';
import { isValidEmail, maskEmail, passwordRules } from '@/utils/authPreview';
import { useThemeStore } from '@/store/themeStore';
import {
  loginDriver,
  sendEmailCode,
  setRegistrationPassword,
  setRegistrationPhone,
  verifyEmailCode,
  verifyRegistrationPhone,
} from '@/service/rest/auth';
import {
  clearRegistrationCredential,
  getRegistrationCredential,
  saveDriverSession,
  saveRegistrationCredential,
} from '@/service/driverSession';
import { DriverApiError } from '@/service/rest/driverClient';
import { clearRegistrationDraft, useRegistrationStore } from '@/store/registrationStore';
import { clearRegistrationEntry } from '@/service/registrationEntry';

const mockNavigation = { reset: jest.fn(), replace: jest.fn() };
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => mockNavigation,
}));
jest.mock('@/service/rest/auth', () => ({
  setRegistrationPassword: jest.fn(),
  setRegistrationPhone: jest.fn(),
  verifyRegistrationPhone: jest.fn(),
  sendEmailCode: jest.fn(),
  verifyEmailCode: jest.fn(),
  loginDriver: jest.fn(),
}));
jest.mock('@/service/driverSession', () => ({
  clearRegistrationCredential: jest.fn(),
  getRegistrationCredential: jest.fn(),
  saveDriverSession: jest.fn(),
  saveRegistrationCredential: jest.fn(),
}));

type Navigation = NativeStackScreenProps<TRootStack, 'LoginScreen'>['navigation'];
const loginResponse: DriverLoginResponse = {
  session: 'session',
  token_type: 'Bearer',
  expires_in: 43200,
  user: {
    id: 'user',
    driver_id: 'driver',
    email: 'test@gmail.com',
    name: 'Test',
    actor_type: 'driver',
    permissions: [],
    mfa_required: false,
  },
};

let tree: Renderer.ReactTestRenderer;
const input = (id: string) =>
  tree.root.findAllByType(TextInput).find(node => node.props.testID === id)!;
const button = (id: string) =>
  tree.root.findAllByType(Button).find(node => node.props.testID === id)!;
const change = async (id: string, value: string) =>
  act(async () => input(id).props.onChangeText(value));
const press = async (id: string) =>
  act(async () => button(id).props.onPress());
const register = async () => {
  await act(async () =>
    tree.root.findAllByProps({ testID: 'register-tab' })[0].props.onPress(),
  );
  await change('email', 'test@gmail.com');
};
const enterCode = async (code = '1234') => {
  await register();
  await press('entry-continue');
  await change('email-otp', code);
};
const mount = async () =>
  act(async () => {
    tree = Renderer.create(
      <SafeAreaProvider>
        <LoginScreen
          navigation={mockNavigation as unknown as Navigation}
          route={{ key: 'auth', name: 'LoginScreen' }}
        />
      </SafeAreaProvider>,
    );
  });

beforeEach(async () => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(1_800_000_000_000);
  jest.mocked(getRegistrationCredential).mockResolvedValue(null);
  jest.mocked(clearRegistrationCredential).mockResolvedValue(undefined);
  jest.mocked(saveRegistrationCredential).mockResolvedValue(undefined);
  jest.mocked(saveDriverSession).mockResolvedValue(undefined);
  jest.mocked(sendEmailCode).mockResolvedValue({
    message: 'Sent',
    expires_in: 600,
    email_sent: true,
  });
  jest.mocked(verifyEmailCode).mockResolvedValue({
    state: 'invited',
    application_id: 'app',
    token: 'registration-token',
    phone_required: true,
    phone_verified: false,
    reason: null,
  });
  jest.mocked(loginDriver).mockResolvedValue(loginResponse);
  jest.mocked(setRegistrationPassword).mockResolvedValue({ password_set: true });
  jest.mocked(setRegistrationPhone).mockResolvedValue({ phone: '+919876543210' });
  jest.mocked(verifyRegistrationPhone).mockResolvedValue({
    phone: '+919876543210',
    phone_verified: true,
  });
  await clearRegistrationDraft();
  await clearRegistrationEntry();
  await i18n.changeLanguage('en');
  await mount();
});

afterEach(async () => {
  await act(async () => tree?.unmount());
  jest.useRealTimers();
});

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

test('register sends email-only payload, hides names/Google/forgot and gates 4-digit OTP', async () => {
  const loginText = JSON.stringify(tree.toJSON());
  expect(loginText).not.toContain(String(i18n.t('partnerAuth.google')));
  expect(loginText).not.toContain(String(i18n.t('partnerAuth.forgot')));
  await register();
  expect(input('first-name')).toBeUndefined();
  expect(input('last-name')).toBeUndefined();
  expect(input('login-password')).toBeUndefined();
  await change('email', 'invalid');
  await press('entry-continue');
  expect(sendEmailCode).not.toHaveBeenCalled();
  expect(input('email').props.error).toBeTruthy();
  await change('email', ' TEST@gmail.com ');
  await press('entry-continue');
  expect(sendEmailCode).toHaveBeenCalledWith({ email: 'test@gmail.com' });
  expect(JSON.stringify(tree.toJSON())).toContain('t**t@gmail.com');
  expect(input('email-otp').props.value).toBe('');
  expect(input('email-otp').props.maxLength).toBe(4);
  await change('email-otp', '123');
  expect(button('step-continue').props.disabled).toBe(true);
  await press('step-continue');
  expect(verifyEmailCode).not.toHaveBeenCalled();
  await change('email-otp', '1234');
  expect(button('step-continue').props.disabled).toBe(false);
  expect(input('mobile-number')).toBeUndefined();
  expect(input('create-password')).toBeUndefined();
});

test('dev OTP prefills 4-digit code but verification still needs explicit continue', async () => {
  jest.mocked(sendEmailCode).mockResolvedValueOnce({
    message: 'Sent',
    expires_in: 600,
    email_sent: true,
    development_code: '4829',
  });
  await register();
  await press('entry-continue');
  expect(input('email-otp').props.value).toBe('4829');
  expect(verifyEmailCode).not.toHaveBeenCalled();
  await press('step-continue');
  expect(verifyEmailCode).toHaveBeenCalledWith('test@gmail.com', '4829');
});

test('production ignores dev OTP even if a response contains it', async () => {
  const previous = Reflect.get(global, '__DEV__');
  Reflect.set(global, '__DEV__', false);
  try {
    jest.mocked(sendEmailCode).mockResolvedValueOnce({
      message: 'Sent',
      expires_in: 600,
      email_sent: true,
      development_code: '4829',
    });
    await register();
    await press('entry-continue');
    expect(input('email-otp').props.value).toBe('');
    expect(button('step-continue').props.disabled).toBe(true);
  } finally {
    Reflect.set(global, '__DEV__', previous);
  }
});

test('resend waits 60 seconds and replaces the previous development code', async () => {
  jest.mocked(sendEmailCode)
    .mockResolvedValueOnce({
      message: 'Sent',
      expires_in: 600,
      email_sent: true,
      development_code: '1234',
    })
    .mockResolvedValueOnce({
      message: 'Sent again',
      expires_in: 600,
      email_sent: true,
      development_code: '6543',
    });
  await register();
  await press('entry-continue');
  expect(button('resend').props.disabled).toBe(true);
  await press('resend');
  expect(sendEmailCode).toHaveBeenCalledTimes(1);
  await act(async () => jest.advanceTimersByTime(60_000));
  expect(button('resend').props.disabled).toBe(false);
  await press('resend');
  expect(input('email-otp').props.value).toBe('6543');
  expect(button('resend').props.disabled).toBe(true);
});

test.each(['invited', 'changes_requested'] as const)(
  'verification %s with phone_required: true opens mobile -> 4-digit phone OTP -> password -> DriverRegistrationScreen',
  async state => {
    jest.mocked(verifyEmailCode).mockResolvedValueOnce({
      state,
      application_id: 'app',
      token: 'registration-token',
      phone_required: true,
      phone_verified: false,
      reason: 'Fix licence',
    });
    await enterCode();
    await press('step-continue');
    expect(saveRegistrationCredential).toHaveBeenCalledWith({
      applicationId: 'app',
      token: 'registration-token',
      email: 'test@gmail.com',
      phoneRequired: true,
      phoneVerified: false,
    });
    expect(input('mobile-number')).toBeDefined();
    expect(button('step-continue').props.disabled).toBe(true);

    jest.mocked(getRegistrationCredential).mockResolvedValue({
      token: 'registration-token',
      applicationId: 'app',
      email: 'test@gmail.com',
      phoneRequired: true,
      phoneVerified: false,
    });
    jest.mocked(setRegistrationPhone).mockResolvedValueOnce({
      phone: '+919876543210',
      development_code: '4321',
    });
    await change('mobile-number', '9876543210');
    expect(button('step-continue').props.disabled).toBe(false);
    await press('step-continue');
    expect(setRegistrationPhone).toHaveBeenCalledWith(
      'registration-token',
      '+919876543210',
    );
    expect(input('phone-otp')).toBeDefined();
    expect(input('phone-otp').props.value).toBe('4321');
    expect(input('phone-otp').props.maxLength).toBe(4);

    await press('step-continue');
    expect(verifyRegistrationPhone).toHaveBeenCalledWith(
      'registration-token',
      '4321',
    );
    expect(saveRegistrationCredential).toHaveBeenCalledWith(
      expect.objectContaining({ phone: '+919876543210', phoneVerified: true }),
    );
    expect(input('create-password')).toBeDefined();

    await change('create-password', 'Ravi@1234');
    await change('confirm-password', 'Ravi@1234');
    await press('step-continue');
    expect(setRegistrationPassword).toHaveBeenCalledWith(
      'registration-token',
      'Ravi@1234',
    );
    expect(saveRegistrationCredential).toHaveBeenLastCalledWith(
      expect.objectContaining({ passwordSet: true }),
    );
    expect(mockNavigation.replace).toHaveBeenCalledWith(
      'DriverRegistrationScreen',
    );

    const entries = await AsyncStorage.multiGet(await AsyncStorage.getAllKeys());
    expect(JSON.stringify(entries)).not.toMatch(
      /Ravi@1234|registration-token|9876543210/,
    );
    expect(loginDriver).not.toHaveBeenCalled();
    expect(saveDriverSession).not.toHaveBeenCalled();
  },
);

test('phone_required: false skips both phone screens directly to password', async () => {
  jest.mocked(verifyEmailCode).mockResolvedValueOnce({
    state: 'invited',
    application_id: 'app',
    token: 'registration-token',
    phone_required: false,
    phone_verified: false,
    reason: null,
  });
  await enterCode();
  await press('step-continue');
  expect(input('mobile-number')).toBeUndefined();
  expect(input('phone-otp')).toBeUndefined();
  expect(input('create-password')).toBeDefined();
});

test('phone submission waits for success, disables editing and blocks duplicate taps', async () => {
  await enterCode();
  await press('step-continue');
  await change('mobile-number', '9812345678');
  jest.mocked(getRegistrationCredential).mockResolvedValue({
    token: 'registration-token',
    applicationId: 'app',
    email: 'test@gmail.com',
    phoneRequired: true,
    phoneVerified: false,
  });
  let finish!: (value: { phone: string }) => void;
  jest.mocked(setRegistrationPhone).mockImplementationOnce(
    () =>
      new Promise(resolve => {
        finish = resolve;
      }),
  );
  await press('step-continue');
  expect(input('mobile-number').props.editable).toBe(false);
  expect(input('phone-otp')).toBeUndefined();
  expect(button('step-continue').props.loading).toBe(true);
  await press('step-continue');
  expect(setRegistrationPhone).toHaveBeenCalledTimes(1);
  await act(async () => finish({ phone: '+919812345678' }));
  expect(input('phone-otp')).toBeDefined();
});

test('phone validation failure preserves the number and allows retry', async () => {
  await enterCode();
  await press('step-continue');
  await change('mobile-number', '9812345678');
  jest.mocked(getRegistrationCredential).mockResolvedValue({
    token: 'registration-token',
    applicationId: 'app',
    email: 'test@gmail.com',
    phoneRequired: true,
    phoneVerified: false,
  });
  jest
    .mocked(setRegistrationPhone)
    .mockRejectedValueOnce(
      new DriverApiError(400, 'validation_failed', 'Invalid phone number.'),
    );
  await press('step-continue');
  expect(input('mobile-number').props.value).toBe('9812345678');
  expect(input('mobile-number').props.editable).toBe(true);
  expect(JSON.stringify(tree.toJSON())).toContain('Invalid phone number.');
  await press('step-continue');
  expect(input('phone-otp')).toBeDefined();
});

test('phone cannot save without the matching registration credential', async () => {
  await enterCode();
  await press('step-continue');
  await change('mobile-number', '9812345678');
  await press('step-continue');
  expect(setRegistrationPhone).not.toHaveBeenCalled();
  expect(clearRegistrationCredential).toHaveBeenCalledTimes(1);
  expect(input('email')).toBeDefined();
});

test('password API failure stays on password step and retry succeeds', async () => {
  jest.mocked(verifyEmailCode).mockResolvedValueOnce({
    state: 'invited',
    application_id: 'app',
    token: 'registration-token',
    phone_required: false,
    phone_verified: true,
    reason: null,
  });
  await enterCode();
  await press('step-continue');
  await change('create-password', 'Ravi@1234');
  await change('confirm-password', 'Ravi@1234');
  jest.mocked(getRegistrationCredential).mockResolvedValue({
    token: 'registration-token',
    applicationId: 'app',
    email: 'test@gmail.com',
  });
  jest
    .mocked(setRegistrationPassword)
    .mockRejectedValueOnce(
      new DriverApiError(400, 'validation_failed', 'Choose a stronger password.'),
    );
  await press('step-continue');
  expect(input('create-password')).toBeDefined();
  expect(JSON.stringify(tree.toJSON())).toContain('Choose a stronger password.');
  expect(saveRegistrationCredential).not.toHaveBeenCalledWith(
    expect.objectContaining({ passwordSet: true }),
  );
  await press('step-continue');
  expect(mockNavigation.replace).toHaveBeenCalledWith(
    'DriverRegistrationScreen',
  );
});

test.each([
  { phoneRequired: true, phoneVerified: false, passwordSet: false, expected: 'mobile' },
  { phoneRequired: false, phoneVerified: false, passwordSet: false, expected: 'password' },
  { phoneRequired: false, phoneVerified: false, passwordSet: true, expected: 'DriverRegistrationScreen' },
])('registration resume routes cleanly for %o', async state => {
  await act(async () => tree.unmount());
  jest.mocked(getRegistrationCredential).mockResolvedValue({
    token: 'registration-token',
    applicationId: 'app',
    email: 'test@gmail.com',
    phoneRequired: state.phoneRequired,
    phoneVerified: state.phoneVerified,
    passwordSet: state.passwordSet,
  });
  await mount();
  if (state.expected === 'DriverRegistrationScreen') {
    expect(mockNavigation.replace).toHaveBeenCalledWith(
      'DriverRegistrationScreen',
    );
  } else if (state.expected === 'mobile') {
    expect(input('mobile-number')).toBeDefined();
  } else {
    expect(input('create-password')).toBeDefined();
  }
  expect(setRegistrationPassword).not.toHaveBeenCalled();
});

test.each(['pending_review', 'activation_pending'] as const)(
  'verification %s opens matching status and clears registration credential',
  async state => {
    jest.mocked(verifyEmailCode).mockResolvedValueOnce({
      state,
      application_id: 'app',
    });
    await enterCode();
    await press('step-continue');
    expect(clearRegistrationCredential).toHaveBeenCalledTimes(1);
    expect(mockNavigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [
        {
          name: 'RegistrationStatusScreen',
          params: { state, email: 'test@gmail.com' },
        },
      ],
    });
    expect(useRegistrationStore.getState().draft?.status).toBe(state);
  },
);

test('active verification returns to password login rather than opening Home', async () => {
  jest.mocked(verifyEmailCode).mockResolvedValueOnce({
    state: 'active',
    application_id: 'app',
  });
  await enterCode();
  await press('step-continue');
  expect(input('login-password')).toBeDefined();
  expect(input('email').props.value).toBe('test@gmail.com');
  expect(mockNavigation.reset).not.toHaveBeenCalled();
  expect(saveDriverSession).not.toHaveBeenCalled();
});

test('wrong or expired email OTP preserves server message and returns to email entry', async () => {
  jest
    .mocked(verifyEmailCode)
    .mockRejectedValueOnce(
      new DriverApiError(401, 'invalid_code', 'The code has expired.'),
    );
  await enterCode();
  await press('step-continue');
  expect(input('email')).toBeDefined();
  expect(input('email-otp')).toBeUndefined();
  expect(JSON.stringify(tree.toJSON())).toContain('The code has expired.');
  expect(clearRegistrationCredential).toHaveBeenCalledTimes(1);
});

test('401 credential cleanup failure stays handled and offers the storage error at email entry', async () => {
  jest
    .mocked(verifyEmailCode)
    .mockRejectedValueOnce(
      new DriverApiError(401, 'invalid_code', 'The code has expired.'),
    );
  jest
    .mocked(clearRegistrationCredential)
    .mockRejectedValueOnce(new Error('secure storage unavailable'));
  await enterCode();
  await press('step-continue');
  expect(input('email')).toBeDefined();
  expect(JSON.stringify(tree.toJSON())).toContain(
    String(i18n.t('driverRegistration.storageFailed')),
  );
  expect(button('entry-continue').props.loading).toBe(false);
  expect(mockNavigation.replace).not.toHaveBeenCalled();
  expect(mockNavigation.reset).not.toHaveBeenCalled();
});

test('rate limit disables requests for the Retry-After countdown', async () => {
  jest
    .mocked(sendEmailCode)
    .mockRejectedValueOnce(
      new DriverApiError(429, 'rate_limited', 'Please wait.', 71),
    );
  await register();
  await press('entry-continue');
  expect(button('entry-continue').props.disabled).toBe(true);
  expect(JSON.stringify(tree.toJSON())).toContain('Please wait.');
  await press('entry-continue');
  expect(sendEmailCode).toHaveBeenCalledTimes(1);
  await act(async () => jest.advanceTimersByTime(70_000));
  expect(button('entry-continue').props.disabled).toBe(true);
  await act(async () => jest.advanceTimersByTime(1000));
  expect(button('entry-continue').props.disabled).toBe(false);
});

test('login validates inputs and waits for secure save before Home navigation', async () => {
  await press('entry-continue');
  expect(loginDriver).not.toHaveBeenCalled();
  let finishSave!: () => void;
  jest.mocked(saveDriverSession).mockImplementationOnce(
    () =>
      new Promise(resolve => {
        finishSave = resolve;
      }),
  );
  await change('email', 'test@gmail.com');
  await change('login-password', 'example');
  await press('entry-continue');
  expect(loginDriver).toHaveBeenCalledWith('test@gmail.com', 'example');
  expect(saveDriverSession).toHaveBeenCalledWith(loginResponse);
  expect(mockNavigation.reset).not.toHaveBeenCalled();
  expect(button('entry-continue').props.loading).toBe(true);
  await press('entry-continue');
  expect(loginDriver).toHaveBeenCalledTimes(1);
  await act(async () => finishSave());
  expect(mockNavigation.reset).toHaveBeenCalledWith({
    index: 0,
    routes: [{ name: 'MainStack' }],
  });
});

test('login storage failure does not open Home', async () => {
  jest
    .mocked(saveDriverSession)
    .mockRejectedValueOnce(new Error('storage failure'));
  await change('email', 'test@gmail.com');
  await change('login-password', 'example');
  await press('entry-continue');
  expect(mockNavigation.reset).not.toHaveBeenCalled();
  expect(JSON.stringify(tree.toJSON())).toContain(
    String(i18n.t('driverRegistration.requestFailed')),
  );
});

test('visible auth copy responds to Hindi and dark mode', async () => {
  await act(async () => {
    await i18n.changeLanguage('hi');
    await useThemeStore.getState().setPreference('dark');
  });
  expect(JSON.stringify(tree.toJSON())).toContain('रजिस्टर करें');
  expect(JSON.stringify(tree.toJSON())).toContain(
    useThemeStore.getState().themeColor.surface,
  );
  await act(async () => {
    await i18n.changeLanguage('en');
    await useThemeStore.getState().setPreference('light');
  });
});
