-- PHB 2014 spell completion pass, slice 3:
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
    ('Conjure Animals', 3, 'Conjuration', '1 action', '60 feet', '{"verbal":true,"somatic":true,"material":false}'::jsonb, 'Up to 1 hour', true, false, 'Summon fey spirits that take beast form and fight on your behalf.', ARRAY['Druid','Ranger']::text[]),
    ('Conjure Barrage', 3, 'Conjuration', '1 action', 'Self (60-foot cone)', '{"verbal":true,"somatic":true,"material":true,"material_description":"one piece of ammunition or a thrown weapon"}'::jsonb, 'Instantaneous', false, false, 'Duplicate a ranged weapon attack into a sweeping storm of force across an area.', ARRAY['Ranger']::text[]),
    ('Conjure Elemental', 5, 'Conjuration', '1 minute', '90 feet', '{"verbal":true,"somatic":true,"material":true,"material_description":"burning incense for air, soft clay for earth, sulfur and phosphorus for fire, or water and sand for water"}'::jsonb, 'Up to 1 hour', true, false, 'Call forth an elemental servant that fights under your control while concentration holds.', ARRAY['Druid','Wizard']::text[]),
    ('Conjure Minor Elementals', 4, 'Conjuration', '1 minute', '90 feet', '{"verbal":true,"somatic":true,"material":true,"material_description":"a vial of sand for earth, incense for air, phosphorus for fire, or water and sand for water"}'::jsonb, 'Up to 1 hour', true, false, 'Summon several lesser elementals that obey your commands while the spell lasts.', ARRAY['Druid','Wizard']::text[]),
    ('Control Water', 4, 'Transmutation', '1 action', '300 feet', '{"verbal":true,"somatic":true,"material":true,"material_description":"a drop of water and a pinch of dust"}'::jsonb, 'Up to 10 minutes', true, false, 'Redirect, part, flood, or whirl a large body of water within range.', ARRAY['Cleric','Druid','Wizard']::text[]),
    ('Creation', 5, 'Illusion', '1 minute', '30 feet', '{"verbal":true,"somatic":true,"material":true,"material_description":"a tiny piece of matter of the same sort as the item you plan to create"}'::jsonb, 'Special', false, false, 'Shape shadowy material into a temporary nonliving object of your choosing.', ARRAY['Sorcerer','Wizard']::text[]),
    ('Dominate Beast', 4, 'Enchantment', '1 action', '60 feet', '{"verbal":true,"somatic":true,"material":false}'::jsonb, 'Up to 1 minute', true, false, 'Seize direct control of a beast that fails to resist your will.', ARRAY['Druid','Ranger']::text[]),
    ('Elemental Weapon', 3, 'Transmutation', '1 action', 'Touch', '{"verbal":true,"somatic":true,"material":false}'::jsonb, 'Up to 1 hour', true, false, 'Imbue a nonmagical weapon with elemental power and improved striking ability.', ARRAY['Paladin','Ranger']::text[]),
    ('Fabricate', 4, 'Transmutation', '10 minutes', '120 feet', '{"verbal":true,"somatic":true,"material":false}'::jsonb, 'Instantaneous', false, false, 'Transform raw materials into a finished item or structure that matches your craftsmanship.', ARRAY['Wizard']::text[]),
    ('Fog Cloud', 1, 'Conjuration', '1 action', '120 feet', '{"verbal":true,"somatic":true,"material":false}'::jsonb, 'Up to 1 hour', true, false, 'Create a heavily obscuring bank of fog that blankets an area.', ARRAY['Druid','Ranger','Sorcerer','Wizard']::text[]),
    ('Freedom of Movement', 4, 'Abjuration', '1 action', 'Touch', '{"verbal":true,"somatic":true,"material":true,"material_description":"a leather strap bound around the arm or a similar appendage"}'::jsonb, '1 hour', false, false, 'Protect a creature from restraints, paralysis, and movement-impeding magic.', ARRAY['Bard','Cleric','Druid','Ranger']::text[]),
    ('Glyph of Warding', 3, 'Abjuration', '1 hour', 'Touch', '{"verbal":true,"somatic":true,"material":true,"material_description":"incense and powdered diamond worth at least 200 gp, consumed by the spell"}'::jsonb, 'Until dispelled or triggered', false, false, 'Inscribe a magical trap that unleashes a stored effect when its trigger is met.', ARRAY['Bard','Cleric','Wizard']::text[]),
    ('Goodberry', 1, 'Transmutation', '1 action', 'Touch', '{"verbal":true,"somatic":true,"material":true,"material_description":"a sprig of mistletoe"}'::jsonb, 'Instantaneous', false, false, 'Infuse berries with magic so they nourish and heal when eaten.', ARRAY['Druid','Ranger']::text[]),
    ('Greater Restoration', 5, 'Abjuration', '1 action', 'Touch', '{"verbal":true,"somatic":true,"material":true,"material_description":"diamond dust worth at least 100 gp, consumed by the spell"}'::jsonb, 'Instantaneous', false, false, 'Undo one of several severe afflictions, including curses and debilitating reductions.', ARRAY['Bard','Cleric','Druid']::text[]),
    ('Guardian of Faith', 4, 'Conjuration', '1 action', '30 feet', '{"verbal":true,"somatic":false,"material":false}'::jsonb, '8 hours', false, false, 'Summon a spectral guardian that harms enemies moving near its post.', ARRAY['Cleric']::text[]),
    ('Gust of Wind', 2, 'Evocation', '1 action', 'Self (60-foot line)', '{"verbal":true,"somatic":true,"material":true,"material_description":"a legume seed"}'::jsonb, 'Up to 1 minute', true, false, 'Unleash a strong line of wind that pushes creatures and clears vapors.', ARRAY['Druid','Sorcerer','Wizard']::text[]),
    ('Hallow', 5, 'Evocation', '24 hours', 'Touch', '{"verbal":true,"somatic":true,"material":true,"material_description":"herbs, oils, and incense worth at least 1,000 gp, consumed by the spell"}'::jsonb, 'Until dispelled', false, false, 'Consecrate an area with long-lasting holy power and optional magical conditions.', ARRAY['Cleric']::text[]),
    ('Healing Word', 1, 'Evocation', '1 bonus action', '60 feet', '{"verbal":true,"somatic":false,"material":false}'::jsonb, 'Instantaneous', false, false, 'Restore a small amount of hit points to a creature you can see at range.', ARRAY['Bard','Cleric','Druid']::text[]),
    ('Jump', 1, 'Transmutation', '1 action', 'Touch', '{"verbal":true,"somatic":true,"material":false}'::jsonb, '1 minute', false, false, 'Triple a creature''s jumping distance for a short time.', ARRAY['Druid','Ranger','Sorcerer','Wizard']::text[]),
    ('Knock', 2, 'Transmutation', '1 action', '60 feet', '{"verbal":true,"somatic":false,"material":false}'::jsonb, 'Instantaneous', false, false, 'Force open a locked or barred object and loudly announce the magic.', ARRAY['Bard','Sorcerer','Wizard']::text[]),
    ('Leomund''s Tiny Hut', 3, 'Evocation', '1 minute', 'Self (10-foot-radius hemisphere)', '{"verbal":true,"somatic":true,"material":true,"material_description":"a small crystal bead"}'::jsonb, '8 hours', false, true, 'Create a secure, climate-controlled shelter that bars most outside intrusion.', ARRAY['Bard','Wizard']::text[]),
    ('Locate Animals or Plants', 2, 'Divination', '1 action', 'Self', '{"verbal":true,"somatic":true,"material":true,"material_description":"a bit of fur from a bloodhound"}'::jsonb, 'Instantaneous', false, true, 'Sense the direction and distance to a named creature type or plant within range.', ARRAY['Bard','Druid','Ranger']::text[]),
    ('Locate Creature', 4, 'Divination', '1 action', 'Self', '{"verbal":true,"somatic":true,"material":true,"material_description":"a bit of fur from a bloodhound"}'::jsonb, 'Up to 1 hour', true, false, 'Track the direction of a known creature while it remains close enough and not magically hidden.', ARRAY['Bard','Cleric','Druid','Paladin','Ranger','Wizard']::text[]),
    ('Magic Circle', 3, 'Abjuration', '1 minute', '10 feet', '{"verbal":true,"somatic":true,"material":true,"material_description":"holy water or powdered silver and iron worth at least 100 gp, consumed by the spell"}'::jsonb, '1 hour', false, false, 'Create a warded cylinder that keeps out or traps certain extraplanar creature types.', ARRAY['Cleric','Paladin','Warlock','Wizard']::text[]),
    ('Magic Weapon', 2, 'Transmutation', '1 bonus action', 'Touch', '{"verbal":true,"somatic":true,"material":false}'::jsonb, 'Up to 1 hour', true, false, 'Turn a nonmagical weapon into an enchanted one with a bonus to attack and damage rolls.', ARRAY['Paladin','Ranger','Sorcerer','Wizard']::text[])
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
