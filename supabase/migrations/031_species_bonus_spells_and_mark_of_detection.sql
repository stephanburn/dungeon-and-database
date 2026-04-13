-- Add species-based spell-list expansion support and one representative
-- dragonmarked species row using the current flattened-species approach.

CREATE TABLE IF NOT EXISTS public.species_bonus_spells (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  species_id uuid NOT NULL REFERENCES public.species (id) ON DELETE CASCADE,
  spell_id uuid NOT NULL REFERENCES public.spells (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (species_id, spell_id)
);

ALTER TABLE public.species_bonus_spells ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "species_bonus_spells_select_authenticated" ON public.species_bonus_spells;
CREATE POLICY "species_bonus_spells_select_authenticated" ON public.species_bonus_spells
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "species_bonus_spells_insert_dm" ON public.species_bonus_spells;
CREATE POLICY "species_bonus_spells_insert_dm" ON public.species_bonus_spells
  FOR INSERT WITH CHECK (public.is_dm());

DROP POLICY IF EXISTS "species_bonus_spells_update_dm" ON public.species_bonus_spells;
CREATE POLICY "species_bonus_spells_update_dm" ON public.species_bonus_spells
  FOR UPDATE USING (public.is_dm());

DROP POLICY IF EXISTS "species_bonus_spells_delete_dm" ON public.species_bonus_spells;
CREATE POLICY "species_bonus_spells_delete_dm" ON public.species_bonus_spells
  FOR DELETE USING (public.is_dm());

INSERT INTO public.species_traits (name, description, source)
VALUES
  ('Deductive Intuition', 'Choose one skill proficiency from Investigation or Insight.', 'EE'),
  ('Magical Detection', 'You can cast detect magic and can apply your dragonmark magic to your class spell list.', 'EE')
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
VALUES (
  'Half-Elf (Mark of Detection)',
  'medium',
  30,
  '[{"ability":"cha","bonus":2},{"ability":"wis","bonus":1}]'::jsonb,
  ARRAY['Common', 'Elvish'],
  ARRAY[
    (SELECT id FROM public.species_traits WHERE name = 'Darkvision' AND source = 'ERftLW'),
    (SELECT id FROM public.species_traits WHERE name = 'Deductive Intuition' AND source = 'EE'),
    (SELECT id FROM public.species_traits WHERE name = 'Magical Detection' AND source = 'EE')
  ],
  '[{"type":"darkvision","range_ft":60}]'::jsonb,
  ARRAY[]::text[],
  ARRAY[]::text[],
  'EE',
  true,
  'Flattened standalone dragonmarked species row. Base half-elf inheritance and some mark details remain denormalized pending broader species-model follow-up work.'
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

INSERT INTO public.spells (
  name, level, school, casting_time, range, components, duration, concentration, ritual, description, classes, source
)
VALUES
  ('Detect Poison and Disease', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Species spell-list expansion support entry from Exploring Eberron.', ARRAY[]::uuid[], 'EE'),
  ('Detect Thoughts', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Species spell-list expansion support entry from Exploring Eberron.', ARRAY[]::uuid[], 'EE'),
  ('Find Traps', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Species spell-list expansion support entry from Exploring Eberron.', ARRAY[]::uuid[], 'EE'),
  ('Clairvoyance', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Species spell-list expansion support entry from Exploring Eberron.', ARRAY[]::uuid[], 'EE'),
  ('Nondetection', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Species spell-list expansion support entry from Exploring Eberron.', ARRAY[]::uuid[], 'EE'),
  ('Arcane Eye', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Species spell-list expansion support entry from Exploring Eberron.', ARRAY[]::uuid[], 'EE'),
  ('Legend Lore', 5, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Species spell-list expansion support entry from Exploring Eberron.', ARRAY[]::uuid[], 'EE')
ON CONFLICT (name, source) DO UPDATE SET
  level = EXCLUDED.level,
  concentration = EXCLUDED.concentration,
  ritual = EXCLUDED.ritual,
  description = EXCLUDED.description;

INSERT INTO public.species_bonus_spells (species_id, spell_id)
VALUES
  ((SELECT id FROM public.species WHERE name = 'Half-Elf (Mark of Detection)' AND source = 'EE'), (SELECT id FROM public.spells WHERE name = 'Detect Magic' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Half-Elf (Mark of Detection)' AND source = 'EE'), (SELECT id FROM public.spells WHERE name = 'Detect Poison and Disease' AND source = 'EE')),
  ((SELECT id FROM public.species WHERE name = 'Half-Elf (Mark of Detection)' AND source = 'EE'), (SELECT id FROM public.spells WHERE name = 'Detect Thoughts' AND source = 'EE')),
  ((SELECT id FROM public.species WHERE name = 'Half-Elf (Mark of Detection)' AND source = 'EE'), (SELECT id FROM public.spells WHERE name = 'Find Traps' AND source = 'EE')),
  ((SELECT id FROM public.species WHERE name = 'Half-Elf (Mark of Detection)' AND source = 'EE'), (SELECT id FROM public.spells WHERE name = 'See Invisibility' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Half-Elf (Mark of Detection)' AND source = 'EE'), (SELECT id FROM public.spells WHERE name = 'Clairvoyance' AND source = 'EE')),
  ((SELECT id FROM public.species WHERE name = 'Half-Elf (Mark of Detection)' AND source = 'EE'), (SELECT id FROM public.spells WHERE name = 'Nondetection' AND source = 'EE')),
  ((SELECT id FROM public.species WHERE name = 'Half-Elf (Mark of Detection)' AND source = 'EE'), (SELECT id FROM public.spells WHERE name = 'Arcane Eye' AND source = 'EE')),
  ((SELECT id FROM public.species WHERE name = 'Half-Elf (Mark of Detection)' AND source = 'EE'), (SELECT id FROM public.spells WHERE name = 'Legend Lore' AND source = 'EE'))
ON CONFLICT (species_id, spell_id) DO NOTHING;
