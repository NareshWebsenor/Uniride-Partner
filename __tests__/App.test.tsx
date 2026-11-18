/**
 * @format
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import App from '../App';
import { authenticateBiometricAppLock } from '@/service/biometricAppLock';
import { useTextSizeStore } from '@/store/textSizeStore';

jest.mock('@/service/biometricAppLock', () => ({
  authenticateBiometricAppLock: jest.fn(),
}));

jest.mock('@/navigations/Application', () => {
  const React = require('react');
  const { View: NativeView } = require('react-native');
  return () => React.createElement(NativeView, { testID: 'application' });
});
jest.mock('react-native-popup-menu', () => ({
  MenuProvider: ({ children }: { children: React.ReactNode }) => children,
}));

test('mounts navigation only after stored preferences are restored', async () => {
  await AsyncStorage.setItem('BIOMETRIC_APP_LOCK_ENABLED', 'true');
  let finishRead: (value: string | null) => void = () => {};
  const read = jest.mocked(AsyncStorage.getItem).getMockImplementation()!;
  jest.mocked(AsyncStorage.getItem).mockImplementation(key =>
    key === 'text-size-preference'
      ? new Promise(resolve => { finishRead = resolve; })
      : read(key),
  );
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    tree = ReactTestRenderer.create(<App />);
  });
  expect(tree.root.findAllByProps({ testID: 'application' })).toHaveLength(0);
  await act(async () => {
    finishRead(JSON.stringify({ version: 1, size: 'large' }));
  });
  expect(tree.root.findAllByType(View).length).toBeGreaterThan(0);
  expect(
    tree.root.findAllByProps({ testID: 'application' }).length,
  ).toBeGreaterThan(0);
  expect(authenticateBiometricAppLock).not.toHaveBeenCalled();
  expect(useTextSizeStore.getState().size).toBe('large');
  expect(await AsyncStorage.getItem('BIOMETRIC_APP_LOCK_ENABLED')).toBe('true');
  await act(async () => {
    tree.unmount();
  });
});
