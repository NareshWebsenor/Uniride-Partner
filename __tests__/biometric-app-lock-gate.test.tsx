import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { AppState, BackHandler, View } from 'react-native';
import { BiometricAppLockGate } from '@/components/auth/BiometricAppLockGate';
import { hasActiveCustomerSession } from '@/service/startup';
import {
  authenticateBiometricAppLock,
  readBiometricAppLockPreference,
} from '@/service/biometricAppLock';

const flushPromises = async () => {
  for (let index = 0; index < 8; index += 1) {
    await Promise.resolve();
  }
};

jest.mock('@/navigations/Application', () => {
  const ReactModule = require('react');
  const { View: NativeView } = require('react-native');
  return () => ReactModule.createElement(NativeView, { testID: 'application' });
});
jest.mock('@/screens/splash/SplashScreen', () => {
  const ReactModule = require('react');
  const { View: NativeView } = require('react-native');
  return {
    SplashContent: () =>
      ReactModule.createElement(NativeView, { testID: 'splash' }),
  };
});
jest.mock('@/components/auth/BiometricLockScreen', () => {
  const ReactModule = require('react');
  const { View: NativeView } = require('react-native');
  return {
    BiometricLockScreen: (props: Record<string, unknown>) =>
      ReactModule.createElement(NativeView, { testID: 'lock', ...props }),
  };
});
jest.mock('@/service/startup', () => ({
  hasActiveCustomerSession: jest.fn(),
}));
jest.mock('@/service/biometricAppLock', () => ({
  authenticateBiometricAppLock: jest.fn(),
  readBiometricAppLockPreference: jest.fn(),
}));
jest.mock('@/utils/helper.utils', () => ({ onLogout: jest.fn() }));
jest.mock('@/hooks/useAppTranslation', () => ({
  useAppTranslation: () => ({ t: (key: string) => key }),
}));

let appStateListener: ((state: string) => void) | undefined;
const lockViews = (tree: ReactTestRenderer.ReactTestRenderer) =>
  tree.root
    .findAllByType(View)
    .filter(node => node.props.testID === 'lock');
const applicationViews = (tree: ReactTestRenderer.ReactTestRenderer) =>
  tree.root
    .findAllByType(View)
    .filter(node => node.props.testID === 'application');

beforeEach(() => {
  jest.clearAllMocks();
  appStateListener = undefined;
  jest.spyOn(AppState, 'addEventListener').mockImplementation((event, listener) => {
    if (event === 'change') {
      appStateListener = listener as (state: string) => void;
    }
    return { remove: jest.fn() };
  });
  jest.spyOn(BackHandler, 'addEventListener').mockReturnValue({
    remove: jest.fn(),
  } as never);
  jest.mocked(readBiometricAppLockPreference).mockResolvedValue(true);
  jest.mocked(hasActiveCustomerSession).mockResolvedValue(true);
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('queues a foreground event until the pending biometric prompt finishes', async () => {
  let resolveFirstPrompt: ((value: { success: boolean }) => void) | undefined;
  jest.mocked(authenticateBiometricAppLock).mockImplementationOnce(
    () =>
      new Promise(resolve => {
        resolveFirstPrompt = resolve;
      }) as never,
  );
  jest.mocked(authenticateBiometricAppLock).mockResolvedValue({
    success: true,
  } as never);

  let tree!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    tree = ReactTestRenderer.create(<BiometricAppLockGate />);
    await flushPromises();
  });
  expect(authenticateBiometricAppLock).toHaveBeenCalledTimes(1);
  expect(lockViews(tree)).toHaveLength(1);

  await act(async () => {
    appStateListener?.('background');
    appStateListener?.('active');
    appStateListener?.('active');
    await flushPromises();
  });
  expect(authenticateBiometricAppLock).toHaveBeenCalledTimes(1);

  await act(async () => {
    resolveFirstPrompt?.({ success: true });
    await flushPromises();
  });
  expect(authenticateBiometricAppLock).toHaveBeenCalledTimes(2);
  expect(lockViews(tree)).toHaveLength(0);
  expect(applicationViews(tree)).toHaveLength(1);

  await act(async () => tree.unmount());
});

test('cancellation keeps the lock visible and retry starts one new request', async () => {
  jest
    .mocked(authenticateBiometricAppLock)
    .mockResolvedValueOnce({ success: false, reason: 'cancelled' })
    .mockResolvedValueOnce({ success: true } as never);

  let tree!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    tree = ReactTestRenderer.create(<BiometricAppLockGate />);
    await flushPromises();
  });
  expect(lockViews(tree)).toHaveLength(1);
  expect(authenticateBiometricAppLock).toHaveBeenCalledTimes(1);

  await act(async () => {
    lockViews(tree)[0].props.onRetry();
    await flushPromises();
  });
  expect(authenticateBiometricAppLock).toHaveBeenCalledTimes(2);
  expect(lockViews(tree)).toHaveLength(0);
  await act(async () => tree.unmount());
});
