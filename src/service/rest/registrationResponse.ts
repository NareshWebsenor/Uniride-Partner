import type { Answer, ApplicationState, RegistrationField, RegistrationForm, Vehicle, VehicleOptions } from '@/interface/driverRegistration.type';
import { DriverApiError } from './driverClient';

export const record = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v);
export const str = (v: unknown): v is string => typeof v === "string";
export const text = (v: unknown): v is string => str(v) && v.trim().length > 0;
export const number = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
export const state = (v: unknown): v is ApplicationState =>
  v === "invited" ||
  v === "changes_requested" ||
  v === "pending_review" ||
  v === "activation_pending" ||
  v === "active";
export const nullableText = (v: unknown) => v === null || str(v);
const file = (v: unknown): v is { name: string; expires_on?: string } =>
  record(v) &&
  text(v.name) &&
  (v.expires_on === undefined || str(v.expires_on));
function answer(v: unknown): v is Answer {
  return (
    str(v) ||
    typeof v === "boolean" ||
    file(v) ||
    (record(v) &&
      str(v.line1) &&
      str(v.city) &&
      str(v.country) &&
      ["line2", "region", "postcode"].every(
        (key) => v[key] === undefined || str(v[key]),
      ))
  );
}
function field(v: unknown): v is RegistrationField {
  if (
    !record(v) ||
    !text(v.key) ||
    !str(v.label) ||
    !str(v.type) ||
    ![
      "text",
      "email",
      "tel",
      "number",
      "date",
      "select",
      "checkbox",
      "address",
      "file",
    ].includes(v.type) ||
    typeof v.required !== "boolean" ||
    typeof v.enabled !== "boolean" ||
    typeof v.expiry !== "boolean" ||
    !Array.isArray(v.options) ||
    !v.options.every(str)
  )
    return false;
  if (v.validation !== undefined) {
    if (!record(v.validation)) return false;
    const validation = v.validation;
    if (
      !["minLength", "maxLength", "minDigits", "maxDigits", "min", "max"].every(
        (key) => validation[key] === undefined || number(validation[key]),
      ) ||
      !["pattern", "patternMessage"].every(
        (key) => validation[key] === undefined || str(validation[key]),
      )
    )
      return false;
  }
  return true;
}
function vehicle(v: unknown): v is Vehicle {
  return (
    record(v) &&
    text(v.model_id) &&
    (v.fuel_type_id === undefined || str(v.fuel_type_id)) &&
    number(v.year) &&
    str(v.registration_number) &&
    str(v.colour) &&
    record(v.documents) &&
    file(v.documents.registration_certificate) &&
    file(v.documents.insurance) &&
    (v.documents.pollution_certificate === undefined ||
      file(v.documents.pollution_certificate))
  );
}
export function form(v: unknown): v is RegistrationForm {
  return (
    record(v) &&
    text(v.application_id) &&
    state(v.state) &&
    str(v.source) &&
    text(v.email) &&
    (v.drive_mode === null ||
      v.drive_mode === "own_vehicle" ||
      v.drive_mode === "fleet_partner") &&
    (v.vehicle === null || vehicle(v.vehicle)) &&
    number(v.form_version) &&
    str(v.expires_at) &&
    Number.isFinite(Date.parse(v.expires_at)) &&
    nullableText(v.reason) &&
    record(v.answers) &&
    Object.values(v.answers).every(answer) &&
    Array.isArray(v.fields) &&
    v.fields.every(field) &&
    new Set(v.fields.map((item) => item.key)).size === v.fields.length
  );
}
export function options(v: unknown): v is VehicleOptions {
  return (
    record(v) &&
    Array.isArray(v.types) &&
    v.types.every(
      (item) => record(item) && text(item.type_id) && str(item.name),
    ) &&
    Array.isArray(v.brands) &&
    v.brands.every(
      (item) =>
        record(item) &&
        text(item.brand_id) &&
        text(item.type_id) &&
        str(item.name),
    ) &&
    Array.isArray(v.models) &&
    v.models.every(
      (item) =>
        record(item) &&
        text(item.model_id) &&
        text(item.brand_id) &&
        text(item.type_id) &&
        str(item.name) &&
        number(item.passenger_capacity) &&
        number(item.luggage_capacity) &&
        Array.isArray(item.fuel_types) &&
        item.fuel_types.every(
          (fuel) => record(fuel) && text(fuel.fuel_type_id) && str(fuel.name),
        ),
    )
  );
}
export function invalid(): never {
  throw new DriverApiError(200, "invalid_response");
}

