import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { AccessibilityInfo, AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from '@/screens/main/tab/HomeScreen';
import { Button } from '@/components/ui';
import { ScaledTextInput } from '@/components/ui/Typography';
import SwipeAction from '@/components/ui/SwipeAction';
import { useHomeRideStore } from '@/store/homeRideStore';
import i18n from '@/localizations';

jest.mock('@/service/config', () => ({ GOOGLE_API_KEY: '', GOOGLE_ROUTES_KEY: '' }));

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn() }),
  useIsFocused: () => true,
}));
let tree: Renderer.ReactTestRenderer;
const originalState = AppState.currentState;
beforeEach(async () => {
  jest.useFakeTimers();
  jest.setSystemTime(100000);
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
  AppState.currentState = 'active';
  useHomeRideStore.getState().reset();
  await i18n.changeLanguage('en');
});
afterEach(async () => {
  await act(async () => tree?.unmount());
  AppState.currentState = originalState;
  jest.useRealTimers(); jest.restoreAllMocks();
});
const mount = async () => {
  await act(async () => {
    tree = Renderer.create(<SafeAreaProvider><HomeScreen /></SafeAreaProvider>);
  });
};
const press = async (title: string) => {
  await act(async () => {
    tree.root.findAllByType(Button).find(node => node.props.title === title)!.props.onPress();
  });
};

test('online waiting, incoming offer, accept, OTP and start compose the complete preview flow', async () => {
  await mount();
  expect(tree.root.findAllByProps({ testID: 'home-offline' }).length).toBeGreaterThan(0);
  await press('Go Online');
  expect(tree.root.findAllByProps({ testID: 'home-online' }).length).toBeGreaterThan(0);
  await act(async () => jest.advanceTimersByTime(5000));
  expect(tree.root.findAllByProps({ testID: 'home-request' }).length).toBeGreaterThan(0);
  await press('Accept ride');
  await act(async () => tree.root.findByType(SwipeAction).props.onComplete());
  expect(tree.root.findByType(SwipeAction).props.disabled).toBe(true);
  // A single input accepts pasted SMS codes without transferring focus.
  await act(async () => tree.root.findByType(ScaledTextInput).props.onChangeText('8291'));
  expect(tree.root.findByType(ScaledTextInput).props.value).toBe('8291');
  expect(tree.root.findByType(SwipeAction).props.disabled).toBe(false);
  await act(async () => tree.root.findByType(SwipeAction).props.onComplete());
  expect(tree.root.findAllByProps({ testID: 'home-started' }).length).toBeGreaterThan(0);
  await act(async () => tree.unmount());
  expect(useHomeRideStore.getState().ride.status).toBe('offline');
});

test('request expiry returns to online panel and language changes keep working', async () => {
  await mount();
  await press('Go Online');
  await act(async () => jest.advanceTimersByTime(5000));
  await act(async () => jest.advanceTimersByTime(15000));
  expect(tree.root.findAllByProps({ testID: 'home-online' }).length).toBeGreaterThan(0);
  await act(async () => { await i18n.changeLanguage('es'); });
  expect(tree.root.findAllByType(Button).some(node => node.props.title === 'Desconectarse')).toBe(true);
  await press('Desconectarse');
  expect(useHomeRideStore.getState().ride.status).toBe('offline');
});
