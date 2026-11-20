import {
  BASE_URL_DEV,
  BUCKET_URL,
  BASE_URL_PROD,
  GOOGLE_MAP_API_KEY,
  GOOGLE_ROUTES_API_KEY,
  DRIVER_API_BASE_URL_DEV,
  DRIVER_API_BASE_URL_PROD,
  UNIRIDE_WORKSPACE,
} from "@env";

let MODE: "DEV" | "PROD" = __DEV__ ? "DEV" : "PROD";

const configuredBaseUrl = MODE === "DEV" ? BASE_URL_DEV : BASE_URL_PROD;
export const BASE_URL = `${configuredBaseUrl}`.replace(/\/+$/, "");
export const SOCKET_URL = BASE_URL;
export const API_URL = `${BASE_URL}/api/v1`;
export const ASSETS_URL = `${BUCKET_URL}`;
export const GOOGLE_API_KEY = GOOGLE_MAP_API_KEY;
export const GOOGLE_ROUTES_KEY = GOOGLE_ROUTES_API_KEY;
// Driver endpoints are /v1, independent of the retained legacy /api/v1 client.
const driverOrigin = (__DEV__ ? DRIVER_API_BASE_URL_DEV : DRIVER_API_BASE_URL_PROD) ?? '';
export const DRIVER_API_URL = driverOrigin.trim() ? `${driverOrigin.trim().replace(/\/+$/, '')}/v1` : '';
export const DRIVER_WORKSPACE = (UNIRIDE_WORKSPACE ?? 'uniride').trim().toLowerCase();

export const ENDPOINTS = {
  DRIVER_AUTH: {
    LOGIN: '/driver-auth/login',
  },
  DRIVER_REGISTRATION: {
    EMAIL_CODE: '/driver-registration/email-code',
    VERIFY: '/driver-registration/verify',
    PASSWORD: '/driver-registration/password',
    PHONE: '/driver-registration/phone',
    FORM: '/driver-registration/form',
    VEHICLE_OPTIONS: '/driver-registration/vehicle-options',
    FILES: '/driver-registration/files',
    SUBMIT: '/driver-registration/submit',
  },
  AUTH: {
    LOGIN: "auth/otp/send",
    OTP_VERIFY: "auth/otp/verify",
    RESEND_OTP: "auth/otp/resend",
    REFRESH_TOKEN: "auth/token/refresh",
    LOGOUT: "auth/logout",
  },
  CUSTOMER_AUTH: {
    REQUEST_PHONE_OTP: "customer-auth/otp/phone",
    REQUEST_EMAIL_OTP: "customer-auth/otp/email",
    VERIFY_OTP: "customer-auth/otp/verify",
    LOGOUT: "customer-auth/logout",
  },
  CUSTOMER: {
    CUSTOMERS: "customers",
    CUSTOMER_BY_ID: (id: string) => `customers/${id}`,
  },
  ONBOARDING: {
    ONBOARDING_STATUS: "onboarding/status",
  },
  USER: {
    USER: "onboarding/profile",
  },
  COMMON: {
    CONFIG: "config/all",
  },
  SERVICE: {
    SERVICE_PROVIDERS: "customer-services",
  },
};
