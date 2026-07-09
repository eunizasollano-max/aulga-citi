-- Aulga Citi booking system schema
-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query)

create extension if not exists btree_gist;

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  venue text not null check (venue in ('event_center', 'sports')),
  court_type text check (court_type in ('full', 'half', 'event')),
  sport_type text check (sport_type in ('pickleball', 'badminton', 'other')),
  booking_date date not null check (booking_date >= current_date),
  start_time time not null,
  duration_hours numeric not null check (duration_hours > 0 and duration_hours <= 12),
  name text not null,
  email text not null,
  phone text,
  guest_count int,
  message text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  created_at timestamptz not null default now(),
  time_range tsrange generated always as (
    tsrange(
      (booking_date + start_time)::timestamp,
      (booking_date + start_time)::timestamp + (duration_hours * interval '1 hour')
    )
  ) stored,
  -- Only CONFIRMED bookings can't overlap each other for the same venue.
  -- Simplification: a sports booking (full or half court) blocks the whole
  -- court for that time slot, so two "half court" bookings can't double up.
  exclude using gist (
    venue with =,
    time_range with &&
  ) where (status = 'confirmed')
);

create index if not exists bookings_venue_date_idx on bookings (venue, booking_date);

-- Migration for databases created before the 'event' court type and the
-- 'pickleball' / 'badminton' / 'other' sport_type existed. Safe to re-run.
alter table bookings add column if not exists sport_type text;
alter table bookings drop constraint if exists bookings_court_type_check;
alter table bookings add constraint bookings_court_type_check
  check (court_type in ('full', 'half', 'event'));
alter table bookings drop constraint if exists bookings_sport_type_check;
alter table bookings add constraint bookings_sport_type_check
  check (sport_type in ('pickleball', 'badminton', 'other'));

alter table bookings enable row level security;

-- Public visitors may only ever create a new pending request.
drop policy if exists "anon can request a booking" on bookings;
create policy "anon can request a booking"
  on bookings for insert
  to anon
  with check (status = 'pending');

-- Only the logged-in admin can read the full table (names, emails, etc).
drop policy if exists "admin can read all bookings" on bookings;
create policy "admin can read all bookings"
  on bookings for select
  to authenticated
  using (true);

-- Only the logged-in admin can approve/reject.
drop policy if exists "admin can update bookings" on bookings;
create policy "admin can update bookings"
  on bookings for update
  to authenticated
  using (true)
  with check (true);

-- Lets the admin manually add a booking (phone/walk-in requests) from admin.html.
drop policy if exists "admin can insert bookings" on bookings;
create policy "admin can insert bookings"
  on bookings for insert
  to authenticated
  with check (true);

-- Public availability check, exposed without leaking guest names/emails/phone numbers.
-- Dropped first because changing the OUT columns (adding sport_type) isn't
-- allowed via CREATE OR REPLACE — Postgres requires a fresh DROP.
drop function if exists get_availability(text);
create or replace function get_availability(p_venue text)
returns table (
  booking_date date,
  start_time time,
  duration_hours numeric,
  court_type text,
  sport_type text,
  status text
)
language sql
security definer
set search_path = public
as $$
  select booking_date, start_time, duration_hours, court_type, sport_type, status
  from bookings
  where venue = p_venue
    and status in ('pending', 'confirmed')
    and booking_date >= current_date
  order by booking_date, start_time;
$$;

grant execute on function get_availability(text) to anon;

-- Signed liability waivers, linked to the booking they belong to.
create table if not exists waivers (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete set null,
  lead_name text not null,
  lead_email text,
  member_names text[] not null,
  signature text not null,
  created_at timestamptz not null default now()
);

alter table waivers enable row level security;

-- Anyone with the waiver link (sent only in the confirmation email) can submit one.
drop policy if exists "anon can submit waiver" on waivers;
create policy "anon can submit waiver"
  on waivers for insert
  to anon
  with check (true);

-- Only the logged-in admin can view submitted waivers.
drop policy if exists "admin can read waivers" on waivers;
create policy "admin can read waivers"
  on waivers for select
  to authenticated
  using (true);

-- After running this file:
-- 1. Go to Authentication -> Users in the Supabase dashboard and add one
--    user (your admin email + a password) to log into admin.html.
-- 2. Go to Project Settings -> API and copy the "Project URL" and
--    "anon public" key into js/supabase-client.js.
