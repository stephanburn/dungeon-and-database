-- PHB 2014 spell completion pass, slice 1:
-- replace placeholder PHB spell rows with structured metadata for the
-- currently-seeded subclass spell set used by Oath of the Ancients,
-- Knowledge Domain, and Oath of Vengeance.

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
    ('Ensnaring Strike', 1, 'Conjuration', '1 bonus action', 'Self', '{"verbal":true,"somatic":true,"material":false}'::jsonb, 'Up to 1 minute', true, false, 'Your next weapon hit can call forth grasping vines that restrain the target if it fails to resist.', ARRAY['Ranger']::text[]),
    ('Speak with Animals', 1, 'Divination', '1 action', 'Self', '{"verbal":true,"somatic":false,"material":false}'::jsonb, '10 minutes', false, true, 'You gain the ability to communicate simple ideas with beasts for a short time.', ARRAY['Bard','Druid','Ranger']::text[]),
    ('Moonbeam', 2, 'Evocation', '1 action', '120 feet', '{"verbal":true,"somatic":true,"material":true,"material_description":"several seeds of a moonseed plant and a piece of opalescent feldspar"}'::jsonb, 'Up to 1 minute', true, false, 'A radiant cylinder burns creatures that enter it or begin their turn within it.', ARRAY['Druid']::text[]),
    ('Misty Step', 2, 'Conjuration', '1 bonus action', 'Self', '{"verbal":true,"somatic":false,"material":false}'::jsonb, 'Instantaneous', false, false, 'Teleport yourself a short distance in a shimmer of silvery mist.', ARRAY['Sorcerer','Warlock','Wizard']::text[]),
    ('Plant Growth', 3, 'Transmutation', '1 action', '150 feet', '{"verbal":true,"somatic":true,"material":false}'::jsonb, 'Instantaneous or 8 hours', false, false, 'Either overgrow normal plants into difficult terrain or enrich land for an extended period.', ARRAY['Bard','Druid','Ranger']::text[]),
    ('Protection from Energy', 3, 'Abjuration', '1 action', 'Touch', '{"verbal":true,"somatic":true,"material":false}'::jsonb, 'Up to 1 hour', true, false, 'Grant a willing creature resistance to one chosen energy type.', ARRAY['Druid','Ranger','Sorcerer','Wizard']::text[]),
    ('Ice Storm', 4, 'Evocation', '1 action', '300 feet', '{"verbal":true,"somatic":true,"material":true,"material_description":"a pinch of dust and a few drops of water"}'::jsonb, 'Instantaneous', false, false, 'A hailstorm batters creatures in an area and leaves the ground slick and difficult.', ARRAY['Druid','Sorcerer','Wizard']::text[]),
    ('Stoneskin', 4, 'Abjuration', '1 action', 'Touch', '{"verbal":true,"somatic":true,"material":true,"material_description":"diamond dust worth 100 gp, consumed by the spell"}'::jsonb, 'Up to 1 hour', true, false, 'A creature''s flesh hardens to resist nonmagical weapon strikes.', ARRAY['Druid','Ranger','Sorcerer','Wizard']::text[]),
    ('Commune with Nature', 5, 'Divination', '1 minute', 'Self', '{"verbal":true,"somatic":true,"material":false}'::jsonb, 'Instantaneous', false, true, 'You briefly merge with natural surroundings to learn about terrain, creatures, and magic nearby.', ARRAY['Druid','Ranger']::text[]),
    ('Tree Stride', 5, 'Conjuration', '1 action', 'Self', '{"verbal":true,"somatic":true,"material":false}'::jsonb, 'Up to 1 minute', true, false, 'Step between living trees as a fast magical means of travel.', ARRAY['Druid','Ranger']::text[]),

    ('Command', 1, 'Enchantment', '1 action', '60 feet', '{"verbal":true,"somatic":false,"material":false}'::jsonb, '1 round', false, false, 'Speak a compelling one-word order that can direct a creature''s next action.', ARRAY['Cleric','Paladin']::text[]),
    ('Identify', 1, 'Divination', '1 minute', 'Touch', '{"verbal":true,"somatic":true,"material":true,"material_description":"a pearl worth at least 100 gp and an owl feather"}'::jsonb, 'Instantaneous', false, true, 'Reveal magical properties, charges, and other key details of an object or effect.', ARRAY['Bard','Wizard']::text[]),
    ('Suggestion', 2, 'Enchantment', '1 action', '30 feet', '{"verbal":true,"somatic":false,"material":true,"material_description":"a snake''s tongue and either a bit of honeycomb or a drop of sweet oil"}'::jsonb, 'Up to 8 hours', true, false, 'Plant a persuasive course of action in a creature''s mind.', ARRAY['Bard','Sorcerer','Warlock','Wizard']::text[]),
    ('Nondetection', 3, 'Abjuration', '1 action', 'Touch', '{"verbal":true,"somatic":true,"material":true,"material_description":"diamond dust worth 25 gp sprinkled over the target"}'::jsonb, '8 hours', false, false, 'Hide a creature, place, or object from divination magic.', ARRAY['Bard','Ranger','Wizard']::text[]),
    ('Speak with Dead', 3, 'Necromancy', '1 action', '10 feet', '{"verbal":true,"somatic":true,"material":true,"material_description":"burning incense"}'::jsonb, '10 minutes', false, false, 'Temporarily grant a corpse enough animation to answer a limited set of questions.', ARRAY['Bard','Cleric']::text[]),
    ('Arcane Eye', 4, 'Divination', '1 action', '30 feet', '{"verbal":true,"somatic":true,"material":true,"material_description":"a bit of bat fur"}'::jsonb, 'Up to 1 hour', true, false, 'Create an invisible magical sensor that you can move and perceive through.', ARRAY['Wizard']::text[]),
    ('Confusion', 4, 'Enchantment', '1 action', '90 feet', '{"verbal":true,"somatic":true,"material":true,"material_description":"three nut shells"}'::jsonb, 'Up to 1 minute', true, false, 'Twist creatures'' thoughts so they behave unpredictably in combat.', ARRAY['Bard','Druid','Sorcerer','Wizard']::text[]),
    ('Legend Lore', 5, 'Divination', '10 minutes', 'Self', '{"verbal":true,"somatic":true,"material":true,"material_description":"incense worth 250 gp and four ivory strips worth 50 gp each"}'::jsonb, 'Instantaneous', false, false, 'Call on magical lore to learn significant stories about a person, place, or thing.', ARRAY['Bard','Cleric','Wizard']::text[]),
    ('Scrying', 5, 'Divination', '10 minutes', 'Self', '{"verbal":true,"somatic":true,"material":true,"material_description":"a focus worth at least 1,000 gp, such as a crystal ball, silver mirror, or holy font"}'::jsonb, 'Up to 10 minutes', true, false, 'Spy on a distant creature through a magical sensor.', ARRAY['Bard','Cleric','Druid','Warlock','Wizard']::text[]),

    ('Bane', 1, 'Enchantment', '1 action', '30 feet', '{"verbal":true,"somatic":true,"material":true,"material_description":"a drop of blood"}'::jsonb, 'Up to 1 minute', true, false, 'Curse several creatures so their attacks and saving throws become less reliable.', ARRAY['Bard','Cleric']::text[]),
    ('Hunter''s Mark', 1, 'Divination', '1 bonus action', '90 feet', '{"verbal":true,"somatic":false,"material":false}'::jsonb, 'Up to 1 hour', true, false, 'Mark a foe so your weapon strikes bite harder and your tracking improves.', ARRAY['Ranger']::text[]),
    ('Hold Person', 2, 'Enchantment', '1 action', '60 feet', '{"verbal":true,"somatic":true,"material":true,"material_description":"a small, straight piece of iron"}'::jsonb, 'Up to 1 minute', true, false, 'Paralyze a humanoid target that fails to resist the spell.', ARRAY['Bard','Cleric','Sorcerer','Warlock','Wizard']::text[]),
    ('Haste', 3, 'Transmutation', '1 action', '30 feet', '{"verbal":true,"somatic":true,"material":true,"material_description":"a shaving of licorice root"}'::jsonb, 'Up to 1 minute', true, false, 'Accelerate a willing creature so it moves faster and gains extra combat efficiency.', ARRAY['Sorcerer','Wizard']::text[]),
    ('Banishment', 4, 'Abjuration', '1 action', '60 feet', '{"verbal":true,"somatic":true,"material":true,"material_description":"an item distasteful to the target"}'::jsonb, 'Up to 1 minute', true, false, 'Shunt a creature to a harmless demiplane or back to its home plane.', ARRAY['Cleric','Paladin','Sorcerer','Warlock','Wizard']::text[]),
    ('Dimension Door', 4, 'Conjuration', '1 action', '500 feet', '{"verbal":true,"somatic":false,"material":false}'::jsonb, 'Instantaneous', false, false, 'Teleport yourself and optionally one companion a significant distance.', ARRAY['Bard','Sorcerer','Warlock','Wizard']::text[]),
    ('Hold Monster', 5, 'Enchantment', '1 action', '90 feet', '{"verbal":true,"somatic":true,"material":true,"material_description":"a small, straight piece of iron"}'::jsonb, 'Up to 1 minute', true, false, 'Paralyze a creature of any type that fails to resist the spell.', ARRAY['Bard','Sorcerer','Warlock','Wizard']::text[])
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
