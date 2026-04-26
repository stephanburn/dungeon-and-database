-- Batch Eberron, Slice E3:
-- make the existing dragonmarked species rows coherent after the PHB lineage
-- model and Batch 2 choice/provenance work. This migration intentionally
-- purges pre-canonical dragonmarked rows and any characters that still refer
-- to them so the app does not carry legacy content/code paths forward.

-- Canonical `Species (Mark of X)` rows are selectable variants of their PHB
-- base lineage. The rows remain flattened for now, but lineage metadata lets
-- admin/search surfaces group them coherently with their parent species.
UPDATE public.species
SET
  parent_species_id = CASE
    WHEN name LIKE 'Half-Elf (%' THEN (SELECT id FROM public.species WHERE name = 'Half-Elf' AND source = 'PHB')
    WHEN name LIKE 'Half-Orc (%' THEN (SELECT id FROM public.species WHERE name = 'Half-Orc' AND source = 'PHB')
    WHEN name LIKE 'Human (%' THEN (SELECT id FROM public.species WHERE name = 'Human' AND source = 'PHB')
    WHEN name LIKE 'Halfling (%' THEN (SELECT id FROM public.species WHERE name = 'Halfling' AND source = 'PHB')
    WHEN name LIKE 'Dwarf (%' THEN (SELECT id FROM public.species WHERE name = 'Dwarf' AND source = 'PHB')
    WHEN name LIKE 'Gnome (%' THEN (SELECT id FROM public.species WHERE name = 'Gnome' AND source = 'PHB')
    WHEN name LIKE 'Elf (%' THEN (SELECT id FROM public.species WHERE name = 'Elf' AND source = 'PHB')
    ELSE parent_species_id
  END,
  lineage_key = CASE
    WHEN name LIKE 'Half-Elf (%' THEN 'half_elf'
    WHEN name LIKE 'Half-Orc (%' THEN 'half_orc'
    WHEN name LIKE 'Human (%' THEN 'human'
    WHEN name LIKE 'Halfling (%' THEN 'halfling'
    WHEN name LIKE 'Dwarf (%' THEN 'dwarf'
    WHEN name LIKE 'Gnome (%' THEN 'gnome'
    WHEN name LIKE 'Elf (%' THEN 'elf'
    ELSE lineage_key
  END,
  variant_type = 'variant',
  variant_order = CASE
    WHEN source = 'ERftLW' AND name = 'Dwarf (Mark of Warding)' THEN 50
    WHEN source = 'ERftLW' AND name = 'Elf (Mark of Shadow)' THEN 50
    WHEN source = 'ERftLW' AND name = 'Gnome (Mark of Scribing)' THEN 50
    WHEN source = 'ERftLW' AND name = 'Half-Elf (Mark of Detection)' THEN 50
    WHEN source = 'EE' AND name = 'Half-Elf (Mark of Detection)' THEN 51
    WHEN source = 'ERftLW' AND name = 'Half-Elf (Mark of Storm)' THEN 52
    WHEN source = 'ERftLW' AND name = 'Half-Orc (Mark of Finding)' THEN 50
    WHEN source = 'ERftLW' AND name = 'Halfling (Mark of Healing)' THEN 50
    WHEN source = 'ERftLW' AND name = 'Halfling (Mark of Hospitality)' THEN 51
    WHEN source = 'ERftLW' AND name = 'Human (Mark of Finding)' THEN 50
    WHEN source = 'ERftLW' AND name = 'Human (Mark of Handling)' THEN 51
    WHEN source = 'ERftLW' AND name = 'Human (Mark of Making)' THEN 52
    WHEN source = 'ERftLW' AND name = 'Human (Mark of Passage)' THEN 53
    WHEN source = 'ERftLW' AND name = 'Human (Mark of Sentinel)' THEN 54
    ELSE variant_order
  END,
  amendment_note = CASE
    WHEN source = 'EE' AND name = 'Half-Elf (Mark of Detection)' THEN
      'Exploring Eberron alternate interpretation retained alongside the ERftLW Mark of Detection row for campaign source allowlisting. Lineage metadata links it to Half-Elf. Choice persistence and static trait-granted spells already supported by the app are not listed as missing; remaining caveats are denormalized base-species inheritance and source-specific mark interpretation.'
    WHEN source = 'ERftLW' AND name = 'Half-Elf (Mark of Detection)' THEN
      'Canonical ERftLW dragonmarked half-elf variant. Lineage metadata links it to Half-Elf. Choice persistence and static trait-granted spells already supported by the app are not listed as missing; remaining caveat is denormalized base-species inheritance.'
    WHEN source = 'ERftLW' AND name = 'Half-Elf (Mark of Storm)' THEN
      'Canonical ERftLW dragonmarked half-elf variant. Lineage metadata links it to Half-Elf. Choice persistence and static trait-granted spells already supported by the app are not listed as missing; remaining caveat is denormalized base-species inheritance.'
    WHEN source = 'ERftLW' AND name = 'Half-Orc (Mark of Finding)' THEN
      'Canonical ERftLW dragonmarked half-orc variant. Lineage metadata links it to Half-Orc. Choice persistence and static trait-granted spells already supported by the app are not listed as missing; remaining caveat is denormalized base-species inheritance.'
    WHEN source = 'ERftLW' AND name = 'Human (Mark of Finding)' THEN
      'Canonical ERftLW dragonmarked human variant. Lineage metadata links it to Human. Choice persistence and static trait-granted spells already supported by the app are not listed as missing; remaining caveat is denormalized base-species inheritance.'
    WHEN source = 'ERftLW' AND name = 'Human (Mark of Handling)' THEN
      'Canonical ERftLW dragonmarked human variant. Lineage metadata links it to Human. Choice persistence and static trait-granted spells already supported by the app are not listed as missing; remaining caveat is denormalized base-species inheritance.'
    WHEN source = 'ERftLW' AND name = 'Human (Mark of Making)' THEN
      'Canonical ERftLW dragonmarked human variant. Lineage metadata links it to Human. Choice persistence and static trait-granted spells already supported by the app are not listed as missing; remaining caveat is denormalized base-species inheritance.'
    WHEN source = 'ERftLW' AND name = 'Human (Mark of Passage)' THEN
      'Canonical ERftLW dragonmarked human variant. Lineage metadata links it to Human. Choice persistence and static trait-granted spells already supported by the app are not listed as missing; remaining caveat is denormalized base-species inheritance.'
    WHEN source = 'ERftLW' AND name = 'Human (Mark of Sentinel)' THEN
      'Canonical ERftLW dragonmarked human variant. Lineage metadata links it to Human. Choice persistence and static trait-granted spells already supported by the app are not listed as missing; Vigilant Guardian remains a descriptive combat-time reaction.'
    WHEN source = 'ERftLW' AND name = 'Halfling (Mark of Healing)' THEN
      'Canonical ERftLW dragonmarked halfling variant. Lineage metadata links it to Halfling. Choice persistence and static trait-granted spells already supported by the app are not listed as missing; remaining caveat is denormalized base-species inheritance.'
    WHEN source = 'ERftLW' AND name = 'Halfling (Mark of Hospitality)' THEN
      'Canonical ERftLW dragonmarked halfling variant. Lineage metadata links it to Halfling. Choice persistence and static trait-granted spells already supported by the app are not listed as missing; remaining caveat is denormalized base-species inheritance.'
    WHEN source = 'ERftLW' AND name = 'Dwarf (Mark of Warding)' THEN
      'Canonical ERftLW dragonmarked dwarf variant. Lineage metadata links it to Dwarf. Choice persistence and static trait-granted spells already supported by the app are not listed as missing; remaining caveat is denormalized base-species inheritance.'
    WHEN source = 'ERftLW' AND name = 'Gnome (Mark of Scribing)' THEN
      'Canonical ERftLW dragonmarked gnome variant. Lineage metadata links it to Gnome. Choice persistence and static trait-granted spells already supported by the app are not listed as missing; remaining caveat is denormalized base-species inheritance.'
    WHEN source = 'ERftLW' AND name = 'Elf (Mark of Shadow)' THEN
      'Canonical ERftLW dragonmarked elf variant. Lineage metadata links it to Elf. Choice persistence and static trait-granted spells already supported by the app are not listed as missing; remaining caveat is denormalized base-species inheritance.'
    ELSE amendment_note
  END
WHERE (source, name) IN (
  ('EE', 'Half-Elf (Mark of Detection)'),
  ('ERftLW', 'Half-Elf (Mark of Detection)'),
  ('ERftLW', 'Half-Elf (Mark of Storm)'),
  ('ERftLW', 'Half-Orc (Mark of Finding)'),
  ('ERftLW', 'Human (Mark of Finding)'),
  ('ERftLW', 'Human (Mark of Handling)'),
  ('ERftLW', 'Human (Mark of Making)'),
  ('ERftLW', 'Human (Mark of Passage)'),
  ('ERftLW', 'Human (Mark of Sentinel)'),
  ('ERftLW', 'Halfling (Mark of Healing)'),
  ('ERftLW', 'Halfling (Mark of Hospitality)'),
  ('ERftLW', 'Dwarf (Mark of Warding)'),
  ('ERftLW', 'Gnome (Mark of Scribing)'),
  ('ERftLW', 'Elf (Mark of Shadow)')
);

-- Purge older `Mark of X Species` rows and the characters that still refer to
-- them. Character child rows cascade from public.characters; species_bonus_spells
-- rows cascade from public.species.
WITH legacy_dragonmarked_species AS (
  SELECT id
  FROM public.species
  WHERE source = 'ERftLW'
    AND name IN (
      'Mark of Detection Half-Elf',
      'Mark of Finding Human',
      'Mark of Finding Half-Orc',
      'Mark of Handling Human',
      'Mark of Making Human',
      'Mark of Passage Human',
      'Mark of Sentinel Human',
      'Mark of Healing Halfling',
      'Mark of Hospitality Halfling',
      'Mark of Warding Dwarf',
      'Mark of Scribing Gnome',
      'Mark of Storm Half-Elf',
      'Mark of Shadow Elf'
    )
)
DELETE FROM public.characters c
USING legacy_dragonmarked_species l
WHERE c.species_id = l.id
  OR EXISTS (
    SELECT 1
    FROM public.character_language_choices clc
    WHERE clc.character_id = c.id
      AND clc.source_category = 'species_choice'
      AND clc.source_entity_id = l.id
  )
  OR EXISTS (
    SELECT 1
    FROM public.character_tool_choices ctc
    WHERE ctc.character_id = c.id
      AND ctc.source_category = 'species_choice'
      AND ctc.source_entity_id = l.id
  )
  OR EXISTS (
    SELECT 1
    FROM public.character_ability_bonus_choices csac
    WHERE csac.character_id = c.id
      AND csac.source_category = 'species_choice'
      AND csac.source_entity_id = l.id
  )
  OR EXISTS (
    SELECT 1
    FROM public.character_skill_proficiencies csp
    WHERE csp.character_id = c.id
      AND csp.source_category = 'species_choice'
      AND csp.source_entity_id = l.id
  );

WITH legacy_dragonmarked_species AS (
  SELECT id
  FROM public.species
  WHERE source = 'ERftLW'
    AND name IN (
      'Mark of Detection Half-Elf',
      'Mark of Finding Human',
      'Mark of Finding Half-Orc',
      'Mark of Handling Human',
      'Mark of Making Human',
      'Mark of Passage Human',
      'Mark of Sentinel Human',
      'Mark of Healing Halfling',
      'Mark of Hospitality Halfling',
      'Mark of Warding Dwarf',
      'Mark of Scribing Gnome',
      'Mark of Storm Half-Elf',
      'Mark of Shadow Elf'
    )
)
DELETE FROM public.species s
USING legacy_dragonmarked_species l
WHERE s.id = l.id;

-- Guard that dragonmark spell-list expansion remains intact. The selectable
-- canonical rows should still have species_bonus_spells entries after cleanup.
DO $$
DECLARE
  missing_species text[];
BEGIN
  SELECT array_agg(s.source || ':' || s.name ORDER BY s.source, s.name)
  INTO missing_species
  FROM public.species s
  WHERE (s.source, s.name) IN (
    ('EE', 'Half-Elf (Mark of Detection)'),
    ('ERftLW', 'Half-Elf (Mark of Detection)'),
    ('ERftLW', 'Half-Elf (Mark of Storm)'),
    ('ERftLW', 'Half-Orc (Mark of Finding)'),
    ('ERftLW', 'Human (Mark of Finding)'),
    ('ERftLW', 'Human (Mark of Handling)'),
    ('ERftLW', 'Human (Mark of Making)'),
    ('ERftLW', 'Human (Mark of Passage)'),
    ('ERftLW', 'Human (Mark of Sentinel)'),
    ('ERftLW', 'Halfling (Mark of Healing)'),
    ('ERftLW', 'Halfling (Mark of Hospitality)'),
    ('ERftLW', 'Dwarf (Mark of Warding)'),
    ('ERftLW', 'Gnome (Mark of Scribing)'),
    ('ERftLW', 'Elf (Mark of Shadow)')
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.species_bonus_spells sbs
    WHERE sbs.species_id = s.id
  );

  IF missing_species IS NOT NULL THEN
    RAISE EXCEPTION 'Dragonmark spell-list expansion missing for: %', array_to_string(missing_species, ', ');
  END IF;
END $$;
