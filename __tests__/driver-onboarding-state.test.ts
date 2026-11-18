import { useDriverOnboardingStore as store } from "@/store/driverOnboardingStore";
import {
  statusBarStyleForColor,
  LightThemeColors,
  DarkThemeColors,
} from "@/utils/theme.utils";
import {
  bankValid,
  canFinish,
  documentValid,
  isCurrentDate,
  localDateString,
  manufactureYearValid,
  parseLocalDate,
  uploadValid,
} from "@/utils/driverOnboarding";
import type {
  DocumentKind,
  LocalUpload,
} from "@/interface/driverOnboarding.type";

const file: LocalUpload = {
  uri: "file:///test.png",
  name: "test.png",
  mime: "image/png",
  size: 1000,
};
const addDocument = (kind: DocumentKind) => {
  store.getState().updateDocument(kind, {
    front: file,
    back: file,
    number: "TEST",
    validUntil: "2099-12-31",
    provider: "Test insurer",
  });
  expect(store.getState().commitDocument(kind)).toBe(true);
};
const fillDriver = () => {
  store.getState().setCity("Nassau");
  store.getState().setVehicleType("car");
  (["license", "photo", "government"] as const).forEach(addDocument);
};
const fillVehicle = () => {
  store.getState().updateVehicle({
    make: "Toyota",
    model: "Corolla",
    variant: "Petrol",
    year: "2021",
  });
  store.getState().commitVehicle();
  (["rc", "pollution", "insurance"] as const).forEach(addDocument);
};

beforeEach(() => store.getState().start("Test"));

test("fleet finishes with driver documents without city, vehicle type or bank details", () => {
  (["license", "photo", "government"] as const).forEach(addDocument);
  expect(canFinish(store.getState())).toBe(false);
  store.getState().setPreference("fleet");
  expect(canFinish(store.getState())).toBe(true);
  store.getState().setCity("   ");
  expect(canFinish(store.getState())).toBe(true);
  store.getState().setPreference("own");
  expect(canFinish(store.getState())).toBe(false);
});

test("own vehicle needs all three stages; bank confirmation must match; IBAN is required-only", () => {
  fillDriver();
  store.getState().setPreference("own");
  expect(canFinish(store.getState())).toBe(false);
  fillVehicle();
  expect(canFinish(store.getState())).toBe(false);
  store.getState().updateBank({
    bankName: "Test Bank",
    holderName: "Test",
    accountNumber: "ABC123",
    confirmAccountNumber: "different",
    iban: "preview-bank-code",
  });
  expect(bankValid(store.getState().bank)).toBe(false);
  store.getState().updateBank({ confirmAccountNumber: "ABC123" });
  expect(canFinish(store.getState())).toBe(true);
  store.getState().setCity(" ");
  expect(canFinish(store.getState())).toBe(false);
  store.getState().setCity("Nassau");
  store.setState({ vehicleType: undefined });
  expect(canFinish(store.getState())).toBe(false);
  store.setState({ vehicleType: "car" });
  store.getState().updateBank({ iban: " " });
  expect(canFinish(store.getState())).toBe(false);
});

test("editing/removing submitted documents requires submitting them again", () => {
  fillDriver();
  store.getState().setPreference("fleet");
  store.getState().updateDocument("license", { number: "UPDATED" });
  expect(canFinish(store.getState())).toBe(false);
  store.getState().commitDocument("license");
  expect(canFinish(store.getState())).toBe(true);
  store.getState().updateDocument("license", { back: undefined });
  expect(store.getState().commitDocument("license")).toBe(false);
});

test("changing vehicle type clears vehicle details but preserves driver documents", () => {
  fillDriver();
  fillVehicle();
  store.getState().setVehicleType("bike");
  expect(store.getState().documents.license.submitted).toBe(true);
  expect(store.getState().vehicle.make).toBe("");
  expect(store.getState().documents.rc.front).toBeUndefined();
  expect(store.getState().documents.insurance.submitted).toBe(false);
});

test("new registration and completion clear sensitive draft fields", () => {
  fillDriver();
  store.getState().updateBank({ accountNumber: "1234" });
  store.getState().start("Next");
  expect(store.getState().firstName).toBe("Next");
  expect(store.getState().bank.accountNumber).toBe("");
  expect(store.getState().documents.license.front).toBeUndefined();
  store.getState().clear();
  expect(store.getState().firstName).toBe("");
});

test("expiry validation rejects impossible and past dates, accepts same local calendar day", () => {
  const now = new Date(2026, 10, 17, 23, 59);
  expect(isCurrentDate("2026-11-17", now)).toBe(true);
  expect(isCurrentDate("2026-11-16", now)).toBe(false);
  expect(isCurrentDate("2027-02-29", now)).toBe(false);
  expect(isCurrentDate("2028-02-29", now)).toBe(true);
  expect(parseLocalDate("garbage")).toBeUndefined();
  expect(localDateString(new Date(2026, 0, 1))).toBe("2026-01-01");
  expect(manufactureYearValid(String(new Date().getFullYear() + 1))).toBe(
    false
  );
  expect(manufactureYearValid("2021")).toBe(true);
});

test("upload requirements reject wrong types, empty files, oversized files and PDF portraits", () => {
  expect(uploadValid({ ...file, size: 0 })).toBe(false);
  expect(uploadValid({ ...file, size: 10 * 1024 * 1024 + 1 })).toBe(false);
  expect(uploadValid({ ...file, mime: "text/plain" })).toBe(false);
  expect(uploadValid({ ...file, mime: "application/pdf" })).toBe(true);
  const portrait = {
    ...store.getState().documents.photo,
    front: { ...file, mime: "application/pdf" },
  };
  expect(documentValid("photo", portrait)).toBe(false);
});

test("expiration invalidates previously completed vehicle documents", () => {
  fillDriver();
  fillVehicle();
  const insurance = store.getState().documents.insurance;
  expect(
    documentValid("insurance", { ...insurance, validUntil: "2020-01-01" })
  ).toBe(false);
  expect(documentValid("insurance", { ...insurance, provider: " " })).toBe(
    false
  );
});

test("status icons contrast with light and dark palette surfaces", () => {
  expect(statusBarStyleForColor(LightThemeColors.surface, false)).toBe(
    "dark-content"
  );
  expect(statusBarStyleForColor(DarkThemeColors.surface, true)).toBe(
    "light-content"
  );
  expect(statusBarStyleForColor("#fff", true)).toBe("dark-content");
});
