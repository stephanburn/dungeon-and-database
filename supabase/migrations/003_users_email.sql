-- Add email to users table so players can be looked up by email for campaign invites.
-- Backfill from auth.users, then update the trigger to include it going forward.

ALTER TABLE public.users ADD COLUMN email text NOT NULL DEFAULT '';

UPDATE public.users u
SET email = (SELECT email FROM auth.users WHERE id = u.id);

ALTER TABLE public.users ALTER COLUMN email DROP DEFAULT;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role user_role;
BEGIN
  IF (SELECT COUNT(*) FROM public.users) = 0 THEN
    assigned_role := 'dm';
  ELSE
    assigned_role := 'player';
  END IF;

  INSERT INTO public.users (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    assigned_role
  );
  RETURN NEW;
END;
$$;
