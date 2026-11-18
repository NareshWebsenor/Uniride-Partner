import type {
  DocumentDraft,
  DocumentKind,
  VehicleModelDraft,
} from "@/interface/driverOnboarding.type";
import {
  localDateString,
  parseLocalDate,
  uploadValid,
  vehicleValid,
} from "./driverOnboarding";

export const documentEditRoutes = {
  license: "DrivingLicenseScreen",
  government: "GovernmentIdScreen",
  photo: "ProfilePictureScreen",
  rc: "VehicleRcScreen",
  pollution: "PollutionCertificateScreen",
  insurance: "VehicleInsuranceScreen",
} as const;

export function hasMenuVehicle(vehicle: VehicleModelDraft): boolean {
  return vehicle.submitted && vehicleValid(vehicle);
}

export function documentUploaded(
  kind: DocumentKind,
  document: DocumentDraft
): boolean {
  return (
    document.submitted &&
    uploadValid(document.front, kind === "photo") &&
    (!["license", "government", "rc"].includes(kind) ||
      uploadValid(document.back))
  );
}

export function documentStatus(
  kind: DocumentKind,
  document: DocumentDraft,
  now = new Date()
) {
  if (!documentUploaded(kind, document)) return "notUploaded";
  const expiry = parseLocalDate(document.validUntil);
  const today = parseLocalDate(localDateString(now));
  if (expiry && today) {
    const days = Math.round((expiry.getTime() - today.getTime()) / 86_400_000);
    if (days < 0) return "expired";
    if (days <= 30) return "expiring";
  }
  return "uploaded";
}
