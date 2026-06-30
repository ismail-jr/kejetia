-- ════════════════════════════════════════════════════════════════════
-- Reviews: only after completed + paid bookings
-- ════════════════════════════════════════════════════════════════════

create or replace function public.can_review_booking(p_booking_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.bookings b
    where b.id = p_booking_id
      and b.client_id = auth.uid()
      and b.status = 'completed'
      and b.payment_status = 'paid'
      and not exists (
        select 1 from public.reviews r where r.booking_id = b.id
      )
  );
$$;

drop policy if exists reviews_insert_own on public.reviews;

create policy reviews_insert_own on public.reviews
  for insert with check (
    reviewer_id = auth.uid()
    and public.can_review_booking(booking_id)
  );

grant execute on function public.can_review_booking(uuid)
  to authenticated, service_role;
