import AsyncStorage from '@react-native-async-storage/async-storage';
import { ACCESSIBLE, getGenericPassword, resetGenericPassword, setGenericPassword } from 'react-native-keychain';
import { DRIVER_API_URL, DRIVER_WORKSPACE } from '@/service/config';
import { ASYNC_KEYS } from '@/constants/storage';
import { useAuthStore } from '@/store/authStore';
import type { DriverLoginResponse, RegistrationCredential } from '@/interface/driverRegistration.type';
import { logger } from '@/utils/logger';

const SCOPE = `${DRIVER_WORKSPACE}.${encodeURIComponent(DRIVER_API_URL)}`;
const SESSION_SERVICE = `com.uniride.partner.driver-session.${SCOPE}`;
const REGISTRATION_SERVICE = `com.uniride.partner.registration.${SCOPE}`;
// Non-secret revocation marker survives a failed native credential deletion.
const LOGOUT_MARKER = `driver-session-logged-out:${SCOPE}`;
const USERNAME = 'uniride-driver';
let sessionGeneration = 0;
let sessionQueue: Promise<unknown> = Promise.resolve();
let registrationQueue: Promise<unknown> = Promise.resolve();

function serialSession<T>(operation: () => Promise<T>): Promise<T> {
  const next = sessionQueue.then(operation, operation);
  sessionQueue = next.catch(() => undefined);
  return next;
}
function serialRegistration<T>(operation: () => Promise<T>): Promise<T> {
  const next = registrationQueue.then(operation, operation);
  registrationQueue = next.catch(() => undefined);
  return next;
}
function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function nonempty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
export function isDriverUser(value: unknown): value is DriverLoginResponse['user'] {
  return record(value) && nonempty(value.id) && nonempty(value.driver_id) &&
    nonempty(value.email) && typeof value.name === 'string' && value.actor_type === 'driver' &&
    Array.isArray(value.permissions) && value.permissions.every(item => typeof item === 'string') &&
    typeof value.mfa_required === 'boolean';
}
async function removeLegacySecrets() {
  await AsyncStorage.multiRemove([
    'auth-storage', ASYNC_KEYS.ACCESS_TOKEN, ASYNC_KEYS.ACCESS_TOKEN_EXPIRES_AT,
    ASYNC_KEYS.REFRESH_TOKEN, ASYNC_KEYS.IS_LOGGEDIN,
  ]);
}
async function save(service: string, value: unknown) {
  const saved = await setGenericPassword(USERNAME, JSON.stringify(value), {
    service, accessible: ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  if (!saved) throw new Error('secure_storage_unavailable');
}
async function read(service: string): Promise<unknown> {
  const saved = await getGenericPassword({ service });
  if (!saved) return null;
  if (saved.username !== USERNAME) return null;
  try { return JSON.parse(saved.password); } catch { return null; }
}

export function saveRegistrationCredential(value: RegistrationCredential): Promise<void> {
  return serialRegistration(() => save(REGISTRATION_SERVICE, value));
}
export function clearRegistrationCredential(): Promise<void> {
  return serialRegistration(async () => { await resetGenericPassword({ service: REGISTRATION_SERVICE }); });
}
export function getRegistrationCredential(): Promise<RegistrationCredential | null> {
  return serialRegistration(async () => {
    const value = await read(REGISTRATION_SERVICE);
    if (!record(value) || !nonempty(value.token) || typeof value.applicationId !== 'string' || !nonempty(value.email) ||
      (value.expiresAt !== undefined && (typeof value.expiresAt !== 'string' ||
        !Number.isFinite(Date.parse(value.expiresAt)) || Date.parse(value.expiresAt) <= Date.now()))) {
      await resetGenericPassword({ service: REGISTRATION_SERVICE });
      return null;
    }
    const driveMode = value.driveMode === 'fleet_partner' || value.driveMode === 'own_vehicle' ? value.driveMode : undefined;
    return {
      token: value.token,
      applicationId: value.applicationId,
      email: value.email,
      ...(typeof value.phoneRequired === 'boolean' ? { phoneRequired: value.phoneRequired } : {}),
      ...(typeof value.phoneVerified === 'boolean' ? { phoneVerified: value.phoneVerified } : {}),
      ...(nonempty(value.phone) ? { phone: value.phone } : {}),
      ...(value.passwordSet === true ? { passwordSet: true } : {}),
      ...(driveMode ? { driveMode } : {}),
      ...(value.driveModeSet === true ? { driveModeSet: true } : {}),
      ...(typeof value.invitationCodeRequired === 'boolean' ? { invitationCodeRequired: value.invitationCodeRequired } : {}),
      ...(typeof value.invitationCodeAccepted === 'boolean' ? { invitationCodeAccepted: value.invitationCodeAccepted } : {}),
      ...(typeof value.expiresAt === 'string' ? { expiresAt: value.expiresAt } : {}),
    };
  });
}

export function saveDriverSession(response: DriverLoginResponse): Promise<void> {
  const generation = sessionGeneration;
  return serialSession(async () => {
    const expiresAt = Date.now() + response.expires_in * 1000;
    if (!nonempty(response.session) || !isDriverUser(response.user) || response.user.mfa_required ||
      !Number.isFinite(expiresAt) || response.expires_in <= 0) throw new Error('invalid_session');
    await removeLegacySecrets();
    await save(SESSION_SERVICE, { session: response.session, expiresAt, user: response.user });
    if (generation !== sessionGeneration) return;
    await AsyncStorage.removeItem(LOGOUT_MARKER);
    if (generation !== sessionGeneration) return;
    useAuthStore.setState({ token: response.session, sessionExpiresAt: expiresAt,
      driverUser: response.user, refreshToken: null,
      user: { id: response.user.id, email: response.user.email, displayName: response.user.name } });
  });
}
export function clearDriverSession(): Promise<void> {
  sessionGeneration += 1;
  // Lock UI immediately, even if native deletion fails. The caller reports storage failure.
  useAuthStore.getState().resetUser();
  return serialSession(async () => {
    try {
      await AsyncStorage.setItem(LOGOUT_MARKER, 'true');
    } catch {
      // Still attempt Keychain deletion if the non-secret metadata store fails.
      logger.warn('driver_session.logout_marker_failed', { scope: 'auth' });
    }
    await resetGenericPassword({ service: SESSION_SERVICE });
    await removeLegacySecrets();
    useAuthStore.getState().resetUser();
  });
}
export function restoreDriverSession(): Promise<boolean> {
  const generation = sessionGeneration;
  return serialSession(async () => {
    await removeLegacySecrets();
    if (await AsyncStorage.getItem(LOGOUT_MARKER) === 'true') {
      useAuthStore.getState().resetUser();
      try { await resetGenericPassword({ service: SESSION_SERVICE }); }
      catch { logger.warn('driver_session.revoked_credential_cleanup_failed', { scope: 'auth' }); }
      return false;
    }
    const value = await read(SESSION_SERVICE);
    if (generation !== sessionGeneration) return false;
    if (!record(value) || !nonempty(value.session) || typeof value.expiresAt !== 'number' ||
      !Number.isFinite(value.expiresAt) || value.expiresAt <= Date.now() ||
      !isDriverUser(value.user) || value.user.mfa_required) {
      useAuthStore.getState().resetUser();
      await resetGenericPassword({ service: SESSION_SERVICE });
      return false;
    }
    useAuthStore.setState({ token: value.session, sessionExpiresAt: value.expiresAt,
      driverUser: value.user, refreshToken: null,
      user: { id: value.user.id, email: value.user.email, displayName: value.user.name } });
    return true;
  });
}
export async function getDriverSessionToken(): Promise<string | null> {
  const { token, sessionExpiresAt } = useAuthStore.getState();
  if (token && sessionExpiresAt && sessionExpiresAt > Date.now()) return token;
  if (token) await clearDriverSession();
  return null;
}
