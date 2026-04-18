-- PHB 2014 content pass, slice 1:
-- add core PHB backgrounds and feat catalog rows beyond SRD coverage.
--
-- Descriptions are intentionally concise builder-facing summaries rather than
-- long source-text transcriptions. More detailed automation for complex feats
-- remains follow-up work.

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
VALUES
  ('Charlatan', ARRAY['Deception', 'Sleight of Hand'], 0, ARRAY[]::text[], ARRAY['Disguise Kit', 'Forgery Kit'], ARRAY[]::text[], '[]'::jsonb, NULL, 'False Identity: maintain a believable second persona and supporting papers.', NULL, 'PHB', true, 'Background package and longer feature text are pending a later PHB equipment/detail pass.'),
  ('Criminal', ARRAY['Deception', 'Stealth'], 0, ARRAY[]::text[], ARRAY['Gaming Set', 'Thieves'' Tools'], ARRAY[]::text[], '[]'::jsonb, NULL, 'Criminal Contact: you can reach an underworld contact to pass messages and arrange quiet help.', NULL, 'PHB', true, 'Background package and longer feature text are pending a later PHB equipment/detail pass.'),
  ('Entertainer', ARRAY['Acrobatics', 'Performance'], 0, ARRAY[]::text[], ARRAY['Disguise Kit', 'Any one musical instrument'], ARRAY[]::text[], '[]'::jsonb, NULL, 'By Popular Demand: you can usually secure food and lodging by performing publicly.', NULL, 'PHB', true, 'Background package and longer feature text are pending a later PHB equipment/detail pass.'),
  ('Folk Hero', ARRAY['Animal Handling', 'Survival'], 0, ARRAY[]::text[], ARRAY['Artisan''s Tools', 'Vehicles (land)'], ARRAY[]::text[], '[]'::jsonb, NULL, 'Rustic Hospitality: common folk are inclined to shelter and support you.', NULL, 'PHB', true, 'Background package and longer feature text are pending a later PHB equipment/detail pass.'),
  ('Guild Artisan', ARRAY['Insight', 'Persuasion'], 0, ARRAY[]::text[], ARRAY['Any one artisan''s tools'], ARRAY['One language of your choice'], '[]'::jsonb, NULL, 'Guild Membership: your guild provides recognition, contacts, and modest support.', NULL, 'PHB', true, 'Background package and longer feature text are pending a later PHB equipment/detail pass.'),
  ('Hermit', ARRAY['Medicine', 'Religion'], 0, ARRAY[]::text[], ARRAY['Herbalism Kit'], ARRAY['One language of your choice'], '[]'::jsonb, NULL, 'Discovery: you carry a significant insight learned during long isolation.', NULL, 'PHB', true, 'Background package and longer feature text are pending a later PHB equipment/detail pass.'),
  ('Noble', ARRAY['History', 'Persuasion'], 0, ARRAY[]::text[], ARRAY['Gaming Set'], ARRAY['One language of your choice'], '[]'::jsonb, NULL, 'Position of Privilege: high society usually recognizes your rank and courtesy claims.', NULL, 'PHB', true, 'Background package and longer feature text are pending a later PHB equipment/detail pass.'),
  ('Outlander', ARRAY['Athletics', 'Survival'], 0, ARRAY[]::text[], ARRAY['Musical Instrument'], ARRAY['One language of your choice'], '[]'::jsonb, NULL, 'Wanderer: you are excellent at recalling terrain and finding food and water.', NULL, 'PHB', true, 'Background package and longer feature text are pending a later PHB equipment/detail pass.'),
  ('Sage', ARRAY['Arcana', 'History'], 0, ARRAY[]::text[], ARRAY[]::text[], ARRAY['Two languages of your choice'], '[]'::jsonb, NULL, 'Researcher: you usually know where to find lore you do not already possess.', NULL, 'PHB', true, 'Background package and longer feature text are pending a later PHB equipment/detail pass.'),
  ('Sailor', ARRAY['Athletics', 'Perception'], 0, ARRAY[]::text[], ARRAY['Navigator''s Tools', 'Vehicles (water)'], ARRAY[]::text[], '[]'::jsonb, NULL, 'Ship''s Passage: friendly crews can usually help you travel by sea.', NULL, 'PHB', true, 'Background package and longer feature text are pending a later PHB equipment/detail pass.'),
  ('Soldier', ARRAY['Athletics', 'Intimidation'], 0, ARRAY[]::text[], ARRAY['Gaming Set', 'Vehicles (land)'], ARRAY[]::text[], '[]'::jsonb, NULL, 'Military Rank: soldiers recognize your authority and experience.', NULL, 'PHB', true, 'Background package and longer feature text are pending a later PHB equipment/detail pass.'),
  ('Urchin', ARRAY['Sleight of Hand', 'Stealth'], 0, ARRAY[]::text[], ARRAY['Disguise Kit', 'Thieves'' Tools'], ARRAY[]::text[], '[]'::jsonb, NULL, 'City Secrets: you know hidden routes through urban settlements.', NULL, 'PHB', true, 'Background package and longer feature text are pending a later PHB equipment/detail pass.')
ON CONFLICT (name, source) DO UPDATE
SET
  skill_proficiencies = EXCLUDED.skill_proficiencies,
  skill_choice_count = EXCLUDED.skill_choice_count,
  skill_choice_from = EXCLUDED.skill_choice_from,
  tool_proficiencies = EXCLUDED.tool_proficiencies,
  languages = EXCLUDED.languages,
  feature = EXCLUDED.feature,
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
VALUES
  ('Actor', '[]'::jsonb, 'Improve social mimicry and stagecraft, with a Charisma increase.', '{"ability_score_increase":{"cha":1}}'::jsonb, 'PHB', false, NULL),
  ('Alert', '[]'::jsonb, 'You are hard to surprise and quicker to react in danger.', '{}'::jsonb, 'PHB', true, 'Initiative and surprise handling are not yet automated on the sheet.'),
  ('Athlete', '[]'::jsonb, 'Enhance physical mobility and recovery, with a Strength or Dexterity increase.', '{}'::jsonb, 'PHB', true, 'Choice of ability increase is not yet modeled as an interactive feat option.'),
  ('Charger', '[]'::jsonb, 'Trade a dash-into-strike turn for a stronger shove or melee hit.', '{}'::jsonb, 'PHB', true, 'Combat-turn rider effects are not yet automated.'),
  ('Crossbow Expert', '[]'::jsonb, 'Ignore several crossbow handling limits and fight effectively in close range.', '{}'::jsonb, 'PHB', true, 'Weapon-property combat exceptions are not yet automated.'),
  ('Defensive Duelist', '[{"type":"ability","ability":"dex","min":13}]'::jsonb, 'Use finesse-weapon skill to raise defense against one melee attack.', '{}'::jsonb, 'PHB', true, 'Reaction-based AC adjustments are not yet automated.'),
  ('Dual Wielder', '[]'::jsonb, 'Fight with larger paired weapons and draw them more freely.', '{}'::jsonb, 'PHB', true, 'Dual-wield combat modifiers are not yet automated.'),
  ('Dungeon Delver', '[]'::jsonb, 'You are adept at spotting and surviving traps and secret hazards.', '{}'::jsonb, 'PHB', true, 'Trap-specific exploration modifiers are not yet automated.'),
  ('Durable', '[]'::jsonb, 'Improve toughness and recover more reliably during short rests.', '{"ability_score_increase":{"con":1}}'::jsonb, 'PHB', true, 'Hit-die recovery floor is not yet automated.'),
  ('Elemental Adept', '[]'::jsonb, 'Specialize in one damage element so your spells overcome part of its resistance.', '{}'::jsonb, 'PHB', true, 'Damage-type choice and spell-damage overrides are not yet automated.'),
  ('Grappler', '[{"type":"ability","ability":"str","min":13}]'::jsonb, 'Excel at wrestling foes and pinning restrained targets.', '{}'::jsonb, 'PHB', true, 'Grapple-state combat modifiers are not yet automated.'),
  ('Great Weapon Master', '[]'::jsonb, 'Trade accuracy for power and gain follow-up attacks after heavy hits.', '{}'::jsonb, 'PHB', true, 'Attack-roll and bonus-attack combat effects are not yet automated.'),
  ('Healer', '[]'::jsonb, 'Turn healer''s kits into more effective battlefield treatment.', '{}'::jsonb, 'PHB', true, 'Item-based healing bonuses are not yet automated.'),
  ('Heavily Armored', '[{"type":"proficiency","proficiency":"Medium Armor"}]'::jsonb, 'Gain heavy armor training and a Strength increase.', '{"ability_score_increase":{"str":1}}'::jsonb, 'PHB', false, NULL),
  ('Heavy Armor Master', '[{"type":"proficiency","proficiency":"Heavy Armor"}]'::jsonb, 'Gain a Strength increase and reduce incoming mundane weapon damage while heavily armored.', '{"ability_score_increase":{"str":1}}'::jsonb, 'PHB', true, 'Flat weapon-damage reduction is not yet automated.'),
  ('Inspiring Leader', '[{"type":"ability","ability":"cha","min":13}]'::jsonb, 'Grant allies temporary hit points with a motivating speech.', '{}'::jsonb, 'PHB', true, 'Party-wide temporary hit point grants are not yet automated.'),
  ('Keen Mind', '[]'::jsonb, 'Sharpen recall, orientation, and analysis with an Intelligence increase.', '{"ability_score_increase":{"int":1}}'::jsonb, 'PHB', false, NULL),
  ('Lightly Armored', '[]'::jsonb, 'Gain light armor training and a Strength or Dexterity increase.', '{}'::jsonb, 'PHB', true, 'Choice of ability increase is not yet modeled as an interactive feat option.'),
  ('Linguist', '[]'::jsonb, 'Improve language study and code-making with an Intelligence increase.', '{"ability_score_increase":{"int":1}}'::jsonb, 'PHB', true, 'Extra language picks and cipher utility are not yet automated.'),
  ('Lucky', '[]'::jsonb, 'Spend luck points to improve rolls or foil attacks against you.', '{}'::jsonb, 'PHB', true, 'Luck point tracking and reroll flow are not yet automated.'),
  ('Mage Slayer', '[]'::jsonb, 'Pressure nearby spellcasters and resist their concentration and defenses.', '{}'::jsonb, 'PHB', true, 'Reaction attacks and concentration riders are not yet automated.'),
  ('Magic Initiate', '[]'::jsonb, 'Learn two cantrips and one 1st-level spell from a chosen class list.', '{}'::jsonb, 'PHB', true, 'Class-list choice and granted spell picks are not yet modeled as interactive feat options.'),
  ('Martial Adept', '[]'::jsonb, 'Learn battle maneuvers and gain a superiority die.', '{}'::jsonb, 'PHB', true, 'Maneuver selection and superiority-die tracking are not yet automated.'),
  ('Medium Armor Master', '[{"type":"proficiency","proficiency":"Medium Armor"}]'::jsonb, 'Use medium armor more effectively with stealth and Dexterity improvements.', '{}'::jsonb, 'PHB', true, 'Medium-armor AC and stealth exceptions are not yet automated.'),
  ('Mobile', '[]'::jsonb, 'Move faster and slip away from enemies you attack.', '{}'::jsonb, 'PHB', true, 'Speed and disengage-like attack riders are not yet automated.'),
  ('Moderately Armored', '[{"type":"proficiency","proficiency":"Light Armor"}]'::jsonb, 'Gain medium armor and shield training with a Strength or Dexterity increase.', '{}'::jsonb, 'PHB', true, 'Choice of ability increase is not yet modeled as an interactive feat option.'),
  ('Mounted Combatant', '[]'::jsonb, 'Protect your mount and gain advantages while fighting from the saddle.', '{}'::jsonb, 'PHB', true, 'Mounted-combat situational effects are not yet automated.'),
  ('Observant', '[]'::jsonb, 'Notice more detail and read lips more easily, with a mental ability increase.', '{}'::jsonb, 'PHB', true, 'Choice of ability increase and passive-perception bonuses are not yet fully automated.'),
  ('Polearm Master', '[]'::jsonb, 'Gain extra attacks and control space with hafted weapons.', '{}'::jsonb, 'PHB', true, 'Weapon-reach opportunity riders are not yet automated.'),
  ('Resilient', '[]'::jsonb, 'Increase one ability score and gain proficiency in that saving throw.', '{}'::jsonb, 'PHB', true, 'Chosen ability and save proficiency are not yet modeled as an interactive feat option.'),
  ('Ritual Caster', '[]'::jsonb, 'Gain a ritual book and learn ritual spells from a chosen class list.', '{}'::jsonb, 'PHB', true, 'Its mental-ability prerequisite plus class-list and ritual-book choices are not yet automated.'),
  ('Savage Attacker', '[]'::jsonb, 'Reroll a weapon''s damage once each turn and use the better result.', '{}'::jsonb, 'PHB', true, 'Weapon damage reroll handling is not yet automated.'),
  ('Sentinel', '[]'::jsonb, 'Lock enemies in place and punish movement around you.', '{}'::jsonb, 'PHB', true, 'Opportunity-attack and movement-control riders are not yet automated.'),
  ('Sharpshooter', '[]'::jsonb, 'Ignore common ranged penalties and trade accuracy for damage.', '{}'::jsonb, 'PHB', true, 'Ranged attack exceptions and damage tradeoffs are not yet automated.'),
  ('Shield Master', '[]'::jsonb, 'Exploit shield use for offense and defense.', '{}'::jsonb, 'PHB', true, 'Shield shove timing and save interaction are not yet automated.'),
  ('Skilled', '[]'::jsonb, 'Gain broad extra proficiencies of your choice.', '{}'::jsonb, 'PHB', true, 'Open-ended skill/tool proficiency picks are not yet modeled as interactive feat options.'),
  ('Skulker', '[]'::jsonb, 'Hide and snipe more effectively in dim conditions.', '{}'::jsonb, 'PHB', true, 'Stealth and hidden-attack exceptions are not yet automated.'),
  ('Spell Sniper', '[]'::jsonb, 'Extend spell attack reach and learn an extra attack cantrip.', '{}'::jsonb, 'PHB', true, 'Cantrip choice and spell-range overrides are not yet modeled as interactive feat options.'),
  ('Tavern Brawler', '[]'::jsonb, 'Fight well with improvised weapons and gain a Strength or Constitution increase.', '{}'::jsonb, 'PHB', true, 'Ability choice and improvised-weapon grapple rider are not yet automated.'),
  ('Tough', '[]'::jsonb, 'Increase maximum hit points substantially.', '{}'::jsonb, 'PHB', true, 'Persistent feat-based HP bonus is not yet automated.'),
  ('War Caster', '[]'::jsonb, 'Steady your concentration and weapon-in-hand spellcasting.', '{}'::jsonb, 'PHB', true, 'Concentration and opportunity-spell exceptions are not yet automated.'),
  ('Weapon Master', '[]'::jsonb, 'Increase Strength or Dexterity and learn four weapon proficiencies.', '{}'::jsonb, 'PHB', true, 'Ability choice and weapon proficiency picks are not yet modeled as interactive feat options.')
ON CONFLICT (name, source) DO UPDATE
SET
  prerequisites = EXCLUDED.prerequisites,
  description = EXCLUDED.description,
  benefits = EXCLUDED.benefits,
  amended = EXCLUDED.amended,
  amendment_note = EXCLUDED.amendment_note;
