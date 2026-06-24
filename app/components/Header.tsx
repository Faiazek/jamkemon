"use client";

// Floating glass top bar, search-centric (like Google Maps): logo, area
// search, then theme + language toggles. Hidden while reporting.

import Link from "next/link";
import { useLanguage } from "../i18n/LanguageProvider";
import { useReport } from "../report/ReportContext";
import { useDirections } from "../directions/DirectionsContext";
import { useTheme } from "../theme/ThemeProvider";
import Logo from "./Logo";
import SearchBar from "./SearchBar";

export default function TopBar() {
  const { t, toggleLocale } = useLanguage();
  const { mode } = useReport();
  const { active: dirActive, open: openDirections } = useDirections();
  const { theme, toggleTheme } = useTheme();

  if (mode !== "idle" || dirActive) return null;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-[1000] flex justify-center px-3 pt-3"
      style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
    >
      <div className="jk-float pointer-events-auto flex w-full max-w-2xl items-center gap-2.5 rounded-2xl bg-white/80 px-3 py-2 ring-1 ring-black/5 backdrop-blur-xl dark:bg-neutral-900/80 dark:ring-white/10">
        <Logo className="h-8 w-8 shrink-0" />
        <span className="jk-wordmark hidden shrink-0 text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:block">
          JamKemon
        </span>

        <SearchBar />

        <span className="h-6 w-px shrink-0 bg-slate-200/80 dark:bg-white/10" />

        <div className="flex shrink-0 items-center gap-1">
          <Link
            href="/guide"
            aria-label={t("guide")}
            title={t("guide")}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-900/[0.06] active:scale-95 dark:text-slate-300 dark:hover:bg-white/10"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
              <path d="M9.5 9.5a2.5 2.5 0 113.5 2.3c-.8.4-1 .8-1 1.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="17" r="1" fill="currentColor" />
            </svg>
          </Link>
          <button
            type="button"
            onClick={openDirections}
            aria-label={t("directions")}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-900/[0.06] active:scale-95 dark:text-slate-300 dark:hover:bg-white/10"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 11l18-8-8 18-2-8-8-2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={t("themeToggle")}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-900/[0.06] active:scale-95 dark:text-slate-300 dark:hover:bg-white/10"
          >
            {theme === "dark" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
                <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={toggleLocale}
            aria-label="Switch language"
            className="shrink-0 rounded-full bg-slate-900/[0.06] px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-900/10 active:scale-95 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
          >
            {t("languageName")}
          </button>
        </div>
      </div>
    </div>
  );
}
