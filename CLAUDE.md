# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

The **Aulga Citi** website: a marketing site for a commercial complex in Talisay City, Cebu (restaurants, a bar, gym, salon, daycare, etc.) built around two bookable venues — Aulga Citi Event Center and Aulga Citi Sports — plus a live booking system backed by Supabase.

## Commands

There is no build step, no package manager, and no test suite — every page is a self-contained HTML file with Tailwind loaded via CDN. Node/npm/npx are **not installed** in this environment, so treat any Node-based tooling (including the Puppeteer screenshot step mentioned below) as unavailable unless verified otherwise.

- **Preview a page**: open it directly in a browser, e.g. `open index.html` (macOS). No dev server needed.
- **No lint/build/test commands exist.** Verify changes by opening the file and exercising the UI manually — for the booking flow specifically, submit a real test request on `booking.html` and confirm it shows up correctly in `admin.html`.

## Design-recreation workflow (marketing content)

For the marketing pages (`index.html`), this project follows a screenshot-driven recreation workflow defined in `.claude/rules/`:

- `workflow.md` — generate → screenshot → compare → fix loop when given a reference image (at least 2 comparison rounds; Puppeteer-based, may not be runnable in this environment — fall back to careful manual/visual review)
- `technical-defaults.md` — Tailwind via CDN, `placehold.co` placeholders, mobile-first, single-file by default
- `fidelity-rules.md` — match references exactly, don't embellish or add unrequested content

These rules govern content/layout changes to `index.html`; they don't apply to the booking system's functional code below.

## Architecture

No framework, no bundler. Three independent HTML pages share a visual language (dark slate/amber Tailwind theme, inline SVG icons, no photos) but only the booking pages have real backend state:

```
booking.html (public)  ──┐
                         ├──> Supabase (Postgres + Auth + RLS)  <── admin.html (owner login)
index.html (CTAs link)──┘             │
                                       └─(best-effort)─> Google Apps Script ─> email notification
```

- **`index.html`** — the marketing site (hero, venues, pricing, testimonials, location, general-inquiry `mailto:` form). Its "Book Now" / "Book the Event Center" / "Book the Sports Center" CTAs deep-link to `booking.html`, `booking.html?venue=event_center`, `booking.html?venue=sports`.
- **`booking.html`** — public per-venue calendar. Loads availability via the `get_availability(p_venue)` Postgres RPC (safe to expose to `anon` — it returns only dates/times/status, not guest PII) and inserts new requests into `bookings` as `status: 'pending'`.
- **`admin.html`** — owner-only dashboard, gated behind Supabase Auth (email+password). Lists all bookings, lets the owner approve (`confirmed`) or reject (`rejected`) a pending request.
- **`supabase-schema.sql`** — the `bookings` table, RLS policies (anon can only insert `pending` rows; only `authenticated` can read/update), and a GiST exclusion constraint that makes two **confirmed** bookings overlapping for the same venue impossible at the database level, not just discouraged in the UI. Run this once in the Supabase SQL editor; keep it idempotent if it changes.
- **`js/supabase-client.js`** — shared config (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `BOOKING_NOTIFY_URL`) included by both `booking.html` and `admin.html`. The anon key is meant to be public by Supabase's design (RLS is what actually restricts access); `BOOKING_NOTIFY_URL` is owner-supplied after deploying the Apps Script — don't fabricate a value for it.
- **`google-apps-script/Code.gs`** (+ `SETUP.md`) — a Google Apps Script web app, deployed under the owner's own Google account, that emails a booking notification on each new request. Best-effort/fire-and-forget from `booking.html` — if it fails, the booking is still safely in Supabase and visible in `admin.html`.

## Conventions

- Visual language: `slate-950`/`900`/`800` backgrounds, `amber-600`/`500`/`400` accent, `rounded-2xl` cards, `rounded-full` buttons/pills, `font-display` (Poppins) for headings, Inter for body — dark theme only, no light-mode variant.
- No `<img>` tags — icon/illustration based by design, not a placeholder gap.
- Every decorative `<svg>` carries `aria-hidden="true"`; every `<label>` has a matching `for`/`id`; native `<select>`/`<input>` elements on dark backgrounds get `style="color-scheme: dark;"` so browsers render them legibly.
- New pages should stay single-file HTML like the rest, reusing the existing inline-SVG favicon/header-logo markup for consistency.

## Related docs

`AGENTS.md` mirrors this file for non-Claude agents and goes slightly deeper on the Supabase/Apps Script setup steps — keep both in sync when the architecture changes.
