// Gets a driving route between two points using the public OSRM service
// (free, no key). Note: durations are free-flow estimates (no live traffic) —
// the community reports along the route are the real signal.

export type RouteResult = {
  coords: [number, number][]; // [lat, lng] points for drawing on the map
  distanceKm: number;
  durationMin: number;
};

export async function getRoute(
  origin: { lat: number; lon: number },
  dest: { lat: number; lon: number }
): Promise<RouteResult | null> {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${origin.lon},${origin.lat};${dest.lon},${dest.lat}` +
    `?overview=full&geometries=geojson`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.code !== "Ok" || !data.routes?.length) return null;
  const r = data.routes[0];
  const coords: [number, number][] = r.geometry.coordinates.map(
    ([lon, lat]: [number, number]) => [lat, lon]
  );
  return {
    coords,
    distanceKm: r.distance / 1000,
    durationMin: r.duration / 60,
  };
}
