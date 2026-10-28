import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  authenticateBiometricAppLock,
  BIOMETRIC_APP_LOCK_PREFERENCE,
  enableBiometricAppLock,
  getBiometricAppLockType,
} from '@/service/biometricAppLock';
import {
  ACCESSIBLE,
  ACCESS_CONTROL,
  AUTHENTICATION_TYPE,
  getGenericPassword,
  getSupportedBiometryType,
  resetGenericPassword,
  setGenericPassword,
} from 'react-native-keychain';

jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'device-only' },
  ACCESS_CONTROL: { BIOMETRY_CURRENT_SET: 'current-set' },
  AUTHENTICATION_TYPE: { BIOMETRICS: 'biometrics' },
  getGenericPassword: jest.fn(),
  getSupportedBiometryType: jest.fn(),
  resetGenericPassword: jest.fn(),
  setGenericPassword: jest.fn(),
}));

const prompt = {
  title: 'Unlock',
  subtitle: 'Authenticate',
  cancel: 'Cancel',
};

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  jest.mocked(getSupportedBiometryType).mockResolvedValue('Fingerprint' as never);
  jest.mocked(setGenericPassword).mockResolvedValue({
    service: 'service',
    storage: 'keychain' as never,
  });
  jest.mocked(resetGenericPassword).mockResolvedValue(true);
});

test('enables only after reading the device-only biometric sentinel', async () => {
  jest.mocked(getGenericPassword).mockResolvedValue({
    username: 'bharattalk-app-lock',
    password: 'biometric-app-lock-v1',
    service: 'service',
    storage: 'keychain' as never,
  });

  await expect(enableBiometricAppLock(prompt)).resolves.toEqual({
    success: true,
  });

  expect(setGenericPassword).toHaveBeenCalledWith(
    'bharattalk-app-lock',
    'biometric-app-lock-v1',
    expect.objectContaining({
      accessControl: ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
      accessible: ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    }),
  );
  expect(getGenericPassword).toHaveBeenCalledWith(
    expect.objectContaining({
      accessControl: ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
      authenticationType: AUTHENTICATION_TYPE.BIOMETRICS,
    }),
  );
  await expect(
    AsyncStorage.getItem(BIOMETRIC_APP_LOCK_PREFERENCE),
  ).resolves.toBe('true');
});

test('leaves app lock disabled when biometric confirmation is cancelled', async () => {
  jest.mocked(getGenericPassword).mockRejectedValue({
    code: 'USER_CANCEL',
    message: 'User cancelled the biometric prompt',
  });

  await expect(enableBiometricAppLock(prompt)).resolves.toEqual({
    success: false,
    reason: 'cancelled',
  });

  await expect(
    AsyncStorage.getItem(BIOMETRIC_APP_LOCK_PREFERENCE),
  ).resolves.toBeNull();
  expect(resetGenericPassword).toHaveBeenCalled();
});

test('does not unlock when the protected sentinel is missing', async () => {
  jest.mocked(getGenericPassword).mockResolvedValue(false);

  await expect(authenticateBiometricAppLock(prompt)).resolves.toEqual({
    success: false,
    reason: 'credentialMissing',
  });
});

test('reports Face ID when the device supports it', async () => {
  jest.mocked(getSupportedBiometryType).mockResolvedValue('FaceID' as never);

  await expect(getBiometricAppLockType()).resolves.toBe('FaceID');
});
