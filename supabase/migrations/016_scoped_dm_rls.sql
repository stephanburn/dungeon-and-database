-- Scope DM access to campaigns they actually own rather than any row with a DM role.
-- This closes cross-DM read/write access across campaigns, characters, and related tables.

CREATE OR REPLACE FUNCTION public.is_campaign_dm(p_campaign_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.campaigns
    WHERE id = p_campaign_id
      AND dm_id = auth.uid()
  );
$$;

-- ── campaigns ────────────────────────────────────────────────
DROP POLICY IF EXISTS "campaigns_select_member" ON public.campaigns;

CREATE POLICY "campaigns_select_member" ON public.campaigns
  FOR SELECT USING (public.is_campaign_member(id) OR dm_id = auth.uid());

-- ── campaign_members ─────────────────────────────────────────
DROP POLICY IF EXISTS "campaign_members_select" ON public.campaign_members;
DROP POLICY IF EXISTS "campaign_members_insert_dm" ON public.campaign_members;
DROP POLICY IF EXISTS "campaign_members_delete_dm" ON public.campaign_members;

CREATE POLICY "campaign_members_select" ON public.campaign_members
  FOR SELECT USING (user_id = auth.uid() OR public.is_campaign_dm(campaign_id));

CREATE POLICY "campaign_members_insert_dm" ON public.campaign_members
  FOR INSERT WITH CHECK (public.is_campaign_dm(campaign_id));

CREATE POLICY "campaign_members_delete_dm" ON public.campaign_members
  FOR DELETE USING (public.is_campaign_dm(campaign_id));

-- ── campaign_source_allowlist ────────────────────────────────
DROP POLICY IF EXISTS "allowlist_select_member" ON public.campaign_source_allowlist;
DROP POLICY IF EXISTS "allowlist_insert_dm" ON public.campaign_source_allowlist;
DROP POLICY IF EXISTS "allowlist_delete_dm" ON public.campaign_source_allowlist;

CREATE POLICY "allowlist_select_member" ON public.campaign_source_allowlist
  FOR SELECT USING (public.is_campaign_member(campaign_id) OR public.is_campaign_dm(campaign_id));

CREATE POLICY "allowlist_insert_dm" ON public.campaign_source_allowlist
  FOR INSERT WITH CHECK (public.is_campaign_dm(campaign_id));

CREATE POLICY "allowlist_delete_dm" ON public.campaign_source_allowlist
  FOR DELETE USING (public.is_campaign_dm(campaign_id));

-- ── characters ───────────────────────────────────────────────
DROP POLICY IF EXISTS "characters_select" ON public.characters;
DROP POLICY IF EXISTS "characters_insert_own" ON public.characters;
DROP POLICY IF EXISTS "characters_update_own" ON public.characters;
DROP POLICY IF EXISTS "characters_delete_own" ON public.characters;

CREATE POLICY "characters_select" ON public.characters
  FOR SELECT USING (
    public.is_campaign_dm(campaign_id)
    OR (user_id = auth.uid() AND character_type = 'pc')
  );

CREATE POLICY "characters_insert_own" ON public.characters
  FOR INSERT WITH CHECK (
    public.is_campaign_dm(campaign_id)
    OR (user_id = auth.uid() AND character_type = 'pc')
  );

CREATE POLICY "characters_update_own" ON public.characters
  FOR UPDATE
  USING (
    public.is_campaign_dm(campaign_id)
    OR (user_id = auth.uid() AND character_type = 'pc')
  )
  WITH CHECK (
    public.is_campaign_dm(campaign_id)
    OR (user_id = auth.uid() AND character_type = 'pc')
  );

CREATE POLICY "characters_delete_own" ON public.characters
  FOR DELETE USING (
    public.is_campaign_dm(campaign_id)
    OR (user_id = auth.uid() AND character_type = 'pc')
  );

-- ── character_levels ─────────────────────────────────────────
DROP POLICY IF EXISTS "char_levels_select" ON public.character_levels;
DROP POLICY IF EXISTS "char_levels_insert_own" ON public.character_levels;
DROP POLICY IF EXISTS "char_levels_update_own" ON public.character_levels;
DROP POLICY IF EXISTS "char_levels_delete_own" ON public.character_levels;

CREATE POLICY "char_levels_select" ON public.character_levels
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.is_campaign_dm(c.campaign_id))
    )
  );

CREATE POLICY "char_levels_insert_own" ON public.character_levels
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.is_campaign_dm(c.campaign_id))
    )
  );

CREATE POLICY "char_levels_update_own" ON public.character_levels
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.is_campaign_dm(c.campaign_id))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.is_campaign_dm(c.campaign_id))
    )
  );

CREATE POLICY "char_levels_delete_own" ON public.character_levels
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.is_campaign_dm(c.campaign_id))
    )
  );

-- ── character_stat_rolls ─────────────────────────────────────
DROP POLICY IF EXISTS "char_stat_rolls_select" ON public.character_stat_rolls;
DROP POLICY IF EXISTS "char_stat_rolls_insert_own" ON public.character_stat_rolls;
DROP POLICY IF EXISTS "char_stat_rolls_update_own" ON public.character_stat_rolls;
DROP POLICY IF EXISTS "char_stat_rolls_delete_own" ON public.character_stat_rolls;

CREATE POLICY "char_stat_rolls_select" ON public.character_stat_rolls
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.is_campaign_dm(c.campaign_id))
    )
  );

CREATE POLICY "char_stat_rolls_insert_own" ON public.character_stat_rolls
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.is_campaign_dm(c.campaign_id))
    )
  );

CREATE POLICY "char_stat_rolls_update_own" ON public.character_stat_rolls
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.is_campaign_dm(c.campaign_id))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.is_campaign_dm(c.campaign_id))
    )
  );

CREATE POLICY "char_stat_rolls_delete_own" ON public.character_stat_rolls
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.is_campaign_dm(c.campaign_id))
    )
  );

-- ── character_skill_proficiencies ────────────────────────────
DROP POLICY IF EXISTS "char_skills_select" ON public.character_skill_proficiencies;
DROP POLICY IF EXISTS "char_skills_insert_own" ON public.character_skill_proficiencies;
DROP POLICY IF EXISTS "char_skills_update_own" ON public.character_skill_proficiencies;
DROP POLICY IF EXISTS "char_skills_delete_own" ON public.character_skill_proficiencies;

CREATE POLICY "char_skills_select" ON public.character_skill_proficiencies
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.is_campaign_dm(c.campaign_id))
    )
  );

CREATE POLICY "char_skills_insert_own" ON public.character_skill_proficiencies
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.is_campaign_dm(c.campaign_id))
    )
  );

CREATE POLICY "char_skills_update_own" ON public.character_skill_proficiencies
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.is_campaign_dm(c.campaign_id))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.is_campaign_dm(c.campaign_id))
    )
  );

CREATE POLICY "char_skills_delete_own" ON public.character_skill_proficiencies
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.is_campaign_dm(c.campaign_id))
    )
  );

-- ── character_snapshots ──────────────────────────────────────
DROP POLICY IF EXISTS "char_snapshots_select" ON public.character_snapshots;
DROP POLICY IF EXISTS "char_snapshots_insert" ON public.character_snapshots;

CREATE POLICY "char_snapshots_select" ON public.character_snapshots
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.is_campaign_dm(c.campaign_id))
    )
  );

CREATE POLICY "char_snapshots_insert" ON public.character_snapshots
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.is_campaign_dm(c.campaign_id))
    )
  );

-- ── character_choices ────────────────────────────────────────
DROP POLICY IF EXISTS "char_choices_select" ON public.character_choices;
DROP POLICY IF EXISTS "char_choices_insert_own" ON public.character_choices;
DROP POLICY IF EXISTS "char_choices_update_own" ON public.character_choices;
DROP POLICY IF EXISTS "char_choices_delete_own" ON public.character_choices;

CREATE POLICY "char_choices_select" ON public.character_choices
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.is_campaign_dm(c.campaign_id))
    )
  );

CREATE POLICY "char_choices_insert_own" ON public.character_choices
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.is_campaign_dm(c.campaign_id))
    )
  );

CREATE POLICY "char_choices_update_own" ON public.character_choices
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.is_campaign_dm(c.campaign_id))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.is_campaign_dm(c.campaign_id))
    )
  );

CREATE POLICY "char_choices_delete_own" ON public.character_choices
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.is_campaign_dm(c.campaign_id))
    )
  );
