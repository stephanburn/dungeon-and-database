-- Batch Eberron, Slice E2:
-- add the missing ERftLW player species/lineages that fit the current
-- character-builder model (Kalashtar, Shifter parent + 4 subraces,
-- Bugbear, Goblin, Hobgoblin). Combat-time and reaction trait riders
-- are surfaced as descriptive amendment notes rather than partially
-- automated, mirroring the PHB species seeds in migration 056.

-- Quori is a Kalashtar-specific language. Add it to the language catalog
-- so it can be referenced by name in species.languages and so the language
-- catalog stays the source of truth for Eberron-flavored language entries.
INSERT INTO public.languages (
  key,
  name,
  sort_order,
  source
) VALUES
  ('quori', 'Quori', 200, 'ERftLW')
ON CONFLICT (key) DO UPDATE
SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order,
  source = EXCLUDED.source;

INSERT INTO public.species_traits (
  name,
  description,
  source,
  amended,
  amendment_note
)
VALUES
  ('Dual Mind', 'You have advantage on Wisdom saving throws.', 'ERftLW', false, NULL),
  ('Mental Discipline', 'You have resistance to psychic damage.', 'ERftLW', false, NULL),
  ('Mind Link', 'You can speak telepathically to any creature you can see within 60 feet, and share that link with willing creatures.', 'ERftLW', true, 'Telepathic communication is a roleplay trait and is not modeled as an automated mechanic.'),
  ('Severed from Dreams', 'You sleep but are immune to magic that affects dreams or contacts you through them.', 'ERftLW', true, 'Dream-effect immunity is a descriptive trait rider and is not automated.'),
  ('Shifting', 'As a bonus action you can shift, gaining temporary hit points equal to your level + your Constitution modifier and a subrace-specific benefit, once per short or long rest.', 'ERftLW', true, 'Bonus-action shifting, temporary hit point assignment, and rest tracking are descriptive trait riders and are not automated.'),
  ('Natural Athlete', 'You are proficient in the Athletics skill.', 'ERftLW', true, 'Species-granted fixed skill proficiencies are not yet surfaced as locked entries in the sheet picker.'),
  ('Beasthide Shifting Feature', 'While shifted you gain an additional 1d6 temporary hit points and a +1 bonus to Armor Class.', 'ERftLW', true, 'Shifting-time bonuses are descriptive trait riders and are not automated.'),
  ('Fierce', 'You are proficient in the Intimidation skill.', 'ERftLW', true, 'Species-granted fixed skill proficiencies are not yet surfaced as locked entries in the sheet picker.'),
  ('Longtooth Shifting Feature', 'While shifted you can make a bite attack as a bonus action that deals 1d6 + Strength modifier piercing damage on a hit.', 'ERftLW', true, 'Bonus-action bite attack is a descriptive trait rider and is not automated.'),
  ('Graceful', 'You are proficient in the Acrobatics skill.', 'ERftLW', true, 'Species-granted fixed skill proficiencies are not yet surfaced as locked entries in the sheet picker.'),
  ('Swiftstride Shifting Feature', 'While shifted your walking speed increases by 10 feet, and you can move 10 feet as a reaction when a creature within 5 feet moves.', 'ERftLW', true, 'Shifting-time movement bonus and reactive shift are descriptive trait riders and are not automated.'),
  ('Mark the Scent', 'You are proficient in the Survival skill.', 'ERftLW', true, 'Species-granted fixed skill proficiencies are not yet surfaced as locked entries in the sheet picker.'),
  ('Wildhunt Shifting Feature', 'While shifted, no creature within 30 feet of you can make an attack roll with advantage against a target other than you, and you have advantage on Wisdom saving throws.', 'ERftLW', true, 'Advantage-denial aura and saving-throw rider are descriptive trait riders and are not automated.'),
  ('Long-Limbed', 'When you make a melee attack on your turn, your reach for it is 5 feet greater than normal.', 'ERftLW', true, 'Reach extension on melee attacks is a descriptive trait rider and is not automated.'),
  ('Sneaky', 'You are proficient in the Stealth skill.', 'ERftLW', true, 'Species-granted fixed skill proficiencies are not yet surfaced as locked entries in the sheet picker.'),
  ('Surprise Attack', 'If you surprise a creature and hit it with an attack on your first turn in combat, the attack deals an extra 2d6 damage to it.', 'ERftLW', true, 'Surprise-round bonus damage is a descriptive trait rider and is not automated.'),
  ('Fury of the Small', 'When you damage a creature with an attack or a spell and the creature is larger than you, you can deal extra damage equal to your level once per short or long rest.', 'ERftLW', true, 'Once-per-rest size-based bonus damage is a descriptive trait rider and is not automated.'),
  ('Nimble Escape', 'You can take the Disengage or Hide action as a bonus action on each of your turns.', 'ERftLW', true, 'Bonus-action Disengage/Hide is a descriptive trait rider and is not automated.'),
  ('Martial Training', 'You are proficient with two martial weapons of your choice and with light armor.', 'ERftLW', true, 'Species-granted weapon and armor proficiencies are not yet surfaced separately from class proficiencies.'),
  ('Saving Face', 'When you miss with an attack roll or fail an ability check or saving throw, you can gain a bonus equal to the number of allies within 30 feet who can see you (max +5), once per short or long rest.', 'ERftLW', true, 'Once-per-rest reroll bonus is a descriptive trait rider and is not automated.')
ON CONFLICT (name, source) DO UPDATE
SET
  description = EXCLUDED.description,
  amended = EXCLUDED.amended,
  amendment_note = EXCLUDED.amendment_note;

-- Base lineage rows: Kalashtar, Shifter (parent), Bugbear, Goblin, Hobgoblin.
INSERT INTO public.species (
  name,
  parent_species_id,
  lineage_key,
  variant_type,
  variant_order,
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
    'Kalashtar',
    NULL,
    'kalashtar',
    'base',
    0,
    'medium',
    30,
    '[{"ability":"wis","bonus":2},{"ability":"cha","bonus":1}]'::jsonb,
    ARRAY['Common', 'Quori'],
    ARRAY[
      (SELECT id FROM public.species_traits WHERE name = 'Dual Mind' AND source = 'ERftLW'),
      (SELECT id FROM public.species_traits WHERE name = 'Mental Discipline' AND source = 'ERftLW'),
      (SELECT id FROM public.species_traits WHERE name = 'Mind Link' AND source = 'ERftLW'),
      (SELECT id FROM public.species_traits WHERE name = 'Severed from Dreams' AND source = 'ERftLW')
    ]::uuid[],
    '[]'::jsonb,
    ARRAY['psychic']::text[],
    ARRAY[]::text[],
    'ERftLW',
    true,
    'Mind Link telepathy, Mental Discipline psychic resistance flavor, and Severed from Dreams sleep behavior are descriptive trait riders. The required extra language pick is wired through typed species language choices.'
  ),
  (
    'Shifter',
    NULL,
    'shifter',
    'base',
    0,
    'medium',
    30,
    '[{"ability":"dex","bonus":1}]'::jsonb,
    ARRAY['Common'],
    ARRAY[
      (SELECT id FROM public.species_traits WHERE name = 'Darkvision' AND source = 'ERftLW'),
      (SELECT id FROM public.species_traits WHERE name = 'Shifting' AND source = 'ERftLW')
    ]::uuid[],
    '[{"type":"darkvision","range_ft":60}]'::jsonb,
    ARRAY[]::text[],
    ARRAY[]::text[],
    'ERftLW',
    true,
    'Base Eberron lineage row. Choose Beasthide, Longtooth, Swiftstride, or Wildhunt Shifter for the complete shifter package; Shifting bonus action and temp HP grant remain descriptive trait riders.'
  ),
  (
    'Bugbear',
    NULL,
    'bugbear',
    'base',
    0,
    'medium',
    30,
    '[{"ability":"str","bonus":2},{"ability":"dex","bonus":1}]'::jsonb,
    ARRAY['Common', 'Goblin'],
    ARRAY[
      (SELECT id FROM public.species_traits WHERE name = 'Darkvision' AND source = 'ERftLW'),
      (SELECT id FROM public.species_traits WHERE name = 'Long-Limbed' AND source = 'ERftLW'),
      (SELECT id FROM public.species_traits WHERE name = 'Powerful Build' AND source = 'ERftLW'),
      (SELECT id FROM public.species_traits WHERE name = 'Sneaky' AND source = 'ERftLW'),
      (SELECT id FROM public.species_traits WHERE name = 'Surprise Attack' AND source = 'ERftLW')
    ]::uuid[],
    '[{"type":"darkvision","range_ft":60}]'::jsonb,
    ARRAY[]::text[],
    ARRAY[]::text[],
    'ERftLW',
    true,
    'Long-Limbed reach extension and Surprise Attack damage are descriptive. Sneaky grants Stealth proficiency, but species-granted skill proficiencies are not yet surfaced as locked sheet entries.'
  ),
  (
    'Goblin',
    NULL,
    'goblin',
    'base',
    0,
    'small',
    30,
    '[{"ability":"dex","bonus":2},{"ability":"con","bonus":1}]'::jsonb,
    ARRAY['Common', 'Goblin'],
    ARRAY[
      (SELECT id FROM public.species_traits WHERE name = 'Darkvision' AND source = 'ERftLW'),
      (SELECT id FROM public.species_traits WHERE name = 'Fury of the Small' AND source = 'ERftLW'),
      (SELECT id FROM public.species_traits WHERE name = 'Nimble Escape' AND source = 'ERftLW')
    ]::uuid[],
    '[{"type":"darkvision","range_ft":60}]'::jsonb,
    ARRAY[]::text[],
    ARRAY[]::text[],
    'ERftLW',
    true,
    'Fury of the Small bonus damage and Nimble Escape bonus action are descriptive trait riders.'
  ),
  (
    'Hobgoblin',
    NULL,
    'hobgoblin',
    'base',
    0,
    'medium',
    30,
    '[{"ability":"con","bonus":2},{"ability":"int","bonus":1}]'::jsonb,
    ARRAY['Common', 'Goblin'],
    ARRAY[
      (SELECT id FROM public.species_traits WHERE name = 'Darkvision' AND source = 'ERftLW'),
      (SELECT id FROM public.species_traits WHERE name = 'Martial Training' AND source = 'ERftLW'),
      (SELECT id FROM public.species_traits WHERE name = 'Saving Face' AND source = 'ERftLW')
    ]::uuid[],
    '[{"type":"darkvision","range_ft":60}]'::jsonb,
    ARRAY[]::text[],
    ARRAY[]::text[],
    'ERftLW',
    true,
    'Saving Face once-per-rest bonus is descriptive. Martial Training grants two martial weapons and light armor proficiency, but species-granted weapon and armor proficiencies are not yet surfaced separately from class proficiencies.'
  )
ON CONFLICT (name, source) DO UPDATE
SET
  parent_species_id = EXCLUDED.parent_species_id,
  lineage_key = EXCLUDED.lineage_key,
  variant_type = EXCLUDED.variant_type,
  variant_order = EXCLUDED.variant_order,
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

-- Shifter subraces. Each restates the shared shifter package and adds the
-- subrace-specific ability bonus, fixed skill trait, and shifting feature.
INSERT INTO public.species (
  name,
  parent_species_id,
  lineage_key,
  variant_type,
  variant_order,
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
    'Beasthide Shifter',
    (SELECT id FROM public.species WHERE name = 'Shifter' AND source = 'ERftLW'),
    'shifter',
    'subrace',
    1,
    'medium',
    30,
    '[{"ability":"dex","bonus":1},{"ability":"con","bonus":2}]'::jsonb,
    ARRAY['Common'],
    ARRAY[
      (SELECT id FROM public.species_traits WHERE name = 'Darkvision' AND source = 'ERftLW'),
      (SELECT id FROM public.species_traits WHERE name = 'Shifting' AND source = 'ERftLW'),
      (SELECT id FROM public.species_traits WHERE name = 'Natural Athlete' AND source = 'ERftLW'),
      (SELECT id FROM public.species_traits WHERE name = 'Beasthide Shifting Feature' AND source = 'ERftLW')
    ]::uuid[],
    '[{"type":"darkvision","range_ft":60}]'::jsonb,
    ARRAY[]::text[],
    ARRAY[]::text[],
    'ERftLW',
    true,
    'Subrace shifting bonuses (extra temp HP and +1 AC while shifted) are descriptive. Natural Athlete grants Athletics proficiency, but species-granted skill proficiencies are not yet surfaced as locked sheet entries.'
  ),
  (
    'Longtooth Shifter',
    (SELECT id FROM public.species WHERE name = 'Shifter' AND source = 'ERftLW'),
    'shifter',
    'subrace',
    2,
    'medium',
    30,
    '[{"ability":"dex","bonus":1},{"ability":"str","bonus":2}]'::jsonb,
    ARRAY['Common'],
    ARRAY[
      (SELECT id FROM public.species_traits WHERE name = 'Darkvision' AND source = 'ERftLW'),
      (SELECT id FROM public.species_traits WHERE name = 'Shifting' AND source = 'ERftLW'),
      (SELECT id FROM public.species_traits WHERE name = 'Fierce' AND source = 'ERftLW'),
      (SELECT id FROM public.species_traits WHERE name = 'Longtooth Shifting Feature' AND source = 'ERftLW')
    ]::uuid[],
    '[{"type":"darkvision","range_ft":60}]'::jsonb,
    ARRAY[]::text[],
    ARRAY[]::text[],
    'ERftLW',
    true,
    'Subrace shifting bite attack is descriptive. Fierce grants Intimidation proficiency, but species-granted skill proficiencies are not yet surfaced as locked sheet entries.'
  ),
  (
    'Swiftstride Shifter',
    (SELECT id FROM public.species WHERE name = 'Shifter' AND source = 'ERftLW'),
    'shifter',
    'subrace',
    3,
    'medium',
    30,
    '[{"ability":"dex","bonus":1},{"ability":"dex","bonus":2}]'::jsonb,
    ARRAY['Common'],
    ARRAY[
      (SELECT id FROM public.species_traits WHERE name = 'Darkvision' AND source = 'ERftLW'),
      (SELECT id FROM public.species_traits WHERE name = 'Shifting' AND source = 'ERftLW'),
      (SELECT id FROM public.species_traits WHERE name = 'Graceful' AND source = 'ERftLW'),
      (SELECT id FROM public.species_traits WHERE name = 'Swiftstride Shifting Feature' AND source = 'ERftLW')
    ]::uuid[],
    '[{"type":"darkvision","range_ft":60}]'::jsonb,
    ARRAY[]::text[],
    ARRAY[]::text[],
    'ERftLW',
    true,
    'Subrace shifting speed bonus and reactive 10-foot move are descriptive. Graceful grants Acrobatics proficiency, but species-granted skill proficiencies are not yet surfaced as locked sheet entries.'
  ),
  (
    'Wildhunt Shifter',
    (SELECT id FROM public.species WHERE name = 'Shifter' AND source = 'ERftLW'),
    'shifter',
    'subrace',
    4,
    'medium',
    30,
    '[{"ability":"dex","bonus":1},{"ability":"wis","bonus":2}]'::jsonb,
    ARRAY['Common'],
    ARRAY[
      (SELECT id FROM public.species_traits WHERE name = 'Darkvision' AND source = 'ERftLW'),
      (SELECT id FROM public.species_traits WHERE name = 'Shifting' AND source = 'ERftLW'),
      (SELECT id FROM public.species_traits WHERE name = 'Mark the Scent' AND source = 'ERftLW'),
      (SELECT id FROM public.species_traits WHERE name = 'Wildhunt Shifting Feature' AND source = 'ERftLW')
    ]::uuid[],
    '[{"type":"darkvision","range_ft":60}]'::jsonb,
    ARRAY[]::text[],
    ARRAY[]::text[],
    'ERftLW',
    true,
    'Subrace shifting advantage-denial aura is descriptive. Mark the Scent grants Survival proficiency, but species-granted skill proficiencies are not yet surfaced as locked sheet entries.'
  )
ON CONFLICT (name, source) DO UPDATE
SET
  parent_species_id = EXCLUDED.parent_species_id,
  lineage_key = EXCLUDED.lineage_key,
  variant_type = EXCLUDED.variant_type,
  variant_order = EXCLUDED.variant_order,
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
