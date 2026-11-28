import React from 'react';
import '@/localizations';
import Renderer, { act } from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Application from '@/navigations/Application';
import { restoreDriverSession } from '@/service/driverSession';
import { useAuthStore } from '@/store/authStore';
import { resolveTheme, useThemeStore } from '@/store/themeStore';
import { navigationRef } from '@/utils/navigation.utils';

jest.mock('@react-native-firebase/messaging', () => jest.fn());
jest.mock('@/utils/notification.utils', () => ({
  stopNotificationSound: jest.fn(),
}));
jest.mock('react-native-image-crop-picker', () => ({
  openCamera: jest.fn(),
  openPicker: jest.fn(),
}));
jest.mock('@/service/driverSession', () => ({
  clearDriverSession: jest.fn().mockResolvedValue(undefined),
  getRegistrationCredential: jest.fn().mockResolvedValue(null),
  restoreDriverSession: jest.fn().mockResolvedValue(false),
}));
jest.mock('@/service/config', () => ({
  DRIVER_API_URL: 'https://driver.example.test/v1',
  DRIVER_WORKSPACE: 'uniride',
  GOOGLE_API_KEY: '',
  GOOGLE_ROUTES_KEY: '',
}));

const flushPromises = async () => {
  for (let index = 0; index < 8; index += 1) {
    await Promise.resolve();
  }
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  useThemeStore.setState(resolveTheme('light', 'light'));
  useAuthStore.getState().resetUser();
  jest.mocked(restoreDriverSession).mockResolvedValue(false);
});

afterEach(() => {
  jest.useRealTimers();
});

test('Application starts at SplashScreen and transitions to LoginScreen when logged out', async () => {
  const onRouteChange = jest.fn();
  let tree!: Renderer.ReactTestRenderer;

  await act(async () => {
    tree = Renderer.create(
      <SafeAreaProvider>
        <Application onRouteChange={onRouteChange} />
      </SafeAreaProvider>,
    );
    await flushPromises();
  });

  expect(onRouteChange).toHaveBeenLastCalledWith('SplashScreen');
  expect(
    tree.root.findAllByProps({ testID: 'splash-screen' }).length,
  ).toBeGreaterThan(0);

  await act(async () => {
    jest.advanceTimersByTime(700);
    await flushPromises();
  });

  expect(onRouteChange).toHaveBeenLastCalledWith('LoginScreen');
  expect(
    tree.root.findAllByProps({ testID: 'auth-entry' }).length,
  ).toBeGreaterThan(0);
  expect(
    tree.root.findAllByProps({ testID: 'login-tab' }).length,
  ).toBeGreaterThan(0);
  expect(
    tree.root.findAllByProps({ testID: 'register-tab' }).length,
  ).toBeGreaterThan(0);

  await act(async () => {
    navigationRef.resetRoot({
      index: 0,
      routes: [{ name: 'MainStack' }],
    });
    await flushPromises();
  });

  expect(navigationRef.getCurrentRoute()?.name).toBe('LoginScreen');

  await act(async () => {
    tree.unmount();
  });
});

test('Application transitions from SplashScreen to MainStack when a valid session restores', async () => {
  jest.mocked(restoreDriverSession).mockImplementationOnce(async () => {
    useAuthStore.setState({
      token: 'driver-session-token',
      sessionExpiresAt: Date.now() + 60_000,
    });
    return true;
  });
  const onRouteChange = jest.fn();
  let tree!: Renderer.ReactTestRenderer;

  await act(async () => {
    tree = Renderer.create(
      <SafeAreaProvider>
        <Application onRouteChange={onRouteChange} />
      </SafeAreaProvider>,
    );
    await flushPromises();
  });

  expect(onRouteChange).toHaveBeenLastCalledWith('SplashScreen');

  await act(async () => {
    jest.advanceTimersByTime(700);
    await flushPromises();
  });

  expect(onRouteChange).toHaveBeenLastCalledWith('MainStack');
  expect(
    tree.root.findAllByProps({ testID: 'home-screen' }).length,
  ).toBeGreaterThan(0);

  await act(async () => {
    tree.unmount();
  });
});
