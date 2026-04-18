ALTER TABLE public.species_bonus_spells
  ADD COLUMN IF NOT EXISTS minimum_character_level int NOT NULL DEFAULT 1;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'species_bonus_spells_minimum_character_level_check'
  ) THEN
    ALTER TABLE public.species_bonus_spells
      ADD CONSTRAINT species_bonus_spells_minimum_character_level_check
      CHECK (minimum_character_level BETWEEN 1 AND 20);
  END IF;
END $$;

WITH species_spells(species_name, spell_name, minimum_character_level) AS (
  VALUES
    ('Dark Elf (Drow)', 'Dancing Lights', 1),
    ('Dark Elf (Drow)', 'Faerie Fire', 3),
    ('Dark Elf (Drow)', 'Darkness', 5),
    ('Tiefling', 'Thaumaturgy', 1),
    ('Tiefling', 'Hellish Rebuke', 3),
    ('Tiefling', 'Darkness', 5)
)
INSERT INTO public.species_bonus_spells (species_id, spell_id, minimum_character_level)
SELECT species.id, spell_lookup.id, species_spells.minimum_character_level
FROM species_spells
JOIN public.species species
  ON species.name = species_spells.species_name
 AND species.source = 'PHB'
JOIN LATERAL (
  SELECT id
  FROM public.spells
  WHERE lower(name) = lower(species_spells.spell_name)
    AND source IN ('PHB', 'SRD', 'ERftLW')
  ORDER BY CASE source WHEN 'PHB' THEN 0 WHEN 'SRD' THEN 1 WHEN 'ERftLW' THEN 2 ELSE 3 END, source, id
  LIMIT 1
) AS spell_lookup ON true
ON CONFLICT (species_id, spell_id) DO UPDATE SET
  minimum_character_level = EXCLUDED.minimum_character_level;
