import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onLogout } from '@/utils/helper.utils';
import { clearTokens } from '@/service/rest';
import { navigateAndSimpleReset } from '@/utils/navigation.utils';
import { useAuthStore } from '@/store/authStore';
import { ASYNC_KEYS } from '@/constants/storage';

jest.mock('@/utils/navigation.utils', () => ({
  navigateAndSimpleReset: jest.fn(),
}));
jest.mock('@/utils/notification.utils', () => ({
  stopNotificationSound: jest.fn(),
}));
jest.mock('@react-native-firebase/messaging', () => jest.fn());
jest.mock('@/service/rest', () => ({
  clearTokens: jest.fn(),
  client: { defaults: { headers: { common: {} } } },
}));
jest.mock('@/store/authStore', () => {
  const resetUser = jest.fn();
  return { useAuthStore: { getState: () => ({ resetUser }) } };
});

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  jest
    .mocked(clearTokens)
    .mockImplementation(() => AsyncStorage.removeItem(ASYNC_KEYS.ACCESS_TOKEN));
});

test('logout removes the session, keeps onboarding/language/theme and returns to the starter Home', async () => {
  await AsyncStorage.multiSet([
    [ASYNC_KEYS.ACCESS_TOKEN, 'test-session'],
    [ASYNC_KEYS.IS_LANDING_COMPLETED, 'true'],
    [ASYNC_KEYS.LANGUAGE, '"hi"'],
    ['theme-storage', '{"state":{"preference":"dark"},"version":1}'],
  ]);
  await onLogout();
  expect(await AsyncStorage.getItem(ASYNC_KEYS.ACCESS_TOKEN)).toBeNull();
  expect(await AsyncStorage.getItem(ASYNC_KEYS.IS_LANDING_COMPLETED)).toBe(
    'true',
  );
  expect(await AsyncStorage.getItem(ASYNC_KEYS.LANGUAGE)).toBe('"hi"');
  expect(await AsyncStorage.getItem('theme-storage')).toContain('dark');
  expect(useAuthStore.getState().resetUser).toHaveBeenCalledTimes(1);
  expect(navigateAndSimpleReset).toHaveBeenCalledWith('MainStack');
});

test('logout cannot navigate before session cleanup finishes', async () => {
  let finish: () => void = () => {};
  jest.mocked(clearTokens).mockImplementationOnce(
    () =>
      new Promise(resolve => {
        finish = resolve;
      }),
  );
  const request = onLogout();
  expect(navigateAndSimpleReset).not.toHaveBeenCalled();
  finish();
  await request;
  expect(navigateAndSimpleReset).toHaveBeenCalledTimes(1);
});

test('failed logout is recoverable and does not claim the session was removed', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  jest
    .mocked(clearTokens)
    .mockRejectedValueOnce(new Error('storage unavailable'));
  await onLogout();
  expect(navigateAndSimpleReset).not.toHaveBeenCalled();
  expect(useAuthStore.getState().resetUser).not.toHaveBeenCalled();
  expect(alert).toHaveBeenCalledTimes(1);
  alert.mockRestore();
});
