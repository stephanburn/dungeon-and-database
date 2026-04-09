-- Ensure the known primary account is the platform admin.
-- This keeps role intent explicit in migration history after the admin/DM split.

UPDATE public.users u
SET role = CASE
  WHEN a.email = 'stephan.burn@gmail.com' THEN 'admin'::public.user_role
  WHEN u.role = 'admin' THEN 'dm'::public.user_role
  ELSE u.role
END
FROM auth.users a
WHERE a.id = u.id
  AND (
    a.email = 'stephan.burn@gmail.com'
    OR u.role = 'admin'
  );
