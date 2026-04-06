-- Fix background skill_proficiencies that were not populated by the seed script.
-- The seed script checked prof.type === 'Skills' but the 5e API has no type field.
-- Only Acolyte is in the SRD; its skills are Insight and Religion.
UPDATE public.backgrounds
SET skill_proficiencies = ARRAY['Insight', 'Religion']
WHERE name = 'Acolyte' AND source = 'SRD';
