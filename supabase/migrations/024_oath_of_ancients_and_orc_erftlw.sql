-- Add Oath of the Ancients (PHB) and Orc (ERftLW) test content.
-- This migration keeps descriptions brief and structured enough for current tooling.

INSERT INTO public.species_traits (name, description, source)
VALUES
  ('Darkvision', 'See in dim light within 60 feet as if it were bright light, and in darkness as if it were dim light.', 'ERftLW'),
  ('Aggressive', 'As a bonus action, move up to your speed toward an enemy you can see or hear, ending closer than where you started.', 'ERftLW'),
  ('Powerful Build', 'Count as one size larger when determining carrying capacity and the weight you can push, drag, or lift.', 'ERftLW'),
  ('Primal Intuition', 'Gain proficiency in two skills chosen from Animal Handling, Insight, Intimidation, Medicine, Nature, Perception, and Survival.', 'ERftLW')
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
  source
)
VALUES (
  'Orc',
  'medium',
  30,
  '[{"ability":"str","bonus":2},{"ability":"con","bonus":1}]'::jsonb,
  ARRAY['Common', 'Orc'],
  ARRAY[
    (SELECT id FROM public.species_traits WHERE name = 'Darkvision' AND source = 'ERftLW'),
    (SELECT id FROM public.species_traits WHERE name = 'Aggressive' AND source = 'ERftLW'),
    (SELECT id FROM public.species_traits WHERE name = 'Powerful Build' AND source = 'ERftLW'),
    (SELECT id FROM public.species_traits WHERE name = 'Primal Intuition' AND source = 'ERftLW')
  ],
  '[{"type":"darkvision","range_ft":60}]'::jsonb,
  ARRAY[]::text[],
  ARRAY[]::text[],
  'ERftLW'
)
ON CONFLICT (name, source) DO UPDATE SET
  size = EXCLUDED.size,
  speed = EXCLUDED.speed,
  ability_score_bonuses = EXCLUDED.ability_score_bonuses,
  languages = EXCLUDED.languages,
  traits = EXCLUDED.traits,
  senses = EXCLUDED.senses,
  damage_resistances = EXCLUDED.damage_resistances,
  condition_immunities = EXCLUDED.condition_immunities;

INSERT INTO public.subclasses (name, class_id, choice_level, source)
VALUES (
  'Oath of the Ancients',
  (SELECT id FROM public.classes WHERE name = 'Paladin' AND source IN ('srd', 'SRD') ORDER BY source DESC LIMIT 1),
  3,
  'PHB'
)
ON CONFLICT (name, class_id, source) DO UPDATE SET
  choice_level = EXCLUDED.choice_level;

INSERT INTO public.subclass_features (subclass_id, name, level, description, source)
VALUES
  ((SELECT id FROM public.subclasses WHERE name = 'Oath of the Ancients' AND source = 'PHB'), 'Oath Spells', 3, 'You always have the oath spells prepared when you reach the listed paladin levels.', 'PHB'),
  ((SELECT id FROM public.subclasses WHERE name = 'Oath of the Ancients' AND source = 'PHB'), 'Channel Divinity: Nature''s Wrath', 3, 'Invoke primal vines to restrain a nearby foe.', 'PHB'),
  ((SELECT id FROM public.subclasses WHERE name = 'Oath of the Ancients' AND source = 'PHB'), 'Channel Divinity: Turn the Faithless', 3, 'Turn fey and fiends within range.', 'PHB'),
  ((SELECT id FROM public.subclasses WHERE name = 'Oath of the Ancients' AND source = 'PHB'), 'Aura of Warding', 7, 'You and nearby allies gain resistance to damage from spells.', 'PHB'),
  ((SELECT id FROM public.subclasses WHERE name = 'Oath of the Ancients' AND source = 'PHB'), 'Undying Sentinel', 15, 'You can avoid dropping to 0 hit points once per long rest and age more slowly.', 'PHB'),
  ((SELECT id FROM public.subclasses WHERE name = 'Oath of the Ancients' AND source = 'PHB'), 'Elder Champion', 20, 'Assume an ancient power form that enhances healing and spellcasting pressure on enemies.', 'PHB')
ON CONFLICT (subclass_id, name, level) DO UPDATE SET
  description = EXCLUDED.description,
  source = EXCLUDED.source;

INSERT INTO public.spells (
  name, level, school, casting_time, range, components, duration, concentration, ritual, description, classes, source
)
VALUES
  ('Ensnaring Strike', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Subclass spell entry for Oath of the Ancients support from PHB.', ARRAY[]::uuid[], 'PHB'),
  ('Speak with Animals', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, true, 'Subclass spell entry for Oath of the Ancients support from PHB.', ARRAY[]::uuid[], 'PHB'),
  ('Moonbeam', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Subclass spell entry for Oath of the Ancients support from PHB.', ARRAY[]::uuid[], 'PHB'),
  ('Misty Step', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Subclass spell entry for Oath of the Ancients support from PHB.', ARRAY[]::uuid[], 'PHB'),
  ('Plant Growth', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Subclass spell entry for Oath of the Ancients support from PHB.', ARRAY[]::uuid[], 'PHB'),
  ('Protection from Energy', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Subclass spell entry for Oath of the Ancients support from PHB.', ARRAY[]::uuid[], 'PHB'),
  ('Ice Storm', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Subclass spell entry for Oath of the Ancients support from PHB.', ARRAY[]::uuid[], 'PHB'),
  ('Stoneskin', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Subclass spell entry for Oath of the Ancients support from PHB.', ARRAY[]::uuid[], 'PHB'),
  ('Commune with Nature', 5, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, true, 'Subclass spell entry for Oath of the Ancients support from PHB.', ARRAY[]::uuid[], 'PHB'),
  ('Tree Stride', 5, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Subclass spell entry for Oath of the Ancients support from PHB.', ARRAY[]::uuid[], 'PHB')
ON CONFLICT (name, source) DO UPDATE SET
  level = EXCLUDED.level,
  concentration = EXCLUDED.concentration,
  ritual = EXCLUDED.ritual,
  description = EXCLUDED.description;

INSERT INTO public.subclass_bonus_spells (
  subclass_id,
  spell_id,
  required_class_level,
  counts_against_selection_limit
)
VALUES
  ((SELECT id FROM public.subclasses WHERE name = 'Oath of the Ancients' AND source = 'PHB'), (SELECT id FROM public.spells WHERE name = 'Ensnaring Strike' AND source = 'PHB'), 3, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Oath of the Ancients' AND source = 'PHB'), (SELECT id FROM public.spells WHERE name = 'Speak with Animals' AND source = 'PHB'), 3, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Oath of the Ancients' AND source = 'PHB'), (SELECT id FROM public.spells WHERE name = 'Moonbeam' AND source = 'PHB'), 5, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Oath of the Ancients' AND source = 'PHB'), (SELECT id FROM public.spells WHERE name = 'Misty Step' AND source = 'PHB'), 5, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Oath of the Ancients' AND source = 'PHB'), (SELECT id FROM public.spells WHERE name = 'Plant Growth' AND source = 'PHB'), 9, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Oath of the Ancients' AND source = 'PHB'), (SELECT id FROM public.spells WHERE name = 'Protection from Energy' AND source = 'PHB'), 9, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Oath of the Ancients' AND source = 'PHB'), (SELECT id FROM public.spells WHERE name = 'Ice Storm' AND source = 'PHB'), 13, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Oath of the Ancients' AND source = 'PHB'), (SELECT id FROM public.spells WHERE name = 'Stoneskin' AND source = 'PHB'), 13, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Oath of the Ancients' AND source = 'PHB'), (SELECT id FROM public.spells WHERE name = 'Commune with Nature' AND source = 'PHB'), 17, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Oath of the Ancients' AND source = 'PHB'), (SELECT id FROM public.spells WHERE name = 'Tree Stride' AND source = 'PHB'), 17, false)
ON CONFLICT (subclass_id, spell_id, required_class_level) DO UPDATE SET
  counts_against_selection_limit = EXCLUDED.counts_against_selection_limit;
