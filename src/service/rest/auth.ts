import type {
  DriveMode,
  DriveModeResponse,
  DriverLoginResponse,
  DriverProfile,
  EmailCodePayload,
  EmailCodeResponse,
  InvitationCodeResponse,
  PhoneCodeResponse,
  PhoneVerifyResponse,
  RegistrationForm,
  SubmitPayload,
  SubmitResponse,
  VehicleOptions,
  VerifyResponse,
} from "@/interface/driverRegistration.type";
import type { LocalUpload } from "@/interface/driverOnboarding.type";
import { isDriverUser } from "@/service/driverSession";
import { logger } from "@/utils/logger";
import { driverRequest, DriverApiError } from "./driverClient";
import { _makeAxiosGetRequest, _makeAxiosPostRequest } from "./index";
import { DRIVER_API_URL, DRIVER_WORKSPACE, ENDPOINTS } from "../config";
import {
  record,
  str,
  text,
  number,
  state,
  nullableText,
  form,
  normalizeVehicle,
  normalizeVehicleOptions,
  invalid,
} from "./registrationResponse";
import { isRegistrationPhoneKey } from "@/utils/registrationContact";

const AUTH_REQUEST = { api: "driver" } as const;
const MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_BYTES = 5 * 1024 * 1024;
const devOtp = (value: unknown, length: number) =>
  __DEV__ && str(value) && new RegExp(`^\\d{${length}}$`).test(value)
    ? value
    : undefined;

export async function sendEmailCode({
  email,
}: EmailCodePayload): Promise<EmailCodeResponse> {
  const result = await _makeAxiosPostRequest(
    ENDPOINTS.DRIVER_REGISTRATION.EMAIL_CODE,
    { email },
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
  const development_code = devOtp(result.development_code, 4);
  return {
    message: result.message,
    expires_in: result.expires_in,
    email_sent: result.email_sent,
    ...(development_code ? { development_code } : {}),
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

  if (
    !record(result) ||
    !state(result.state) ||
    (result.application_id !== undefined && !str(result.application_id))
  )
    return invalid();
  const application_id = str(result.application_id)
    ? result.application_id
    : "";
  if (result.state === "invited" || result.state === "changes_requested") {
    if (
      !text(result.token) ||
      typeof result.phone_required !== "boolean" ||
      typeof result.phone_verified !== "boolean" ||
      (result.reason !== undefined && !nullableText(result.reason))
    )
      return invalid();
    return {
      state: result.state,
      application_id,
      token: result.token,
      phone_required: result.phone_required,
      phone_verified: result.phone_verified,
      reason: str(result.reason) ? result.reason : null,
    };
  }
  return { state: result.state, application_id };
}

export async function setRegistrationPhone(
  token: string,
  phone: string,
): Promise<PhoneCodeResponse> {
  const result = await _makeAxiosPostRequest(
    ENDPOINTS.DRIVER_REGISTRATION.PHONE,
    { token, phone },
    AUTH_REQUEST,
  );
  if (
    !record(result) ||
    (!text(result.phone) &&
      !text(result.message) &&
      typeof result.sms_sent !== "boolean") ||
    (result.phone !== undefined && !text(result.phone)) ||
    (result.expires_in !== undefined &&
      (!number(result.expires_in) || result.expires_in <= 0))
  )
    return invalid();
  const development_code = devOtp(result.development_code, 4);
  return {
    phone: text(result.phone) ? result.phone : phone,
    ...(number(result.expires_in) ? { expires_in: result.expires_in } : {}),
    ...(development_code ? { development_code } : {}),
  };
}

export async function verifyRegistrationPhone(
  token: string,
  code: string,
): Promise<PhoneVerifyResponse> {
  const result = await _makeAxiosPostRequest(
    ENDPOINTS.DRIVER_REGISTRATION.PHONE_VERIFY,
    { token, code },
    AUTH_REQUEST,
  );
  if (!record(result) || !text(result.phone) || result.phone_verified !== true)
    return invalid();
  return { phone: result.phone, phone_verified: true };
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

export async function setRegistrationDriveMode(
  token: string,
  drive_mode: DriveMode,
): Promise<DriveModeResponse> {
  const result = await _makeAxiosPostRequest(
    ENDPOINTS.DRIVER_REGISTRATION.DRIVE_MODE,
    { token, drive_mode },
    AUTH_REQUEST,
  );
  console.log("drive mode response:", result);

  if (
    !record(result) ||
    typeof result.invitation_code_required !== "boolean" ||
    (result.drive_mode !== undefined &&
      result.drive_mode !== "fleet_partner" &&
      result.drive_mode !== "own_vehicle")
  )
    return invalid();
  return {
    invitation_code_required: result.invitation_code_required,
    ...(result.drive_mode ? { drive_mode: result.drive_mode } : {}),
  };
}

export async function verifyInvitationCode(
  token: string,
  code: string,
): Promise<InvitationCodeResponse> {
  const result = await _makeAxiosPostRequest(
    ENDPOINTS.DRIVER_REGISTRATION.INVITATION_CODE,
    { token, code },
    AUTH_REQUEST,
  );
  if (!record(result) || result.invitation_code_accepted !== true)
    return invalid();
  return { invitation_code_accepted: true };
}

export async function loadRegistrationForm(
  token: string,
): Promise<RegistrationForm> {
  const received = await _makeAxiosPostRequest(
    ENDPOINTS.DRIVER_REGISTRATION.FORM,
    { token },
    AUTH_REQUEST,
  );

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
    application_id: str(received.application_id) ? received.application_id : "",
    source: str(received.source) ? received.source : "",
    drive_mode:
      received.drive_mode === undefined ? null : received.drive_mode,
    vehicle:
      received.vehicle === undefined || received.vehicle === null
        ? null
        : normalizeVehicle(received.vehicle),
    form_version: number(received.form_version) ? received.form_version : 1,
    expires_at: str(received.expires_at) ? received.expires_at : "",
    reason: received.reason === undefined ? null : received.reason,
    fields: received.fields
      .filter((item) => !(record(item) && item.enabled === false))
      .map((item) =>
        record(item)
          ? {
              ...item,
              options: Array.isArray(item.options) ? item.options : [],
              expiry:
                typeof item.expiry === "boolean" ? item.expiry : false,
              ...(item.validation === null
                ? { validation: undefined }
                : {}),
            }
          : item,
      ),
    answers: Object.fromEntries(
      Object.entries(received.answers).filter(
        ([key, val]) =>
          !disabledKeys.has(key) && val !== null && val !== undefined,
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
  console.log("vehicle options response:", result);

  const normalized = normalizeVehicleOptions(result);
  return normalized ?? invalid();
}

export async function submitRegistration(
  payload: SubmitPayload,
): Promise<SubmitResponse> {
  // Email and phone are owned by dedicated endpoints and must not enter form answers.
  const answers = Object.fromEntries(
    Object.entries(payload.answers).filter(
      ([key]) =>
        key !== "email" &&
        key !== "accept_terms" &&
        !isRegistrationPhoneKey(key),
    ),
  );

  const result = await _makeAxiosPostRequest(
    ENDPOINTS.DRIVER_REGISTRATION.SUBMIT,
    {
      token: payload.token,
      answers,
      ...(payload.vehicle ? { vehicle: payload.vehicle } : {}),
      accept_terms: payload.accept_terms,
    },
    AUTH_REQUEST,
  );

  if (
    !record(result) ||
    result.state !== "pending_review" ||
    (result.id !== undefined && !text(result.id))
  )
    return invalid();
  return {
    state: result.state,
    ...(text(result.id) ? { id: result.id } : {}),
  };
}

export async function getDriverProfile(): Promise<DriverProfile> {
  const result = await _makeAxiosGetRequest(
    ENDPOINTS.DRIVER.ME,
    {},
    { ...AUTH_REQUEST, authenticated: true },
  );
  if (!record(result)) return invalid();
  const source = record(result.user) ? result.user : result;
  if (!text(source.id) || !text(source.email) || !str(source.name))
    return invalid();
  return {
    id: source.id,
    email: source.email,
    name: source.name,
    ...(text(source.driver_id) ? { driver_id: source.driver_id } : {}),
    ...(source.phone === null || str(source.phone)
      ? { phone: source.phone }
      : {}),
    ...(str(source.status) ? { status: source.status } : {}),
  };
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

async function readLocalBlob(uri: string): Promise<Blob> {
  try {
    const local = await fetch(uri);
    return await local.blob();
  } catch {
    if (typeof XMLHttpRequest === "undefined") {
      throw new DriverApiError(0, "file_unavailable");
    }
    return new Promise<Blob>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = () => {
        if (xhr.response) resolve(xhr.response as Blob);
        else reject(new DriverApiError(0, "file_unavailable"));
      };
      xhr.onerror = () => reject(new DriverApiError(0, "file_unavailable"));
      xhr.responseType = "blob";
      xhr.open("GET", uri, true);
      xhr.send(null);
    });
  }
}

function isReactNativeRuntime(): boolean {
  return (
    typeof navigator !== "undefined" &&
    Reflect.get(navigator, "product") === "ReactNative"
  );
}

async function uploadViaNativeUriFetch(
  token: string,
  selected: LocalUpload,
): Promise<unknown> {
  const fallbackRes = await fetch(
    `${DRIVER_API_URL}${ENDPOINTS.DRIVER_REGISTRATION.FILES}`,
    {
      method: "POST",
      headers: {
        "X-Uniride-Workspace": DRIVER_WORKSPACE,
        "X-Driver-Invitation": token,
        "Content-Type": selected.mime,
      },
      body: { uri: selected.uri } as unknown as RequestInit["body"],
    },
  );
  const rawText = await fallbackRes.text();
  let parsed: unknown = null;
  try {
    parsed = rawText ? JSON.parse(rawText) : null;
  } catch {
    parsed = rawText;
  }
  if (fallbackRes.status < 200 || fallbackRes.status >= 300) {
    const errObj = record(parsed) && record(parsed.error) ? parsed.error : {};
    const msg =
      typeof errObj.message === "string"
        ? errObj.message
        : record(parsed) && typeof parsed.message === "string"
          ? parsed.message
          : record(parsed) && typeof parsed.error === "string"
            ? parsed.error
            : "";
    throw new DriverApiError(
      fallbackRes.status,
      typeof errObj.code === "string" ? errObj.code : "request_failed",
      msg,
    );
  }
  return parsed;
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
  let blob: Blob | undefined;
  try {
    blob = await readLocalBlob(selected.uri);
  } catch (failure) {
    const err =
      failure instanceof DriverApiError
        ? failure
        : new DriverApiError(0, "file_unavailable");
    logger.warn("driver_upload.read_failed", {
      scope: "upload_read",
      status: err.status,
      code: err.code,
    });
    // On React Native, fetch(uri)/XHR GET on local file:// or content:// URIs can
    // fail with file_unavailable even when NetworkingModule/RCTNetworking can
    // stream { uri } directly as the binary request body.
    if (!isReactNativeRuntime() || err.code !== "file_unavailable") {
      throw err;
    }
  }
  try {
    if (blob) {
      if (!Number.isFinite(blob.size) || blob.size <= 0)
        throw new DriverApiError(400, "invalid_file");
      if (blob.size > MAX_BYTES) throw new DriverApiError(413, "file_too_large");
    }
    const rawBody: Blob | { uri: string } = blob ?? { uri: selected.uri };
    let result: unknown;
    try {
      result = await driverRequest(ENDPOINTS.DRIVER_REGISTRATION.FILES, {
        method: "POST",
        rawBody,
        headers: {
          "X-Driver-Invitation": token,
          "Content-Type": selected.mime,
        },
      });
    } catch (uploadError) {
      if (
        uploadError instanceof DriverApiError &&
        uploadError.status === 0 &&
        uploadError.code === "network" &&
        isReactNativeRuntime() &&
        DRIVER_API_URL
      ) {
        result = await uploadViaNativeUriFetch(token, selected);
      } else {
        throw uploadError;
      }
    }
    const uploadedName = record(result)
      ? text(result.name)
        ? result.name
        : record(result.file) && text(result.file.name)
          ? result.file.name
          : text(result.filename)
            ? result.filename
            : ""
      : "";
    if (!uploadedName) return invalid();
    return { name: uploadedName };
  } catch (failure) {
    logger.warn("driver_upload.failed", {
      scope: "upload",
      status: failure instanceof DriverApiError ? failure.status : 0,
      code: failure instanceof DriverApiError ? failure.code : "unknown",
    });
    throw failure;
  } finally {
    // React Native exposes close(); browser/Jest Blob does not.
    if (blob && "close" in blob && typeof blob.close === "function") blob.close();
  }
}
