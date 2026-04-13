-- Add the remaining ERftLW dragonmarked species rows that fit the current
-- flattened-species model without requiring new choice UI.

INSERT INTO public.species_traits (name, description, source)
VALUES
  ('Warder''s Intuition', 'Whenever you make an Investigation check or an ability check involving Thieves'' Tools, you can roll a d4 and add it to the total.', 'ERftLW'),
  ('Wards and Seals', 'You can cast alarm and mage armor with this trait and gain arcane lock at 3rd level.', 'ERftLW'),
  ('Ever Hospitable', 'Whenever you make a Persuasion check or an ability check involving Brewer''s Supplies or Cook''s Utensils, you can roll a d4 and add it to the total.', 'ERftLW'),
  ('Innkeeper''s Magic', 'You know prestidigitation and can cast purify food and drink and unseen servant with this trait.', 'ERftLW'),
  ('Medical Intuition', 'Whenever you make a Medicine check or an ability check involving an Herbalism Kit, you can roll a d4 and add it to the total.', 'ERftLW'),
  ('Healing Touch', 'You can cast cure wounds with this trait and gain lesser restoration at 3rd level.', 'ERftLW'),
  ('Cunning Intuition', 'Whenever you make a Stealth or Performance check, you can roll a d4 and add it to the total.', 'ERftLW'),
  ('Shape Shadows', 'You know minor illusion and can cast invisibility with this trait at 3rd level.', 'ERftLW'),
  ('Gifted Scribe', 'Whenever you make a History check or an ability check involving Calligrapher''s Supplies, you can roll a d4 and add it to the total.', 'ERftLW'),
  ('Scribe''s Insight', 'You know message and can cast comprehend languages and magic mouth with this trait.', 'ERftLW'),
  ('Finder''s Magic', 'You can cast hunter''s mark with this trait and gain locate object at 3rd level.', 'ERftLW')
ON CONFLICT (name, source) DO UPDATE SET
  description = EXCLUDED.description;

INSERT INTO public.spells (
  name, level, school, casting_time, range, components, duration, concentration, ritual, description, classes, source
)
VALUES
  ('Armor of Agathys', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Arcane Lock', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Knock', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Magic Circle', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Leomund''s Secret Chest', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Mordenkainen''s Faithful Hound', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Antilife Shell', 5, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Goodberry', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Sleep', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Leomund''s Tiny Hut', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, true, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Mordenkainen''s Private Sanctum', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Hallow', 5, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Lesser Restoration', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Prayer of Healing', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Aura of Purity', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Silent Image', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Darkness', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Major Image', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Greater Invisibility', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Hallucinatory Terrain', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Mislead', 5, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Comprehend Languages', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, true, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Illusory Script', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, true, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Animal Messenger', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, true, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Silence', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Sending', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Tongues', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Dream', 5, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Hunter''s Mark', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell-list support entry from ERftLW.', ARRAY[]::uuid[], 'ERftLW')
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
  'Dwarf (Mark of Warding)',
  'medium',
  25,
  '[{"ability":"con","bonus":2},{"ability":"int","bonus":1}]'::jsonb,
  ARRAY['Common', 'Dwarvish'],
  ARRAY[
    (SELECT id FROM public.species_traits WHERE name = 'Darkvision' AND source = 'ERftLW'),
    (SELECT id FROM public.species_traits WHERE name = 'Warder''s Intuition' AND source = 'ERftLW'),
    (SELECT id FROM public.species_traits WHERE name = 'Wards and Seals' AND source = 'ERftLW')
  ],
  '[{"type":"darkvision","range_ft":60}]'::jsonb,
  ARRAY['poison']::text[],
  ARRAY[]::text[],
  'ERftLW',
  true,
  'Flattened standalone dragonmarked species row. Includes common base dwarf traits needed by the current sheet, but other inherited dwarf features remain denormalized and trait-granted casting remains unmodeled.'
),
(
  'Halfling (Mark of Hospitality)',
  'small',
  25,
  '[{"ability":"dex","bonus":2},{"ability":"cha","bonus":1}]'::jsonb,
  ARRAY['Common', 'Halfling'],
  ARRAY[
    (SELECT id FROM public.species_traits WHERE name = 'Ever Hospitable' AND source = 'ERftLW'),
    (SELECT id FROM public.species_traits WHERE name = 'Innkeeper''s Magic' AND source = 'ERftLW')
  ],
  '[]'::jsonb,
  ARRAY[]::text[],
  ARRAY[]::text[],
  'ERftLW',
  true,
  'Flattened standalone dragonmarked species row. Core halfling traits remain denormalized and trait-granted casting remains unmodeled.'
),
(
  'Halfling (Mark of Healing)',
  'small',
  25,
  '[{"ability":"dex","bonus":2},{"ability":"wis","bonus":1}]'::jsonb,
  ARRAY['Common', 'Halfling'],
  ARRAY[
    (SELECT id FROM public.species_traits WHERE name = 'Medical Intuition' AND source = 'ERftLW'),
    (SELECT id FROM public.species_traits WHERE name = 'Healing Touch' AND source = 'ERftLW')
  ],
  '[]'::jsonb,
  ARRAY[]::text[],
  ARRAY[]::text[],
  'ERftLW',
  true,
  'Flattened standalone dragonmarked species row. Core halfling traits remain denormalized and trait-granted casting remains unmodeled.'
),
(
  'Elf (Mark of Shadow)',
  'medium',
  30,
  '[{"ability":"dex","bonus":2},{"ability":"cha","bonus":1}]'::jsonb,
  ARRAY['Common', 'Elvish'],
  ARRAY[
    (SELECT id FROM public.species_traits WHERE name = 'Darkvision' AND source = 'ERftLW'),
    (SELECT id FROM public.species_traits WHERE name = 'Fey Ancestry' AND source = 'ERftLW'),
    (SELECT id FROM public.species_traits WHERE name = 'Cunning Intuition' AND source = 'ERftLW'),
    (SELECT id FROM public.species_traits WHERE name = 'Shape Shadows' AND source = 'ERftLW')
  ],
  '[{"type":"darkvision","range_ft":60}]'::jsonb,
  ARRAY[]::text[],
  ARRAY[]::text[],
  'ERftLW',
  true,
  'Flattened standalone dragonmarked species row. Inherited elf features remain denormalized and trait-granted casting remains unmodeled.'
),
(
  'Gnome (Mark of Scribing)',
  'small',
  25,
  '[{"ability":"int","bonus":2},{"ability":"cha","bonus":1}]'::jsonb,
  ARRAY['Common', 'Gnomish'],
  ARRAY[
    (SELECT id FROM public.species_traits WHERE name = 'Darkvision' AND source = 'ERftLW'),
    (SELECT id FROM public.species_traits WHERE name = 'Gifted Scribe' AND source = 'ERftLW'),
    (SELECT id FROM public.species_traits WHERE name = 'Scribe''s Insight' AND source = 'ERftLW')
  ],
  '[{"type":"darkvision","range_ft":60}]'::jsonb,
  ARRAY[]::text[],
  ARRAY[]::text[],
  'ERftLW',
  true,
  'Flattened standalone dragonmarked species row. Inherited gnome traits remain denormalized and trait-granted casting remains unmodeled.'
),
(
  'Human (Mark of Finding)',
  'medium',
  30,
  '[{"ability":"wis","bonus":2},{"ability":"con","bonus":1}]'::jsonb,
  ARRAY['Common', 'Goblin'],
  ARRAY[
    (SELECT id FROM public.species_traits WHERE name = 'Darkvision' AND source = 'ERftLW'),
    (SELECT id FROM public.species_traits WHERE name = 'Hunter''s Intuition' AND source = 'ERftLW'),
    (SELECT id FROM public.species_traits WHERE name = 'Finder''s Magic' AND source = 'ERftLW')
  ],
  '[{"type":"darkvision","range_ft":60}]'::jsonb,
  ARRAY[]::text[],
  ARRAY[]::text[],
  'ERftLW',
  true,
  'Flattened standalone dragonmarked species row. Human inheritance is intentionally flattened, and trait-granted hunter''s mark/locate object casting remains unmodeled.'
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
  ((SELECT id FROM public.species WHERE name = 'Dwarf (Mark of Warding)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Alarm' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Dwarf (Mark of Warding)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Armor of Agathys' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Dwarf (Mark of Warding)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Arcane Lock' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Dwarf (Mark of Warding)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Knock' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Dwarf (Mark of Warding)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Glyph of Warding' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Dwarf (Mark of Warding)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Magic Circle' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Dwarf (Mark of Warding)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Leomund''s Secret Chest' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Dwarf (Mark of Warding)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Mordenkainen''s Faithful Hound' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Dwarf (Mark of Warding)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Antilife Shell' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Halfling (Mark of Hospitality)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Goodberry' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Halfling (Mark of Hospitality)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Sleep' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Halfling (Mark of Hospitality)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Aid' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Halfling (Mark of Hospitality)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Calm Emotions' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Halfling (Mark of Hospitality)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Create Food and Water' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Halfling (Mark of Hospitality)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Leomund''s Tiny Hut' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Halfling (Mark of Hospitality)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Aura of Purity' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Halfling (Mark of Hospitality)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Mordenkainen''s Private Sanctum' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Halfling (Mark of Hospitality)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Hallow' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Halfling (Mark of Healing)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Cure Wounds' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Halfling (Mark of Healing)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Healing Word' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Halfling (Mark of Healing)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Lesser Restoration' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Halfling (Mark of Healing)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Prayer of Healing' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Halfling (Mark of Healing)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Aura of Vitality' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Halfling (Mark of Healing)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Mass Healing Word' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Halfling (Mark of Healing)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Aura of Purity' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Halfling (Mark of Healing)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Aura of Life' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Halfling (Mark of Healing)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Greater Restoration' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Elf (Mark of Shadow)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Disguise Self' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Elf (Mark of Shadow)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Silent Image' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Elf (Mark of Shadow)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Darkness' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Elf (Mark of Shadow)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Pass Without Trace' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Elf (Mark of Shadow)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Clairvoyance' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Elf (Mark of Shadow)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Major Image' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Elf (Mark of Shadow)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Greater Invisibility' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Elf (Mark of Shadow)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Hallucinatory Terrain' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Elf (Mark of Shadow)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Mislead' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Gnome (Mark of Scribing)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Comprehend Languages' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Gnome (Mark of Scribing)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Illusory Script' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Gnome (Mark of Scribing)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Animal Messenger' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Gnome (Mark of Scribing)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Silence' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Gnome (Mark of Scribing)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Sending' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Gnome (Mark of Scribing)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Tongues' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Gnome (Mark of Scribing)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Arcane Eye' AND source = 'EE')),
  ((SELECT id FROM public.species WHERE name = 'Gnome (Mark of Scribing)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Divination' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Gnome (Mark of Scribing)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Dream' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Human (Mark of Finding)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Faerie Fire' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Human (Mark of Finding)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Longstrider' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Human (Mark of Finding)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Locate Animals or Plants' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Human (Mark of Finding)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Locate Object' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Human (Mark of Finding)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Clairvoyance' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Human (Mark of Finding)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Speak With Plants' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Human (Mark of Finding)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Divination' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Human (Mark of Finding)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Locate Creature' AND source = 'ERftLW')),
  ((SELECT id FROM public.species WHERE name = 'Human (Mark of Finding)' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Commune With Nature' AND source = 'ERftLW'))
ON CONFLICT (species_id, spell_id) DO NOTHING;
