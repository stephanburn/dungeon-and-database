-- PHB 2014 content pass, slice 2:
-- add missing PHB subclasses beyond the current SRD-oriented baseline,
-- along with concise builder-facing feature summaries.
--
-- This slice intentionally focuses on subclasses that are either clearly
-- beyond the current seeded baseline or already fit the current shared
-- subclass/feature model well.

INSERT INTO public.spells (
  name,
  level,
  school,
  casting_time,
  range,
  components,
  duration,
  concentration,
  ritual,
  description,
  classes,
  source,
  amended,
  amendment_note
)
VALUES
  ('Bane', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Subclass spell support entry for PHB subclass content.', ARRAY[]::uuid[], 'PHB', true, 'Placeholder PHB spell row pending the full PHB spell completion pass.'),
  ('Hunter''s Mark', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Subclass spell support entry for PHB subclass content.', ARRAY[]::uuid[], 'PHB', true, 'Placeholder PHB spell row pending the full PHB spell completion pass.'),
  ('Command', 1, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Subclass spell support entry for PHB subclass content.', ARRAY[]::uuid[], 'PHB', true, 'Placeholder PHB spell row pending the full PHB spell completion pass.'),
  ('Hold Person', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Subclass spell support entry for PHB subclass content.', ARRAY[]::uuid[], 'PHB', true, 'Placeholder PHB spell row pending the full PHB spell completion pass.'),
  ('Suggestion', 2, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Subclass spell support entry for PHB subclass content.', ARRAY[]::uuid[], 'PHB', true, 'Placeholder PHB spell row pending the full PHB spell completion pass.'),
  ('Nondetection', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Subclass spell support entry for PHB subclass content.', ARRAY[]::uuid[], 'PHB', true, 'Placeholder PHB spell row pending the full PHB spell completion pass.'),
  ('Speak with Dead', 3, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', false, false, 'Subclass spell support entry for PHB subclass content.', ARRAY[]::uuid[], 'PHB', true, 'Placeholder PHB spell row pending the full PHB spell completion pass.'),
  ('Banishment', 4, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Subclass spell support entry for PHB subclass content.', ARRAY[]::uuid[], 'PHB', true, 'Placeholder PHB spell row pending the full PHB spell completion pass.'),
  ('Hold Monster', 5, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Subclass spell support entry for PHB subclass content.', ARRAY[]::uuid[], 'PHB', true, 'Placeholder PHB spell row pending the full PHB spell completion pass.'),
  ('Scrying', 5, 'Varies', 'Varies', 'Varies', '{}'::jsonb, 'Varies', true, false, 'Subclass spell support entry for PHB subclass content.', ARRAY[]::uuid[], 'PHB', true, 'Placeholder PHB spell row pending the full PHB spell completion pass.')
ON CONFLICT (name, source) DO UPDATE
SET
  level = EXCLUDED.level,
  description = EXCLUDED.description,
  amended = EXCLUDED.amended,
  amendment_note = EXCLUDED.amendment_note;

INSERT INTO public.subclasses (
  name,
  class_id,
  choice_level,
  source,
  amended,
  amendment_note
)
VALUES
  ('Path of the Totem Warrior', (SELECT id FROM public.classes WHERE name = 'Barbarian' AND source IN ('PHB', 'SRD') ORDER BY CASE source WHEN 'PHB' THEN 0 WHEN 'SRD' THEN 1 ELSE 2 END LIMIT 1), 3, 'PHB', false, NULL),
  ('College of Valor', (SELECT id FROM public.classes WHERE name = 'Bard' AND source IN ('PHB', 'SRD') ORDER BY CASE source WHEN 'PHB' THEN 0 WHEN 'SRD' THEN 1 ELSE 2 END LIMIT 1), 3, 'PHB', false, NULL),
  ('Knowledge Domain', (SELECT id FROM public.classes WHERE name = 'Cleric' AND source IN ('PHB', 'SRD') ORDER BY CASE source WHEN 'PHB' THEN 0 WHEN 'SRD' THEN 1 ELSE 2 END LIMIT 1), 1, 'PHB', false, NULL),
  ('Way of Shadow', (SELECT id FROM public.classes WHERE name = 'Monk' AND source IN ('PHB', 'SRD') ORDER BY CASE source WHEN 'PHB' THEN 0 WHEN 'SRD' THEN 1 ELSE 2 END LIMIT 1), 3, 'PHB', false, NULL),
  ('Way of the Four Elements', (SELECT id FROM public.classes WHERE name = 'Monk' AND source IN ('PHB', 'SRD') ORDER BY CASE source WHEN 'PHB' THEN 0 WHEN 'SRD' THEN 1 ELSE 2 END LIMIT 1), 3, 'PHB', true, 'Elemental discipline option selection is not yet modeled in the builder.'),
  ('Oath of Vengeance', (SELECT id FROM public.classes WHERE name = 'Paladin' AND source IN ('PHB', 'SRD') ORDER BY CASE source WHEN 'PHB' THEN 0 WHEN 'SRD' THEN 1 ELSE 2 END LIMIT 1), 3, 'PHB', false, NULL),
  ('Beast Master', (SELECT id FROM public.classes WHERE name = 'Ranger' AND source IN ('PHB', 'SRD') ORDER BY CASE source WHEN 'PHB' THEN 0 WHEN 'SRD' THEN 1 ELSE 2 END LIMIT 1), 3, 'PHB', true, 'Animal companion actions and stat block management are not yet automated.'),
  ('Assassin', (SELECT id FROM public.classes WHERE name = 'Rogue' AND source IN ('PHB', 'SRD') ORDER BY CASE source WHEN 'PHB' THEN 0 WHEN 'SRD' THEN 1 ELSE 2 END LIMIT 1), 3, 'PHB', false, NULL),
  ('Arcane Trickster', (SELECT id FROM public.classes WHERE name = 'Rogue' AND source IN ('PHB', 'SRD') ORDER BY CASE source WHEN 'PHB' THEN 0 WHEN 'SRD' THEN 1 ELSE 2 END LIMIT 1), 3, 'PHB', true, 'Arcane Trickster spellcasting restrictions are not yet fully modeled.'),
  ('Wild Magic', (SELECT id FROM public.classes WHERE name = 'Sorcerer' AND source IN ('PHB', 'SRD') ORDER BY CASE source WHEN 'PHB' THEN 0 WHEN 'SRD' THEN 1 ELSE 2 END LIMIT 1), 1, 'PHB', true, 'Wild Magic surge behavior is not yet automated.'),
  ('The Archfey', (SELECT id FROM public.classes WHERE name = 'Warlock' AND source IN ('PHB', 'SRD') ORDER BY CASE source WHEN 'PHB' THEN 0 WHEN 'SRD' THEN 1 ELSE 2 END LIMIT 1), 1, 'PHB', true, 'Expanded patron spell-list handling is not yet modeled separately from bonus-spell grants.'),
  ('The Great Old One', (SELECT id FROM public.classes WHERE name = 'Warlock' AND source IN ('PHB', 'SRD') ORDER BY CASE source WHEN 'PHB' THEN 0 WHEN 'SRD' THEN 1 ELSE 2 END LIMIT 1), 1, 'PHB', true, 'Expanded patron spell-list handling is not yet modeled separately from bonus-spell grants.'),
  ('School of Abjuration', (SELECT id FROM public.classes WHERE name = 'Wizard' AND source IN ('PHB', 'SRD') ORDER BY CASE source WHEN 'PHB' THEN 0 WHEN 'SRD' THEN 1 ELSE 2 END LIMIT 1), 2, 'PHB', false, NULL),
  ('School of Conjuration', (SELECT id FROM public.classes WHERE name = 'Wizard' AND source IN ('PHB', 'SRD') ORDER BY CASE source WHEN 'PHB' THEN 0 WHEN 'SRD' THEN 1 ELSE 2 END LIMIT 1), 2, 'PHB', false, NULL),
  ('School of Divination', (SELECT id FROM public.classes WHERE name = 'Wizard' AND source IN ('PHB', 'SRD') ORDER BY CASE source WHEN 'PHB' THEN 0 WHEN 'SRD' THEN 1 ELSE 2 END LIMIT 1), 2, 'PHB', false, NULL),
  ('School of Enchantment', (SELECT id FROM public.classes WHERE name = 'Wizard' AND source IN ('PHB', 'SRD') ORDER BY CASE source WHEN 'PHB' THEN 0 WHEN 'SRD' THEN 1 ELSE 2 END LIMIT 1), 2, 'PHB', false, NULL),
  ('School of Illusion', (SELECT id FROM public.classes WHERE name = 'Wizard' AND source IN ('PHB', 'SRD') ORDER BY CASE source WHEN 'PHB' THEN 0 WHEN 'SRD' THEN 1 ELSE 2 END LIMIT 1), 2, 'PHB', false, NULL),
  ('School of Transmutation', (SELECT id FROM public.classes WHERE name = 'Wizard' AND source IN ('PHB', 'SRD') ORDER BY CASE source WHEN 'PHB' THEN 0 WHEN 'SRD' THEN 1 ELSE 2 END LIMIT 1), 2, 'PHB', false, NULL)
ON CONFLICT (name, class_id, source) DO UPDATE SET
  choice_level = EXCLUDED.choice_level,
  amended = EXCLUDED.amended,
  amendment_note = EXCLUDED.amendment_note;

INSERT INTO public.subclass_features (
  subclass_id,
  name,
  level,
  description,
  source,
  amended,
  amendment_note
)
VALUES
  ((SELECT id FROM public.subclasses WHERE name = 'Path of the Totem Warrior' AND source = 'PHB'), 'Spirit Seeker', 3, 'Gain ritual access to beast-focused magic that supports the totem path.', 'PHB', false, NULL),
  ((SELECT id FROM public.subclasses WHERE name = 'Path of the Totem Warrior' AND source = 'PHB'), 'Totem Spirit', 3, 'Choose a totem spirit that grants a rage-linked combat benefit.', 'PHB', true, 'Totem spirit option selection is not yet modeled in the builder.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Path of the Totem Warrior' AND source = 'PHB'), 'Aspect of the Beast', 6, 'Gain an exploration or movement benefit based on a chosen beast aspect.', 'PHB', true, 'Totem aspect option selection is not yet modeled in the builder.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Path of the Totem Warrior' AND source = 'PHB'), 'Spirit Walker', 10, 'Commune with nature spirits to seek guidance through ritual magic.', 'PHB', false, NULL),
  ((SELECT id FROM public.subclasses WHERE name = 'Path of the Totem Warrior' AND source = 'PHB'), 'Totemic Attunement', 14, 'Gain a powerful rage-linked capstone based on your chosen totem.', 'PHB', true, 'Totemic attunement option selection is not yet modeled in the builder.'),

  ((SELECT id FROM public.subclasses WHERE name = 'College of Valor' AND source = 'PHB'), 'Bonus Proficiencies', 3, 'Gain martial weapon, medium armor, and shield training.', 'PHB', false, NULL),
  ((SELECT id FROM public.subclasses WHERE name = 'College of Valor' AND source = 'PHB'), 'Combat Inspiration', 3, 'Use Bardic Inspiration to boost damage or improve defense.', 'PHB', true, 'Combat Inspiration reaction timing is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'College of Valor' AND source = 'PHB'), 'Extra Attack', 6, 'Attack twice when you take the Attack action.', 'PHB', false, NULL),
  ((SELECT id FROM public.subclasses WHERE name = 'College of Valor' AND source = 'PHB'), 'Battle Magic', 14, 'Cast a bard spell and make a weapon attack as a bonus action.', 'PHB', true, 'Action-economy interaction is not yet automated.'),

  ((SELECT id FROM public.subclasses WHERE name = 'Knowledge Domain' AND source = 'PHB'), 'Knowledge Domain Spells', 1, 'Always have the domain''s knowledge-themed spells prepared.', 'PHB', false, NULL),
  ((SELECT id FROM public.subclasses WHERE name = 'Knowledge Domain' AND source = 'PHB'), 'Blessings of Knowledge', 1, 'Gain extra languages and expertise-like benefits in chosen knowledge skills.', 'PHB', true, 'Language and skill selection from this feature are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Knowledge Domain' AND source = 'PHB'), 'Channel Divinity: Knowledge of the Ages', 2, 'Temporarily gain proficiency in any skill or tool.', 'PHB', true, 'Temporary proficiency effects are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Knowledge Domain' AND source = 'PHB'), 'Channel Divinity: Read Thoughts', 6, 'Read a creature''s surface thoughts and suggest a course of action.', 'PHB', true, 'Mind-reading and suggestion effects are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Knowledge Domain' AND source = 'PHB'), 'Potent Spellcasting', 8, 'Add Wisdom modifier to cleric cantrip damage.', 'PHB', true, 'Subclass cantrip-damage riders are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Knowledge Domain' AND source = 'PHB'), 'Visions of the Past', 17, 'Read psychic echoes from objects or places.', 'PHB', true, 'Narrative divination effects are not yet automated.'),

  ((SELECT id FROM public.subclasses WHERE name = 'Way of Shadow' AND source = 'PHB'), 'Shadow Arts', 3, 'Spend ki to cast shadow-themed utility magic and gain a stealth cantrip.', 'PHB', true, 'Spell and cantrip grants from Shadow Arts are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Way of Shadow' AND source = 'PHB'), 'Shadow Step', 6, 'Teleport between dimly lit areas and gain advantage on the next melee attack.', 'PHB', true, 'Teleport and attack-rider behavior are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Way of Shadow' AND source = 'PHB'), 'Cloak of Shadows', 11, 'Become invisible in dim light or darkness while standing still.', 'PHB', true, 'Conditional invisibility is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Way of Shadow' AND source = 'PHB'), 'Opportunist', 17, 'Exploit nearby enemies'' openings with a reaction strike.', 'PHB', true, 'Reaction attack timing is not yet automated.'),

  ((SELECT id FROM public.subclasses WHERE name = 'Way of the Four Elements' AND source = 'PHB'), 'Disciple of the Elements', 3, 'Learn elemental disciplines fueled by ki.', 'PHB', true, 'Elemental discipline selection is not yet modeled in the builder.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Way of the Four Elements' AND source = 'PHB'), 'Elemental Disciplines', 6, 'Expand your available elemental discipline choices.', 'PHB', true, 'Elemental discipline selection is not yet modeled in the builder.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Way of the Four Elements' AND source = 'PHB'), 'Elemental Disciplines', 11, 'Expand your available elemental discipline choices.', 'PHB', true, 'Elemental discipline selection is not yet modeled in the builder.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Way of the Four Elements' AND source = 'PHB'), 'Elemental Disciplines', 17, 'Expand your available elemental discipline choices.', 'PHB', true, 'Elemental discipline selection is not yet modeled in the builder.'),

  ((SELECT id FROM public.subclasses WHERE name = 'Oath of Vengeance' AND source = 'PHB'), 'Oath Spells', 3, 'Always have vengeance oath spells prepared as you gain paladin levels.', 'PHB', false, NULL),
  ((SELECT id FROM public.subclasses WHERE name = 'Oath of Vengeance' AND source = 'PHB'), 'Channel Divinity: Abjure Enemy', 3, 'Frighten and hinder a chosen foe with divine wrath.', 'PHB', true, 'Condition application is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Oath of Vengeance' AND source = 'PHB'), 'Channel Divinity: Vow of Enmity', 3, 'Focus divine hatred on one target to strike with advantage.', 'PHB', true, 'Attack advantage from Vow of Enmity is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Oath of Vengeance' AND source = 'PHB'), 'Relentless Avenger', 7, 'Move after an opportunity attack to stay on a fleeing foe.', 'PHB', true, 'Opportunity-attack movement riders are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Oath of Vengeance' AND source = 'PHB'), 'Soul of Vengeance', 15, 'Make reaction attacks against the target of your vow.', 'PHB', true, 'Reaction attack timing is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Oath of Vengeance' AND source = 'PHB'), 'Avenging Angel', 20, 'Transform into a terrifying winged avenger.', 'PHB', true, 'Transformation effects are not yet automated.'),

  ((SELECT id FROM public.subclasses WHERE name = 'Beast Master' AND source = 'PHB'), 'Ranger''s Companion', 3, 'Bond with a beast companion that fights alongside you.', 'PHB', true, 'Companion selection and stat block management are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Beast Master' AND source = 'PHB'), 'Exceptional Training', 7, 'Improve your companion''s utility and battle responsiveness.', 'PHB', true, 'Companion command handling is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Beast Master' AND source = 'PHB'), 'Bestial Fury', 11, 'Your companion attacks more effectively in combat.', 'PHB', true, 'Companion multiattack handling is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Beast Master' AND source = 'PHB'), 'Share Spells', 15, 'Spells you cast can also affect your companion.', 'PHB', true, 'Companion spell-sharing is not yet automated.'),

  ((SELECT id FROM public.subclasses WHERE name = 'Assassin' AND source = 'PHB'), 'Bonus Proficiencies', 3, 'Gain disguise and poison-related proficiencies.', 'PHB', false, NULL),
  ((SELECT id FROM public.subclasses WHERE name = 'Assassin' AND source = 'PHB'), 'Assassinate', 3, 'Strike first for advantage and devastating hits against unready foes.', 'PHB', true, 'Surprise and critical-hit timing are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Assassin' AND source = 'PHB'), 'Infiltration Expertise', 9, 'Create a durable false identity for covert work.', 'PHB', true, 'Narrative identity support is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Assassin' AND source = 'PHB'), 'Impostor', 13, 'Mimic speech, habits, and appearance with deep preparation.', 'PHB', true, 'Narrative impersonation support is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Assassin' AND source = 'PHB'), 'Death Strike', 17, 'Devastate surprised targets that fail to resist your opening blow.', 'PHB', true, 'Conditional damage doubling is not yet automated.'),

  ((SELECT id FROM public.subclasses WHERE name = 'Arcane Trickster' AND source = 'PHB'), 'Spellcasting', 3, 'Learn wizard magic with rogue-oriented school restrictions.', 'PHB', true, 'Subclass spell-school restrictions are not yet fully automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Arcane Trickster' AND source = 'PHB'), 'Mage Hand Legerdemain', 3, 'Use mage hand for more precise and covert manipulation.', 'PHB', true, 'Mage Hand Legerdemain utility is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Arcane Trickster' AND source = 'PHB'), 'Magical Ambush', 9, 'Targets are easier to fool with your spells while you are hidden.', 'PHB', true, 'Stealth-linked save penalties are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Arcane Trickster' AND source = 'PHB'), 'Versatile Trickster', 13, 'Distract creatures with mage hand to create attack openings.', 'PHB', true, 'Mage-hand-generated advantage is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Arcane Trickster' AND source = 'PHB'), 'Spell Thief', 17, 'Steal another caster''s spell knowledge after resisting it.', 'PHB', true, 'Spell theft is not yet automated.'),

  ((SELECT id FROM public.subclasses WHERE name = 'Wild Magic' AND source = 'PHB'), 'Wild Magic Surge', 1, 'Unstable magic can erupt in unpredictable effects after you cast spells.', 'PHB', true, 'Wild Magic surge tables are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Wild Magic' AND source = 'PHB'), 'Tides of Chaos', 1, 'Twist fate for advantage, risking renewed magical instability.', 'PHB', true, 'Advantage refresh timing is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Wild Magic' AND source = 'PHB'), 'Bend Luck', 6, 'Spend sorcery points to alter nearby rolls.', 'PHB', true, 'Roll-modifying reactions are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Wild Magic' AND source = 'PHB'), 'Controlled Chaos', 14, 'Influence the outcome of your wild surges.', 'PHB', true, 'Wild surge table handling is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Wild Magic' AND source = 'PHB'), 'Spell Bombardment', 18, 'Exceptional spell damage can explode into extra power.', 'PHB', true, 'Critical spell-damage riders are not yet automated.'),

  ((SELECT id FROM public.subclasses WHERE name = 'The Archfey' AND source = 'PHB'), 'Expanded Spell List', 1, 'Your patron adds fey-themed spells to the warlock spell list.', 'PHB', true, 'Expanded patron spell-list handling is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'The Archfey' AND source = 'PHB'), 'Fey Presence', 1, 'Briefly charm or frighten nearby creatures.', 'PHB', true, 'Charm/fear application is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'The Archfey' AND source = 'PHB'), 'Misty Escape', 6, 'Disappear in response to harm and reappear elsewhere.', 'PHB', true, 'Reactive invisibility and teleportation are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'The Archfey' AND source = 'PHB'), 'Beguiling Defenses', 10, 'Resist charm magic and turn it back on enemies.', 'PHB', true, 'Charm reflection is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'The Archfey' AND source = 'PHB'), 'Dark Delirium', 14, 'Trap a foe in an illusory realm of terror or delight.', 'PHB', true, 'Illusory control effects are not yet automated.'),

  ((SELECT id FROM public.subclasses WHERE name = 'The Great Old One' AND source = 'PHB'), 'Expanded Spell List', 1, 'Your patron adds strange psychic and cosmic spells to the warlock spell list.', 'PHB', true, 'Expanded patron spell-list handling is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'The Great Old One' AND source = 'PHB'), 'Awakened Mind', 1, 'Speak telepathically to nearby creatures.', 'PHB', true, 'Telepathy utility is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'The Great Old One' AND source = 'PHB'), 'Entropic Ward', 6, 'Twist fate to foil attacks and open a counterattack.', 'PHB', true, 'Reaction disadvantage and follow-up advantage are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'The Great Old One' AND source = 'PHB'), 'Thought Shield', 10, 'Your mind is protected from intrusion and psychic backlash.', 'PHB', true, 'Psychic reflection is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'The Great Old One' AND source = 'PHB'), 'Create Thrall', 14, 'Enslave a humanoid mind with otherworldly influence.', 'PHB', true, 'Domination effects are not yet automated.'),

  ((SELECT id FROM public.subclasses WHERE name = 'School of Abjuration' AND source = 'PHB'), 'Abjuration Savant', 2, 'Copy abjuration spells into your spellbook more efficiently.', 'PHB', false, NULL),
  ((SELECT id FROM public.subclasses WHERE name = 'School of Abjuration' AND source = 'PHB'), 'Arcane Ward', 2, 'Create a protective ward that absorbs damage.', 'PHB', true, 'Subclass ward hit-point tracking is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'School of Abjuration' AND source = 'PHB'), 'Projected Ward', 6, 'Use your ward to protect nearby allies.', 'PHB', true, 'Ward sharing is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'School of Abjuration' AND source = 'PHB'), 'Improved Abjuration', 10, 'Counterspells and dispelling become more reliable.', 'PHB', true, 'Counterspell/dispel bonuses are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'School of Abjuration' AND source = 'PHB'), 'Spell Resistance', 14, 'Gain advantage on saves against spells and resist spell damage.', 'PHB', true, 'Spell damage resistance is not yet automated.'),

  ((SELECT id FROM public.subclasses WHERE name = 'School of Conjuration' AND source = 'PHB'), 'Conjuration Savant', 2, 'Copy conjuration spells into your spellbook more efficiently.', 'PHB', false, NULL),
  ((SELECT id FROM public.subclasses WHERE name = 'School of Conjuration' AND source = 'PHB'), 'Minor Conjuration', 2, 'Conjure a small object temporarily from raw magic.', 'PHB', true, 'Object conjuration utility is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'School of Conjuration' AND source = 'PHB'), 'Benign Transposition', 6, 'Teleport yourself or swap places with an ally.', 'PHB', true, 'Teleport swapping is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'School of Conjuration' AND source = 'PHB'), 'Focused Conjuration', 10, 'Your concentration on conjuration spells becomes harder to break.', 'PHB', true, 'School-specific concentration immunity is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'School of Conjuration' AND source = 'PHB'), 'Durable Summons', 14, 'Creatures you summon become tougher.', 'PHB', true, 'Summoned-creature stat modifications are not yet automated.'),

  ((SELECT id FROM public.subclasses WHERE name = 'School of Divination' AND source = 'PHB'), 'Divination Savant', 2, 'Copy divination spells into your spellbook more efficiently.', 'PHB', false, NULL),
  ((SELECT id FROM public.subclasses WHERE name = 'School of Divination' AND source = 'PHB'), 'Portent', 2, 'Replace important rolls with foreseen results.', 'PHB', true, 'Portent die tracking and replacement flow are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'School of Divination' AND source = 'PHB'), 'Expert Divination', 6, 'Recover spell energy when casting divinations of higher level.', 'PHB', true, 'Spell-slot recovery riders are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'School of Divination' AND source = 'PHB'), 'The Third Eye', 10, 'Open a magical sense for exceptional perception.', 'PHB', true, 'Mode selection for Third Eye is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'School of Divination' AND source = 'PHB'), 'Greater Portent', 14, 'Gain an additional portent foretelling.', 'PHB', true, 'Additional portent die tracking is not yet automated.'),

  ((SELECT id FROM public.subclasses WHERE name = 'School of Enchantment' AND source = 'PHB'), 'Enchantment Savant', 2, 'Copy enchantment spells into your spellbook more efficiently.', 'PHB', false, NULL),
  ((SELECT id FROM public.subclasses WHERE name = 'School of Enchantment' AND source = 'PHB'), 'Hypnotic Gaze', 2, 'Stun a creature with a magical stare while you maintain focus.', 'PHB', true, 'Condition application and maintenance are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'School of Enchantment' AND source = 'PHB'), 'Instinctive Charm', 6, 'Redirect attacks away from yourself through enchantment.', 'PHB', true, 'Reaction redirection is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'School of Enchantment' AND source = 'PHB'), 'Split Enchantment', 10, 'Single-target enchantments can affect a second creature.', 'PHB', true, 'Multi-target spell rewriting is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'School of Enchantment' AND source = 'PHB'), 'Alter Memories', 14, 'Modify a target''s memory after charming it.', 'PHB', true, 'Memory alteration is not yet automated.'),

  ((SELECT id FROM public.subclasses WHERE name = 'School of Illusion' AND source = 'PHB'), 'Illusion Savant', 2, 'Copy illusion spells into your spellbook more efficiently.', 'PHB', false, NULL),
  ((SELECT id FROM public.subclasses WHERE name = 'School of Illusion' AND source = 'PHB'), 'Improved Minor Illusion', 2, 'Enhance minor illusion by combining sound and image.', 'PHB', true, 'Cantrip enhancement is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'School of Illusion' AND source = 'PHB'), 'Malleable Illusions', 6, 'Reshape lasting illusions while they persist.', 'PHB', true, 'Live illusion modification is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'School of Illusion' AND source = 'PHB'), 'Illusory Self', 10, 'Use illusion to make an attack appear to miss you.', 'PHB', true, 'Once-per-rest defensive negation is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'School of Illusion' AND source = 'PHB'), 'Illusory Reality', 14, 'Temporarily make part of an illusion physically real.', 'PHB', true, 'Reality-altering illusion effects are not yet automated.'),

  ((SELECT id FROM public.subclasses WHERE name = 'School of Transmutation' AND source = 'PHB'), 'Transmutation Savant', 2, 'Copy transmutation spells into your spellbook more efficiently.', 'PHB', false, NULL),
  ((SELECT id FROM public.subclasses WHERE name = 'School of Transmutation' AND source = 'PHB'), 'Minor Alchemy', 2, 'Temporarily alter the substance of nonmagical materials.', 'PHB', true, 'Material transmutation utility is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'School of Transmutation' AND source = 'PHB'), 'Transmuter''s Stone', 6, 'Create a stone that grants one of several useful benefits.', 'PHB', true, 'Transmuter''s Stone mode selection is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'School of Transmutation' AND source = 'PHB'), 'Shapechanger', 10, 'Cast polymorph on yourself without expending a spell slot in a limited way.', 'PHB', true, 'Free polymorph handling is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'School of Transmutation' AND source = 'PHB'), 'Master Transmuter', 14, 'Consume your stone to unleash one of several major transmutations.', 'PHB', true, 'Master Transmuter mode selection is not yet automated.')
ON CONFLICT (subclass_id, name, level) DO UPDATE SET
  description = EXCLUDED.description,
  source = EXCLUDED.source,
  amended = EXCLUDED.amended,
  amendment_note = EXCLUDED.amendment_note;

INSERT INTO public.subclass_bonus_spells (
  subclass_id,
  spell_id,
  required_class_level,
  counts_against_selection_limit
)
VALUES
  ((SELECT id FROM public.subclasses WHERE name = 'Knowledge Domain' AND source = 'PHB'), (SELECT id FROM public.spells WHERE name = 'Command' AND source = 'PHB'), 1, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Knowledge Domain' AND source = 'PHB'), (SELECT id FROM public.spells WHERE name = 'Identify' AND source = 'PHB'), 1, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Knowledge Domain' AND source = 'PHB'), (SELECT id FROM public.spells WHERE name = 'Suggestion' AND source = 'PHB'), 3, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Knowledge Domain' AND source = 'PHB'), (SELECT id FROM public.spells WHERE name = 'Nondetection' AND source = 'PHB'), 3, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Knowledge Domain' AND source = 'PHB'), (SELECT id FROM public.spells WHERE name = 'Speak with Dead' AND source = 'PHB'), 5, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Knowledge Domain' AND source = 'PHB'), (SELECT id FROM public.spells WHERE name = 'Arcane Eye' AND source = 'PHB'), 5, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Knowledge Domain' AND source = 'PHB'), (SELECT id FROM public.spells WHERE name = 'Confusion' AND source = 'PHB'), 7, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Knowledge Domain' AND source = 'PHB'), (SELECT id FROM public.spells WHERE name = 'Legend Lore' AND source = 'PHB'), 7, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Knowledge Domain' AND source = 'PHB'), (SELECT id FROM public.spells WHERE name = 'Scrying' AND source = 'PHB'), 9, false),

  ((SELECT id FROM public.subclasses WHERE name = 'Oath of Vengeance' AND source = 'PHB'), (SELECT id FROM public.spells WHERE name = 'Bane' AND source = 'PHB'), 3, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Oath of Vengeance' AND source = 'PHB'), (SELECT id FROM public.spells WHERE name = 'Hunter''s Mark' AND source = 'PHB'), 3, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Oath of Vengeance' AND source = 'PHB'), (SELECT id FROM public.spells WHERE name = 'Hold Person' AND source = 'PHB'), 5, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Oath of Vengeance' AND source = 'PHB'), (SELECT id FROM public.spells WHERE name = 'Misty Step' AND source = 'PHB'), 5, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Oath of Vengeance' AND source = 'PHB'), (SELECT id FROM public.spells WHERE name = 'Haste' AND source = 'PHB'), 9, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Oath of Vengeance' AND source = 'PHB'), (SELECT id FROM public.spells WHERE name = 'Protection from Energy' AND source = 'PHB'), 9, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Oath of Vengeance' AND source = 'PHB'), (SELECT id FROM public.spells WHERE name = 'Banishment' AND source = 'PHB'), 13, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Oath of Vengeance' AND source = 'PHB'), (SELECT id FROM public.spells WHERE name = 'Dimension Door' AND source = 'PHB'), 13, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Oath of Vengeance' AND source = 'PHB'), (SELECT id FROM public.spells WHERE name = 'Hold Monster' AND source = 'PHB'), 17, false),
  ((SELECT id FROM public.subclasses WHERE name = 'Oath of Vengeance' AND source = 'PHB'), (SELECT id FROM public.spells WHERE name = 'Scrying' AND source = 'PHB'), 17, false)
ON CONFLICT (subclass_id, spell_id, required_class_level) DO UPDATE SET
  counts_against_selection_limit = EXCLUDED.counts_against_selection_limit;
