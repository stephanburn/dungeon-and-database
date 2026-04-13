-- Generic typed persistence for repeatable feature-family selections.
-- This is the reusable foundation for subclass/class/species feature options
-- such as Arcane Breakthrough, fighting styles, infusions, invocations, and
-- similar choice-driven systems that do not fit spells/feats/languages/tools.

CREATE TABLE IF NOT EXISTS public.character_feature_option_choices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES public.characters (id) ON DELETE CASCADE,
  character_level_id uuid NULL REFERENCES public.character_levels (id) ON DELETE SET NULL,
  option_group_key text NOT NULL,
  option_key text NOT NULL,
  selected_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  choice_order int NOT NULL DEFAULT 0,
  source_category text NOT NULL DEFAULT 'feature',
  source_entity_id uuid NULL,
  source_feature_key text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (character_id, option_group_key, option_key, choice_order, source_feature_key)
);

ALTER TABLE public.character_feature_option_choices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "char_feature_option_choices_select" ON public.character_feature_option_choices;
CREATE POLICY "char_feature_option_choices_select" ON public.character_feature_option_choices
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );

DROP POLICY IF EXISTS "char_feature_option_choices_insert_own" ON public.character_feature_option_choices;
CREATE POLICY "char_feature_option_choices_insert_own" ON public.character_feature_option_choices
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );

DROP POLICY IF EXISTS "char_feature_option_choices_update_own" ON public.character_feature_option_choices;
CREATE POLICY "char_feature_option_choices_update_own" ON public.character_feature_option_choices
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

DROP POLICY IF EXISTS "char_feature_option_choices_delete_own" ON public.character_feature_option_choices;
CREATE POLICY "char_feature_option_choices_delete_own" ON public.character_feature_option_choices
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );
