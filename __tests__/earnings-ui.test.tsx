import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { Linking, StyleSheet, Text as NativeText } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import i18n from '@/localizations';
import AppBackground from '@/components/background/AppBackground';
import { BottomSheet, IconButton, Modal, RadioButton } from '@/components/ui';
import { DEMO_WALLET, EARNINGS_PERIODS } from '@/constants/earnings';
import EarningsScreen from '@/screens/main/tab/EarningsScreen';
import { resolveTheme, useThemeStore } from '@/store/themeStore';
import { useTextSizeStore } from '@/store/textSizeStore';
import { darkColors } from '@/utils/theme.utils';

let tree: Renderer.ReactTestRenderer;
const mount = async () => act(async () => {
  tree = Renderer.create(<SafeAreaProvider><EarningsScreen /></SafeAreaProvider>);
});
const action = (testID: string) => tree.root.findAll(node =>
  node.props.testID === testID && typeof node.props.onPress === 'function')[0];
const press = async (testID: string) => act(async () => action(testID).props.onPress());
const visibleCopy = () => tree.root.findAllByType(NativeText)
  .map(node => React.Children.toArray(node.props.children)
    .filter(child => typeof child === 'string' || typeof child === 'number').join('')).join('\n');
const total = () => tree.root.findAllByType(NativeText).find(node => node.props.testID === 'earnings-total')!;
const arrow = (name: 'previous' | 'next') => tree.root.findAllByType(IconButton)
  .find(node => node.props.testID === `earnings-${name}`)!;
const preview = () => tree.root.findAllByType(Modal).find(node => node.props.placement !== 'bottom')!;

beforeEach(async () => {
  jest.clearAllMocks();
  await i18n.changeLanguage('en');
  useThemeStore.setState(resolveTheme('light', 'light'));
  useTextSizeStore.setState({ size: 'default' });
});
afterEach(async () => {
  await act(async () => tree?.unmount());
  useTextSizeStore.setState({ size: 'default' });
  jest.restoreAllMocks();
});

test('opens All Earnings on the latest week with chart, trips and time online', async () => {
  await mount();
  expect(action('earnings-tab-all').props.accessibilityState.selected).toBe(true);
  expect(action('earnings-range-week').props.accessibilityState.selected).toBe(true);
  expect(total().props.children).toBe('$120');
  expect(action('earnings-choose-period').props.accessibilityValue.text).toBe('26 Oct - 01 Nov 2026');
  expect(tree.root.findAllByProps({ testID: 'earnings-chart' }).length).toBeGreaterThan(0);
  expect(visibleCopy()).toContain('05:20 hrs');
  expect(visibleCopy().split('\n')).toContain('5');
  expect(tree.root.findAllByProps({ accessibilityLabel: '26: $150' }).length).toBeGreaterThan(0);
  expect(arrow('next').props.disabled).toBe(true);
  expect(arrow('previous').props.disabled).toBe(false);
});

test('period arrows update amounts and remain bounded even if disabled callbacks are invoked', async () => {
  await mount();
  await press('earnings-next');
  expect(total().props.children).toBe('$120');
  await press('earnings-previous');
  expect(total().props.children).toBe('$95');
  expect(action('earnings-choose-period').props.accessibilityValue.text).toBe('19 Oct - 25 Oct 2026');
  await press('earnings-previous');
  expect(total().props.children).toBe('$70');
  expect(arrow('previous').props.disabled).toBe(true);
  await press('earnings-previous');
  expect(total().props.children).toBe('$70');
  await press('earnings-next'); await press('earnings-next');
  expect(total().props.children).toBe('$120');
  expect(arrow('next').props.disabled).toBe(true);
});

test('Day, Week and Month use their own date/chart data and reset to their latest period', async () => {
  await mount();
  await press('earnings-previous');
  await press('earnings-range-month');
  expect(total().props.children).toBe('$1240');
  expect(action('earnings-choose-period').props.accessibilityValue.text).toBe('Nov 2026');
  expect(visibleCopy()).toContain('42:20 hrs');
  expect(visibleCopy().split('\n')).toContain('42');
  expect(arrow('next').props.disabled).toBe(true);
  await press('earnings-previous');
  expect(total().props.children).toBe('$1215');
  await press('earnings-range-day');
  expect(total().props.children).toBe('$120');
  expect(action('earnings-choose-period').props.accessibilityValue.text).toBe('01 Nov 2026');
  expect(tree.root.findAllByProps({ accessibilityLabel: '06:00: $150' }).length).toBeGreaterThan(0);
  await press('earnings-range-week');
  expect(action('earnings-choose-period').props.accessibilityValue.text).toBe('26 Oct - 01 Nov 2026');
  expect(arrow('next').props.disabled).toBe(true);
});

test('period selection closes its sheet, survives Wallet tab and allows dismissal without changing selection', async () => {
  await mount();
  await press('earnings-choose-period');
  expect(tree.root.findByType(BottomSheet).props.visible).toBe(true);
  const choices = tree.root.findAllByType(RadioButton);
  expect(choices.map(node => node.props.label)).toEqual([
    '26 Oct - 01 Nov 2026', '19 Oct - 25 Oct 2026', '12 Oct - 18 Oct 2026',
  ]);
  await act(async () => choices[1].props.onValueChange());
  expect(tree.root.findByType(BottomSheet).props.visible).toBe(false);
  expect(total().props.children).toBe('$95');
  await press('earnings-tab-wallet');
  expect(tree.root.findAllByProps({ testID: 'earnings-wallet' }).length).toBeGreaterThan(0);
  expect(tree.root.findAllByProps({ testID: 'earnings-overview' })).toHaveLength(0);
  await press('earnings-tab-all');
  expect(total().props.children).toBe('$95');
  await press('earnings-choose-period');
  await act(async () => tree.root.findByType(BottomSheet).props.onClose());
  expect(total().props.children).toBe('$95');
});

test('wallet and rate-card actions show dismissible previews without payments, network or fixture mutation', async () => {
  const snapshot = JSON.stringify({ DEMO_WALLET, EARNINGS_PERIODS });
  const openURL = jest.spyOn(Linking, 'openURL');
  const request = jest.spyOn(global, 'fetch');
  await mount();
  await press('earnings-rate-card');
  expect(preview().props.title).toBe('View rate card');
  expect(preview().props.visible).toBe(true);
  await act(async () => preview().props.onClose());
  await press('earnings-tab-wallet');
  expect(visibleCopy()).toContain('$1000');
  expect(visibleCopy()).toContain('$450');
  for (const [id, title] of [
    ['walletBalance', 'Wallet balance'], ['cashLimit', 'Available cash limit'], ['deposit', 'Deposit'],
  ]) {
    await press(`earnings-${id}`);
    expect(preview().props.visible).toBe(true);
    expect(preview().props.title).toBe(title);
    expect(visibleCopy()).toContain(i18n.t('earnings.previewBody'));
    await act(async () => preview().props.onClose());
    expect(preview().props.visible).toBe(false);
  }
  expect(openURL).not.toHaveBeenCalled();
  expect(request).not.toHaveBeenCalled();
  expect(JSON.stringify({ DEMO_WALLET, EARNINGS_PERIODS })).toBe(snapshot);
});

test('Hindi, dark theme and enlarged text update live while keeping the selected period', async () => {
  await mount();
  await press('earnings-previous');
  const defaultSize = StyleSheet.flatten(total().props.style).fontSize;
  await act(async () => {
    await i18n.changeLanguage('hi');
    useThemeStore.setState(resolveTheme('dark', 'dark'));
    useTextSizeStore.setState({ size: 'extraLarge' });
  });
  expect(action('earnings-tab-all').props.accessibilityLabel).toBe(i18n.t('earnings.all'));
  expect(action('earnings-range-week').props.accessibilityState.selected).toBe(true);
  expect(visibleCopy()).toContain(i18n.t('earnings.timeOnline'));
  expect(visibleCopy()).not.toContain('earnings.timeOnline');
  expect(total().props.children).toBe(i18n.t('earnings.amount', { value: 95 }));
  expect(StyleSheet.flatten(total().props.style).fontSize).toBeGreaterThan(defaultSize!);
  expect(tree.root.findByType(AppBackground).props.backgroundColor).toBe(darkColors.surface);
});
