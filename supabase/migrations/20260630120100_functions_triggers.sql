-- ════════════════════════════════════════════════════════════════════
-- Functions & triggers
-- ════════════════════════════════════════════════════════════════════

-- ── updated_at maintenance ──────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger student_profiles_set_updated_at
  before update on public.student_profiles
  for each row execute function public.handle_updated_at();

create trigger provider_profiles_set_updated_at
  before update on public.provider_profiles
  for each row execute function public.handle_updated_at();

create trigger services_set_updated_at
  before update on public.services
  for each row execute function public.handle_updated_at();

create trigger bookings_set_updated_at
  before update on public.bookings
  for each row execute function public.handle_updated_at();

create trigger reports_set_updated_at
  before update on public.reports
  for each row execute function public.handle_updated_at();

-- ── is_admin() — used throughout RLS ────────────────────────────────
-- SECURITY DEFINER so it can read profiles regardless of the caller's
-- own row-level visibility, avoiding recursive policy evaluation.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.user_id = auth.uid()),
    false
  );
$$;

-- ── Role projection: profiles.roles[] ──────────────────────────────
-- The source of truth for "is this user a student / provider" is the
-- existence of a row in student_profiles / provider_profiles. This
-- function recomputes the denormalised profiles.roles[] cache from those
-- tables (plus the is_admin flag) for a single user.
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

  update public.profiles
    set roles = computed
  where user_id = p_user_id
    and roles is distinct from computed;
end;
$$;

-- Trigger wrappers for the role-extension tables.
create or replace function public.tg_refresh_roles_from_student()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_profile_roles(coalesce(new.user_id, old.user_id));
  return coalesce(new, old);
end;
$$;

create or replace function public.tg_refresh_roles_from_provider()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_profile_roles(coalesce(new.user_id, old.user_id));
  return coalesce(new, old);
end;
$$;

create trigger student_profiles_refresh_roles
  after insert or delete on public.student_profiles
  for each row execute function public.tg_refresh_roles_from_student();

create trigger provider_profiles_refresh_roles
  after insert or delete on public.provider_profiles
  for each row execute function public.tg_refresh_roles_from_provider();

-- Keep roles[] in sync when the is_admin flag flips on profiles.
create or replace function public.tg_refresh_roles_from_admin_flag()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_admin is distinct from old.is_admin then
    perform public.refresh_profile_roles(new.user_id);
  end if;
  return new;
end;
$$;

create trigger profiles_admin_flag_refresh_roles
  after update of is_admin on public.profiles
  for each row execute function public.tg_refresh_roles_from_admin_flag();

-- ── Review aggregates ───────────────────────────────────────────────
-- Recompute avg_rating / total_reviews on the affected service and
-- provider whenever reviews change.
create or replace function public.tg_recompute_review_aggregates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_service_id  uuid := coalesce(new.service_id, old.service_id);
  v_provider_id uuid := coalesce(new.provider_id, old.provider_id);
begin
  update public.services s
    set avg_rating = coalesce(agg.avg_rating, 0),
        total_reviews = coalesce(agg.cnt, 0)
  from (
    select avg(rating)::numeric(10,2) as avg_rating, count(*) as cnt
    from public.reviews where service_id = v_service_id
  ) agg
  where s.id = v_service_id;

  update public.provider_profiles pp
    set avg_rating = coalesce(agg.avg_rating, 0),
        total_reviews = coalesce(agg.cnt, 0)
  from (
    select avg(rating)::numeric(10,2) as avg_rating, count(*) as cnt
    from public.reviews where provider_id = v_provider_id
  ) agg
  where pp.user_id = v_provider_id;

  return coalesce(new, old);
end;
$$;

create trigger reviews_recompute_aggregates
  after insert or update or delete on public.reviews
  for each row execute function public.tg_recompute_review_aggregates();

-- ── Booking counters ────────────────────────────────────────────────
create or replace function public.tg_increment_booking_counts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.services set total_bookings = total_bookings + 1
    where id = new.service_id;
  update public.provider_profiles set total_bookings = total_bookings + 1
    where user_id = new.provider_id;
  return new;
end;
$$;

create trigger bookings_increment_counts
  after insert on public.bookings
  for each row execute function public.tg_increment_booking_counts();

-- ── Messaging helpers ───────────────────────────────────────────────
create or replace function public.is_conversation_participant(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = p_conversation_id
      and cp.user_id = auth.uid()
  );
$$;

-- Bump conversations.last_message_at whenever a message lands.
create or replace function public.tg_touch_conversation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
    set last_message_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger messages_touch_conversation
  after insert on public.messages
  for each row execute function public.tg_touch_conversation();

-- Find-or-create the single direct (non-booking) conversation between the
-- current user and another user. Serialised by an advisory lock keyed on
-- the ordered pair of user ids so two concurrent calls can't both create
-- a thread. Mirrors the contract expected by lib/messaging-data.ts.
create or replace function public.get_or_create_direct_conversation(other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me           uuid := auth.uid();
  lo           uuid;
  hi           uuid;
  existing_id  uuid;
  new_id       uuid;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;
  if other_user_id is null or other_user_id = me then
    raise exception 'Invalid conversation partner';
  end if;

  -- Order the pair deterministically for a stable advisory-lock key.
  if me < other_user_id then
    lo := me; hi := other_user_id;
  else
    lo := other_user_id; hi := me;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(lo::text || ':' || hi::text, 0));

  -- Existing direct conversation that contains exactly these two users.
  select c.id into existing_id
  from public.conversations c
  where c.type = 'direct'
    and exists (select 1 from public.conversation_participants p
                where p.conversation_id = c.id and p.user_id = lo)
    and exists (select 1 from public.conversation_participants p
                where p.conversation_id = c.id and p.user_id = hi)
  limit 1;

  if existing_id is not null then
    return existing_id;
  end if;

  insert into public.conversations (type) values ('direct')
  returning id into new_id;

  insert into public.conversation_participants (conversation_id, user_id)
  values (new_id, lo), (new_id, hi);

  return new_id;
end;
$$;
