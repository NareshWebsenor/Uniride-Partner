import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { AccessibilityInfo } from 'react-native';
import SwipeAction from '@/components/ui/SwipeAction';

let tree: Renderer.ReactTestRenderer;
beforeEach(() => {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
});
afterEach(async () => {
  await act(async () => tree?.unmount());
  jest.restoreAllMocks();
});

const control = () => tree.root.findByProps({ testID: 'swipe-action' });
const activate = () => control().props.onAccessibilityAction({
  nativeEvent: { actionName: 'activate' },
});

test('screen-reader activation completes once, then next step can activate', async () => {
  const complete = jest.fn();
  await act(async () => {
    tree = Renderer.create(<SwipeAction label="Arriving" onComplete={complete} />);
  });
  await act(async () => { activate(); activate(); });
  expect(complete).toHaveBeenCalledTimes(1);
  expect(control().props.accessibilityState.disabled).toBe(true);
  await act(async () => {
    tree.update(<SwipeAction label="Start Trip" onComplete={complete} />);
  });
  expect(control().props.accessibilityState.disabled).toBe(false);
  await act(async () => activate());
  expect(complete).toHaveBeenCalledTimes(2);
});

test('disabled action rejects activation and resetKey enables retry after completion', async () => {
  const complete = jest.fn();
  await act(async () => {
    tree = Renderer.create(<SwipeAction label="Start Trip" onComplete={complete} disabled />);
  });
  await act(async () => activate());
  expect(complete).not.toHaveBeenCalled();
  await act(async () => {
    tree.update(<SwipeAction label="Start Trip" onComplete={complete} resetKey="first" />);
  });
  await act(async () => activate());
  expect(complete).toHaveBeenCalledTimes(1);
  await act(async () => {
    tree.update(<SwipeAction label="Start Trip" onComplete={complete} resetKey="retry" />);
  });
  await act(async () => activate());
  expect(complete).toHaveBeenCalledTimes(2);
});
