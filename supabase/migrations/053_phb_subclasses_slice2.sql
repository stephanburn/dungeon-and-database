-- PHB 2014 content pass, subclass slice 2:
-- add the remaining PHB subclasses that overlap with the SRD baseline,
-- with concise builder-facing feature summaries and spell links where the
-- current model supports them directly.

WITH spell_data (
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
  class_names
) AS (
  VALUES
    ('Bless', 1, 'Enchantment', '1 action', '30 feet', '{"verbal":true,"somatic":true,"material":true,"material_description":"a sprinkling of holy water"}'::jsonb, 'Up to 1 minute', true, false, 'Bolster up to three creatures so their attacks and saving throws become more reliable.', ARRAY['Cleric','Paladin']::text[]),
    ('Spiritual Weapon', 2, 'Evocation', '1 bonus action', '60 feet', '{"verbal":true,"somatic":true,"material":false}'::jsonb, '1 minute', false, false, 'Create a floating spectral weapon that strikes as you direct it.', ARRAY['Cleric']::text[]),
    ('Burning Hands', 1, 'Evocation', '1 action', 'Self (15-foot cone)', '{"verbal":true,"somatic":true,"material":false}'::jsonb, 'Instantaneous', false, false, 'Unleash a fan of fire that scorches creatures in front of you.', ARRAY['Sorcerer','Wizard']::text[]),
    ('Daylight', 3, 'Evocation', '1 action', '60 feet', '{"verbal":true,"somatic":true,"material":false}'::jsonb, '1 hour', false, false, 'Cause an object or point to radiate bright magical light over a wide area.', ARRAY['Cleric','Druid','Paladin','Ranger','Sorcerer','Wizard']::text[]),
    ('Flame Strike', 5, 'Evocation', '1 action', '60 feet', '{"verbal":true,"somatic":true,"material":true,"material_description":"a pinch of sulfur"}'::jsonb, 'Instantaneous', false, false, 'Call down a column of divine fire that burns and blasts creatures in an area.', ARRAY['Cleric']::text[]),
    ('Barkskin', 2, 'Transmutation', '1 action', 'Touch', '{"verbal":true,"somatic":true,"material":true,"material_description":"a handful of oak bark"}'::jsonb, 'Up to 1 hour', true, false, 'Harden a creature''s skin so its Armor Class cannot fall below a sturdy threshold.', ARRAY['Druid','Ranger']::text[]),
    ('Spike Growth', 2, 'Transmutation', '1 action', '150 feet', '{"verbal":true,"somatic":true,"material":true,"material_description":"seven sharp thorns or seven small twigs, each sharpened to a point"}'::jsonb, 'Up to 10 minutes', true, false, 'Twist the ground into hidden spikes that punish creatures moving through the area.', ARRAY['Druid','Ranger']::text[]),
    ('Grasping Vine', 4, 'Conjuration', '1 bonus action', '30 feet', '{"verbal":true,"somatic":true,"material":false}'::jsonb, 'Up to 1 minute', true, false, 'Summon a vine that yanks creatures toward it each round.', ARRAY['Druid']::text[]),
    ('Insect Plague', 5, 'Conjuration', '1 action', '300 feet', '{"verbal":true,"somatic":true,"material":true,"material_description":"a few grains of sugar, some kernels of grain, and a smear of fat"}'::jsonb, 'Up to 10 minutes', true, false, 'Fill an area with biting swarms that obscure sight and chew through nearby creatures.', ARRAY['Cleric','Druid']::text[]),
    ('Call Lightning', 3, 'Conjuration', '1 action', '120 feet', '{"verbal":true,"somatic":true,"material":false}'::jsonb, 'Up to 10 minutes', true, false, 'Call storm lightning from above and direct repeated bolts onto your enemies.', ARRAY['Druid']::text[]),
    ('Destructive Wave', 5, 'Evocation', '1 action', 'Self (30-foot radius)', '{"verbal":true,"material":false,"somatic":false}'::jsonb, 'Instantaneous', false, false, 'Release a crushing wave of divine force and energy around yourself.', ARRAY['Paladin']::text[]),
    ('Charm Person', 1, 'Enchantment', '1 action', '30 feet', '{"verbal":true,"somatic":true,"material":false}'::jsonb, '1 hour', false, false, 'Charm a humanoid into regarding you as a friendly acquaintance.', ARRAY['Bard','Druid','Sorcerer','Warlock','Wizard']::text[]),
    ('Mirror Image', 2, 'Illusion', '1 action', 'Self', '{"verbal":true,"somatic":true,"material":false}'::jsonb, '1 minute', false, false, 'Create shifting illusory duplicates that make you harder to hit.', ARRAY['Sorcerer','Warlock','Wizard']::text[]),
    ('Polymorph', 4, 'Transmutation', '1 action', '60 feet', '{"verbal":true,"somatic":true,"material":true,"material_description":"a caterpillar cocoon"}'::jsonb, 'Up to 1 hour', true, false, 'Transform a creature into a beast form with a new body and capabilities.', ARRAY['Bard','Druid','Sorcerer','Wizard']::text[]),
    ('Dominate Person', 5, 'Enchantment', '1 action', '60 feet', '{"verbal":true,"somatic":true,"material":false}'::jsonb, 'Up to 1 minute', true, false, 'Seize control of a humanoid and command its actions.', ARRAY['Bard','Sorcerer','Warlock','Wizard']::text[]),
    ('Modify Memory', 5, 'Enchantment', '1 action', '30 feet', '{"verbal":true,"somatic":true,"material":false}'::jsonb, 'Up to 1 minute', true, false, 'Reshape a creature''s memory of recent events with carefully guided magic.', ARRAY['Bard','Wizard']::text[]),
    ('Divine Favor', 1, 'Evocation', '1 bonus action', 'Self', '{"verbal":true,"somatic":true,"material":false}'::jsonb, 'Up to 1 minute', true, false, 'Wrap your weapon strikes in radiant energy for a short time.', ARRAY['Paladin']::text[]),
    ('Crusader''s Mantle', 3, 'Evocation', '1 action', 'Self (30-foot radius)', '{"verbal":true,"somatic":false,"material":false}'::jsonb, 'Up to 1 minute', true, false, 'Radiate holy power that causes nearby allies'' weapon strikes to hit harder.', ARRAY['Paladin']::text[]),
    ('Spirit Guardians', 3, 'Conjuration', '1 action', 'Self (15-foot radius)', '{"verbal":true,"somatic":true,"material":true,"material_description":"a holy symbol"}'::jsonb, 'Up to 10 minutes', true, false, 'Summon protective spirits that hinder foes and punish them for staying close.', ARRAY['Cleric']::text[]),
    ('Protection from Evil and Good', 1, 'Abjuration', '1 action', 'Touch', '{"verbal":true,"somatic":true,"material":true,"material_description":"holy water or powdered silver and iron, consumed by the spell"}'::jsonb, 'Up to 10 minutes', true, false, 'Ward a creature against several supernatural creature types and their influence.', ARRAY['Cleric','Paladin','Warlock','Wizard']::text[]),
    ('Commune', 5, 'Divination', '1 minute', 'Self', '{"verbal":true,"somatic":true,"material":true,"material_description":"incense and a vial of holy or unholy water"}'::jsonb, '1 minute', false, true, 'Ask your deity or divine intermediary a small number of direct questions.', ARRAY['Cleric']::text[])
)
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
SELECT
  data.name,
  data.level,
  data.school,
  data.casting_time,
  data.range,
  data.components,
  data.duration,
  data.concentration,
  data.ritual,
  data.description,
  COALESCE((
    SELECT array_agg(picked.id ORDER BY picked.name)
    FROM (
      SELECT DISTINCT ON (c.name) c.id, c.name
      FROM public.classes c
      WHERE c.name = ANY(data.class_names)
        AND c.source IN ('PHB', 'SRD', 'srd')
      ORDER BY c.name, CASE c.source WHEN 'PHB' THEN 0 WHEN 'SRD' THEN 1 WHEN 'srd' THEN 2 ELSE 3 END
    ) AS picked
  ), ARRAY[]::uuid[]),
  'PHB',
  false,
  NULL
FROM spell_data AS data
ON CONFLICT (name, source) DO UPDATE SET
  level = EXCLUDED.level,
  school = EXCLUDED.school,
  casting_time = EXCLUDED.casting_time,
  range = EXCLUDED.range,
  components = EXCLUDED.components,
  duration = EXCLUDED.duration,
  concentration = EXCLUDED.concentration,
  ritual = EXCLUDED.ritual,
  description = EXCLUDED.description,
  classes = EXCLUDED.classes,
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
  ('Path of the Berserker', (SELECT id FROM public.classes WHERE name = 'Barbarian' AND source IN ('PHB', 'SRD', 'srd') ORDER BY CASE source WHEN 'PHB' THEN 0 WHEN 'SRD' THEN 1 WHEN 'srd' THEN 2 ELSE 3 END LIMIT 1), 3, 'PHB', true, 'Frenzy exhaustion handling and several conditional combat riders are not yet automated.'),
  ('College of Lore', (SELECT id FROM public.classes WHERE name = 'Bard' AND source IN ('PHB', 'SRD', 'srd') ORDER BY CASE source WHEN 'PHB' THEN 0 WHEN 'SRD' THEN 1 WHEN 'srd' THEN 2 ELSE 3 END LIMIT 1), 3, 'PHB', true, 'Bonus skill selection and Additional Magical Secrets spell picks are not yet automated.'),
  ('Life Domain', (SELECT id FROM public.classes WHERE name = 'Cleric' AND source IN ('PHB', 'SRD', 'srd') ORDER BY CASE source WHEN 'PHB' THEN 0 WHEN 'SRD' THEN 1 WHEN 'srd' THEN 2 ELSE 3 END LIMIT 1), 1, 'PHB', true, 'Disciple of Life healing riders and Preserve Life redistribution are not yet automated.'),
  ('Light Domain', (SELECT id FROM public.classes WHERE name = 'Cleric' AND source IN ('PHB', 'SRD', 'srd') ORDER BY CASE source WHEN 'PHB' THEN 0 WHEN 'SRD' THEN 1 WHEN 'srd' THEN 2 ELSE 3 END LIMIT 1), 1, 'PHB', true, 'Warding Flare reactions and Radiance of the Dawn burst handling are not yet automated.'),
  ('Nature Domain', (SELECT id FROM public.classes WHERE name = 'Cleric' AND source IN ('PHB', 'SRD', 'srd') ORDER BY CASE source WHEN 'PHB' THEN 0 WHEN 'SRD' THEN 1 WHEN 'srd' THEN 2 ELSE 3 END LIMIT 1), 1, 'PHB', true, 'Bonus druid cantrip selection and elemental reaction effects are not yet automated.'),
  ('Tempest Domain', (SELECT id FROM public.classes WHERE name = 'Cleric' AND source IN ('PHB', 'SRD', 'srd') ORDER BY CASE source WHEN 'PHB' THEN 0 WHEN 'SRD' THEN 1 WHEN 'srd' THEN 2 ELSE 3 END LIMIT 1), 1, 'PHB', true, 'Wrath of the Storm reactions, thunder/lightning maximization, and flight burst handling are not yet automated.'),
  ('Trickery Domain', (SELECT id FROM public.classes WHERE name = 'Cleric' AND source IN ('PHB', 'SRD', 'srd') ORDER BY CASE source WHEN 'PHB' THEN 0 WHEN 'SRD' THEN 1 WHEN 'srd' THEN 2 ELSE 3 END LIMIT 1), 1, 'PHB', true, 'Blessing of the Trickster targeting and Invoke Duplicity illusion positioning are not yet automated.'),
  ('War Domain', (SELECT id FROM public.classes WHERE name = 'Cleric' AND source IN ('PHB', 'SRD', 'srd') ORDER BY CASE source WHEN 'PHB' THEN 0 WHEN 'SRD' THEN 1 WHEN 'srd' THEN 2 ELSE 3 END LIMIT 1), 1, 'PHB', true, 'War Priest attack tracking, Guided Strike reactions, and bonus damage riders are not yet automated.'),
  ('Circle of the Land', (SELECT id FROM public.classes WHERE name = 'Druid' AND source IN ('PHB', 'SRD', 'srd') ORDER BY CASE source WHEN 'PHB' THEN 0 WHEN 'SRD' THEN 1 WHEN 'srd' THEN 2 ELSE 3 END LIMIT 1), 2, 'PHB', true, 'Land type choice, circle spells, and Natural Recovery slot restoration are not yet automated.'),
  ('Circle of the Moon', (SELECT id FROM public.classes WHERE name = 'Druid' AND source IN ('PHB', 'SRD', 'srd') ORDER BY CASE source WHEN 'PHB' THEN 0 WHEN 'SRD' THEN 1 WHEN 'srd' THEN 2 ELSE 3 END LIMIT 1), 2, 'PHB', true, 'Combat Wild Shape forms, CR scaling, and elemental form support are not yet automated.'),
  ('Champion', (SELECT id FROM public.classes WHERE name = 'Fighter' AND source IN ('PHB', 'SRD', 'srd') ORDER BY CASE source WHEN 'PHB' THEN 0 WHEN 'SRD' THEN 1 WHEN 'srd' THEN 2 ELSE 3 END LIMIT 1), 3, 'PHB', true, 'Expanded critical ranges and extra fighting style progression are not yet automated.'),
  ('Battle Master', (SELECT id FROM public.classes WHERE name = 'Fighter' AND source IN ('PHB', 'SRD', 'srd') ORDER BY CASE source WHEN 'PHB' THEN 0 WHEN 'SRD' THEN 1 WHEN 'srd' THEN 2 ELSE 3 END LIMIT 1), 3, 'PHB', true, 'Combat superiority dice, maneuver selection, and Know Your Enemy analysis are not yet automated.'),
  ('Eldritch Knight', (SELECT id FROM public.classes WHERE name = 'Fighter' AND source IN ('PHB', 'SRD', 'srd') ORDER BY CASE source WHEN 'PHB' THEN 0 WHEN 'SRD' THEN 1 WHEN 'srd' THEN 2 ELSE 3 END LIMIT 1), 3, 'PHB', true, 'Subclass spell-school restrictions, bonded weapon logic, and War Magic timing are not yet automated.'),
  ('Way of the Open Hand', (SELECT id FROM public.classes WHERE name = 'Monk' AND source IN ('PHB', 'SRD', 'srd') ORDER BY CASE source WHEN 'PHB' THEN 0 WHEN 'SRD' THEN 1 WHEN 'srd' THEN 2 ELSE 3 END LIMIT 1), 3, 'PHB', true, 'Open Hand Technique option resolution and Quivering Palm execution are not yet automated.'),
  ('Oath of Devotion', (SELECT id FROM public.classes WHERE name = 'Paladin' AND source IN ('PHB', 'SRD', 'srd') ORDER BY CASE source WHEN 'PHB' THEN 0 WHEN 'SRD' THEN 1 WHEN 'srd' THEN 2 ELSE 3 END LIMIT 1), 3, 'PHB', true, 'Sacred Weapon accuracy bonuses, Turn the Unholy targeting, and aura immunities are not yet automated.'),
  ('Hunter', (SELECT id FROM public.classes WHERE name = 'Ranger' AND source IN ('PHB', 'SRD', 'srd') ORDER BY CASE source WHEN 'PHB' THEN 0 WHEN 'SRD' THEN 1 WHEN 'srd' THEN 2 ELSE 3 END LIMIT 1), 3, 'PHB', true, 'Hunter feature option selections are not yet modeled in the builder.'),
  ('Thief', (SELECT id FROM public.classes WHERE name = 'Rogue' AND source IN ('PHB', 'SRD', 'srd') ORDER BY CASE source WHEN 'PHB' THEN 0 WHEN 'SRD' THEN 1 WHEN 'srd' THEN 2 ELSE 3 END LIMIT 1), 3, 'PHB', true, 'Fast Hands item action handling and Use Magic Device permissions are not yet automated.'),
  ('Draconic Bloodline', (SELECT id FROM public.classes WHERE name = 'Sorcerer' AND source IN ('PHB', 'SRD', 'srd') ORDER BY CASE source WHEN 'PHB' THEN 0 WHEN 'SRD' THEN 1 WHEN 'srd' THEN 2 ELSE 3 END LIMIT 1), 1, 'PHB', true, 'Dragon ancestry choice, resistance selection, and elemental damage bonuses are not yet automated.'),
  ('The Fiend', (SELECT id FROM public.classes WHERE name = 'Warlock' AND source IN ('PHB', 'SRD', 'srd') ORDER BY CASE source WHEN 'PHB' THEN 0 WHEN 'SRD' THEN 1 WHEN 'srd' THEN 2 ELSE 3 END LIMIT 1), 1, 'PHB', true, 'Expanded patron spell-list handling is not yet modeled separately from bonus-spell grants.'),
  ('School of Evocation', (SELECT id FROM public.classes WHERE name = 'Wizard' AND source IN ('PHB', 'SRD', 'srd') ORDER BY CASE source WHEN 'PHB' THEN 0 WHEN 'SRD' THEN 1 WHEN 'srd' THEN 2 ELSE 3 END LIMIT 1), 2, 'PHB', true, 'Sculpt Spells target filtering, cantrip scaling riders, and Overchannel stress are not yet automated.')
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
  ((SELECT id FROM public.subclasses WHERE name = 'Path of the Berserker' AND source = 'PHB'), 'Frenzy', 3, 'Enter a reckless rage that can fuel an extra attack at the cost of later exhaustion.', 'PHB', true, 'Frenzy exhaustion handling is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Path of the Berserker' AND source = 'PHB'), 'Mindless Rage', 6, 'Rage hardens your mind against fear and charm effects.', 'PHB', true, 'Conditional immunity handling is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Path of the Berserker' AND source = 'PHB'), 'Intimidating Presence', 10, 'Frighten a nearby creature by projecting overwhelming menace.', 'PHB', true, 'Fear application and maintenance are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Path of the Berserker' AND source = 'PHB'), 'Retaliation', 14, 'Strike back immediately when a nearby enemy hurts you.', 'PHB', true, 'Reaction attack timing is not yet automated.'),

  ((SELECT id FROM public.subclasses WHERE name = 'College of Lore' AND source = 'PHB'), 'Bonus Proficiencies', 3, 'Gain proficiency in extra skills to broaden your expertise.', 'PHB', true, 'Skill selection is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'College of Lore' AND source = 'PHB'), 'Cutting Words', 3, 'Spend Bardic Inspiration to undercut an enemy''s attack, check, or damage roll.', 'PHB', true, 'Reaction roll reduction is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'College of Lore' AND source = 'PHB'), 'Additional Magical Secrets', 6, 'Learn extra spells from any class list ahead of the usual bard schedule.', 'PHB', true, 'Cross-list spell choice handling is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'College of Lore' AND source = 'PHB'), 'Peerless Skill', 14, 'Apply Bardic Inspiration to your own ability checks after seeing the roll.', 'PHB', true, 'Self-targeted Bardic Inspiration timing is not yet automated.'),

  ((SELECT id FROM public.subclasses WHERE name = 'Life Domain' AND source = 'PHB'), 'Life Domain Spells', 1, 'Always have the domain''s healing and protection spells prepared.', 'PHB', false, NULL),
  ((SELECT id FROM public.subclasses WHERE name = 'Life Domain' AND source = 'PHB'), 'Bonus Proficiency', 1, 'Gain training with heavy armor.', 'PHB', false, NULL),
  ((SELECT id FROM public.subclasses WHERE name = 'Life Domain' AND source = 'PHB'), 'Disciple of Life', 1, 'Your healing spells restore extra hit points.', 'PHB', true, 'Spell healing riders are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Life Domain' AND source = 'PHB'), 'Channel Divinity: Preserve Life', 2, 'Redistribute restorative energy across wounded creatures.', 'PHB', true, 'Channel Divinity healing distribution is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Life Domain' AND source = 'PHB'), 'Blessed Healer', 6, 'Heal yourself whenever you cast restorative magic on others.', 'PHB', true, 'Self-healing riders are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Life Domain' AND source = 'PHB'), 'Divine Strike', 8, 'Infuse weapon attacks with extra radiant power.', 'PHB', true, 'Subclass weapon-damage riders are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Life Domain' AND source = 'PHB'), 'Supreme Healing', 17, 'Your healing spells deliver exceptional restoration.', 'PHB', true, 'Maximum-healing replacement is not yet automated.'),

  ((SELECT id FROM public.subclasses WHERE name = 'Light Domain' AND source = 'PHB'), 'Light Domain Spells', 1, 'Always have the domain''s fire and revelation spells prepared.', 'PHB', false, NULL),
  ((SELECT id FROM public.subclasses WHERE name = 'Light Domain' AND source = 'PHB'), 'Bonus Cantrip', 1, 'Learn the light cantrip if you do not already know it.', 'PHB', true, 'Automatic cantrip grants are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Light Domain' AND source = 'PHB'), 'Warding Flare', 1, 'Blind an attacker with divine light to spoil its strike.', 'PHB', true, 'Reaction disadvantage handling is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Light Domain' AND source = 'PHB'), 'Channel Divinity: Radiance of the Dawn', 2, 'Dispel darkness and blast hostile creatures with searing radiance.', 'PHB', true, 'Area damage and magical darkness clearing are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Light Domain' AND source = 'PHB'), 'Improved Flare', 6, 'Extend Warding Flare protection to nearby allies.', 'PHB', true, 'Ally-targeted flare reactions are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Light Domain' AND source = 'PHB'), 'Potent Spellcasting', 8, 'Add Wisdom modifier to cleric cantrip damage.', 'PHB', true, 'Subclass cantrip-damage riders are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Light Domain' AND source = 'PHB'), 'Corona of Light', 17, 'Surround yourself with sunlight that weakens enemies'' resistance to your spells.', 'PHB', true, 'Save-penalty aura handling is not yet automated.'),

  ((SELECT id FROM public.subclasses WHERE name = 'Nature Domain' AND source = 'PHB'), 'Nature Domain Spells', 1, 'Always have the domain''s primal and terrain-shaping spells prepared.', 'PHB', false, NULL),
  ((SELECT id FROM public.subclasses WHERE name = 'Nature Domain' AND source = 'PHB'), 'Acolyte of Nature', 1, 'Learn a druid cantrip and deepen your bond with the natural world.', 'PHB', true, 'Bonus druid cantrip selection is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Nature Domain' AND source = 'PHB'), 'Bonus Proficiency', 1, 'Gain training with heavy armor.', 'PHB', false, NULL),
  ((SELECT id FROM public.subclasses WHERE name = 'Nature Domain' AND source = 'PHB'), 'Channel Divinity: Charm Animals and Plants', 2, 'Call on divine power to pacify beasts and vegetation.', 'PHB', true, 'Creature and plant charm handling is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Nature Domain' AND source = 'PHB'), 'Dampen Elements', 6, 'Use your reaction to blunt elemental harm to yourself or an ally.', 'PHB', true, 'Reaction resistance grants are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Nature Domain' AND source = 'PHB'), 'Divine Strike', 8, 'Empower weapon attacks with extra elemental force.', 'PHB', true, 'Subclass weapon-damage riders are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Nature Domain' AND source = 'PHB'), 'Master of Nature', 17, 'Command nearby beasts and plants with overwhelming authority.', 'PHB', true, 'Extended domination effects are not yet automated.'),

  ((SELECT id FROM public.subclasses WHERE name = 'Tempest Domain' AND source = 'PHB'), 'Tempest Domain Spells', 1, 'Always have the domain''s storm and sea spells prepared.', 'PHB', false, NULL),
  ((SELECT id FROM public.subclasses WHERE name = 'Tempest Domain' AND source = 'PHB'), 'Bonus Proficiencies', 1, 'Gain training with martial weapons and heavy armor.', 'PHB', false, NULL),
  ((SELECT id FROM public.subclasses WHERE name = 'Tempest Domain' AND source = 'PHB'), 'Wrath of the Storm', 1, 'Answer a blow with crackling thunder or lightning.', 'PHB', true, 'Reaction damage and save handling are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Tempest Domain' AND source = 'PHB'), 'Channel Divinity: Destructive Wrath', 2, 'Maximize thunder or lightning damage with divine force.', 'PHB', true, 'Damage maximization is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Tempest Domain' AND source = 'PHB'), 'Thunderbolt Strike', 6, 'Push creatures when your lightning magic hits them.', 'PHB', true, 'Forced movement riders are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Tempest Domain' AND source = 'PHB'), 'Divine Strike', 8, 'Crack weapon attacks with extra thunder damage.', 'PHB', true, 'Subclass weapon-damage riders are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Tempest Domain' AND source = 'PHB'), 'Stormborn', 17, 'Gain the power to fly amid wind and storm.', 'PHB', true, 'Temporary flight handling is not yet automated.'),

  ((SELECT id FROM public.subclasses WHERE name = 'Trickery Domain' AND source = 'PHB'), 'Trickery Domain Spells', 1, 'Always have the domain''s deception and mobility spells prepared.', 'PHB', false, NULL),
  ((SELECT id FROM public.subclasses WHERE name = 'Trickery Domain' AND source = 'PHB'), 'Blessing of the Trickster', 1, 'Grant stealth-enhancing divine favor to another creature.', 'PHB', true, 'Targeted stealth advantage is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Trickery Domain' AND source = 'PHB'), 'Channel Divinity: Invoke Duplicity', 2, 'Project an illusory double that helps deceive and outmaneuver foes.', 'PHB', true, 'Illusory duplicate positioning is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Trickery Domain' AND source = 'PHB'), 'Channel Divinity: Cloak of Shadows', 6, 'Become briefly invisible through divine trickery.', 'PHB', true, 'Short-duration invisibility is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Trickery Domain' AND source = 'PHB'), 'Divine Strike', 8, 'Lace weapon attacks with venomous divine force.', 'PHB', true, 'Subclass weapon-damage riders are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Trickery Domain' AND source = 'PHB'), 'Improved Duplicity', 17, 'Create multiple duplicates to broaden your deceptive reach.', 'PHB', true, 'Multi-duplicate handling is not yet automated.'),

  ((SELECT id FROM public.subclasses WHERE name = 'War Domain' AND source = 'PHB'), 'War Domain Spells', 1, 'Always have the domain''s battle-focused spells prepared.', 'PHB', false, NULL),
  ((SELECT id FROM public.subclasses WHERE name = 'War Domain' AND source = 'PHB'), 'Bonus Proficiencies', 1, 'Gain training with martial weapons and heavy armor.', 'PHB', false, NULL),
  ((SELECT id FROM public.subclasses WHERE name = 'War Domain' AND source = 'PHB'), 'War Priest', 1, 'Turn battle fervor into extra weapon strikes a limited number of times.', 'PHB', true, 'Bonus-attack usage tracking is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'War Domain' AND source = 'PHB'), 'Channel Divinity: Guided Strike', 2, 'Call on divine precision to turn a near miss into a hit.', 'PHB', true, 'Attack-roll bonus timing is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'War Domain' AND source = 'PHB'), 'Channel Divinity: War God''s Blessing', 6, 'Extend your divine precision to an ally''s attack.', 'PHB', true, 'Ally attack-roll bonus timing is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'War Domain' AND source = 'PHB'), 'Divine Strike', 8, 'Empower weapon attacks with extra divine force.', 'PHB', true, 'Subclass weapon-damage riders are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'War Domain' AND source = 'PHB'), 'Avatar of Battle', 17, 'Become exceptionally resistant to common battlefield weapons.', 'PHB', true, 'Conditional damage resistance is not yet automated.'),

  ((SELECT id FROM public.subclasses WHERE name = 'Circle of the Land' AND source = 'PHB'), 'Bonus Cantrip', 2, 'Learn an extra druid cantrip tied to your circle.', 'PHB', true, 'Automatic cantrip grants are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Circle of the Land' AND source = 'PHB'), 'Natural Recovery', 2, 'Recover some spellcasting energy during a short rest.', 'PHB', true, 'Spell-slot recovery is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Circle of the Land' AND source = 'PHB'), 'Circle Spells', 3, 'Gain extra always-prepared spells based on your chosen land type.', 'PHB', true, 'Land type choice and circle spell grants are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Circle of the Land' AND source = 'PHB'), 'Land''s Stride', 6, 'Move through natural terrain more freely and resist some plant hindrances.', 'PHB', true, 'Terrain movement benefits are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Circle of the Land' AND source = 'PHB'), 'Nature''s Ward', 10, 'Gain immunity to poison and immunity to charm or fright from fey and elementals.', 'PHB', true, 'Conditional immunities are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Circle of the Land' AND source = 'PHB'), 'Nature''s Sanctuary', 14, 'Ward yourself so natural creatures hesitate to attack you.', 'PHB', true, 'Creature deterrence logic is not yet automated.'),

  ((SELECT id FROM public.subclasses WHERE name = 'Circle of the Moon' AND source = 'PHB'), 'Combat Wild Shape', 2, 'Use Wild Shape more aggressively and spend spell power to heal while transformed.', 'PHB', true, 'Combat Wild Shape and self-healing while transformed are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Circle of the Moon' AND source = 'PHB'), 'Circle Forms', 2, 'Assume stronger beast shapes than most druids can manage.', 'PHB', true, 'Wild Shape CR scaling is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Circle of the Moon' AND source = 'PHB'), 'Primal Strike', 6, 'Your beast-form attacks count as magical for overcoming resistance.', 'PHB', true, 'Wild Shape attack tagging is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Circle of the Moon' AND source = 'PHB'), 'Elemental Wild Shape', 10, 'Spend both uses of Wild Shape to assume an elemental form.', 'PHB', true, 'Elemental form handling is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Circle of the Moon' AND source = 'PHB'), 'Thousand Forms', 14, 'Cast alter self on yourself at will.', 'PHB', true, 'At-will spell grant handling is not yet automated.'),

  ((SELECT id FROM public.subclasses WHERE name = 'Champion' AND source = 'PHB'), 'Improved Critical', 3, 'Score critical hits more often than most fighters.', 'PHB', true, 'Expanded critical range is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Champion' AND source = 'PHB'), 'Remarkable Athlete', 7, 'Gain broad physical competence and improved jumping ability.', 'PHB', true, 'Half-proficiency athletics rider is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Champion' AND source = 'PHB'), 'Additional Fighting Style', 10, 'Adopt a second fighting style.', 'PHB', true, 'Additional fighting style selection is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Champion' AND source = 'PHB'), 'Superior Critical', 15, 'Expand your critical hit range even further.', 'PHB', true, 'Expanded critical range is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Champion' AND source = 'PHB'), 'Survivor', 18, 'Regain hit points steadily while bloodied in battle.', 'PHB', true, 'End-of-turn regeneration is not yet automated.'),

  ((SELECT id FROM public.subclasses WHERE name = 'Battle Master' AND source = 'PHB'), 'Combat Superiority', 3, 'Learn maneuvers fueled by superiority dice.', 'PHB', true, 'Maneuver and superiority die tracking are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Battle Master' AND source = 'PHB'), 'Student of War', 3, 'Gain proficiency with one type of artisan''s tools.', 'PHB', true, 'Tool selection is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Battle Master' AND source = 'PHB'), 'Know Your Enemy', 7, 'Study a foe to gauge its combat strengths relative to yours.', 'PHB', true, 'Enemy-analysis support is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Battle Master' AND source = 'PHB'), 'Improved Combat Superiority', 10, 'Your superiority dice grow more potent.', 'PHB', true, 'Superiority die scaling is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Battle Master' AND source = 'PHB'), 'Relentless', 15, 'Recover a measure of combat discipline when you are running low.', 'PHB', true, 'Superiority die recovery is not yet automated.'),

  ((SELECT id FROM public.subclasses WHERE name = 'Eldritch Knight' AND source = 'PHB'), 'Weapon Bond', 3, 'Bind yourself to chosen weapons so they are harder to lose.', 'PHB', true, 'Bound weapon summoning and restrictions are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Eldritch Knight' AND source = 'PHB'), 'Spellcasting', 3, 'Learn wizard magic with fighter-oriented school restrictions.', 'PHB', true, 'Subclass spell-school restrictions are not yet fully automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Eldritch Knight' AND source = 'PHB'), 'War Magic', 7, 'Blend weapon strikes and cantrips within the same turn.', 'PHB', true, 'Action-economy interaction is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Eldritch Knight' AND source = 'PHB'), 'Eldritch Strike', 10, 'Weaken a foe''s resistance to your magic after landing a weapon hit.', 'PHB', true, 'Save-disadvantage rider is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Eldritch Knight' AND source = 'PHB'), 'Arcane Charge', 15, 'Teleport when you surge into extra action.', 'PHB', true, 'Action Surge teleport timing is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Eldritch Knight' AND source = 'PHB'), 'Improved War Magic', 18, 'Blend weapon strikes and leveled spells within the same turn.', 'PHB', true, 'Action-economy interaction is not yet automated.'),

  ((SELECT id FROM public.subclasses WHERE name = 'Way of the Open Hand' AND source = 'PHB'), 'Open Hand Technique', 3, 'Flurry of Blows can shove, topple, or block reactions from your target.', 'PHB', true, 'Open Hand Technique option resolution is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Way of the Open Hand' AND source = 'PHB'), 'Wholeness of Body', 6, 'Restore your own vitality through disciplined focus.', 'PHB', true, 'Self-healing usage tracking is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Way of the Open Hand' AND source = 'PHB'), 'Tranquility', 11, 'Surround yourself with a sanctuary of inner peace between rests.', 'PHB', true, 'Rest-based sanctuary effects are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Way of the Open Hand' AND source = 'PHB'), 'Quivering Palm', 17, 'Plant lethal vibrations in a creature that can later erupt with devastating force.', 'PHB', true, 'Delayed execution handling is not yet automated.'),

  ((SELECT id FROM public.subclasses WHERE name = 'Oath of Devotion' AND source = 'PHB'), 'Oath Spells', 3, 'Always have devotion oath spells prepared as you gain paladin levels.', 'PHB', false, NULL),
  ((SELECT id FROM public.subclasses WHERE name = 'Oath of Devotion' AND source = 'PHB'), 'Channel Divinity: Sacred Weapon', 3, 'Imbue a weapon with radiant accuracy and brilliance.', 'PHB', true, 'Accuracy bonuses and emitted light are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Oath of Devotion' AND source = 'PHB'), 'Channel Divinity: Turn the Unholy', 3, 'Repel fiends and undead with holy authority.', 'PHB', true, 'Creature filtering and turn handling are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Oath of Devotion' AND source = 'PHB'), 'Aura of Devotion', 7, 'You and nearby allies cannot be charmed while you are conscious.', 'PHB', true, 'Aura-based immunity handling is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Oath of Devotion' AND source = 'PHB'), 'Purity of Spirit', 15, 'Remain constantly shielded from evil and good influences.', 'PHB', true, 'Persistent protective spell effects are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Oath of Devotion' AND source = 'PHB'), 'Holy Nimbus', 20, 'Radiate holy power that harms enemies and empowers your defenses.', 'PHB', true, 'Transformation aura damage is not yet automated.'),

  ((SELECT id FROM public.subclasses WHERE name = 'Hunter' AND source = 'PHB'), 'Hunter''s Prey', 3, 'Choose a signature offensive hunting tactic.', 'PHB', true, 'Hunter feature option selections are not yet modeled in the builder.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Hunter' AND source = 'PHB'), 'Defensive Tactics', 7, 'Choose a practiced defense against common battlefield threats.', 'PHB', true, 'Hunter feature option selections are not yet modeled in the builder.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Hunter' AND source = 'PHB'), 'Multiattack', 11, 'Choose a sweeping or volleying attack style for dealing with many foes.', 'PHB', true, 'Hunter feature option selections are not yet modeled in the builder.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Hunter' AND source = 'PHB'), 'Superior Hunter''s Defense', 15, 'Choose an advanced defense against punishing enemy attacks.', 'PHB', true, 'Hunter feature option selections are not yet modeled in the builder.'),

  ((SELECT id FROM public.subclasses WHERE name = 'Thief' AND source = 'PHB'), 'Fast Hands', 3, 'Use your quickness to manipulate objects and devices more efficiently.', 'PHB', true, 'Object interaction timing is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Thief' AND source = 'PHB'), 'Second-Story Work', 3, 'Climb more easily and make longer running jumps.', 'PHB', true, 'Movement bonuses are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Thief' AND source = 'PHB'), 'Supreme Sneak', 9, 'Move slowly and carefully to hide more effectively.', 'PHB', true, 'Conditional stealth advantage is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Thief' AND source = 'PHB'), 'Use Magic Device', 13, 'Ignore some class, race, and level restrictions on magic items.', 'PHB', true, 'Magic item permission overrides are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Thief' AND source = 'PHB'), 'Thief''s Reflexes', 17, 'Act twice at the opening of combat when you are ready.', 'PHB', true, 'Special first-round turn timing is not yet automated.'),

  ((SELECT id FROM public.subclasses WHERE name = 'Draconic Bloodline' AND source = 'PHB'), 'Dragon Ancestor', 1, 'Choose the draconic lineage that shapes your magic and affinities.', 'PHB', true, 'Dragon ancestry choice is not yet modeled in the builder.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Draconic Bloodline' AND source = 'PHB'), 'Draconic Resilience', 1, 'Develop greater toughness and a natural magical armor.', 'PHB', true, 'Passive AC recalculation is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Draconic Bloodline' AND source = 'PHB'), 'Elemental Affinity', 6, 'Channel your ancestry through spells of its matching damage type.', 'PHB', true, 'Damage-type choice and resistance spending are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Draconic Bloodline' AND source = 'PHB'), 'Dragon Wings', 14, 'Manifest draconic wings and gain flight.', 'PHB', true, 'Flight toggling is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'Draconic Bloodline' AND source = 'PHB'), 'Draconic Presence', 18, 'Expend sorcerous power to awe or terrify nearby creatures.', 'PHB', true, 'Area charm and fear handling are not yet automated.'),

  ((SELECT id FROM public.subclasses WHERE name = 'The Fiend' AND source = 'PHB'), 'Expanded Spell List', 1, 'Fiendish patron magic broadens the spells you can choose from.', 'PHB', true, 'Expanded patron spell-list handling is not yet modeled separately from bonus-spell grants.'),
  ((SELECT id FROM public.subclasses WHERE name = 'The Fiend' AND source = 'PHB'), 'Dark One''s Blessing', 1, 'Gain temporary vitality when you bring down a foe.', 'PHB', true, 'Temporary hit point gains are not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'The Fiend' AND source = 'PHB'), 'Dark One''s Own Luck', 6, 'Call on infernal favor to boost an ability check or saving throw.', 'PHB', true, 'Roll bonus timing is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'The Fiend' AND source = 'PHB'), 'Fiendish Resilience', 10, 'Choose a damage type to resist after resting.', 'PHB', true, 'Damage resistance selection is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'The Fiend' AND source = 'PHB'), 'Hurl Through Hell', 14, 'Banish a creature through a terrifying infernal ordeal before it returns.', 'PHB', true, 'Delayed damage and temporary banishment are not yet automated.'),

  ((SELECT id FROM public.subclasses WHERE name = 'School of Evocation' AND source = 'PHB'), 'Evocation Savant', 2, 'Copy evocation spells into your spellbook more efficiently.', 'PHB', false, NULL),
  ((SELECT id FROM public.subclasses WHERE name = 'School of Evocation' AND source = 'PHB'), 'Sculpt Spells', 2, 'Protect allies from the worst of your area evocations.', 'PHB', true, 'Selective area-effect protection is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'School of Evocation' AND source = 'PHB'), 'Potent Cantrip', 6, 'Your cantrips still sting even when foes partly resist them.', 'PHB', true, 'Cantrip partial-effect handling is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'School of Evocation' AND source = 'PHB'), 'Empowered Evocation', 10, 'Add Intelligence modifier to one damage roll of your evocation spells.', 'PHB', true, 'Spell damage rider selection is not yet automated.'),
  ((SELECT id FROM public.subclasses WHERE name = 'School of Evocation' AND source = 'PHB'), 'Overchannel', 14, 'Maximize lower-level evocation damage at the risk of harming yourself later.', 'PHB', true, 'Self-damaging overchannel stress is not yet automated.')
ON CONFLICT (subclass_id, name, level) DO UPDATE SET
  description = EXCLUDED.description,
  source = EXCLUDED.source,
  amended = EXCLUDED.amended,
  amendment_note = EXCLUDED.amendment_note;

WITH subclass_spell_links(subclass_name, spell_name, required_class_level, counts_against_selection_limit) AS (
  VALUES
    ('Life Domain', 'Bless', 1, false),
    ('Life Domain', 'Cure Wounds', 1, false),
    ('Life Domain', 'Lesser Restoration', 3, false),
    ('Life Domain', 'Spiritual Weapon', 3, false),
    ('Life Domain', 'Beacon of Hope', 5, false),
    ('Life Domain', 'Revivify', 5, false),
    ('Life Domain', 'Death Ward', 7, false),
    ('Life Domain', 'Guardian of Faith', 7, false),
    ('Life Domain', 'Mass Cure Wounds', 9, false),
    ('Life Domain', 'Raise Dead', 9, false),
    ('Light Domain', 'Burning Hands', 1, false),
    ('Light Domain', 'Faerie Fire', 1, false),
    ('Light Domain', 'Flaming Sphere', 3, false),
    ('Light Domain', 'Scorching Ray', 3, false),
    ('Light Domain', 'Daylight', 5, false),
    ('Light Domain', 'Fireball', 5, false),
    ('Light Domain', 'Guardian of Faith', 7, false),
    ('Light Domain', 'Wall of Fire', 7, false),
    ('Light Domain', 'Flame Strike', 9, false),
    ('Light Domain', 'Scrying', 9, false),
    ('Nature Domain', 'Animal Friendship', 1, false),
    ('Nature Domain', 'Speak with Animals', 1, false),
    ('Nature Domain', 'Barkskin', 3, false),
    ('Nature Domain', 'Spike Growth', 3, false),
    ('Nature Domain', 'Plant Growth', 5, false),
    ('Nature Domain', 'Wind Wall', 5, false),
    ('Nature Domain', 'Dominate Beast', 7, false),
    ('Nature Domain', 'Grasping Vine', 7, false),
    ('Nature Domain', 'Insect Plague', 9, false),
    ('Nature Domain', 'Tree Stride', 9, false),
    ('Tempest Domain', 'Fog Cloud', 1, false),
    ('Tempest Domain', 'Thunderwave', 1, false),
    ('Tempest Domain', 'Gust of Wind', 3, false),
    ('Tempest Domain', 'Shatter', 3, false),
    ('Tempest Domain', 'Call Lightning', 5, false),
    ('Tempest Domain', 'Sleet Storm', 5, false),
    ('Tempest Domain', 'Control Water', 7, false),
    ('Tempest Domain', 'Ice Storm', 7, false),
    ('Tempest Domain', 'Destructive Wave', 9, false),
    ('Tempest Domain', 'Insect Plague', 9, false),
    ('Trickery Domain', 'Charm Person', 1, false),
    ('Trickery Domain', 'Disguise Self', 1, false),
    ('Trickery Domain', 'Mirror Image', 3, false),
    ('Trickery Domain', 'Pass without Trace', 3, false),
    ('Trickery Domain', 'Blink', 5, false),
    ('Trickery Domain', 'Dispel Magic', 5, false),
    ('Trickery Domain', 'Dimension Door', 7, false),
    ('Trickery Domain', 'Polymorph', 7, false),
    ('Trickery Domain', 'Dominate Person', 9, false),
    ('Trickery Domain', 'Modify Memory', 9, false),
    ('War Domain', 'Divine Favor', 1, false),
    ('War Domain', 'Shield of Faith', 1, false),
    ('War Domain', 'Magic Weapon', 3, false),
    ('War Domain', 'Spiritual Weapon', 3, false),
    ('War Domain', 'Crusader''s Mantle', 5, false),
    ('War Domain', 'Spirit Guardians', 5, false),
    ('War Domain', 'Freedom of Movement', 7, false),
    ('War Domain', 'Stoneskin', 7, false),
    ('War Domain', 'Flame Strike', 9, false),
    ('War Domain', 'Hold Monster', 9, false),
    ('Oath of Devotion', 'Protection from Evil and Good', 3, false),
    ('Oath of Devotion', 'Sanctuary', 3, false),
    ('Oath of Devotion', 'Lesser Restoration', 5, false),
    ('Oath of Devotion', 'Zone of Truth', 5, false),
    ('Oath of Devotion', 'Beacon of Hope', 9, false),
    ('Oath of Devotion', 'Dispel Magic', 9, false),
    ('Oath of Devotion', 'Freedom of Movement', 13, false),
    ('Oath of Devotion', 'Guardian of Faith', 13, false),
    ('Oath of Devotion', 'Commune', 17, false),
    ('Oath of Devotion', 'Flame Strike', 17, false)
)
INSERT INTO public.subclass_bonus_spells (
  subclass_id,
  spell_id,
  required_class_level,
  counts_against_selection_limit
)
SELECT
  subclasses.id,
  spell_lookup.id,
  subclass_spell_links.required_class_level,
  subclass_spell_links.counts_against_selection_limit
FROM subclass_spell_links
JOIN public.subclasses
  ON subclasses.name = subclass_spell_links.subclass_name
 AND subclasses.source = 'PHB'
JOIN LATERAL (
  SELECT spells.id
  FROM public.spells
  WHERE lower(spells.name) = lower(subclass_spell_links.spell_name)
    AND spells.source IN ('PHB', 'SRD', 'srd', 'ERftLW')
  ORDER BY CASE spells.source
    WHEN 'PHB' THEN 0
    WHEN 'SRD' THEN 1
    WHEN 'srd' THEN 2
    WHEN 'ERftLW' THEN 3
    ELSE 4
  END
  LIMIT 1
) AS spell_lookup ON TRUE
ON CONFLICT (subclass_id, spell_id, required_class_level) DO UPDATE SET
  counts_against_selection_limit = EXCLUDED.counts_against_selection_limit;
