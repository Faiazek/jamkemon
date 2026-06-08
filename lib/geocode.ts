// Turns a typed place name into coordinates.
//
// Primary engine is Barikoi (barikoi.com) — a Bangladesh-local maps provider
// with very rich Dhaka POI/address coverage (shops, holdings, landmarks).
// If no Barikoi key is set, or Barikoi errors / returns nothing / is over its
// quota, we fall back to Photon (free, OpenStreetMap-based) so search never
// breaks. Results are biased toward Dhaka.

import type { MessageKey } from "../app/i18n/messages";
import { haversineMeters } from "./geo";

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
// Bangladesh bounding box (minLon, minLat, maxLon, maxLat) — keeps Photon from
// matching same-named places abroad.
const BD_BBOX = "88.0,20.5,92.7,26.7";
const BARIKOI_KEY = process.env.NEXT_PUBLIC_BARIKOI_KEY;

export async function searchPlaces(
  query: string,
  signal?: AbortSignal
): Promise<Place[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  if (BARIKOI_KEY) {
    try {
      const hits = await viaBarikoi(q, signal);
      if (hits.length > 0) return hits;
    } catch (err) {
      if ((err as Error)?.name === "AbortError") throw err;
      // Barikoi down / over quota — fall through to Photon.
    }
  }
  return viaPhoton(q, signal);
}

async function viaBarikoi(q: string, signal?: AbortSignal): Promise<Place[]> {
  const url =
    `https://barikoi.xyz/v2/api/search/autocomplete?api_key=${BARIKOI_KEY}` +
    `&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { signal });
  const data = await res.json();
  const places: Place[] = (data.places ?? []).map((p: any) => {
    const lat = parseFloat(p.latitude);
    const lon = parseFloat(p.longitude);
    const parts = String(p.address ?? "").split(",").map((s: string) => s.trim());
    const label = parts[0] || p.area || q;
    const localityParts = [p.area, p.city, p.district].filter(
      (v: string, i: number, arr: string[]) => v && arr.indexOf(v) === i
    );
    const { icon, kindKey } = classifyBarikoi(p.pType, p.subType);
    return {
      label,
      sub: localityParts.slice(0, 2).join(", ") || "Bangladesh",
      kindKey,
      icon,
      lat,
      lon,
    } as Place;
  }).filter((p: Place) => Number.isFinite(p.lat) && Number.isFinite(p.lon));

  // Barikoi returns matches countrywide; bubble Dhaka-area results to the top.
  places.sort(
    (a, b) =>
      haversineMeters(DHAKA.lat, DHAKA.lon, a.lat, a.lon) -
      haversineMeters(DHAKA.lat, DHAKA.lon, b.lat, b.lon)
  );
  // Drop near-identical duplicates (same label + roughly same spot).
  const seen = new Set<string>();
  const unique = places.filter((p) => {
    const key = `${p.label}|${p.lat.toFixed(4)}|${p.lon.toFixed(4)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return unique.slice(0, 6);
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
    const dedupe = `${label}|${lat.toFixed(3)}|${lon.toFixed(3)}`;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    const { icon, kindKey } = classifyOsm(p.osm_key, p.osm_value);
    out.push({ label, sub: photonLocality(p), kindKey, icon, lat, lon });
    if (out.length >= 6) break;
  }
  return out;
}

function photonLocality(p: any): string {
  const parts = [p.district, p.city, p.county]
    .map((s) => (s ? String(s).trim() : ""))
    .filter(Boolean);
  const uniq = parts.filter((v, i) => parts.indexOf(v) === i);
  if (uniq.length) return uniq.slice(0, 2).join(", ");
  return p.state ? String(p.state) : "Bangladesh";
}

// Barikoi place type → emoji + bilingual label. pType is broad (Food, Health…);
// subType is more specific. We match on either, case-insensitively.
function classifyBarikoi(pType?: string, subType?: string): { icon: string; kindKey: PlaceKind } {
  const s = `${pType ?? ""} ${subType ?? ""}`.toLowerCase();
  const has = (...words: string[]) => words.some((w) => s.includes(w));

  if (has("food", "restaurant", "kabab", "cafe", "bakery", "hotel & rest", "fast food"))
    return { icon: "🍽️", kindKey: "placeKindRestaurant" };
  if (has("health", "hospital", "clinic", "pharmacy", "diagnostic", "medical", "dental"))
    return { icon: "🏥", kindKey: "placeKindHospital" };
  if (has("education", "school", "college", "university", "madrasa", "library"))
    return { icon: "🎓", kindKey: "placeKindSchool" };
  if (has("bank", "atm", "finance", "insurance"))
    return { icon: "🏦", kindKey: "placeKindBank" };
  if (has("hotel", "resort", "motel", "guest house", "hostel"))
    return { icon: "🏨", kindKey: "placeKindHotel" };
  if (has("mosque", "temple", "church", "religious", "worship", "masjid"))
    return { icon: "🕌", kindKey: "placeKindWorship" };
  if (has("fuel", "petrol", "filling", "cng", "gas station"))
    return { icon: "⛽", kindKey: "placeKindFuel" };
  if (has("transport", "bus", "station", "railway", "terminal", "airport", "metro"))
    return { icon: "🚉", kindKey: "placeKindStation" };
  if (has("shop", "shopping", "mall", "market", "store", "retail", "super"))
    return { icon: "🛍️", kindKey: "placeKindShopping" };
  if (has("park", "garden", "playground", "field", "stadium"))
    return { icon: "🌳", kindKey: "placeKindPark" };
  if (has("office", "corporate", "government", "govt", "ngo"))
    return { icon: "🏢", kindKey: "placeKindOffice" };
  if (has("area", "neighbourhood", "road", "street", "avenue"))
    return { icon: "🛣️", kindKey: "placeKindRoad" };
  return { icon: "📍", kindKey: "placeKindPlace" };
}

// OpenStreetMap (Photon) key/value → emoji + bilingual label.
function classifyOsm(key?: string, value?: string): { icon: string; kindKey: PlaceKind } {
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
