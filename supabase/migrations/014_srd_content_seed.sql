-- SRD content seed — fills in missing proficiency data and adds missing SRD entries.
-- Uses ON CONFLICT DO UPDATE so re-running is safe.
-- Sources: 'srd' key must already exist in the sources table (added in migration 010).

-- ── Ensure SRD source exists ───────────────────────────────
INSERT INTO public.sources (key, full_name, is_srd)
VALUES ('srd', 'System Reference Document 5.1', true)
ON CONFLICT (key) DO NOTHING;

-- ── Backgrounds ────────────────────────────────────────────
-- Update Acolyte with feature text (the name/source already exist from earlier seed)
UPDATE public.backgrounds
SET
  skill_proficiencies = ARRAY['Insight', 'Religion'],
  skill_choice_count  = 0,
  skill_choice_from   = '{}',
  tool_proficiencies  = '{}',
  languages           = ARRAY['Any two languages'],
  feature             = 'Shelter of the Faithful: As an acolyte, you command the respect of those who share your faith, and you can perform the religious ceremonies of your deity. You and your companions can expect to receive free healing and care at a temple, shrine, or other established presence of your faith, though you must provide any material components needed for spells. Those who share your religion will support you (but only you) at a modest lifestyle.'
WHERE name = 'Acolyte' AND source = 'srd';

-- ── Classes ────────────────────────────────────────────────
-- Update existing SRD classes with proficiency data (matched by name + source).
-- If a class does not yet exist it is inserted; if it does, proficiencies are filled in.

-- Barbarian
INSERT INTO public.classes (name, hit_die, primary_ability, saving_throw_proficiencies,
  armor_proficiencies, weapon_proficiencies, tool_proficiencies,
  skill_choices, multiclass_prereqs, multiclass_proficiencies,
  spellcasting_type, subclass_choice_level, source)
VALUES (
  'Barbarian', 12, ARRAY['STR'],
  ARRAY['str', 'con'],
  ARRAY['Light', 'Medium', 'Shields'],
  ARRAY['Simple', 'Martial'],
  '[]'::jsonb,
  '{"count":2,"from":["Animal Handling","Athletics","Intimidation","Nature","Perception","Survival"]}'::jsonb,
  '[{"ability":"str","min":13}]'::jsonb,
  '{}'::jsonb,
  NULL, 3, 'srd'
)
ON CONFLICT (name, source) DO UPDATE SET
  hit_die = EXCLUDED.hit_die,
  primary_ability = EXCLUDED.primary_ability,
  saving_throw_proficiencies = EXCLUDED.saving_throw_proficiencies,
  armor_proficiencies = EXCLUDED.armor_proficiencies,
  weapon_proficiencies = EXCLUDED.weapon_proficiencies,
  skill_choices = EXCLUDED.skill_choices,
  multiclass_prereqs = EXCLUDED.multiclass_prereqs,
  subclass_choice_level = EXCLUDED.subclass_choice_level;

-- Bard
INSERT INTO public.classes (name, hit_die, primary_ability, saving_throw_proficiencies,
  armor_proficiencies, weapon_proficiencies, tool_proficiencies,
  skill_choices, multiclass_prereqs, multiclass_proficiencies,
  spellcasting_type, subclass_choice_level, source)
VALUES (
  'Bard', 8, ARRAY['CHA'],
  ARRAY['dex', 'cha'],
  ARRAY['Light'],
  ARRAY['Simple', 'Hand crossbows', 'Longswords', 'Rapiers', 'Shortswords'],
  '["Any three musical instruments"]'::jsonb,
  '{"count":3,"from":["Acrobatics","Animal Handling","Arcana","Athletics","Deception","History","Insight","Intimidation","Investigation","Medicine","Nature","Perception","Performance","Persuasion","Religion","Sleight of Hand","Stealth","Survival"]}'::jsonb,
  '[{"ability":"cha","min":13}]'::jsonb,
  '{}'::jsonb,
  'full', 3, 'srd'
)
ON CONFLICT (name, source) DO UPDATE SET
  hit_die = EXCLUDED.hit_die,
  primary_ability = EXCLUDED.primary_ability,
  saving_throw_proficiencies = EXCLUDED.saving_throw_proficiencies,
  armor_proficiencies = EXCLUDED.armor_proficiencies,
  weapon_proficiencies = EXCLUDED.weapon_proficiencies,
  tool_proficiencies = EXCLUDED.tool_proficiencies,
  skill_choices = EXCLUDED.skill_choices,
  multiclass_prereqs = EXCLUDED.multiclass_prereqs,
  spellcasting_type = EXCLUDED.spellcasting_type,
  subclass_choice_level = EXCLUDED.subclass_choice_level;

-- Cleric
INSERT INTO public.classes (name, hit_die, primary_ability, saving_throw_proficiencies,
  armor_proficiencies, weapon_proficiencies, tool_proficiencies,
  skill_choices, multiclass_prereqs, multiclass_proficiencies,
  spellcasting_type, subclass_choice_level, source)
VALUES (
  'Cleric', 8, ARRAY['WIS'],
  ARRAY['wis', 'cha'],
  ARRAY['Light', 'Medium', 'Shields'],
  ARRAY['Simple'],
  '[]'::jsonb,
  '{"count":2,"from":["History","Insight","Medicine","Persuasion","Religion"]}'::jsonb,
  '[{"ability":"wis","min":13}]'::jsonb,
  '{}'::jsonb,
  'full', 1, 'srd'
)
ON CONFLICT (name, source) DO UPDATE SET
  hit_die = EXCLUDED.hit_die,
  primary_ability = EXCLUDED.primary_ability,
  saving_throw_proficiencies = EXCLUDED.saving_throw_proficiencies,
  armor_proficiencies = EXCLUDED.armor_proficiencies,
  weapon_proficiencies = EXCLUDED.weapon_proficiencies,
  skill_choices = EXCLUDED.skill_choices,
  multiclass_prereqs = EXCLUDED.multiclass_prereqs,
  spellcasting_type = EXCLUDED.spellcasting_type,
  subclass_choice_level = EXCLUDED.subclass_choice_level;

-- Druid
INSERT INTO public.classes (name, hit_die, primary_ability, saving_throw_proficiencies,
  armor_proficiencies, weapon_proficiencies, tool_proficiencies,
  skill_choices, multiclass_prereqs, multiclass_proficiencies,
  spellcasting_type, subclass_choice_level, source)
VALUES (
  'Druid', 8, ARRAY['WIS'],
  ARRAY['int', 'wis'],
  ARRAY['Light', 'Medium', 'Shields (non-metal)'],
  ARRAY['Clubs', 'Daggers', 'Darts', 'Javelins', 'Maces', 'Quarterstaffs', 'Scimitars', 'Sickles', 'Slings', 'Spears'],
  '["Herbalism kit"]'::jsonb,
  '{"count":2,"from":["Arcana","Animal Handling","Insight","Medicine","Nature","Perception","Religion","Survival"]}'::jsonb,
  '[{"ability":"wis","min":13}]'::jsonb,
  '{}'::jsonb,
  'full', 2, 'srd'
)
ON CONFLICT (name, source) DO UPDATE SET
  hit_die = EXCLUDED.hit_die,
  saving_throw_proficiencies = EXCLUDED.saving_throw_proficiencies,
  armor_proficiencies = EXCLUDED.armor_proficiencies,
  weapon_proficiencies = EXCLUDED.weapon_proficiencies,
  tool_proficiencies = EXCLUDED.tool_proficiencies,
  skill_choices = EXCLUDED.skill_choices,
  multiclass_prereqs = EXCLUDED.multiclass_prereqs,
  spellcasting_type = EXCLUDED.spellcasting_type,
  subclass_choice_level = EXCLUDED.subclass_choice_level;

-- Fighter
INSERT INTO public.classes (name, hit_die, primary_ability, saving_throw_proficiencies,
  armor_proficiencies, weapon_proficiencies, tool_proficiencies,
  skill_choices, multiclass_prereqs, multiclass_proficiencies,
  spellcasting_type, subclass_choice_level, source)
VALUES (
  'Fighter', 10, ARRAY['STR', 'DEX'],
  ARRAY['str', 'con'],
  ARRAY['All armor', 'Shields'],
  ARRAY['Simple', 'Martial'],
  '[]'::jsonb,
  '{"count":2,"from":["Acrobatics","Animal Handling","Athletics","History","Insight","Intimidation","Perception","Survival"]}'::jsonb,
  '[{"ability":"str","min":13},{"ability":"dex","min":13}]'::jsonb,
  '{}'::jsonb,
  NULL, 3, 'srd'
)
ON CONFLICT (name, source) DO UPDATE SET
  hit_die = EXCLUDED.hit_die,
  primary_ability = EXCLUDED.primary_ability,
  saving_throw_proficiencies = EXCLUDED.saving_throw_proficiencies,
  armor_proficiencies = EXCLUDED.armor_proficiencies,
  weapon_proficiencies = EXCLUDED.weapon_proficiencies,
  skill_choices = EXCLUDED.skill_choices,
  multiclass_prereqs = EXCLUDED.multiclass_prereqs,
  subclass_choice_level = EXCLUDED.subclass_choice_level;

-- Monk
INSERT INTO public.classes (name, hit_die, primary_ability, saving_throw_proficiencies,
  armor_proficiencies, weapon_proficiencies, tool_proficiencies,
  skill_choices, multiclass_prereqs, multiclass_proficiencies,
  spellcasting_type, subclass_choice_level, source)
VALUES (
  'Monk', 8, ARRAY['DEX', 'WIS'],
  ARRAY['str', 'dex'],
  '{}',
  ARRAY['Simple', 'Shortswords'],
  '["Any one artisan''s tool or musical instrument"]'::jsonb,
  '{"count":2,"from":["Acrobatics","Athletics","History","Insight","Religion","Stealth"]}'::jsonb,
  '[{"ability":"dex","min":13},{"ability":"wis","min":13}]'::jsonb,
  '{}'::jsonb,
  NULL, 3, 'srd'
)
ON CONFLICT (name, source) DO UPDATE SET
  hit_die = EXCLUDED.hit_die,
  primary_ability = EXCLUDED.primary_ability,
  saving_throw_proficiencies = EXCLUDED.saving_throw_proficiencies,
  weapon_proficiencies = EXCLUDED.weapon_proficiencies,
  tool_proficiencies = EXCLUDED.tool_proficiencies,
  skill_choices = EXCLUDED.skill_choices,
  multiclass_prereqs = EXCLUDED.multiclass_prereqs,
  subclass_choice_level = EXCLUDED.subclass_choice_level;

-- Paladin
INSERT INTO public.classes (name, hit_die, primary_ability, saving_throw_proficiencies,
  armor_proficiencies, weapon_proficiencies, tool_proficiencies,
  skill_choices, multiclass_prereqs, multiclass_proficiencies,
  spellcasting_type, subclass_choice_level, source)
VALUES (
  'Paladin', 10, ARRAY['STR', 'CHA'],
  ARRAY['wis', 'cha'],
  ARRAY['All armor', 'Shields'],
  ARRAY['Simple', 'Martial'],
  '[]'::jsonb,
  '{"count":2,"from":["Athletics","Insight","Intimidation","Medicine","Persuasion","Religion"]}'::jsonb,
  '[{"ability":"str","min":13},{"ability":"cha","min":13}]'::jsonb,
  '{}'::jsonb,
  'half', 3, 'srd'
)
ON CONFLICT (name, source) DO UPDATE SET
  hit_die = EXCLUDED.hit_die,
  primary_ability = EXCLUDED.primary_ability,
  saving_throw_proficiencies = EXCLUDED.saving_throw_proficiencies,
  armor_proficiencies = EXCLUDED.armor_proficiencies,
  weapon_proficiencies = EXCLUDED.weapon_proficiencies,
  skill_choices = EXCLUDED.skill_choices,
  multiclass_prereqs = EXCLUDED.multiclass_prereqs,
  spellcasting_type = EXCLUDED.spellcasting_type,
  subclass_choice_level = EXCLUDED.subclass_choice_level;

-- Ranger
INSERT INTO public.classes (name, hit_die, primary_ability, saving_throw_proficiencies,
  armor_proficiencies, weapon_proficiencies, tool_proficiencies,
  skill_choices, multiclass_prereqs, multiclass_proficiencies,
  spellcasting_type, subclass_choice_level, source)
VALUES (
  'Ranger', 10, ARRAY['DEX', 'WIS'],
  ARRAY['str', 'dex'],
  ARRAY['Light', 'Medium', 'Shields'],
  ARRAY['Simple', 'Martial'],
  '[]'::jsonb,
  '{"count":3,"from":["Animal Handling","Athletics","Insight","Investigation","Nature","Perception","Stealth","Survival"]}'::jsonb,
  '[{"ability":"dex","min":13},{"ability":"wis","min":13}]'::jsonb,
  '{}'::jsonb,
  'half', 3, 'srd'
)
ON CONFLICT (name, source) DO UPDATE SET
  hit_die = EXCLUDED.hit_die,
  primary_ability = EXCLUDED.primary_ability,
  saving_throw_proficiencies = EXCLUDED.saving_throw_proficiencies,
  armor_proficiencies = EXCLUDED.armor_proficiencies,
  weapon_proficiencies = EXCLUDED.weapon_proficiencies,
  skill_choices = EXCLUDED.skill_choices,
  multiclass_prereqs = EXCLUDED.multiclass_prereqs,
  spellcasting_type = EXCLUDED.spellcasting_type,
  subclass_choice_level = EXCLUDED.subclass_choice_level;

-- Rogue
INSERT INTO public.classes (name, hit_die, primary_ability, saving_throw_proficiencies,
  armor_proficiencies, weapon_proficiencies, tool_proficiencies,
  skill_choices, multiclass_prereqs, multiclass_proficiencies,
  spellcasting_type, subclass_choice_level, source)
VALUES (
  'Rogue', 8, ARRAY['DEX'],
  ARRAY['dex', 'int'],
  ARRAY['Light'],
  ARRAY['Simple', 'Hand crossbows', 'Longswords', 'Rapiers', 'Shortswords'],
  '["Thieves'' tools"]'::jsonb,
  '{"count":4,"from":["Acrobatics","Athletics","Deception","Insight","Intimidation","Investigation","Perception","Performance","Persuasion","Sleight of Hand","Stealth"]}'::jsonb,
  '[{"ability":"dex","min":13}]'::jsonb,
  '{}'::jsonb,
  NULL, 3, 'srd'
)
ON CONFLICT (name, source) DO UPDATE SET
  hit_die = EXCLUDED.hit_die,
  primary_ability = EXCLUDED.primary_ability,
  saving_throw_proficiencies = EXCLUDED.saving_throw_proficiencies,
  armor_proficiencies = EXCLUDED.armor_proficiencies,
  weapon_proficiencies = EXCLUDED.weapon_proficiencies,
  tool_proficiencies = EXCLUDED.tool_proficiencies,
  skill_choices = EXCLUDED.skill_choices,
  multiclass_prereqs = EXCLUDED.multiclass_prereqs,
  subclass_choice_level = EXCLUDED.subclass_choice_level;

-- Sorcerer
INSERT INTO public.classes (name, hit_die, primary_ability, saving_throw_proficiencies,
  armor_proficiencies, weapon_proficiencies, tool_proficiencies,
  skill_choices, multiclass_prereqs, multiclass_proficiencies,
  spellcasting_type, subclass_choice_level, source)
VALUES (
  'Sorcerer', 6, ARRAY['CHA'],
  ARRAY['con', 'cha'],
  '{}',
  ARRAY['Daggers', 'Darts', 'Slings', 'Quarterstaffs', 'Light crossbows'],
  '[]'::jsonb,
  '{"count":2,"from":["Arcana","Deception","Insight","Intimidation","Persuasion","Religion"]}'::jsonb,
  '[{"ability":"cha","min":13}]'::jsonb,
  '{}'::jsonb,
  'full', 1, 'srd'
)
ON CONFLICT (name, source) DO UPDATE SET
  hit_die = EXCLUDED.hit_die,
  primary_ability = EXCLUDED.primary_ability,
  saving_throw_proficiencies = EXCLUDED.saving_throw_proficiencies,
  weapon_proficiencies = EXCLUDED.weapon_proficiencies,
  skill_choices = EXCLUDED.skill_choices,
  multiclass_prereqs = EXCLUDED.multiclass_prereqs,
  spellcasting_type = EXCLUDED.spellcasting_type,
  subclass_choice_level = EXCLUDED.subclass_choice_level;

-- Warlock
INSERT INTO public.classes (name, hit_die, primary_ability, saving_throw_proficiencies,
  armor_proficiencies, weapon_proficiencies, tool_proficiencies,
  skill_choices, multiclass_prereqs, multiclass_proficiencies,
  spellcasting_type, subclass_choice_level, source)
VALUES (
  'Warlock', 8, ARRAY['CHA'],
  ARRAY['wis', 'cha'],
  ARRAY['Light'],
  ARRAY['Simple'],
  '[]'::jsonb,
  '{"count":2,"from":["Arcana","Deception","History","Intimidation","Investigation","Nature","Religion"]}'::jsonb,
  '[{"ability":"cha","min":13}]'::jsonb,
  '{}'::jsonb,
  'pact', 1, 'srd'
)
ON CONFLICT (name, source) DO UPDATE SET
  hit_die = EXCLUDED.hit_die,
  primary_ability = EXCLUDED.primary_ability,
  saving_throw_proficiencies = EXCLUDED.saving_throw_proficiencies,
  armor_proficiencies = EXCLUDED.armor_proficiencies,
  weapon_proficiencies = EXCLUDED.weapon_proficiencies,
  skill_choices = EXCLUDED.skill_choices,
  multiclass_prereqs = EXCLUDED.multiclass_prereqs,
  spellcasting_type = EXCLUDED.spellcasting_type,
  subclass_choice_level = EXCLUDED.subclass_choice_level;

-- Wizard
INSERT INTO public.classes (name, hit_die, primary_ability, saving_throw_proficiencies,
  armor_proficiencies, weapon_proficiencies, tool_proficiencies,
  skill_choices, multiclass_prereqs, multiclass_proficiencies,
  spellcasting_type, subclass_choice_level, source)
VALUES (
  'Wizard', 6, ARRAY['INT'],
  ARRAY['int', 'wis'],
  '{}',
  ARRAY['Daggers', 'Darts', 'Slings', 'Quarterstaffs', 'Light crossbows'],
  '[]'::jsonb,
  '{"count":2,"from":["Arcana","History","Insight","Investigation","Medicine","Religion"]}'::jsonb,
  '[{"ability":"int","min":13}]'::jsonb,
  '{}'::jsonb,
  'full', 2, 'srd'
)
ON CONFLICT (name, source) DO UPDATE SET
  hit_die = EXCLUDED.hit_die,
  primary_ability = EXCLUDED.primary_ability,
  saving_throw_proficiencies = EXCLUDED.saving_throw_proficiencies,
  weapon_proficiencies = EXCLUDED.weapon_proficiencies,
  skill_choices = EXCLUDED.skill_choices,
  multiclass_prereqs = EXCLUDED.multiclass_prereqs,
  spellcasting_type = EXCLUDED.spellcasting_type,
  subclass_choice_level = EXCLUDED.subclass_choice_level;
