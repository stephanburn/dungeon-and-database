-- Restore auth signup/profile creation after the users.email column became required.
-- Migration 003 added public.users.email as NOT NULL, but migration 019
-- replaced handle_new_user without writing that column. Supabase Auth then
-- reports "Database error creating new user" because this trigger fails.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role public.user_role;
BEGIN
  IF (SELECT COUNT(*) FROM public.users) = 0 THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := 'player';
  END IF;

  INSERT INTO public.users (id, email, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''),
      'Player'
    ),
    assigned_role
  );

  RETURN NEW;
END;
$$;
