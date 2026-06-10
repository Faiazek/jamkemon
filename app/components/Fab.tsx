"use client";

// The primary action: a floating "Report" button anchored bottom-right where
// a thumb can reach it. Circular on phones, a labeled pill on wider screens.
// Hidden while a report is in progress.

import { useLanguage } from "../i18n/LanguageProvider";
import { useReport } from "../report/ReportContext";
import { useDirections } from "../directions/DirectionsContext";

export default function Fab() {
  const { t } = useLanguage();
  const { startReport, mode } = useReport();
  const { active: dirActive } = useDirections();

  if (mode !== "idle" || dirActive) return null;

  return (
    <button
      type="button"
      onClick={startReport}
      className="absolute bottom-5 right-4 z-[1000] flex items-center gap-2 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 p-4 text-white shadow-lg shadow-rose-600/35 ring-4 ring-white/50 transition hover:from-rose-600 hover:to-rose-700 hover:shadow-rose-600/45 active:scale-95 dark:ring-white/15 sm:px-5"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
      <span className="hidden pr-1 text-sm font-bold sm:inline">
        {t("reportButton")}
      </span>
    </button>
  );
}
