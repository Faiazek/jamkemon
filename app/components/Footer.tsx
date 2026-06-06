"use client";

import { useLanguage } from "../i18n/LanguageProvider";

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="z-[1000] border-t border-slate-200 bg-white px-4 py-2 text-center text-xs text-slate-400">
      {t("footerNote")}
    </footer>
  );
}
