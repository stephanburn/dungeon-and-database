-- Batch 2, slice 3:
-- typed persistence for flexible species ability score increases.

CREATE TABLE IF NOT EXISTS public.character_ability_bonus_choices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES public.characters (id) ON DELETE CASCADE,
  character_level_id uuid REFERENCES public.character_levels (id) ON DELETE SET NULL,
  ability text NOT NULL,
  bonus int NOT NULL DEFAULT 1 CHECK (bonus > 0),
  source_category text NOT NULL DEFAULT 'manual',
  source_entity_id uuid NULL,
  source_feature_key text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (character_id, ability, source_category, source_entity_id, source_feature_key)
);

ALTER TABLE public.character_ability_bonus_choices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "char_ability_bonus_choices_select" ON public.character_ability_bonus_choices;
CREATE POLICY "char_ability_bonus_choices_select" ON public.character_ability_bonus_choices
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );

DROP POLICY IF EXISTS "char_ability_bonus_choices_insert_own" ON public.character_ability_bonus_choices;
CREATE POLICY "char_ability_bonus_choices_insert_own" ON public.character_ability_bonus_choices
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );

DROP POLICY IF EXISTS "char_ability_bonus_choices_update_own" ON public.character_ability_bonus_choices;
CREATE POLICY "char_ability_bonus_choices_update_own" ON public.character_ability_bonus_choices
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

DROP POLICY IF EXISTS "char_ability_bonus_choices_delete_own" ON public.character_ability_bonus_choices;
CREATE POLICY "char_ability_bonus_choices_delete_own" ON public.character_ability_bonus_choices
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );
