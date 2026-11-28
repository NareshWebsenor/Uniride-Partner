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
    (v.fuel_type_id === undefined || v.fuel_type_id === null || str(v.fuel_type_id)) &&
    number(v.year) &&
    str(v.registration_number) &&
    str(v.colour) &&
    record(v.documents) &&
    file(v.documents.registration_certificate) &&
    file(v.documents.insurance) &&
    (v.documents.pollution_certificate === undefined ||
      v.documents.pollution_certificate === null ||
      file(v.documents.pollution_certificate))
  );
}
export function normalizeVehicle(v: unknown): Vehicle | null {
  if (!vehicle(v)) return null;
  return {
    model_id: v.model_id,
    ...(text(v.fuel_type_id) ? { fuel_type_id: v.fuel_type_id } : {}),
    year: v.year,
    registration_number: v.registration_number,
    colour: v.colour,
    documents: {
      registration_certificate: v.documents.registration_certificate,
      insurance: v.documents.insurance,
      ...(v.documents.pollution_certificate
        ? { pollution_certificate: v.documents.pollution_certificate }
        : {}),
    },
  };
}
export function form(v: unknown): v is RegistrationForm {
  return (
    record(v) &&
    str(v.application_id) &&
    state(v.state) &&
    str(v.source) &&
    text(v.email) &&
    (v.drive_mode === null ||
      v.drive_mode === "own_vehicle" ||
      v.drive_mode === "fleet_partner") &&
    (v.vehicle === null || vehicle(v.vehicle)) &&
    number(v.form_version) &&
    str(v.expires_at) &&
    (!v.expires_at || Number.isFinite(Date.parse(v.expires_at))) &&
    nullableText(v.reason) &&
    record(v.answers) &&
    Object.values(v.answers).every(answer) &&
    Array.isArray(v.fields) &&
    v.fields.every(field) &&
    new Set(v.fields.map((item) => item.key)).size === v.fields.length
  );
}
const optionalCount = (v: unknown) =>
  v === undefined || v === null || number(v);

export function normalizeVehicleOptions(v: unknown): VehicleOptions | null {
  if (!record(v) || !Array.isArray(v.types) || !Array.isArray(v.brands) || !Array.isArray(v.models)) {
    return null;
  }
  const types: VehicleOptions["types"] = [];
  for (const item of v.types) {
    if (!record(item) || !str(item.name)) return null;
    const type_id = text(item.type_id) ? item.type_id : text(item.id) ? item.id : "";
    if (!type_id) return null;
    types.push({
      type_id,
      name: item.name,
      ...(item.image_url === null || str(item.image_url) ? { image_url: item.image_url } : {}),
    });
  }
  const brands: VehicleOptions["brands"] = [];
  for (const item of v.brands) {
    if (!record(item) || !str(item.name) || !text(item.type_id)) return null;
    const brand_id = text(item.brand_id) ? item.brand_id : text(item.id) ? item.id : "";
    if (!brand_id) return null;
    brands.push({
      brand_id,
      type_id: item.type_id,
      name: item.name,
      ...(item.image_url === null || str(item.image_url) ? { image_url: item.image_url } : {}),
    });
  }
  const models: VehicleOptions["models"] = [];
  for (const item of v.models) {
    if (
      !record(item) ||
      !text(item.brand_id) ||
      !text(item.type_id) ||
      !str(item.name) ||
      !optionalCount(item.passenger_capacity) ||
      !optionalCount(item.luggage_capacity)
    ) {
      return null;
    }
    const model_id = text(item.model_id) ? item.model_id : text(item.id) ? item.id : "";
    if (!model_id) return null;
    const rawFuels = item.fuel_types ?? item.fuels ?? item.fuel_options;
    if (rawFuels !== undefined && rawFuels !== null && !Array.isArray(rawFuels)) {
      return null;
    }
    const fuel_types: VehicleOptions["models"][number]["fuel_types"] = [];
    for (const fuel of rawFuels ?? []) {
      if (!record(fuel) || !str(fuel.name)) return null;
      const fuel_type_id = text(fuel.fuel_type_id) ? fuel.fuel_type_id : text(fuel.id) ? fuel.id : "";
      if (!fuel_type_id) return null;
      fuel_types.push({
        fuel_type_id,
        name: fuel.name,
        ...(fuel.image_url === null || str(fuel.image_url) ? { image_url: fuel.image_url } : {}),
      });
    }
    models.push({
      model_id,
      brand_id: item.brand_id,
      type_id: item.type_id,
      name: item.name,
      ...(item.image_url === null || str(item.image_url) ? { image_url: item.image_url } : {}),
      passenger_capacity: number(item.passenger_capacity) ? item.passenger_capacity : 0,
      luggage_capacity: number(item.luggage_capacity) ? item.luggage_capacity : 0,
      fuel_types,
    });
  }
  const categories: VehicleOptions["categories"] = [];
  if (Array.isArray(v.categories)) {
    for (const item of v.categories) {
      if (record(item) && text(item.category_id) && str(item.name)) {
        categories.push({
          category_id: item.category_id,
          name: item.name,
          ...(str(item.booking_tier) ? { booking_tier: item.booking_tier } : {}),
          ...(item.image_url === null || str(item.image_url) ? { image_url: item.image_url } : {}),
        });
      }
    }
  }
  let fields: RegistrationField[] | undefined;
  if (Array.isArray(v.fields)) {
    const enabledFields = v.fields.filter(
      (item) => !(record(item) && item.enabled === false),
    );
    if (!enabledFields.every(field)) return null;
    fields = enabledFields;
  }
  return {
    types,
    brands,
    models,
    ...(categories.length ? { categories } : {}),
    ...(fields ? { fields } : {}),
  };
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

