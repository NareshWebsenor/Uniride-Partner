import AsyncStorage from '@react-native-async-storage/async-storage';
import { ASYNC_KEYS } from '@/constants/storage';
import { useAuthStore } from '@/store/authStore';

export type StartupDestination = { name: 'MainStack' };

function hasStoredToken(raw: string | null): boolean {
  if (!raw?.trim()) {
    return false;
  }
  try {
    const value: unknown = JSON.parse(raw);
    return typeof value === 'string' && value.trim().length > 0;
  } catch {
    // The existing REST client stores refresh results as raw opaque strings.
    return !/[\s{}[\]"]/.test(raw);
  }
}

function isSessionActive(expiresAtRaw: string | null): boolean {
  if (!expiresAtRaw) {
    return true;
  }
  const expiresAt = Number(expiresAtRaw);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

/** Reads the locally cached customer session; this does not validate it with the API. */
export async function hasActiveCustomerSession(): Promise<boolean> {
  const values = await AsyncStorage.multiGet([
    ASYNC_KEYS.ACCESS_TOKEN,
    ASYNC_KEYS.ACCESS_TOKEN_EXPIRES_AT,
  ]);
  const preferences = new Map(values);
  const token = preferences.get(ASYNC_KEYS.ACCESS_TOKEN) ?? null;
  const expiresAt = preferences.get(ASYNC_KEYS.ACCESS_TOKEN_EXPIRES_AT) ?? null;
  if (hasStoredToken(token) && isSessionActive(expiresAt)) {
    return true;
  }
  if (hasStoredToken(token) && expiresAt) {
    await AsyncStorage.multiRemove([
      ASYNC_KEYS.ACCESS_TOKEN,
      ASYNC_KEYS.ACCESS_TOKEN_EXPIRES_AT,
      ASYNC_KEYS.REFRESH_TOKEN,
    ]);
    useAuthStore.setState({ token: null, refreshToken: null });
  }
  return false;
}

// Login, onboarding and KYC no longer participate in starter navigation.
// Keep the session helper above for the preserved, inactive biometric gate.
export async function readStartupDestination(): Promise<StartupDestination> {
  return { name: 'MainStack' };
}
