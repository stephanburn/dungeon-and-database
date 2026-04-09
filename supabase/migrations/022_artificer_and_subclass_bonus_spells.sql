-- Add subclass-granted spell support and seed Artificer content from ERftLW.

CREATE TABLE IF NOT EXISTS public.subclass_bonus_spells (
  id                            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subclass_id                   uuid NOT NULL REFERENCES public.subclasses (id) ON DELETE CASCADE,
  spell_id                      uuid NOT NULL REFERENCES public.spells (id) ON DELETE CASCADE,
  required_class_level          int  NOT NULL CHECK (required_class_level BETWEEN 1 AND 20),
  counts_against_selection_limit boolean NOT NULL DEFAULT false,
  UNIQUE (subclass_id, spell_id, required_class_level)
);

ALTER TABLE public.subclass_bonus_spells ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subclass_bonus_spells_select_auth" ON public.subclass_bonus_spells
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "subclass_bonus_spells_insert_admin" ON public.subclass_bonus_spells
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "subclass_bonus_spells_update_admin" ON public.subclass_bonus_spells
  FOR UPDATE USING (public.is_admin());

INSERT INTO public.classes (
  name,
  hit_die,
  primary_ability,
  saving_throw_proficiencies,
  armor_proficiencies,
  weapon_proficiencies,
  tool_proficiencies,
  skill_choices,
  multiclass_prereqs,
  multiclass_proficiencies,
  spellcasting_type,
  spellcasting_progression,
  subclass_choice_level,
  source
)
VALUES (
  'Artificer',
  8,
  ARRAY['INT'],
  ARRAY['con', 'int'],
  ARRAY['Light armor', 'Medium armor', 'Shields'],
  ARRAY['Simple weapons'],
  '["Thieves'' tools", "Tinker''s tools", "One type of artisan''s tools"]'::jsonb,
  '{"count":2,"from":["Arcana","History","Investigation","Medicine","Nature","Perception","Sleight of Hand"]}'::jsonb,
  '[{"ability":"int","min":13}]'::jsonb,
  '{"armor":["Light armor","Medium armor","Shields"],"tools":["Thieves'' tools","Tinker''s tools"]}'::jsonb,
  'half',
  '{
    "mode":"prepared",
    "spellcasting_ability":"int",
    "cantrips_known_by_level":[2,2,2,2,2,2,2,2,2,3,3,3,3,4,4,4,4,4,4,4],
    "prepared_formula":"half_level_down",
    "prepared_add_ability_mod":true,
    "prepared_min":1
  }'::jsonb,
  3,
  'ERftLW'
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
  multiclass_proficiencies = EXCLUDED.multiclass_proficiencies,
  spellcasting_type = EXCLUDED.spellcasting_type,
  spellcasting_progression = EXCLUDED.spellcasting_progression,
  subclass_choice_level = EXCLUDED.subclass_choice_level;

INSERT INTO public.class_features (name, description, source)
VALUES
  ('Magical Tinkering', 'Imbue Tiny objects with minor magical properties.', 'ERftLW'),
  ('Spellcasting', 'Prepare artificer spells and cast through tools as a focus.', 'ERftLW'),
  ('Infuse Item', 'Learn artificer infusions and maintain infused items.', 'ERftLW'),
  ('Artificer Specialist', 'Choose an artificer specialty.', 'ERftLW'),
  ('The Right Tool for the Job', 'Create a set of artisan''s tools with tinker''s tools.', 'ERftLW'),
  ('Tool Expertise', 'Double proficiency with tool checks using proficient tools.', 'ERftLW'),
  ('Flash of Genius', 'Add Intelligence modifier to nearby checks or saves as a reaction.', 'ERftLW'),
  ('Magic Item Adept', 'Attune to more items and craft common and uncommon magic items faster.', 'ERftLW'),
  ('Spell-Storing Item', 'Store a 1st- or 2nd-level artificer spell in an object.', 'ERftLW'),
  ('Magic Item Savant', 'Attune to more items and ignore many attunement restrictions.', 'ERftLW'),
  ('Magic Item Master', 'Attune to up to six magic items.', 'ERftLW'),
  ('Soul of Artifice', 'Draw protection from your attuned magic items.', 'ERftLW')
ON CONFLICT (name, source) DO UPDATE SET
  description = EXCLUDED.description;

WITH artificer AS (
  SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW'
)
INSERT INTO public.class_feature_progression (
  class_id,
  level,
  features,
  asi_available,
  proficiency_bonus
)
VALUES
  ((SELECT id FROM artificer), 1, ARRAY[
    (SELECT id FROM public.class_features WHERE name = 'Magical Tinkering' AND source = 'ERftLW'),
    (SELECT id FROM public.class_features WHERE name = 'Spellcasting' AND source = 'ERftLW')
  ], false, 2),
  ((SELECT id FROM artificer), 2, ARRAY[
    (SELECT id FROM public.class_features WHERE name = 'Infuse Item' AND source = 'ERftLW')
  ], false, 2),
  ((SELECT id FROM artificer), 3, ARRAY[
    (SELECT id FROM public.class_features WHERE name = 'Artificer Specialist' AND source = 'ERftLW'),
    (SELECT id FROM public.class_features WHERE name = 'The Right Tool for the Job' AND source = 'ERftLW')
  ], false, 2),
  ((SELECT id FROM artificer), 4, ARRAY[]::uuid[], true, 2),
  ((SELECT id FROM artificer), 5, ARRAY[]::uuid[], false, 3),
  ((SELECT id FROM artificer), 6, ARRAY[
    (SELECT id FROM public.class_features WHERE name = 'Tool Expertise' AND source = 'ERftLW')
  ], false, 3),
  ((SELECT id FROM artificer), 7, ARRAY[
    (SELECT id FROM public.class_features WHERE name = 'Flash of Genius' AND source = 'ERftLW')
  ], false, 3),
  ((SELECT id FROM artificer), 8, ARRAY[]::uuid[], true, 3),
  ((SELECT id FROM artificer), 9, ARRAY[]::uuid[], false, 4),
  ((SELECT id FROM artificer), 10, ARRAY[
    (SELECT id FROM public.class_features WHERE name = 'Magic Item Adept' AND source = 'ERftLW')
  ], false, 4),
  ((SELECT id FROM artificer), 11, ARRAY[
    (SELECT id FROM public.class_features WHERE name = 'Spell-Storing Item' AND source = 'ERftLW')
  ], false, 4),
  ((SELECT id FROM artificer), 12, ARRAY[]::uuid[], true, 4),
  ((SELECT id FROM artificer), 13, ARRAY[]::uuid[], false, 5),
  ((SELECT id FROM artificer), 14, ARRAY[
    (SELECT id FROM public.class_features WHERE name = 'Magic Item Savant' AND source = 'ERftLW')
  ], false, 5),
  ((SELECT id FROM artificer), 15, ARRAY[]::uuid[], false, 5),
  ((SELECT id FROM artificer), 16, ARRAY[]::uuid[], true, 5),
  ((SELECT id FROM artificer), 17, ARRAY[]::uuid[], false, 6),
  ((SELECT id FROM artificer), 18, ARRAY[
    (SELECT id FROM public.class_features WHERE name = 'Magic Item Master' AND source = 'ERftLW')
  ], false, 6),
  ((SELECT id FROM artificer), 19, ARRAY[]::uuid[], true, 6),
  ((SELECT id FROM artificer), 20, ARRAY[
    (SELECT id FROM public.class_features WHERE name = 'Soul of Artifice' AND source = 'ERftLW')
  ], false, 6)
ON CONFLICT (class_id, level) DO UPDATE SET
  features = EXCLUDED.features,
  asi_available = EXCLUDED.asi_available,
  proficiency_bonus = EXCLUDED.proficiency_bonus;

WITH artificer AS (
  SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW'
)
INSERT INTO public.spell_slot_tables (class_id, level, slots_by_spell_level)
VALUES
  ((SELECT id FROM artificer), 1, ARRAY[2]),
  ((SELECT id FROM artificer), 2, ARRAY[2]),
  ((SELECT id FROM artificer), 3, ARRAY[3]),
  ((SELECT id FROM artificer), 4, ARRAY[3]),
  ((SELECT id FROM artificer), 5, ARRAY[4,2]),
  ((SELECT id FROM artificer), 6, ARRAY[4,2]),
  ((SELECT id FROM artificer), 7, ARRAY[4,3]),
  ((SELECT id FROM artificer), 8, ARRAY[4,3]),
  ((SELECT id FROM artificer), 9, ARRAY[4,3,2]),
  ((SELECT id FROM artificer), 10, ARRAY[4,3,2]),
  ((SELECT id FROM artificer), 11, ARRAY[4,3,3]),
  ((SELECT id FROM artificer), 12, ARRAY[4,3,3]),
  ((SELECT id FROM artificer), 13, ARRAY[4,3,3,1]),
  ((SELECT id FROM artificer), 14, ARRAY[4,3,3,1]),
  ((SELECT id FROM artificer), 15, ARRAY[4,3,3,2]),
  ((SELECT id FROM artificer), 16, ARRAY[4,3,3,2]),
  ((SELECT id FROM artificer), 17, ARRAY[4,3,3,3,1]),
  ((SELECT id FROM artificer), 18, ARRAY[4,3,3,3,1]),
  ((SELECT id FROM artificer), 19, ARRAY[4,3,3,3,2]),
  ((SELECT id FROM artificer), 20, ARRAY[4,3,3,3,2])
ON CONFLICT (class_id, level) DO UPDATE SET
  slots_by_spell_level = EXCLUDED.slots_by_spell_level;

INSERT INTO public.subclasses (name, class_id, choice_level, source)
VALUES
  ('Alchemist', (SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW'), 3, 'ERftLW'),
  ('Artillerist', (SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW'), 3, 'ERftLW'),
  ('Battle Smith', (SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW'), 3, 'ERftLW')
ON CONFLICT (name, class_id, source) DO UPDATE SET
  choice_level = EXCLUDED.choice_level;

INSERT INTO public.subclass_features (subclass_id, name, level, description, source)
VALUES
  ((SELECT id FROM public.subclasses WHERE name = 'Alchemist' AND source = 'ERftLW'), 'Tool Proficiency', 3, 'Gain proficiency with alchemist''s supplies or another artisan''s tool.', 'ERftLW'),
  ((SELECT id FROM public.subclasses WHERE name = 'Alchemist' AND source = 'ERftLW'), 'Alchemist Spells', 3, 'Always have your Alchemist bonus spells prepared.', 'ERftLW'),
  ((SELECT id FROM public.subclasses WHERE name = 'Alchemist' AND source = 'ERftLW'), 'Experimental Elixir', 3, 'Create random or chosen magical elixirs after resting or by expending spell slots.', 'ERftLW'),
  ((SELECT id FROM public.subclasses WHERE name = 'Alchemist' AND source = 'ERftLW'), 'Alchemical Savant', 5, 'Add Intelligence to one healing or qualifying damage roll through alchemist''s supplies.', 'ERftLW'),
  ((SELECT id FROM public.subclasses WHERE name = 'Alchemist' AND source = 'ERftLW'), 'Restorative Reagents', 9, 'Elixirs grant temporary hit points and lesser restoration becomes easier to use.', 'ERftLW'),
  ((SELECT id FROM public.subclasses WHERE name = 'Alchemist' AND source = 'ERftLW'), 'Chemical Mastery', 15, 'Gain acid and poison resilience and cast curative spells through alchemist''s supplies.', 'ERftLW'),
  ((SELECT id FROM public.subclasses WHERE name = 'Artillerist' AND source = 'ERftLW'), 'Tool Proficiency', 3, 'Gain proficiency with woodcarver''s tools or another artisan''s tool.', 'ERftLW'),
  ((SELECT id FROM public.subclasses WHERE name = 'Artillerist' AND source = 'ERftLW'), 'Artillerist Spells', 3, 'Always have your Artillerist bonus spells prepared.', 'ERftLW'),
  ((SELECT id FROM public.subclasses WHERE name = 'Artillerist' AND source = 'ERftLW'), 'Eldritch Cannon', 3, 'Create magical cannons with flamethrower, ballista, or protector modes.', 'ERftLW'),
  ((SELECT id FROM public.subclasses WHERE name = 'Artillerist' AND source = 'ERftLW'), 'Arcane Firearm', 5, 'Turn a wand, staff, or rod into an arcane firearm that boosts spell damage.', 'ERftLW'),
  ((SELECT id FROM public.subclasses WHERE name = 'Artillerist' AND source = 'ERftLW'), 'Explosive Cannon', 9, 'Cannons deal extra damage and can self-destruct in a larger blast.', 'ERftLW'),
  ((SELECT id FROM public.subclasses WHERE name = 'Artillerist' AND source = 'ERftLW'), 'Fortified Position', 15, 'Command two cannons at once and grant cover near them.', 'ERftLW'),
  ((SELECT id FROM public.subclasses WHERE name = 'Battle Smith' AND source = 'ERftLW'), 'Tool Proficiency', 3, 'Gain proficiency with smith''s tools or another artisan''s tool.', 'ERftLW'),
  ((SELECT id FROM public.subclasses WHERE name = 'Battle Smith' AND source = 'ERftLW'), 'Battle Smith Spells', 3, 'Always have your Battle Smith bonus spells prepared.', 'ERftLW'),
  ((SELECT id FROM public.subclasses WHERE name = 'Battle Smith' AND source = 'ERftLW'), 'Battle Ready', 3, 'Gain martial weapon proficiency and attack with magic weapons using Intelligence.', 'ERftLW'),
  ((SELECT id FROM public.subclasses WHERE name = 'Battle Smith' AND source = 'ERftLW'), 'Steel Defender', 3, 'Build a steel defender companion that acts on your turn.', 'ERftLW'),
  ((SELECT id FROM public.subclasses WHERE name = 'Battle Smith' AND source = 'ERftLW'), 'Extra Attack', 5, 'Attack twice when you take the Attack action.', 'ERftLW'),
  ((SELECT id FROM public.subclasses WHERE name = 'Battle Smith' AND source = 'ERftLW'), 'Arcane Jolt', 9, 'Channel force or healing through weapon hits a limited number of times per day.', 'ERftLW'),
  ((SELECT id FROM public.subclasses WHERE name = 'Battle Smith' AND source = 'ERftLW'), 'Improved Defender', 15, 'Empower Arcane Jolt and improve the steel defender''s defenses.', 'ERftLW')
ON CONFLICT (subclass_id, name, level) DO UPDATE SET
  description = EXCLUDED.description,
  source = EXCLUDED.source;

INSERT INTO public.spells (
  name, level, school, casting_time, range, components, duration, concentration, ritual, description, classes, source
)
VALUES
  ('Acid Splash', 0, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Create Bonfire', 0, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Dancing Lights', 0, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Fire Bolt', 0, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Frostbite', 0, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Guidance', 0, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Light', 0, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Mage Hand', 0, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Magic Stone', 0, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Mending', 0, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Message', 0, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Poison Spray', 0, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Prestidigitation', 0, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Ray of Frost', 0, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Resistance', 0, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Shocking Grasp', 0, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Spare the Dying', 0, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Thorn Whip', 0, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Thunderclap', 0, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Absorb Elements', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Alarm', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, true, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Catapult', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Cure Wounds', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Detect Magic', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, true, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Disguise Self', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Expeditious Retreat', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Faerie Fire', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('False Life', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Feather Fall', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Grease', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Identify', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, true, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Jump', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Longstrider', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Purify Food and Drink', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, true, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Sanctuary', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Snare', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Aid', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Alter Self', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Arcane Lock', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Blur', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Continual Flame', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Darkvision', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Enhance Ability', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Enlarge/Reduce', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Heat Metal', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Invisibility', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Lesser Restoration', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Magic Mouth', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Protection from Poison', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Pyrotechnics', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Rope Trick', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('See Invisibility', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Skywrite', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, true, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Spider Climb', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Web', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Blink', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Catnap', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Create Food and Water', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Dispel Magic', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Elemental Weapon', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Flame Arrows', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Fly', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Glyph of Warding', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Haste', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Protection from Energy', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Revivify', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Tiny Servant', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Water Breathing', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, true, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Water Walk', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, true, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Arcane Eye', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Elemental Bane', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Fabricate', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Freedom of Movement', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Leomund''s Secret Chest', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Mordenkainen''s Faithful Hound', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Otiluke''s Resilient Sphere', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Stone Shape', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Stoneskin', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Animate Objects', 5, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Creation', 5, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Greater Restoration', 5, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Skill Empowerment', 5, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Wall of Stone', 5, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Artificer spell list entry from ERftLW.', ARRAY[(SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW')], 'ERftLW'),
  ('Healing Word', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Subclass spell entry for Artificer support from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Ray of Sickness', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Subclass spell entry for Artificer support from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Flaming Sphere', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Subclass spell entry for Artificer support from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Melf''s Acid Arrow', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Subclass spell entry for Artificer support from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Gaseous Form', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Subclass spell entry for Artificer support from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Mass Healing Word', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Subclass spell entry for Artificer support from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Blight', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Subclass spell entry for Artificer support from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Death Ward', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Subclass spell entry for Artificer support from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Cloudkill', 5, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Subclass spell entry for Artificer support from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Raise Dead', 5, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Subclass spell entry for Artificer support from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Shield', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Subclass spell entry for Artificer support from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Thunderwave', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Subclass spell entry for Artificer support from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Scorching Ray', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Subclass spell entry for Artificer support from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Shatter', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Subclass spell entry for Artificer support from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Fireball', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Subclass spell entry for Artificer support from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Wind Wall', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Subclass spell entry for Artificer support from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Ice Storm', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Subclass spell entry for Artificer support from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Wall of Fire', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Subclass spell entry for Artificer support from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Cone of Cold', 5, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Subclass spell entry for Artificer support from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Wall of Force', 5, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Subclass spell entry for Artificer support from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Heroism', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Subclass spell entry for Artificer support from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Branding Smite', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Subclass spell entry for Artificer support from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Warding Bond', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Subclass spell entry for Artificer support from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Aura of Vitality', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Subclass spell entry for Artificer support from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Conjure Barrage', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Subclass spell entry for Artificer support from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Aura of Purity', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Subclass spell entry for Artificer support from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Fire Shield', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Subclass spell entry for Artificer support from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Banishing Smite', 5, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Subclass spell entry for Artificer support from ERftLW.', ARRAY[]::uuid[], 'ERftLW'),
  ('Mass Cure Wounds', 5, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Subclass spell entry for Artificer support from ERftLW.', ARRAY[]::uuid[], 'ERftLW')
ON CONFLICT (name, source) DO UPDATE SET
  level = EXCLUDED.level,
  classes = EXCLUDED.classes;

INSERT INTO public.subclass_bonus_spells (
  subclass_id,
  spell_id,
  required_class_level,
  counts_against_selection_limit
)
VALUES
  ((SELECT id FROM public.subclasses WHERE name = 'Alchemist' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Healing Word' AND source = 'ERftLW'), 3, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Alchemist' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Ray of Sickness' AND source = 'ERftLW'), 3, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Alchemist' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Flaming Sphere' AND source = 'ERftLW'), 5, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Alchemist' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Melf''s Acid Arrow' AND source = 'ERftLW'), 5, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Alchemist' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Gaseous Form' AND source = 'ERftLW'), 9, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Alchemist' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Mass Healing Word' AND source = 'ERftLW'), 9, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Alchemist' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Blight' AND source = 'ERftLW'), 13, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Alchemist' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Death Ward' AND source = 'ERftLW'), 13, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Alchemist' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Cloudkill' AND source = 'ERftLW'), 17, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Alchemist' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Raise Dead' AND source = 'ERftLW'), 17, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Artillerist' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Shield' AND source = 'ERftLW'), 3, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Artillerist' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Thunderwave' AND source = 'ERftLW'), 3, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Artillerist' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Scorching Ray' AND source = 'ERftLW'), 5, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Artillerist' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Shatter' AND source = 'ERftLW'), 5, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Artillerist' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Fireball' AND source = 'ERftLW'), 9, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Artillerist' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Wind Wall' AND source = 'ERftLW'), 9, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Artillerist' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Ice Storm' AND source = 'ERftLW'), 13, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Artillerist' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Wall of Fire' AND source = 'ERftLW'), 13, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Artillerist' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Cone of Cold' AND source = 'ERftLW'), 17, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Artillerist' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Wall of Force' AND source = 'ERftLW'), 17, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Battle Smith' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Heroism' AND source = 'ERftLW'), 3, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Battle Smith' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Shield' AND source = 'ERftLW'), 3, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Battle Smith' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Branding Smite' AND source = 'ERftLW'), 5, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Battle Smith' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Warding Bond' AND source = 'ERftLW'), 5, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Battle Smith' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Aura of Vitality' AND source = 'ERftLW'), 9, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Battle Smith' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Conjure Barrage' AND source = 'ERftLW'), 9, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Battle Smith' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Aura of Purity' AND source = 'ERftLW'), 13, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Battle Smith' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Fire Shield' AND source = 'ERftLW'), 13, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Battle Smith' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Banishing Smite' AND source = 'ERftLW'), 17, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Battle Smith' AND source = 'ERftLW'), (SELECT id FROM public.spells WHERE name = 'Mass Cure Wounds' AND source = 'ERftLW'), 17, false)
ON CONFLICT (subclass_id, spell_id, required_class_level) DO UPDATE SET
  counts_against_selection_limit = EXCLUDED.counts_against_selection_limit;
