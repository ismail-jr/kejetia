-- ════════════════════════════════════════════════════════════════════
-- SECURITY DEFINER role provisioning (bypasses RLS)
-- ════════════════════════════════════════════════════════════════════
-- Registration verification was failing with:
--   new row violates row-level security policy for table "provider_profiles"
-- when the auth backend inserted role-extension rows via PostgREST.
-- This RPC runs as the function owner (postgres) and is only callable
-- with the service_role key from the Express auth gateway.

create or replace function public.provision_user_role(
  p_user_id uuid,
  p_role text,
  p_email text default null,
  p_full_name text default null,
  p_student_id text default null,
  p_set_active_role boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_role not in ('student', 'provider') then
    raise exception 'Invalid role: %', p_role;
  end if;

  if p_email is not null then
    insert into public.profiles (
      user_id,
      email,
      full_name,
      student_id,
      active_role,
      updated_at
    )
    values (
      p_user_id,
      lower(p_email),
      coalesce(p_full_name, ''),
      p_student_id,
      case
        when p_set_active_role then p_role::public.user_role_enum
        else 'student'::public.user_role_enum
      end,
      now()
    )
    on conflict (user_id) do update set
      email = excluded.email,
      full_name = coalesce(nullif(excluded.full_name, ''), profiles.full_name),
      student_id = coalesce(excluded.student_id, profiles.student_id),
      active_role = case
        when p_set_active_role then excluded.active_role
        else profiles.active_role
      end,
      updated_at = now();
  elsif p_set_active_role then
    update public.profiles
      set active_role = p_role::public.user_role_enum,
          updated_at = now()
    where user_id = p_user_id;
  end if;

  if p_role = 'student' then
    insert into public.student_profiles (user_id)
    values (p_user_id)
    on conflict (user_id) do nothing;
  else
    insert into public.provider_profiles (user_id)
    values (p_user_id)
    on conflict (user_id) do nothing;
  end if;

  perform public.refresh_profile_roles(p_user_id);
end;
$$;

revoke all on function public.provision_user_role(uuid, text, text, text, text, boolean)
  from public;

grant execute on function public.provision_user_role(uuid, text, text, text, text, boolean)
  to service_role;
