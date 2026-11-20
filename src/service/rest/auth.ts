import type {
  DriverLoginResponse,
  EmailCodePayload,
  EmailCodeResponse,
  RegistrationForm,
  SubmitPayload,
  VehicleOptions,
  VerifyResponse,
} from "@/interface/driverRegistration.type";
import type { LocalUpload } from "@/interface/driverOnboarding.type";
import { isDriverUser } from "@/service/driverSession";
import { DriverApiError } from "./driverClient";
import { _makeAxiosPostRequest } from "./index";
import { ENDPOINTS } from "../config";
import {
  record,
  str,
  text,
  number,
  state,
  nullableText,
  form,
  options,
  invalid,
} from "./registrationResponse";
import { isRegistrationPhoneKey } from "@/utils/registrationContact";

const AUTH_REQUEST = { api: "driver" } as const;
const MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_BYTES = 5 * 1024 * 1024;
export async function sendEmailCode({
  first_name,
  last_name,
  email,
}: EmailCodePayload): Promise<EmailCodeResponse> {
  const result = await _makeAxiosPostRequest(
    ENDPOINTS.DRIVER_REGISTRATION.EMAIL_CODE,
    { first_name, last_name, email },
    AUTH_REQUEST,
  );
  if (
    !record(result) ||
    !str(result.message) ||
    !number(result.expires_in) ||
    result.expires_in <= 0 ||
    typeof result.email_sent !== "boolean"
  )
    return invalid();
  // Explicit dev-only convenience; production always discards this field.
  return {
    message: result.message,
    expires_in: result.expires_in,
    email_sent: result.email_sent,
    ...(__DEV__ &&
    str(result.development_code) &&
    /^\d{6}$/.test(result.development_code)
      ? { development_code: result.development_code }
      : {}),
  };
}
export async function verifyEmailCode(
  email: string,
  code: string,
): Promise<VerifyResponse> {
  const result = await _makeAxiosPostRequest(
    ENDPOINTS.DRIVER_REGISTRATION.VERIFY,
    { email, code },
    AUTH_REQUEST,
  );

  if (!record(result) || !text(result.application_id) || !state(result.state))
    return invalid();
  if (result.state === "invited" || result.state === "changes_requested") {
    if (!text(result.token) || !nullableText(result.reason)) return invalid();
    return {
      state: result.state,
      application_id: result.application_id,
      token: result.token,
      reason: str(result.reason) ? result.reason : null,
    };
  }
  return { state: result.state, application_id: result.application_id };
}
export async function setRegistrationPassword(
  token: string,
  password: string,
): Promise<{ password_set: true }> {
  const result = await _makeAxiosPostRequest(
    ENDPOINTS.DRIVER_REGISTRATION.PASSWORD,
    { token, password },
    AUTH_REQUEST,
  );

  if (!record(result) || result.password_set !== true) return invalid();
  return { password_set: true };
}
export async function setRegistrationPhone(
  token: string,
  phone: string,
): Promise<{ phone: string }> {
  const result = await _makeAxiosPostRequest(
    ENDPOINTS.DRIVER_REGISTRATION.PHONE,
    { token, phone },
    AUTH_REQUEST,
  );
  if (!record(result) || !text(result.phone)) return invalid();
  return { phone: result.phone };
}
export async function loadRegistrationForm(
  token: string,
): Promise<RegistrationForm> {
  console.log("asdf");

  const received = await _makeAxiosPostRequest(
    ENDPOINTS.DRIVER_REGISTRATION.FORM,
    { token },
    AUTH_REQUEST,
  );
  console.log("123-->", received);

  if (
    !record(received) ||
    !Array.isArray(received.fields) ||
    !record(received.answers)
  )
    return invalid();
  // Disabled controls are not part of this client's form contract. A workspace
  // can leave a newer, unsupported field disabled without breaking older apps.
  const disabledKeys = new Set(
    received.fields.flatMap((item) =>
      record(item) && item.enabled === false && str(item.key) ? [item.key] : [],
    ),
  );
  const result = {
    ...received,
    fields: received.fields.filter(
      (item) => !(record(item) && item.enabled === false),
    ),
    answers: Object.fromEntries(
      Object.entries(received.answers).filter(
        ([key]) => !disabledKeys.has(key),
      ),
    ),
  };
  if (!form(result)) return invalid();
  // The admin-only assignment is deliberately excluded from client data.
  return { ...result, driver_type: null };
}
export async function loadVehicleOptions(
  token: string,
): Promise<VehicleOptions> {
  const result = await _makeAxiosPostRequest(
    ENDPOINTS.DRIVER_REGISTRATION.VEHICLE_OPTIONS,
    { token },
    AUTH_REQUEST,
  );
  return options(result) ? result : invalid();
}
export async function submitRegistration(
  payload: SubmitPayload,
): Promise<{ id: string; state: "pending_review" }> {
  // Also strip legacy phone answers loaded from drafts created by earlier builds.
  const answers = Object.fromEntries(
    Object.entries(payload.answers).filter(
      ([key]) => !isRegistrationPhoneKey(key),
    ),
  );
  console.log("wqsdefra", payload);

  const result = await _makeAxiosPostRequest(
    ENDPOINTS.DRIVER_REGISTRATION.SUBMIT,
    { ...payload, answers },
    AUTH_REQUEST,
  );
  console.log("werf--->", result);

  if (!record(result) || !text(result.id) || result.state !== "pending_review")
    return invalid();
  return { id: result.id, state: result.state };
}
export async function loginDriver(
  email: string,
  password: string,
): Promise<DriverLoginResponse> {
  const result = await _makeAxiosPostRequest(
    ENDPOINTS.DRIVER_AUTH.LOGIN,
    { email, password },
    AUTH_REQUEST,
  );
  if (
    !record(result) ||
    !text(result.session) ||
    result.token_type !== "Bearer" ||
    !number(result.expires_in) ||
    result.expires_in <= 0 ||
    !isDriverUser(result.user)
  )
    return invalid();
  if (result.user.mfa_required) throw new DriverApiError(403, "mfa_required");
  return {
    session: result.session,
    token_type: "Bearer",
    expires_in: result.expires_in,
    user: result.user,
  };
}
export async function uploadRegistrationFile(
  token: string,
  selected: LocalUpload,
): Promise<{ name: string }> {
  if (!MIME_TYPES.includes(selected.mime))
    throw new DriverApiError(400, "unsupported_file");
  // A provider may omit metadata size; callers normalize that to zero. The
  // bytes read below remain authoritative, including for apparently small files.
  if (!Number.isFinite(selected.size) || selected.size < 0)
    throw new DriverApiError(400, "invalid_file");
  if (selected.size > MAX_BYTES)
    throw new DriverApiError(413, "file_too_large");
  if (!/^(file|content):\/\//.test(selected.uri))
    throw new DriverApiError(400, "invalid_file");
  let blob: Blob;
  try {
    const local = await fetch(selected.uri);
    blob = await local.blob();
  } catch {
    throw new DriverApiError(0, "file_unavailable");
  }
  try {
    if (!Number.isFinite(blob.size) || blob.size <= 0)
      throw new DriverApiError(400, "invalid_file");
    if (blob.size > MAX_BYTES) throw new DriverApiError(413, "file_too_large");
    const result = await _makeAxiosPostRequest(
      ENDPOINTS.DRIVER_REGISTRATION.FILES,
      blob,
      {
        ...AUTH_REQUEST,
        headers: {
          "X-Driver-Invitation": token,
          "Content-Type": selected.mime,
        },
      },
    );
    if (!record(result) || !text(result.name)) return invalid();
    return { name: result.name };
  } finally {
    // React Native exposes close(); browser/Jest Blob does not.
    if ("close" in blob && typeof blob.close === "function") blob.close();
  }
}
