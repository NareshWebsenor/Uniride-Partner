import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchDrivingRoute, type RoutePoint } from '@/service/rest/googleRoutes';

type RouteState = {
  key: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  points: RoutePoint[];
};
const CACHE_MS = 5 * 60 * 1000;
const EMPTY_POINTS: RoutePoint[] = [];

/** A short in-memory cache avoids refetching the same route between ride panels. */
export function useDrivingRoute(origin: RoutePoint, destination: RoutePoint, enabled: boolean) {
  const key = `${origin.latitude},${origin.longitude}:${destination.latitude},${destination.longitude}`;
  const cache = useRef<{ key: string; points: RoutePoint[]; expiresAt: number } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<RouteState>({ key: '', status: 'idle', points: [] });
  const retry = useCallback(() => { cache.current = null; setAttempt(value => value + 1); }, []);

  useEffect(() => {
    if (!enabled) return;
    const cached = cache.current;
    if (cached?.key === key && cached.expiresAt > Date.now()) {
      setState({ key, status: 'success', points: cached.points });
      return;
    }
    const controller = new AbortController();
    setState({ key, status: 'loading', points: [] });
    fetchDrivingRoute(
      { latitude: origin.latitude, longitude: origin.longitude },
      { latitude: destination.latitude, longitude: destination.longitude },
      { signal: controller.signal },
    ).then(points => {
      if (controller.signal.aborted) return;
      cache.current = { key, points, expiresAt: Date.now() + CACHE_MS };
      setState({ key, status: 'success', points });
    }).catch(() => {
      if (!controller.signal.aborted) setState({ key, status: 'error', points: [] });
    });
    return () => controller.abort();
  }, [enabled, key, origin.latitude, origin.longitude, destination.latitude, destination.longitude, attempt]);

  return {
    status: enabled && state.key === key ? state.status : 'idle',
    points: enabled && state.key === key ? state.points : EMPTY_POINTS,
    retry,
  };
}
