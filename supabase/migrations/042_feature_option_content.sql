-- Batch 3a: content tables for reusable feature option families.
-- These rows describe the selectable content behind systems like Maverick
-- Arcane Breakthroughs and 2014 fighting styles while character-specific
-- choices continue to live in character_feature_option_choices.

CREATE TABLE IF NOT EXISTS public.feature_option_groups (
  key text PRIMARY KEY,
  name text NOT NULL,
  option_family text NOT NULL,
  description text NOT NULL DEFAULT '',
  selection_limit int NOT NULL DEFAULT 1 CHECK (selection_limit >= 1),
  allows_duplicate_selections boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  source text NOT NULL REFERENCES public.sources (key),
  amended boolean NOT NULL DEFAULT false,
  amendment_note text
);

CREATE TABLE IF NOT EXISTS public.feature_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_key text NOT NULL REFERENCES public.feature_option_groups (key) ON DELETE CASCADE,
  key text NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  option_order int NOT NULL DEFAULT 0,
  prerequisites jsonb NOT NULL DEFAULT '{}'::jsonb,
  effects jsonb NOT NULL DEFAULT '{}'::jsonb,
  source text NOT NULL REFERENCES public.sources (key),
  amended boolean NOT NULL DEFAULT false,
  amendment_note text,
  UNIQUE (group_key, key)
);

ALTER TABLE public.feature_option_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feature_option_groups_select_auth" ON public.feature_option_groups;
CREATE POLICY "feature_option_groups_select_auth" ON public.feature_option_groups
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "feature_option_groups_insert_admin" ON public.feature_option_groups;
CREATE POLICY "feature_option_groups_insert_admin" ON public.feature_option_groups
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "feature_option_groups_update_admin" ON public.feature_option_groups;
CREATE POLICY "feature_option_groups_update_admin" ON public.feature_option_groups
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "feature_option_groups_delete_admin" ON public.feature_option_groups;
CREATE POLICY "feature_option_groups_delete_admin" ON public.feature_option_groups
  FOR DELETE USING (public.is_admin());

DROP POLICY IF EXISTS "feature_options_select_auth" ON public.feature_options;
CREATE POLICY "feature_options_select_auth" ON public.feature_options
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "feature_options_insert_admin" ON public.feature_options;
CREATE POLICY "feature_options_insert_admin" ON public.feature_options
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "feature_options_update_admin" ON public.feature_options;
CREATE POLICY "feature_options_update_admin" ON public.feature_options
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "feature_options_delete_admin" ON public.feature_options;
CREATE POLICY "feature_options_delete_admin" ON public.feature_options
  FOR DELETE USING (public.is_admin());

INSERT INTO public.feature_option_groups (
  key,
  name,
  option_family,
  description,
  selection_limit,
  allows_duplicate_selections,
  metadata,
  source
) VALUES
  (
    'maverick:arcane_breakthrough_classes',
    'Arcane Breakthrough Classes',
    'class_list',
    'Selectable class spell lists that a Maverick artificer can add as Arcane Breakthrough options.',
    1,
    false,
    '{"subclass_name":"Maverick","selection_mode":"per_slot"}'::jsonb,
    'EE'
  ),
  (
    'fighting_style:fighter:2014',
    'Fighter Fighting Style (2014)',
    'fighting_style',
    '2014 fighting styles available to Fighters.',
    1,
    false,
    '{"class_name":"Fighter","rule_set":"2014"}'::jsonb,
    'PHB'
  ),
  (
    'fighting_style:paladin:2014',
    'Paladin Fighting Style (2014)',
    'fighting_style',
    '2014 fighting styles available to Paladins.',
    1,
    false,
    '{"class_name":"Paladin","rule_set":"2014"}'::jsonb,
    'PHB'
  ),
  (
    'fighting_style:ranger:2014',
    'Ranger Fighting Style (2014)',
    'fighting_style',
    '2014 fighting styles available to Rangers.',
    1,
    false,
    '{"class_name":"Ranger","rule_set":"2014"}'::jsonb,
    'PHB'
  )
ON CONFLICT (key) DO UPDATE
SET
  name = EXCLUDED.name,
  option_family = EXCLUDED.option_family,
  description = EXCLUDED.description,
  selection_limit = EXCLUDED.selection_limit,
  allows_duplicate_selections = EXCLUDED.allows_duplicate_selections,
  metadata = EXCLUDED.metadata,
  source = EXCLUDED.source;

INSERT INTO public.feature_options (
  group_key,
  key,
  name,
  description,
  option_order,
  prerequisites,
  effects,
  source
) VALUES
  (
    'maverick:arcane_breakthrough_classes',
    'bard',
    'Bard',
    'Add the Bard spell list to the set of spell lists your Arcane Breakthroughs can use.',
    10,
    '{}'::jsonb,
    jsonb_build_object('class_name', 'Bard', 'class_id', (SELECT id FROM public.classes WHERE name = 'Bard' LIMIT 1)),
    'EE'
  ),
  (
    'maverick:arcane_breakthrough_classes',
    'cleric',
    'Cleric',
    'Add the Cleric spell list to the set of spell lists your Arcane Breakthroughs can use.',
    20,
    '{}'::jsonb,
    jsonb_build_object('class_name', 'Cleric', 'class_id', (SELECT id FROM public.classes WHERE name = 'Cleric' LIMIT 1)),
    'EE'
  ),
  (
    'maverick:arcane_breakthrough_classes',
    'druid',
    'Druid',
    'Add the Druid spell list to the set of spell lists your Arcane Breakthroughs can use.',
    30,
    '{}'::jsonb,
    jsonb_build_object('class_name', 'Druid', 'class_id', (SELECT id FROM public.classes WHERE name = 'Druid' LIMIT 1)),
    'EE'
  ),
  (
    'maverick:arcane_breakthrough_classes',
    'paladin',
    'Paladin',
    'Add the Paladin spell list to the set of spell lists your Arcane Breakthroughs can use.',
    40,
    '{}'::jsonb,
    jsonb_build_object('class_name', 'Paladin', 'class_id', (SELECT id FROM public.classes WHERE name = 'Paladin' LIMIT 1)),
    'EE'
  ),
  (
    'maverick:arcane_breakthrough_classes',
    'ranger',
    'Ranger',
    'Add the Ranger spell list to the set of spell lists your Arcane Breakthroughs can use.',
    50,
    '{}'::jsonb,
    jsonb_build_object('class_name', 'Ranger', 'class_id', (SELECT id FROM public.classes WHERE name = 'Ranger' LIMIT 1)),
    'EE'
  ),
  (
    'maverick:arcane_breakthrough_classes',
    'sorcerer',
    'Sorcerer',
    'Add the Sorcerer spell list to the set of spell lists your Arcane Breakthroughs can use.',
    60,
    '{}'::jsonb,
    jsonb_build_object('class_name', 'Sorcerer', 'class_id', (SELECT id FROM public.classes WHERE name = 'Sorcerer' LIMIT 1)),
    'EE'
  ),
  (
    'maverick:arcane_breakthrough_classes',
    'warlock',
    'Warlock',
    'Add the Warlock spell list to the set of spell lists your Arcane Breakthroughs can use.',
    70,
    '{}'::jsonb,
    jsonb_build_object('class_name', 'Warlock', 'class_id', (SELECT id FROM public.classes WHERE name = 'Warlock' LIMIT 1)),
    'EE'
  ),
  (
    'maverick:arcane_breakthrough_classes',
    'wizard',
    'Wizard',
    'Add the Wizard spell list to the set of spell lists your Arcane Breakthroughs can use.',
    80,
    '{}'::jsonb,
    jsonb_build_object('class_name', 'Wizard', 'class_id', (SELECT id FROM public.classes WHERE name = 'Wizard' LIMIT 1)),
    'EE'
  ),
  (
    'fighting_style:fighter:2014',
    'archery',
    'Archery',
    '+2 bonus to attack rolls you make with ranged weapons.',
    10,
    '{}'::jsonb,
    '{"attack_bonus":{"weapon_tags":["ranged"],"value":2}}'::jsonb,
    'PHB'
  ),
  (
    'fighting_style:fighter:2014',
    'defense',
    'Defense',
    '+1 bonus to AC while you are wearing armor.',
    20,
    '{}'::jsonb,
    '{"armor_class_bonus":{"while_wearing_armor":1}}'::jsonb,
    'PHB'
  ),
  (
    'fighting_style:fighter:2014',
    'dueling',
    'Dueling',
    '+2 bonus to damage rolls when wielding a melee weapon in one hand and no other weapons.',
    30,
    '{}'::jsonb,
    '{"damage_bonus":{"one_handed_melee":2}}'::jsonb,
    'PHB'
  ),
  (
    'fighting_style:fighter:2014',
    'great_weapon_fighting',
    'Great Weapon Fighting',
    'Reroll 1s and 2s on damage dice for two-handed or versatile melee weapons used with two hands.',
    40,
    '{}'::jsonb,
    '{"damage_reroll":{"melee_tags":["two_handed","versatile_two_handed"],"reroll_values":[1,2]}}'::jsonb,
    'PHB'
  ),
  (
    'fighting_style:fighter:2014',
    'protection',
    'Protection',
    'Use your reaction with a shield to impose disadvantage on an attack against an adjacent ally.',
    50,
    '{}'::jsonb,
    '{"reaction":"protection"}'::jsonb,
    'PHB'
  ),
  (
    'fighting_style:fighter:2014',
    'two_weapon_fighting',
    'Two-Weapon Fighting',
    'Add your ability modifier to the damage of the second attack when fighting with two weapons.',
    60,
    '{}'::jsonb,
    '{"offhand_damage_modifier":true}'::jsonb,
    'PHB'
  ),
  (
    'fighting_style:paladin:2014',
    'defense',
    'Defense',
    '+1 bonus to AC while you are wearing armor.',
    10,
    '{}'::jsonb,
    '{"armor_class_bonus":{"while_wearing_armor":1}}'::jsonb,
    'PHB'
  ),
  (
    'fighting_style:paladin:2014',
    'dueling',
    'Dueling',
    '+2 bonus to damage rolls when wielding a melee weapon in one hand and no other weapons.',
    20,
    '{}'::jsonb,
    '{"damage_bonus":{"one_handed_melee":2}}'::jsonb,
    'PHB'
  ),
  (
    'fighting_style:paladin:2014',
    'great_weapon_fighting',
    'Great Weapon Fighting',
    'Reroll 1s and 2s on damage dice for two-handed or versatile melee weapons used with two hands.',
    30,
    '{}'::jsonb,
    '{"damage_reroll":{"melee_tags":["two_handed","versatile_two_handed"],"reroll_values":[1,2]}}'::jsonb,
    'PHB'
  ),
  (
    'fighting_style:paladin:2014',
    'protection',
    'Protection',
    'Use your reaction with a shield to impose disadvantage on an attack against an adjacent ally.',
    40,
    '{}'::jsonb,
    '{"reaction":"protection"}'::jsonb,
    'PHB'
  ),
  (
    'fighting_style:ranger:2014',
    'archery',
    'Archery',
    '+2 bonus to attack rolls you make with ranged weapons.',
    10,
    '{}'::jsonb,
    '{"attack_bonus":{"weapon_tags":["ranged"],"value":2}}'::jsonb,
    'PHB'
  ),
  (
    'fighting_style:ranger:2014',
    'defense',
    'Defense',
    '+1 bonus to AC while you are wearing armor.',
    20,
    '{}'::jsonb,
    '{"armor_class_bonus":{"while_wearing_armor":1}}'::jsonb,
    'PHB'
  ),
  (
    'fighting_style:ranger:2014',
    'dueling',
    'Dueling',
    '+2 bonus to damage rolls when wielding a melee weapon in one hand and no other weapons.',
    30,
    '{}'::jsonb,
    '{"damage_bonus":{"one_handed_melee":2}}'::jsonb,
    'PHB'
  ),
  (
    'fighting_style:ranger:2014',
    'two_weapon_fighting',
    'Two-Weapon Fighting',
    'Add your ability modifier to the damage of the second attack when fighting with two weapons.',
    40,
    '{}'::jsonb,
    '{"offhand_damage_modifier":true}'::jsonb,
    'PHB'
  )
ON CONFLICT (group_key, key) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  option_order = EXCLUDED.option_order,
  prerequisites = EXCLUDED.prerequisites,
  effects = EXCLUDED.effects,
  source = EXCLUDED.source;
