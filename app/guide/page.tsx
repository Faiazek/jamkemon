"use client";

// The /guide page — a scrollable, long-form "how to use JamKemon" walkthrough,
// plus the Trust / Privacy / Data-quality story. It's a client page (unlike the
// SSR /r/[id] page) so the in-app language and theme toggles work live here too.
//
// The whole app body is `overflow-hidden`, so this page provides its own scroll
// container (flex-1 + overflow-y-auto).

import Link from "next/link";
import { useLanguage } from "../i18n/LanguageProvider";
import { useTheme } from "../theme/ThemeProvider";
import { CATEGORIES, SEVERITIES } from "../../lib/reports";
import Logo from "../components/Logo";
import { guideContent } from "./content";

// Set just before navigating home so the map opens straight into the report
// flow (read + cleared by ReportLauncher). sessionStorage, not a URL param, so
// we don't drag useSearchParams (and its Suspense boundary) into the home page.
const REPORT_INTENT_KEY = "jamkemon.intent";

export default function GuidePage() {
  const { locale, toggleLocale, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const c = guideContent[locale];

  function armReportIntent() {
    try {
      window.sessionStorage.setItem(REPORT_INTENT_KEY, "report");
    } catch {
      /* ignore */
    }
  }

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 text-slate-900 dark:bg-neutral-950 dark:text-slate-100">
      {/* Sticky chrome: back to map, brand, language + theme toggles */}
      <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-slate-50/85 backdrop-blur-xl dark:border-white/10 dark:bg-neutral-950/85">
        <div className="mx-auto flex max-w-3xl items-center gap-2.5 px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-full pr-2 transition hover:opacity-80"
          >
            <Logo className="h-8 w-8 shrink-0" />
            <span className="jk-wordmark text-lg font-semibold tracking-tight">
              JamKemon
            </span>
          </Link>
          <span className="ml-1 hidden rounded-full bg-rose-600/10 px-2.5 py-0.5 text-xs font-semibold text-rose-600 dark:bg-rose-500/15 dark:text-rose-400 sm:inline">
            {c.nav.guide}
          </span>

          <div className="ml-auto flex items-center gap-1">
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
              className="rounded-full bg-slate-900/[0.06] px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-900/10 active:scale-95 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
            >
              {t("languageName")}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pb-20">
        {/* Hero */}
        <section className="pt-10 pb-12 text-center sm:pt-14">
          <p className="text-sm font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-400">
            {c.hero.kicker}
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {c.hero.title}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
            {c.hero.subtitle}
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="rounded-full bg-rose-600 px-6 py-3 text-sm font-bold text-white shadow-sm shadow-rose-600/30 transition hover:bg-rose-700 active:scale-95"
            >
              {c.hero.ctaMap}
            </Link>
            <Link
              href="/"
              onClick={armReportIntent}
              className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 active:scale-95 dark:border-white/15 dark:bg-neutral-900 dark:text-slate-200 dark:hover:bg-white/10"
            >
              {c.hero.ctaReport}
            </Link>
          </div>
        </section>

        {/* Four steps */}
        <Section title={c.steps.title} subtitle={c.steps.subtitle}>
          <div className="grid gap-4 sm:grid-cols-2">
            {c.steps.items.map((step, i) => (
              <div
                key={i}
                className="relative rounded-2xl bg-white p-5 ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-white/10"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-600/10 text-2xl dark:bg-rose-500/15">
                    {step.emoji}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-3 text-base font-bold">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </Section>

        {/* Reading the map — category legend + severity */}
        <Section title={c.legend.title} subtitle={c.legend.subtitle}>
          <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-white/10">
            <ul className="divide-y divide-slate-100 dark:divide-white/5">
              {CATEGORIES.map((cat) => (
                <li key={cat.key} className="flex items-start gap-3.5 p-4">
                  <span
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[3px] bg-white text-lg dark:bg-neutral-950"
                    style={{ borderColor: cat.color }}
                  >
                    {cat.emoji}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{t(cat.labelKey)}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {c.legend.catDesc[cat.key]}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-white/10">
            <h3 className="text-sm font-bold">{c.legend.severityTitle}</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {SEVERITIES.map((s) => (
                <span
                  key={s.key}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-200"
                >
                  {t(s.labelKey)}
                </span>
              ))}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {c.legend.severityNote}
            </p>
          </div>
        </Section>

        {/* Report like a local */}
        <Section title={c.tips.title} subtitle={c.tips.subtitle}>
          <div className="grid gap-3">
            {c.tips.items.map((tip, i) => (
              <div
                key={i}
                className="flex items-start gap-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-white/10"
              >
                <span className="text-2xl">{tip.emoji}</span>
                <div>
                  <h3 className="text-sm font-bold">{tip.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {tip.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Beyond the map */}
        <Section title={c.features.title} subtitle={c.features.subtitle}>
          <div className="grid gap-4 sm:grid-cols-2">
            {c.features.items.map((f, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white p-5 ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-white/10"
              >
                <span className="text-2xl">{f.emoji}</span>
                <h3 className="mt-2 text-base font-bold">{f.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </Section>

        {/* Trust */}
        <TrustCard
          accent="rose"
          emoji="🛡️"
          title={c.trust.title}
          body={c.trust.body}
          points={c.trust.points}
          honest={c.trust.honest}
        />

        {/* Privacy */}
        <TrustCard
          accent="emerald"
          emoji="🔒"
          title={c.privacy.title}
          body={c.privacy.body}
          points={c.privacy.points}
        />

        {/* Data quality */}
        <TrustCard
          accent="sky"
          emoji="📊"
          title={c.quality.title}
          body={c.quality.body}
          points={c.quality.points}
          honest={c.quality.honest}
        />

        {/* FAQ */}
        <Section title={c.faq.title}>
          <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 dark:divide-white/5 dark:bg-neutral-900 dark:ring-white/10">
            {c.faq.items.map((item, i) => (
              <details key={i} className="group p-4 [&_summary]:cursor-pointer">
                <summary className="flex items-center justify-between gap-3 text-sm font-semibold marker:content-none">
                  {item.q}
                  <svg
                    className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-180"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </Section>

        {/* Outro CTA */}
        <section className="mt-14 rounded-3xl bg-gradient-to-br from-rose-500 to-rose-600 p-8 text-center text-white shadow-lg shadow-rose-600/25">
          <h2 className="text-2xl font-extrabold tracking-tight">{c.outro.title}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-rose-50">
            {c.outro.body}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="rounded-full bg-white px-6 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-50 active:scale-95"
            >
              {c.outro.ctaMap}
            </Link>
            <Link
              href="/"
              onClick={armReportIntent}
              className="rounded-full border border-white/60 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10 active:scale-95"
            >
              {c.outro.ctaReport}
            </Link>
          </div>
        </section>

        <p className="mt-10 text-center text-xs text-slate-400">{t("footerNote")}</p>
      </div>
    </main>
  );
}

// A titled content block with consistent spacing.
function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">{title}</h2>
      {subtitle && (
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {subtitle}
        </p>
      )}
      <div className="mt-5">{children}</div>
    </section>
  );
}

// The Trust / Privacy / Data-quality cards share a layout: an accent header, a
// lead paragraph, a checklist, and an optional honest "the catch" footnote.
const ACCENTS = {
  rose: {
    ring: "ring-rose-200 dark:ring-rose-500/20",
    chip: "bg-rose-600/10 dark:bg-rose-500/15",
    dot: "text-rose-600 dark:text-rose-400",
  },
  emerald: {
    ring: "ring-emerald-200 dark:ring-emerald-500/20",
    chip: "bg-emerald-600/10 dark:bg-emerald-500/15",
    dot: "text-emerald-600 dark:text-emerald-400",
  },
  sky: {
    ring: "ring-sky-200 dark:ring-sky-500/20",
    chip: "bg-sky-600/10 dark:bg-sky-500/15",
    dot: "text-sky-600 dark:text-sky-400",
  },
} as const;

function TrustCard({
  accent,
  emoji,
  title,
  body,
  points,
  honest,
}: {
  accent: keyof typeof ACCENTS;
  emoji: string;
  title: string;
  body: string;
  points: string[];
  honest?: string;
}) {
  const a = ACCENTS[accent];
  return (
    <section
      className={`mt-12 rounded-3xl bg-white p-6 ring-1 sm:p-8 dark:bg-neutral-900 ${a.ring}`}
    >
      <div className="flex items-center gap-3">
        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${a.chip}`}>
          {emoji}
        </span>
        <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">{title}</h2>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {body}
      </p>
      <ul className="mt-4 space-y-2.5">
        {points.map((p, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed">
            <svg className={`mt-0.5 h-4 w-4 shrink-0 ${a.dot}`} viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-slate-700 dark:text-slate-200">{p}</span>
          </li>
        ))}
      </ul>
      {honest && (
        <p className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-sm italic leading-relaxed text-slate-500 ring-1 ring-slate-200/70 dark:bg-white/5 dark:text-slate-400 dark:ring-white/5">
          {honest}
        </p>
      )}
    </section>
  );
}
