-- ════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ════════════════════════════════════════════════════════════════════
-- The Express auth backend uses the service-role key and bypasses RLS,
-- so registration/role-provisioning writes are unaffected by these
-- policies. They govern the browser (anon / authenticated) client only.

alter table public.profiles                 enable row level security;
alter table public.student_profiles         enable row level security;
alter table public.provider_profiles        enable row level security;
alter table public.services                 enable row level security;
alter table public.bookings                 enable row level security;
alter table public.reviews                  enable row level security;
alter table public.saved_services           enable row level security;
alter table public.reports                  enable row level security;
alter table public.notifications            enable row level security;
alter table public.conversations            enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages                 enable row level security;
alter table public.message_deletions        enable row level security;

-- ── profiles ────────────────────────────────────────────────────────
-- Public read (marketplace shows provider names/avatars to anon users).
create policy profiles_select_all on public.profiles
  for select using (true);

create policy profiles_insert_self on public.profiles
  for insert with check (auth.uid() = user_id);

create policy profiles_update_self on public.profiles
  for update using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- ── student_profiles ────────────────────────────────────────────────
create policy student_profiles_select_all on public.student_profiles
  for select using (true);

create policy student_profiles_write_self on public.student_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── provider_profiles ───────────────────────────────────────────────
create policy provider_profiles_select_all on public.provider_profiles
  for select using (true);

create policy provider_profiles_write_self on public.provider_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── services ────────────────────────────────────────────────────────
create policy services_select_visible on public.services
  for select using (
    status = 'approved'
    or provider_id = auth.uid()
    or public.is_admin()
  );

create policy services_insert_own on public.services
  for insert with check (provider_id = auth.uid());

create policy services_update_own on public.services
  for update using (provider_id = auth.uid() or public.is_admin())
  with check (provider_id = auth.uid() or public.is_admin());

create policy services_delete_own on public.services
  for delete using (provider_id = auth.uid() or public.is_admin());

-- ── bookings ────────────────────────────────────────────────────────
create policy bookings_select_party on public.bookings
  for select using (
    client_id = auth.uid()
    or provider_id = auth.uid()
    or public.is_admin()
  );

create policy bookings_insert_client on public.bookings
  for insert with check (client_id = auth.uid());

create policy bookings_update_party on public.bookings
  for update using (client_id = auth.uid() or provider_id = auth.uid())
  with check (client_id = auth.uid() or provider_id = auth.uid());

-- ── reviews ─────────────────────────────────────────────────────────
create policy reviews_select_all on public.reviews
  for select using (true);

create policy reviews_insert_own on public.reviews
  for insert with check (reviewer_id = auth.uid());

-- ── saved_services ──────────────────────────────────────────────────
create policy saved_services_all_own on public.saved_services
  for all using (student_id = auth.uid()) with check (student_id = auth.uid());

-- ── reports ─────────────────────────────────────────────────────────
create policy reports_select_own_or_admin on public.reports
  for select using (reporter_id = auth.uid() or public.is_admin());

create policy reports_insert_own on public.reports
  for insert with check (reporter_id = auth.uid());

create policy reports_update_admin on public.reports
  for update using (public.is_admin()) with check (public.is_admin());

-- ── notifications ───────────────────────────────────────────────────
create policy notifications_select_own on public.notifications
  for select using (user_id = auth.uid());

create policy notifications_update_own on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- A user can create their own notifications; admins can notify anyone
-- (e.g. listing approval/rejection messages).
create policy notifications_insert_self_or_admin on public.notifications
  for insert with check (user_id = auth.uid() or public.is_admin());

-- ── conversations ───────────────────────────────────────────────────
create policy conversations_select_participant on public.conversations
  for select using (public.is_conversation_participant(id));

create policy conversations_insert_auth on public.conversations
  for insert with check (auth.uid() is not null);

create policy conversations_update_participant on public.conversations
  for update using (public.is_conversation_participant(id))
  with check (public.is_conversation_participant(id));

-- ── conversation_participants ───────────────────────────────────────
create policy conversation_participants_select on public.conversation_participants
  for select using (
    user_id = auth.uid() or public.is_conversation_participant(conversation_id)
  );

create policy conversation_participants_insert on public.conversation_participants
  for insert with check (auth.uid() is not null);

create policy conversation_participants_update_self on public.conversation_participants
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── messages ────────────────────────────────────────────────────────
create policy messages_select_participant on public.messages
  for select using (public.is_conversation_participant(conversation_id));

create policy messages_insert_participant on public.messages
  for insert with check (
    sender_id = auth.uid()
    and public.is_conversation_participant(conversation_id)
  );

-- ── message_deletions ───────────────────────────────────────────────
create policy message_deletions_all_own on public.message_deletions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
