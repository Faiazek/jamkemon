"use client";

// A one-time welcome shown on a visitor's first arrival, explaining what
// JamKemon is and how to contribute. Remembered in the browser after dismissal.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "../i18n/LanguageProvider";
import Logo from "./Logo";

const KEY = "jamkemon.welcomed";

export default function WelcomeCard() {
  const { t } = useLanguage();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!window.localStorage.getItem(KEY)) setShow(true);
  }, []);

  function dismiss() {
    window.localStorage.setItem(KEY, "1");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="absolute inset-0 z-[1200] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
      <div className="jk-fadein w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center">
          <Logo className="h-16 w-16" />
        </div>
        <p className="jk-wordmark mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          JamKemon
        </p>
        <h2 className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
          {t("welcomeTitle")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {t("welcomeBody")}
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="mt-6 w-full rounded-full bg-rose-600 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-rose-700 active:scale-95"
        >
          {t("welcomeCta")}
        </button>
        <Link
          href="/guide"
          onClick={dismiss}
          className="mt-3 inline-block text-sm font-semibold text-rose-600 transition hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
        >
          {t("guide")} →
        </Link>
      </div>
    </div>
  );
}
