-- PHB 2014 spell completion pass, slice 2:
-- replace another batch of placeholder PHB spell rows with structured metadata.

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
    ('Aid', 2, 'Abjuration', '1 action', '30 feet', '{"verbal":true,"somatic":true,"material":true,"material_description":"a tiny strip of white cloth"}'::jsonb, '8 hours', false, false, 'Bolster up to three creatures with increased current and maximum hit points.', ARRAY['Cleric','Paladin']::text[]),
    ('Alarm', 1, 'Abjuration', '1 minute', '30 feet', '{"verbal":true,"somatic":true,"material":true,"material_description":"a tiny bell and a piece of fine silver wire"}'::jsonb, '8 hours', false, true, 'Ward an area so it produces a mental or audible alarm when intruders enter.', ARRAY['Ranger','Wizard']::text[]),
    ('Animal Friendship', 1, 'Enchantment', '1 action', '30 feet', '{"verbal":true,"somatic":true,"material":true,"material_description":"a morsel of food"}'::jsonb, '24 hours', false, false, 'Convince a beast that you mean it no harm if it fails to resist your magic.', ARRAY['Bard','Druid','Ranger']::text[]),
    ('Animal Messenger', 2, 'Enchantment', '1 action', '30 feet', '{"verbal":true,"somatic":true,"material":true,"material_description":"a morsel of food"}'::jsonb, '24 hours', false, false, 'Enlist a Tiny beast to carry a short spoken message to a named destination.', ARRAY['Bard','Druid','Ranger']::text[]),
    ('Antilife Shell', 5, 'Abjuration', '1 action', 'Self', '{"verbal":true,"somatic":true,"material":true,"material_description":"a pinch of powdered iron"}'::jsonb, 'Up to 1 hour', true, false, 'Surround yourself with a barrier that keeps most living creatures from approaching closely.', ARRAY['Druid']::text[]),
    ('Arcane Lock', 2, 'Abjuration', '1 action', 'Touch', '{"verbal":true,"somatic":true,"material":true,"material_description":"gold dust worth at least 25 gp, consumed by the spell"}'::jsonb, 'Until dispelled', false, false, 'Magically secure a door, gate, chest, or similar entry point against intrusion.', ARRAY['Wizard']::text[]),
    ('Armor of Agathys', 1, 'Abjuration', '1 action', 'Self', '{"verbal":true,"somatic":true,"material":true,"material_description":"a cup of water"}'::jsonb, '1 hour', false, false, 'Wrap yourself in freezing magical force that punishes creatures that strike you in melee.', ARRAY['Warlock']::text[]),
    ('Aura of Purity', 4, 'Abjuration', '1 action', 'Self (30-foot radius)', '{"verbal":true,"somatic":false,"material":false}'::jsonb, 'Up to 10 minutes', true, false, 'Radiate protective magic that helps nearby allies resist debilitating conditions.', ARRAY['Paladin']::text[]),
    ('Aura of Vitality', 3, 'Evocation', '1 action', 'Self (30-foot radius)', '{"verbal":true,"somatic":false,"material":false}'::jsonb, 'Up to 1 minute', true, false, 'Project a healing aura that lets you restore vigor round after round.', ARRAY['Paladin']::text[]),
    ('Awaken', 5, 'Transmutation', '8 hours', 'Touch', '{"verbal":true,"somatic":true,"material":true,"material_description":"an agate worth at least 1,000 gp, consumed by the spell"}'::jsonb, 'Instantaneous', false, false, 'Grant a beast or plant intelligence and self-awareness through lengthy magic.', ARRAY['Bard','Druid']::text[]),
    ('Beacon of Hope', 3, 'Abjuration', '1 action', '30 feet', '{"verbal":true,"somatic":true,"material":true,"material_description":"a small strip of white cloth"}'::jsonb, 'Up to 1 minute', true, false, 'Inspire allies so wisdom saves improve and healing always restores its best result.', ARRAY['Cleric']::text[]),
    ('Beast Sense', 2, 'Divination', '1 action', 'Touch', '{"verbal":false,"somatic":true,"material":false}'::jsonb, 'Up to 1 hour', true, false, 'Perceive through a willing beast''s senses while your own body remains blind and deaf.', ARRAY['Druid','Ranger']::text[]),
    ('Bigby''s Hand', 5, 'Evocation', '1 action', '120 feet', '{"verbal":true,"somatic":true,"material":true,"material_description":"an eggshell and a snakeskin glove"}'::jsonb, 'Up to 1 minute', true, false, 'Create a giant magical hand that can strike, shove, grasp, or shield at your command.', ARRAY['Wizard']::text[]),
    ('Blink', 3, 'Transmutation', '1 action', 'Self', '{"verbal":true,"somatic":true,"material":true,"material_description":"a drop of mercury"}'::jsonb, '1 minute', false, false, 'Slip in and out of the Ethereal Plane unpredictably between turns.', ARRAY['Sorcerer','Wizard']::text[]),
    ('Calm Emotions', 2, 'Enchantment', '1 action', '60 feet', '{"verbal":true,"somatic":true,"material":false}'::jsonb, 'Up to 1 minute', true, false, 'Dampen strong feelings to suppress hostility or reduce charm and fear effects.', ARRAY['Bard','Cleric']::text[]),
    ('Compelled Duel', 1, 'Enchantment', '1 bonus action', '30 feet', '{"verbal":true,"somatic":false,"material":false}'::jsonb, 'Up to 1 minute', true, false, 'Challenge a creature to focus its attention on you under divine pressure.', ARRAY['Paladin']::text[]),
    ('Comprehend Languages', 1, 'Divination', '1 action', 'Self', '{"verbal":true,"somatic":true,"material":true,"material_description":"a pinch of soot and salt"}'::jsonb, '1 hour', false, true, 'Understand the literal meaning of spoken and written languages for a time.', ARRAY['Bard','Sorcerer','Warlock','Wizard']::text[]),
    ('Continual Flame', 2, 'Evocation', '1 action', 'Touch', '{"verbal":true,"somatic":true,"material":true,"material_description":"ruby dust worth 50 gp, consumed by the spell"}'::jsonb, 'Until dispelled', false, false, 'Ignite an object with magical flame that sheds light without consuming fuel.', ARRAY['Cleric','Wizard']::text[]),
    ('Create Food and Water', 3, 'Conjuration', '1 action', '30 feet', '{"verbal":true,"somatic":true,"material":false}'::jsonb, 'Instantaneous', false, false, 'Conjure enough bland nourishment and water to sustain a group for a day.', ARRAY['Cleric','Paladin']::text[]),
    ('Darkness', 2, 'Evocation', '1 action', '60 feet', '{"verbal":true,"somatic":true,"material":true,"material_description":"bat fur and a drop of pitch or piece of coal"}'::jsonb, 'Up to 10 minutes', true, false, 'Spread magical darkness that blocks normal vision and can engulf an area or object.', ARRAY['Sorcerer','Warlock','Wizard']::text[]),
    ('Detect Magic', 1, 'Divination', '1 action', 'Self', '{"verbal":true,"somatic":true,"material":false}'::jsonb, 'Up to 10 minutes', true, true, 'Sense nearby magic and learn the school tied to visible magical auras.', ARRAY['Bard','Cleric','Druid','Paladin','Ranger','Sorcerer','Wizard']::text[]),
    ('Detect Poison and Disease', 1, 'Divination', '1 action', 'Self', '{"verbal":true,"somatic":true,"material":true,"material_description":"a yew leaf"}'::jsonb, 'Up to 10 minutes', true, true, 'Sense nearby poison, poisonous creatures, and disease sources.', ARRAY['Cleric','Druid','Paladin','Ranger']::text[]),
    ('Detect Thoughts', 2, 'Divination', '1 action', 'Self', '{"verbal":true,"somatic":true,"material":true,"material_description":"a copper piece"}'::jsonb, 'Up to 1 minute', true, false, 'Read surface thoughts and probe deeper into a creature''s mind if it resists poorly.', ARRAY['Bard','Sorcerer','Wizard']::text[]),
    ('Disguise Self', 1, 'Illusion', '1 action', 'Self', '{"verbal":true,"somatic":false,"material":false}'::jsonb, '1 hour', false, false, 'Alter your appearance with illusion magic while leaving your body physically unchanged.', ARRAY['Bard','Sorcerer','Wizard']::text[]),
    ('Dream', 5, 'Illusion', '1 minute', 'Special', '{"verbal":true,"somatic":true,"material":true,"material_description":"a handful of sand, a dab of ink, and a writing quill plucked from a sleeping bird"}'::jsonb, '8 hours', false, false, 'Send a messenger into a sleeping creature''s dreams to converse or torment from afar.', ARRAY['Bard','Warlock','Wizard']::text[]),
    ('Expeditious Retreat', 1, 'Transmutation', '1 bonus action', 'Self', '{"verbal":true,"somatic":true,"material":false}'::jsonb, 'Up to 10 minutes', true, false, 'Magically hasten yourself so you can dash more efficiently in combat.', ARRAY['Sorcerer','Warlock','Wizard']::text[]),
    ('Find Traps', 2, 'Divination', '1 action', '120 feet', '{"verbal":true,"somatic":true,"material":false}'::jsonb, 'Instantaneous', false, false, 'Sense whether a visible area contains a trap designed to cause harm or mischief.', ARRAY['Cleric','Druid','Ranger']::text[])
)
UPDATE public.spells AS spell
SET
  level = data.level,
  school = data.school,
  casting_time = data.casting_time,
  range = data.range,
  components = data.components,
  duration = data.duration,
  concentration = data.concentration,
  ritual = data.ritual,
  description = data.description,
  classes = COALESCE((
    SELECT array_agg(picked.id ORDER BY picked.name)
    FROM (
      SELECT DISTINCT ON (c.name) c.id, c.name
      FROM public.classes c
      WHERE c.name = ANY(data.class_names)
        AND c.source IN ('PHB', 'SRD')
      ORDER BY c.name, CASE c.source WHEN 'PHB' THEN 0 WHEN 'SRD' THEN 1 ELSE 2 END
    ) AS picked
  ), ARRAY[]::uuid[]),
  amended = false,
  amendment_note = NULL
FROM spell_data AS data
WHERE spell.name = data.name
  AND spell.source = 'PHB';
