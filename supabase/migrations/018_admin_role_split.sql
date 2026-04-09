-- Add the admin enum value in its own migration.
-- PostgreSQL requires the new enum value to be committed before later
-- statements in subsequent migrations can safely reference it.

DO $$
BEGIN
  ALTER TYPE public.user_role ADD VALUE 'admin';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
