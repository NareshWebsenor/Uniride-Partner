import axios from 'axios';
import { DRIVER_API_URL, DRIVER_WORKSPACE } from '@/service/config';
import { clearDriverSession, getDriverSessionToken } from '@/service/driverSession';
import { logger } from '@/utils/logger';

export class DriverApiError extends Error {
  constructor(public readonly status: number, public readonly code: string,
    message = '', public readonly retryAfterSeconds?: number) {
    super(message); this.name = 'DriverApiError';
  }
}
export function parseRetryAfter(value: string | null): number | undefined {
  if (!value?.trim()) return undefined;
  const seconds = /^\d+$/.test(value.trim()) ? Number(value) : (Date.parse(value) - Date.now()) / 1000;
  return Number.isFinite(seconds) ? Math.max(0, Math.ceil(seconds)) : undefined;
}
function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
type Options = {
  method?: 'GET' | 'POST'; body?: unknown; params?: Record<string, unknown>;
  authenticated?: boolean; headers?: Record<string, string>; rawBody?: Blob | { uri: string };
  signal?: AbortSignal;
};

// A separate Axios instance prevents legacy refresh interceptors and tokens
// from reaching driver registration. Helpers in index.ts select this client.
export const driverClient = axios.create({
  baseURL: DRIVER_API_URL,
  timeout: 30000,
  validateStatus: () => true,
});

/** Driver APIs deliberately have no legacy customer refresh interceptor. */
export async function driverRequest<T = unknown>(path: string, options: Options = {}): Promise<T> {
  if (!DRIVER_API_URL || !DRIVER_WORKSPACE) throw new DriverApiError(0, 'configuration');
  if (!/^\/(driver-registration|driver-auth|driver)(\/|$)/.test(path)) throw new DriverApiError(0, 'invalid_path');
  const token = options.authenticated ? await getDriverSessionToken() : null;
  if (options.authenticated && !token) throw new DriverApiError(401, 'session_expired');
  if (options.signal?.aborted) throw new DriverApiError(0, 'aborted');
  const controller = new AbortController();
  let cancel = (_code: string) => {};
  const cancellation = new Promise<never>((_resolve, reject) => {
    cancel = code => { reject(new DriverApiError(0, code)); controller.abort(); };
  });
  const onAbort = () => cancel('aborted');
  options.signal?.addEventListener('abort', onAbort, { once: true });
  const timeout = setTimeout(() => cancel('timeout'), 30000);
  const startedAt = Date.now();
  try {
    const request = async () => {
      const response = await driverClient.request<T>({
        url: path,
        method: options.method ?? (options.body === undefined && !options.rawBody ? 'GET' : 'POST'),
        headers: { 'Content-Type': 'application/json', ...options.headers,
          'X-Uniride-Workspace': DRIVER_WORKSPACE,
          ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        data: options.rawBody ?? options.body,
        ...(options.rawBody ? { transformRequest: [(raw: unknown) => raw] } : {}),
        params: options.params,
        signal: controller.signal,
      });
      if (controller.signal.aborted) throw new DriverApiError(0, 'aborted');
      if (response.status === 401 && options.authenticated && token === await getDriverSessionToken()) {
        await clearDriverSession();
      }
      const data = response.data;
      const retryHeader: unknown = response.headers['retry-after'];
      const retryAfter = parseRetryAfter(typeof retryHeader === 'string' ? retryHeader : null);
      if (response.status < 200 || response.status >= 300) {
        const error = record(data) && record(data.error) ? data.error : {};
        const code =
          typeof error.code === 'string'
            ? error.code
            : record(data) && typeof data.code === 'string'
              ? data.code
              : 'request_failed';
        const message =
          typeof error.message === 'string'
            ? error.message
            : record(data) && typeof data.message === 'string'
              ? data.message
              : record(data) && typeof data.error === 'string'
                ? data.error
                : record(data) && typeof data.detail === 'string'
                  ? data.detail
                  : '';
        throw new DriverApiError(response.status, code, message, retryAfter);
      }
      if (typeof data === 'string') throw new DriverApiError(response.status, 'invalid_response');
      // Endpoint adapters validate their own response schema before exposing it.
      return data;
    };
    const result = await Promise.race([request(), cancellation]);
    logger.debug('driver_api.completed', { scope: 'driver_api', durationMs: Date.now() - startedAt });
    return result;
  } catch (error) {
    const code = axios.isCancel(error) ? 'aborted'
      : axios.isAxiosError(error) && (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') ? 'timeout' : 'network';
    const failure = error instanceof DriverApiError ? error : new DriverApiError(0, code);
    // Codes/messages from the server may contain user data; log path/status/code only.
    logger.warn('driver_api.failed', {
      scope: path,
      status: failure.status,
      code: failure.code,
    });
    throw failure;
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', onAbort);
  }
}
