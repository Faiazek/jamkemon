"use client";

// Private sign-in for the admin. Uses Supabase Auth (email + password).

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../i18n/LanguageProvider";
import { supabase } from "../../../lib/supabaseClient";

export default function AdminLoginPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError(false);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setError(true);
      setBusy(false);
      return;
    }
    router.replace("/admin");
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-slate-50 p-4 dark:bg-neutral-950">
      <form
        onSubmit={handleSignIn}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-white/10"
      >
        <h1 className="text-center text-lg font-bold text-slate-900 dark:text-slate-100">
          {t("appName")}
        </h1>
        <p className="mt-1 text-center text-sm text-slate-500 dark:text-slate-400">
          {t("adminLoginTitle")}
        </p>

        <label className="mt-5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          {t("emailLabel")}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-rose-400 dark:border-white/10 dark:bg-neutral-800 dark:text-slate-100"
          />
        </label>

        <label className="mt-3 block text-sm font-medium text-slate-700 dark:text-slate-300">
          {t("passwordLabel")}
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-rose-400 dark:border-white/10 dark:bg-neutral-800 dark:text-slate-100"
          />
        </label>

        {error && (
          <p className="mt-3 text-center text-xs text-rose-600">
            {t("loginError")}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-5 w-full rounded-full bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
        >
          {busy ? t("signingIn") : t("signIn")}
        </button>
      </form>
    </div>
  );
}
