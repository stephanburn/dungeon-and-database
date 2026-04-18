-- PHB 2014 spell completion pass, slice 4:
-- replace the final batch of placeholder PHB spell rows with structured metadata.

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
    ('Unseen Servant', 1, 'Conjuration', '1 action', '60 feet', '{"verbal":true,"somatic":true,"material":true,"material_description":"a piece of string and a bit of wood"}'::jsonb, '1 hour', false, true, 'Create an invisible, mindless force that performs simple household tasks at your command.', ARRAY['Bard','Warlock','Wizard']::text[]),
    ('Stone Shape', 4, 'Transmutation', '1 action', 'Touch', '{"verbal":true,"somatic":true,"material":true,"material_description":"soft clay, which must be worked into roughly the desired shape of the stone object"}'::jsonb, 'Instantaneous', false, false, 'Reshape a section of stone into a new form, including openings or crafted details.', ARRAY['Cleric','Druid','Wizard']::text[]),
    ('Pass without Trace', 2, 'Abjuration', '1 action', 'Self', '{"verbal":true,"somatic":true,"material":true,"material_description":"ashes from a burned leaf of mistletoe and a sprig of spruce"}'::jsonb, 'Up to 1 hour', true, false, 'Veil you and nearby allies from detection while bolstering stealth and masking tracks.', ARRAY['Druid','Ranger']::text[]),
    ('Phantom Steed', 3, 'Illusion', '1 minute', '30 feet', '{"verbal":true,"somatic":false,"material":false}'::jsonb, '1 hour', false, true, 'Summon a quasi-real mount with exceptional speed that serves one rider.', ARRAY['Wizard']::text[]),
    ('Teleportation Circle', 5, 'Conjuration', '1 minute', '10 feet', '{"verbal":true,"somatic":false,"material":true,"material_description":"rare chalks and inks infused with precious gems worth 50 gp, consumed by the spell"}'::jsonb, '1 round', false, false, 'Open a temporary portal linked to a permanent teleportation circle whose sigil sequence you know.', ARRAY['Bard','Sorcerer','Wizard']::text[]),
    ('Shield of Faith', 1, 'Abjuration', '1 bonus action', '60 feet', '{"verbal":true,"somatic":true,"material":true,"material_description":"a small parchment with a bit of holy text written on it"}'::jsonb, 'Up to 10 minutes', true, false, 'Surround a creature with shimmering divine protection that increases Armor Class.', ARRAY['Cleric','Paladin']::text[]),
    ('Warding Bond', 2, 'Abjuration', '1 action', 'Touch', '{"verbal":true,"somatic":true,"material":true,"material_description":"a pair of platinum rings worth at least 50 gp each, which you and the target must wear for the duration"}'::jsonb, '1 hour', false, false, 'Link yourself to an ally so it gains protection while you share part of the harm it suffers.', ARRAY['Cleric']::text[]),
    ('Zone of Truth', 2, 'Enchantment', '1 action', '60 feet', '{"verbal":true,"somatic":true,"material":false}'::jsonb, '10 minutes', false, false, 'Create an area where creatures cannot knowingly speak deliberate lies.', ARRAY['Bard','Cleric','Paladin']::text[]),
    ('Prayer of Healing', 2, 'Evocation', '10 minutes', '30 feet', '{"verbal":true,"somatic":false,"material":false}'::jsonb, 'Instantaneous', false, false, 'Lead a brief prayer that restores hit points to several willing creatures nearby.', ARRAY['Cleric']::text[]),
    ('Mass Healing Word', 3, 'Evocation', '1 bonus action', '60 feet', '{"verbal":true,"somatic":false,"material":false}'::jsonb, 'Instantaneous', false, false, 'Restore a small amount of hit points to up to six creatures you can see at range.', ARRAY['Cleric']::text[]),
    ('Sleep', 1, 'Enchantment', '1 action', '90 feet', '{"verbal":true,"somatic":true,"material":true,"material_description":"a pinch of fine sand, rose petals, or a cricket"}'::jsonb, '1 minute', false, false, 'Roll magical slumber across a group of creatures, starting with those that have the fewest hit points.', ARRAY['Bard','Sorcerer','Wizard']::text[]),
    ('Mordenkainen''s Private Sanctum', 4, 'Abjuration', '10 minutes', '120 feet', '{"verbal":true,"somatic":true,"material":true,"material_description":"a thin sheet of lead, a piece of opaque glass, a wad of cotton or cloth, and powdered chrysolite"}'::jsonb, '24 hours', false, false, 'Seal an area against divination, teleportation, and sensory intrusion with layered magical privacy.', ARRAY['Wizard']::text[]),
    ('Mordenkainen''s Faithful Hound', 4, 'Conjuration', '1 action', '30 feet', '{"verbal":true,"somatic":true,"material":true,"material_description":"a tiny silver whistle, a piece of bone, and a thread"}'::jsonb, '8 hours', false, false, 'Conjure an invisible watchdog that barks at intruders and bites nearby enemies.', ARRAY['Wizard']::text[]),
    ('Leomund''s Secret Chest', 4, 'Conjuration', '1 action', 'Touch', '{"verbal":true,"somatic":true,"material":true,"material_description":"an exquisite chest worth at least 5,000 gp and a Tiny replica made from the same materials worth at least 50 gp"}'::jsonb, 'Instantaneous', false, false, 'Hide a chest and its contents on the Ethereal Plane and recall it with its matching replica.', ARRAY['Wizard']::text[]),
    ('Illusory Script', 1, 'Illusion', '1 minute', 'Touch', '{"verbal":true,"somatic":true,"material":true,"material_description":"a lead-based ink worth at least 10 gp, consumed by the spell"}'::jsonb, '10 days', false, true, 'Write text that displays a false harmless message to others while conveying a secret meaning to chosen readers.', ARRAY['Bard','Warlock','Wizard']::text[]),
    ('Silence', 2, 'Illusion', '1 action', '120 feet', '{"verbal":true,"somatic":false,"material":false}'::jsonb, 'Up to 10 minutes', true, true, 'Create a sphere where all sound is blocked and verbal spellcasting cannot function.', ARRAY['Bard','Cleric','Ranger']::text[]),
    ('Sending', 3, 'Evocation', '1 action', 'Unlimited', '{"verbal":true,"somatic":true,"material":true,"material_description":"a short piece of fine copper wire"}'::jsonb, '1 round', false, false, 'Send a brief message across any distance and receive a short reply in return.', ARRAY['Bard','Cleric','Wizard']::text[]),
    ('Tongues', 3, 'Divination', '1 action', 'Touch', '{"verbal":true,"material":true,"somatic":false,"material_description":"a small clay model of a ziggurat"}'::jsonb, '1 hour', false, false, 'Allow a creature to understand spoken languages and be understood by others.', ARRAY['Bard','Cleric','Sorcerer','Warlock','Wizard']::text[]),
    ('Thunderwave', 1, 'Evocation', '1 action', 'Self (15-foot cube)', '{"verbal":true,"somatic":true,"material":false}'::jsonb, 'Instantaneous', false, false, 'Release a booming wave of force that damages and pushes creatures near you.', ARRAY['Bard','Druid','Sorcerer','Wizard']::text[]),
    ('Levitate', 2, 'Transmutation', '1 action', '60 feet', '{"verbal":true,"somatic":true,"material":true,"material_description":"either a small leather loop or a piece of golden wire bent into a cup shape with a long shank on one end"}'::jsonb, 'Up to 10 minutes', true, false, 'Raise a creature or object into the air and control its vertical movement.', ARRAY['Sorcerer','Wizard']::text[]),
    ('Sleet Storm', 3, 'Conjuration', '1 action', '150 feet', '{"verbal":true,"somatic":true,"material":true,"material_description":"a pinch of dust and a few drops of water"}'::jsonb, 'Up to 1 minute', true, false, 'Fill a broad area with freezing rain and ice that obscures sight and ruins footing.', ARRAY['Druid','Sorcerer','Wizard']::text[]),
    ('Wind Wall', 3, 'Evocation', '1 action', '120 feet', '{"verbal":true,"somatic":true,"material":true,"material_description":"a tiny fan and a feather of exotic origin"}'::jsonb, 'Up to 1 minute', true, false, 'Raise a wall of strong wind that hinders movement, missiles, and gases.', ARRAY['Druid','Ranger','Sorcerer','Wizard']::text[]),
    ('Silent Image', 1, 'Illusion', '1 action', '60 feet', '{"verbal":true,"somatic":true,"material":true,"material_description":"a bit of fleece"}'::jsonb, 'Up to 10 minutes', true, false, 'Create a movable visual illusion within a limited area.', ARRAY['Bard','Sorcerer','Wizard']::text[]),
    ('Major Image', 3, 'Illusion', '1 action', '120 feet', '{"verbal":true,"somatic":true,"material":true,"material_description":"a bit of fleece"}'::jsonb, 'Up to 10 minutes', true, false, 'Create a vivid illusion that can include sound, smell, and temperature.', ARRAY['Bard','Sorcerer','Warlock','Wizard']::text[]),
    ('Hallucinatory Terrain', 4, 'Illusion', '10 minutes', '300 feet', '{"verbal":true,"somatic":true,"material":true,"material_description":"a stone, a twig, and a bit of green plant"}'::jsonb, '24 hours', false, false, 'Make natural terrain look, sound, and smell like another sort of landscape.', ARRAY['Bard','Druid','Warlock','Wizard']::text[]),
    ('Mislead', 5, 'Illusion', '1 action', 'Self', '{"verbal":true,"somatic":false,"material":false}'::jsonb, 'Up to 1 hour', true, false, 'Turn yourself invisible while an illusory double appears and moves under your direction.', ARRAY['Bard','Wizard']::text[])
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
