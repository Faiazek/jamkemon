"use client";

// The visible report experience that sits on top of the map:
//   • a banner that guides the user to place a pin
//   • a bottom sheet form for category / severity / details
//   • a success / error message after submitting

import { useState } from "react";
import { useLanguage } from "../i18n/LanguageProvider";
import { useReport } from "../report/ReportContext";
import {
  CATEGORIES,
  SEVERITIES,
  SEEN_OPTIONS,
  submitReport,
  type Category,
  type Severity,
} from "../../lib/reports";

type SubmitState = "idle" | "submitting" | "success" | "error";

export default function ReportFlow() {
  const { t } = useLanguage();
  const { mode, draft, placeAt, continueToForm, backToPicking, cancel, flyTo } =
    useReport();

  const [category, setCategory] = useState<Category | null>(null);
  const [severity, setSeverity] = useState<Severity>("medium");
  const [seenMinutes, setSeenMinutes] = useState(0);
  const [description, setDescription] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [notConnected, setNotConnected] = useState(false);
  const [geoError, setGeoError] = useState(false);

  function resetForm() {
    setCategory(null);
    setSeverity("medium");
    setSeenMinutes(0);
    setDescription("");
    setSubmitState("idle");
    setNotConnected(false);
    setGeoError(false);
  }

  function handleCancel() {
    resetForm();
    cancel();
  }

  function handleUseLocation() {
    setGeoError(false);
    if (!navigator.geolocation) {
      setGeoError(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        placeAt(latitude, longitude);
        flyTo(latitude, longitude);
      },
      () => setGeoError(true)
    );
  }

  async function handleSubmit() {
    if (!category || !draft) return;
    setSubmitState("submitting");
    const result = await submitReport({
      lat: draft.lat,
      lng: draft.lng,
      category,
      severity,
      description,
      observedAt: new Date(Date.now() - seenMinutes * 60_000).toISOString(),
    });
    if (result.ok) {
      setSubmitState("success");
    } else {
      setNotConnected(result.reason === "not-configured");
      setSubmitState("error");
    }
  }

  if (mode === "idle") return null;

  // ---- Picking a location -------------------------------------------------
  if (mode === "picking") {
    return (
      <div
        className="pointer-events-none absolute inset-x-0 z-[1000] flex justify-center px-3"
        style={{ top: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <div className="pointer-events-auto w-full max-w-md rounded-2xl bg-white/90 p-3 shadow-xl ring-1 ring-black/5 backdrop-blur-md dark:bg-neutral-900/90 dark:ring-white/10">
          <p className="text-center text-sm font-semibold text-slate-800 dark:text-slate-200">
            {draft ? t("adjustPinPrompt") : t("pickLocationPrompt")}
          </p>
          {geoError && (
            <p className="mt-1 text-center text-xs text-rose-600">
              {t("geolocationError")}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 active:scale-95 dark:border-white/15 dark:text-slate-300 dark:hover:bg-white/5"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              onClick={handleUseLocation}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 active:scale-95 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5"
            >
              📍 {t("useMyLocation")}
            </button>
            <button
              type="button"
              onClick={continueToForm}
              disabled={!draft}
              className="rounded-full bg-rose-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("continue")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- The form (bottom sheet) -------------------------------------------
  return (
    <div className="absolute inset-0 z-[1100] flex items-end justify-center bg-black/40 backdrop-blur-[2px] sm:items-center">
      <div
        className="jk-slideup max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white px-5 pt-2 pb-5 shadow-2xl dark:bg-neutral-900 sm:rounded-3xl sm:pt-5"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        {/* grab handle (mobile affordance) */}
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300 dark:bg-neutral-700 sm:hidden" />
        {submitState === "success" ? (
          <div className="py-6 text-center">
            <div className="text-4xl">✅</div>
            <h2 className="mt-3 text-lg font-bold text-slate-900 dark:text-slate-100">
              {t("successTitle")}
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t("successBody")}</p>
            <button
              type="button"
              onClick={handleCancel}
              className="mt-5 w-full rounded-full bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
            >
              {t("done")}
            </button>
          </div>
        ) : (
          <>
            {/* Category */}
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {t("chooseCategory")}
            </h2>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {CATEGORIES.map((c) => {
                const selected = category === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setCategory(c.key)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition ${
                      selected
                        ? "border-rose-500 bg-rose-50 font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
                    }`}
                  >
                    <span className="text-base">{c.emoji}</span>
                    <span className="truncate">{t(c.labelKey)}</span>
                  </button>
                );
              })}
            </div>

            {/* Severity */}
            <h2 className="mt-4 text-sm font-semibold text-slate-800 dark:text-slate-200">
              {t("chooseSeverity")}
            </h2>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {SEVERITIES.map((s) => {
                const selected = severity === s.key;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setSeverity(s.key)}
                    className={`rounded-xl border px-3 py-2 text-sm transition ${
                      selected
                        ? "border-rose-500 bg-rose-50 font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
                    }`}
                  >
                    {t(s.labelKey)}
                  </button>
                );
              })}
            </div>

            {/* When did you see this? — supports after-the-fact / offline reporting */}
            <h2 className="mt-4 text-sm font-semibold text-slate-800 dark:text-slate-200">
              {t("seenLabel")}
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">{t("seenHint")}</p>
            <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
              {SEEN_OPTIONS.map((o) => {
                const selected = seenMinutes === o.minutesAgo;
                return (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => setSeenMinutes(o.minutesAgo)}
                    className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-2 text-sm transition ${
                      selected
                        ? "border-rose-500 bg-rose-50 font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
                    }`}
                  >
                    {t(o.labelKey)}
                  </button>
                );
              })}
            </div>

            {/* Description */}
            <h2 className="mt-4 text-sm font-semibold text-slate-800 dark:text-slate-200">
              {t("descriptionLabel")}
            </h2>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 280))}
              placeholder={t("descriptionPlaceholder")}
              rows={2}
              className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-rose-400 dark:border-white/10 dark:bg-neutral-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            />

            {submitState === "error" && (
              <p className="mt-2 text-center text-xs text-rose-600">
                {notConnected ? t("notConfigured") : t("submitError")}
              </p>
            )}

            {/* Actions */}
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={backToPicking}
                className="rounded-full border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-white/15 dark:text-slate-300 dark:hover:bg-white/5"
              >
                {t("back")}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!category || submitState === "submitting"}
                className="flex-1 rounded-full bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitState === "submitting"
                  ? t("submitting")
                  : !category
                    ? t("selectCategoryFirst")
                    : t("submit")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
