-- Enforce a singleton admin, give admin global campaign-management access,
-- and add audit logging for sensitive server-side actions.

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  action text NOT NULL,
  target_table text NOT NULL,
  target_id text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  succeeded boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_select_admin" ON public.audit_logs;
CREATE POLICY "audit_logs_select_admin" ON public.audit_logs
  FOR SELECT USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.can_manage_campaign(p_campaign_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT public.is_admin() OR public.is_campaign_dm(p_campaign_id);
$$;

DO $$
DECLARE
  canonical_admin_id uuid;
BEGIN
  SELECT id INTO canonical_admin_id
  FROM public.users
  WHERE role = 'admin'
  ORDER BY created_at, id
  LIMIT 1;

  IF canonical_admin_id IS NULL THEN
    SELECT id INTO canonical_admin_id
    FROM public.users
    ORDER BY created_at, id
    LIMIT 1;

    IF canonical_admin_id IS NOT NULL THEN
      UPDATE public.users
      SET role = 'admin'
      WHERE id = canonical_admin_id;
    END IF;
  END IF;

  IF canonical_admin_id IS NOT NULL THEN
    UPDATE public.users
    SET role = 'dm'
    WHERE role = 'admin'
      AND id <> canonical_admin_id;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.enforce_singleton_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'admin'
    AND EXISTS (
      SELECT 1
      FROM public.users
      WHERE role = 'admin'
        AND id <> NEW.id
    ) THEN
    RAISE EXCEPTION 'Only one admin account is allowed';
  END IF;

  IF TG_OP = 'UPDATE'
    AND OLD.role = 'admin'
    AND NEW.role <> 'admin' THEN
    RAISE EXCEPTION 'The singleton admin role cannot be changed';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_singleton_admin_guard ON public.users;
CREATE TRIGGER users_singleton_admin_guard
  BEFORE INSERT OR UPDATE OF role ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.enforce_singleton_admin();

CREATE OR REPLACE FUNCTION public.prevent_admin_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.role = 'admin' THEN
    RAISE EXCEPTION 'The singleton admin account cannot be deleted';
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS users_prevent_admin_delete ON public.users;
CREATE TRIGGER users_prevent_admin_delete
  BEFORE DELETE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.prevent_admin_delete();

DROP POLICY IF EXISTS "campaigns_select_member" ON public.campaigns;
CREATE POLICY "campaigns_select_member" ON public.campaigns
  FOR SELECT USING (public.is_admin() OR public.is_campaign_member(id) OR dm_id = auth.uid());

DROP POLICY IF EXISTS "campaigns_update_dm" ON public.campaigns;
CREATE POLICY "campaigns_update_dm" ON public.campaigns
  FOR UPDATE USING (public.is_admin() OR (public.is_dm() AND dm_id = auth.uid()));

DROP POLICY IF EXISTS "campaigns_delete_dm" ON public.campaigns;
CREATE POLICY "campaigns_delete_dm" ON public.campaigns
  FOR DELETE USING (public.is_admin() OR (public.is_dm() AND dm_id = auth.uid()));

DROP POLICY IF EXISTS "campaign_members_select" ON public.campaign_members;
CREATE POLICY "campaign_members_select" ON public.campaign_members
  FOR SELECT USING (user_id = auth.uid() OR public.can_manage_campaign(campaign_id));

DROP POLICY IF EXISTS "campaign_members_insert_dm" ON public.campaign_members;
CREATE POLICY "campaign_members_insert_dm" ON public.campaign_members
  FOR INSERT WITH CHECK (public.can_manage_campaign(campaign_id));

DROP POLICY IF EXISTS "campaign_members_delete_dm" ON public.campaign_members;
CREATE POLICY "campaign_members_delete_dm" ON public.campaign_members
  FOR DELETE USING (public.can_manage_campaign(campaign_id));

DROP POLICY IF EXISTS "allowlist_select_member" ON public.campaign_source_allowlist;
CREATE POLICY "allowlist_select_member" ON public.campaign_source_allowlist
  FOR SELECT USING (public.is_campaign_member(campaign_id) OR public.can_manage_campaign(campaign_id));

DROP POLICY IF EXISTS "allowlist_insert_dm" ON public.campaign_source_allowlist;
CREATE POLICY "allowlist_insert_dm" ON public.campaign_source_allowlist
  FOR INSERT WITH CHECK (public.can_manage_campaign(campaign_id));

DROP POLICY IF EXISTS "allowlist_delete_dm" ON public.campaign_source_allowlist;
CREATE POLICY "allowlist_delete_dm" ON public.campaign_source_allowlist
  FOR DELETE USING (public.can_manage_campaign(campaign_id));

DROP POLICY IF EXISTS "characters_select" ON public.characters;
CREATE POLICY "characters_select" ON public.characters
  FOR SELECT USING (
    public.can_manage_campaign(campaign_id)
    OR (user_id = auth.uid() AND character_type = 'pc')
  );

DROP POLICY IF EXISTS "characters_insert_own" ON public.characters;
CREATE POLICY "characters_insert_own" ON public.characters
  FOR INSERT WITH CHECK (
    public.can_manage_campaign(campaign_id)
    OR (user_id = auth.uid() AND character_type = 'pc')
  );

DROP POLICY IF EXISTS "characters_update_own" ON public.characters;
CREATE POLICY "characters_update_own" ON public.characters
  FOR UPDATE
  USING (
    public.can_manage_campaign(campaign_id)
    OR (user_id = auth.uid() AND character_type = 'pc')
  )
  WITH CHECK (
    public.can_manage_campaign(campaign_id)
    OR (user_id = auth.uid() AND character_type = 'pc')
  );

DROP POLICY IF EXISTS "characters_delete_own" ON public.characters;
CREATE POLICY "characters_delete_own" ON public.characters
  FOR DELETE USING (
    public.can_manage_campaign(campaign_id)
    OR (user_id = auth.uid() AND character_type = 'pc')
  );

DROP POLICY IF EXISTS "char_levels_select" ON public.character_levels;
CREATE POLICY "char_levels_select" ON public.character_levels
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );

DROP POLICY IF EXISTS "char_levels_insert_own" ON public.character_levels;
CREATE POLICY "char_levels_insert_own" ON public.character_levels
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );

DROP POLICY IF EXISTS "char_levels_update_own" ON public.character_levels;
CREATE POLICY "char_levels_update_own" ON public.character_levels
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );

DROP POLICY IF EXISTS "char_levels_delete_own" ON public.character_levels;
CREATE POLICY "char_levels_delete_own" ON public.character_levels
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );

DROP POLICY IF EXISTS "char_stat_rolls_select" ON public.character_stat_rolls;
CREATE POLICY "char_stat_rolls_select" ON public.character_stat_rolls
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );

DROP POLICY IF EXISTS "char_stat_rolls_insert_own" ON public.character_stat_rolls;
CREATE POLICY "char_stat_rolls_insert_own" ON public.character_stat_rolls
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );

DROP POLICY IF EXISTS "char_stat_rolls_update_own" ON public.character_stat_rolls;
CREATE POLICY "char_stat_rolls_update_own" ON public.character_stat_rolls
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );

DROP POLICY IF EXISTS "char_stat_rolls_delete_own" ON public.character_stat_rolls;
CREATE POLICY "char_stat_rolls_delete_own" ON public.character_stat_rolls
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );

DROP POLICY IF EXISTS "char_skills_select" ON public.character_skill_proficiencies;
CREATE POLICY "char_skills_select" ON public.character_skill_proficiencies
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );

DROP POLICY IF EXISTS "char_skills_insert_own" ON public.character_skill_proficiencies;
CREATE POLICY "char_skills_insert_own" ON public.character_skill_proficiencies
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );

DROP POLICY IF EXISTS "char_skills_update_own" ON public.character_skill_proficiencies;
CREATE POLICY "char_skills_update_own" ON public.character_skill_proficiencies
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );

DROP POLICY IF EXISTS "char_skills_delete_own" ON public.character_skill_proficiencies;
CREATE POLICY "char_skills_delete_own" ON public.character_skill_proficiencies
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );

DROP POLICY IF EXISTS "char_snapshots_select" ON public.character_snapshots;
CREATE POLICY "char_snapshots_select" ON public.character_snapshots
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );

DROP POLICY IF EXISTS "char_snapshots_insert" ON public.character_snapshots;
CREATE POLICY "char_snapshots_insert" ON public.character_snapshots
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );

DROP POLICY IF EXISTS "char_choices_select" ON public.character_choices;
CREATE POLICY "char_choices_select" ON public.character_choices
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );

DROP POLICY IF EXISTS "char_choices_insert_own" ON public.character_choices;
CREATE POLICY "char_choices_insert_own" ON public.character_choices
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );

DROP POLICY IF EXISTS "char_choices_update_own" ON public.character_choices;
CREATE POLICY "char_choices_update_own" ON public.character_choices
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );

DROP POLICY IF EXISTS "char_choices_delete_own" ON public.character_choices;
CREATE POLICY "char_choices_delete_own" ON public.character_choices
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );
