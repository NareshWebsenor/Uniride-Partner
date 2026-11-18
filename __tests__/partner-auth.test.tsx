import React from "react";
import Renderer, { act } from "react-test-renderer";
import { Alert, TextInput as NativeInput } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import i18n from "@/localizations";
import LoginScreen from "@/screens/auth/LoginScreen";
import { Button, Checkbox, TextInput } from "@/components/ui";
import type { TRootStack } from "@/interface/navigation.type";
import { isValidEmail, maskEmail, passwordRules } from "@/utils/authPreview";
import { useThemeStore } from "@/store/themeStore";

type Navigation = NativeStackScreenProps<
  TRootStack,
  "LoginScreen"
>["navigation"];
let tree: Renderer.ReactTestRenderer;
const reset = jest.fn();
const input = (id: string) =>
  tree.root.findAllByType(TextInput).find((node) => node.props.testID === id)!;
const button = (id: string) =>
  tree.root.findAllByType(Button).find((node) => node.props.testID === id)!;
const change = async (id: string, value: string) =>
  act(async () => input(id).props.onChangeText(value));
const press = async (id: string) => act(async () => button(id).props.onPress());

beforeEach(async () => {
  jest.clearAllMocks();
  await i18n.changeLanguage("en");
  await act(async () => {
    tree = Renderer.create(
      <SafeAreaProvider>
        <LoginScreen
          navigation={{ reset } as unknown as Navigation}
          route={{ key: "auth", name: "LoginScreen" }}
        />
      </SafeAreaProvider>
    );
  });
});

afterEach(async () => {
  await act(async () => tree.unmount());
  jest.useRealTimers();
});

test("masking never exposes short local parts in full and preserves the domain", () => {
  expect(maskEmail("test@gmail.com")).toBe("t**t@gmail.com");
  expect(maskEmail("a@gmail.com")).toBe("a**@gmail.com");
  expect(maskEmail("ab@gmail.com")).toBe("a**@gmail.com");
  expect(maskEmail("invalid")).toBe("***");
  expect(isValidEmail("test@gmail.com")).toBe(true);
  expect(isValidEmail("test@")).toBe(false);
  expect(Object.values(passwordRules("abcdefgh")).every(Boolean)).toBe(false);
  expect(Object.values(passwordRules("12345678")).every(Boolean)).toBe(false);
  expect(Object.values(passwordRules("abcdefg1")).every(Boolean)).toBe(true);
});

test("registration gates each step and preserves data on back, with email-only OTP", async () => {
  await act(async () =>
    tree.root.findAllByProps({ testID: "register-tab" })[0].props.onPress()
  );
  await press("entry-continue");
  expect(input("first-name").props.error).toBeTruthy();
  await change("first-name", "Test");
  await change("email", "test@gmail.com");
  await press("entry-continue");
  expect(JSON.stringify(tree.toJSON())).toContain("t**t@gmail.com");
  expect(JSON.stringify(tree.toJSON())).not.toContain("test@gmail.com");
  expect(button("step-continue").props.disabled).toBe(true);
  await act(async () =>
    tree.root
      .findAllByType(Button)
      .find((node) => node.props.title === "Back")!
      .props.onPress()
  );
  expect(input("first-name").props.value).toBe("Test");
  await press("entry-continue");
  await act(async () =>
    tree.root.findByType(NativeInput).props.onChangeText("1234")
  );
  await press("step-continue");
  expect(input("mobile-number")).toBeTruthy();
  await change("mobile-number", "9876543210");
  await act(async () =>
    tree.root
      .findAllByType(Button)
      .find((node) => node.props.title === "Back")!
      .props.onPress()
  );
  expect(tree.root.findByType(NativeInput).props.value).toBe("1234");
  await press("step-continue");
  expect(input("mobile-number").props.value).toBe("9876543210");
  await press("step-continue");
  await change("create-password", "abcdefg1");
  await change("confirm-password", "different");
  expect(button("step-continue").props.disabled).toBe(true);
  await change("confirm-password", "abcdefg1");
  await press("step-continue");
  expect(button("step-continue").props.disabled).toBe(true);
  await act(async () =>
    tree.root.findByType(Checkbox).props.onValueChange(true)
  );
  await press("step-continue");
  expect(reset).toHaveBeenCalledWith({
    index: 0,
    routes: [{ name: "DrivingPreferenceScreen" }],
  });
});

test("resend has a cooldown and states service unavailable without claiming delivery", async () => {
  jest.useFakeTimers();
  const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
  await act(async () =>
    tree.root.findAllByProps({ testID: "register-tab" })[0].props.onPress()
  );
  await change("first-name", "Test");
  await change("email", "test@gmail.com");
  await press("entry-continue");
  await press("resend");
  expect(alert).toHaveBeenCalledWith(
    "Coming soon",
    "This service is not available yet."
  );
  expect(button("resend").props.disabled).toBe(true);
  for (let count = 0; count < 30; count++)
    await act(async () => jest.advanceTimersByTime(1000));
  expect(button("resend").props.disabled).toBe(false);
  alert.mockRestore();
});

test("login validates fields and preview navigation does not require a session", async () => {
  await press("entry-continue");
  expect(reset).not.toHaveBeenCalled();
  await change("email", "test@gmail.com");
  await change("login-password", "example");
  await press("entry-continue");
  expect(reset).toHaveBeenCalledTimes(1);
});

test("visible auth copy responds to Hindi and dark mode", async () => {
  await act(async () => {
    await i18n.changeLanguage("hi");
    await useThemeStore.getState().setPreference("dark");
  });
  expect(JSON.stringify(tree.toJSON())).toContain("रजिस्टर करें");
  expect(JSON.stringify(tree.toJSON())).toContain(
    useThemeStore.getState().themeColor.surface
  );
  await act(async () => {
    await i18n.changeLanguage("en");
    await useThemeStore.getState().setPreference("light");
  });
});
