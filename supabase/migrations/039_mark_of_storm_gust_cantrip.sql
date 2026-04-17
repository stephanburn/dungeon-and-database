-- Add the EE gust cantrip so Mark of Storm trait-casting can be modeled
-- through the shared feature-grants path when the spell data is available.

INSERT INTO public.spells (
  name,
  level,
  school,
  casting_time,
  range,
  components,
  duration,
  concentration,
  ritual,
  description,
  classes,
  source
)
VALUES (
  'Gust',
  0,
  'Varies',
  'Varies',
  'Varies',
  '{}'::jsonb,
  'Varies',
  false,
  false,
  'Dragonmark trait-grant support entry from Elemental Evil.',
  ARRAY[]::uuid[],
  'EE'
)
ON CONFLICT (name, source) DO UPDATE SET
  level = EXCLUDED.level,
  concentration = EXCLUDED.concentration,
  ritual = EXCLUDED.ritual,
  description = EXCLUDED.description;
