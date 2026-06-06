"use client";

// Reusable geocoding input with an autocomplete dropdown. Parent controls the
// text (value/onChange) and receives the chosen Place via onSelect.

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageProvider";
import { searchPlaces, type Place } from "../../lib/geocode";

export default function PlaceInput({
  value,
  onChange,
  onSelect,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (p: Place) => void;
  placeholder: string;
}) {
  const { t } = useLanguage();
  const [results, setResults] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        setResults(await searchPlaces(q, ctrl.signal));
      } catch {
        /* aborted / network — ignore */
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [value]);

  return (
    <div className="relative min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-slate-400">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
        {value && (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onChange("");
              setResults([]);
            }}
            className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Clear"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {open && value.trim().length >= 2 && (
        <div className="absolute inset-x-0 top-full z-[10] mt-2 overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-neutral-800 dark:ring-white/10">
          {loading && results.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-slate-400">{t("searchSearching")}</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-slate-400">{t("searchNoResults")}</p>
          ) : (
            results.map((p, i) => (
              <button
                key={i}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(p.label);
                  setResults([]);
                  setOpen(false);
                  onSelect(p);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-white/5"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-base dark:bg-white/10">
                  {p.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                    {p.label}
                  </span>
                  <span className="block truncate text-xs text-slate-400">
                    {t(p.kindKey)} · {p.sub}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
