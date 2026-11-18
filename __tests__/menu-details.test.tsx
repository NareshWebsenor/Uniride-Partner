import React from "react";
import Renderer, { act } from "react-test-renderer";
import { Linking } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Button, Modal, SearchInput } from "@/components/ui";
import i18n from "@/localizations";
import { useLanguageStore } from "@/store/languageStore";
import { useDriverOnboardingStore } from "@/store/driverOnboardingStore";
import { useTextSizeStore } from "@/store/textSizeStore";
import AppLanguageScreen from "@/screens/main/menu/AppLanguageScreen";
import HelpSupportScreen from "@/screens/main/menu/HelpSupportScreen";
import SafetyScreen from "@/screens/main/menu/SafetyScreen";
import LogoutSheet from "@/screens/main/menu/LogoutSheet";
import { ChoiceRow } from "@/screens/main/menu/MenuDetailLayout";

const mockReset = jest.fn();
const mockBack = jest.fn();
const mockClose = jest.fn();
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ reset: mockReset, goBack: mockBack }),
}));
let tree: Renderer.ReactTestRenderer;
const mount = async (screen: React.ReactNode) => {
  await act(async () => {
    tree = Renderer.create(<SafeAreaProvider>{screen}</SafeAreaProvider>);
  });
};
const button = (title: string) =>
  tree.root.findAllByType(Button).find((node) => node.props.title === title)!;
const row = (label: string) =>
  tree.root.find(
    (node) =>
      node.props.accessibilityRole === "button" &&
      node.props.accessibilityLabel === label &&
      typeof node.props.onPress === "function"
  );
beforeEach(async () => {
  jest.clearAllMocks();
  await act(async () => {
    await i18n.changeLanguage("en");
    useLanguageStore.setState({ language: "en", error: null });
    useDriverOnboardingStore.getState().clear();
  });
});
afterEach(async () => {
  await act(async () => tree?.unmount());
  jest.restoreAllMocks();
});

test("language selection is a draft, save applies Hindi and persists it", async () => {
  await mount(<AppLanguageScreen />);
  await act(async () => tree.root.findAllByType(ChoiceRow)[1].props.onPress());
  expect(useLanguageStore.getState().language).toBe("en");
  await act(async () => button("Save language").props.onPress());
  expect(useLanguageStore.getState().language).toBe("hi");
  expect(button(i18n.t("menuDetails.saveLanguage"))).toBeDefined();
});

test("failed language save keeps prior language, displays error and permits retry", async () => {
  await mount(<AppLanguageScreen />);
  await act(async () => tree.root.findAllByType(ChoiceRow)[1].props.onPress());
  jest
    .mocked(AsyncStorage.setItem)
    .mockRejectedValueOnce(new Error("disk full"));
  await act(async () => button("Save language").props.onPress());
  expect(useLanguageStore.getState().language).toBe("en");
  expect(
    tree.root.findAllByProps({ message: i18n.t("settings.languageSaveError") })
      .length
  ).toBeGreaterThan(0);
  await act(async () => button("Save language").props.onPress());
  expect(useLanguageStore.getState().language).toBe("hi");
});

test("help search filters topics/questions and shows a recoverable empty state", async () => {
  await mount(<HelpSupportScreen />);
  await act(async () =>
    tree.root.findByType(SearchInput).props.onChangeText("payout")
  );
  expect(row("Earnings & payments")).toBeDefined();
  expect(row("When will I receive my payout?")).toBeDefined();
  await act(async () => row("When will I receive my payout?").props.onPress());
  expect(tree.root.findByType(Modal).props.visible).toBe(true);
  await act(async () => {
    tree.root.findByType(Modal).props.onClose();
    tree.root.findByType(SearchInput).props.onChangeText("unmatched query");
  });
  expect(
    tree.root.findAllByProps({ children: i18n.t("menuHelp.noResults") }).length
  ).toBeGreaterThan(0);
});

test("safety only opens product-provided 123 dialer on tap and handles missing dialer", async () => {
  const open = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
  await mount(<SafetyScreen />);
  expect(open).not.toHaveBeenCalled();
  await act(async () => button("Call 123").props.onPress());
  expect(open).toHaveBeenCalledWith("tel:123");
  open.mockRejectedValueOnce(new Error("no dialer"));
  await act(async () => button("Call 123").props.onPress());
  expect(tree.root.findByType(Modal).props.visible).toBe(true);
  expect(
    tree.root.findAllByProps({ children: i18n.t("menuSafety.callError") })
      .length
  ).toBeGreaterThan(0);
});

test("logout cancel preserves draft; confirmation clears draft and resets to Login, retaining display prefs", async () => {
  const store = useDriverOnboardingStore.getState();
  store.start("Test");
  store.updateBank({ accountNumber: "123456" });
  useTextSizeStore.setState({ size: "large" });
  await mount(<LogoutSheet visible onClose={mockClose} />);
  await act(async () => button("Cancel").props.onPress());
  expect(mockReset).not.toHaveBeenCalled();
  expect(useDriverOnboardingStore.getState().firstName).toBe("Test");
  await act(async () => button("Log out").props.onPress());
  expect(useDriverOnboardingStore.getState().firstName).toBe("");
  expect(useDriverOnboardingStore.getState().bank.accountNumber).toBe("");
  expect(mockReset).toHaveBeenCalledWith({
    index: 0,
    routes: [{ name: "LoginScreen" }],
  });
  expect(useTextSizeStore.getState().size).toBe("large");
  await act(async () => button("Log out").props.onPress());
  expect(mockReset).toHaveBeenCalledTimes(1);
});

test("language screen offers three languages and applies Spanish only after Save", async () => {
  await mount(<AppLanguageScreen />);
  expect(
    tree.root.findAllByType(ChoiceRow).map((node) => node.props.title)
  ).toEqual(["English", "हिन्दी", "Español"]);
  await act(async () => tree.root.findAllByType(ChoiceRow)[2].props.onPress());
  expect(useLanguageStore.getState().language).toBe("en");
  await act(async () => button("Save language").props.onPress());
  expect(useLanguageStore.getState().language).toBe("es");
  expect(i18n.resolvedLanguage).toBe("es");
  expect(button(i18n.t("menuDetails.saveLanguage"))).toBeDefined();
  expect(i18n.t("menu.appLanguage")).toBe("Idioma de la app");
});
