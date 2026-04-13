-- Batch 2, slice 1:
-- typed persistence for feat and spell selections, with legacy character_choices retained for fallback reads.

CREATE TABLE IF NOT EXISTS public.character_spell_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES public.characters (id) ON DELETE CASCADE,
  character_level_id uuid REFERENCES public.character_levels (id) ON DELETE SET NULL,
  spell_id uuid NOT NULL REFERENCES public.spells (id) ON DELETE CASCADE,
  owning_class_id uuid REFERENCES public.classes (id) ON DELETE SET NULL,
  granting_subclass_id uuid REFERENCES public.subclasses (id) ON DELETE SET NULL,
  acquisition_mode text NOT NULL DEFAULT 'known',
  counts_against_selection_limit boolean NOT NULL DEFAULT true,
  source_feature_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (character_id, spell_id, owning_class_id, granting_subclass_id, acquisition_mode)
);

CREATE TABLE IF NOT EXISTS public.character_feat_choices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES public.characters (id) ON DELETE CASCADE,
  character_level_id uuid REFERENCES public.character_levels (id) ON DELETE SET NULL,
  feat_id uuid NOT NULL REFERENCES public.feats (id) ON DELETE CASCADE,
  choice_kind text NOT NULL DEFAULT 'feat',
  source_feature_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (character_id, feat_id, choice_kind)
);

ALTER TABLE public.character_spell_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_feat_choices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "char_spell_select" ON public.character_spell_selections;
CREATE POLICY "char_spell_select" ON public.character_spell_selections
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );

DROP POLICY IF EXISTS "char_spell_insert_own" ON public.character_spell_selections;
CREATE POLICY "char_spell_insert_own" ON public.character_spell_selections
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );

DROP POLICY IF EXISTS "char_spell_update_own" ON public.character_spell_selections;
CREATE POLICY "char_spell_update_own" ON public.character_spell_selections
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

DROP POLICY IF EXISTS "char_spell_delete_own" ON public.character_spell_selections;
CREATE POLICY "char_spell_delete_own" ON public.character_spell_selections
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );

DROP POLICY IF EXISTS "char_feat_select" ON public.character_feat_choices;
CREATE POLICY "char_feat_select" ON public.character_feat_choices
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );

DROP POLICY IF EXISTS "char_feat_insert_own" ON public.character_feat_choices;
CREATE POLICY "char_feat_insert_own" ON public.character_feat_choices
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );

DROP POLICY IF EXISTS "char_feat_update_own" ON public.character_feat_choices;
CREATE POLICY "char_feat_update_own" ON public.character_feat_choices
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

DROP POLICY IF EXISTS "char_feat_delete_own" ON public.character_feat_choices;
CREATE POLICY "char_feat_delete_own" ON public.character_feat_choices
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );

INSERT INTO public.character_spell_selections (
  character_id,
  character_level_id,
  spell_id,
  acquisition_mode,
  counts_against_selection_limit
)
SELECT
  cc.character_id,
  cc.character_level_id,
  (cc.choice_value->>'spell_id')::uuid,
  'known',
  true
FROM public.character_choices cc
WHERE cc.choice_type = 'spell_known'
  AND cc.choice_value ? 'spell_id'
ON CONFLICT (character_id, spell_id, owning_class_id, granting_subclass_id, acquisition_mode) DO NOTHING;

INSERT INTO public.character_feat_choices (
  character_id,
  character_level_id,
  feat_id,
  choice_kind
)
SELECT
  cc.character_id,
  cc.character_level_id,
  (cc.choice_value->>'feat_id')::uuid,
  'feat'
FROM public.character_choices cc
WHERE cc.choice_type = 'feat'
  AND cc.choice_value ? 'feat_id'
ON CONFLICT (character_id, feat_id, choice_kind) DO NOTHING;
