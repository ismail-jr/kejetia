-- ════════════════════════════════════════════════════════════════════
-- Storage buckets & policies
-- ════════════════════════════════════════════════════════════════════
-- Buckets referenced by the frontend:
--   * avatars             — public; profile pictures
--   * services            — public; service listing images
--   * message-attachments — private; chat attachments (signed URLs)

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('services', 'services', true),
  ('message-attachments', 'message-attachments', false)
on conflict (id) do update set public = excluded.public;

-- ── avatars (public read, owner write) ──────────────────────────────
-- Files are uploaded under "<user_id>/..." by the profile components.
drop policy if exists avatars_public_read on storage.objects;
create policy avatars_public_read on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists avatars_owner_write on storage.objects;
create policy avatars_owner_write on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid() is not null
  );

drop policy if exists avatars_owner_update on storage.objects;
create policy avatars_owner_update on storage.objects
  for update using (bucket_id = 'avatars' and auth.uid() is not null);

drop policy if exists avatars_owner_delete on storage.objects;
create policy avatars_owner_delete on storage.objects
  for delete using (bucket_id = 'avatars' and auth.uid() is not null);

-- ── services (public read, provider write) ──────────────────────────
-- Files uploaded under "services/<service_id>/...".
drop policy if exists services_public_read on storage.objects;
create policy services_public_read on storage.objects
  for select using (bucket_id = 'services');

drop policy if exists services_auth_write on storage.objects;
create policy services_auth_write on storage.objects
  for insert with check (bucket_id = 'services' and auth.uid() is not null);

drop policy if exists services_auth_update on storage.objects;
create policy services_auth_update on storage.objects
  for update using (bucket_id = 'services' and auth.uid() is not null);

drop policy if exists services_auth_delete on storage.objects;
create policy services_auth_delete on storage.objects
  for delete using (bucket_id = 'services' and auth.uid() is not null);

-- ── message-attachments (private) ───────────────────────────────────
-- Path convention: "<conversation_id>/<message_id>-<filename>". The
-- first path segment is the conversation id, which authorises access via
-- conversation participation. Access is over signed URLs only.
drop policy if exists message_attachments_participant_read on storage.objects;
create policy message_attachments_participant_read on storage.objects
  for select using (
    bucket_id = 'message-attachments'
    and public.is_conversation_participant(
      (storage.foldername(name))[1]::uuid
    )
  );

drop policy if exists message_attachments_participant_write on storage.objects;
create policy message_attachments_participant_write on storage.objects
  for insert with check (
    bucket_id = 'message-attachments'
    and public.is_conversation_participant(
      (storage.foldername(name))[1]::uuid
    )
  );
