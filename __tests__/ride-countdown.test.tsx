import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { AccessibilityInfo, AppState, type AppStateStatus } from 'react-native';
import RideRequestCountdown from '@/components/ui/RideRequestCountdown';

let tree: Renderer.ReactTestRenderer;
let appStateListener: (state: AppStateStatus) => void;
const removeAppListener = jest.fn();
const removeMotionListener = jest.fn();

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(100_000);
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
  const motionSubscription = AccessibilityInfo.addEventListener('reduceMotionChanged', () => {});
  jest.spyOn(motionSubscription, 'remove').mockImplementation(removeMotionListener);
  jest.spyOn(AccessibilityInfo, 'addEventListener').mockReturnValue(motionSubscription);
  jest.spyOn(AppState, 'addEventListener').mockImplementation((event, listener) => {
    if (event === 'change') appStateListener = listener;
    return { remove: removeAppListener };
  });
});
afterEach(async () => {
  await act(async () => tree?.unmount());
  jest.useRealTimers();
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

const mount = async (onExpire: () => void, expiresAt = 115_000) => {
  await act(async () => {
    tree = Renderer.create(<RideRequestCountdown expiresAt={expiresAt}
      durationMs={15_000} onExpire={onExpire} accessibilityLabel="Time remaining" />);
  });
};
const seconds = () => tree.root.findByProps({ testID: 'ride-request-countdown' })
  .props.accessibilityValue.now;

test('shows 15 then 14 and expires once at the actual deadline', async () => {
  const expired = jest.fn();
  await mount(expired);
  expect(seconds()).toBe(15);
  await act(async () => jest.advanceTimersByTime(1000));
  expect(seconds()).toBe(14);
  await act(async () => jest.advanceTimersByTime(13_900));
  expect(seconds()).toBe(1);
  expect(expired).not.toHaveBeenCalled();
  await act(async () => jest.advanceTimersByTime(100));
  expect(seconds()).toBe(0);
  expect(expired).toHaveBeenCalledTimes(1);
  await act(async () => jest.advanceTimersByTime(20_000));
  await act(async () => appStateListener('active'));
  expect(expired).toHaveBeenCalledTimes(1);
});

test('resume reconciles elapsed wall-clock time instead of replaying ticks', async () => {
  const expired = jest.fn();
  await mount(expired);
  await act(async () => appStateListener('background'));
  jest.setSystemTime(111_500);
  await act(async () => appStateListener('active'));
  expect(seconds()).toBe(4);
  await act(async () => appStateListener('background'));
  jest.setSystemTime(120_000);
  await act(async () => appStateListener('active'));
  expect(seconds()).toBe(0);
  expect(expired).toHaveBeenCalledTimes(1);
});

test('replacement deadline uses latest handler and unmount releases work', async () => {
  const first = jest.fn();
  const second = jest.fn();
  await mount(first);
  await act(async () => jest.advanceTimersByTime(1000));
  await act(async () => {
    tree.update(<RideRequestCountdown expiresAt={116_000} durationMs={15_000}
      onExpire={second} accessibilityLabel="Time remaining" />);
  });
  expect(seconds()).toBe(15);
  await act(async () => jest.advanceTimersByTime(15_000));
  expect(first).not.toHaveBeenCalled();
  expect(second).toHaveBeenCalledTimes(1);
  await act(async () => tree.unmount());
  expect(removeAppListener).toHaveBeenCalled();
  expect(removeMotionListener).toHaveBeenCalledTimes(1);
  await act(async () => jest.advanceTimersByTime(20_000));
  expect(second).toHaveBeenCalledTimes(1);
});

test('unmounting a live request prevents a later expiry action', async () => {
  const expired = jest.fn();
  await mount(expired);
  await act(async () => tree.unmount());
  await act(async () => jest.advanceTimersByTime(20_000));
  expect(expired).not.toHaveBeenCalled();
  expect(removeAppListener).toHaveBeenCalledTimes(1);
});

test('already expired request never starts another countdown', async () => {
  const expired = jest.fn();
  await mount(expired, 90_000);
  expect(seconds()).toBe(0);
  expect(expired).toHaveBeenCalledTimes(1);
  await act(async () => jest.advanceTimersByTime(15_000));
  expect(expired).toHaveBeenCalledTimes(1);
});
