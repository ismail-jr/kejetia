-- ════════════════════════════════════════════════════════════════════
-- Efficient conversation list — one round trip instead of N+1 queries
-- ════════════════════════════════════════════════════════════════════
-- The previous client-side implementation of listConversations()
-- fetched EVERY message in EVERY one of the user's conversations (no
-- limit) just to find each conversation's last message and count
-- unread ones. That's fine with a handful of test messages but scales
-- linearly with total message history — pull message content/text
-- across a user's entire chat history, on every conversation list
-- render. This function does the same "last message + unread count per
-- conversation" computation server-side with per-conversation LATERAL
-- joins (so Postgres only ever looks at the tail of each conversation's
-- messages, not the whole table).

-- Composite index so both LATERAL subqueries (latest message, unread
-- count) can seek straight to a conversation's tail instead of scanning
-- messages_conversation_id_idx and re-sorting by created_at every time.
create index if not exists messages_conversation_id_created_at_idx
  on public.messages (conversation_id, created_at desc);

create or replace function public.get_conversation_previews()
returns table (
  id                        uuid,
  type                      public.conversation_type_enum,
  booking_id                uuid,
  last_message_at           timestamptz,
  other_user_id             uuid,
  other_full_name           text,
  other_avatar_url          text,
  last_message_content      text,
  last_message_attachments  text[],
  last_message_created_at   timestamptz,
  last_message_sender_id    uuid,
  unread_count              bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.type,
    c.booking_id,
    c.last_message_at,
    other_p.user_id  as other_user_id,
    other_p.full_name as other_full_name,
    other_p.avatar_url as other_avatar_url,
    lm.content,
    lm.attachments,
    lm.created_at,
    lm.sender_id,
    coalesce(uc.unread_count, 0)
  from public.conversation_participants me
  join public.conversations c on c.id = me.conversation_id
  left join public.conversation_participants other
    on other.conversation_id = c.id and other.user_id <> auth.uid()
  left join public.profiles other_p on other_p.user_id = other.user_id
  left join lateral (
    select m.content, m.attachments, m.created_at, m.sender_id
    from public.messages m
    where m.conversation_id = c.id
    order by m.created_at desc
    limit 1
  ) lm on true
  left join lateral (
    select count(*) as unread_count
    from public.messages m2
    where m2.conversation_id = c.id
      and m2.sender_id <> auth.uid()
      and (me.last_read_at is null or m2.created_at > me.last_read_at)
  ) uc on true
  where me.user_id = auth.uid()
  order by c.last_message_at desc;
$$;

grant execute on function public.get_conversation_previews()
  to authenticated, service_role;
