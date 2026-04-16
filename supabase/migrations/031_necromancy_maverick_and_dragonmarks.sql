-- Add Wizard: School of Necromancy (PHB), Artificer: Maverick (EE),
-- species-based dragonmark spell list support, and core dragonmark content.

INSERT INTO public.sources (key, full_name, is_srd, rule_set)
VALUES ('EE', 'Exploring Eberron', false, '2014')
ON CONFLICT (key) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  rule_set = EXCLUDED.rule_set;

CREATE TABLE IF NOT EXISTS public.species_bonus_spells (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  species_id              uuid NOT NULL REFERENCES public.species (id) ON DELETE CASCADE,
  spell_id                uuid NOT NULL REFERENCES public.spells (id) ON DELETE CASCADE,
  minimum_character_level int NOT NULL DEFAULT 1 CHECK (minimum_character_level BETWEEN 1 AND 20),
  UNIQUE (species_id, spell_id)
);

ALTER TABLE public.species_bonus_spells ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "species_bonus_spells_select_auth" ON public.species_bonus_spells;
CREATE POLICY "species_bonus_spells_select_auth" ON public.species_bonus_spells
  FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "species_bonus_spells_insert_admin" ON public.species_bonus_spells;
CREATE POLICY "species_bonus_spells_insert_admin" ON public.species_bonus_spells
  FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "species_bonus_spells_update_admin" ON public.species_bonus_spells;
CREATE POLICY "species_bonus_spells_update_admin" ON public.species_bonus_spells
  FOR UPDATE USING (public.is_admin());

INSERT INTO public.subclasses (name, class_id, choice_level, source)
VALUES
  ('School of Necromancy', (SELECT id FROM public.classes WHERE name = 'Wizard' AND source IN ('PHB', 'SRD') ORDER BY source DESC LIMIT 1), 2, 'PHB'),
  ('Maverick', (SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW'), 3, 'EE')
ON CONFLICT (name, class_id, source) DO UPDATE SET
  choice_level = EXCLUDED.choice_level;

INSERT INTO public.subclass_features (subclass_id, name, level, description, source)
VALUES
  ((SELECT id FROM public.subclasses WHERE name = 'School of Necromancy' AND source = 'PHB'), 'Necromancy Savant', 2, 'Copy necromancy spells into your spellbook for half the usual time and gold.', 'PHB'),
  ((SELECT id FROM public.subclasses WHERE name = 'School of Necromancy' AND source = 'PHB'), 'Grim Harvest', 2, 'Once per turn when you kill a creature with a spell of 1st level or higher, regain hit points based on the spell''s level.', 'PHB'),
  ((SELECT id FROM public.subclasses WHERE name = 'School of Necromancy' AND source = 'PHB'), 'Undead Thralls', 6, 'Animate Dead creates stronger undead and targets one extra corpse or pile of bones.', 'PHB'),
  ((SELECT id FROM public.subclasses WHERE name = 'School of Necromancy' AND source = 'PHB'), 'Inured to Undeath', 10, 'Gain resistance to necrotic damage, and your hit point maximum can''t be reduced.', 'PHB'),
  ((SELECT id FROM public.subclasses WHERE name = 'School of Necromancy' AND source = 'PHB'), 'Command Undead', 14, 'Magically seize control of an undead creature.', 'PHB'),
  ((SELECT id FROM public.subclasses WHERE name = 'Maverick' AND source = 'EE'), 'Arcane Breakthroughs', 3, 'Choose other class spell lists as Breakthrough lists and prepare one extra Breakthrough spell of each unlocked level.', 'EE'),
  ((SELECT id FROM public.subclasses WHERE name = 'Maverick' AND source = 'EE'), 'Cantrip Specialist', 3, 'Know one extra cantrip and swap artificer or Breakthrough cantrips on a short rest.', 'EE'),
  ((SELECT id FROM public.subclasses WHERE name = 'Maverick' AND source = 'EE'), 'Cantrip Savant', 5, 'Gain a scaling bonus to artificer cantrips and swap one as an action once per long rest.', 'EE'),
  ((SELECT id FROM public.subclasses WHERE name = 'Maverick' AND source = 'EE'), 'Superior Breakthroughs', 9, 'Cast Breakthrough spells as if using a slot two levels higher a limited number of times.', 'EE'),
  ((SELECT id FROM public.subclasses WHERE name = 'Maverick' AND source = 'EE'), 'Work in Progress', 9, 'Replace a prepared artificer spell with another artificer spell as an action once per short or long rest.', 'EE'),
  ((SELECT id FROM public.subclasses WHERE name = 'Maverick' AND source = 'EE'), 'Final Breakthrough', 15, 'Gain one extra spell slot of each spell level you can prepare, usable only for Arcane Breakthrough spells.', 'EE')
ON CONFLICT (subclass_id, name, level) DO UPDATE SET
  description = EXCLUDED.description,
  source = EXCLUDED.source;

INSERT INTO public.species_traits (name, description, source)
VALUES
  ('Mark of Detection', 'Dragonmarked intuition and magical detection tied to House Medani.', 'ERftLW'),
  ('Mark of Finding', 'Dragonmarked instinct for tracking and discovery tied to House Tharashk.', 'ERftLW'),
  ('Mark of Handling', 'Dragonmarked bond with beasts and monstrosities tied to House Vadalis.', 'ERftLW'),
  ('Mark of Making', 'Dragonmarked talent for crafting and creation tied to House Cannith.', 'ERftLW'),
  ('Mark of Passage', 'Dragonmarked speed and travel magic tied to House Orien.', 'ERftLW'),
  ('Mark of Sentinel', 'Dragonmarked guardianship and warding tied to House Deneith.', 'ERftLW'),
  ('Mark of Healing', 'Dragonmarked curative magic tied to House Jorasco.', 'ERftLW'),
  ('Mark of Hospitality', 'Dragonmarked comfort and shelter magic tied to House Ghallanda.', 'ERftLW'),
  ('Mark of Warding', 'Dragonmarked protection and sealing magic tied to House Kundarak.', 'ERftLW'),
  ('Mark of Scribing', 'Dragonmarked communication and language magic tied to House Sivis.', 'ERftLW'),
  ('Mark of Storm', 'Dragonmarked wind and storm magic tied to House Lyrandar.', 'ERftLW'),
  ('Mark of Shadow', 'Dragonmarked illusion and concealment magic tied to House Phiarlan and Thuranni.', 'ERftLW')
ON CONFLICT (name, source) DO UPDATE SET
  description = EXCLUDED.description;

INSERT INTO public.species (
  name, size, speed, ability_score_bonuses, languages, traits, senses, damage_resistances, condition_immunities, source, amended, amendment_note
)
VALUES
  ('Mark of Detection Half-Elf', 'medium', 30, '[{"ability":"cha","bonus":2},{"ability":"wis","bonus":1}]'::jsonb, ARRAY['Common','Elvish'], ARRAY[(SELECT id FROM public.species_traits WHERE name = 'Mark of Detection' AND source = 'ERftLW')], '[{"type":"darkvision","range_ft":60}]'::jsonb, ARRAY[]::text[], ARRAY[]::text[], 'ERftLW', true, 'Modeled as a standalone dragonmarked species entry; inherited half-elf extras such as the flexible bonus language remain flattened by the current schema.'),
  ('Mark of Finding Human', 'medium', 30, '[{"ability":"wis","bonus":2},{"ability":"con","bonus":1}]'::jsonb, ARRAY['Common','Goblin'], ARRAY[(SELECT id FROM public.species_traits WHERE name = 'Mark of Finding' AND source = 'ERftLW')], '[{"type":"darkvision","range_ft":60}]'::jsonb, ARRAY[]::text[], ARRAY[]::text[], 'ERftLW', false, null),
  ('Mark of Finding Half-Orc', 'medium', 30, '[{"ability":"wis","bonus":2},{"ability":"con","bonus":1}]'::jsonb, ARRAY['Common','Goblin'], ARRAY[(SELECT id FROM public.species_traits WHERE name = 'Mark of Finding' AND source = 'ERftLW')], '[{"type":"darkvision","range_ft":60}]'::jsonb, ARRAY[]::text[], ARRAY[]::text[], 'ERftLW', true, 'Modeled as a standalone dragonmarked species entry; inherited half-orc traits beyond the mark text are condensed for creator support.'),
  ('Mark of Handling Human', 'medium', 30, '[{"ability":"wis","bonus":2}]'::jsonb, ARRAY['Common'], ARRAY[(SELECT id FROM public.species_traits WHERE name = 'Mark of Handling' AND source = 'ERftLW')], '[]'::jsonb, ARRAY[]::text[], ARRAY[]::text[], 'ERftLW', true, 'Current schema stores the fixed WIS +2 and uses typed species ability choices for the additional +1 ability.'),
  ('Mark of Making Human', 'medium', 30, '[{"ability":"int","bonus":2}]'::jsonb, ARRAY['Common'], ARRAY[(SELECT id FROM public.species_traits WHERE name = 'Mark of Making' AND source = 'ERftLW')], '[]'::jsonb, ARRAY[]::text[], ARRAY[]::text[], 'ERftLW', true, 'Current schema stores the fixed INT +2 and uses typed species ability choices for the additional +1 ability.'),
  ('Mark of Passage Human', 'medium', 30, '[{"ability":"dex","bonus":2}]'::jsonb, ARRAY['Common'], ARRAY[(SELECT id FROM public.species_traits WHERE name = 'Mark of Passage' AND source = 'ERftLW')], '[]'::jsonb, ARRAY[]::text[], ARRAY[]::text[], 'ERftLW', true, 'Current schema stores the fixed DEX +2 and uses typed species ability choices for the additional +1 ability.'),
  ('Mark of Sentinel Human', 'medium', 30, '[{"ability":"con","bonus":2},{"ability":"wis","bonus":1}]'::jsonb, ARRAY['Common'], ARRAY[(SELECT id FROM public.species_traits WHERE name = 'Mark of Sentinel' AND source = 'ERftLW')], '[]'::jsonb, ARRAY[]::text[], ARRAY[]::text[], 'ERftLW', true, 'Modeled as a standalone dragonmarked species entry; inherited human extras remain flattened by the current schema.'),
  ('Mark of Healing Halfling', 'small', 25, '[{"ability":"dex","bonus":2},{"ability":"wis","bonus":1}]'::jsonb, ARRAY['Common','Halfling'], ARRAY[(SELECT id FROM public.species_traits WHERE name = 'Mark of Healing' AND source = 'ERftLW')], '[]'::jsonb, ARRAY[]::text[], ARRAY[]::text[], 'ERftLW', true, 'Modeled as a standalone dragonmarked species entry; inherited halfling features are condensed for creator support.'),
  ('Mark of Hospitality Halfling', 'small', 25, '[{"ability":"dex","bonus":2},{"ability":"cha","bonus":1}]'::jsonb, ARRAY['Common','Halfling'], ARRAY[(SELECT id FROM public.species_traits WHERE name = 'Mark of Hospitality' AND source = 'ERftLW')], '[]'::jsonb, ARRAY[]::text[], ARRAY[]::text[], 'ERftLW', true, 'Modeled as a standalone dragonmarked species entry; inherited halfling features are condensed for creator support.'),
  ('Mark of Warding Dwarf', 'medium', 25, '[{"ability":"con","bonus":2},{"ability":"int","bonus":1}]'::jsonb, ARRAY['Common','Dwarvish'], ARRAY[(SELECT id FROM public.species_traits WHERE name = 'Mark of Warding' AND source = 'ERftLW')], '[{"type":"darkvision","range_ft":60}]'::jsonb, ARRAY[]::text[], ARRAY[]::text[], 'ERftLW', true, 'Modeled as a standalone dragonmarked species entry; inherited dwarf features are condensed for creator support.'),
  ('Mark of Scribing Gnome', 'small', 25, '[{"ability":"int","bonus":2},{"ability":"cha","bonus":1}]'::jsonb, ARRAY['Common','Gnomish'], ARRAY[(SELECT id FROM public.species_traits WHERE name = 'Mark of Scribing' AND source = 'ERftLW')], '[{"type":"darkvision","range_ft":60}]'::jsonb, ARRAY[]::text[], ARRAY[]::text[], 'ERftLW', true, 'Modeled as a standalone dragonmarked species entry; inherited gnome features are condensed for creator support.'),
  ('Mark of Storm Half-Elf', 'medium', 30, '[{"ability":"cha","bonus":2},{"ability":"dex","bonus":1}]'::jsonb, ARRAY['Common','Elvish'], ARRAY[(SELECT id FROM public.species_traits WHERE name = 'Mark of Storm' AND source = 'ERftLW')], '[{"type":"darkvision","range_ft":60}]'::jsonb, ARRAY[]::text[], ARRAY[]::text[], 'ERftLW', true, 'Modeled as a standalone dragonmarked species entry; inherited half-elf extras remain flattened by the current schema.'),
  ('Mark of Shadow Elf', 'medium', 30, '[{"ability":"dex","bonus":2},{"ability":"cha","bonus":1}]'::jsonb, ARRAY['Common','Elvish'], ARRAY[(SELECT id FROM public.species_traits WHERE name = 'Mark of Shadow' AND source = 'ERftLW')], '[{"type":"darkvision","range_ft":60}]'::jsonb, ARRAY[]::text[], ARRAY[]::text[], 'ERftLW', true, 'Modeled as a standalone dragonmarked species entry; inherited elf traits are condensed for creator support.')
ON CONFLICT (name, source) DO UPDATE SET
  size = EXCLUDED.size,
  speed = EXCLUDED.speed,
  ability_score_bonuses = EXCLUDED.ability_score_bonuses,
  languages = EXCLUDED.languages,
  traits = EXCLUDED.traits,
  senses = EXCLUDED.senses,
  amended = EXCLUDED.amended,
  amendment_note = EXCLUDED.amendment_note;

INSERT INTO public.spells (
  name, level, school, casting_time, range, components, duration, concentration, ritual, description, classes, source
)
VALUES
  ('Detect Magic', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, true, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Detect Poison and Disease', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, true, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Detect Thoughts', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Find Traps', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Legend Lore', 5, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Locate Animals or Plants', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Locate Creature', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Commune with Nature', 5, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, true, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Animal Friendship', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Speak with Animals', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, true, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Beast Sense', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Calm Emotions', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Beacon of Hope', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Conjure Animals', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Dominate Beast', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Awaken', 5, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Identify', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, true, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Unseen Servant', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, true, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Continual Flame', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Magic Weapon', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Conjure Barrage', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Elemental Weapon', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Fabricate', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Stone Shape', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Creation', 5, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Expeditious Retreat', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Jump', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Pass without Trace', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Blink', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Phantom Steed', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, true, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Dimension Door', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Freedom of Movement', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Teleportation Circle', 5, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Compelled Duel', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Shield of Faith', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Warding Bond', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Zone of Truth', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Guardian of Faith', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Bigby''s Hand', 5, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Healing Word', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Prayer of Healing', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Aura of Vitality', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Mass Healing Word', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Aura of Purity', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Greater Restoration', 5, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Goodberry', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Sleep', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Aid', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Create Food and Water', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Leomund''s Tiny Hut', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, true, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Mordenkainen''s Private Sanctum', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Hallow', 5, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Alarm', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, true, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Armor of Agathys', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Arcane Lock', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Knock', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Glyph of Warding', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Magic Circle', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Mordenkainen''s Faithful Hound', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Leomund''s Secret Chest', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Antilife Shell', 5, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Comprehend Languages', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, true, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Illusory Script', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, true, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Animal Messenger', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, true, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Silence', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, true, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Sending', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Tongues', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Arcane Eye', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Confusion', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Dream', 5, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Fog Cloud', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Thunderwave', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Gust of Wind', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Levitate', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Sleet Storm', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Wind Wall', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Conjure Minor Elementals', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Control Water', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Conjure Elemental', 5, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Disguise Self', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Silent Image', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Darkness', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Major Image', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Hallucinatory Terrain', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB'),
  ('Mislead', 5, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Dragonmark spell list entry.', ARRAY[]::uuid[], 'PHB')
ON CONFLICT (name, source) DO UPDATE SET
  level = EXCLUDED.level,
  description = EXCLUDED.description;

INSERT INTO public.feats (name, prerequisites, description, benefits, source, amended, amendment_note)
VALUES (
  'Aberrant Dragonmark',
  '[{"type":"feature","feature":"No other dragonmark"}]'::jsonb,
  'Manifest an aberrant dragonmark: increase Constitution by 1, learn a sorcerer cantrip, and learn a 1st-level sorcerer spell castable through the mark once per short or long rest.',
  '{"ability_score_increase":{"con":1},"spell_choice":{"cantrip_list":"sorcerer","leveled_list":"sorcerer","leveled_spell_level":1}}'::jsonb,
  'ERftLW',
  true,
  'Current feat schema stores the spell picks as descriptive benefits; the feat-specific spell choice UI remains a follow-up.'
)
ON CONFLICT (name, source) DO UPDATE SET
  description = EXCLUDED.description,
  benefits = EXCLUDED.benefits,
  amended = EXCLUDED.amended,
  amendment_note = EXCLUDED.amendment_note;

WITH mark_spells(species_name, spell_name, min_level) AS (
  VALUES
    ('Mark of Detection Half-Elf', 'Detect Magic', 1), ('Mark of Detection Half-Elf', 'Detect Poison and Disease', 1), ('Mark of Detection Half-Elf', 'Detect Thoughts', 1), ('Mark of Detection Half-Elf', 'Find Traps', 1), ('Mark of Detection Half-Elf', 'Clairvoyance', 1), ('Mark of Detection Half-Elf', 'Nondetection', 1), ('Mark of Detection Half-Elf', 'Arcane Eye', 1), ('Mark of Detection Half-Elf', 'Divination', 1), ('Mark of Detection Half-Elf', 'Legend Lore', 1),
    ('Mark of Finding Human', 'Faerie Fire', 1), ('Mark of Finding Human', 'Longstrider', 1), ('Mark of Finding Human', 'Locate Animals or Plants', 1), ('Mark of Finding Human', 'Locate Object', 1), ('Mark of Finding Human', 'Clairvoyance', 1), ('Mark of Finding Human', 'Speak With Plants', 1), ('Mark of Finding Human', 'Divination', 1), ('Mark of Finding Human', 'Locate Creature', 1), ('Mark of Finding Human', 'Commune with Nature', 1),
    ('Mark of Finding Half-Orc', 'Faerie Fire', 1), ('Mark of Finding Half-Orc', 'Longstrider', 1), ('Mark of Finding Half-Orc', 'Locate Animals or Plants', 1), ('Mark of Finding Half-Orc', 'Locate Object', 1), ('Mark of Finding Half-Orc', 'Clairvoyance', 1), ('Mark of Finding Half-Orc', 'Speak With Plants', 1), ('Mark of Finding Half-Orc', 'Divination', 1), ('Mark of Finding Half-Orc', 'Locate Creature', 1), ('Mark of Finding Half-Orc', 'Commune with Nature', 1),
    ('Mark of Handling Human', 'Animal Friendship', 1), ('Mark of Handling Human', 'Speak with Animals', 1), ('Mark of Handling Human', 'Beast Sense', 1), ('Mark of Handling Human', 'Calm Emotions', 1), ('Mark of Handling Human', 'Beacon of Hope', 1), ('Mark of Handling Human', 'Conjure Animals', 1), ('Mark of Handling Human', 'Aura of Life', 1), ('Mark of Handling Human', 'Dominate Beast', 1), ('Mark of Handling Human', 'Awaken', 1),
    ('Mark of Making Human', 'Identify', 1), ('Mark of Making Human', 'Unseen Servant', 1), ('Mark of Making Human', 'Continual Flame', 1), ('Mark of Making Human', 'Magic Weapon', 1), ('Mark of Making Human', 'Conjure Barrage', 1), ('Mark of Making Human', 'Elemental Weapon', 1), ('Mark of Making Human', 'Fabricate', 1), ('Mark of Making Human', 'Stone Shape', 1), ('Mark of Making Human', 'Creation', 1),
    ('Mark of Passage Human', 'Expeditious Retreat', 1), ('Mark of Passage Human', 'Jump', 1), ('Mark of Passage Human', 'Misty Step', 1), ('Mark of Passage Human', 'Pass without Trace', 1), ('Mark of Passage Human', 'Blink', 1), ('Mark of Passage Human', 'Phantom Steed', 1), ('Mark of Passage Human', 'Dimension Door', 1), ('Mark of Passage Human', 'Freedom of Movement', 1), ('Mark of Passage Human', 'Teleportation Circle', 1),
    ('Mark of Sentinel Human', 'Compelled Duel', 1), ('Mark of Sentinel Human', 'Shield of Faith', 1), ('Mark of Sentinel Human', 'Warding Bond', 1), ('Mark of Sentinel Human', 'Zone of Truth', 1), ('Mark of Sentinel Human', 'Counterspell', 1), ('Mark of Sentinel Human', 'Protection From Energy', 1), ('Mark of Sentinel Human', 'Death Ward', 1), ('Mark of Sentinel Human', 'Guardian of Faith', 1), ('Mark of Sentinel Human', 'Bigby''s Hand', 1),
    ('Mark of Healing Halfling', 'Cure Wounds', 1), ('Mark of Healing Halfling', 'Healing Word', 1), ('Mark of Healing Halfling', 'Lesser Restoration', 1), ('Mark of Healing Halfling', 'Prayer of Healing', 1), ('Mark of Healing Halfling', 'Aura of Vitality', 1), ('Mark of Healing Halfling', 'Mass Healing Word', 1), ('Mark of Healing Halfling', 'Aura of Purity', 1), ('Mark of Healing Halfling', 'Aura of Life', 1), ('Mark of Healing Halfling', 'Greater Restoration', 1),
    ('Mark of Hospitality Halfling', 'Goodberry', 1), ('Mark of Hospitality Halfling', 'Sleep', 1), ('Mark of Hospitality Halfling', 'Aid', 1), ('Mark of Hospitality Halfling', 'Calm Emotions', 1), ('Mark of Hospitality Halfling', 'Create Food and Water', 1), ('Mark of Hospitality Halfling', 'Leomund''s Tiny Hut', 1), ('Mark of Hospitality Halfling', 'Aura of Purity', 1), ('Mark of Hospitality Halfling', 'Mordenkainen''s Private Sanctum', 1), ('Mark of Hospitality Halfling', 'Hallow', 1),
    ('Mark of Warding Dwarf', 'Alarm', 1), ('Mark of Warding Dwarf', 'Armor of Agathys', 1), ('Mark of Warding Dwarf', 'Arcane Lock', 1), ('Mark of Warding Dwarf', 'Knock', 1), ('Mark of Warding Dwarf', 'Glyph of Warding', 1), ('Mark of Warding Dwarf', 'Magic Circle', 1), ('Mark of Warding Dwarf', 'Mordenkainen''s Faithful Hound', 1), ('Mark of Warding Dwarf', 'Leomund''s Secret Chest', 1), ('Mark of Warding Dwarf', 'Antilife Shell', 1),
    ('Mark of Scribing Gnome', 'Comprehend Languages', 1), ('Mark of Scribing Gnome', 'Illusory Script', 1), ('Mark of Scribing Gnome', 'Animal Messenger', 1), ('Mark of Scribing Gnome', 'Silence', 1), ('Mark of Scribing Gnome', 'Sending', 1), ('Mark of Scribing Gnome', 'Tongues', 1), ('Mark of Scribing Gnome', 'Arcane Eye', 1), ('Mark of Scribing Gnome', 'Confusion', 1), ('Mark of Scribing Gnome', 'Dream', 1),
    ('Mark of Storm Half-Elf', 'Fog Cloud', 1), ('Mark of Storm Half-Elf', 'Thunderwave', 1), ('Mark of Storm Half-Elf', 'Gust of Wind', 1), ('Mark of Storm Half-Elf', 'Levitate', 1), ('Mark of Storm Half-Elf', 'Sleet Storm', 1), ('Mark of Storm Half-Elf', 'Wind Wall', 1), ('Mark of Storm Half-Elf', 'Conjure Minor Elementals', 1), ('Mark of Storm Half-Elf', 'Control Water', 1), ('Mark of Storm Half-Elf', 'Conjure Elemental', 1),
    ('Mark of Shadow Elf', 'Disguise Self', 1), ('Mark of Shadow Elf', 'Silent Image', 1), ('Mark of Shadow Elf', 'Darkness', 1), ('Mark of Shadow Elf', 'Pass without Trace', 1), ('Mark of Shadow Elf', 'Clairvoyance', 1), ('Mark of Shadow Elf', 'Major Image', 1), ('Mark of Shadow Elf', 'Greater Invisibility', 1), ('Mark of Shadow Elf', 'Hallucinatory Terrain', 1), ('Mark of Shadow Elf', 'Mislead', 1)
)
INSERT INTO public.species_bonus_spells (species_id, spell_id, minimum_character_level)
SELECT species.id, spell_lookup.id, mark_spells.min_level
FROM mark_spells
JOIN public.species species ON species.name = mark_spells.species_name AND species.source = 'ERftLW'
JOIN LATERAL (
  SELECT id
  FROM public.spells
  WHERE lower(name) = lower(mark_spells.spell_name)
  ORDER BY CASE source WHEN 'ERftLW' THEN 0 WHEN 'PHB' THEN 1 ELSE 2 END, source, id
  LIMIT 1
) AS spell_lookup ON true
ON CONFLICT (species_id, spell_id) DO UPDATE SET
  minimum_character_level = EXCLUDED.minimum_character_level;
