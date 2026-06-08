// Telegram alert endpoint.
//
// Supabase calls this (via a Database Webhook) every time a row is inserted into
// `reports`. For new PENDING reports we send the admin a Telegram message so
// they know something needs review. The bot token, chat id, and a shared secret
// all live in server-side env vars (never shipped to the browser).
//
//   Required env vars (set in Vercel, NOT prefixed with NEXT_PUBLIC):
//     TELEGRAM_BOT_TOKEN   - the BotFather token
//     TELEGRAM_CHAT_ID     - the admin's Telegram chat id
//     NOTIFY_WEBHOOK_SECRET- random string; must match the Supabase webhook header

const CATEGORY_LABEL: Record<string, string> = {
  jam: "🚗 Traffic jam",
  accident: "💥 Accident",
  waterlogging: "🌊 Waterlogging",
  roadblock: "🚧 Road blocked",
  protest: "📢 Protest / Procession",
  construction: "🏗️ Construction",
  other: "📍 Other",
};

const SEVERITY_LABEL: Record<string, string> = {
  low: "Light",
  medium: "Moderate",
  high: "Severe",
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jamkemon.com";

type ReportRow = {
  lat: number;
  lng: number;
  category: string;
  severity: string;
  description: string | null;
  status: string;
  observed_at: string | null;
  created_at: string;
};

function minutesAgo(observedAt: string | null, createdAt: string): number {
  if (!observedAt) return 0;
  const diff = new Date(createdAt).getTime() - new Date(observedAt).getTime();
  return Math.max(0, Math.round(diff / 60000));
}

function buildMessage(r: ReportRow): string {
  const cat = CATEGORY_LABEL[r.category] ?? r.category;
  const sev = SEVERITY_LABEL[r.severity] ?? r.severity;
  const seen = minutesAgo(r.observed_at, r.created_at);
  const lines = [
    `🆕 New report pending`,
    ``,
    `${cat} · ${sev}`,
  ];
  if (r.description) lines.push(`“${r.description}”`);
  if (seen >= 5) lines.push(`👀 Seen ~${seen} min before it was reported`);
  lines.push(`📍 https://www.openstreetmap.org/?mlat=${r.lat}&mlon=${r.lng}#map=17/${r.lat}/${r.lng}`);
  lines.push(``);
  lines.push(`Review → ${SITE_URL}/admin`);
  return lines.join("\n");
}

export async function POST(request: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const secret = process.env.NOTIFY_WEBHOOK_SECRET;

  // Reject anyone who doesn't present the shared secret (so the endpoint can't
  // be abused to spam the Telegram bot).
  if (!secret || request.headers.get("x-notify-secret") !== secret) {
    return new Response("forbidden", { status: 403 });
  }
  if (!token || !chatId) {
    return new Response("not configured", { status: 500 });
  }

  let payload: { type?: string; record?: ReportRow };
  try {
    payload = await request.json();
  } catch {
    return new Response("bad request", { status: 400 });
  }

  const record = payload.record;
  // Only ping for brand-new pending reports.
  if (payload.type !== "INSERT" || !record || record.status !== "pending") {
    return Response.json({ ok: true, skipped: true });
  }

  const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: buildMessage(record),
      disable_web_page_preview: true,
    }),
  });

  if (!tgRes.ok) {
    const detail = await tgRes.text();
    console.error("Telegram sendMessage failed:", tgRes.status, detail);
    return new Response("telegram error", { status: 502 });
  }

  return Response.json({ ok: true });
}
