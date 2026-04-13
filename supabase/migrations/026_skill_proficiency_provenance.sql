-- Enrich chosen skill proficiencies with provenance so species/background/class
-- skill choices can be reconstructed without guessing from the current sheet.

ALTER TABLE public.character_skill_proficiencies
  ADD COLUMN IF NOT EXISTS character_level_id uuid REFERENCES public.character_levels (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_category text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS source_entity_id uuid NULL,
  ADD COLUMN IF NOT EXISTS source_feature_key text NULL;
