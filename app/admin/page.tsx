"use client";

// The admin moderation queue: shows pending reports with a map preview and
// Approve / Reject buttons. Protected — redirects to /admin/login if not
// signed in, and shows a notice if the account isn't an admin.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "../i18n/LanguageProvider";
import type { MessageKey } from "../i18n/messages";
import Logo from "./../components/Logo";
import { supabase } from "../../lib/supabaseClient";
import {
  CATEGORIES,
  SEVERITIES,
  fetchPendingReports,
  isCurrentUserAdmin,
  setReportStatus,
  type Report,
} from "../../lib/reports";
import { timeAgo } from "../../lib/time";

type Phase = "checking" | "not-admin" | "ready";

// True when the reporter saw the situation meaningfully earlier than they
// submitted it (an after-the-fact / offline report) — worth flagging to admins.
function isAfterTheFact(r: Report): boolean {
  if (!r.observed_at) return false;
  return new Date(r.created_at).getTime() - new Date(r.observed_at).getTime() > 3 * 60_000;
}

export default function AdminPage() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("checking");
  const [reports, setReports] = useState<Report[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setReports(await fetchPendingReports());
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!supabase) return;
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/admin/login");
        return;
      }
      const admin = await isCurrentUserAdmin();
      if (!active) return;
      if (!admin) {
        setPhase("not-admin");
        return;
      }
      await load();
      if (active) setPhase("ready");
    })();
    return () => {
      active = false;
    };
  }, [router, load]);

  async function handleDecision(id: string, status: "approved" | "rejected") {
    setBusyId(id);
    const ok = await setReportStatus(id, status);
    if (ok) {
      // Remove the card from the queue immediately.
      setReports((prev) => prev.filter((r) => r.id !== id));
    }
    setBusyId(null);
  }

  async function handleSignOut() {
    await supabase?.auth.signOut();
    router.replace("/admin/login");
  }

  return (
    <div className="flex h-dvh flex-1 flex-col bg-slate-50 dark:bg-neutral-950">
      {/* Admin header */}
      <header className="flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-3 dark:border-white/10 dark:bg-neutral-900 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Logo className="h-7 w-7 shrink-0" />
          <h1 className="truncate text-sm font-bold text-slate-900 dark:text-slate-100 sm:text-base">
            {t("adminQueueTitle")}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-sm">
          <Link
            href="/"
            className="rounded-full px-3 py-1.5 font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-100"
          >
            {t("backToMap")}
          </Link>
          <button
            onClick={handleSignOut}
            className="rounded-full border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
          >
            {t("signOut")}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        {phase === "checking" && (
          <p className="mt-10 text-center text-sm text-slate-500 dark:text-slate-400">
            {t("loadingQueue")}
          </p>
        )}

        {phase === "not-admin" && (
          <p className="mt-10 text-center text-sm text-rose-600">
            {t("notAdmin")}
          </p>
        )}

        {phase === "ready" && reports.length === 0 && (
          <p className="mt-10 text-center text-sm text-slate-500 dark:text-slate-400">
            {t("noPending")}
          </p>
        )}

        {phase === "ready" && reports.length > 0 && (
          <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
            {reports.map((r) => (
              <ReportCard
                key={r.id}
                report={r}
                busy={busyId === r.id}
                locale={locale}
                t={t}
                onApprove={() => handleDecision(r.id, "approved")}
                onReject={() => handleDecision(r.id, "rejected")}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ReportCard({
  report,
  busy,
  locale,
  t,
  onApprove,
  onReject,
}: {
  report: Report;
  busy: boolean;
  locale: "bn" | "en";
  t: (key: MessageKey) => string;
  onApprove: () => void;
  onReject: () => void;
}) {
  const cat = CATEGORIES.find((c) => c.key === report.category);
  const sev = SEVERITIES.find((s) => s.key === report.severity);
  const d = 0.004;
  const bbox = `${report.lng - d},${report.lat - d},${report.lng + d},${report.lat + d}`;
  const embedSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${report.lat},${report.lng}`;
  const osmLink = `https://www.openstreetmap.org/?mlat=${report.lat}&mlon=${report.lng}#map=16/${report.lat}/${report.lng}`;

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-white/10">
      <iframe
        title={`map-${report.id}`}
        src={embedSrc}
        className="h-36 w-full border-0"
        loading="lazy"
      />
      <div className="p-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <span>{cat?.emoji}</span>
            {cat ? t(cat.labelKey) : report.category}
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ backgroundColor: (cat?.color ?? "#64748b") + "22", color: cat?.color ?? "#64748b" }}
          >
            {sev ? t(sev.labelKey) : report.severity}
          </span>
        </div>

        {report.description && (
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{report.description}</p>
        )}

        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          <span>
            {timeAgo(report.created_at, locale)}
            {isAfterTheFact(report) && (
              <span className="ml-1.5 rounded-full bg-amber-500/15 px-1.5 py-0.5 font-medium text-amber-600 dark:text-amber-400">
                {t("seenAgoPrefix")} {timeAgo(report.observed_at!, locale)}
              </span>
            )}
          </span>
          <a
            href={osmLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 underline hover:text-slate-800"
          >
            {t("openInOsm")}
          </a>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={onReject}
            disabled={busy}
            className="flex-1 rounded-full border border-slate-300 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:border-white/15 dark:text-slate-300 dark:hover:bg-white/10"
          >
            {t("reject")}
          </button>
          <button
            onClick={onApprove}
            disabled={busy}
            className="flex-1 rounded-full bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {t("approve")}
          </button>
        </div>
      </div>
    </div>
  );
}
