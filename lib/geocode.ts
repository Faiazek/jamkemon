// Turns a typed place name into coordinates using MapTiler geocoding, biased to
// Dhaka and limited to Bangladesh. Falls back to Photon (free, no key) if no
// MapTiler key is configured.

export type Place = {
  label: string;
  sub: string;
  lat: number;
  lon: number;
};

const DHAKA = { lat: 23.8103, lon: 90.4125 };
const KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;

export async function searchPlaces(
  query: string,
  signal?: AbortSignal
): Promise<Place[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  return KEY ? viaMapTiler(q, signal) : viaPhoton(q, signal);
}

async function viaMapTiler(q: string, signal?: AbortSignal): Promise<Place[]> {
  const url =
    `https://api.maptiler.com/geocoding/${encodeURIComponent(q)}.json` +
    `?key=${KEY}&country=bd&proximity=${DHAKA.lon},${DHAKA.lat}&autocomplete=true&limit=6`;
  const res = await fetch(url, { signal });
  const data = await res.json();
  return (data.features ?? []).map((f: any) => {
    const parts = String(f.place_name ?? "").split(",").map((s: string) => s.trim());
    const label = f.text || parts[0] || q;
    const [lon, lat] = f.center ?? f.geometry?.coordinates ?? [DHAKA.lon, DHAKA.lat];
    return {
      label,
      sub: parts.slice(1, 3).join(", ") || "Bangladesh",
      lat,
      lon,
    } as Place;
  });
}

async function viaPhoton(q: string, signal?: AbortSignal): Promise<Place[]> {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lat=${DHAKA.lat}&lon=${DHAKA.lon}&limit=6`;
  const res = await fetch(url, { signal });
  const data = await res.json();
  return (data.features ?? [])
    .filter((f: any) => !f.properties?.countrycode || f.properties.countrycode === "BD")
    .map((f: any) => {
      const p = f.properties ?? {};
      const sub = [p.district, p.city, p.state].filter(Boolean).slice(0, 2).join(", ");
      return {
        label: p.name ?? p.street ?? q,
        sub: sub || "Bangladesh",
        lat: f.geometry.coordinates[1],
        lon: f.geometry.coordinates[0],
      } as Place;
    });
}
