"use client";

// The admin console: three tabs —
//   • Pending — review queue (approve / reject, with edit-before-approve)
//   • Live    — everything currently on the map (mark cleared / extend)
//   • Stats   — a quick overview (pending, live, today, this week, by category)
// Protected: redirects to /admin/login if not signed in; shows a notice if the
// account isn't an admin.

import { useCallback, useEffect, useMemo, useState } from "react";
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
  fetchApprovedReports,
  isCurrentUserAdmin,
  setReportStatus,
  updateReportFields,
  clearReportNow,
  extendReport,
  countReportsSince,
  type Category,
  type Report,
  type ReportEdits,
  type Severity,
} from "../../lib/reports";
import { timeAgo } from "../../lib/time";

type Phase = "checking" | "not-admin" | "ready";
type Tab = "pending" | "live" | "stats";

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
  const [tab, setTab] = useState<Tab>("pending");
  const [pending, setPending] = useState<Report[]>([]);
  const [live, setLive] = useState<Report[]>([]);
  const [today, setToday] = useState(0);
  const [week, setWeek] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const weekAgo = new Date(Date.now() - 7 * 86_400_000);
    const [p, l, td, wk] = await Promise.all([
      fetchPendingReports(),
      fetchApprovedReports(),
      countReportsSince(startOfToday.toISOString()),
      countReportsSince(weekAgo.toISOString()),
    ]);
    setPending(p);
    setLive(l);
    setToday(td);
    setWeek(wk);
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

  // Keep everything fresh: re-check every 45s and whenever the tab regains focus.
  useEffect(() => {
    if (phase !== "ready") return;
    const timer = setInterval(load, 45_000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [phase, load]);

  // Reflect the pending count in the browser tab title (a lightweight badge).
  useEffect(() => {
    const base = "Pending reports — JamKemon";
    document.title = pending.length > 0 ? `(${pending.length}) ${base}` : base;
    return () => {
      document.title = base;
    };
  }, [pending.length]);

  async function handleApprove(id: string, edits: ReportEdits | null) {
    setBusyId(id);
    if (edits) await updateReportFields(id, edits);
    const ok = await setReportStatus(id, "approved");
    if (ok) {
      setPending((prev) => prev.filter((r) => r.id !== id));
      load(); // refresh live + stats so the approved report shows up there
    }
    setBusyId(null);
  }

  async function handleReject(id: string) {
    setBusyId(id);
    const ok = await setReportStatus(id, "rejected");
    if (ok) setPending((prev) => prev.filter((r) => r.id !== id));
    setBusyId(null);
  }

  async function handleClear(id: string) {
    setBusyId(id);
    const ok = await clearReportNow(id);
    if (ok) setLive((prev) => prev.filter((r) => r.id !== id));
    setBusyId(null);
  }

  async function handleExtend(id: string) {
    setBusyId(id);
    const ok = await extendReport(id, 60);
    if (ok) await load();
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
          {phase === "ready" && pending.length > 0 && (
            <span
              className="flex h-6 min-w-[1.5rem] shrink-0 items-center justify-center rounded-full bg-rose-600 px-1.5 text-xs font-bold text-white"
              aria-label={`${pending.length} pending`}
            >
              {pending.length}
            </span>
          )}
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

      {/* Tabs */}
      {phase === "ready" && (
        <div className="flex shrink-0 items-center gap-1 border-b border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-neutral-900 sm:px-4">
          <TabButton active={tab === "pending"} onClick={() => setTab("pending")}>
            {t("tabPending")}
            {pending.length > 0 && (
              <span className="ml-1.5 rounded-full bg-rose-600 px-1.5 text-[11px] font-bold text-white">
                {pending.length}
              </span>
            )}
          </TabButton>
          <TabButton active={tab === "live"} onClick={() => setTab("live")}>
            {t("tabLive")}
            {live.length > 0 && (
              <span className="ml-1.5 rounded-full bg-emerald-500/15 px-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                {live.length}
              </span>
            )}
          </TabButton>
          <TabButton active={tab === "stats"} onClick={() => setTab("stats")}>
            {t("tabStats")}
          </TabButton>
        </div>
      )}

      <main className="flex-1 overflow-y-auto p-4">
        {phase === "checking" && (
          <p className="mt-10 text-center text-sm text-slate-500 dark:text-slate-400">
            {t("loadingQueue")}
          </p>
        )}

        {phase === "not-admin" && (
          <p className="mt-10 text-center text-sm text-rose-600">{t("notAdmin")}</p>
        )}

        {phase === "ready" && tab === "pending" && (
          pending.length === 0 ? (
            <p className="mt-10 text-center text-sm text-slate-500 dark:text-slate-400">
              {t("noPending")}
            </p>
          ) : (
            <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
              {pending.map((r) => (
                <PendingCard
                  key={r.id}
                  report={r}
                  busy={busyId === r.id}
                  locale={locale}
                  t={t}
                  onApprove={(edits) => handleApprove(r.id, edits)}
                  onReject={() => handleReject(r.id)}
                />
              ))}
            </div>
          )
        )}

        {phase === "ready" && tab === "live" && (
          live.length === 0 ? (
            <p className="mt-10 text-center text-sm text-slate-500 dark:text-slate-400">
              {t("liveQueueEmpty")}
            </p>
          ) : (
            <div className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-2">
              {live.map((r) => (
                <LiveCard
                  key={r.id}
                  report={r}
                  busy={busyId === r.id}
                  locale={locale}
                  t={t}
                  onClear={() => handleClear(r.id)}
                  onExtend={() => handleExtend(r.id)}
                />
              ))}
            </div>
          )
        )}

        {phase === "ready" && tab === "stats" && (
          <StatsView
            t={t}
            pending={pending.length}
            live={live.length}
            today={today}
            week={week}
            liveReports={live}
          />
        )}
      </main>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px flex items-center border-b-2 px-3 py-2.5 text-sm font-semibold transition ${
        active
          ? "border-rose-600 text-rose-600 dark:text-rose-400"
          : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
      }`}
    >
      {children}
    </button>
  );
}

// Shared little bits ---------------------------------------------------------

function osmEmbed(report: Report) {
  const d = 0.004;
  const bbox = `${report.lng - d},${report.lat - d},${report.lng + d},${report.lat + d}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${report.lat},${report.lng}`;
}
function osmLink(report: Report) {
  return `https://www.openstreetmap.org/?mlat=${report.lat}&mlon=${report.lng}#map=16/${report.lat}/${report.lng}`;
}

function CategoryBadge({
  report,
  t,
}: {
  report: Report;
  t: (k: MessageKey) => string;
}) {
  const cat = CATEGORIES.find((c) => c.key === report.category);
  const sev = SEVERITIES.find((s) => s.key === report.severity);
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
        <span>{cat?.emoji}</span>
        {cat ? t(cat.labelKey) : report.category}
      </span>
      <span
        className="rounded-full px-2 py-0.5 text-xs font-medium"
        style={{
          backgroundColor: (cat?.color ?? "#64748b") + "22",
          color: cat?.color ?? "#64748b",
        }}
      >
        {sev ? t(sev.labelKey) : report.severity}
      </span>
    </div>
  );
}

// Pending review card (with edit-before-approve) -----------------------------

function PendingCard({
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
  onApprove: (edits: ReportEdits | null) => void;
  onReject: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [cat, setCat] = useState<Category>(report.category);
  const [sev, setSev] = useState<Severity>(report.severity);
  const [desc, setDesc] = useState(report.description ?? "");

  const edits: ReportEdits | null = editing
    ? { category: cat, severity: sev, description: desc }
    : null;

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-white/10">
      <iframe
        title={`map-${report.id}`}
        src={osmEmbed(report)}
        className="h-36 w-full border-0"
        loading="lazy"
      />
      <div className="p-4">
        <CategoryBadge report={report} t={t} />

        {!editing ? (
          <>
            {report.description && (
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                {report.description}
              </p>
            )}
          </>
        ) : (
          <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3 dark:bg-white/5">
            <div className="grid grid-cols-2 gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCat(c.key)}
                  className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs transition ${
                    cat === c.key
                      ? "border-rose-500 bg-rose-50 font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                      : "border-slate-200 text-slate-600 dark:border-white/10 dark:text-slate-300"
                  }`}
                >
                  <span>{c.emoji}</span>
                  <span className="truncate">{t(c.labelKey)}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {SEVERITIES.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSev(s.key)}
                  className={`rounded-lg border px-2 py-1.5 text-xs transition ${
                    sev === s.key
                      ? "border-rose-500 bg-rose-50 font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                      : "border-slate-200 text-slate-600 dark:border-white/10 dark:text-slate-300"
                  }`}
                >
                  {t(s.labelKey)}
                </button>
              ))}
            </div>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value.slice(0, 280))}
              placeholder={t("descriptionPlaceholder")}
              rows={2}
              className="w-full resize-none rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-800 outline-none focus:border-rose-400 dark:border-white/10 dark:bg-neutral-800 dark:text-slate-100"
            />
          </div>
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
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="font-medium text-slate-500 underline hover:text-slate-800 dark:hover:text-slate-200"
          >
            {editing ? t("cancelEdit") : t("editReport")}
          </button>
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
            onClick={() => onApprove(edits)}
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

// Live report card (mark cleared / extend) -----------------------------------

function LiveCard({
  report,
  busy,
  locale,
  t,
  onClear,
  onExtend,
}: {
  report: Report;
  busy: boolean;
  locale: "bn" | "en";
  t: (key: MessageKey) => string;
  onClear: () => void;
  onExtend: () => void;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-white/10">
      <CategoryBadge report={report} t={t} />
      {report.description && (
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
          {report.description}
        </p>
      )}
      <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
        <span>
          {t("expiresLabel")} {timeAgo(report.expires_at, locale)}
        </span>
        <a
          href={osmLink(report)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-500 underline hover:text-slate-800 dark:hover:text-slate-200"
        >
          {t("openInOsm")}
        </a>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={onExtend}
          disabled={busy}
          className="flex-1 rounded-full border border-slate-300 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:border-white/15 dark:text-slate-300 dark:hover:bg-white/10"
        >
          {t("extend1h")}
        </button>
        <button
          onClick={onClear}
          disabled={busy}
          className="flex-1 rounded-full bg-rose-600 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
        >
          {t("markCleared")}
        </button>
      </div>
    </div>
  );
}

// Stats overview -------------------------------------------------------------

function StatsView({
  t,
  pending,
  live,
  today,
  week,
  liveReports,
}: {
  t: (key: MessageKey) => string;
  pending: number;
  live: number;
  today: number;
  week: number;
  liveReports: Report[];
}) {
  const byCategory = useMemo(() => {
    const counts = new Map<Category, number>();
    for (const r of liveReports) counts.set(r.category, (counts.get(r.category) ?? 0) + 1);
    return CATEGORIES.map((c) => ({ ...c, count: counts.get(c.key) ?? 0 })).filter(
      (c) => c.count > 0
    );
  }, [liveReports]);
  const maxCount = Math.max(1, ...byCategory.map((c) => c.count));

  return (
    <div className="mx-auto max-w-4xl">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t("statPending")} value={pending} accent="text-rose-600" />
        <StatCard label={t("statLiveNow")} value={live} accent="text-emerald-600" />
        <StatCard label={t("statToday")} value={today} accent="text-slate-900 dark:text-slate-100" />
        <StatCard label={t("statWeek")} value={week} accent="text-slate-900 dark:text-slate-100" />
      </div>

      <div className="mt-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-white/10">
        <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {t("statByCategory")}
        </h2>
        {byCategory.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">—</p>
        ) : (
          <div className="mt-3 space-y-2">
            {byCategory.map((c) => (
              <div key={c.key} className="flex items-center gap-3">
                <span className="w-32 shrink-0 truncate text-sm text-slate-700 dark:text-slate-300">
                  {c.emoji} {t(c.labelKey)}
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(c.count / maxCount) * 100}%`, backgroundColor: c.color }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {c.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mt-3 text-center text-xs text-slate-400">
        {week} {t("statReportsSubmitted")} · 7d
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-white/10">
      <div className={`text-2xl font-extrabold ${accent}`}>{value}</div>
      <div className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  );
}
