import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { Linking, Text as NativeText } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import i18n from '@/localizations';
import AppBackground from '@/components/background/AppBackground';
import { Button, IconButton, Modal } from '@/components/ui';
import { DEMO_TRIPS } from '@/constants/trips';
import type { TRootStack } from '@/interface/navigation.type';
import TripsScreen from '@/screens/main/tab/TripsScreen';
import TripDetailsScreen from '@/screens/main/trips/TripDetailsScreen';
import { resolveTheme, useThemeStore } from '@/store/themeStore';
import { darkColors } from '@/utils/theme.utils';

const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() };
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => mockNavigation,
}));
type Navigation = NativeStackScreenProps<TRootStack, 'TripDetailsScreen'>['navigation'];
let tree: Renderer.ReactTestRenderer;
const mount = async (screen: React.ReactNode) => act(async () => {
  tree = Renderer.create(<SafeAreaProvider>{screen}</SafeAreaProvider>);
});
const detail = (tripId: string) => <TripDetailsScreen
  route={{ key: tripId, name: 'TripDetailsScreen', params: { tripId } }}
  navigation={mockNavigation as unknown as Navigation} />;
const press = async (testID: string) => act(async () => {
  tree.root.findAll(node => node.props.testID === testID && typeof node.props.onPress === 'function')[0].props.onPress();
});
const renderedTripIds = () => Array.from(new Set(tree.root.findAll(node =>
  typeof node.props.testID === 'string' && node.props.testID.startsWith('view-'),
).map(node => node.props.testID)));
const visibleCopy = () => tree.root.findAllByType(NativeText)
  .map(node => React.Children.toArray(node.props.children)
    .filter(child => typeof child === 'string' || typeof child === 'number').join('')).join('\n');

beforeEach(async () => {
  jest.clearAllMocks();
  await i18n.changeLanguage('en');
  useThemeStore.setState(resolveTheme('light', 'light'));
});
afterEach(async () => {
  await act(async () => tree?.unmount());
  jest.restoreAllMocks();
});

test('tabs show only matching trips and each View trip passes the selected ID', async () => {
  await mount(<TripsScreen />);
  const groups = [
    { tab: 'completed', ids: ['TRP-051126-01', 'TRP-051126-02'] },
    { tab: 'upcoming', ids: ['TRP-051126-03', 'TRP-051126-04'] },
    { tab: 'incomplete', ids: ['TRP-051126-05', 'TRP-051126-06'] },
  ];
  for (const { tab, ids } of groups) {
    await press(`trips-tab-${tab}`);
    expect(renderedTripIds()).toEqual(ids.map(id => `view-${id}`));
    const selected = tree.root.findAllByProps({ testID: `trips-tab-${tab}` })[0];
    expect(selected.props.accessibilityState.selected).toBe(true);
    for (const tripId of ids) {
      await press(`view-${tripId}`);
      expect(mockNavigation.navigate).toHaveBeenLastCalledWith('TripDetailsScreen', { tripId });
    }
  }
  expect(visibleCopy()).toContain('Cancelled');
  expect(visibleCopy()).toContain('Missed');
  expect(visibleCopy()).toContain('2 incomplete trips');
});

test('scheduled details show fare, passenger and route; preview actions never execute or mutate trips', async () => {
  const before = JSON.stringify(DEMO_TRIPS);
  const openURL = jest.spyOn(Linking, 'openURL');
  const request = jest.spyOn(global, 'fetch');
  await mount(detail('TRP-051126-03'));
  expect(visibleCopy()).toContain('10:30 AM');
  expect(visibleCopy()).toContain('$300');
  expect(visibleCopy()).toContain('$270');
  expect(visibleCopy()).toContain('Priya Sharma');
  for (const [testID, title] of [
    ['trip-messagePassenger', 'Message passenger'],
    ['trip-callPassenger', 'Call passenger'],
    ['trip-cancel', 'Cancel trip'],
    ['trip-primary-action', 'Navigate to pickup'],
  ]) {
    await press(testID);
    const dialog = tree.root.findByType(Modal);
    expect(dialog.props.visible).toBe(true);
    expect(dialog.props.title).toBe(title);
    expect(visibleCopy()).toContain(i18n.t('trips.previewBody'));
    await act(async () => dialog.props.onClose());
    expect(tree.root.findByType(Modal).props.visible).toBe(false);
  }
  expect(JSON.stringify(DEMO_TRIPS)).toBe(before);
  expect(request).not.toHaveBeenCalled();
  expect(openURL).not.toHaveBeenCalled();
  expect(mockNavigation.navigate).not.toHaveBeenCalled();
});

test.each([
  ['TRP-051126-05', 'cancelled', 'Cancellation details', 'Rider changed plans'],
  ['TRP-051126-06', 'missed', 'Missed trip details', 'Rider did not arrive'],
])('%s shows its incomplete reason and zero earnings, with support preview', async (id, status, heading, reason) => {
  await mount(detail(id));
  expect(tree.root.findAllByProps({ testID: `trip-details-${status}` }).length).toBeGreaterThan(0);
  expect(visibleCopy()).toContain(heading);
  expect(visibleCopy()).toContain(reason);
  expect(visibleCopy()).toContain('Not travelled');
  expect(visibleCopy()).toContain('$0');
  expect(tree.root.findAllByProps({ testID: 'trip-cancel' })).toHaveLength(0);
  expect(tree.root.findAllByProps({ testID: 'trip-callPassenger' })).toHaveLength(0);
  await press('trip-primary-action');
  expect(tree.root.findByType(Modal).props.title).toBe('Contact support');
  expect(tree.root.findByType(Modal).props.visible).toBe(true);
});

test('completed detail shows final earnings without scheduled actions and preserves back navigation', async () => {
  await mount(detail('TRP-051126-01'));
  expect(tree.root.findAllByProps({ testID: 'trip-details-completed' }).length).toBeGreaterThan(0);
  expect(visibleCopy()).toContain('Your earnings');
  expect(visibleCopy()).toContain('$270');
  expect(tree.root.findAllByProps({ testID: 'trip-primary-action' })).toHaveLength(0);
  expect(tree.root.findAllByProps({ testID: 'trip-cancel' })).toHaveLength(0);
  await act(async () => tree.root.findAllByType(IconButton)
    .find(node => node.props.accessibilityLabel === i18n.t('ui.back'))!.props.onPress());
  expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
});

test('unknown trip presents a recoverable empty state and Help remains available', async () => {
  await mount(detail('missing-trip'));
  expect(visibleCopy()).toContain(i18n.t('trips.unavailableTitle'));
  expect(visibleCopy()).toContain(i18n.t('trips.unavailableBody'));
  expect(tree.root.findAllByProps({ testID: 'trip-primary-action' })).toHaveLength(0);
  await act(async () => tree.root.findAllByType(Button)
    .find(node => node.props.title === 'Help')!.props.onPress());
  expect(tree.root.findByType(Modal).props.visible).toBe(true);
});

test('Trips responds to Hindi and dark mode without resetting the selected category', async () => {
  await mount(<TripsScreen />);
  await press('trips-tab-upcoming');
  await act(async () => {
    await i18n.changeLanguage('hi');
    useThemeStore.setState(resolveTheme('dark', 'dark'));
  });
  expect(tree.root.findAllByProps({ testID: 'trips-tab-upcoming' })[0].props.accessibilityLabel)
    .toBe(i18n.t('trips.upcoming'));
  expect(tree.root.findAllByProps({ testID: 'trips-tab-upcoming' })[0].props.accessibilityState.selected).toBe(true);
  expect(visibleCopy()).toContain(i18n.t('trips.scheduled'));
  expect(visibleCopy()).not.toContain('trips.scheduled');
  expect(tree.root.findByType(AppBackground).props.backgroundColor).toBe(darkColors.surface);
  expect(renderedTripIds()).toEqual(['view-TRP-051126-03', 'view-TRP-051126-04']);
});
