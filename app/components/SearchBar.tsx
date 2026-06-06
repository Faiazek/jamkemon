"use client";

// Top-bar area search: type a place, pick a suggestion, the map flies there and
// drops a pin at the spot.

import { useState } from "react";
import { useLanguage } from "../i18n/LanguageProvider";
import { useReport } from "../report/ReportContext";
import PlaceInput from "./PlaceInput";

export default function SearchBar() {
  const { t } = useLanguage();
  const { flyTo, setSearchPin } = useReport();
  const [query, setQuery] = useState("");

  return (
    <PlaceInput
      value={query}
      onChange={setQuery}
      onSelect={(p) => {
        setSearchPin({ lat: p.lat, lng: p.lon, label: p.label });
        flyTo(p.lat, p.lon);
      }}
      placeholder={t("searchPlaceholder")}
    />
  );
}
