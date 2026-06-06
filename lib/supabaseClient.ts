// Connection to Supabase (our database). The two values below come from your
// Supabase project and live in the .env.local file — never hard-coded here.
// Until that file is filled in, `isSupabaseConfigured` is false and the app
// shows a friendly "not connected yet" message instead of crashing.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!)
  : null;
