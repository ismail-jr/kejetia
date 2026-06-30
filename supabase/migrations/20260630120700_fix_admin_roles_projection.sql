-- ════════════════════════════════════════════════════════════════════
-- Fix roles[] projection for admins + allow trigger to write roles
-- ════════════════════════════════════════════════════════════════════
-- Symptom: is_admin = true but roles = '{}' because refresh_profile_roles()
-- UPDATE was blocked by guard_profile_privileged_columns().

create or replace function public.guard_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Trigger-maintained projection (refresh_profile_roles).
  if coalesce(current_setting('app.refreshing_roles', true), '') = 'true' then
    return new;
  end if;

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

create or replace function public.refresh_profile_roles(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  computed text[] := '{}';
begin
  if exists (select 1 from public.student_profiles s where s.user_id = p_user_id) then
    computed := array_append(computed, 'student');
  end if;

  if exists (select 1 from public.provider_profiles pr where pr.user_id = p_user_id) then
    computed := array_append(computed, 'provider');
  end if;

  if exists (select 1 from public.profiles p where p.user_id = p_user_id and p.is_admin) then
    computed := array_append(computed, 'admin');
  end if;

  perform set_config('app.refreshing_roles', 'true', true);

  update public.profiles
    set roles = computed
  where user_id = p_user_id
    and roles is distinct from computed;
end;
$$;

-- Recompute roles when a profile row is first inserted (e.g. admin bootstrap).
create or replace function public.tg_refresh_roles_on_profile_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_profile_roles(new.user_id);
  return new;
end;
$$;

drop trigger if exists profiles_refresh_roles_on_insert on public.profiles;

create trigger profiles_refresh_roles_on_insert
  after insert on public.profiles
  for each row execute function public.tg_refresh_roles_on_profile_insert();

-- Backfill existing admins stuck with roles = '{}'.
do $$
declare
  r record;
begin
  for r in select user_id from public.profiles where is_admin = true loop
    perform public.refresh_profile_roles(r.user_id);
  end loop;
end;
$$;
