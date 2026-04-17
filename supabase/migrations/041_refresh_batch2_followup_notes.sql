-- Refresh remaining Batch 2 amendment notes that still describe already-landed
-- choice UI/persistence work as pending. These rows are still flattened where
-- noted, but the specific Batch 2 support is now present.

UPDATE public.species
SET amendment_note = CASE
  WHEN source = 'ERftLW' AND name = 'Changeling' THEN
    'Current schema stores the fixed CHA +2 and Common language, and uses typed species-choice support for the extra +1 ability increase and two chosen languages.'
  WHEN source = 'ERftLW' AND name = 'Warforged' THEN
    'Current schema stores the fixed CON +2, Common, and poison resistance, and uses typed species-choice support for the extra +1 ability increase, chosen language, chosen tool, chosen skill, and integrated AC bonus.'
  ELSE amendment_note
END
WHERE (source, name) IN (
  ('ERftLW', 'Changeling'),
  ('ERftLW', 'Warforged')
);

UPDATE public.feats
SET amendment_note = 'Structured feat spell-choice metadata and shared feat spell-choice UI support this feat''s cantrip and 1st-level spell picks.'
WHERE source = 'ERftLW'
  AND name = 'Aberrant Dragonmark';
