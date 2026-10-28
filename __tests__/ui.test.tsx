import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { Pressable, StyleSheet, Text as NativeText } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Button, Text, ToastProvider, useToast } from '@/components/ui';
import SettingsScreen from '@/screens/settings/SettingsScreen';
import i18n from '@/localizations';
import { initializeLanguage, useLanguageStore } from '@/store/languageStore';
import { resolveTheme, useThemeStore } from '@/store/themeStore';
import { darkColors, lightColors } from '@/theme/colors';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
}));

const wrap = (children: React.ReactNode) => (
  <SafeAreaProvider>
    <ToastProvider>{children}</ToastProvider>
  </SafeAreaProvider>
);

beforeEach(async () => {
  await initializeLanguage();
  await useLanguageStore.getState().changeLanguage('en');
  useThemeStore.setState({
    preference: 'light',
    ...resolveTheme('light'),
    persistenceError: false,
  });
});

test('rendered text responds to theme changes without remounting', async () => {
  let tree!: Renderer.ReactTestRenderer;
  await act(async () => {
    tree = Renderer.create(<Text>{i18n.t('settings.title')}</Text>);
  });
  expect(StyleSheet.flatten(tree.root.findByType(NativeText).props.style).color)
    .toBe(lightColors.textPrimary);
  await act(async () => {
    await useThemeStore.getState().setPreference('dark');
  });
  expect(StyleSheet.flatten(tree.root.findByType(NativeText).props.style).color)
    .toBe(darkColors.textPrimary);
  await act(async () => { tree.unmount(); });
});

test('loading button exposes busy state and blocks presses', async () => {
  const press = jest.fn();
  let tree!: Renderer.ReactTestRenderer;
  await act(async () => {
    tree = Renderer.create(
      <Button title={i18n.t('ui.confirm')} loading onPress={press} />,
    );
  });
  const button = tree.root.findByType(Pressable);
  expect(button.props.disabled).toBe(true);
  expect(button.props.accessibilityState).toMatchObject({ busy: true, disabled: true });
  await act(async () => { tree.unmount(); });
});

test('settings can switch Hindi and Dark through the actual controls', async () => {
  let tree!: Renderer.ReactTestRenderer;
  await act(async () => {
    tree = Renderer.create(wrap(<SettingsScreen />));
  });
  const option = (label: string) => tree.root.findAllByType(Pressable).find(
    node => node.props.accessibilityRole === 'radio'
      && node.props.accessibilityLabel === label,
  );
  await act(async () => {
    option(i18n.t('settings.dark'))!.props.onPress();
    option(i18n.t('language.hi'))!.props.onPress();
    await useLanguageStore.getState().changeLanguage('hi');
  });
  expect(useThemeStore.getState().resolvedTheme).toBe('dark');
  expect(tree.root.findAllByType(NativeText).some(
    node => node.props.children === i18n.t('settings.title', { lng: 'hi' }),
  )).toBe(true);
  await act(async () => { tree.unmount(); });
});

test('a visible toast responds to language changes and can be dismissed', async () => {
  function Trigger() {
    const toast = useToast();
    return (
      <Button
        title={i18n.t('ui.confirm')}
        onPress={() => toast.show({ key: 'settings.toastMessage' })}
      />
    );
  }
  let tree!: Renderer.ReactTestRenderer;
  await act(async () => {
    tree = Renderer.create(wrap(<Trigger />));
  });
  await act(async () => {
    tree.root.findByType(Button).props.onPress();
    await useLanguageStore.getState().changeLanguage('hi');
  });
  expect(tree.root.findAllByType(NativeText).some(
    node => node.props.children === i18n.t('settings.toastMessage', { lng: 'hi' }),
  )).toBe(true);
  await act(async () => {
    tree.root.findAllByType(Pressable).find(
      node => node.props.accessibilityLabel === i18n.t('ui.dismiss'),
    )!.props.onPress();
  });
  expect(tree.root.findAllByProps({ accessibilityRole: 'alert' })).toHaveLength(0);
  await act(async () => { tree.unmount(); });
});
