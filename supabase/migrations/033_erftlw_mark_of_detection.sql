-- Add an explicit ERftLW Mark of Detection species row alongside the existing
-- EE interpretation so campaigns can allow either source model independently.

INSERT INTO public.species_traits (name, description, source)
VALUES
  ('Deductive Intuition', 'Whenever you make an Investigation or Insight check, you can roll a d4 and add it to the total.', 'ERftLW'),
  ('Magical Detection', 'You can cast detect magic and detect poison and disease with this trait, gain see invisibility at 3rd level, and add the Mark of Detection spells to your spellcasting class list.', 'ERftLW'),
  ('Fey Ancestry', 'You have advantage on saving throws against being charmed, and magic can''t put you to sleep.', 'ERftLW')
ON CONFLICT (name, source) DO UPDATE SET
  description = EXCLUDED.description;

INSERT INTO public.spells (
  name, level, school, casting_time, range, components, duration, concentration, ritual, description, classes, source
)
VALUES
  ('Divination', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, true, 'Species spell-list expansion support entry for Mark of Detection from ERftLW.', ARRAY[]::uuid[], 'ERftLW')
ON CONFLICT (name, source) DO UPDATE SET
  level = EXCLUDED.level,
  concentration = EXCLUDED.concentration,
  ritual = EXCLUDED.ritual,
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
VALUES (
  'Half-Elf (Mark of Detection)',
  'medium',
  30,
  '[{"ability":"wis","bonus":2}]'::jsonb,
  ARRAY['Common', 'Elvish'],
  ARRAY[
    (SELECT id FROM public.species_traits WHERE name = 'Darkvision' AND source = 'ERftLW'),
    (SELECT id FROM public.species_traits WHERE name = 'Fey Ancestry' AND source = 'ERftLW'),
    (SELECT id FROM public.species_traits WHERE name = 'Deductive Intuition' AND source = 'ERftLW'),
    (SELECT id FROM public.species_traits WHERE name = 'Magical Detection' AND source = 'ERftLW')
  ],
  '[{"type":"darkvision","range_ft":60}]'::jsonb,
  ARRAY[]::text[],
  ARRAY[]::text[],
  'ERftLW',
  true,
  'Flattened standalone dragonmarked species row. Includes the ERftLW Wisdom +2 base and relies on typed species-choice support for the additional +1, but still omits the inherited extra language choice.'
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

INSERT INTO public.species_bonus_spells (species_id, spell_id)
VALUES
  ((SELECT id FROM public.species WHERE name = 'Half-Elf (Mark of Detection)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Detect Magic' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Half-Elf (Mark of Detection)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Detect Poison and Disease' AND source = 'EE')),
  ((SELECT id FROM public.species WHERE name = 'Half-Elf (Mark of Detection)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Detect Thoughts' AND source = 'EE')),
  ((SELECT id FROM public.species WHERE name = 'Half-Elf (Mark of Detection)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Find Traps' AND source = 'EE')),
  ((SELECT id FROM public.species WHERE name = 'Half-Elf (Mark of Detection)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'See Invisibility' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Half-Elf (Mark of Detection)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Clairvoyance' AND source = 'EE')),
  ((SELECT id FROM public.species WHERE name = 'Half-Elf (Mark of Detection)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Nondetection' AND source = 'EE')),
  ((SELECT id FROM public.species WHERE name = 'Half-Elf (Mark of Detection)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Divination' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Half-Elf (Mark of Detection)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Legend Lore' AND source = 'EE'))
ON CONFLICT (species_id, spell_id) DO NOTHING;
