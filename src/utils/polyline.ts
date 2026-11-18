export interface RoutePoint {
  latitude: number;
  longitude: number;
}

const MAX_ENCODED_LENGTH = 200_000;
const MAX_POINTS = 20_000;

export function isRoutePoint(value: unknown): value is RoutePoint {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  return (
    'latitude' in value && typeof value.latitude === 'number' &&
    Number.isFinite(value.latitude) && Math.abs(value.latitude) <= 90 &&
    'longitude' in value && typeof value.longitude === 'number' &&
    Number.isFinite(value.longitude) && Math.abs(value.longitude) <= 180
  );
}

/** Google encoded polylines use signed deltas at five decimal places. */
export function decodePolyline(encoded: string): RoutePoint[] {
  if (!encoded.length || encoded.length > MAX_ENCODED_LENGTH) {
    throw new Error('invalid_polyline');
  }
  let index = 0;
  let latitude = 0;
  let longitude = 0;
  const points: RoutePoint[] = [];

  function readDelta(): number {
    let value = 0;
    for (let group = 0; group < 6; group += 1) {
      if (index >= encoded.length) {
        throw new Error('invalid_polyline');
      }
      const chunk = encoded.charCodeAt(index++) - 63;
      if (chunk < 0 || chunk > 63) {
        throw new Error('invalid_polyline');
      }
      value += (chunk % 32) * 2 ** (group * 5);
      if (chunk < 32) {
        return value % 2 ? -Math.floor(value / 2) - 1 : value / 2;
      }
    }
    throw new Error('invalid_polyline');
  }

  while (index < encoded.length) {
    if (points.length >= MAX_POINTS) {
      throw new Error('invalid_polyline');
    }
    latitude += readDelta();
    longitude += readDelta();
    const point = { latitude: latitude / 1e5, longitude: longitude / 1e5 };
    if (!isRoutePoint(point)) {
      throw new Error('invalid_polyline');
    }
    points.push(point);
  }
  return points;
}
