"use client";

// A discreet "Feedback" button (in the right-side control stack) that opens a
// small form. Submissions go to the Supabase `feedback` table.

import { useState } from "react";
import { useLanguage } from "../i18n/LanguageProvider";
import { useReport } from "../report/ReportContext";
import { useDirections } from "../directions/DirectionsContext";
import { sendFeedback } from "../../lib/feedback";

type State = "idle" | "sending" | "done" | "error";

export default function Feedback() {
  const { t } = useLanguage();
  const { mode } = useReport();
  const { active: dirActive } = useDirections();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [state, setState] = useState<State>("idle");

  function close() {
    setOpen(false);
    setMessage("");
    setContact("");
    setState("idle");
  }

  async function submit() {
    if (!message.trim() || state === "sending") return;
    setState("sending");
    const ok = await sendFeedback(message, contact);
    setState(ok ? "done" : "error");
  }

  // Hidden while reporting or in directions, matching the other map chrome.
  const showButton = mode === "idle" && !dirActive;

  return (
    <>
      {showButton && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t("feedbackButton")}
          title={t("feedbackButton")}
          className="jk-float absolute right-4 z-[900] flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 text-slate-700 ring-1 ring-black/5 backdrop-blur-xl transition hover:bg-white active:scale-95 dark:bg-neutral-800/90 dark:text-slate-200 dark:ring-white/10"
          style={{ bottom: "calc(env(safe-area-inset-bottom) + 9rem)" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.2A8 8 0 1121 12z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      {open && (
        <div className="absolute inset-0 z-[1300] flex items-end justify-center bg-black/40 backdrop-blur-[2px] sm:items-center">
          <div
            className="jk-slideup w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-neutral-900 sm:rounded-3xl"
            style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300 dark:bg-neutral-700 sm:hidden" />

            {state === "done" ? (
              <div className="py-6 text-center">
                <div className="text-4xl">🙏</div>
                <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                  {t("feedbackThanks")}
                </p>
                <button
                  type="button"
                  onClick={close}
                  className="mt-5 w-full rounded-full bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
                >
                  {t("done")}
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {t("feedbackTitle")}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {t("feedbackBody")}
                </p>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
                  placeholder={t("feedbackPlaceholder")}
                  rows={4}
                  autoFocus
                  className="mt-3 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-rose-400 dark:border-white/10 dark:bg-neutral-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
                <input
                  value={contact}
                  onChange={(e) => setContact(e.target.value.slice(0, 200))}
                  placeholder={t("feedbackContactPlaceholder")}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-rose-400 dark:border-white/10 dark:bg-neutral-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
                {state === "error" && (
                  <p className="mt-2 text-center text-xs text-rose-600">{t("feedbackError")}</p>
                )}
                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-full border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-white/15 dark:text-slate-300 dark:hover:bg-white/5"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="button"
                    onClick={submit}
                    disabled={!message.trim() || state === "sending"}
                    className="flex-1 rounded-full bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {state === "sending" ? t("feedbackSending") : t("feedbackSend")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
