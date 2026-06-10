// Sending in-app feedback / bug reports to Supabase (see supabase/feedback.sql).

import { supabase } from "./supabaseClient";
import { getReporterToken } from "./reports";

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
