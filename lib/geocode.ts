// Turns a typed place name into coordinates. Primary engine is Photon
// (photon.komoot.io) — free, no key, built on OpenStreetMap, which has rich
// Dhaka coverage of restaurants, shops, hospitals, roads, landmarks, etc.
// Results are hard-filtered to a Bangladesh bounding box and ranked by
// closeness to Dhaka. MapTiler is kept only as a network fallback (its Dhaka
// POI coverage is weak, so it is not used unless Photon is unreachable).

import type { MessageKey } from "../app/i18n/messages";

export type PlaceKind = Extract<MessageKey, `placeKind${string}`>;

export type Place = {
  label: string;
  sub: string; // locality line, e.g. "ধানমন্ডি, Dhaka"
  kindKey: PlaceKind; // bilingual type label key (Restaurant, Road, …)
  icon: string; // emoji shown beside the result
  lat: number;
  lon: number;
};

const DHAKA = { lat: 23.8103, lon: 90.4125 };
// Bangladesh bounding box (minLon, minLat, maxLon, maxLat) — keeps "north south
// university" from matching universities in the USA, etc.
const BD_BBOX = "88.0,20.5,92.7,26.7";
const KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;

export async function searchPlaces(
  query: string,
  signal?: AbortSignal
): Promise<Place[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  try {
    const hits = await viaPhoton(q, signal);
    if (hits.length > 0) return hits;
  } catch (err) {
    if ((err as Error)?.name === "AbortError") throw err;
    // Photon unreachable — fall through to MapTiler if we have a key.
  }
  return KEY ? viaMapTiler(q, signal) : [];
}

async function viaPhoton(q: string, signal?: AbortSignal): Promise<Place[]> {
  const url =
    `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}` +
    `&lat=${DHAKA.lat}&lon=${DHAKA.lon}&bbox=${BD_BBOX}&limit=10`;
  const res = await fetch(url, { signal });
  const data = await res.json();
  const out: Place[] = [];
  const seen = new Set<string>();
  for (const f of data.features ?? []) {
    const p = f.properties ?? {};
    const [lon, lat] = f.geometry?.coordinates ?? [];
    if (typeof lat !== "number" || typeof lon !== "number") continue;
    const label = p.name || p.street || q;
    // Collapse near-duplicates (OSM often has a place mapped several times).
    const dedupe = `${label}|${lat.toFixed(3)}|${lon.toFixed(3)}`;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    const { icon, kindKey } = classify(p.osm_key, p.osm_value);
    out.push({ label, sub: locality(p), kindKey, icon, lat, lon });
    if (out.length >= 6) break;
  }
  return out;
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
      kindKey: "placeKindPlace" as PlaceKind,
      icon: "📍",
      lat,
      lon,
    } as Place;
  });
}

// Build the secondary line from the most useful locality fields, dropping
// duplicates and the generic division name unless nothing else is available.
function locality(p: any): string {
  const parts = [p.district, p.city, p.county]
    .map((s) => (s ? String(s).trim() : ""))
    .filter(Boolean);
  const uniq = parts.filter((v, i) => parts.indexOf(v) === i);
  if (uniq.length) return uniq.slice(0, 2).join(", ");
  return p.state ? String(p.state) : "Bangladesh";
}

// Map an OSM key/value pair to a friendly emoji + bilingual type label key.
function classify(key?: string, value?: string): { icon: string; kindKey: PlaceKind } {
  const v = value ?? "";
  const k = key ?? "";

  if (k === "highway") {
    if (v === "bus_stop") return { icon: "🚏", kindKey: "placeKindStation" };
    return { icon: "🛣️", kindKey: "placeKindRoad" };
  }
  if (k === "railway" || k === "public_transport" || k === "aeroway")
    return { icon: "🚉", kindKey: "placeKindStation" };
  if (k === "waterway" || (k === "natural" && (v === "water" || v === "bay")))
    return { icon: "💧", kindKey: "placeKindWater" };
  if (k === "leisure" || (k === "tourism" && (v === "park" || v === "zoo")))
    return { icon: "🌳", kindKey: "placeKindPark" };
  if (k === "office") return { icon: "🏢", kindKey: "placeKindOffice" };
  if (k === "shop" || v === "mall" || v === "marketplace")
    return { icon: "🛍️", kindKey: "placeKindShopping" };

  if (k === "amenity" || k === "tourism" || k === "building") {
    if (["restaurant", "fast_food", "cafe", "food_court", "bar", "pub", "ice_cream"].includes(v))
      return { icon: "🍽️", kindKey: "placeKindRestaurant" };
    if (["hospital", "clinic", "doctors", "pharmacy", "dentist", "veterinary"].includes(v))
      return { icon: "🏥", kindKey: "placeKindHospital" };
    if (["school", "college", "university", "kindergarten", "library"].includes(v))
      return { icon: "🎓", kindKey: "placeKindSchool" };
    if (["bank", "atm", "bureau_de_change"].includes(v))
      return { icon: "🏦", kindKey: "placeKindBank" };
    if (v === "place_of_worship") return { icon: "🕌", kindKey: "placeKindWorship" };
    if (v === "fuel") return { icon: "⛽", kindKey: "placeKindFuel" };
    if (["hotel", "guest_house", "hostel", "motel", "resort"].includes(v))
      return { icon: "🏨", kindKey: "placeKindHotel" };
  }

  if (k === "place") return { icon: "🏙️", kindKey: "placeKindArea" };

  return { icon: "📍", kindKey: "placeKindPlace" };
}
