import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  ACCESSIBLE,
  ACCESS_CONTROL,
  AUTHENTICATION_TYPE,
  getGenericPassword,
  getSupportedBiometryType,
  resetGenericPassword,
  setGenericPassword,
  type AuthenticationPrompt,
} from 'react-native-keychain';
import type { BIOMETRY_TYPE } from 'react-native-keychain';
import { logger } from '@/utils/logger';

export const BIOMETRIC_APP_LOCK_PREFERENCE = 'BIOMETRIC_APP_LOCK_ENABLED';

const KEYCHAIN_SERVICE = 'com.bharattalk.biometric-app-lock';
const SENTINEL_USERNAME = 'bharattalk-app-lock';
const SENTINEL_VALUE = 'biometric-app-lock-v2';
const LEGACY_SENTINEL_VALUE = 'biometric-app-lock-v1';

export type BiometricFailure =
  | 'cancelled'
  | 'unavailable'
  | 'credentialMissing'
  | 'credentialInvalid'
  | 'sessionInvalid'
  | 'failed'
  | 'storage';

export type BiometricResult =
  | { success: true }
  | { success: false; reason: BiometricFailure };

export async function getBiometricAppLockType(): Promise<BIOMETRY_TYPE | null> {
  try {
    return await getSupportedBiometryType();
  } catch {
    return null;
  }
}

function classifyFailure(error: unknown): BiometricFailure {
  const nativeError = error as { code?: unknown; message?: unknown };
  const description = `${String(nativeError?.code ?? '')} ${String(
    nativeError?.message ?? '',
  )}`.toLowerCase();
  if (description.includes('cancel') || description.includes('usercancel')) {
    return 'cancelled';
  }
  if (
    description.includes('not found') ||
    description.includes('no credentials') ||
    description.includes('e_keychain_not_found')
  ) {
    return 'credentialMissing';
  }
  return 'failed';
}

export async function readBiometricAppLockPreference(): Promise<boolean> {
  const value = await AsyncStorage.getItem(BIOMETRIC_APP_LOCK_PREFERENCE);
  return value === 'true' || value === JSON.stringify(true);
}

function keychainPrompt(prompt: AuthenticationPrompt) {
  return {
    service: KEYCHAIN_SERVICE,
    accessControl: ACCESS_CONTROL.BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE,
    authenticationType: AUTHENTICATION_TYPE.DEVICE_PASSCODE_OR_BIOMETRICS,
    authenticationPrompt: prompt,
  };
}

function saveAppLockCredential(prompt: AuthenticationPrompt) {
  return setGenericPassword(SENTINEL_USERNAME, SENTINEL_VALUE, {
    ...keychainPrompt(prompt),
    accessible: ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function authenticateBiometricAppLock(
  prompt: AuthenticationPrompt,
): Promise<BiometricResult> {
  try {
    let credential = await getGenericPassword(keychainPrompt(prompt));
    if (!credential) {
      const saved = await saveAppLockCredential(prompt);
      if (!saved) {
        return { success: false, reason: 'credentialMissing' };
      }
      if (Platform.OS === 'android') {
        // Android protects the write with the same native biometric/device-credential prompt.
        return { success: true };
      }
      credential = await getGenericPassword(keychainPrompt(prompt));
    }
    if (!credential || credential.username !== SENTINEL_USERNAME) {
      return { success: false, reason: 'credentialInvalid' };
    }
    if (credential.password === LEGACY_SENTINEL_VALUE) {
      if (Platform.OS === 'ios') {
        try {
          await saveAppLockCredential(prompt);
        } catch {
          logger.warn('app_lock.credential_migration_failed', {
            scope: 'security',
          });
        }
      }
      return { success: true };
    }
    if (credential.password !== SENTINEL_VALUE) {
      return { success: false, reason: 'credentialInvalid' };
    }
    return { success: true };
  } catch (error) {
    return { success: false, reason: classifyFailure(error) };
  }
}

export async function enableBiometricAppLock(
  prompt: AuthenticationPrompt,
): Promise<BiometricResult> {
  try {
    const biometryType = await getSupportedBiometryType();
    if (!biometryType) {
      return { success: false, reason: 'unavailable' };
    }
    const saved = await saveAppLockCredential(prompt);
    if (!saved) {
      return { success: false, reason: 'failed' };
    }

    const verification = await authenticateBiometricAppLock(prompt);
    if (!verification.success) {
      await resetGenericPassword({ service: KEYCHAIN_SERVICE });
      return verification;
    }

    try {
      await AsyncStorage.setItem(BIOMETRIC_APP_LOCK_PREFERENCE, 'true');
    } catch {
      await resetGenericPassword({ service: KEYCHAIN_SERVICE });
      return { success: false, reason: 'storage' };
    }
    logger.info('app_lock.enabled', { scope: 'security' });
    return { success: true };
  } catch (error) {
    try {
      await resetGenericPassword({ service: KEYCHAIN_SERVICE });
    } catch {
      // Leave the preference disabled; a partial credential cannot unlock the app.
    }
    return { success: false, reason: classifyFailure(error) };
  }
}

export async function disableBiometricAppLock(): Promise<BiometricResult> {
  try {
    await resetGenericPassword({ service: KEYCHAIN_SERVICE });
    await AsyncStorage.setItem(BIOMETRIC_APP_LOCK_PREFERENCE, 'false');
    logger.info('app_lock.disabled', { scope: 'security' });
    return { success: true };
  } catch {
    logger.warn('app_lock.disable_failed', { scope: 'security' });
    return { success: false, reason: 'storage' };
  }
}

export async function clearBiometricAppLockCredential(): Promise<void> {
  await resetGenericPassword({ service: KEYCHAIN_SERVICE });
}
