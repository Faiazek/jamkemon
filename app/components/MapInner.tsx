"use client";

// The interactive map. Clean CARTO basemap (light or dark to match the theme),
// approved reports shown as category-icon pins, and a draggable pin while
// reporting.

import { useEffect, useRef, useState } from "react";
import {
  AttributionControl,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useReport } from "../report/ReportContext";
import {
  CATEGORIES,
  SEVERITIES,
  submitFeedback,
  getLocalVote,
  setLocalVote,
  type FeedbackVote,
  type Report,
  type Severity,
} from "../../lib/reports";
import { timeAgo } from "../../lib/time";
import type { Locale, MessageKey } from "../i18n/messages";

const DHAKA_CENTER: [number, number] = [23.8103, 90.4125];
const DEFAULT_ZOOM = 12;

// The draft pin (rose teardrop) shown while choosing a location.
const draftIcon = L.divIcon({
  className: "jk-draft-pin",
  html: `
    <svg width="36" height="36" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
            fill="#e11d48" stroke="white" stroke-width="1.5"/>
      <circle cx="12" cy="9" r="2.6" fill="white"/>
    </svg>`,
  iconSize: [36, 36],
  iconAnchor: [18, 34],
});

// Route origin dot (white circle with blue border).
const routeOriginIcon = L.divIcon({
  className: "",
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#fff;border:3px solid #2563eb;box-shadow:0 1px 4px rgba(0,0,0,.3)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});
// Route destination marker (solid blue with white dot).
const routeDestIcon = L.divIcon({
  className: "",
  html: `<div style="width:20px;height:20px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 2px 6px rgba(37,99,235,.5);display:flex;align-items:center;justify-content:center"><div style="width:6px;height:6px;border-radius:50%;background:#fff"></div></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// A distinct pin for a searched location (indigo teardrop).
const searchIcon = L.divIcon({
  className: "jk-search-pin",
  html: `
    <svg width="38" height="38" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
            fill="#4f46e5" stroke="white" stroke-width="1.5"/>
      <circle cx="12" cy="9" r="2.8" fill="white"/>
    </svg>`,
  iconSize: [38, 38],
  iconAnchor: [19, 36],
  popupAnchor: [0, -34],
});

// Category-icon pins, cached per category+severity.
const SIZE: Record<Severity, number> = { low: 26, medium: 30, high: 36 };
const iconCache = new Map<string, L.DivIcon>();
function reportIcon(color: string, severity: Severity, emoji: string): L.DivIcon {
  const key = `${color}-${severity}-${emoji}`;
  let icon = iconCache.get(key);
  if (!icon) {
    const size = SIZE[severity];
    const cls = severity === "high" ? "jk-marker jk-marker-high" : "jk-marker";
    icon = L.divIcon({
      className: "",
      html: `<div class="${cls}" style="--c:${color};width:${size}px;height:${size}px;font-size:${Math.round(size * 0.5)}px">${emoji}</div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2 - 2],
    });
    iconCache.set(key, icon);
  }
  return icon;
}

function ResizeFix() {
  const map = useMap();
  useEffect(() => {
    const invalidate = () => map.invalidateSize();
    const timer = setTimeout(invalidate, 0);
    window.addEventListener("resize", invalidate);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", invalidate);
    };
  }, [map]);
  return null;
}

function MapBinder() {
  const map = useMap();
  const { registerMap } = useReport();
  useEffect(() => {
    registerMap(map);
    return () => registerMap(null);
  }, [map, registerMap]);
  return null;
}

function ClickToPlace() {
  const { mode, placeAt } = useReport();
  const modeRef = useRef(mode);
  modeRef.current = mode;
  useMapEvents({
    click(e) {
      if (modeRef.current !== "idle") placeAt(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Re-fits the map to the route whenever a new route is set (keeping room at the
// top for the directions panel).
function FitRoute({
  route,
  routeKey,
}: {
  route: [number, number][] | null;
  routeKey: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (route && route.length > 1) {
      map.fitBounds(route, {
        paddingTopLeft: [40, 230],
        paddingBottomRight: [40, 60],
        maxZoom: 16,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey]);
  return null;
}

function DraftMarker() {
  const { draft, placeAt } = useReport();
  if (!draft) return null;
  return (
    <Marker
      position={[draft.lat, draft.lng]}
      icon={draftIcon}
      draggable
      eventHandlers={{
        dragend: (e) => {
          const { lat, lng } = e.target.getLatLng();
          placeAt(lat, lng);
        },
      }}
    />
  );
}

function SearchMarker({
  pin,
}: {
  pin: { lat: number; lng: number; label: string };
}) {
  return (
    <Marker
      position={[pin.lat, pin.lng]}
      icon={searchIcon}
      eventHandlers={{ add: (e) => e.target.openPopup() }}
    >
      <Popup>
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {pin.label}
        </span>
      </Popup>
    </Marker>
  );
}

function ReportMarkers({
  reports,
  locale,
  t,
}: {
  reports: Report[];
  locale: Locale;
  t: (key: MessageKey) => string;
}) {
  return (
    <>
      {reports.map((r) => {
        const cat = CATEGORIES.find((c) => c.key === r.category);
        return (
          <Marker
            key={r.id}
            position={[r.lat, r.lng]}
            icon={reportIcon(cat?.color ?? "#64748b", r.severity, cat?.emoji ?? "📍")}
          >
            <Popup>
              <ReportPopup report={r} locale={locale} t={t} />
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

// Popup body for a report, including the community "still happening / cleared"
// confirmation buttons.
function ReportPopup({
  report,
  locale,
  t,
}: {
  report: Report;
  locale: Locale;
  t: (key: MessageKey) => string;
}) {
  const cat = CATEGORIES.find((c) => c.key === report.category);
  const sev = SEVERITIES.find((s) => s.key === report.severity);
  const [vote, setVote] = useState<FeedbackVote | null>(() => getLocalVote(report.id));
  const [stillCount, setStillCount] = useState(report.still_count ?? 0);

  function cast(choice: FeedbackVote) {
    if (vote) return;
    setVote(choice);
    setLocalVote(report.id, choice);
    if (choice === "still") setStillCount((n) => n + 1);
    submitFeedback(report.id, choice);
  }

  return (
    <div className="min-w-[180px]">
      <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-slate-100">
        <span>{cat?.emoji}</span>
        <span>{cat ? t(cat.labelKey) : report.category}</span>
        <span
          className="ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold"
          style={{
            backgroundColor: (cat?.color ?? "#64748b") + "22",
            color: cat?.color ?? "#64748b",
          }}
        >
          {sev ? t(sev.labelKey) : report.severity}
        </span>
      </div>
      {report.description && (
        <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-300">
          {report.description}
        </p>
      )}
      <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
        🕒 {timeAgo(report.created_at, locale)}
        {stillCount > 0 && (
          <span className="ml-2 text-emerald-600 dark:text-emerald-400">
            👍 {stillCount} {t("confirmedCount")}
          </span>
        )}
      </p>

      {vote ? (
        <p className="mt-2 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400">
          {t("confirmThanks")}
        </p>
      ) : (
        <div className="mt-2">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {t("confirmPrompt")}
          </p>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => cast("still")}
              className="flex-1 rounded-full bg-emerald-600 px-2 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 active:scale-95"
            >
              👍 {t("stillHappening")}
            </button>
            <button
              type="button"
              onClick={() => cast("cleared")}
              className="flex-1 rounded-full border border-slate-300 px-2 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-100 active:scale-95 dark:border-white/15 dark:text-slate-300 dark:hover:bg-white/10"
            >
              ✅ {t("nowCleared")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MapInner({
  reports,
  locale,
  t,
  theme,
  route,
  routeKey,
  searchPin,
}: {
  reports: Report[];
  locale: Locale;
  t: (key: MessageKey) => string;
  theme: "light" | "dark";
  route: [number, number][] | null;
  routeKey: number;
  searchPin: { lat: number; lng: number; label: string } | null;
}) {
  // MapTiler "Streets" — readable, Google-like labels in light and dark.
  const key = process.env.NEXT_PUBLIC_MAPTILER_KEY;
  const style = theme === "dark" ? "streets-v2-dark" : "streets-v2";
  const tileUrl = key
    ? `https://api.maptiler.com/maps/${style}/{z}/{x}/{y}.png?key=${key}`
    : // fallback if no key configured
      theme === "dark"
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
  const attribution = key
    ? '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

  return (
    <MapContainer
      center={DHAKA_CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
      zoomControl={false}
      attributionControl={false}
      className="h-full w-full"
    >
      <AttributionControl position="bottomleft" prefix={false} />
      <ResizeFix />
      <MapBinder />
      <ClickToPlace />
      <DraftMarker />
      {searchPin && <SearchMarker pin={searchPin} />}
      {route && route.length > 1 && (
        <>
          {/* white casing + blue route line */}
          <Polyline positions={route} pathOptions={{ color: "#ffffff", weight: 11, opacity: 0.85, lineCap: "round", lineJoin: "round" }} />
          <Polyline positions={route} pathOptions={{ color: "#2563eb", weight: 6, opacity: 1, lineCap: "round", lineJoin: "round" }} />
          {/* origin dot */}
          <Marker position={route[0]} icon={routeOriginIcon} />
          {/* destination marker */}
          <Marker position={route[route.length - 1]} icon={routeDestIcon} />
        </>
      )}
      <FitRoute route={route} routeKey={routeKey} />
      <ReportMarkers reports={reports} locale={locale} t={t} />
      <TileLayer
        key={theme}
        attribution={attribution}
        url={tileUrl}
        subdomains="abcd"
        maxZoom={20}
      />
    </MapContainer>
  );
}
