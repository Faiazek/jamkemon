// Small geo helpers for measuring distances on the Earth's surface.

const R = 6371000; // Earth radius in metres
const toRad = (d: number) => (d * Math.PI) / 180;

export function haversineMeters(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
): number {
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Closest distance (metres) from a point to a route, where the route is a list
// of [lat, lng] points. The route geometry is dense, so nearest-vertex distance
// is a good approximation of "how far is this report from the route".
export function minDistanceToPath(
  lat: number,
  lng: number,
  path: [number, number][]
): number {
  let min = Infinity;
  for (const [pLat, pLng] of path) {
    const d = haversineMeters(lat, lng, pLat, pLng);
    if (d < min) min = d;
  }
  return min;
}
