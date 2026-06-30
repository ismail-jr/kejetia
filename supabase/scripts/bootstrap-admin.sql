-- Bootstrap / promote an admin from an existing auth.users row.
-- Run in Supabase SQL Editor. Replace the email below.

INSERT INTO public.profiles (user_id, email, full_name, is_admin, active_role)
SELECT
  u.id,
  lower(u.email),
  coalesce(
    u.raw_user_meta_data ->> 'full_name',
    u.raw_user_meta_data ->> 'fullName',
    split_part(u.email, '@', 1)
  ),
  true,
  'admin'
FROM auth.users u
WHERE lower(u.email) = lower('your-admin@ucc.edu.gh')
ON CONFLICT (user_id) DO UPDATE
SET
  is_admin = true,
  active_role = 'admin',
  email = excluded.email,
  updated_at = now();

-- Sync roles[] from is_admin / extension tables
SELECT public.refresh_profile_roles(u.id)
FROM auth.users u
WHERE lower(u.email) = lower('your-admin@ucc.edu.gh');

-- Verify
SELECT user_id, email, is_admin, active_role, roles
FROM public.profiles
WHERE lower(email) = lower('your-admin@ucc.edu.gh');
