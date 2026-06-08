// Everything about a "report": its categories, severities, and how we save one.

import { supabase } from "./supabaseClient";
import { haversineMeters } from "./geo";
import type { MessageKey } from "../app/i18n/messages";

export type Category =
  | "jam"
  | "accident"
  | "waterlogging"
  | "roadblock"
  | "protest"
  | "construction"
  | "other";

export type Severity = "low" | "medium" | "high";

// Category definitions: the label key (for both languages), a color for the
// map pin (used in a later phase), and an emoji shown in the picker.
export const CATEGORIES: {
  key: Category;
  labelKey: MessageKey;
  color: string;
  emoji: string;
}[] = [
  { key: "jam", labelKey: "categoryJam", color: "#dc2626", emoji: "🚗" },
  { key: "accident", labelKey: "categoryAccident", color: "#ea580c", emoji: "💥" },
  { key: "waterlogging", labelKey: "categoryWaterlogging", color: "#2563eb", emoji: "🌊" },
  { key: "roadblock", labelKey: "categoryRoadblock", color: "#7c3aed", emoji: "🚧" },
  { key: "protest", labelKey: "categoryProtest", color: "#db2777", emoji: "📢" },
  { key: "construction", labelKey: "categoryConstruction", color: "#ca8a04", emoji: "🏗️" },
  { key: "other", labelKey: "categoryOther", color: "#64748b", emoji: "📍" },
];

export const SEVERITIES: { key: Severity; labelKey: MessageKey }[] = [
  { key: "low", labelKey: "severityLow" },
  { key: "medium", labelKey: "severityMedium" },
  { key: "high", labelKey: "severityHigh" },
];

// "When did you see this?" — lets people report something they saw earlier,
// e.g. they had no internet at the time and submit once back home. The chosen
// offset shifts the report's observed time, which the database uses to expire
// after-the-fact reports sooner (see supabase/observed_at.sql).
export const SEEN_OPTIONS: { key: string; labelKey: MessageKey; minutesAgo: number }[] = [
  { key: "now", labelKey: "seenNow", minutesAgo: 0 },
  { key: "15m", labelKey: "seen15m", minutesAgo: 15 },
  { key: "30m", labelKey: "seen30m", minutesAgo: 30 },
  { key: "1h", labelKey: "seen1h", minutesAgo: 60 },
  { key: "2h", labelKey: "seen2h", minutesAgo: 120 },
];

// A stable anonymous id for this device, used later for rate-limiting and to
// let people see/manage their own reports. Stored in the browser only.
export function getReporterToken(): string {
  const KEY = "jamkemon.reporter";
  let token = window.localStorage.getItem(KEY);
  if (!token) {
    token = crypto.randomUUID();
    window.localStorage.setItem(KEY, token);
  }
  return token;
}

export type NewReport = {
  lat: number;
  lng: number;
  category: Category;
  severity: Severity;
  description: string;
  // When the reporter actually saw it (ISO). May be earlier than now for
  // after-the-fact reports. The database validates and clamps this.
  observedAt: string;
};

export type SubmitResult =
  | { ok: true }
  | { ok: false; reason: "not-configured" | "error" };

// Saves a report as "pending" (the database forces this — see schema.sql).
// We deliberately do NOT read the row back, because our security rules only
// expose approved reports to the public.
export async function submitReport(report: NewReport): Promise<SubmitResult> {
  if (!supabase) {
    return { ok: false, reason: "not-configured" };
  }

  const base = {
    lat: report.lat,
    lng: report.lng,
    category: report.category,
    severity: report.severity,
    description: report.description.trim() || null,
    reporter_token: getReporterToken(),
  };

  let { error } = await supabase
    .from("reports")
    .insert({ ...base, observed_at: report.observedAt });

  // If the observed_at migration hasn't been applied yet, fall back to a plain
  // insert so reporting keeps working (the report just won't be back-dated).
  if (error?.code === "42703") {
    ({ error } = await supabase.from("reports").insert(base));
  }

  if (error) {
    console.error("submitReport failed:", error);
    return { ok: false, reason: "error" };
  }
  return { ok: true };
}

// ---- Admin side ----------------------------------------------------------

// A full report row as stored in the database.
export type Report = {
  id: string;
  created_at: string;
  observed_at: string | null;
  expires_at: string;
  lat: number;
  lng: number;
  category: Category;
  severity: Severity;
  description: string | null;
  status: "pending" | "approved" | "rejected";
  reporter_token: string | null;
};

// Select all columns rather than naming observed_at explicitly: that keeps the
// read working whether or not the observed_at migration has been applied yet
// (a named-but-missing column would otherwise fail the entire query).
const REPORT_COLUMNS = "*";

// When the report was actually witnessed (falls back to submission time for
// older rows that predate the observed_at column).
export function observedTime(r: Report): number {
  return new Date(r.observed_at ?? r.created_at).getTime();
}

// Is the currently signed-in user an approved admin?
export async function isCurrentUserAdmin(): Promise<boolean> {
  if (!supabase) return false;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return false;
  const { data, error } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  return !error && Boolean(data);
}

// All reports awaiting review, newest first. Only works for admins (RLS).
export async function fetchPendingReports(): Promise<Report[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("reports")
    .select(REPORT_COLUMNS)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("fetchPendingReports failed:", error);
    return [];
  }
  return (data as Report[]) ?? [];
}

// Approved reports that haven't expired — what the public map shows.
// (The security rules already limit anonymous users to exactly these, but we
// filter explicitly too so it also works correctly when an admin is signed in.)
export async function fetchApprovedReports(): Promise<Report[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("reports")
    .select(REPORT_COLUMNS)
    .eq("status", "approved")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  if (error) {
    console.error("fetchApprovedReports failed:", error);
    return [];
  }
  return (data as Report[]) ?? [];
}

// ---- Reconciliation ------------------------------------------------------

// How close two same-category reports must be to count as "the same situation".
const DEDUPE_RADIUS_M = 150;

// Collapse near-duplicate reports so fresher information wins. When several
// reports of the same category sit within DEDUPE_RADIUS_M of each other (e.g. a
// jam someone reported live and the same jam someone else saw an hour earlier),
// only the most recently *observed* one is kept. Combined with observed_at-based
// expiry, this is how an after-the-fact report quietly drops out once newer
// sightings exist or its freshness window passes.
export function reconcile(reports: Report[]): Report[] {
  const byFreshest = [...reports].sort((a, b) => observedTime(b) - observedTime(a));
  const kept: Report[] = [];
  for (const r of byFreshest) {
    const superseded = kept.some(
      (k) =>
        k.category === r.category &&
        haversineMeters(k.lat, k.lng, r.lat, r.lng) <= DEDUPE_RADIUS_M
    );
    if (!superseded) kept.push(r);
  }
  return kept;
}

// Approve or reject a report (admin only, enforced by RLS).
export async function setReportStatus(
  id: string,
  status: "approved" | "rejected"
): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from("reports")
    .update({ status })
    .eq("id", id);
  if (error) {
    console.error("setReportStatus failed:", error);
    return false;
  }
  return true;
}

// Edit a report's details (admin only). Used by "edit before approving".
export type ReportEdits = {
  category: Category;
  severity: Severity;
  description: string | null;
};
export async function updateReportFields(
  id: string,
  edits: ReportEdits
): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from("reports")
    .update({
      category: edits.category,
      severity: edits.severity,
      description: edits.description?.trim() || null,
    })
    .eq("id", id);
  if (error) {
    console.error("updateReportFields failed:", error);
    return false;
  }
  return true;
}

// Take a live report off the map immediately by expiring it now ("mark cleared"
// / "end early"). Admin only.
export async function clearReportNow(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from("reports")
    .update({ expires_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    console.error("clearReportNow failed:", error);
    return false;
  }
  return true;
}

// Keep a live report on the map longer by pushing its expiry out. Admin only.
export async function extendReport(id: string, minutes: number): Promise<boolean> {
  if (!supabase) return false;
  const until = new Date(Date.now() + minutes * 60_000).toISOString();
  const { error } = await supabase
    .from("reports")
    .update({ expires_at: until })
    .eq("id", id);
  if (error) {
    console.error("extendReport failed:", error);
    return false;
  }
  return true;
}

// Count reports submitted since a given time (admin only) — for the dashboard.
export async function countReportsSince(sinceIso: string): Promise<number> {
  if (!supabase) return 0;
  const { count, error } = await supabase
    .from("reports")
    .select("id", { count: "exact", head: true })
    .gte("created_at", sinceIso);
  if (error) {
    console.error("countReportsSince failed:", error);
    return 0;
  }
  return count ?? 0;
}
