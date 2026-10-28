import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import {
  initializeTheme,
  readThemePreference,
  resolveTheme,
  useThemeStore,
} from '@/store/themeStore';
import { darkColors, lightColors } from '@/theme/colors';
import { createNavigationTheme } from '@/theme/navigationTheme';

beforeEach(() => {
  jest.clearAllMocks();
  useThemeStore.setState({
    preference: 'system',
    ...resolveTheme('system', 'light'),
    persistenceError: false,
  });
});

test('hydrates the saved preference once before rendering the application', async () => {
  jest.mocked(AsyncStorage.getItem).mockResolvedValueOnce(
    JSON.stringify({ state: { preference: 'dark' }, version: 1 }),
  );
  await Promise.all([initializeTheme(), initializeTheme()]);
  expect(AsyncStorage.getItem).toHaveBeenCalledTimes(1);
  expect(useThemeStore.getState()).toMatchObject({
    preference: 'dark',
    hasHydrated: true,
    resolvedTheme: 'dark',
  });
});

test('explicit light selection survives OS switching to dark', async () => {
  await useThemeStore.getState().setPreference('light');
  useThemeStore.getState().setSystemTheme('dark');
  expect(useThemeStore.getState().themeColor).toBe(lightColors);
});

test('system mode responds to OS changes without persisting the resolved palette', async () => {
  await useThemeStore.getState().setPreference('system');
  useThemeStore.getState().setSystemTheme('dark');
  expect(useThemeStore.getState().themeColor).toBe(darkColors);
  useThemeStore.getState().setSystemTheme('light');
  expect(useThemeStore.getState().themeColor).toBe(lightColors);
  const lastCall = jest.mocked(AsyncStorage.setItem).mock.calls.at(-1);
  expect(JSON.parse(lastCall![1])).toEqual({
    state: { preference: 'system' },
    version: 1,
  });
});

test('rapid preference changes persist the newest choice last', async () => {
  await Promise.all([
    useThemeStore.getState().setPreference('dark'),
    useThemeStore.getState().setPreference('light'),
    useThemeStore.getState().setPreference('system'),
  ]);
  const calls = jest.mocked(AsyncStorage.setItem).mock.calls;
  expect(calls.map(([, value]) => JSON.parse(value).state.preference)).toEqual([
    'dark', 'light', 'system',
  ]);
});

test('a storage failure is recoverable and does not break the next write', async () => {
  jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('disk'));
  await useThemeStore.getState().setPreference('dark');
  expect(useThemeStore.getState().persistenceError).toBe(true);
  await useThemeStore.getState().setPreference('light');
  expect(useThemeStore.getState().persistenceError).toBe(false);
});

test('an older failed write cannot mark a newer saved selection as failed', async () => {
  jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('disk'));
  await Promise.all([
    useThemeStore.getState().setPreference('dark'),
    useThemeStore.getState().setPreference('light'),
  ]);
  expect(useThemeStore.getState()).toMatchObject({
    preference: 'light',
    persistenceError: false,
  });
});

test('stored legacy choices migrate and invalid data safely defaults to system', () => {
  expect(readThemePreference({ state: { isDarkTheme: true } })).toBe('dark');
  expect(readThemePreference({ state: { isDarkTheme: false } })).toBe('light');
  for (const value of [null, {}, { state: null }, { state: { preference: 'blue' } }]) {
    expect(readThemePreference(value)).toBe('system');
  }
});

test('new system selection uses current OS scheme', async () => {
  const spy = jest.spyOn(Appearance, 'getColorScheme').mockReturnValue('dark');
  await useThemeStore.getState().setPreference('system');
  expect(useThemeStore.getState().resolvedTheme).toBe('dark');
  spy.mockRestore();
});

test('both palettes share their token contract and navigation reflects colors', () => {
  expect(Object.keys(darkColors)).toEqual(Object.keys(lightColors));
  expect(darkColors.background).not.toEqual(lightColors.background);
  expect(createNavigationTheme('dark', darkColors)).toMatchObject({
    dark: true,
    colors: { background: darkColors.background, text: darkColors.textPrimary },
  });
});
