"use client";

// Coordinates the report flow across the app:
//   idle    → nothing happening
//   picking → user is choosing a spot on the map
//   form    → user is filling in category/severity/details
// Also holds the map instance so we can pan it to the user's GPS location.

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Map as LeafletMap } from "leaflet";

export type ReportMode = "idle" | "picking" | "form";
export type DraftLocation = { lat: number; lng: number } | null;
export type SearchPin = { lat: number; lng: number; label: string } | null;

type ReportContextValue = {
  mode: ReportMode;
  draft: DraftLocation;
  searchPin: SearchPin;
  startReport: () => void;
  placeAt: (lat: number, lng: number) => void;
  continueToForm: () => void;
  backToPicking: () => void;
  cancel: () => void;
  registerMap: (map: LeafletMap | null) => void;
  flyTo: (lat: number, lng: number) => void;
  setSearchPin: (pin: SearchPin) => void;
};

const ReportContext = createContext<ReportContextValue | null>(null);

export function ReportProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ReportMode>("idle");
  const [draft, setDraft] = useState<DraftLocation>(null);
  const [searchPin, setSearchPin] = useState<SearchPin>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  const startReport = useCallback(() => setMode("picking"), []);
  const placeAt = useCallback(
    (lat: number, lng: number) => setDraft({ lat, lng }),
    []
  );
  const continueToForm = useCallback(() => setMode("form"), []);
  const backToPicking = useCallback(() => setMode("picking"), []);
  const cancel = useCallback(() => {
    setMode("idle");
    setDraft(null);
  }, []);
  const registerMap = useCallback((map: LeafletMap | null) => {
    mapRef.current = map;
  }, []);
  const flyTo = useCallback((lat: number, lng: number) => {
    mapRef.current?.flyTo([lat, lng], 16);
  }, []);

  const value = useMemo(
    () => ({
      mode,
      draft,
      searchPin,
      startReport,
      placeAt,
      continueToForm,
      backToPicking,
      cancel,
      registerMap,
      flyTo,
      setSearchPin,
    }),
    [mode, draft, searchPin, startReport, placeAt, continueToForm, backToPicking, cancel, registerMap, flyTo]
  );

  return (
    <ReportContext.Provider value={value}>{children}</ReportContext.Provider>
  );
}

export function useReport() {
  const ctx = useContext(ReportContext);
  if (!ctx) {
    throw new Error("useReport must be used inside ReportProvider");
  }
  return ctx;
}
