// Turns a timestamp into a short "x minutes ago" string in Bangla or English.

import type { Locale } from "../app/i18n/messages";

export function timeAgo(iso: string, locale: Locale): string {
  const then = new Date(iso).getTime();
  const diffSec = Math.round((then - Date.now()) / 1000); // negative = past
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  const abs = Math.abs(diffSec);
  if (abs < 60) return rtf.format(Math.round(diffSec), "second");
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
  return rtf.format(Math.round(diffSec / 86400), "day");
}
