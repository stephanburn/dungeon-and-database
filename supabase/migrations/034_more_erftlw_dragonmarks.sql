-- Add additional ERftLW dragonmarked species rows using the current flattened
-- species approach plus the typed choice helpers already available in the app.

INSERT INTO public.species_traits (name, description, source)
VALUES
  ('Windwright''s Intuition', 'Whenever you make an Acrobatics check or an ability check involving Navigator''s Tools, you can roll a d4 and add it to the total.', 'ERftLW'),
  ('Storm''s Boon', 'You have resistance to lightning damage.', 'ERftLW'),
  ('Hunter''s Intuition', 'Whenever you make a Perception or Survival check, you can roll a d4 and add it to the total.', 'ERftLW'),
  ('Wild Intuition', 'Whenever you make an Animal Handling or Nature check, you can roll a d4 and add it to the total.', 'ERftLW'),
  ('Primal Connection', 'You can cast animal friendship and speak with animals with this trait.', 'ERftLW'),
  ('Artisan''s Intuition', 'Whenever you make an Arcana check or an ability check involving Artisan''s Tools, you can roll a d4 and add it to the total.', 'ERftLW'),
  ('Artisan''s Gift', 'You gain proficiency in one type of Artisan''s Tools of your choice.', 'ERftLW'),
  ('Spellsmith', 'You know the mending cantrip and can cast magic weapon with this trait.', 'ERftLW'),
  ('Courier''s Speed', 'Your base walking speed is 35 feet.', 'ERftLW'),
  ('Intuitive Motion', 'Whenever you make an Acrobatics check or an ability check involving Land Vehicles, you can roll a d4 and add it to the total.', 'ERftLW'),
  ('Magical Passage', 'You can cast misty step with this trait.', 'ERftLW'),
  ('Sentinel''s Intuition', 'Whenever you make an Insight or Perception check, you can roll a d4 and add it to the total.', 'ERftLW'),
  ('Guardian''s Shield', 'You can cast shield with this trait.', 'ERftLW'),
  ('Vigilant Guardian', 'You can swap places with a nearby ally who is hit by an attack, taking the hit yourself.', 'ERftLW')
ON CONFLICT (name, source) DO UPDATE SET
  description = EXCLUDED.description;

INSERT INTO public.spells (
  name, level, school, casting_time, range, components, duration, concentration, ritual, description, classes, source
)
VALUES
  ('Feather Fall', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Faerie Fire', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Fog Cloud', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Gust of Wind', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Longstrider', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Locate Object', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Clairvoyance', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Levitate', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Sleet Storm', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Speak With Plants', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Conjure Minor Elementals', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Control Water', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Conjure Elemental', 5, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Locate Animals or Plants', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Locate Creature', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Commune With Nature', 5, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, true, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Animal Friendship', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Speak With Animals', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, true, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Beast Sense', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Calm Emotions', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Beacon of Hope', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Conjure Animals', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Aura of Life', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Dominate Beast', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Awaken', 5, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Identify', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, true, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Tenser''s Floating Disk', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, true, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Magic Weapon', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Conjure Barrage', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Pass Without Trace', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Expeditious Retreat', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Jump', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Misty Step', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Phantom Steed', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, true, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Dimension Door', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Teleportation Circle', 5, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Compelled Duel', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Shield of Faith', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Warding Bond', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Zone of Truth', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Counterspell', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Protection From Energy', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Death Ward', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Guardian of Faith', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Bigby''s Hand', 5, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW')
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
VALUES
(
  'Half-Elf (Mark of Storm)',
  'medium',
  30,
  '[{"ability":"cha","bonus":2},{"ability":"dex","bonus":1}]'::jsonb,
  ARRAY['Common', 'Elvish'],
  ARRAY[
    (SELECT id FROM public.species_traits WHERE name = 'Darkvision' AND source = 'ERftLW'),
    (SELECT id FROM public.species_traits WHERE name = 'Fey Ancestry' AND source = 'ERftLW'),
    (SELECT id FROM public.species_traits WHERE name = 'Windwright''s Intuition' AND source = 'ERftLW'),
    (SELECT id FROM public.species_traits WHERE name = 'Storm''s Boon' AND source = 'ERftLW')
  ],
  '[{"type":"darkvision","range_ft":60}]'::jsonb,
  ARRAY['lightning']::text[],
  ARRAY[]::text[],
  'ERftLW',
  true,
  'Flattened standalone dragonmarked species row. Retains the inherited half-elf extra language through typed species language choices, but trait-granted gust and gust of wind casting remain unmodeled.'
),
(
  'Half-Orc (Mark of Finding)',
  'medium',
  30,
  '[{"ability":"wis","bonus":2},{"ability":"con","bonus":1}]'::jsonb,
  ARRAY['Common', 'Goblin'],
  ARRAY[
    (SELECT id FROM public.species_traits WHERE name = 'Darkvision' AND source = 'ERftLW'),
    (SELECT id FROM public.species_traits WHERE name = 'Hunter''s Intuition' AND source = 'ERftLW')
  ],
  '[{"type":"darkvision","range_ft":60}]'::jsonb,
  ARRAY[]::text[],
  ARRAY[]::text[],
  'ERftLW',
  true,
  'Flattened standalone dragonmarked species row. Trait-granted hunter''s mark and locate object casting remain unmodeled.'
),
(
  'Human (Mark of Handling)',
  'medium',
  30,
  '[{"ability":"wis","bonus":2}]'::jsonb,
  ARRAY['Common'],
  ARRAY[
    (SELECT id FROM public.species_traits WHERE name = 'Wild Intuition' AND source = 'ERftLW'),
    (SELECT id FROM public.species_traits WHERE name = 'Primal Connection' AND source = 'ERftLW')
  ],
  '[]'::jsonb,
  ARRAY[]::text[],
  ARRAY[]::text[],
  'ERftLW',
  true,
  'Flattened standalone dragonmarked species row. Uses typed species choice support for the inherited human extra language and the flexible +1 ability score, but trait-granted spell casting remains unmodeled.'
),
(
  'Human (Mark of Making)',
  'medium',
  30,
  '[{"ability":"int","bonus":2}]'::jsonb,
  ARRAY['Common'],
  ARRAY[
    (SELECT id FROM public.species_traits WHERE name = 'Artisan''s Intuition' AND source = 'ERftLW'),
    (SELECT id FROM public.species_traits WHERE name = 'Artisan''s Gift' AND source = 'ERftLW'),
    (SELECT id FROM public.species_traits WHERE name = 'Spellsmith' AND source = 'ERftLW')
  ],
  '[]'::jsonb,
  ARRAY[]::text[],
  ARRAY[]::text[],
  'ERftLW',
  true,
  'Flattened standalone dragonmarked species row. Uses typed species choice support for the inherited human extra language, the flexible +1 ability score, and the artisan''s tools choice, but trait-granted mending and magic weapon remain unmodeled.'
),
(
  'Human (Mark of Passage)',
  'medium',
  35,
  '[{"ability":"dex","bonus":2}]'::jsonb,
  ARRAY['Common'],
  ARRAY[
    (SELECT id FROM public.species_traits WHERE name = 'Courier''s Speed' AND source = 'ERftLW'),
    (SELECT id FROM public.species_traits WHERE name = 'Intuitive Motion' AND source = 'ERftLW'),
    (SELECT id FROM public.species_traits WHERE name = 'Magical Passage' AND source = 'ERftLW')
  ],
  '[]'::jsonb,
  ARRAY[]::text[],
  ARRAY[]::text[],
  'ERftLW',
  true,
  'Flattened standalone dragonmarked species row. Uses typed species choice support for the inherited human extra language and the flexible +1 ability score, but trait-granted misty step casting remains unmodeled.'
),
(
  'Human (Mark of Sentinel)',
  'medium',
  30,
  '[{"ability":"con","bonus":2},{"ability":"wis","bonus":1}]'::jsonb,
  ARRAY['Common'],
  ARRAY[
    (SELECT id FROM public.species_traits WHERE name = 'Sentinel''s Intuition' AND source = 'ERftLW'),
    (SELECT id FROM public.species_traits WHERE name = 'Guardian''s Shield' AND source = 'ERftLW'),
    (SELECT id FROM public.species_traits WHERE name = 'Vigilant Guardian' AND source = 'ERftLW')
  ],
  '[]'::jsonb,
  ARRAY[]::text[],
  ARRAY[]::text[],
  'ERftLW',
  true,
  'Flattened standalone dragonmarked species row. Uses typed species choice support for the inherited human extra language, but guardian shield casting and vigilant guardian remain unmodeled.'
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
  ((SELECT id FROM public.species WHERE name = 'Half-Elf (Mark of Storm)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Feather Fall' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Half-Elf (Mark of Storm)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Fog Cloud' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Half-Elf (Mark of Storm)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Gust of Wind' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Half-Elf (Mark of Storm)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Levitate' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Half-Elf (Mark of Storm)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Sleet Storm' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Half-Elf (Mark of Storm)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Wind Wall' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Half-Elf (Mark of Storm)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Conjure Minor Elementals' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Half-Elf (Mark of Storm)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Control Water' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Half-Elf (Mark of Storm)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Conjure Elemental' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Half-Orc (Mark of Finding)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Faerie Fire' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Half-Orc (Mark of Finding)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Longstrider' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Half-Orc (Mark of Finding)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Locate Animals or Plants' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Half-Orc (Mark of Finding)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Locate Object' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Half-Orc (Mark of Finding)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Clairvoyance' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Half-Orc (Mark of Finding)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Speak With Plants' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Half-Orc (Mark of Finding)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Divination' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Half-Orc (Mark of Finding)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Locate Creature' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Half-Orc (Mark of Finding)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Commune With Nature' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Human (Mark of Handling)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Animal Friendship' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Human (Mark of Handling)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Speak With Animals' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Human (Mark of Handling)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Beast Sense' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Human (Mark of Handling)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Calm Emotions' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Human (Mark of Handling)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Beacon of Hope' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Human (Mark of Handling)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Conjure Animals' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Human (Mark of Handling)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Aura of Life' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Human (Mark of Handling)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Dominate Beast' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Human (Mark of Handling)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Awaken' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Human (Mark of Making)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Identify' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Human (Mark of Making)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Tenser''s Floating Disk' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Human (Mark of Making)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Continual Flame' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Human (Mark of Making)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Magic Weapon' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Human (Mark of Making)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Conjure Barrage' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Human (Mark of Making)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Elemental Weapon' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Human (Mark of Making)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Fabricate' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Human (Mark of Making)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Stone Shape' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Human (Mark of Making)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Creation' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Human (Mark of Passage)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Expeditious Retreat' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Human (Mark of Passage)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Jump' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Human (Mark of Passage)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Misty Step' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Human (Mark of Passage)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Pass Without Trace' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Human (Mark of Passage)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Blink' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Human (Mark of Passage)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Phantom Steed' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Human (Mark of Passage)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Dimension Door' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Human (Mark of Passage)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Freedom of Movement' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Human (Mark of Passage)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Teleportation Circle' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Human (Mark of Sentinel)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Compelled Duel' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Human (Mark of Sentinel)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Shield of Faith' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Human (Mark of Sentinel)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Warding Bond' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Human (Mark of Sentinel)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Zone of Truth' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Human (Mark of Sentinel)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Counterspell' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Human (Mark of Sentinel)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Protection From Energy' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Human (Mark of Sentinel)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Death Ward' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Human (Mark of Sentinel)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Guardian of Faith' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Human (Mark of Sentinel)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Bigby''s Hand' AND source = 'ERftLW'))
ON CONFLICT (species_id, spell_id) DO NOTHING;
