"use client";

// Fetches approved + live reports once and shares them with the whole app
// (the map renders them; the top bar shows the count). Refreshes every minute
// and when the tab regains focus, so expired reports drop off on their own.

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { fetchApprovedReports, type Report } from "../../lib/reports";

type ReportsContextValue = {
  reports: Report[];
  loading: boolean;
};

const ReportsContext = createContext<ReportsContextValue>({
  reports: [],
  loading: true,
});

const REFRESH_MS = 60_000;

export function ReportsProvider({ children }: { children: React.ReactNode }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const data = await fetchApprovedReports();
      if (active) {
        setReports(data);
        setLoading(false);
      }
    };
    load();
    const timer = setInterval(load, REFRESH_MS);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return (
    <ReportsContext.Provider value={{ reports, loading }}>
      {children}
    </ReportsContext.Provider>
  );
}

export function useReports() {
  return useContext(ReportsContext);
}
