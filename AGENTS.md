# Agent Instructions — Aulga Citi

This file orients any AI coding agent (Claude, Codex, Gemini, etc.) working in this repo. It's kept in sync with `CLAUDE.md`.

## What this project is

A marketing + booking website for **Aulga Citi**, a commercial complex in Talisay City, Cebu with two bookable venues (Event Center, Sports) plus a restaurant/gym/salon/etc. strip. Design rules for the marketing pages (fidelity, workflow, defaults) live in `.claude/rules/` — read those before editing `index.html`'s visual content.

## Architecture

No build step, no package manager, no framework. Every page is a single self-contained HTML file styled with Tailwind via CDN (`<script src="https://cdn.tailwindcss.com">`). Dark theme only (slate/amber palette), icon-based (no photos — see `.claude/rules/technical-defaults.md`).

The one piece with real state is the **booking system**, which is a thin client talking directly to Supabase:

```
booking.html (visitor)  ──┐
                          ├──> Supabase (Postgres + Auth + RLS)  <── admin.html (owner, logged in)
index.html (CTAs link to)┘             │
                                        └─(best-effort)─> Google Apps Script ─> email to owner
```

- **`booking.html`** — public calendar per venue. Reads availability via the `get_availability()` Postgres RPC (exposed to `anon`, returns dates/times/status only — no names/emails/phone, so it's safe to expose publicly). Submits new requests as `status: 'pending'` rows in the `bookings` table.
- **`admin.html`** — owner-only dashboard. Requires a Supabase Auth session (email+password login) to read the full `bookings` table and approve/reject requests.
- **`supabase-schema.sql`** — run once in the Supabase SQL editor. Defines the `bookings` table, row-level security policies (anon can only insert `pending` rows; only `authenticated` can read/update), and a GiST exclusion constraint that stops two **confirmed** bookings from overlapping for the same venue/time — that's what makes "double-booking" actually impossible rather than just discouraged.
- **`js/supabase-client.js`** — shared client config (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `BOOKING_NOTIFY_URL`), included by both `booking.html` and `admin.html`. The anon key is meant to be public (Supabase's model — it's only as powerful as the RLS policies allow), but `BOOKING_NOTIFY_URL` still needs to be filled in after deploying the Apps Script (see below).
- **`google-apps-script/`** — `Code.gs` is a Google Apps Script web app (deployed under the owner's own Google account) that emails a notification whenever a booking request comes in. `SETUP.md` has the click-by-click deploy steps. This is best-effort only — if it fails, the booking still saved fine in Supabase and shows up in `admin.html`.

`index.html` still has a general-inquiry `mailto:` form for questions that aren't tied to a specific date — the copy there explicitly points people to `booking.html` for actual date/time requests instead of duplicating that flow.

## Conventions when editing

- Match the existing visual language: slate-950/900/800 backgrounds, amber-600/500/400 accent, `rounded-2xl` cards, `rounded-full` pills and buttons, Poppins for headings via `font-display`, Inter for body text.
- Every decorative `<svg>` gets `aria-hidden="true"`. Every `<label>` gets a matching `for`/`id`. Native `<select>`/`<input>` on dark backgrounds get `style="color-scheme: dark;"` so the browser renders them legibly.
- No `<img>` tags, no external photos, no build tooling (confirmed no Node/npm in this environment — don't assume it's available).
- New pages should stay single-file HTML like the rest, reusing the inline favicon data URI and the same header logo SVG for consistency.

## Working with the Supabase piece

- Don't regenerate or rotate `SUPABASE_ANON_KEY` without asking — it's tied to a real project the owner already created.
- Schema changes belong in `supabase-schema.sql` (keep it idempotent / re-runnable), not applied ad hoc through the dashboard and left undocumented.
- There's no automated test suite. Verify booking/admin changes by actually exercising the flow (submit a test request on `booking.html`, confirm it appears and can be approved/rejected in `admin.html`) rather than assuming correctness from reading the code.
- Treat `BOOKING_NOTIFY_URL` as owner-supplied config, not something to guess or fabricate a URL for.
