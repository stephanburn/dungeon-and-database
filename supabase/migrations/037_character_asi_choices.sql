-- Backfill the typed ASI persistence table after the feature-option table moved
-- to its own later migration. This avoids replaying the older, narrower
-- feature-option schema on environments that already applied migration 032.

CREATE TABLE IF NOT EXISTS public.character_asi_choices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES public.characters (id) ON DELETE CASCADE,
  character_level_id uuid REFERENCES public.character_levels (id) ON DELETE SET NULL,
  slot_index int NOT NULL CHECK (slot_index >= 0),
  ability text NOT NULL,
  bonus int NOT NULL DEFAULT 1 CHECK (bonus > 0),
  source_feature_key text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (character_id, slot_index, ability)
);

ALTER TABLE public.character_asi_choices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "char_asi_choices_select" ON public.character_asi_choices;
CREATE POLICY "char_asi_choices_select" ON public.character_asi_choices
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );

DROP POLICY IF EXISTS "char_asi_choices_insert_own" ON public.character_asi_choices;
CREATE POLICY "char_asi_choices_insert_own" ON public.character_asi_choices
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );

DROP POLICY IF EXISTS "char_asi_choices_update_own" ON public.character_asi_choices;
CREATE POLICY "char_asi_choices_update_own" ON public.character_asi_choices
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

DROP POLICY IF EXISTS "char_asi_choices_delete_own" ON public.character_asi_choices;
CREATE POLICY "char_asi_choices_delete_own" ON public.character_asi_choices
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );
