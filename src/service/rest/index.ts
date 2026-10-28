import axios, { type AxiosRequestConfig } from 'axios';
import { API_URL } from '../config';
import { ASYNC_KEYS } from '@/utils/contant.utils';
import { getAsyncStorage } from '@/utils/helper.utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { refreshTokenRequest } from './CommonApi';
import { useGeneralStore } from '@/store/generalStore';
import { useAuthStore } from '@/store/authStore';

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipAuth?: boolean;
  }
}

// ------------------ CREATE CLIENT ------------------
export const client = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Uniride-Workspace': 'uniride',
  },
});

// ------------------ TOKEN CACHE ------------------
let cachedToken: string | null = null;

const getToken = async () => {
  const expiresAtValue = await AsyncStorage.getItem(
    ASYNC_KEYS.ACCESS_TOKEN_EXPIRES_AT,
  );
  if (expiresAtValue) {
    const expiresAt = Number(expiresAtValue);
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      await clearTokens();
      return null;
    }
  }
  if (cachedToken) return cachedToken;
  cachedToken = await getAsyncStorage(ASYNC_KEYS.ACCESS_TOKEN);
  return cachedToken;
};

const setToken = async (token: string) => {
  cachedToken = token;
  await AsyncStorage.setItem(ASYNC_KEYS.ACCESS_TOKEN, token);
  await AsyncStorage.removeItem(ASYNC_KEYS.ACCESS_TOKEN_EXPIRES_AT);
};

export const setCustomerSessionToken = async (
  token: string,
  expiresInSeconds: number,
) => {
  await setToken(token);
  await AsyncStorage.setItem(
    ASYNC_KEYS.ACCESS_TOKEN_EXPIRES_AT,
    String(Date.now() + expiresInSeconds * 1000),
  );
};

export const clearTokens = async () => {
  cachedToken = null;
  delete client.defaults.headers.Authorization;
  await AsyncStorage.multiRemove([
    ASYNC_KEYS.ACCESS_TOKEN,
    ASYNC_KEYS.ACCESS_TOKEN_EXPIRES_AT,
    ASYNC_KEYS.REFRESH_TOKEN,
  ]);
  useAuthStore.setState({ token: null, refreshToken: null });
};

// ------------------ REQUEST INTERCEPTOR ------------------
client.interceptors.request.use(
  async config => {
    const token = config.skipAuth ? null : await getToken();

    if (config.skipAuth || !token) {
      delete config.headers.Authorization;
    } else {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data';
    }

    return config;
  },
  error => Promise.reject(error),
);

// ------------------ REFRESH QUEUE ------------------
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    error ? prom.reject(error) : prom.resolve(token);
  });
  failedQueue = [];
};

// ------------------ RESPONSE INTERCEPTOR ------------------
client.interceptors.response.use(
  response => response.data,

  async error => {
    const originalRequest = error.config;
    const status = error?.response?.status;

    // ---------- HANDLE 401 WITH REFRESH ----------
    if (
      status === 401 &&
      !originalRequest?.skipAuth &&
      !originalRequest?._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return client(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newAccessToken = await refreshTokenRequest();
        if (!newAccessToken) {
          throw new Error('Refresh response did not include a session token');
        }
        await setToken(newAccessToken);

        client.defaults.headers.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return client(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await clearTokens();
        useGeneralStore.getState().setIsUnAutharized(true);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject({
      status,
      code: error?.code,
      hasResponse: Boolean(error?.response),
      message:
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message ||
        'Something went wrong',
      data: error?.response?.data,
    });
  },
);

// ------------------ API WRAPPERS ------------------
export const _makeAxiosGetRequest = (url: string, params = {}) =>
  client.get(url, { params });

export const _makeAxiosPostRequest = <TResponse = unknown>(
  url: string,
  payload = {},
  config: AxiosRequestConfig = {},
): Promise<TResponse> =>
  client.post(url, payload, config) as unknown as Promise<TResponse>;

export const _makeAxiosPutRequest = (url: string, payload = {}) =>
  client.put(url, payload);

export const _makeAxiosDeleteRequest = (url: string, payload = {}) =>
  client.delete(url, { data: payload });

// ------------------ MULTIPART WRAPPER ------------------
export const axiosMultipart = (endpoint: string, payload: FormData) =>
  client.post(endpoint, payload);
