import React from "react";
import Renderer, { act } from "react-test-renderer";
import { AppState, type AppStateStatus } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "@/localizations";
import { Alert, Button, Switch } from "@/components/ui";
import OrderSoundScreen from "@/screens/main/menu/OrderSoundScreen";
import NotificationsScreen from "@/screens/main/menu/NotificationsScreen";
import {
  useNotificationPreferencesStore,
  initializeNotificationPreferences,
} from "@/store/notificationPreferencesStore";

const mockBack = jest.fn();
let mockFocused = true;
let mockPlayerMounts = 0;
let mockPlayerUnmounts = 0;
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ goBack: mockBack }),
  useIsFocused: () => mockFocused,
}));
jest.mock("react-native-video", () => {
  const ReactModule = require("react");
  const { View } = require("react-native");
  return function Player(props: object) {
    ReactModule.useEffect(() => {
      mockPlayerMounts += 1;
      return () => {
        mockPlayerUnmounts += 1;
      };
    }, []);
    return ReactModule.createElement(View, props);
  };
});

let tree: Renderer.ReactTestRenderer;
const mount = async (screen: React.ReactElement) => {
  await act(async () => {
    tree = Renderer.create(<SafeAreaProvider>{screen}</SafeAreaProvider>);
  });
};
const radio = (title: string) =>
  tree.root.find(
    (node) =>
      node.props.accessibilityRole === "radio" &&
      node.props.accessibilityLabel === title &&
      typeof node.props.onPress === "function"
  );
const action = (label: string) =>
  tree.root.findAll(
    (node) =>
      node.props.accessibilityRole === "button" &&
      node.props.accessibilityLabel === label &&
      typeof node.props.onPress === "function"
  )[0];
const save = () =>
  tree.root
    .findAllByType(Button)
    .find((node) => node.props.title === i18n.t("menuAlerts.save"))!;
const player = () =>
  tree.root.findAll(
    (node) =>
      node.props.testID === "alert-tone-player" &&
      typeof node.props.onEnd === "function"
  )[0];

beforeEach(async () => {
  jest.clearAllMocks();
  mockFocused = true;
  mockPlayerMounts = 0;
  mockPlayerUnmounts = 0;
  await AsyncStorage.clear();
  await initializeNotificationPreferences();
  useNotificationPreferencesStore.setState({
    sound: "classic",
    vibrate: true,
    notificationsEnabled: true,
    saving: false,
    persistenceError: false,
  });
  await i18n.changeLanguage("en");
});
afterEach(async () => {
  await act(async () => tree?.unmount());
  jest.restoreAllMocks();
});

test("sound and vibration remain drafts until Save; successful save persists and returns", async () => {
  await mount(<OrderSoundScreen />);
  await act(async () => {
    radio("Chime").props.onPress();
    tree.root.findByType(Switch).props.onValueChange(false);
  });
  expect(useNotificationPreferencesStore.getState()).toMatchObject({
    sound: "classic",
    vibrate: true,
  });
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  await act(async () => {
    await save().props.onPress();
  });
  expect(useNotificationPreferencesStore.getState()).toMatchObject({
    sound: "chime",
    vibrate: false,
  });
  expect(
    JSON.parse((await AsyncStorage.getItem("notification-preferences"))!)
  ).toMatchObject({ sound: "chime", vibrate: false });
  expect(mockBack).toHaveBeenCalledTimes(1);
});

test("leaving sound settings discards the uncommitted choice", async () => {
  await mount(<OrderSoundScreen />);
  await act(async () => radio("Bell").props.onPress());
  await act(async () => tree.unmount());
  await mount(<OrderSoundScreen />);
  expect(radio("Classic").props.accessibilityState.checked).toBe(true);
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
});

test("failed sound save stays on screen, keeps draft, and can retry", async () => {
  await mount(<OrderSoundScreen />);
  await act(async () => radio("Pulse").props.onPress());
  jest
    .mocked(AsyncStorage.setItem)
    .mockRejectedValueOnce(new Error("disk full"));
  await act(async () => {
    await save().props.onPress();
  });
  expect(mockBack).not.toHaveBeenCalled();
  expect(radio("Pulse").props.accessibilityState.checked).toBe(true);
  expect(
    tree.root
      .findAllByType(Alert)
      .some(
        (node) => node.props.message === i18n.t("menuAlerts.preferenceError")
      )
  ).toBe(true);
  await act(async () => {
    await save().props.onPress();
  });
  expect(mockBack).toHaveBeenCalledTimes(1);
  expect(useNotificationPreferencesStore.getState().sound).toBe("pulse");
});

test("preview swaps a single player, stops on end/error and never saves", async () => {
  await mount(<OrderSoundScreen />);
  await act(async () => action("Preview Classic").props.onPress());
  expect(player()).toBeDefined();
  await act(async () => action("Preview Chime").props.onPress());
  expect(mockPlayerMounts - mockPlayerUnmounts).toBe(1);
  await act(async () => player().props.onEnd());
  expect(player()).toBeUndefined();
  await act(async () => action("Preview Bell").props.onPress());
  await act(async () => player().props.onError());
  expect(player()).toBeUndefined();
  expect(
    tree.root
      .findAllByType(Alert)
      .some((node) => node.props.message === i18n.t("menuAlerts.previewError"))
  ).toBe(true);
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
});

test("background, blur and unmount release preview playback", async () => {
  let appStateListener: ((state: AppStateStatus) => void) | undefined;
  const remove = jest.fn();
  jest
    .spyOn(AppState, "addEventListener")
    .mockImplementation((event, listener) => {
      if (event === "change") appStateListener = listener;
      return { remove };
    });
  await mount(<OrderSoundScreen />);
  await act(async () => action("Preview Classic").props.onPress());
  await act(async () => appStateListener?.("background"));
  expect(player()).toBeUndefined();
  await act(async () => action("Preview Bell").props.onPress());
  mockFocused = false;
  await act(async () =>
    tree.update(
      <SafeAreaProvider>
        <OrderSoundScreen />
      </SafeAreaProvider>
    )
  );
  expect(player()).toBeUndefined();
  mockFocused = true;
  await act(async () =>
    tree.update(
      <SafeAreaProvider>
        <OrderSoundScreen />
      </SafeAreaProvider>
    )
  );
  expect(player()).toBeUndefined();
  await act(async () => action("Preview Pulse").props.onPress());
  await act(async () => tree.unmount());
  expect(mockPlayerMounts).toBe(mockPlayerUnmounts);
  expect(remove).toHaveBeenCalled();
});

test("notifications save on selection, preserve sound, and expose retry after failure", async () => {
  useNotificationPreferencesStore.setState({ sound: "bell", vibrate: false });
  await mount(<NotificationsScreen />);
  await act(async () => radio("Off").props.onPress());
  expect(useNotificationPreferencesStore.getState()).toMatchObject({
    sound: "bell",
    vibrate: false,
    notificationsEnabled: false,
  });
  jest
    .mocked(AsyncStorage.setItem)
    .mockRejectedValueOnce(new Error("disk full"));
  await act(async () => radio("On").props.onPress());
  expect(radio("Off").props.accessibilityState.checked).toBe(true);
  await act(async () => tree.root.findByType(Button).props.onPress());
  expect(radio("On").props.accessibilityState.checked).toBe(true);
});
