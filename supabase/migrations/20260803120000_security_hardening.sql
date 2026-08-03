-- ════════════════════════════════════════════════════════════════════
-- Security hardening pass
-- ════════════════════════════════════════════════════════════════════
-- Closes several gaps found during a full-app audit:
--   1. Messaging: attachment UPDATE was silently blocked by RLS; the
--      conversation_participants insert policy let any authenticated
--      user add themselves to (or invite others into) ANY conversation.
--   2. Bookings: either party could set status/payment_status/amount
--      freely, letting a client fabricate a "completed + paid" booking
--      to unlock a review, or a client edit the price after the fact.
--   3. Profiles: is_admin/roles[] were already guarded, but is_verified
--      was not — any user could self-verify.
--   4. Services: insert policy only checked provider_id, so a client
--      could insert a listing with status='approved', skipping
--      moderation entirely.
--   5. Storage: avatar writes were not scoped to the uploader, so any
--      authenticated user could overwrite/delete any other user's
--      avatar file.
--   6. PII: profiles/provider_profiles were fully columns-readable by
--      the `anon` role (unauthenticated marketplace visitors), exposing
--      email, student_id, and full momo payment numbers.
-- ════════════════════════════════════════════════════════════════════

-- ── 1a. messages — allow the sender to complete their own attachment
--        upload (INSERT already restricts sender_id = auth.uid(); this
--        UPDATE policy only ever lets them attach files to a message
--        they just created, never touch someone else's row or its text).
drop policy if exists messages_update_own_attachments on public.messages;

create policy messages_update_own_attachments on public.messages
  for update using (
    sender_id = auth.uid()
    and public.is_conversation_participant(conversation_id)
  )
  with check (
    sender_id = auth.uid()
    and public.is_conversation_participant(conversation_id)
  );

-- ── 1b. conversation_participants — a user may only ever insert
--        THEMSELVES as a participant. Conversation-creation flows that
--        need to seed the other side (direct chat, booking chat) do so
--        through SECURITY DEFINER RPCs below, which run as the function
--        owner and are unaffected by this restriction.
drop policy if exists conversation_participants_insert on public.conversation_participants;

create policy conversation_participants_insert on public.conversation_participants
  for insert with check (user_id = auth.uid());

-- Booking-scoped conversation, mirroring get_or_create_direct_conversation:
-- only a party to the booking may create/fetch its thread, and both
-- participants are seeded atomically as the function owner (bypassing the
-- self-only insert policy above by design).
create or replace function public.get_or_create_booking_conversation(p_booking_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me          uuid := auth.uid();
  v_client    uuid;
  v_provider  uuid;
  existing_id uuid;
  new_id      uuid;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  select b.client_id, b.provider_id into v_client, v_provider
  from public.bookings b
  where b.id = p_booking_id;

  if v_client is null then
    raise exception 'Booking not found';
  end if;

  if me not in (v_client, v_provider) then
    raise exception 'Not a party to this booking';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_booking_id::text, 1));

  select c.id into existing_id
  from public.conversations c
  where c.booking_id = p_booking_id
  limit 1;

  if existing_id is not null then
    return existing_id;
  end if;

  insert into public.conversations (type, booking_id) values ('booking', p_booking_id)
  returning id into new_id;

  insert into public.conversation_participants (conversation_id, user_id)
  values (new_id, v_client), (new_id, v_provider)
  on conflict do nothing;

  return new_id;
end;
$$;

grant execute on function public.get_or_create_booking_conversation(uuid)
  to authenticated, service_role;

-- ── 2. bookings — lock down who can move status/payment/amount fields.
create or replace function public.guard_booking_transitions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_client boolean := auth.uid() = old.client_id;
  is_provider boolean := auth.uid() = old.provider_id;
begin
  if coalesce(auth.role(), '') = 'service_role'
     or current_user in ('postgres', 'supabase_admin')
     or public.is_admin() then
    return new;
  end if;

  -- Identity and money fields are fixed at creation time; never editable
  -- by either party via the browser client afterward.
  if new.base_amount is distinct from old.base_amount
     or new.total_amount is distinct from old.total_amount
     or new.service_id is distinct from old.service_id
     or new.client_id is distinct from old.client_id
     or new.provider_id is distinct from old.provider_id then
    raise exception 'Cannot modify booking identity or amount fields';
  end if;

  if is_client and not is_provider then
    if new.payment_status is distinct from old.payment_status then
      raise exception 'Only the provider can update payment status';
    end if;

    if new.status is distinct from old.status
       and not (new.status = 'cancelled' and old.status in ('pending', 'confirmed')) then
      raise exception 'Clients may only cancel a pending or confirmed booking';
    end if;
  elsif is_provider then
    if new.status is distinct from old.status
       and not (
         (old.status = 'pending' and new.status in ('confirmed', 'cancelled'))
         or (old.status = 'confirmed' and new.status in ('in_progress', 'cancelled'))
         or (old.status = 'in_progress' and new.status = 'completed')
       ) then
      raise exception 'Invalid booking status transition';
    end if;
  else
    raise exception 'Not a party to this booking';
  end if;

  return new;
end;
$$;

drop trigger if exists bookings_guard_transitions on public.bookings;

create trigger bookings_guard_transitions
  before update on public.bookings
  for each row execute function public.guard_booking_transitions();

-- ── 3. profiles — extend the existing privileged-column guard to cover
--        is_verified (previously only is_admin/roles[] were blocked).
create or replace function public.guard_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Trigger-maintained projection (refresh_profile_roles) — see
  -- 20260630120700_fix_admin_roles_projection.sql. Must stay first/intact
  -- or role provisioning breaks with "Cannot modify roles directly".
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

    if new.is_verified is true then
      raise exception 'Cannot set is_verified without service role';
    end if;
  end if;

  if tg_op = 'UPDATE' then
    if new.is_admin is distinct from old.is_admin then
      raise exception 'Cannot modify is_admin';
    end if;

    if new.roles is distinct from old.roles then
      raise exception 'Cannot modify roles directly';
    end if;

    if new.is_verified is distinct from old.is_verified and not public.is_admin() then
      raise exception 'Cannot modify is_verified';
    end if;
  end if;

  return new;
end;
$$;

-- ── 4. services — insert must always start as 'pending', no matter what
--        status value the client sends; only admins/service_role can
--        bypass moderation (e.g. re-approving via an admin tool).
create or replace function public.guard_service_insert_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') = 'service_role'
     or current_user in ('postgres', 'supabase_admin')
     or public.is_admin() then
    return new;
  end if;

  new.status := 'pending';
  return new;
end;
$$;

drop trigger if exists services_guard_insert_status on public.services;

create trigger services_guard_insert_status
  before insert on public.services
  for each row execute function public.guard_service_insert_status();

-- ── 5. storage — avatars must be written under "<user_id>/..."; the app
--        (student-profile.tsx / provider-profile.tsx) now uploads with
--        that prefix. Old flat-named files from before this migration
--        keep working for reads (public bucket) but can no longer be
--        overwritten/deleted by non-owners.
drop policy if exists avatars_owner_write on storage.objects;
create policy avatars_owner_write on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists avatars_owner_update on storage.objects;
create policy avatars_owner_update on storage.objects
  for update using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists avatars_owner_delete on storage.objects;
create policy avatars_owner_delete on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── 6. PII — column-level GRANTs for the `anon` role only. This never
--        affects `authenticated` (the whole app requires login except
--        the public marketplace/provider-profile pages, which already
--        request only these same safe columns — see
--        lib/data/profiles.ts:getProviderPublicPreview).
revoke select on public.profiles from anon;
grant select (
  user_id, full_name, avatar_url, bio, location, phone, is_verified, roles
) on public.profiles to anon;

revoke select on public.student_profiles from anon;
grant select (user_id, program, level) on public.student_profiles to anon;

revoke select on public.provider_profiles from anon;
grant select (
  user_id, headline, momo_name, momo_network, available_days,
  available_time, avg_rating, total_reviews, total_bookings
) on public.provider_profiles to anon;
-- Deliberately excluded from anon: profiles.email, profiles.student_id,
-- provider_profiles.momo_number.
