-- Slice 5k: stale (source_category, source_entity_id) integrity view.
-- Enumerates character choice rows whose source entity no longer exists in the
-- content tables. Each row carries enough context for the DM audit panel to
-- identify the exact field that has become orphaned.
--
-- Known source_category → content table mapping:
--   class / class_choice / class_feature → classes
--   background / background_choice / background_feature → backgrounds
--   species / species_choice / species_feature → species
--   subclass / subclass_choice / subclass_feature → subclasses
--   feat / feat_choice                  → feats
--   package / starting_equipment        → starting_equipment_packages
--   feature                             → feature_options
--   manual / unknown                    → skipped (assumed valid)

CREATE OR REPLACE VIEW public.character_stale_provenance
WITH (security_invoker = true) AS

WITH provenance_rows AS (
  SELECT
    character_id,
    'character_skill_proficiencies'::text AS choice_table,
    skill::text                           AS choice_key,
    source_category,
    source_entity_id,
    source_feature_key
  FROM public.character_skill_proficiencies
  WHERE source_entity_id IS NOT NULL
    AND source_category <> 'manual'

  UNION ALL

  SELECT
    character_id,
    'character_language_choices',
    language,
    source_category,
    source_entity_id,
    source_feature_key
  FROM public.character_language_choices
  WHERE source_entity_id IS NOT NULL
    AND source_category <> 'manual'

  UNION ALL

  SELECT
    character_id,
    'character_tool_choices',
    tool,
    source_category,
    source_entity_id,
    source_feature_key
  FROM public.character_tool_choices
  WHERE source_entity_id IS NOT NULL
    AND source_category <> 'manual'

  UNION ALL

  SELECT
    character_id,
    'character_ability_bonus_choices',
    ability,
    source_category,
    source_entity_id,
    source_feature_key
  FROM public.character_ability_bonus_choices
  WHERE source_entity_id IS NOT NULL
    AND source_category <> 'manual'

  UNION ALL

  SELECT
    character_id,
    'character_feature_option_choices',
    option_key,
    source_category,
    source_entity_id,
    source_feature_key
  FROM public.character_feature_option_choices
  WHERE source_entity_id IS NOT NULL
    AND source_category <> 'manual'

  UNION ALL

  SELECT
    character_id,
    'character_equipment_items',
    item_id::text,
    source_category,
    source_entity_id,
    NULL::text
  FROM public.character_equipment_items
  WHERE source_entity_id IS NOT NULL
    AND source_category <> 'manual'
),

resolved AS (
  SELECT
    p.character_id,
    p.choice_table,
    p.choice_key,
    p.source_category,
    p.source_entity_id,
    p.source_feature_key,
    CASE
      WHEN p.source_category IN ('class', 'class_choice', 'class_feature')
        THEN EXISTS (SELECT 1 FROM public.classes c WHERE c.id = p.source_entity_id)
      WHEN p.source_category IN ('background', 'background_choice', 'background_feature')
        THEN EXISTS (SELECT 1 FROM public.backgrounds b WHERE b.id = p.source_entity_id)
      WHEN p.source_category IN ('species', 'species_choice', 'species_feature')
        THEN EXISTS (SELECT 1 FROM public.species s WHERE s.id = p.source_entity_id)
      WHEN p.source_category IN ('subclass', 'subclass_choice', 'subclass_feature')
        THEN EXISTS (SELECT 1 FROM public.subclasses sc WHERE sc.id = p.source_entity_id)
      WHEN p.source_category IN ('feat', 'feat_choice')
        THEN EXISTS (SELECT 1 FROM public.feats f WHERE f.id = p.source_entity_id)
      WHEN p.source_category IN ('package', 'starting_equipment')
        THEN EXISTS (SELECT 1 FROM public.starting_equipment_packages ep WHERE ep.id = p.source_entity_id)
      WHEN p.source_category = 'feature'
        THEN EXISTS (SELECT 1 FROM public.feature_options fo WHERE fo.id = p.source_entity_id)
      ELSE TRUE
    END AS entity_exists
  FROM provenance_rows p
)

SELECT
  character_id,
  choice_table,
  choice_key,
  source_category,
  source_entity_id,
  source_feature_key
FROM resolved
WHERE NOT entity_exists;
