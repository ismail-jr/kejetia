-- ════════════════════════════════════════════════════════════════════
-- Allow Supabase SQL Editor (postgres) to bootstrap admins
-- ════════════════════════════════════════════════════════════════════
-- The original guard only bypassed service_role. Dashboard SQL Editor
-- runs as postgres, so bootstrap-admin.sql failed with:
--   Cannot set is_admin without service role

create or replace function public.guard_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Trusted roles: Express backend (service_role) and SQL Editor (postgres).
  if coalesce(auth.role(), '') = 'service_role'
     or current_user in ('postgres', 'supabase_admin') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.is_admin is true then
      raise exception 'Cannot set is_admin without service role';
    end if;

    if new.roles is not null and new.roles <> '{}'::text[] then
      raise exception 'Cannot set roles directly; role membership is provisioned by the backend';
    end if;
  end if;

  if tg_op = 'UPDATE' then
    if new.is_admin is distinct from old.is_admin then
      raise exception 'Cannot modify is_admin';
    end if;

    if new.roles is distinct from old.roles then
      raise exception 'Cannot modify roles directly';
    end if;
  end if;

  return new;
end;
$$;
