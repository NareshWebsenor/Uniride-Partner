import React from "react";
import Renderer, { act } from "react-test-renderer";
import { Alert } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import i18n from "@/localizations";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import OnboardingChoiceCard from "@/components/driverOnboarding/OnboardingChoiceCard";
import OnboardingLayout from "@/components/driverOnboarding/OnboardingLayout";
import OnboardingProgress from "@/components/driverOnboarding/OnboardingProgress";
import EarningLocationScreen from "@/screens/driverOnboarding/EarningLocationScreen";
import ChooseVehicleTypeScreen from "@/screens/driverOnboarding/ChooseVehicleTypeScreen";
import DrivingPreferenceScreen from "@/screens/driverOnboarding/DrivingPreferenceScreen";
import ProfileScreen from "@/screens/driverOnboarding/ProfileScreen";
import BankDetailsScreen from "@/screens/driverOnboarding/BankDetailsScreen";
import OnboardingDocumentForm from "@/components/driverOnboarding/OnboardingDocumentForm";
import type { TRootStack } from "@/interface/navigation.type";
import type {
  DocumentKind,
  TDriverOnboardingStack,
} from "@/interface/driverOnboarding.type";
import { useDriverOnboardingStore as store } from "@/store/driverOnboardingStore";
import { useThemeStore } from "@/store/themeStore";

const navigate = jest.fn();
const push = jest.fn();
const reset = jest.fn();
const goBack = jest.fn();
const navigationFor = <Route extends keyof TDriverOnboardingStack>() =>
  ({ navigate, push, reset, goBack } as unknown as NativeStackNavigationProp<
    TRootStack,
    Route
  >);
let tree: Renderer.ReactTestRenderer;
const mount = async (children: React.ReactNode) =>
  act(async () => {
    tree = Renderer.create(<SafeAreaProvider>{children}</SafeAreaProvider>);
  });
const next = async () =>
  act(async () => {
    tree.root
      .findAllByType(Button)
      .find((node) => node.props.testID === "onboarding-continue")!
      .props.onPress();
  });
const nextButton = () =>
  tree.root
    .findAllByType(Button)
    .find((node) => node.props.testID === "onboarding-continue")!;
const fillDocument = (kind: DocumentKind) => {
  const file = {
    uri: "file:///demo.png",
    name: "demo.png",
    mime: "image/png",
    size: 1000,
  };
  store.getState().updateDocument(kind, {
    front: file,
    back: file,
    number: "DEMO",
    validUntil: "2099-12-31",
    provider: "Demo",
  });
  store.getState().commitDocument(kind);
};
const fillDriver = () => {
  store.getState().setCity("Nassau");
  store.getState().setVehicleType("car");
  (["license", "photo", "government"] as const).forEach(fillDocument);
};
beforeEach(async () => {
  jest.clearAllMocks();
  await i18n.changeLanguage("en");
  store.getState().start("Test");
});
afterEach(async () => {
  await act(async () => tree?.unmount());
  jest.restoreAllMocks();
});

test("city is required; optional referral and city remain in the session draft", async () => {
  await mount(
    <EarningLocationScreen
      navigation={navigationFor<"EarningLocationScreen">()}
      route={{ key: "city", name: "EarningLocationScreen" }}
    />
  );
  await next();
  expect(navigate).not.toHaveBeenCalled();
  expect(tree.root.findAllByType(TextInput)[0].props.error).toBeTruthy();
  await act(async () =>
    tree.root.findAllByType(TextInput)[0].props.onChangeText("Nassau")
  );
  await next();
  expect(navigate).toHaveBeenCalledWith("ChooseVehicleTypeScreen");
  expect(store.getState().city).toBe("Nassau");
  expect(store.getState().referral).toBe("");
  await act(async () => tree.root.findByType(OnboardingLayout).props.onBack());
  expect(goBack).toHaveBeenCalledTimes(1);
  expect(reset).not.toHaveBeenCalled();
});

test("own vehicle choice advances to driver documents", async () => {
  store.getState().setPreference("own");
  await mount(
    <ChooseVehicleTypeScreen
      navigation={navigationFor<"ChooseVehicleTypeScreen">()}
      route={{ key: "vehicle", name: "ChooseVehicleTypeScreen" }}
    />
  );
  expect(nextButton().props.disabled).toBe(true);
  await act(async () =>
    tree.root.findAllByType(OnboardingChoiceCard)[1].props.onPress()
  );
  await next();
  expect(navigate).toHaveBeenCalledWith("ProfileScreen", { stage: "driver" });
  expect(store.getState().vehicleType).toBe("bike");
});

test("preference routes fleet to documents and own to city; Back opens auth", async () => {
  await mount(
    <DrivingPreferenceScreen
      navigation={navigationFor<"DrivingPreferenceScreen">()}
      route={{ key: "preference", name: "DrivingPreferenceScreen" }}
    />
  );
  expect(nextButton().props.disabled).toBe(true);
  await next();
  expect(navigate).not.toHaveBeenCalled();
  const choices = tree.root.findAllByType(OnboardingChoiceCard);
  expect(choices.every((node) => node.props.image)).toBe(true);
  await act(async () => choices[0].props.onPress());
  await next();
  expect(navigate).toHaveBeenCalledWith("ProfileScreen", { stage: "driver" });
  expect(store.getState().city).toBe("");
  expect(store.getState().vehicleType).toBeUndefined();
  navigate.mockClear();
  await act(async () => choices[1].props.onPress());
  await next();
  expect(navigate).toHaveBeenCalledTimes(1);
  expect(navigate).toHaveBeenCalledWith("EarningLocationScreen");
  await act(async () => tree.root.findByType(OnboardingLayout).props.onBack());
  expect(reset).toHaveBeenCalledWith({
    index: 0,
    routes: [{ name: "LoginScreen" }],
  });
});

test("fleet has no vehicle/bank stage and finishes only via explicit preview confirmation", async () => {
  store.getState().setPreference("fleet");
  const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
  await mount(
    <ProfileScreen
      navigation={navigationFor<"ProfileScreen">()}
      route={{
        key: "profile",
        name: "ProfileScreen",
        params: { stage: "driver" },
      }}
    />
  );
  expect(nextButton().props.disabled).toBe(true);
  expect(tree.root.findAllByType(OnboardingProgress)).toHaveLength(0);
  await act(async () =>
    (["license", "photo", "government"] as const).forEach(fillDocument)
  );
  expect(nextButton().props.disabled).toBe(false);
  await next();
  await next();
  expect(alert).toHaveBeenCalledTimes(1);
  expect(push).not.toHaveBeenCalled();
  expect(reset).not.toHaveBeenCalled();
  expect(alert.mock.calls[0][1]).toContain("No application or documents");
  await act(async () => alert.mock.calls[0][2]?.[1].onPress?.());
  expect(reset).toHaveBeenCalledWith({
    index: 0,
    routes: [{ name: "MainStack" }],
  });
  expect(store.getState().documents.license.front).toBeUndefined();
});

test("own vehicle checklist advances driver → vehicle → bank and blocks incomplete vehicle details", async () => {
  fillDriver();
  store.getState().setPreference("own");
  await mount(
    <ProfileScreen
      navigation={navigationFor<"ProfileScreen">()}
      route={{
        key: "profile",
        name: "ProfileScreen",
        params: { stage: "driver" },
      }}
    />
  );
  expect(tree.root.findByType(OnboardingProgress).props.stage).toBe(1);
  await next();
  expect(push).toHaveBeenCalledWith("ProfileScreen", { stage: "vehicle" });
  await act(async () =>
    tree.update(
      <SafeAreaProvider>
        <ProfileScreen
          navigation={navigationFor<"ProfileScreen">()}
          route={{
            key: "vehicle-profile",
            name: "ProfileScreen",
            params: { stage: "vehicle" },
          }}
        />
      </SafeAreaProvider>
    )
  );
  expect(nextButton().props.disabled).toBe(true);
  await act(async () => {
    store.getState().updateVehicle({
      make: "Toyota",
      model: "Corolla",
      variant: "Petrol",
      year: "2021",
    });
    store.getState().commitVehicle();
    (["rc", "pollution", "insurance"] as const).forEach(fillDocument);
  });
  await next();
  expect(navigate).toHaveBeenCalledWith("BankDetailsScreen");
});

test("document form cannot mark empty documents completed; submitted edits invalidate completion", async () => {
  await mount(
    <OnboardingDocumentForm kind="license" onBack={goBack} onSaved={goBack} />
  );
  await next();
  expect(goBack).not.toHaveBeenCalled();
  expect(store.getState().documents.license.submitted).toBe(false);
  await act(async () => fillDocument("license"));
  await act(async () =>
    tree.root.findByType(TextInput).props.onChangeText("UPDATED")
  );
  expect(store.getState().documents.license.submitted).toBe(false);
  await next();
  expect(goBack).toHaveBeenCalledTimes(1);
  expect(store.getState().documents.license.submitted).toBe(true);
});

test("bank errors identify account mismatch; Hindi/theme changes update visible fields", async () => {
  store.getState().updateBank({
    bankName: "Demo",
    holderName: "Test",
    accountNumber: "1234",
    confirmAccountNumber: "4321",
    iban: "demo",
  });
  await mount(
    <BankDetailsScreen
      navigation={navigationFor<"BankDetailsScreen">()}
      route={{ key: "bank", name: "BankDetailsScreen" }}
    />
  );
  await next();
  const confirmation = tree.root
    .findAllByType(TextInput)
    .find((node) => node.props.testID === "bank-confirmAccountNumber")!;
  expect(confirmation.props.error).toBe("Account numbers must match.");
  await act(async () => {
    await i18n.changeLanguage("hi");
    await useThemeStore.getState().setPreference("dark");
  });
  expect(JSON.stringify(tree.toJSON())).toContain("IBAN कोड");
  expect(JSON.stringify(tree.toJSON())).toContain(
    useThemeStore.getState().themeColor.surface
  );
  await act(async () => {
    await i18n.changeLanguage("en");
    await useThemeStore.getState().setPreference("light");
  });
});
