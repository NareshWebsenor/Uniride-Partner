import { GOOGLE_ROUTES_KEY } from '@/service/config';
import { logger } from '@/utils/logger';
import { decodePolyline, isRoutePoint, type RoutePoint } from '@/utils/polyline';

export type { RoutePoint } from '@/utils/polyline';

export type GoogleRoutesErrorCode =
  | 'missing_key' | 'invalid_coordinates' | 'no_route' | 'invalid_response'
  | 'http' | 'network' | 'aborted' | 'timeout';

export class GoogleRoutesError extends Error {
  constructor(
    public readonly code: GoogleRoutesErrorCode,
    public readonly status?: number,
  ) {
    super(code);
    this.name = 'GoogleRoutesError';
  }
}

const ROUTES_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';
const REQUEST_TIMEOUT_MS = 10_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readRoute(body: unknown): RoutePoint[] {
  if (!isRecord(body)) {
    throw new GoogleRoutesError('invalid_response');
  }
  // Protobuf JSON can omit empty repeated fields, producing {} for no routes.
  if (!('routes' in body) && Object.keys(body).length === 0) {
    throw new GoogleRoutesError('no_route');
  }
  if (!Array.isArray(body.routes)) {
    throw new GoogleRoutesError('invalid_response');
  }
  if (body.routes.length === 0) {
    throw new GoogleRoutesError('no_route');
  }
  const route: unknown = body.routes[0];
  if (!isRecord(route) || !isRecord(route.polyline) ||
      typeof route.polyline.encodedPolyline !== 'string') {
    throw new GoogleRoutesError('invalid_response');
  }
  try {
    const points = decodePolyline(route.polyline.encodedPolyline);
    if (points.length < 2) {
      throw new Error('insufficient_points');
    }
    return points;
  } catch {
    throw new GoogleRoutesError('invalid_response');
  }
}

/** Dedicated transport: app authentication headers must never reach Google. */
export async function fetchDrivingRoute(
  origin: RoutePoint,
  destination: RoutePoint,
  { signal }: { signal?: AbortSignal } = {},
): Promise<RoutePoint[]> {
  if (!GOOGLE_ROUTES_KEY?.trim()) {
    throw new GoogleRoutesError('missing_key');
  }
  if (!isRoutePoint(origin) || !isRoutePoint(destination)) {
    throw new GoogleRoutesError('invalid_coordinates');
  }
  if (signal?.aborted) {
    throw new GoogleRoutesError('aborted');
  }

  const controller = new AbortController();
  let cancelRequest = (_code: 'aborted' | 'timeout') => {};
  const cancellation = new Promise<never>((_resolve, reject) => {
    cancelRequest = code => {
      reject(new GoogleRoutesError(code));
      controller.abort();
    };
  });
  const onAbort = () => cancelRequest('aborted');
  signal?.addEventListener('abort', onAbort, { once: true });
  const timeout = setTimeout(() => cancelRequest('timeout'), REQUEST_TIMEOUT_MS);
  const startedAt = Date.now();

  async function request(): Promise<RoutePoint[]> {
    const response = await fetch(ROUTES_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_ROUTES_KEY,
        'X-Goog-FieldMask': 'routes.polyline.encodedPolyline',
      },
      body: JSON.stringify({
        origin: { location: { latLng: {
          latitude: origin.latitude, longitude: origin.longitude,
        } } },
        destination: { location: { latLng: {
          latitude: destination.latitude, longitude: destination.longitude,
        } } },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_UNAWARE',
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new GoogleRoutesError('http', response.status);
    }
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new GoogleRoutesError('invalid_response');
    }
    return readRoute(body);
  }

  try {
    logger.debug('google_routes.request_started', { scope: 'google_routes' });
    const points = await Promise.race([request(), cancellation]);
    logger.debug('google_routes.request_completed', {
      scope: 'google_routes', durationMs: Date.now() - startedAt,
    });
    return points;
  } catch (error) {
    const failure = error instanceof GoogleRoutesError
      ? error : new GoogleRoutesError('network');
    logger.debug('google_routes.request_failed', {
      scope: 'google_routes', code: failure.code, status: failure.status,
    });
    throw failure;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', onAbort);
  }
}
