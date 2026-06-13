// Dynamic Open Graph image for shared report links (/r/<id>).
//
// Rendered by Satori (next/og). Kept to English + a colored category chip — no
// emoji or Bengali — so it renders reliably with the bundled default font and
// looks right in every link unfurl. (v2 idea: composite a real map thumbnail.)

import { ImageResponse } from "next/og";
import { CATEGORIES, SEVERITIES, fetchSharedReport } from "../../../lib/reports";
import { messages } from "../../i18n/messages";
import { timeAgo } from "../../../lib/time";

export const alt = "JamKemon report";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = { params: Promise<{ id: string }> };

export default async function Image({ params }: Props) {
  const { id } = await params;
  const report = await fetchSharedReport(id);

  const cat = report && CATEGORIES.find((c) => c.key === report.category);
  const sev = report && SEVERITIES.find((s) => s.key === report.severity);
  const label = report
    ? cat
      ? messages.en[cat.labelKey]
      : report.category
    : "Live road conditions for Dhaka";
  const color = cat?.color ?? "#e11d48";
  const severityLabel = sev ? messages.en[sev.labelKey] : "";
  const when = report ? timeAgo(report.created_at, "en") : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b2e 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Brand row */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ fontSize: 44, fontWeight: 800, color: "#fb7185" }}>
            JamKemon
          </div>
          <div style={{ fontSize: 28, fontWeight: 600, color: "#94a3b8", marginLeft: 20 }}>
            How's the traffic?
          </div>
        </div>

        {/* Category */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 999,
                background: color,
                marginRight: 24,
              }}
            />
            {severityLabel ? (
              <div
                style={{
                  display: "flex",
                  fontSize: 26,
                  fontWeight: 600,
                  color: "#0f172a",
                  background: "#e2e8f0",
                  padding: "6px 20px",
                  borderRadius: 999,
                }}
              >
                {severityLabel}
              </div>
            ) : (
              <div style={{ display: "flex" }} />
            )}
          </div>
          <div style={{ fontSize: 84, fontWeight: 800, color: "#f8fafc", marginTop: 24 }}>
            {label}
          </div>
          {report?.description ? (
            <div style={{ fontSize: 34, color: "#cbd5e1", marginTop: 16 }}>
              {report.description.slice(0, 90)}
            </div>
          ) : (
            <div style={{ display: "flex" }} />
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 28, color: "#94a3b8" }}>
            {when ? `Reported ${when}` : "Community-driven traffic map · Dhaka"}
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#fb7185" }}>
            jamkemon.com
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
