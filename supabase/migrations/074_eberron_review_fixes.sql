-- Eberron review fixes: keep House Agent's mixed tool-or-language choice
-- descriptive instead of deriving a fake fixed tool proficiency.

UPDATE public.backgrounds
SET
  tool_proficiencies = ARRAY[]::text[],
  amended = true,
  amendment_note = 'The ERftLW tool-or-language choice is documented descriptively until mixed tool/language background choices are automated; no placeholder proficiency is granted.'
WHERE name = 'House Agent'
  AND source = 'ERftLW'
  AND tool_proficiencies = ARRAY['One tool or language of your choice'];
