-- ════════════════════════════════════════════════════════════════════
-- Table & function GRANTs for Supabase API roles
-- ════════════════════════════════════════════════════════════════════
--
-- RLS policies alone are not enough: PostgREST connects as `anon` or
-- `authenticated`, and those roles still need base table privileges.
-- Without GRANTs you get:
--   permission denied for table services (SQLSTATE 42501)
-- even when a matching RLS policy exists.
--
-- Safe to re-run — GRANT is idempotent.

-- ── Schema usage ────────────────────────────────────────────────────
grant usage on schema public to postgres, anon, authenticated, service_role;

-- ── Tables ──────────────────────────────────────────────────────────
-- service_role / postgres: full access (backend auth gateway, admin jobs)
grant all on all tables in schema public to postgres, service_role;

-- authenticated: CRUD where RLS policies allow
grant select, insert, update, delete on all tables in schema public
  to authenticated;

-- anon: read-only for public marketplace / provider preview pages
grant select on all tables in schema public to anon;

-- ── Enum types (required for INSERT/UPDATE on enum columns) ─────────
grant usage on type public.user_role_enum to anon, authenticated, service_role;
grant usage on type public.booking_status_enum to anon, authenticated, service_role;
grant usage on type public.report_status_enum to anon, authenticated, service_role;
grant usage on type public.service_status_enum to anon, authenticated, service_role;
grant usage on type public.conversation_type_enum to anon, authenticated, service_role;

-- Tables covered by the grants above:
--   profiles, student_profiles, provider_profiles,
--   services, bookings, reviews, saved_services, reports, notifications,
--   conversations, conversation_participants, messages, message_deletions

-- ── Sequences (if any are added later) ──────────────────────────────
grant usage, select on all sequences in schema public
  to postgres, anon, authenticated, service_role;

-- ── RPC functions the browser may call ──────────────────────────────
grant execute on function public.is_admin() to anon, authenticated, service_role;

grant execute on function public.is_conversation_participant(uuid)
  to anon, authenticated, service_role;

grant execute on function public.get_or_create_direct_conversation(uuid)
  to authenticated, service_role;

-- refresh_profile_roles is trigger/backend only — not exposed to clients
grant execute on function public.refresh_profile_roles(uuid)
  to postgres, service_role;

-- ── Default privileges for tables created after this migration ────────
alter default privileges in schema public
  grant all on tables to postgres, service_role;

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;

alter default privileges in schema public
  grant select on tables to anon;

alter default privileges in schema public
  grant usage, select on sequences to postgres, anon, authenticated, service_role;
