import {
  BASE_URL_DEV,
  BUCKET_URL,
  BASE_URL_PROD,
  GOOGLE_MAP_API_KEY,
} from '@env';

let MODE: 'DEV' | 'PROD' = __DEV__ ? 'DEV' : 'PROD';

const configuredBaseUrl = MODE === 'DEV' ? BASE_URL_DEV : BASE_URL_PROD;
export const BASE_URL = `${configuredBaseUrl}`.replace(/\/+$/, '');
export const SOCKET_URL = BASE_URL;
export const API_URL = `${BASE_URL}/v1`;
export const ASSETS_URL = `${BUCKET_URL}`;
export const GOOGLE_API_KEY = GOOGLE_MAP_API_KEY;

export const ENDPOINTS = {
  AUTH: {
    LOGIN: 'auth/otp/send',
    OTP_VERIFY: 'auth/otp/verify',
    RESEND_OTP: 'auth/otp/resend',
    REFRESH_TOKEN: 'auth/token/refresh',
    LOGOUT: 'auth/logout',
  },
  CUSTOMER_AUTH: {
    REQUEST_PHONE_OTP: 'customer-auth/otp/phone',
    REQUEST_EMAIL_OTP: 'customer-auth/otp/email',
    VERIFY_OTP: 'customer-auth/otp/verify',
    LOGOUT: 'customer-auth/logout',
  },
  CUSTOMER: {
    CUSTOMERS: 'customers',
    CUSTOMER_BY_ID: (id: string) => `customers/${id}`,
  },
  ONBOARDING: {
    ONBOARDING_STATUS: 'onboarding/status',
  },
  USER: {
    USER: 'onboarding/profile',
  },
  COMMON: {
    CONFIG: 'config/all',
  },
  SERVICE: {
    SERVICE_PROVIDERS: 'customer-services',
  },
};
