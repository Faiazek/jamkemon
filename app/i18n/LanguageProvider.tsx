"use client";

// Holds the current language for the whole app, remembers the user's choice
// in their browser, and gives every component a simple t("key") function.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { messages, type Locale, type MessageKey } from "./messages";

type LanguageContextValue = {
  locale: Locale;
  toggleLocale: () => void;
  t: (key: MessageKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "jamkemon.locale";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Default to Bangla — most users in Dhaka.
  const [locale, setLocale] = useState<Locale>("bn");

  // On first load, restore the language the user picked last time.
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "bn" || saved === "en") {
      setLocale(saved);
    }
  }, []);

  // Keep the <html lang="…"> attribute in sync for accessibility/SEO.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const toggleLocale = useCallback(() => {
    setLocale((prev) => {
      const next = prev === "bn" ? "en" : "bn";
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const t = useCallback(
    (key: MessageKey) => messages[locale][key],
    [locale]
  );

  const value = useMemo(
    () => ({ locale, toggleLocale, t }),
    [locale, toggleLocale, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return ctx;
}
