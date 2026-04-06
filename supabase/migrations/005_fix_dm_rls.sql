-- Fix: DM was blocked from modifying character_levels, character_stat_rolls,
-- and character_skill_proficiencies because INSERT/UPDATE/DELETE policies
-- only checked c.user_id = auth.uid() with no is_dm() exception.

-- ── character_levels ─────────────────────────────────────────
DROP POLICY "char_levels_insert_own" ON public.character_levels;
DROP POLICY "char_levels_update_own" ON public.character_levels;
DROP POLICY "char_levels_delete_own" ON public.character_levels;

CREATE POLICY "char_levels_insert_own" ON public.character_levels
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.characters c
            WHERE c.id = character_id
            AND (c.user_id = auth.uid() OR public.is_dm()))
  );

CREATE POLICY "char_levels_update_own" ON public.character_levels
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.characters c
            WHERE c.id = character_id
            AND (c.user_id = auth.uid() OR public.is_dm()))
  );

CREATE POLICY "char_levels_delete_own" ON public.character_levels
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.characters c
            WHERE c.id = character_id
            AND (c.user_id = auth.uid() OR public.is_dm()))
  );

-- ── character_stat_rolls ──────────────────────────────────────
DROP POLICY "char_stat_rolls_insert_own" ON public.character_stat_rolls;
DROP POLICY "char_stat_rolls_update_own" ON public.character_stat_rolls;
DROP POLICY "char_stat_rolls_delete_own" ON public.character_stat_rolls;

CREATE POLICY "char_stat_rolls_insert_own" ON public.character_stat_rolls
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.characters c
            WHERE c.id = character_id
            AND (c.user_id = auth.uid() OR public.is_dm()))
  );

CREATE POLICY "char_stat_rolls_update_own" ON public.character_stat_rolls
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.characters c
            WHERE c.id = character_id
            AND (c.user_id = auth.uid() OR public.is_dm()))
  );

CREATE POLICY "char_stat_rolls_delete_own" ON public.character_stat_rolls
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.characters c
            WHERE c.id = character_id
            AND (c.user_id = auth.uid() OR public.is_dm()))
  );

-- ── character_skill_proficiencies ─────────────────────────────
DROP POLICY "char_skills_insert_own" ON public.character_skill_proficiencies;
DROP POLICY "char_skills_update_own" ON public.character_skill_proficiencies;
DROP POLICY "char_skills_delete_own" ON public.character_skill_proficiencies;

CREATE POLICY "char_skills_insert_own" ON public.character_skill_proficiencies
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.characters c
            WHERE c.id = character_id
            AND (c.user_id = auth.uid() OR public.is_dm()))
  );

CREATE POLICY "char_skills_update_own" ON public.character_skill_proficiencies
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.characters c
            WHERE c.id = character_id
            AND (c.user_id = auth.uid() OR public.is_dm()))
  );

CREATE POLICY "char_skills_delete_own" ON public.character_skill_proficiencies
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.characters c
            WHERE c.id = character_id
            AND (c.user_id = auth.uid() OR public.is_dm()))
  );
