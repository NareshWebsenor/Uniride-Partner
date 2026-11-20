import React from 'react';
import '@/localizations';
import Renderer, { act } from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ASYNC_KEYS } from '@/constants/storage';
import { readStartupDestination } from '@/service/startup';
import { restoreDriverSession } from '@/service/driverSession';
import SplashScreen from '@/screens/splash/SplashScreen';
import HomeScreen from '@/screens/main/tab/HomeScreen';
import { Button } from '@/components/ui';

jest.mock('@/service/driverSession', () => ({ restoreDriverSession: jest.fn() }));
jest.mock('@/service/config', () => ({ GOOGLE_API_KEY: '', GOOGLE_ROUTES_KEY: '' }));

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
  useIsFocused: () => true,
}));

beforeEach(async () => {
  jest.clearAllMocks();
  jest.mocked(restoreDriverSession).mockResolvedValue(false);
  await AsyncStorage.clear();
});

test.each([null, 'old-session', '{corrupt'])(
  'startup never trusts legacy plaintext session %s without a secure driver session',
  async token => {
    if (token !== null) {
      await AsyncStorage.multiSet([
        [ASYNC_KEYS.ACCESS_TOKEN, token],
        [ASYNC_KEYS.ACCESS_TOKEN_EXPIRES_AT, '1'],
        [ASYNC_KEYS.IS_KYC_COMPLETED, 'false'],
      ]);
    }
    expect(await readStartupDestination()).toEqual({ name: 'LoginScreen' });
    expect(restoreDriverSession).toHaveBeenCalledTimes(1);
  },
);

test('splash waits for secure startup restoration before opening login', async () => {
  jest.useFakeTimers();
  const reset = jest.fn();
  let tree!: Renderer.ReactTestRenderer;
  await act(async () => {
    tree = Renderer.create(
      <SafeAreaProvider>
        <SplashScreen navigation={{ reset }} />
      </SafeAreaProvider>,
    );
  });
  expect(
    tree.root.findAllByProps({ testID: 'splash-screen' }).length,
  ).toBeGreaterThan(0);
  expect(reset).not.toHaveBeenCalled();
  await act(async () => {
    jest.advanceTimersByTime(700);
  });
  expect(reset).toHaveBeenCalledWith({
    index: 0,
    routes: [{ name: 'LoginScreen' }],
  });
  await act(async () => {
    tree.unmount();
  });
  jest.useRealTimers();
});

test('Home opens offline with its availability action; preferences remain in Menu', async () => {
  let tree!: Renderer.ReactTestRenderer;
  await act(async () => {
    tree = Renderer.create(
      <SafeAreaProvider>
        <HomeScreen />
      </SafeAreaProvider>,
    );
  });
  expect(tree.root.findAllByType(Button).some(button => button.props.title === 'Go Online')).toBe(true);
  expect(tree.root.findAllByProps({ accessibilityRole: 'header' })
    .some(header => header.props.children === 'You’re offline')).toBe(true);
  await act(async () => {
    tree.unmount();
  });
});


test('startup restores a valid driver session into Home', async () => {
  jest.mocked(restoreDriverSession).mockResolvedValueOnce(true);
  expect(await readStartupDestination()).toEqual({ name: 'MainStack' });
});

test('startup propagates secure read failure so Splash can offer retry', async () => {
  jest.mocked(restoreDriverSession).mockRejectedValueOnce(new Error('storage failure'));
  await expect(readStartupDestination()).rejects.toThrow('storage failure');
});
