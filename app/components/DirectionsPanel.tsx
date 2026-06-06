"use client";

// Directions, community-first: pick a destination (and optionally a start),
// draw the driving route, and surface the community reports along that route.

import { useState } from "react";
import { useLanguage } from "../i18n/LanguageProvider";
import { useDirections } from "../directions/DirectionsContext";
import { useReport } from "../report/ReportContext";
import { useReports } from "../report/ReportsContext";
import PlaceInput from "./PlaceInput";
import { CATEGORIES, SEVERITIES, type Report } from "../../lib/reports";
import { getRoute } from "../../lib/routing";
import { minDistanceToPath } from "../../lib/geo";
import { timeAgo } from "../../lib/time";
import type { Place } from "../../lib/geocode";

const ON_ROUTE_METERS = 250;

type Summary = {
  distanceKm: number;
  durationMin: number;
  onRoute: Report[];
};

// Severity color for the route badge
const SEV_COLOR: Record<string, string> = {
  low: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-400/10",
  medium: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-400/10",
  high: "text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-400/10",
};

export default function DirectionsPanel() {
  const { t, locale } = useLanguage();
  const { active, close, setRoute } = useDirections();
  const { flyTo } = useReport();
  const { reports } = useReports();

  const [useGps, setUseGps] = useState(true);
  const [fromText, setFromText] = useState("");
  const [fromPlace, setFromPlace] = useState<Place | null>(null);
  const [toText, setToText] = useState("");
  const [toPlace, setToPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);

  if (!active) return null;

  function resolveOrigin(): Promise<{ lat: number; lon: number } | null> {
    if (!useGps)
      return Promise.resolve(
        fromPlace ? { lat: fromPlace.lat, lon: fromPlace.lon } : null
      );
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
        () => resolve(null),
        { timeout: 8000, maximumAge: 60000 }
      );
    });
  }

  async function handleFind() {
    if (!toPlace) return;
    setLoading(true);
    setError(false);
    setSummary(null);
    try {
      const origin = await resolveOrigin();
      if (!origin) { setError(true); return; }
      const route = await getRoute(origin, { lat: toPlace.lat, lon: toPlace.lon });
      if (!route) { setError(true); return; }
      const onRoute = reports.filter(
        (r) => minDistanceToPath(r.lat, r.lng, route.coords) <= ON_ROUTE_METERS
      );
      setRoute(route.coords);
      setSummary({ distanceKm: route.distanceKm, durationMin: route.durationMin, onRoute });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setSummary(null);
    setRoute(null);
    setError(false);
  }

  function handleClose() {
    reset();
    setFromText("");
    setFromPlace(null);
    setToText("");
    setToPlace(null);
    setUseGps(true);
    close();
  }

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-[1000] flex justify-center px-3"
      style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
    >
      {/* No overflow clipping here: the address autocomplete dropdown needs to
          spill outside the panel. The only tall section (reports on route) has
          its own internal scroll, so the panel height stays bounded anyway. */}
      <div className="pointer-events-auto w-full max-w-md rounded-2xl bg-white shadow-xl ring-1 ring-black/5 backdrop-blur-md dark:bg-neutral-900 dark:ring-white/10">

        {/* ---- Header ---- */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-white/5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-500/10">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-rose-600">
              <path d="M3 11l18-8-8 18-2-8-8-2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="flex-1 text-sm font-bold text-slate-900 dark:text-slate-100">
            {t("directions")}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* ---- Inputs ---- */}
        <div className="space-y-1.5 px-4 py-3">
          {/* From row */}
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-white/5">
            {/* Route dot indicator */}
            <div className="flex shrink-0 flex-col items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-full border-2 border-slate-400 dark:border-slate-500" />
            </div>
            <div className="min-w-0 flex-1">
              {useGps ? (
                <button
                  type="button"
                  onClick={() => setUseGps(false)}
                  className="text-sm font-semibold text-emerald-600 dark:text-emerald-400"
                >
                  {t("yourLocation")}
                </button>
              ) : (
                <PlaceInput
                  value={fromText}
                  onChange={setFromText}
                  onSelect={(p) => { setFromPlace(p); }}
                  placeholder={t("fromPlaceholder")}
                />
              )}
            </div>
            {!useGps ? (
              <button
                type="button"
                onClick={() => { setUseGps(true); setFromText(""); setFromPlace(null); }}
                className="shrink-0 rounded-full p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                title={t("yourLocation")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            ) : null}
          </div>

          {/* Connector dots */}
          <div className="ml-[22px] flex flex-col gap-0.5 py-0.5">
            {[0,1,2].map(i => <div key={i} className="h-1 w-0.5 rounded-full bg-slate-300 dark:bg-slate-600" />)}
          </div>

          {/* To row */}
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-white/5">
            <div className="shrink-0">
              <div className="h-2.5 w-2.5 rounded-sm bg-rose-500 rotate-45" />
            </div>
            <div className="min-w-0 flex-1">
              <PlaceInput
                value={toText}
                onChange={(v) => { setToText(v); if (!v) setToPlace(null); }}
                onSelect={(p) => { setToPlace(p); setToText(p.label); }}
                placeholder={t("toPlaceholder")}
              />
            </div>
          </div>
        </div>

        {/* ---- Find button ---- */}
        <div className="px-4 pb-3">
          <button
            type="button"
            onClick={handleFind}
            disabled={!toPlace || loading || (!useGps && !fromPlace)}
            className="w-full rounded-xl bg-rose-600 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-rose-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40 20" />
                </svg>
                {t("routeFinding")}
              </span>
            ) : t("findRoute")}
          </button>
          {error && (
            <p className="mt-2 text-center text-xs text-rose-600">{t("routeError")}</p>
          )}
        </div>

        {/* ---- Route Summary ---- */}
        {summary && (
          <div className="border-t border-slate-100 dark:border-white/5">
            {/* Distance + time bar */}
            <div className="flex items-center justify-between bg-slate-50 px-4 py-3 dark:bg-white/[0.03]">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                    {Math.round(summary.distanceKm * 10) / 10}
                    <span className="ml-0.5 text-sm font-semibold text-slate-500"> {t("kmShort")}</span>
                  </span>
                  <span className="text-sm font-semibold text-slate-400">·</span>
                  <span className="text-lg font-bold text-slate-700 dark:text-slate-300">
                    ~{Math.round(summary.durationMin)}
                    <span className="ml-0.5 text-sm font-semibold text-slate-500"> {t("minShort")}</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{t("trafficEstimateNote")}</p>
              </div>
              <button
                type="button"
                onClick={reset}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/5"
              >
                {t("clearRoute")}
              </button>
            </div>

            {/* Reports along the route */}
            <div className="px-4 py-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {t("reportsOnRoute")}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${summary.onRoute.length === 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400" : "bg-rose-100 text-rose-700 dark:bg-rose-400/10 dark:text-rose-400"}`}>
                  {summary.onRoute.length}
                </span>
              </div>

              {summary.onRoute.length === 0 ? (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 dark:bg-emerald-400/5">
                  <span className="text-base">✅</span>
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    {t("noReportsOnRoute")}
                  </span>
                </div>
              ) : (
                <div className="max-h-44 space-y-1.5 overflow-y-auto">
                  {summary.onRoute.map((r) => {
                    const cat = CATEGORIES.find((c) => c.key === r.category);
                    const sev = SEVERITIES.find((s) => s.key === r.severity);
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => flyTo(r.lat, r.lng)}
                        className="flex w-full items-start gap-2.5 rounded-xl border border-slate-100 bg-white p-2.5 text-left shadow-sm transition hover:shadow-md dark:border-white/5 dark:bg-white/[0.03]"
                      >
                        <div
                          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm"
                          style={{ backgroundColor: (cat?.color ?? "#64748b") + "18" }}
                        >
                          {cat?.emoji}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                              {cat ? t(cat.labelKey) : r.category}
                            </span>
                            {sev && (
                              <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${SEV_COLOR[r.severity]}`}>
                                {t(sev.labelKey)}
                              </span>
                            )}
                          </div>
                          {r.description && (
                            <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                              {r.description}
                            </p>
                          )}
                          <p className="mt-0.5 text-[11px] text-slate-400">
                            {timeAgo(r.created_at, locale)}
                          </p>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="mt-1 shrink-0 text-slate-300">
                          <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
