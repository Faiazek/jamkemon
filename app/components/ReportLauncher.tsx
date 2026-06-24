"use client";

// Bridges the /guide "Report something" CTAs to the map's report flow. The guide
// page can't call useReport() across a navigation, so it leaves an intent flag in
// sessionStorage and links home; we read it once here on the map and open the
// report flow. Kept tiny and self-contained so the home page stays a thin shell.

import { useEffect } from "react";
import { useReport } from "../report/ReportContext";

const REPORT_INTENT_KEY = "jamkemon.intent";

export default function ReportLauncher() {
  const { startReport } = useReport();

  useEffect(() => {
    let intent: string | null = null;
    try {
      intent = window.sessionStorage.getItem(REPORT_INTENT_KEY);
      if (intent) window.sessionStorage.removeItem(REPORT_INTENT_KEY);
    } catch {
      /* ignore */
    }
    if (intent === "report") startReport();
  }, [startReport]);

  return null;
}
