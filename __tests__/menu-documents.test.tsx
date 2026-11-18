import React from "react";
import Renderer, { act } from "react-test-renderer";
import { SafeAreaProvider } from "react-native-safe-area-context";
import i18n from "@/localizations";
import { Button, Modal } from "@/components/ui";
import MyDocumentsScreen from "@/screens/main/menu/MyDocumentsScreen";
import VehicleDetailsScreen from "@/screens/main/menu/VehicleDetailsScreen";
import { useDriverOnboardingStore as store } from "@/store/driverOnboardingStore";
import {
  documentStatus,
  documentUploaded,
  hasMenuVehicle,
} from "@/utils/menuDocuments";
import type {
  DocumentKind,
  LocalUpload,
} from "@/interface/driverOnboarding.type";

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
}));

const file: LocalUpload = {
  uri: "file:///test.jpg",
  name: "test.jpg",
  mime: "image/jpeg",
  size: 1024,
};
function upload(kind: DocumentKind) {
  store.getState().updateDocument(kind, {
    front: file,
    back: file,
    number: "TEST",
    provider: "Test insurer",
    validUntil: "2099-01-01",
  });
  expect(store.getState().commitDocument(kind)).toBe(true);
}
let tree: Renderer.ReactTestRenderer | undefined;
beforeEach(async () => {
  jest.clearAllMocks();
  store.getState().start("Test");
  await i18n.changeLanguage("en");
});
afterEach(async () => {
  if (tree) await act(async () => tree?.unmount());
  tree = undefined;
  jest.restoreAllMocks();
});
async function mount(content: React.ReactNode) {
  await act(async () => {
    tree = Renderer.create(<SafeAreaProvider>{content}</SafeAreaProvider>);
  });
  return tree!;
}

test("completion retains selected documents and vehicle only for this session, clearing bank fields", () => {
  expect(store.getState().completePreview()).toBe(false);
  store.getState().setPreference("own");
  store.getState().setCity("Test city");
  store.getState().setVehicleType("car");
  (
    ["license", "photo", "government", "rc", "pollution", "insurance"] as const
  ).forEach(upload);
  store.getState().updateVehicle({
    make: "Toyota",
    model: "Corolla",
    variant: "LE",
    year: "2021",
  });
  expect(store.getState().commitVehicle()).toBe(true);
  store.getState().updateBank({
    bankName: "Test bank",
    holderName: "Test",
    accountNumber: "123",
    confirmAccountNumber: "123",
    iban: "Test IBAN",
  });
  expect(store.getState().completePreview()).toBe(true);
  expect(store.getState().documents.license.front).toEqual(file);
  expect(store.getState().vehicle.make).toBe("Toyota");
  expect(
    Object.values(store.getState().bank).every((value) => value === "")
  ).toBe(true);
  store.getState().clear();
  expect(store.getState().documents.license.front).toBeUndefined();
  expect(hasMenuVehicle(store.getState().vehicle)).toBe(false);
});

test("uploaded count excludes incomplete edits; expiry uses the actual selected date", () => {
  upload("license");
  expect(documentUploaded("license", store.getState().documents.license)).toBe(
    true
  );
  store.getState().updateDocument("license", { back: undefined });
  expect(documentUploaded("license", store.getState().documents.license)).toBe(
    false
  );
  upload("insurance");
  const draft = store.getState().documents.insurance;
  const today = new Date(2026, 10, 18, 23, 59);
  expect(
    documentStatus("insurance", { ...draft, validUntil: "2026-11-17" }, today)
  ).toBe("expired");
  expect(
    documentStatus("insurance", { ...draft, validUntil: "2026-11-18" }, today)
  ).toBe("expiring");
  expect(
    documentStatus("insurance", { ...draft, validUntil: "2026-12-19" }, today)
  ).toBe("uploaded");
});

test("My documents counts local submissions, opens selected document and routes missing upload", async () => {
  upload("license");
  const rendered = await mount(<MyDocumentsScreen />);
  const progress = rendered.root.find(
    (node) => node.props.accessibilityRole === "progressbar"
  );
  expect(progress.props.accessibilityValue).toEqual({ min: 0, max: 2, now: 1 });
  await act(async () =>
    rendered.root
      .findAllByType(Button)
      .find((node) => node.props.testID === "view-license")!
      .props.onPress()
  );
  expect(mockNavigate).toHaveBeenCalledWith("DocumentViewerScreen", {
    kind: "license",
  });
  await act(async () =>
    rendered.root
      .findAllByType(Button)
      .find((node) => node.props.testID === "upload-government")!
      .props.onPress()
  );
  expect(mockNavigate).toHaveBeenCalledWith("GovernmentIdScreen");
  expect(JSON.stringify(rendered.toJSON())).not.toContain("Verified");
});

test("fleet without vehicle shows add vehicle alert and no demo identity", async () => {
  store.getState().setPreference("fleet");
  const rendered = await mount(<VehicleDetailsScreen />);
  expect(rendered.root.findByType(Modal).props.visible).toBe(true);
  expect(JSON.stringify(rendered.toJSON())).toContain(
    i18n.t("menuDocuments.addVehicleFirst")
  );
  expect(JSON.stringify(rendered.toJSON())).not.toContain("Maruti");
  await act(async () => rendered.root.findByType(Modal).props.onClose());
  expect(mockGoBack).toHaveBeenCalledTimes(1);
});

test("vehicle screen reflects selected identity and live document edits", async () => {
  store.getState().setVehicleType("bike");
  store.getState().updateVehicle({
    make: "Honda",
    model: "CBR",
    variant: "500R",
    year: "2020",
  });
  store.getState().commitVehicle();
  upload("rc");
  const rendered = await mount(<VehicleDetailsScreen />);
  expect(JSON.stringify(rendered.toJSON())).toContain("Honda CBR");
  expect(
    rendered.root
      .findAllByType(Button)
      .some((node) => node.props.testID === "upload-insurance")
  ).toBe(true);
  await act(async () => upload("insurance"));
  expect(
    rendered.root
      .findAllByType(Button)
      .some((node) => node.props.testID === "view-insurance")
  ).toBe(true);
});
