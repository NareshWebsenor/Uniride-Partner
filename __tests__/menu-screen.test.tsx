import React from "react";
import Renderer, { act } from "react-test-renderer";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaProvider } from "react-native-safe-area-context";
import i18n from "@/localizations";
import MenuScreen from "@/screens/main/tab/MenuScreen";
import { useDriverOnboardingStore } from "@/store/driverOnboardingStore";
import { Modal, RadioButton, Switch } from "@/components/ui";
import { resolveTheme, useThemeStore } from "@/store/themeStore";
import { useLanguageStore } from "@/store/languageStore";

const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

let tree: Renderer.ReactTestRenderer;
const button = (label: string) =>
  tree.root.find(
    (node) =>
      node.props.accessibilityRole === "button" &&
      node.props.accessibilityLabel === label &&
      typeof node.props.onPress === "function"
  );

beforeEach(async () => {
  jest.clearAllMocks();
  useDriverOnboardingStore.getState().clear();
  await AsyncStorage.clear();
  await act(async () => {
    await i18n.changeLanguage("en");
    useLanguageStore.setState({ language: "en", error: null });
    useThemeStore.setState({
      preference: "system",
      ...resolveTheme("system", "light"),
      persistenceError: false,
    });
    tree = Renderer.create(
      <SafeAreaProvider>
        <MenuScreen />
      </SafeAreaProvider>
    );
  });
});
afterEach(async () => {
  await act(async () => tree.unmount());
});

test("Text size row follows Notifications and opens its settings screen", async () => {
  const rows = tree.root
    .findAll(
      (node) =>
        node.props.accessibilityRole === "button" &&
        typeof node.props.onPress === "function"
    )
    .map((node) => node.props.accessibilityLabel);
  expect(rows[rows.indexOf("Notifications") + 1]).toBe("Text size");
  await act(async () => button("Text size").props.onPress());
  expect(mockNavigate).toHaveBeenCalledWith("TextSizeScreen");
});

test("Menu controls preserve dark/system and navigate to language settings", async () => {
  await act(async () => {
    await tree.root.findByType(Switch).props.onValueChange(true);
  });
  expect(useThemeStore.getState().preference).toBe("dark");
  expect(
    JSON.parse((await AsyncStorage.getItem("theme-storage"))!).state.preference
  ).toBe("dark");
  await act(async () => button("Appearance").props.onPress());
  await act(async () => {
    await tree.root
      .findAllByType(RadioButton)
      .find((node) => node.props.label === "Use device setting")!
      .props.onValueChange();
  });
  expect(useThemeStore.getState().preference).toBe("system");
  await act(async () => {
    tree.root
      .findAllByType(Modal)
      .find((node) => node.props.visible)!
      .props.onClose();
    button("App language").props.onPress();
  });
  expect(mockNavigate).toHaveBeenCalledWith("AppLanguageScreen");
});

test("Menu routes open their screens and missing fleet vehicle only alerts", async () => {
  useDriverOnboardingStore.getState().setPreference("fleet");
  for (const [label, route] of [
    ["My documents", "MyDocumentsScreen"],
    ["Order alert sound", "OrderSoundScreen"],
    ["Notifications", "NotificationsScreen"],
    ["Help & support", "HelpSupportScreen"],
    ["Safety & emergency", "SafetyScreen"],
  ]) {
    await act(async () => button(label).props.onPress());
    expect(mockNavigate).toHaveBeenLastCalledWith(route);
  }
  mockNavigate.mockClear();
  await act(async () => button("Vehicle details").props.onPress());
  const missing = tree.root
    .findAllByType(Modal)
    .find((node) => node.props.visible)!;
  expect(missing.props.title).toBe(i18n.t("menu.vehicle"));
  await act(async () => missing.props.onClose());
  expect(mockNavigate).not.toHaveBeenCalled();
  await act(async () => {
    const store = useDriverOnboardingStore.getState();
    store.updateVehicle({
      make: "Maruti",
      model: "Dzire",
      variant: "VXI",
      year: "2024",
    });
    store.commitVehicle();
  });
  await act(async () => button("Vehicle details").props.onPress());
  expect(mockNavigate).toHaveBeenLastCalledWith("VehicleDetailsScreen");
});

test("legal links keep dismissible coming-soon message", async () => {
  await act(async () => {
    button(i18n.t("menu.terms")).props.onPress();
  });
  const modal = tree.root
    .findAllByType(Modal)
    .find((node) => node.props.visible)!;
  expect(modal.props.title).toBe(i18n.t("menu.terms"));
  await act(async () => modal.props.onClose());
  expect(
    tree.root.findAllByType(Modal).filter((node) => node.props.visible)
  ).toHaveLength(0);
});

test("theme persistence failure is visible instead of claiming a saved preference", async () => {
  jest
    .mocked(AsyncStorage.setItem)
    .mockRejectedValueOnce(new Error("storage unavailable"));
  await act(async () => {
    await tree.root.findByType(Switch).props.onValueChange(true);
  });
  expect(useThemeStore.getState().persistenceError).toBe(true);
  expect(
    tree.root.findAll(
      (node) => node.props.message === i18n.t("settings.themeSaveError")
    ).length
  ).toBeGreaterThan(0);
});
