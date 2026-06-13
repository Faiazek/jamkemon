# JamKemon (জ্যাম কেমন?) — Technical Plan

A community-driven, moderated map for real-time road conditions in Dhaka. People
post what's actually happening on the ground (jams, accidents, waterlogging,
roadblocks, processions); an admin approves posts; everyone sees the live map —
no Facebook account required.

**Name:** JamKemon — "জ্যাম কেমন?" / "How's the jam?". *Jam* works in both
Bangla and English; the name is bilingual by design, like the app.

---

## 1. Why this exists

- The real-time road intelligence in Dhaka lives in Facebook "Traffic Alert"
  groups: walled off, unsearchable, noisy, and useless if you don't use Facebook.
- Google Maps shows *model-predicted* colors that lag reality and never explain
  *why* a road is red.
- This platform turns scattered human reports into a glanceable, filterable,
  self-expiring map that anyone can open in a browser.

The two hard problems are **trust** (stop fake/spam/stale reports) and
**freshness** (a jam from 3 hours ago must disappear on its own). The architecture
below is designed around those two, not just around "put pins on a map."

---

## 2. Decisions locked

| Decision | Choice | Reason |
|---|---|---|
| Map | **Leaflet + OpenStreetMap** | Free, no API key, no billing account, good Dhaka OSM coverage |
| Submissions | **Anonymous now, accounts later** | Lowest friction = most reports; admin approval is the gate |
| Moderation | **Admin approval required** before a report hits the public map | Spam/abuse control from day one |
| Freshness | **Per-category auto-expiry (TTL)** | Map always reflects *now* |
| Coverage | **Dhaka only at launch** | Focus; other cities are a later expansion |
| Admin | **Single admin (you)** | Simple auth, no role system needed yet |
| Language | **Bilingual (বাংলা + English) from day one** | Foundational i18n, not a later add-on |

---

## 3. Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | **Next.js (App Router) + TypeScript + Tailwind** | One framework for public site + admin |
| Map | **Leaflet** via `react-leaflet`, OSM tiles | Marker clustering for dense areas |
| Database | **Supabase Postgres + PostGIS** | Geo queries ("reports near me"), row-level security |
| Auth | **Supabase Auth** | Admin login now; user accounts in Phase 5 |
| Storage | **Supabase Storage** | Optional report photos |
| Realtime | **Supabase Realtime** | New approvals appear without refresh (Phase 4) |
| i18n | **`next-intl`** + Noto Sans Bengali | বাংলা + English from day one, language toggle |
| Hosting | **Vercel** (frontend) + **Supabase** (managed backend) | Both have free tiers; cheap to launch |

> Everything here has a generous free tier — important for a community project
> with no revenue at launch.

---

## 4. Data model

### `reports`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid (pk) | |
| `created_at` | timestamptz | default now() |
| `expires_at` | timestamptz | created_at + category TTL; map hides expired |
| `lat`, `lng` | double precision | raw coords |
| `geog` | geography(Point) | PostGIS, for radius/near queries |
| `category` | enum | jam, accident, waterlogging, roadblock, protest, construction, other |
| `severity` | enum | low, medium, high |
| `description` | text | short, max ~280 chars |
| `photo_url` | text? | optional |
| `area` | text? | reverse-geocoded label (e.g. "Mohakhali") for search |
| `status` | enum | pending, approved, rejected |
| `reporter_token` | text | anonymous device/session id for rate-limiting + dedupe |
| `confirm_count` | int | "still happening" votes (Phase 5) |
| `admin_notes` | text? | internal |

### TTL defaults (tunable)
| Category | TTL |
|---|---|
| Jam | 1.5 h |
| Waterlogging | 4 h |
| Accident | 2 h |
| Roadblock / Protest | 3 h |
| Construction | 24 h |

### Row-Level Security (the trust backbone)
- **Public (anon):** may `INSERT` only with `status = 'pending'`; may `SELECT`
  only rows where `status = 'approved' AND expires_at > now()`.
- **Admin:** may `SELECT` everything and `UPDATE` status / notes.

This means the database itself enforces moderation — a hacked frontend still
can't push a report straight onto the public map.

---

## 5. Screens

1. **Map (home)** — clustered pins of live approved reports, color-coded by
   category. Filter chips (category, "last hour / 3h / today"). Tap a pin → detail
   popup (category, description, photo, "reported 12 min ago"). Floating **"Report"** button.
2. **Submit flow** — drop a pin or "use my location" → pick category + severity →
   short text → optional photo → submit. Confirmation: "Thanks — your report is
   pending review and will appear shortly."
3. **Admin login** — Supabase email/password.
4. **Admin moderation queue** — pending reports as cards (map preview + details);
   Approve / Reject / Edit-category buttons; keyboard-fast. Live counter of backlog.
5. **(Later) Account screens** — sign up, my reports, reputation.

---

## 6. Anti-abuse & freshness mechanics

**Implemented:**
- **Admin approval gate** (primary defense — nothing reaches the public map unapproved).
- **Auto-expiry** via `expires_at` (per-category TTL, measured from `observed_at`).
- **Dedupe / reconciliation**: near-duplicate same-category reports within ~150 m
  collapse to the freshest sighting (`reconcile()` in `lib/reports.ts`).

**Known risks — documented, deliberately deferred (see QA, 2026-06-13):**
- **No rate limiting.** Anyone can submit reports or cast votes as fast as a script
  allows. Abuse vectors: flooding the moderation queue + Telegram alerts with junk
  reports; manipulating votes (3 "cleared" votes from fresh tokens knock any live
  report off the map; "still" spam keeps stale ones alive). Acceptable at current
  (low) scale. When it bites, the fix is a **server-side submit gateway enforcing a
  per-IP limit** (a cheap per-`reporter_token` DB limit only stops casual abuse, since
  a token is just a localStorage value an attacker can rotate). Not yet built.
- **Honeypot field + minimum dwell time** to block trivial bots — planned, not built.
- **Leaked-password protection** for admin auth is off (enable in Supabase dashboard →
  Auth; can't be toggled via API).

---

## 7. Build phases

- **Phase 0 — Scaffold.** Next.js + Tailwind + Supabase project, env wiring, **bilingual setup (next-intl, bn/en message files, language toggle, Bangla font)**, empty map renders centered on Dhaka.
- **Phase 1 — Submit + store.** Submission flow writes `pending` reports to DB. Nothing public yet.
- **Phase 2 — Admin moderation.** Admin login + queue; approve/reject flips `status`.
- **Phase 3 — Public map + decay + filters.** Approved, non-expired reports render with category colors, clustering, and filter chips.
- **Phase 4 — Realtime.** New approvals appear on open maps without refresh.
- **Phase 5 — Accounts + confirmations.** Optional sign-up, "still happening" votes, basic reporter reputation.
- **Phase 6 — Polish.** PWA/installable, optional push for a watched area, shareable report links. (Bilingual is already done in Phase 0.)

MVP = Phases 0–3 (a real, usable, moderated live map). Everything after is growth.

---

## 7b. Growth push (post-launch)

The app launched with Phases 0–5 effectively shipped (moderation, confirmations,
directions, search, photos, PWA manifest, Telegram alerts to admin, in-app
feedback + admin feedback tab). The next work is **growth and retention**, not
finishing the MVP. Two milestones, built in order.

### Milestone 1 — Shareable report links *(acquisition)*

Every jam shared to WhatsApp/Facebook should become a rich link preview that
pulls people back to the site (today people screenshot the FB group instead).

- **New route `/r/[id]`** — the app's first SSR page. `generateMetadata()` emits
  Open Graph + Twitter tags; the page shows a mini map, category/severity badge,
  time, photo, and CTAs ("See the live map" / "Report something"). Bilingual.
- **Dynamic OG image** `app/r/[id]/opengraph-image.tsx` via `ImageResponse` —
  branded 1200×630 card (wordmark, category emoji, severity, area, "Reported X
  ago"). v2: composite a real OSM static-tile thumbnail. *(Confirm `ImageResponse`
  exists in this Next build first — read `node_modules/next/dist/docs/`.)*
- **Data access:** anon RLS only exposes approved + non-expired rows, but a link
  shared an hour ago must still render. Add a `get_shared_report(id)` RPC
  (`SECURITY DEFINER`) returning a safe public subset for **approved** reports
  regardless of expiry, nothing for pending/rejected. Expired → "since cleared"
  state, not a 404.
- **Share button** on the map report popup: `navigator.share()` on mobile, copy
  link fallback on desktop.
- **DB:** one migration (the RPC). No schema change.

### Milestone 2 — Watch a route/area + push *(retention)*

Turn one-time visitors into daily users: "tell me when something's reported on
my commute."

- **Service worker** (`public/sw.js`, `push` + `notificationclick`) — doesn't
  exist yet; add + register. **VAPID keys** in env. **`subscriptions` table**:
  `reporter_token`, watched area (center + radius) or route (polyline + buffer),
  Web Push endpoint/keys, label, `active`.
- **Entry points:** "Watch this area" from the map; "Watch this route" from the
  directions panel; a "My alerts" panel to manage/mute.
- **Fan-out:** on report → **approved**, match subscriptions and send Web Push.
  No PostGIS today, so add a haversine SQL helper (or PostGIS); trigger via a new
  webhook on `reports` UPDATE → `/api/notify-subscribers` (mirrors the existing
  `report-created` insert webhook).
- **⚠️ Reach caveat:** iOS Web Push only works for **installed PWAs** (iOS 16.4+);
  Android Chrome works in-browser. Add an "Add to Home Screen" nudge so iOS users
  can actually receive alerts.

Order: ship M1 first (growth now), then M2 (the retention loop).

---

## 7c. Data products (future phase — gated on report volume)

Two compounding features that turn accumulated reports into value *even when the
live map is quiet*. **Not buildable yet:** as of 2026-06-13 there are only ~26
reports total (~8 approved). These need real volume (rough gate: ~500+ historical
reports) or they show noise dressed up as insight. Architecture is simple; the
blocker is data, so the plan is "lay the pipe now, build the dashboards later."

**Data status (verified 2026-06-13):**
- ✅ History accumulates — expired rows are retained (no cleanup/delete job). If a
  cleanup job is ever added, it must **archive, not delete**.
- ❌ `area` column is empty on every row (schema has it; the client never sets it).
- ❌ No PostGIS — use grid-snap / geohash for spatial bucketing instead.

**Prerequisite (cheap, independently useful, do first when revisiting):**
- **Reverse-geocode on admin approval** → populate `reports.area`. Reuse the
  Barikoi/Photon clients in `lib/geocode.ts` (reverse endpoints). Makes "by area"
  grouping trivial and lets Telegram alerts / share pages show "Mohakhali" instead
  of raw coords.

**A. Typical-traffic heatmap.**
- Aggregate approved reports into spatial cells (round lat/lng to ~3 dp ≈ 110 m, or
  geohash), weighted by severity, bucketed by hour-of-day / weekday.
- Serve via `get_hotspots(hour?, weekday?)` RPC (`SECURITY DEFINER`, returns only
  aggregated `{lat,lng,weight}` — no raw rows). At scale: nightly materialized view + `pg_cron`.
- Render a `leaflet.heat` layer behind a "Live / Typical" toggle + hour slider.
- **Credibility gate:** only show cells with ≥~5 reports; caption "based on X reports
  over Y weeks"; hide the feature below the volume gate. Frame honestly as "where
  people *report* problems," not sensor-grade speed data.

**B. Weekly trends page (`/trends`).**
- SSR page (revalidate hourly), reusing the admin `StatsView` styling; bilingual.
- `get_weekly_trends()` RPC: worst areas, category split, busiest hours, total +
  week-over-week delta.
- Generate an OG image (reuse the `/r/[id]` Satori infra) → doubles as the
  auto-postable "JamKemon weekly" card for Telegram/Facebook (same build as the
  content-engine idea).

---

## 8. Open questions for later

- **Coverage scope:** Dhaka only at launch, or Chattogram/other cities too?
- **Admin team:** one admin, or several with shared queue? (affects roles)
- **Abuse at scale:** if it gets popular, do we need trusted-reporter auto-approval
  so the queue doesn't become a bottleneck?
- **Branding/name:** "Dhaka Traffic Alert" placeholder — final name + logo?
- **Language:** launch English-first with Bangla in Phase 6, or bilingual from day one?
