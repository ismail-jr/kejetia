-- ════════════════════════════════════════════════════════════════════
-- Public platform stats — safe aggregate for the landing page
-- ════════════════════════════════════════════════════════════════════
-- The landing page's FeaturesSection queried profiles/services/reviews/
-- bookings directly as the anon role. Two problems:
--   1. profiles now only grants anon a subset of columns (see the
--      security hardening migration), so `select("*", { head: true })`
--      throws a permission-denied error instead of a count.
--   2. bookings rows are only visible to their client/provider under
--      RLS, so an anon visitor always saw an empty set and "successRate"
--      silently rendered as 0%, no matter the real numbers.
-- A single SECURITY DEFINER RPC returns just the four aggregate numbers
-- the landing page needs, without exposing any row-level data.
create or replace function public.get_platform_stats()
returns table (
  active_users     integer,
  services_listed  integer,
  average_rating   numeric,
  success_rate     integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*) from public.profiles)::int,
    (select count(*) from public.services where status = 'approved')::int,
    coalesce((select round(avg(rating), 1) from public.reviews), 0),
    (
      select case
        when count(*) = 0 then 0
        else round(100.0 * count(*) filter (where status = 'completed') / count(*))
      end
      from public.bookings
    )::int;
$$;

grant execute on function public.get_platform_stats()
  to anon, authenticated, service_role;
