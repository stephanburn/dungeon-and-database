-- Normalize duplicate lowercase SRD records introduced outside the tracked
-- migration flow. Keep the canonical uppercase `SRD` rows and remap any stray
-- references before deleting the unused lowercase duplicates.

DO $$
DECLARE
  class_pair RECORD;
BEGIN
  FOR class_pair IN
    SELECT
      lower_class.id AS lower_class_id,
      upper_class.id AS upper_class_id
    FROM public.classes AS lower_class
    JOIN public.classes AS upper_class
      ON upper_class.name = lower_class.name
     AND upper_class.source = 'SRD'
    WHERE lower_class.source = 'srd'
  LOOP
    UPDATE public.character_levels
    SET class_id = class_pair.upper_class_id
    WHERE class_id = class_pair.lower_class_id;

    UPDATE public.class_feature_progression
    SET class_id = class_pair.upper_class_id
    WHERE class_id = class_pair.lower_class_id;

    UPDATE public.spell_slot_tables
    SET class_id = class_pair.upper_class_id
    WHERE class_id = class_pair.lower_class_id;

    UPDATE public.subclasses
    SET class_id = class_pair.upper_class_id
    WHERE class_id = class_pair.lower_class_id;

    UPDATE public.spells
    SET classes = (
      SELECT array_agg(mapped_id ORDER BY first_seen)
      FROM (
        SELECT
          CASE
            WHEN entry.class_id = class_pair.lower_class_id THEN class_pair.upper_class_id
            ELSE entry.class_id
          END AS mapped_id,
          MIN(entry.ordinality) AS first_seen
        FROM unnest(public.spells.classes) WITH ORDINALITY AS entry(class_id, ordinality)
        GROUP BY 1
      ) AS deduped
    )
    WHERE class_pair.lower_class_id = ANY(classes);
  END LOOP;
END $$;

DELETE FROM public.campaign_source_allowlist AS lower_allowlist
USING public.campaign_source_allowlist AS upper_allowlist
WHERE lower_allowlist.source_key = 'srd'
  AND upper_allowlist.source_key = 'SRD'
  AND upper_allowlist.campaign_id = lower_allowlist.campaign_id;

UPDATE public.campaign_source_allowlist
SET source_key = 'SRD'
WHERE source_key = 'srd';

DELETE FROM public.classes AS lower_class
USING public.classes AS upper_class
WHERE lower_class.source = 'srd'
  AND upper_class.source = 'SRD'
  AND upper_class.name = lower_class.name;

DELETE FROM public.sources
WHERE key = 'srd'
  AND NOT EXISTS (SELECT 1 FROM public.species_traits WHERE source = 'srd')
  AND NOT EXISTS (SELECT 1 FROM public.species WHERE source = 'srd')
  AND NOT EXISTS (SELECT 1 FROM public.class_features WHERE source = 'srd')
  AND NOT EXISTS (SELECT 1 FROM public.classes WHERE source = 'srd')
  AND NOT EXISTS (SELECT 1 FROM public.subclasses WHERE source = 'srd')
  AND NOT EXISTS (SELECT 1 FROM public.subclass_features WHERE source = 'srd')
  AND NOT EXISTS (SELECT 1 FROM public.spells WHERE source = 'srd')
  AND NOT EXISTS (SELECT 1 FROM public.feats WHERE source = 'srd')
  AND NOT EXISTS (SELECT 1 FROM public.backgrounds WHERE source = 'srd')
  AND NOT EXISTS (SELECT 1 FROM public.campaign_source_allowlist WHERE source_key = 'srd');
