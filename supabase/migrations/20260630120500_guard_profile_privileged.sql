-- ════════════════════════════════════════════════════════════════════
-- Block self-elevation on profiles
-- ════════════════════════════════════════════════════════════════════
-- Authenticated users must not be able to set is_admin or rewrite roles[]
-- from the browser client. Only the service_role backend / SQL console may
-- promote admins. roles[] remains trigger-maintained for everyone else.

create or replace function public.guard_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Backend auth gateway and dashboard SQL run as service_role.
  if coalesce(auth.role(), '') = 'service_role' then
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

drop trigger if exists profiles_guard_privileged_columns on public.profiles;

create trigger profiles_guard_privileged_columns
  before insert or update on public.profiles
  for each row execute function public.guard_profile_privileged_columns();
