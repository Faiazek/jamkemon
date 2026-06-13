// Sending in-app feedback / bug reports to Supabase (see supabase/feedback.sql).

import { supabase } from "./supabaseClient";
import { getReporterToken } from "./reports";

export interface FeedbackRow {
  id: string;
  created_at: string;
  message: string;
  contact: string | null;
  reporter_token: string | null;
  user_agent: string | null;
  dismissed: boolean;
}

export async function sendFeedback(
  message: string,
  contact: string
): Promise<boolean> {
  if (!supabase) return false;
  const text = message.trim();
  if (!text) return false;
  const { error } = await supabase.from("feedback").insert({
    message: text.slice(0, 2000),
    contact: contact.trim().slice(0, 200) || null,
    reporter_token: getReporterToken(),
    user_agent:
      typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 300) : null,
  });
  if (error) {
    console.error("sendFeedback failed:", error);
    return false;
  }
  return true;
}

export async function fetchFeedback(): Promise<FeedbackRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    console.error("fetchFeedback failed:", error);
    return [];
  }
  return (data ?? []) as FeedbackRow[];
}

export async function dismissFeedback(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from("feedback")
    .update({ dismissed: true })
    .eq("id", id);
  if (error) {
    console.error("dismissFeedback failed:", error);
    return false;
  }
  return true;
}
