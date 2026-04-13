-- Batch 2, slice 2:
-- typed persistence for chosen languages and tool proficiencies so species,
-- background, and later feature-option selections can be reconstructed.

CREATE TABLE IF NOT EXISTS public.character_language_choices (
  character_id uuid NOT NULL REFERENCES public.characters (id) ON DELETE CASCADE,
  language text NOT NULL,
  character_level_id uuid REFERENCES public.character_levels (id) ON DELETE SET NULL,
  source_category text NOT NULL DEFAULT 'manual',
  source_entity_id uuid NULL,
  source_feature_key text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (character_id, language)
);

CREATE TABLE IF NOT EXISTS public.character_tool_choices (
  character_id uuid NOT NULL REFERENCES public.characters (id) ON DELETE CASCADE,
  tool text NOT NULL,
  character_level_id uuid REFERENCES public.character_levels (id) ON DELETE SET NULL,
  source_category text NOT NULL DEFAULT 'manual',
  source_entity_id uuid NULL,
  source_feature_key text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (character_id, tool)
);

ALTER TABLE public.character_language_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_tool_choices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "char_language_choices_select" ON public.character_language_choices;
CREATE POLICY "char_language_choices_select" ON public.character_language_choices
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );

DROP POLICY IF EXISTS "char_language_choices_insert_own" ON public.character_language_choices;
CREATE POLICY "char_language_choices_insert_own" ON public.character_language_choices
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );

DROP POLICY IF EXISTS "char_language_choices_update_own" ON public.character_language_choices;
CREATE POLICY "char_language_choices_update_own" ON public.character_language_choices
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

DROP POLICY IF EXISTS "char_language_choices_delete_own" ON public.character_language_choices;
CREATE POLICY "char_language_choices_delete_own" ON public.character_language_choices
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );

DROP POLICY IF EXISTS "char_tool_choices_select" ON public.character_tool_choices;
CREATE POLICY "char_tool_choices_select" ON public.character_tool_choices
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );

DROP POLICY IF EXISTS "char_tool_choices_insert_own" ON public.character_tool_choices;
CREATE POLICY "char_tool_choices_insert_own" ON public.character_tool_choices
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );

DROP POLICY IF EXISTS "char_tool_choices_update_own" ON public.character_tool_choices;
CREATE POLICY "char_tool_choices_update_own" ON public.character_tool_choices
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

DROP POLICY IF EXISTS "char_tool_choices_delete_own" ON public.character_tool_choices;
CREATE POLICY "char_tool_choices_delete_own" ON public.character_tool_choices
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );
