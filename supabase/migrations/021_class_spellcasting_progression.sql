-- Add class-level spell progression metadata so the app can distinguish
-- prepared casters, known casters, and spellbook-style preparation.

ALTER TABLE public.classes
ADD COLUMN IF NOT EXISTS spellcasting_progression jsonb NOT NULL DEFAULT '{
  "mode": "none"
}'::jsonb;

COMMENT ON COLUMN public.classes.spellcasting_progression IS
'Class-specific spell progression metadata: mode, casting ability, cantrips known, spells known, and prepared formula.';

UPDATE public.classes
SET spellcasting_progression = CASE name
  WHEN 'Wizard' THEN '{
    "mode": "spellbook",
    "spellcasting_ability": "int",
    "cantrips_known_by_level": [3,3,3,4,4,4,4,4,4,5,5,5,5,5,5,5,5,5,5,5],
    "prepared_formula": "class_level",
    "prepared_add_ability_mod": true,
    "prepared_min": 1
  }'::jsonb
  WHEN 'Cleric' THEN '{
    "mode": "prepared",
    "spellcasting_ability": "wis",
    "cantrips_known_by_level": [3,3,3,4,4,4,4,4,4,5,5,5,5,5,5,5,5,5,5,5],
    "prepared_formula": "class_level",
    "prepared_add_ability_mod": true,
    "prepared_min": 1
  }'::jsonb
  WHEN 'Druid' THEN '{
    "mode": "prepared",
    "spellcasting_ability": "wis",
    "cantrips_known_by_level": [2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4],
    "prepared_formula": "class_level",
    "prepared_add_ability_mod": true,
    "prepared_min": 1
  }'::jsonb
  WHEN 'Paladin' THEN '{
    "mode": "prepared",
    "spellcasting_ability": "cha",
    "prepared_formula": "half_level_down",
    "prepared_add_ability_mod": true,
    "prepared_min": 1
  }'::jsonb
  WHEN 'Ranger' THEN '{
    "mode": "known",
    "spellcasting_ability": "wis",
    "spells_known_by_level": [0,0,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11]
  }'::jsonb
  WHEN 'Bard' THEN '{
    "mode": "known",
    "spellcasting_ability": "cha",
    "cantrips_known_by_level": [2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4],
    "spells_known_by_level": [4,5,6,7,8,9,10,11,12,14,15,15,16,18,19,19,20,22,22,22]
  }'::jsonb
  WHEN 'Sorcerer' THEN '{
    "mode": "known",
    "spellcasting_ability": "cha",
    "cantrips_known_by_level": [4,4,4,5,5,5,5,5,5,6,6,6,6,6,6,6,6,6,6,6],
    "spells_known_by_level": [2,3,4,5,6,7,8,9,10,11,12,12,13,13,14,14,15,15,15,15]
  }'::jsonb
  WHEN 'Warlock' THEN '{
    "mode": "known",
    "spellcasting_ability": "cha",
    "cantrips_known_by_level": [2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4],
    "spells_known_by_level": [2,3,4,5,6,7,8,9,10,10,11,11,12,12,13,13,14,14,15,15]
  }'::jsonb
  ELSE spellcasting_progression
END
WHERE source = 'SRD'
  AND name IN ('Wizard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 'Bard', 'Sorcerer', 'Warlock');
