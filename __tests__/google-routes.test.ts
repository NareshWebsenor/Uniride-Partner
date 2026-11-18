import { fetchDrivingRoute, GoogleRoutesError } from '@/service/rest/googleRoutes';
import { decodePolyline } from '@/utils/polyline';

let mockRoutesKey = 'test-routes-key';
jest.mock('@/service/config', () => ({
  get GOOGLE_ROUTES_KEY() { return mockRoutesKey; },
}));

const encoded = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
const origin = { latitude: 38.5, longitude: -120.2 };
const destination = { latitude: 43.252, longitude: -126.453 };
const routeBody = { routes: [{ polyline: { encodedPolyline: encoded } }] };

describe('Google polyline decoding', () => {
  it('decodes the official Google sample including negative deltas', () => {
    expect(decodePolyline(encoded)).toEqual([
      origin, { latitude: 40.7, longitude: -120.95 }, destination,
    ]);
  });

  it.each(['', '_', '??_', '!?', '~~~~~~~?', '_gsia@?', '?_gsia@_gsia@?'])
  ('rejects truncated, invalid and out-of-range data: %s', value => {
    expect(() => decodePolyline(value)).toThrow('invalid_polyline');
  });

  it('bounds both input size and decoded point count', () => {
    expect(() => decodePolyline('?'.repeat(200_001))).toThrow('invalid_polyline');
    expect(() => decodePolyline('??'.repeat(20_001))).toThrow('invalid_polyline');
  });
});

describe('Google Routes transport', () => {
  let fetchMock: jest.SpyInstance<ReturnType<typeof fetch>, Parameters<typeof fetch>>;

  beforeEach(() => {
    mockRoutesKey = 'test-routes-key';
    fetchMock = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('requests a driving route without app bearer authentication', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify(routeBody)));
    const points = await fetchDrivingRoute(origin, destination);
    expect(points).toHaveLength(3);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://routes.googleapis.com/directions/v2:computeRoutes',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': 'test-routes-key',
          'X-Goog-FieldMask': 'routes.polyline.encodedPolyline',
        },
        body: JSON.stringify({
          origin: { location: { latLng: origin } },
          destination: { location: { latLng: destination } },
          travelMode: 'DRIVE', routingPreference: 'TRAFFIC_UNAWARE',
        }),
      }),
    );
  });

  it('rejects a missing key before sending a request', async () => {
    mockRoutesKey = ' ';
    await expect(fetchDrivingRoute(origin, destination)).rejects.toMatchObject({
      code: 'missing_key',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    { latitude: 91, longitude: 0 },
    { latitude: 0, longitude: -181 },
    { latitude: NaN, longitude: 0 },
    { latitude: 0, longitude: Infinity },
  ])('rejects invalid request coordinates', async point => {
    await expect(fetchDrivingRoute(point, destination)).rejects.toMatchObject({
      code: 'invalid_coordinates',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('exposes safe HTTP status without returning Google error content', async () => {
    fetchMock.mockResolvedValue(new Response('sensitive error details', { status: 403 }));
    await expect(fetchDrivingRoute(origin, destination)).rejects.toEqual(
      new GoogleRoutesError('http', 403),
    );
  });

  it('replaces raw network errors with a typed code', async () => {
    fetchMock.mockRejectedValue(new Error('sensitive network details'));
    await expect(fetchDrivingRoute(origin, destination)).rejects.toEqual(
      new GoogleRoutesError('network'),
    );
  });

  it.each([{}, { routes: [] }])('handles a successful response without a route', async body => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify(body)));
    await expect(fetchDrivingRoute(origin, destination)).rejects.toMatchObject({
      code: 'no_route',
    });
  });

  it.each([
    null, [], { error: {} }, { routes: null }, { routes: [{}] },
    { routes: [{ polyline: { encodedPolyline: 123 } }] },
    { routes: [{ polyline: { encodedPolyline: '??' } }] },
    { routes: [{ polyline: { encodedPolyline: '_?' } }] },
  ])('rejects malformed route responses', async body => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify(body)));
    await expect(fetchDrivingRoute(origin, destination)).rejects.toMatchObject({
      code: 'invalid_response',
    });
  });

  it('rejects invalid JSON', async () => {
    fetchMock.mockResolvedValue(new Response('not json'));
    await expect(fetchDrivingRoute(origin, destination)).rejects.toMatchObject({
      code: 'invalid_response',
    });
  });

  it('does not start an already aborted request', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(fetchDrivingRoute(origin, destination, { signal: controller.signal }))
      .rejects.toMatchObject({ code: 'aborted' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('cancels transport and removes listeners on external abort', async () => {
    jest.useFakeTimers();
    fetchMock.mockImplementation(() => new Promise(() => {}));
    const controller = new AbortController();
    const removeListener = jest.spyOn(controller.signal, 'removeEventListener');
    const request = fetchDrivingRoute(origin, destination, { signal: controller.signal });
    const outcome = expect(request).rejects.toMatchObject({ code: 'aborted' });
    controller.abort();
    await outcome;
    expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(true);
    expect(removeListener).toHaveBeenCalledWith('abort', expect.any(Function));
    expect(jest.getTimerCount()).toBe(0);
  });

  it('times out after ten seconds, aborting even a nonresponsive transport', async () => {
    jest.useFakeTimers();
    fetchMock.mockImplementation(() => new Promise(() => {}));
    const request = fetchDrivingRoute(origin, destination);
    const outcome = expect(request).rejects.toMatchObject({ code: 'timeout' });
    jest.advanceTimersByTime(10_000);
    await outcome;
    expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(true);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('cleans up the deadline and abort listener after success', async () => {
    jest.useFakeTimers();
    fetchMock.mockResolvedValue(new Response(JSON.stringify(routeBody)));
    const controller = new AbortController();
    const removeListener = jest.spyOn(controller.signal, 'removeEventListener');
    await fetchDrivingRoute(origin, destination, { signal: controller.signal });
    expect(removeListener).toHaveBeenCalledWith('abort', expect.any(Function));
    expect(jest.getTimerCount()).toBe(0);
  });
});
