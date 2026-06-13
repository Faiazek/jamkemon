// Shareable report page (/r/<id>) — the app's first SSR page.
//
// When someone shares a jam to WhatsApp/Facebook, this renders a rich link
// preview (see generateMetadata + opengraph-image.tsx) and a small landing page
// that funnels the visitor into the live map. Localized (bn/en) from the
// Accept-Language header, since there's no client-side language pref on a fresh
// server render.

import Link from "next/link";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { CATEGORIES, SEVERITIES, fetchSharedReport } from "../../../lib/reports";
import { messages, type Locale } from "../../i18n/messages";
import { timeAgo } from "../../../lib/time";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://jamkemon.com";

type Props = { params: Promise<{ id: string }> };

async function resolveLocale(): Promise<Locale> {
  const al = (await headers()).get("accept-language") || "";
  return /\bbn\b/i.test(al) ? "bn" : "en";
}

function osmEmbed(lat: number, lng: number): string {
  const d = 0.004;
  const bbox = `${lng - d},${lat - d},${lng + d},${lat + d}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const report = await fetchSharedReport(id);
  if (!report) {
    return {
      title: "JamKemon — জ্যাম কেমন?",
      description: messages.en.tagline,
    };
  }
  // OG/preview text stays English + emoji: universally readable in link
  // unfurls, and avoids Bengali-glyph issues in the generated image.
  const cat = CATEGORIES.find((c) => c.key === report.category);
  const label = cat ? messages.en[cat.labelKey] : report.category;
  const title = `${cat?.emoji ?? "📍"} ${label} — JamKemon`;
  const description = report.description?.trim() || messages.en.tagline;
  const url = `${SITE}/r/${id}`;
  return {
    title,
    description,
    openGraph: { title, description, url, type: "website", siteName: "JamKemon" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function SharedReportPage({ params }: Props) {
  const { id } = await params;
  const [report, locale] = await Promise.all([fetchSharedReport(id), resolveLocale()]);
  const m = messages[locale];

  const cat = report && CATEGORIES.find((c) => c.key === report.category);
  const sev = report && SEVERITIES.find((s) => s.key === report.severity);
  const expired = report ? new Date(report.expires_at).getTime() < Date.now() : false;

  return (
    <div className="flex min-h-dvh flex-col items-center bg-slate-50 px-4 py-8 dark:bg-neutral-950">
      <div className="w-full max-w-md">
        {/* Brand */}
        <Link href="/" className="mb-5 flex items-center justify-center gap-2">
          <span className="text-xl font-extrabold tracking-tight text-rose-600">
            JamKemon
          </span>
          <span className="text-lg font-bold text-slate-400">জ্যাম কেমন?</span>
        </Link>

        {!report ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-white/10">
            <p className="text-sm text-slate-500 dark:text-slate-400">{m.noLiveReports}</p>
            <Link
              href="/"
              className="mt-5 inline-block rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
            >
              {m.sharedOpenMap}
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-white/10">
            <iframe
              title="map"
              src={osmEmbed(report.lat, report.lng)}
              className="h-44 w-full border-0"
              loading="lazy"
            />
            <div className="p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
                  <span className="text-xl">{cat?.emoji}</span>
                  {cat ? m[cat.labelKey] : report.category}
                </span>
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  style={{
                    backgroundColor: (cat?.color ?? "#64748b") + "22",
                    color: cat?.color ?? "#64748b",
                  }}
                >
                  {sev ? m[sev.labelKey] : report.severity}
                </span>
              </div>

              {report.description && (
                <p className="mt-2.5 text-sm text-slate-700 dark:text-slate-300">
                  {report.description}
                </p>
              )}

              {report.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={report.photo_url}
                  alt=""
                  className="mt-3 max-h-60 w-full rounded-xl object-cover"
                />
              )}

              <p className="mt-3 text-xs text-slate-400">
                🕒 {m.reportedPrefix} {timeAgo(report.created_at, locale)}
              </p>

              {expired && (
                <p className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-400">
                  {m.sharedExpired}
                </p>
              )}

              <div className="mt-5 flex flex-col gap-2">
                <Link
                  href="/"
                  className="rounded-full bg-rose-600 py-2.5 text-center text-sm font-semibold text-white hover:bg-rose-700"
                >
                  {m.sharedOpenMap}
                </Link>
                <Link
                  href="/"
                  className="rounded-full border border-slate-300 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
                >
                  {m.sharedReportCta}
                </Link>
              </div>
            </div>
          </div>
        )}

        <p className="mt-5 text-center text-xs text-slate-400">{m.tagline}</p>
      </div>
    </div>
  );
}
