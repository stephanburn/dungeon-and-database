-- Slice 6b: content-backed feature spell grants.
-- Feature-granted spells are keyed to spells.id so admin spell renames and
-- duplicate spell names cannot silently change granted-spell behavior.

CREATE TABLE IF NOT EXISTS public.feature_spell_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_feature_key text NOT NULL,
  source_category text NOT NULL,
  source_entity_id uuid,
  acquisition_mode text NOT NULL DEFAULT 'granted',
  counts_against_selection_limit boolean NOT NULL DEFAULT false,
  minimum_character_level int NOT NULL DEFAULT 1 CHECK (minimum_character_level >= 1),
  minimum_class_level int CHECK (minimum_class_level IS NULL OR minimum_class_level >= 1),
  owning_class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  granting_subclass_id uuid REFERENCES public.subclasses(id) ON DELETE SET NULL,
  spell_id uuid NOT NULL REFERENCES public.spells(id) ON DELETE CASCADE,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_category, source_entity_id, source_feature_key)
);

CREATE INDEX IF NOT EXISTS feature_spell_grants_spell_id_idx
  ON public.feature_spell_grants (spell_id);

CREATE INDEX IF NOT EXISTS feature_spell_grants_source_entity_idx
  ON public.feature_spell_grants (source_category, source_entity_id);

ALTER TABLE public.feature_spell_grants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feature_spell_grants_select_auth" ON public.feature_spell_grants;
CREATE POLICY "feature_spell_grants_select_auth" ON public.feature_spell_grants
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "feature_spell_grants_insert_admin" ON public.feature_spell_grants;
CREATE POLICY "feature_spell_grants_insert_admin" ON public.feature_spell_grants
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "feature_spell_grants_update_admin" ON public.feature_spell_grants;
CREATE POLICY "feature_spell_grants_update_admin" ON public.feature_spell_grants
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "feature_spell_grants_delete_admin" ON public.feature_spell_grants;
CREATE POLICY "feature_spell_grants_delete_admin" ON public.feature_spell_grants
  FOR DELETE USING (public.is_admin());

WITH species_grant_specs (
  species_source,
  species_name,
  source_feature_key,
  spell_lookup_name,
  preferred_spell_sources,
  minimum_character_level
) AS (
  VALUES
    ('ERftLW', 'Half-Elf (Mark of Detection)', 'species_trait:magical_detection:detect_magic', 'Detect Magic', ARRAY['ERftLW'], 1),
    ('ERftLW', 'Half-Elf (Mark of Detection)', 'species_trait:magical_detection:detect_poison_and_disease', 'Detect Poison and Disease', ARRAY['EE'], 1),
    ('ERftLW', 'Half-Elf (Mark of Detection)', 'species_trait:magical_detection:see_invisibility', 'See Invisibility', ARRAY['ERftLW'], 3),
    ('ERftLW', 'Half-Elf (Mark of Storm)', 'species_trait:storms_boon:gust', 'Gust', ARRAY['EE', 'PHB', 'SRD'], 1),
    ('ERftLW', 'Half-Elf (Mark of Storm)', 'species_trait:storms_boon:gust_of_wind', 'Gust of Wind', ARRAY['ERftLW'], 3),
    ('ERftLW', 'Half-Orc (Mark of Finding)', 'species_trait:finders_magic:hunters_mark', 'Hunter''s Mark', ARRAY['ERftLW'], 1),
    ('ERftLW', 'Half-Orc (Mark of Finding)', 'species_trait:finders_magic:locate_object', 'Locate Object', ARRAY['ERftLW'], 3),
    ('ERftLW', 'Human (Mark of Finding)', 'species_trait:finders_magic:hunters_mark', 'Hunter''s Mark', ARRAY['ERftLW'], 1),
    ('ERftLW', 'Human (Mark of Finding)', 'species_trait:finders_magic:locate_object', 'Locate Object', ARRAY['ERftLW'], 3),
    ('ERftLW', 'Human (Mark of Handling)', 'species_trait:primal_connection:animal_friendship', 'Animal Friendship', ARRAY['ERftLW'], 1),
    ('ERftLW', 'Human (Mark of Handling)', 'species_trait:primal_connection:speak_with_animals', 'Speak With Animals', ARRAY['ERftLW'], 1),
    ('ERftLW', 'Human (Mark of Making)', 'species_trait:spellsmith:mending', 'Mending', ARRAY['ERftLW'], 1),
    ('ERftLW', 'Human (Mark of Making)', 'species_trait:spellsmith:magic_weapon', 'Magic Weapon', ARRAY['ERftLW'], 1),
    ('ERftLW', 'Human (Mark of Passage)', 'species_trait:magical_passage:misty_step', 'Misty Step', ARRAY['ERftLW'], 1),
    ('ERftLW', 'Human (Mark of Sentinel)', 'species_trait:guardians_shield:shield', 'Shield', ARRAY['ERftLW'], 1),
    ('ERftLW', 'Dwarf (Mark of Warding)', 'species_trait:wards_and_seals:alarm', 'Alarm', ARRAY['ERftLW'], 1),
    ('ERftLW', 'Dwarf (Mark of Warding)', 'species_trait:wards_and_seals:mage_armor', 'Mage Armor', ARRAY['EE', 'PHB', 'SRD', 'ERftLW'], 1),
    ('ERftLW', 'Dwarf (Mark of Warding)', 'species_trait:wards_and_seals:arcane_lock', 'Arcane Lock', ARRAY['ERftLW'], 3),
    ('ERftLW', 'Halfling (Mark of Hospitality)', 'species_trait:innkeepers_magic:prestidigitation', 'Prestidigitation', ARRAY['ERftLW'], 1),
    ('ERftLW', 'Halfling (Mark of Hospitality)', 'species_trait:innkeepers_magic:purify_food_and_drink', 'Purify Food and Drink', ARRAY['ERftLW'], 1),
    ('ERftLW', 'Halfling (Mark of Hospitality)', 'species_trait:innkeepers_magic:unseen_servant', 'Unseen Servant', ARRAY['EE', 'PHB', 'SRD', 'ERftLW'], 1),
    ('ERftLW', 'Halfling (Mark of Healing)', 'species_trait:healing_touch:cure_wounds', 'Cure Wounds', ARRAY['ERftLW'], 1),
    ('ERftLW', 'Halfling (Mark of Healing)', 'species_trait:healing_touch:lesser_restoration', 'Lesser Restoration', ARRAY['ERftLW'], 3),
    ('ERftLW', 'Elf (Mark of Shadow)', 'species_trait:shape_shadows:minor_illusion', 'Minor Illusion', ARRAY['EE', 'PHB', 'SRD', 'ERftLW'], 1),
    ('ERftLW', 'Elf (Mark of Shadow)', 'species_trait:shape_shadows:invisibility', 'Invisibility', ARRAY['ERftLW'], 3),
    ('ERftLW', 'Gnome (Mark of Scribing)', 'species_trait:scribes_insight:message', 'Message', ARRAY['ERftLW'], 1),
    ('ERftLW', 'Gnome (Mark of Scribing)', 'species_trait:scribes_insight:comprehend_languages', 'Comprehend Languages', ARRAY['ERftLW'], 1),
    ('ERftLW', 'Gnome (Mark of Scribing)', 'species_trait:scribes_insight:magic_mouth', 'Magic Mouth', ARRAY['ERftLW'], 1),
    ('PHB', 'Drow', 'species_trait:drow_magic:dancing_lights', 'Dancing Lights', ARRAY['PHB', 'SRD', 'ERftLW'], 1),
    ('PHB', 'Drow', 'species_trait:drow_magic:faerie_fire', 'Faerie Fire', ARRAY['PHB', 'SRD', 'ERftLW'], 3),
    ('PHB', 'Drow', 'species_trait:drow_magic:darkness', 'Darkness', ARRAY['PHB', 'SRD', 'ERftLW'], 5),
    ('PHB', 'Tiefling', 'species_trait:infernal_legacy:thaumaturgy', 'Thaumaturgy', ARRAY['PHB', 'SRD'], 1),
    ('PHB', 'Tiefling', 'species_trait:infernal_legacy:hellish_rebuke', 'Hellish Rebuke', ARRAY['PHB', 'SRD'], 3),
    ('PHB', 'Tiefling', 'species_trait:infernal_legacy:darkness', 'Darkness', ARRAY['PHB', 'SRD', 'ERftLW'], 5)
),
resolved_species_grants AS (
  SELECT
    spec.source_feature_key,
    species.id AS source_entity_id,
    spec.minimum_character_level,
    spell.id AS spell_id,
    jsonb_build_object(
      'species_source', spec.species_source,
      'species_name', spec.species_name,
      'spell_lookup_name', spec.spell_lookup_name,
      'preferred_spell_sources', spec.preferred_spell_sources
    ) AS metadata
  FROM species_grant_specs spec
  JOIN public.species species
    ON species.source = spec.species_source
   AND species.name = spec.species_name
  JOIN LATERAL (
    SELECT candidate.id
    FROM public.spells candidate
    WHERE candidate.name = spec.spell_lookup_name
      AND candidate.source = ANY(spec.preferred_spell_sources)
    ORDER BY array_position(spec.preferred_spell_sources, candidate.source)
    LIMIT 1
  ) spell ON true
)
INSERT INTO public.feature_spell_grants (
  source_feature_key,
  source_category,
  source_entity_id,
  acquisition_mode,
  counts_against_selection_limit,
  minimum_character_level,
  minimum_class_level,
  owning_class_id,
  granting_subclass_id,
  spell_id,
  metadata
)
SELECT
  source_feature_key,
  'species_trait',
  source_entity_id,
  'granted',
  false,
  minimum_character_level,
  NULL,
  NULL,
  NULL,
  spell_id,
  metadata
FROM resolved_species_grants
ON CONFLICT (source_category, source_entity_id, source_feature_key) DO UPDATE
SET
  source_category = EXCLUDED.source_category,
  source_entity_id = EXCLUDED.source_entity_id,
  acquisition_mode = EXCLUDED.acquisition_mode,
  counts_against_selection_limit = EXCLUDED.counts_against_selection_limit,
  minimum_character_level = EXCLUDED.minimum_character_level,
  minimum_class_level = EXCLUDED.minimum_class_level,
  owning_class_id = EXCLUDED.owning_class_id,
  granting_subclass_id = EXCLUDED.granting_subclass_id,
  spell_id = EXCLUDED.spell_id,
  metadata = EXCLUDED.metadata;

-- Representative migrated option key: subclass_feature:circle_of_the_land:forest:barkskin
WITH circle_land_grants AS (
  SELECT
    option.id AS source_entity_id,
    option.key AS terrain_key,
    grant.value AS grant_value
  FROM public.feature_options option
  CROSS JOIN LATERAL jsonb_array_elements(option.effects -> 'spell_grants') AS grant(value)
  WHERE option.group_key = 'circle_of_land:terrain:2014'
    AND jsonb_typeof(option.effects -> 'spell_grants') = 'array'
),
resolved_circle_land_grants AS (
  SELECT
    grant_value ->> 'source_feature_key' AS source_feature_key,
    source_entity_id,
    COALESCE((grant_value ->> 'min_class_level')::int, 1) AS minimum_class_level,
    druid.id AS owning_class_id,
    spell.id AS spell_id,
    jsonb_build_object(
      'feature_option_group_key', 'circle_of_land:terrain:2014',
      'feature_option_key', terrain_key,
      'spell_lookup_name', grant_value ->> 'spell_name'
    ) AS metadata
  FROM circle_land_grants
  JOIN public.classes druid
    ON druid.name = 'Druid'
   AND druid.source IN ('PHB', 'SRD')
  JOIN LATERAL (
    SELECT candidate.id
    FROM public.spells candidate
    WHERE candidate.name = grant_value ->> 'spell_name'
      AND candidate.source = ANY(
        CASE
          WHEN jsonb_typeof(grant_value -> 'spell_sources') = 'array'
            THEN ARRAY(SELECT jsonb_array_elements_text(grant_value -> 'spell_sources'))
          ELSE ARRAY['PHB', 'SRD', 'srd']
        END
      )
    ORDER BY array_position(
      CASE
        WHEN jsonb_typeof(grant_value -> 'spell_sources') = 'array'
          THEN ARRAY(SELECT jsonb_array_elements_text(grant_value -> 'spell_sources'))
        ELSE ARRAY['PHB', 'SRD', 'srd']
      END,
      candidate.source
    )
    LIMIT 1
  ) spell ON true
)
INSERT INTO public.feature_spell_grants (
  source_feature_key,
  source_category,
  source_entity_id,
  acquisition_mode,
  counts_against_selection_limit,
  minimum_character_level,
  minimum_class_level,
  owning_class_id,
  granting_subclass_id,
  spell_id,
  metadata
)
SELECT
  source_feature_key,
  'feature_option',
  source_entity_id,
  'granted',
  false,
  1,
  minimum_class_level,
  owning_class_id,
  NULL,
  spell_id,
  metadata
FROM resolved_circle_land_grants
WHERE source_feature_key IS NOT NULL
ON CONFLICT (source_category, source_entity_id, source_feature_key) DO UPDATE
SET
  source_category = EXCLUDED.source_category,
  source_entity_id = EXCLUDED.source_entity_id,
  acquisition_mode = EXCLUDED.acquisition_mode,
  counts_against_selection_limit = EXCLUDED.counts_against_selection_limit,
  minimum_character_level = EXCLUDED.minimum_character_level,
  minimum_class_level = EXCLUDED.minimum_class_level,
  owning_class_id = EXCLUDED.owning_class_id,
  granting_subclass_id = EXCLUDED.granting_subclass_id,
  spell_id = EXCLUDED.spell_id,
  metadata = EXCLUDED.metadata;

UPDATE public.feature_options
SET effects = effects - 'spell_grants'
WHERE group_key = 'circle_of_land:terrain:2014'
  AND effects ? 'spell_grants';
