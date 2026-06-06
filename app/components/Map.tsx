"use client";

// Public map shell: theme-aware basemap, filter bar, "locate me" button, and
// the empty/loading states. Report data comes from ReportsContext; the Leaflet
// map is loaded only in the browser.

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useLanguage } from "../i18n/LanguageProvider";
import { useReport } from "../report/ReportContext";
import { useReports } from "../report/ReportsContext";
import { useDirections } from "../directions/DirectionsContext";
import { useTheme } from "../theme/ThemeProvider";
import { CATEGORIES, type Category } from "../../lib/reports";

const MapInner = dynamic(() => import("./MapInner"), {
  ssr: false,
  loading: () => <MapLoading />,
});

function MapLoading() {
  const { t } = useLanguage();
  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-500 dark:bg-neutral-900 dark:text-slate-400">
      {t("mapLoading")}
    </div>
  );
}

type Recency = "live" | "1h" | "3h";

export default function Map() {
  const { t, locale } = useLanguage();
  const { mode, flyTo, searchPin } = useReport();
  const { reports, loading } = useReports();
  const { route, routeKey, active: dirActive } = useDirections();
  const { theme } = useTheme();
  const [category, setCategory] = useState<Category | "all">("all");
  const [recency, setRecency] = useState<Recency>("live");
  const [locating, setLocating] = useState(false);

  const filtered = useMemo(() => {
    const now = Date.now();
    const windowMs = recency === "1h" ? 3_600_000 : recency === "3h" ? 10_800_000 : Infinity;
    return reports.filter((r) => {
      if (category !== "all" && r.category !== category) return false;
      if (now - new Date(r.created_at).getTime() > windowMs) return false;
      return true;
    });
  }, [reports, category, recency]);

  function handleLocate() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        flyTo(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      () => setLocating(false)
    );
  }

  return (
    <div className="absolute inset-0">
      {/* Filters — floating glass row below the top bar, hidden while reporting/directions */}
      {mode === "idle" && !dirActive && (
        <div
          className="pointer-events-none absolute inset-x-0 z-[800] flex justify-center px-3"
          style={{ top: "calc(env(safe-area-inset-top) + 3.75rem)" }}
        >
          <div className="no-scrollbar pointer-events-auto flex max-w-full items-center gap-1.5 overflow-x-auto rounded-full bg-white/85 px-2 py-1.5 shadow-lg ring-1 ring-black/5 backdrop-blur-md dark:bg-neutral-900/85 dark:ring-white/10">
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {reports.length}
              <span className="hidden sm:inline">{t("live")}</span>
            </span>
            <Chip active={category === "all"} onClick={() => setCategory("all")}>
              {t("filterAll")}
            </Chip>
            {CATEGORIES.map((c) => (
              <Chip key={c.key} active={category === c.key} onClick={() => setCategory(c.key)}>
                <span>{c.emoji}</span>
                <span className="hidden sm:inline">{t(c.labelKey)}</span>
              </Chip>
            ))}
            <span className="mx-0.5 h-5 w-px shrink-0 bg-slate-200 dark:bg-white/15" />
            {(["live", "1h", "3h"] as Recency[]).map((r) => (
              <Chip key={r} active={recency === r} onClick={() => setRecency(r)}>
                {t(r === "live" ? "recentLive" : r === "1h" ? "recent1h" : "recent3h")}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {/* Locate-me button (above the Report FAB) */}
      {mode === "idle" && !dirActive && (
        <button
          type="button"
          onClick={handleLocate}
          aria-label={t("locateMe")}
          className="absolute right-4 z-[900] flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg ring-1 ring-black/5 transition hover:bg-slate-50 active:scale-95 dark:bg-neutral-800 dark:text-slate-200 dark:ring-white/10"
          style={{ bottom: "calc(env(safe-area-inset-bottom) + 5.5rem)" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={locating ? "animate-spin" : ""}>
            <path d="M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      )}

      {/* Quiet-map notice */}
      {mode === "idle" && !dirActive && !loading && filtered.length === 0 && (
        <div
          className="pointer-events-none absolute inset-x-0 z-[800] flex justify-center px-4"
          style={{ bottom: "calc(env(safe-area-inset-bottom) + 1.5rem)" }}
        >
          <span className="rounded-full bg-slate-900/85 px-4 py-2 text-xs font-medium text-white shadow-lg backdrop-blur dark:bg-white/15">
            {t("noLiveReports")}
          </span>
        </div>
      )}

      <MapInner reports={filtered} locale={locale} t={t} theme={theme} route={route} routeKey={routeKey} searchPin={searchPin} />
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
        active
          ? "bg-rose-600 text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}
