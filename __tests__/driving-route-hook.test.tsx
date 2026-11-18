import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { useDrivingRoute } from '@/hooks/useDrivingRoute';
import { fetchDrivingRoute, type RoutePoint } from '@/service/rest/googleRoutes';

jest.mock('@/service/rest/googleRoutes', () => ({ fetchDrivingRoute: jest.fn() }));
const fetchRoute = jest.mocked(fetchDrivingRoute);
const origin = { latitude: 12.9, longitude: 77.6 };
const destination = { latitude: 12.94, longitude: 77.61 };
const points = [origin, destination];
let value: ReturnType<typeof useDrivingRoute>;
let tree: Renderer.ReactTestRenderer;
function Harness({ enabled = true, target = destination }: { enabled?: boolean; target?: RoutePoint }) {
  value = useDrivingRoute(origin, target, enabled);
  return null;
}
beforeEach(() => { fetchRoute.mockReset(); fetchRoute.mockResolvedValue(points); });
afterEach(async () => { await act(async () => tree?.unmount()); });

test('only fetches active routes; caches across panel and visibility changes', async () => {
  await act(async () => { tree = Renderer.create(<Harness enabled={false} />); });
  expect(fetchRoute).not.toHaveBeenCalled();
  await act(async () => tree.update(<Harness />));
  expect(value.status).toBe('success');
  expect(value.points).toEqual(points);
  await act(async () => tree.update(<Harness />));
  await act(async () => tree.update(<Harness enabled={false} />));
  expect(value.points).toEqual([]);
  await act(async () => tree.update(<Harness />));
  expect(fetchRoute).toHaveBeenCalledTimes(1);
  expect(value.status).toBe('success');
});

test('failure exposes retry; retry recovers without a fabricated polyline', async () => {
  fetchRoute.mockRejectedValueOnce(new Error('network'));
  await act(async () => { tree = Renderer.create(<Harness />); });
  expect(value.status).toBe('error');
  expect(value.points).toEqual([]);
  await act(async () => value.retry());
  expect(value.status).toBe('success');
  expect(fetchRoute).toHaveBeenCalledTimes(2);
});

test('coordinate changes abort pending fetch and ignore its late response', async () => {
  let completeFirst!: (points: RoutePoint[]) => void;
  fetchRoute.mockImplementationOnce(() => new Promise(resolve => { completeFirst = resolve; }));
  await act(async () => { tree = Renderer.create(<Harness />); });
  const firstSignal = fetchRoute.mock.calls[0][2]?.signal;
  const nextTarget = { latitude: 12.95, longitude: 77.62 };
  const nextPoints = [origin, nextTarget];
  fetchRoute.mockResolvedValueOnce(nextPoints);
  await act(async () => tree.update(<Harness target={nextTarget} />));
  expect(firstSignal?.aborted).toBe(true);
  await act(async () => completeFirst(points));
  expect(value.points).toEqual(nextPoints);
});

test('unmount aborts pending work', async () => {
  fetchRoute.mockImplementationOnce(() => new Promise(() => {}));
  await act(async () => { tree = Renderer.create(<Harness />); });
  const signal = fetchRoute.mock.calls[0][2]?.signal;
  await act(async () => tree.unmount());
  expect(signal?.aborted).toBe(true);
});
