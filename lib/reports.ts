// Everything about a "report": its categories, severities, and how we save one.

import { supabase } from "./supabaseClient";
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

  const { error } = await supabase.from("reports").insert({
    lat: report.lat,
    lng: report.lng,
    category: report.category,
    severity: report.severity,
    description: report.description.trim() || null,
    reporter_token: getReporterToken(),
  });

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
  expires_at: string;
  lat: number;
  lng: number;
  category: Category;
  severity: Severity;
  description: string | null;
  status: "pending" | "approved" | "rejected";
  reporter_token: string | null;
};

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
    .select(
      "id, created_at, expires_at, lat, lng, category, severity, description, status, reporter_token"
    )
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
    .select(
      "id, created_at, expires_at, lat, lng, category, severity, description, status, reporter_token"
    )
    .eq("status", "approved")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  if (error) {
    console.error("fetchApprovedReports failed:", error);
    return [];
  }
  return (data as Report[]) ?? [];
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
