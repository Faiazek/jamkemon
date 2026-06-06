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

- **Admin approval gate** (primary defense, day one).
- **Rate limiting** per `reporter_token` + IP (e.g. max N reports / 10 min).
- **Honeypot field** + minimum dwell time to block trivial bots.
- **Auto-expiry** via `expires_at`; a scheduled job hard-deletes long-expired rows
  to keep the table lean.
- **Dedupe hint**: warn the submitter if an approved report of the same category
  already exists within ~150 m in the last hour ("Someone may have reported this —
  confirm it instead?").

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

## 8. Open questions for later

- **Coverage scope:** Dhaka only at launch, or Chattogram/other cities too?
- **Admin team:** one admin, or several with shared queue? (affects roles)
- **Abuse at scale:** if it gets popular, do we need trusted-reporter auto-approval
  so the queue doesn't become a bottleneck?
- **Branding/name:** "Dhaka Traffic Alert" placeholder — final name + logo?
- **Language:** launch English-first with Bangla in Phase 6, or bilingual from day one?
