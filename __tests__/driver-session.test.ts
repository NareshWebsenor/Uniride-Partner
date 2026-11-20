import AsyncStorage from '@react-native-async-storage/async-storage';
import { ACCESSIBLE, getGenericPassword, resetGenericPassword, setGenericPassword } from 'react-native-keychain';
import { saveDriverSession, restoreDriverSession, getDriverSessionToken, clearDriverSession,
  saveRegistrationCredential, getRegistrationCredential, clearRegistrationCredential } from '@/service/driverSession';
import { useAuthStore } from '@/store/authStore';
import { readStartupDestination } from '@/service/startup';
import type { DriverLoginResponse } from '@/interface/driverRegistration.type';

jest.mock('@/service/config', () => ({ DRIVER_API_URL: 'https://driver.example/v1', DRIVER_WORKSPACE: 'uniride' }));
const mockVault = new Map<string, { username: string; password: string }>();
jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'device-only' },
  setGenericPassword: jest.fn(async (username, password, options) => {
    mockVault.set(options.service, { username, password }); return { service: options.service, storage: 'keychain' };
  }),
  getGenericPassword: jest.fn(async options => {
    const value = mockVault.get(options.service);
    return value ? { ...value, service: options.service, storage: 'keychain' } : false;
  }),
  resetGenericPassword: jest.fn(async options => { mockVault.delete(options.service); return true; }),
}));
const response: DriverLoginResponse = { session: 'secure-jwt', token_type: 'Bearer', expires_in: 43200,
  user: { id: 'user', driver_id: 'driver', email: 'driver@example.com', name: 'Driver', actor_type: 'driver', permissions: [], mfa_required: false } };
beforeEach(async () => { jest.clearAllMocks(); mockVault.clear(); await AsyncStorage.clear(); useAuthStore.getState().resetUser(); });
afterEach(() => jest.useRealTimers());
it('saves login only to device-bound Keychain and migrates legacy plain-text secrets', async () => {
  await AsyncStorage.multiSet([['auth-storage', '{"token":"legacy"}'], ['ACCESS_TOKEN', 'legacy'], ['REFRESH_TOKEN', 'old'], ['LANGUAGE', 'hi']]);
  await saveDriverSession(response);
  expect(setGenericPassword).toHaveBeenCalledWith('uniride-driver', expect.stringContaining('secure-jwt'), expect.objectContaining({ accessible: ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY }));
  expect(await AsyncStorage.getItem('ACCESS_TOKEN')).toBeNull();
  expect(await AsyncStorage.getItem('auth-storage')).toBeNull();
  expect(await AsyncStorage.getItem('LANGUAGE')).toBe('hi');
  expect(await getDriverSessionToken()).toBe('secure-jwt');
  expect(useAuthStore.getState().driverUser?.actor_type).toBe('driver');
});
it('restores a session on restart and opens Home only while valid', async () => {
  await saveDriverSession(response); useAuthStore.getState().resetUser();
  expect(await readStartupDestination()).toEqual({ name: 'MainStack' });
  jest.useFakeTimers().setSystemTime(Date.now() + 43201 * 1000);
  expect(await readStartupDestination()).toEqual({ name: 'LoginScreen' });
  expect(useAuthStore.getState().token).toBeNull();
  expect(mockVault.size).toBe(0);
});
it('registration token never authenticates driver APIs and uses a separate service', async () => {
  const credential = { token: 'registration-only', applicationId: 'application', email: 'driver@example.com' };
  await saveRegistrationCredential(credential);
  expect(await getRegistrationCredential()).toEqual(credential);
  expect(await getDriverSessionToken()).toBeNull();
  await saveDriverSession(response);
  expect(mockVault.size).toBe(2);
  await clearRegistrationCredential();
  expect(await getDriverSessionToken()).toBe('secure-jwt');
  expect(mockVault.size).toBe(1);
});
it('retains only a password-set marker with the registration credential', async () => {
  await saveRegistrationCredential({ token: 'registration', applicationId: 'app', email: 'driver@example.com', passwordSet: true });
  expect(await getRegistrationCredential()).toEqual({ token: 'registration', applicationId: 'app', email: 'driver@example.com', passwordSet: true });
});
it('deletes consumed/expired registration credentials', async () => {
  await saveRegistrationCredential({ token: 'registration', applicationId: 'app', email: 'driver@example.com', expiresAt: '2000-01-01T00:00:00Z' });
  expect(await getRegistrationCredential()).toBeNull();
  expect(mockVault.size).toBe(0);
});
it('logout clears secure session and immediately locks memory', async () => {
  await saveDriverSession(response);
  const pending = clearDriverSession();
  expect(useAuthStore.getState().token).toBeNull();
  await pending;
  expect(mockVault.size).toBe(0);
  expect(await restoreDriverSession()).toBe(false);
});
it('native storage save failure never creates an authenticated memory session', async () => {
  jest.mocked(setGenericPassword).mockResolvedValueOnce(false);
  await expect(saveDriverSession(response)).rejects.toThrow('secure_storage_unavailable');
  expect(useAuthStore.getState().token).toBeNull();
});
it('corrupt or MFA-required secure credentials cannot open Home', async () => {
  await saveDriverSession(response);
  const service = [...mockVault.keys()][0];
  mockVault.set(service, { username: 'uniride-driver', password: '{corrupt' });
  expect(await restoreDriverSession()).toBe(false);
  await expect(saveDriverSession({ ...response, user: { ...response.user, mfa_required: true } })).rejects.toThrow('invalid_session');
});
it('propagates secure-storage read failure for startup retry rather than silently logging out', async () => {
  jest.mocked(getGenericPassword).mockRejectedValueOnce(new Error('storage unavailable'));
  await expect(restoreDriverSession()).rejects.toThrow('storage unavailable');
  expect(resetGenericPassword).not.toHaveBeenCalled();
});
it('native logout deletion failure locks memory and prevents restoring the surviving credential', async () => {
  await saveDriverSession(response);
  jest.mocked(resetGenericPassword).mockRejectedValueOnce(new Error('native delete failed'));
  await expect(clearDriverSession()).rejects.toThrow('native delete failed');
  expect(useAuthStore.getState().token).toBeNull();
  expect(mockVault.size).toBe(1);
  // A subsequent startup still refuses this credential even if cleanup keeps failing.
  jest.mocked(resetGenericPassword).mockRejectedValueOnce(new Error('native delete failed'));
  expect(await readStartupDestination()).toEqual({ name: 'LoginScreen' });
  expect(mockVault.size).toBe(1);
  expect(await getDriverSessionToken()).toBeNull();
});
it('a fresh successful login clears the logout marker only after securely writing its session', async () => {
  await saveDriverSession(response); await clearDriverSession();
  expect(await restoreDriverSession()).toBe(false);
  await saveDriverSession({ ...response, session: 'new-session' });
  useAuthStore.getState().resetUser();
  expect(await restoreDriverSession()).toBe(true);
  expect(await getDriverSessionToken()).toBe('new-session');
});
it('failed fresh login keeps the logout marker and cannot revive an older credential', async () => {
  await saveDriverSession(response); await clearDriverSession();
  jest.mocked(setGenericPassword).mockResolvedValueOnce(false);
  await expect(saveDriverSession(response)).rejects.toThrow('secure_storage_unavailable');
  expect(await restoreDriverSession()).toBe(false);
});
it('still deletes native session when logout metadata cannot be written', async () => {
  await saveDriverSession(response);
  jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('metadata unavailable'));
  await clearDriverSession();
  expect(mockVault.size).toBe(0);
  expect(await restoreDriverSession()).toBe(false);
});
