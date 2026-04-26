-- Eberron audit Slice E4: House Agent, Revenant Blade, and the
-- double-bladed scimitar equipment referent.
--
-- Builder text is intentionally concise. Mixed tool/language and combat-time
-- feat riders are marked amended where current automation cannot yet model the
-- exact table behavior.

INSERT INTO public.equipment_items (
  key,
  name,
  item_category,
  cost_quantity,
  cost_unit,
  weight_lb,
  source,
  amended,
  amendment_note
)
VALUES
  (
    'double_bladed_scimitar',
    'Double-bladed Scimitar',
    'weapon',
    100,
    'gp',
    6.00,
    'ERftLW',
    true,
    'Special bonus-action attack and Revenant Blade finesse interaction are descriptive until equipment combat automation exists.'
  ),
  (
    'identification_papers',
    'Identification Papers',
    'gear',
    2,
    'gp',
    0.00,
    'ERftLW',
    false,
    NULL
  ),
  (
    'house_signet_ring',
    'House Signet Ring',
    'gear',
    5,
    'gp',
    0.00,
    'ERftLW',
    false,
    NULL
  )
ON CONFLICT (key) DO UPDATE
SET
  name = EXCLUDED.name,
  item_category = EXCLUDED.item_category,
  cost_quantity = EXCLUDED.cost_quantity,
  cost_unit = EXCLUDED.cost_unit,
  weight_lb = EXCLUDED.weight_lb,
  source = EXCLUDED.source,
  amended = EXCLUDED.amended,
  amendment_note = EXCLUDED.amendment_note;

INSERT INTO public.weapons (
  item_id,
  weapon_category,
  weapon_kind,
  damage_dice,
  damage_type,
  properties,
  normal_range,
  long_range,
  versatile_damage
)
VALUES (
  (SELECT id FROM public.equipment_items WHERE key = 'double_bladed_scimitar'),
  'martial',
  'melee',
  '2d4',
  'slashing',
  ARRAY['special', 'two_handed'],
  NULL,
  NULL,
  NULL
)
ON CONFLICT (item_id) DO UPDATE
SET
  weapon_category = EXCLUDED.weapon_category,
  weapon_kind = EXCLUDED.weapon_kind,
  damage_dice = EXCLUDED.damage_dice,
  damage_type = EXCLUDED.damage_type,
  properties = EXCLUDED.properties,
  normal_range = EXCLUDED.normal_range,
  long_range = EXCLUDED.long_range,
  versatile_damage = EXCLUDED.versatile_damage;

INSERT INTO public.starting_equipment_packages (
  key,
  name,
  description,
  source,
  amended,
  amendment_note
)
VALUES (
  'background:house_agent:erftlw',
  'House Agent Starting Equipment',
  'Credentials, clothing, and coin for a dragonmarked house representative.',
  'ERftLW',
  false,
  NULL
)
ON CONFLICT (key) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  source = EXCLUDED.source,
  amended = EXCLUDED.amended,
  amendment_note = EXCLUDED.amendment_note;

INSERT INTO public.starting_equipment_package_items (
  package_id,
  item_id,
  quantity,
  item_order,
  choice_group,
  notes
)
VALUES
  (
    (SELECT id FROM public.starting_equipment_packages WHERE key = 'background:house_agent:erftlw'),
    (SELECT id FROM public.equipment_items WHERE key = 'fine_clothes'),
    1,
    10,
    '',
    NULL
  ),
  (
    (SELECT id FROM public.starting_equipment_packages WHERE key = 'background:house_agent:erftlw'),
    (SELECT id FROM public.equipment_items WHERE key = 'house_signet_ring'),
    1,
    20,
    '',
    NULL
  ),
  (
    (SELECT id FROM public.starting_equipment_packages WHERE key = 'background:house_agent:erftlw'),
    (SELECT id FROM public.equipment_items WHERE key = 'identification_papers'),
    1,
    30,
    '',
    NULL
  ),
  (
    (SELECT id FROM public.starting_equipment_packages WHERE key = 'background:house_agent:erftlw'),
    (SELECT id FROM public.equipment_items WHERE key = 'belt_pouch'),
    1,
    40,
    '',
    'Contains 20 gp'
  )
ON CONFLICT (package_id, item_id, choice_group) DO UPDATE
SET
  quantity = EXCLUDED.quantity,
  item_order = EXCLUDED.item_order,
  notes = EXCLUDED.notes;

INSERT INTO public.backgrounds (
  name,
  skill_proficiencies,
  skill_choice_count,
  skill_choice_from,
  tool_proficiencies,
  languages,
  starting_equipment,
  starting_equipment_package_id,
  feature,
  background_feat_id,
  source,
  amended,
  amendment_note
)
VALUES (
  'House Agent',
  ARRAY['Investigation', 'Persuasion'],
  0,
  ARRAY[]::text[],
  ARRAY['One tool or language of your choice'],
  ARRAY[]::text[],
  '[]'::jsonb,
  (SELECT id FROM public.starting_equipment_packages WHERE key = 'background:house_agent:erftlw'),
  'House Connections: your house can help with lodging, contacts, messages, and limited support through house enclaves and agents.',
  NULL,
  'ERftLW',
  true,
  'The ERftLW tool-or-language choice is represented as a descriptive proficiency placeholder until mixed tool/language background choices are automated.'
)
ON CONFLICT (name, source) DO UPDATE
SET
  skill_proficiencies = EXCLUDED.skill_proficiencies,
  skill_choice_count = EXCLUDED.skill_choice_count,
  skill_choice_from = EXCLUDED.skill_choice_from,
  tool_proficiencies = EXCLUDED.tool_proficiencies,
  languages = EXCLUDED.languages,
  starting_equipment = EXCLUDED.starting_equipment,
  starting_equipment_package_id = EXCLUDED.starting_equipment_package_id,
  feature = EXCLUDED.feature,
  background_feat_id = EXCLUDED.background_feat_id,
  amended = EXCLUDED.amended,
  amendment_note = EXCLUDED.amendment_note;

INSERT INTO public.feats (
  name,
  prerequisites,
  description,
  benefits,
  source,
  amended,
  amendment_note
)
VALUES (
  'Revenant Blade',
  '[{"type":"species","lineage":"elf"}]'::jsonb,
  'Master the double-bladed scimitar with a Strength or Dexterity increase and defensive technique.',
  '{
    "ability_score_choice": {
      "abilities": ["str", "dex"],
      "bonus": 1
    },
    "double_bladed_scimitar": {
      "finesse": true,
      "ac_bonus": 1,
      "ac_bonus_condition": "while wielding a double-bladed scimitar with two hands"
    }
  }'::jsonb,
  'ERftLW',
  true,
  'Ability choice, finesse, and AC bonus riders are descriptive until feat-option and equipment combat automation exist.'
)
ON CONFLICT (name, source) DO UPDATE
SET
  prerequisites = EXCLUDED.prerequisites,
  description = EXCLUDED.description,
  benefits = EXCLUDED.benefits,
  amended = EXCLUDED.amended,
  amendment_note = EXCLUDED.amendment_note;
