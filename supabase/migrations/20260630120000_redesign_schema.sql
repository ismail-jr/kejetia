-- ════════════════════════════════════════════════════════════════════
-- Kejetia — schema redesign (table-per-role)
-- ════════════════════════════════════════════════════════════════════
--
-- Design summary
-- --------------
-- * `profiles` is the canonical identity row, 1:1 with auth.users. ALL
--   domain foreign keys point here (services.provider_id, bookings.*,
--   reviews.*, saved_services.student_id, …) so PostgREST embedded joins
--   like `services(*, profiles:provider_id(full_name))` keep resolving.
--
-- * `student_profiles` / `provider_profiles` are 1:1 extensions of
--   `profiles`. A user "has" a role iff the matching extension row
--   exists — this is the source of truth for role membership and is what
--   the registration / add-role flow creates.
--
-- * `profiles.roles[]` is a DENORMALISED projection kept in sync by
--   triggers (see 20260630120100_functions_triggers.sql). It exists only
--   for read convenience / RLS; never write it directly.
--
-- This file is written to be re-runnable on a fresh project. It drops the
-- old objects first, then recreates everything from scratch.
-- ════════════════════════════════════════════════════════════════════

-- ── Extensions ──────────────────────────────────────────────────────
create extension if not exists pgcrypto with schema extensions;

-- ── Clean slate (fresh rebuild) ─────────────────────────────────────
drop table if exists public.message_deletions cascade;
drop table if exists public.messages cascade;
drop table if exists public.conversation_participants cascade;
drop table if exists public.conversations cascade;
drop table if exists public.notifications cascade;
drop table if exists public.reports cascade;
drop table if exists public.reviews cascade;
drop table if exists public.saved_services cascade;
drop table if exists public.bookings cascade;
drop table if exists public.services cascade;
drop table if exists public.provider_profiles cascade;
drop table if exists public.student_profiles cascade;
drop table if exists public.profiles cascade;
-- legacy table from the previous role model, no longer used
drop table if exists public.user_roles cascade;

drop type if exists public.user_role_enum cascade;
drop type if exists public.booking_status_enum cascade;
drop type if exists public.report_status_enum cascade;
drop type if exists public.service_status_enum cascade;
drop type if exists public.conversation_type_enum cascade;

-- ── Enums ───────────────────────────────────────────────────────────
create type public.user_role_enum as enum ('student', 'provider', 'admin');

create type public.booking_status_enum as enum (
  'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'
);

create type public.report_status_enum as enum (
  'open', 'investigating', 'resolved', 'dismissed'
);

create type public.service_status_enum as enum (
  'pending', 'approved', 'rejected', 'archived'
);

create type public.conversation_type_enum as enum ('direct', 'booking');

-- ════════════════════════════════════════════════════════════════════
-- profiles — canonical identity (1:1 with auth.users)
-- ════════════════════════════════════════════════════════════════════
create table public.profiles (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  email       text not null unique,
  full_name   text not null default '',
  student_id  text,
  avatar_url  text,
  phone       text,
  bio         text,
  location    text,
  -- Trigger-maintained projection of role membership. Do not write directly.
  roles       text[] not null default '{}',
  active_role public.user_role_enum not null default 'student',
  is_admin    boolean not null default false,
  is_verified boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- student_id is unique when present (every UCC student has exactly one).
create unique index profiles_student_id_key
  on public.profiles (student_id)
  where student_id is not null;

create index profiles_active_role_idx on public.profiles (active_role);

-- ════════════════════════════════════════════════════════════════════
-- student_profiles — role extension (exists iff user is a student)
-- ════════════════════════════════════════════════════════════════════
create table public.student_profiles (
  user_id    uuid primary key references public.profiles (user_id) on delete cascade,
  program    text,
  level      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ════════════════════════════════════════════════════════════════════
-- provider_profiles — role extension (exists iff user is a provider)
-- Holds the provider-only commerce fields that used to live on profiles.
-- ════════════════════════════════════════════════════════════════════
create table public.provider_profiles (
  user_id        uuid primary key references public.profiles (user_id) on delete cascade,
  headline       text,
  momo_name      text,
  momo_network   text,
  momo_number    text,
  available_days text[] not null default '{}',
  available_time text,
  avg_rating     numeric not null default 0,
  total_reviews  integer not null default 0,
  total_bookings integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ════════════════════════════════════════════════════════════════════
-- services
-- ════════════════════════════════════════════════════════════════════
create table public.services (
  id               uuid primary key default gen_random_uuid(),
  provider_id      uuid not null references public.profiles (user_id) on delete cascade,
  title            text not null,
  description      text not null default '',
  category         text not null,
  price            numeric not null default 0,
  pricing_type     text default 'fixed',
  images           text[] not null default '{}',
  tags             text[] not null default '{}',
  status           public.service_status_enum not null default 'pending',
  rejection_reason text,
  avg_rating       numeric not null default 0,
  total_reviews    integer not null default 0,
  total_bookings   integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index services_provider_id_idx on public.services (provider_id);
create index services_status_idx on public.services (status);
create index services_category_idx on public.services (category);

-- ════════════════════════════════════════════════════════════════════
-- bookings
-- ════════════════════════════════════════════════════════════════════
create table public.bookings (
  id               uuid primary key default gen_random_uuid(),
  service_id       uuid not null references public.services (id) on delete cascade,
  client_id        uuid not null references public.profiles (user_id) on delete cascade,
  provider_id      uuid not null references public.profiles (user_id) on delete cascade,
  appointment_date date not null default current_date,
  appointment_time text not null default '',
  base_amount      numeric not null default 0,
  total_amount     numeric not null default 0,
  payment_status   text not null default 'unpaid',
  payment_term     text not null default 'on_completion',
  notes            text,
  status           public.booking_status_enum not null default 'pending',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index bookings_client_id_idx on public.bookings (client_id);
create index bookings_provider_id_idx on public.bookings (provider_id);
create index bookings_service_id_idx on public.bookings (service_id);

-- ════════════════════════════════════════════════════════════════════
-- reviews — one per booking
-- ════════════════════════════════════════════════════════════════════
create table public.reviews (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null unique references public.bookings (id) on delete cascade,
  service_id  uuid not null references public.services (id) on delete cascade,
  provider_id uuid not null references public.profiles (user_id) on delete cascade,
  reviewer_id uuid not null references public.profiles (user_id) on delete cascade,
  rating      integer not null check (rating between 1 and 5),
  comment     text not null default '',
  created_at  timestamptz not null default now()
);

create index reviews_provider_id_idx on public.reviews (provider_id);
create index reviews_service_id_idx on public.reviews (service_id);
create index reviews_reviewer_id_idx on public.reviews (reviewer_id);

-- ════════════════════════════════════════════════════════════════════
-- saved_services
-- ════════════════════════════════════════════════════════════════════
create table public.saved_services (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (user_id) on delete cascade,
  service_id uuid not null references public.services (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (student_id, service_id)
);

create index saved_services_student_id_idx on public.saved_services (student_id);

-- ════════════════════════════════════════════════════════════════════
-- reports
-- ════════════════════════════════════════════════════════════════════
create table public.reports (
  id               uuid primary key default gen_random_uuid(),
  reporter_id      uuid not null references public.profiles (user_id) on delete cascade,
  reported_user_id uuid references public.profiles (user_id) on delete set null,
  service_id       uuid references public.services (id) on delete set null,
  reason           text not null,
  description      text not null default '',
  status           public.report_status_enum not null default 'open',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ════════════════════════════════════════════════════════════════════
-- notifications
-- ════════════════════════════════════════════════════════════════════
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (user_id) on delete cascade,
  type       text not null,
  title      text not null,
  message    text not null,
  data       jsonb not null default '{}'::jsonb,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on public.notifications (user_id);

-- ════════════════════════════════════════════════════════════════════
-- Messaging (conversations / participants / messages / deletions)
-- ════════════════════════════════════════════════════════════════════
create table public.conversations (
  id              uuid primary key default gen_random_uuid(),
  type            public.conversation_type_enum not null default 'direct',
  booking_id      uuid unique references public.bookings (id) on delete cascade,
  last_message_at timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

create table public.conversation_participants (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id         uuid not null references public.profiles (user_id) on delete cascade,
  last_read_at    timestamptz,
  primary key (conversation_id, user_id)
);

create index conversation_participants_user_id_idx
  on public.conversation_participants (user_id);

create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id       uuid not null references public.profiles (user_id) on delete cascade,
  content         text,
  attachments     text[] not null default '{}',
  created_at      timestamptz not null default now()
);

create index messages_conversation_id_idx on public.messages (conversation_id);

create table public.message_deletions (
  message_id uuid not null references public.messages (id) on delete cascade,
  user_id    uuid not null references public.profiles (user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id)
);
