-- Add Warforged and Changeling (ERftLW) as Batch 2 test/support species.
-- Current species schema still flattens some choice-heavy parts, so these rows
-- store the fixed species data and mark the remaining flexible pieces clearly.

INSERT INTO public.species_traits (name, description, source)
VALUES
  ('Changeling Instincts', 'Gain proficiency in two skills chosen from Deception, Insight, Intimidation, and Persuasion.', 'ERftLW'),
  ('Shapechanger', 'As an action, change your appearance and voice while keeping the same basic body arrangement and size.', 'ERftLW'),
  ('Constructed Resilience', 'Advantage on saves against being poisoned, resistance to poison damage, no need to eat, drink, or breathe, immunity to disease, and no need to sleep.', 'ERftLW'),
  ('Sentry''s Rest', 'During a long rest, spend at least six hours motionless but remain aware of your surroundings.', 'ERftLW'),
  ('Integrated Protection', 'You gain a +1 bonus to Armor Class and integrate armor into your body over one hour.', 'ERftLW'),
  ('Specialized Design', 'You gain one skill proficiency and one tool proficiency of your choice.', 'ERftLW')
ON CONFLICT (name, source) DO UPDATE SET
  description = EXCLUDED.description;

INSERT INTO public.species (
  name,
  size,
  speed,
  ability_score_bonuses,
  languages,
  traits,
  senses,
  damage_resistances,
  condition_immunities,
  source,
  amended,
  amendment_note
)
VALUES
  (
    'Changeling',
    'medium',
    30,
    '[{"ability":"cha","bonus":2}]'::jsonb,
    ARRAY['Common'],
    ARRAY[
      (SELECT id FROM public.species_traits WHERE name = 'Changeling Instincts' AND source = 'ERftLW'),
      (SELECT id FROM public.species_traits WHERE name = 'Shapechanger' AND source = 'ERftLW')
    ],
    '[]'::jsonb,
    ARRAY[]::text[],
    ARRAY[]::text[],
    'ERftLW',
    true,
    'Current schema stores the fixed CHA +2 and Common language only; the extra +1 ability increase and two chosen languages remain choice-driven Batch 2 work.'
  ),
  (
    'Warforged',
    'medium',
    30,
    '[{"ability":"con","bonus":2}]'::jsonb,
    ARRAY['Common'],
    ARRAY[
      (SELECT id FROM public.species_traits WHERE name = 'Constructed Resilience' AND source = 'ERftLW'),
      (SELECT id FROM public.species_traits WHERE name = 'Sentry''s Rest' AND source = 'ERftLW'),
      (SELECT id FROM public.species_traits WHERE name = 'Integrated Protection' AND source = 'ERftLW'),
      (SELECT id FROM public.species_traits WHERE name = 'Specialized Design' AND source = 'ERftLW')
    ],
    '[]'::jsonb,
    ARRAY['poison'],
    ARRAY[]::text[],
    'ERftLW',
    true,
    'Current schema stores the fixed CON +2, Common, and poison resistance only; the extra +1 ability increase, chosen language/tool/skill, and integrated AC bonus remain follow-up modeling work.'
  )
ON CONFLICT (name, source) DO UPDATE SET
  size = EXCLUDED.size,
  speed = EXCLUDED.speed,
  ability_score_bonuses = EXCLUDED.ability_score_bonuses,
  languages = EXCLUDED.languages,
  traits = EXCLUDED.traits,
  senses = EXCLUDED.senses,
  damage_resistances = EXCLUDED.damage_resistances,
  condition_immunities = EXCLUDED.condition_immunities,
  amended = EXCLUDED.amended,
  amendment_note = EXCLUDED.amendment_note;
