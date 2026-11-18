import type {
  BankDetailsDraft,
  DocumentDraft,
  DocumentKind,
  DriverOnboardingDraft,
  LocalUpload,
  VehicleModelDraft,
} from "@/interface/driverOnboarding.type";

export const MAX_ONBOARDING_FILE_BYTES = 10 * 1024 * 1024;

export function localDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

export function parseLocalDate(value: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12);
  return localDateString(date) === value ? date : undefined;
}

export function isCurrentDate(value: string, now = new Date()): boolean {
  return Boolean(parseLocalDate(value)) && value >= localDateString(now);
}

export function uploadValid(
  file: LocalUpload | undefined,
  imagesOnly = false
): boolean {
  return Boolean(
    file?.uri &&
      file.size > 0 &&
      file.size <= MAX_ONBOARDING_FILE_BYTES &&
      (file.mime.startsWith("image/") ||
        (!imagesOnly && file.mime === "application/pdf"))
  );
}

export function documentValid(
  kind: DocumentKind,
  draft: DocumentDraft,
  now = new Date()
): boolean {
  if (!uploadValid(draft.front, kind === "photo")) return false;
  if (kind === "photo") return true;
  if (!draft.number.trim()) return false;
  if (kind === "license" || kind === "government" || kind === "rc")
    return uploadValid(draft.back);
  return (
    isCurrentDate(draft.validUntil, now) &&
    (kind !== "insurance" || Boolean(draft.provider.trim()))
  );
}

export function manufactureYearValid(value: string): boolean {
  return (
    /^\d{4}$/.test(value) &&
    Number(value) >= 1900 &&
    Number(value) <= new Date().getFullYear()
  );
}

export function vehicleValid(draft: VehicleModelDraft): boolean {
  return (
    Boolean(draft.make.trim() && draft.model.trim() && draft.variant.trim()) &&
    manufactureYearValid(draft.year)
  );
}

export function bankValid(draft: BankDetailsDraft): boolean {
  return (
    Object.values(draft).every((value) => Boolean(value.trim())) &&
    draft.accountNumber.trim() === draft.confirmAccountNumber.trim()
  );
}

export function driverComplete(
  documents: DriverOnboardingDraft["documents"]
): boolean {
  return (["license", "photo", "government"] as const).every(
    (kind) => documents[kind].submitted && documentValid(kind, documents[kind])
  );
}

export function vehicleComplete(
  documents: DriverOnboardingDraft["documents"],
  vehicle: VehicleModelDraft
): boolean {
  return (
    vehicle.submitted &&
    vehicleValid(vehicle) &&
    (["rc", "pollution", "insurance"] as const).every(
      (kind) =>
        documents[kind].submitted && documentValid(kind, documents[kind])
    )
  );
}

export function canFinish(draft: DriverOnboardingDraft): boolean {
  if (!driverComplete(draft.documents)) return false;
  if (draft.preference === "fleet") return true;
  return (
    draft.preference === "own" &&
    Boolean(draft.city.trim() && draft.vehicleType) &&
    vehicleComplete(draft.documents, draft.vehicle) &&
    bankValid(draft.bank)
  );
}
