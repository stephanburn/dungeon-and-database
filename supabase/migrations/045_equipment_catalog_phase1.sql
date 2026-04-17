-- Batch 3e: equipment catalog phase 1.
-- This slice adds queryable catalogs for generic equipment items plus
-- weapon, armor, and shield subtype data. Character-facing consumption lands
-- later; this phase focuses on content shape and inspectability.

CREATE TABLE IF NOT EXISTS public.equipment_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  item_category text NOT NULL,
  cost_quantity int NOT NULL DEFAULT 0 CHECK (cost_quantity >= 0),
  cost_unit text NOT NULL DEFAULT 'gp',
  weight_lb numeric(8,2),
  source text NOT NULL REFERENCES public.sources (key),
  amended boolean NOT NULL DEFAULT false,
  amendment_note text
);

CREATE TABLE IF NOT EXISTS public.weapons (
  item_id uuid PRIMARY KEY REFERENCES public.equipment_items (id) ON DELETE CASCADE,
  weapon_category text NOT NULL,
  weapon_kind text NOT NULL,
  damage_dice text NOT NULL,
  damage_type text NOT NULL,
  properties text[] NOT NULL DEFAULT '{}',
  normal_range int,
  long_range int,
  versatile_damage text
);

CREATE TABLE IF NOT EXISTS public.armor (
  item_id uuid PRIMARY KEY REFERENCES public.equipment_items (id) ON DELETE CASCADE,
  armor_category text NOT NULL,
  base_ac int NOT NULL,
  dex_bonus_cap int,
  minimum_strength int,
  stealth_disadvantage boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.shields (
  item_id uuid PRIMARY KEY REFERENCES public.equipment_items (id) ON DELETE CASCADE,
  armor_class_bonus int NOT NULL DEFAULT 2
);

ALTER TABLE public.equipment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weapons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.armor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shields ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "equipment_items_select_auth" ON public.equipment_items;
CREATE POLICY "equipment_items_select_auth" ON public.equipment_items
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "equipment_items_insert_admin" ON public.equipment_items;
CREATE POLICY "equipment_items_insert_admin" ON public.equipment_items
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "equipment_items_update_admin" ON public.equipment_items;
CREATE POLICY "equipment_items_update_admin" ON public.equipment_items
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "equipment_items_delete_admin" ON public.equipment_items;
CREATE POLICY "equipment_items_delete_admin" ON public.equipment_items
  FOR DELETE USING (public.is_admin());

DROP POLICY IF EXISTS "weapons_select_auth" ON public.weapons;
CREATE POLICY "weapons_select_auth" ON public.weapons
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "weapons_insert_admin" ON public.weapons;
CREATE POLICY "weapons_insert_admin" ON public.weapons
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "weapons_update_admin" ON public.weapons;
CREATE POLICY "weapons_update_admin" ON public.weapons
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "weapons_delete_admin" ON public.weapons;
CREATE POLICY "weapons_delete_admin" ON public.weapons
  FOR DELETE USING (public.is_admin());

DROP POLICY IF EXISTS "armor_select_auth" ON public.armor;
CREATE POLICY "armor_select_auth" ON public.armor
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "armor_insert_admin" ON public.armor;
CREATE POLICY "armor_insert_admin" ON public.armor
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "armor_update_admin" ON public.armor;
CREATE POLICY "armor_update_admin" ON public.armor
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "armor_delete_admin" ON public.armor;
CREATE POLICY "armor_delete_admin" ON public.armor
  FOR DELETE USING (public.is_admin());

DROP POLICY IF EXISTS "shields_select_auth" ON public.shields;
CREATE POLICY "shields_select_auth" ON public.shields
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "shields_insert_admin" ON public.shields;
CREATE POLICY "shields_insert_admin" ON public.shields
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "shields_update_admin" ON public.shields;
CREATE POLICY "shields_update_admin" ON public.shields
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "shields_delete_admin" ON public.shields;
CREATE POLICY "shields_delete_admin" ON public.shields
  FOR DELETE USING (public.is_admin());

INSERT INTO public.equipment_items (key, name, item_category, cost_quantity, cost_unit, weight_lb, source) VALUES
  ('club', 'Club', 'weapon', 1, 'sp', 2.00, 'PHB'),
  ('dagger', 'Dagger', 'weapon', 2, 'gp', 1.00, 'PHB'),
  ('greatclub', 'Greatclub', 'weapon', 2, 'sp', 10.00, 'PHB'),
  ('handaxe', 'Handaxe', 'weapon', 5, 'gp', 2.00, 'PHB'),
  ('javelin', 'Javelin', 'weapon', 5, 'sp', 2.00, 'PHB'),
  ('light_hammer', 'Light Hammer', 'weapon', 2, 'gp', 2.00, 'PHB'),
  ('mace', 'Mace', 'weapon', 5, 'gp', 4.00, 'PHB'),
  ('quarterstaff', 'Quarterstaff', 'weapon', 2, 'sp', 4.00, 'PHB'),
  ('sickle', 'Sickle', 'weapon', 1, 'gp', 2.00, 'PHB'),
  ('spear', 'Spear', 'weapon', 1, 'gp', 3.00, 'PHB'),
  ('light_crossbow', 'Light Crossbow', 'weapon', 25, 'gp', 5.00, 'PHB'),
  ('dart', 'Dart', 'weapon', 5, 'cp', 0.25, 'PHB'),
  ('shortbow', 'Shortbow', 'weapon', 25, 'gp', 2.00, 'PHB'),
  ('sling', 'Sling', 'weapon', 1, 'sp', 0.00, 'PHB'),
  ('battleaxe', 'Battleaxe', 'weapon', 10, 'gp', 4.00, 'PHB'),
  ('flail', 'Flail', 'weapon', 10, 'gp', 2.00, 'PHB'),
  ('glaive', 'Glaive', 'weapon', 20, 'gp', 6.00, 'PHB'),
  ('greataxe', 'Greataxe', 'weapon', 30, 'gp', 7.00, 'PHB'),
  ('greatsword', 'Greatsword', 'weapon', 50, 'gp', 6.00, 'PHB'),
  ('halberd', 'Halberd', 'weapon', 20, 'gp', 6.00, 'PHB'),
  ('lance', 'Lance', 'weapon', 10, 'gp', 6.00, 'PHB'),
  ('longsword', 'Longsword', 'weapon', 15, 'gp', 3.00, 'PHB'),
  ('maul', 'Maul', 'weapon', 10, 'gp', 10.00, 'PHB'),
  ('morningstar', 'Morningstar', 'weapon', 15, 'gp', 4.00, 'PHB'),
  ('pike', 'Pike', 'weapon', 5, 'gp', 18.00, 'PHB'),
  ('rapier', 'Rapier', 'weapon', 25, 'gp', 2.00, 'PHB'),
  ('scimitar', 'Scimitar', 'weapon', 25, 'gp', 3.00, 'PHB'),
  ('shortsword', 'Shortsword', 'weapon', 10, 'gp', 2.00, 'PHB'),
  ('trident', 'Trident', 'weapon', 5, 'gp', 4.00, 'PHB'),
  ('war_pick', 'War Pick', 'weapon', 5, 'gp', 2.00, 'PHB'),
  ('warhammer', 'Warhammer', 'weapon', 15, 'gp', 2.00, 'PHB'),
  ('whip', 'Whip', 'weapon', 2, 'gp', 3.00, 'PHB'),
  ('blowgun', 'Blowgun', 'weapon', 10, 'gp', 1.00, 'PHB'),
  ('hand_crossbow', 'Hand Crossbow', 'weapon', 75, 'gp', 3.00, 'PHB'),
  ('heavy_crossbow', 'Heavy Crossbow', 'weapon', 50, 'gp', 18.00, 'PHB'),
  ('longbow', 'Longbow', 'weapon', 50, 'gp', 2.00, 'PHB'),
  ('net', 'Net', 'weapon', 1, 'gp', 3.00, 'PHB'),
  ('padded_armor', 'Padded Armor', 'armor', 5, 'gp', 8.00, 'PHB'),
  ('leather_armor', 'Leather Armor', 'armor', 10, 'gp', 10.00, 'PHB'),
  ('studded_leather_armor', 'Studded Leather Armor', 'armor', 45, 'gp', 13.00, 'PHB'),
  ('hide_armor', 'Hide Armor', 'armor', 10, 'gp', 12.00, 'PHB'),
  ('chain_shirt', 'Chain Shirt', 'armor', 50, 'gp', 20.00, 'PHB'),
  ('scale_mail', 'Scale Mail', 'armor', 50, 'gp', 45.00, 'PHB'),
  ('breastplate', 'Breastplate', 'armor', 400, 'gp', 20.00, 'PHB'),
  ('half_plate', 'Half Plate Armor', 'armor', 750, 'gp', 40.00, 'PHB'),
  ('ring_mail', 'Ring Mail', 'armor', 30, 'gp', 40.00, 'PHB'),
  ('chain_mail', 'Chain Mail', 'armor', 75, 'gp', 55.00, 'PHB'),
  ('splint_armor', 'Splint Armor', 'armor', 200, 'gp', 60.00, 'PHB'),
  ('plate_armor', 'Plate Armor', 'armor', 1500, 'gp', 65.00, 'PHB'),
  ('shield', 'Shield', 'shield', 10, 'gp', 6.00, 'PHB')
ON CONFLICT (key) DO UPDATE
SET
  name = EXCLUDED.name,
  item_category = EXCLUDED.item_category,
  cost_quantity = EXCLUDED.cost_quantity,
  cost_unit = EXCLUDED.cost_unit,
  weight_lb = EXCLUDED.weight_lb,
  source = EXCLUDED.source;

INSERT INTO public.weapons (item_id, weapon_category, weapon_kind, damage_dice, damage_type, properties, normal_range, long_range, versatile_damage) VALUES
  ((SELECT id FROM public.equipment_items WHERE key = 'club'), 'simple', 'melee', '1d4', 'bludgeoning', ARRAY['light'], NULL, NULL, NULL),
  ((SELECT id FROM public.equipment_items WHERE key = 'dagger'), 'simple', 'melee', '1d4', 'piercing', ARRAY['finesse', 'light', 'thrown'], 20, 60, NULL),
  ((SELECT id FROM public.equipment_items WHERE key = 'greatclub'), 'simple', 'melee', '1d8', 'bludgeoning', ARRAY['two_handed'], NULL, NULL, NULL),
  ((SELECT id FROM public.equipment_items WHERE key = 'handaxe'), 'simple', 'melee', '1d6', 'slashing', ARRAY['light', 'thrown'], 20, 60, NULL),
  ((SELECT id FROM public.equipment_items WHERE key = 'javelin'), 'simple', 'melee', '1d6', 'piercing', ARRAY['thrown'], 30, 120, NULL),
  ((SELECT id FROM public.equipment_items WHERE key = 'light_hammer'), 'simple', 'melee', '1d4', 'bludgeoning', ARRAY['light', 'thrown'], 20, 60, NULL),
  ((SELECT id FROM public.equipment_items WHERE key = 'mace'), 'simple', 'melee', '1d6', 'bludgeoning', ARRAY[]::text[], NULL, NULL, NULL),
  ((SELECT id FROM public.equipment_items WHERE key = 'quarterstaff'), 'simple', 'melee', '1d6', 'bludgeoning', ARRAY['versatile'], NULL, NULL, '1d8'),
  ((SELECT id FROM public.equipment_items WHERE key = 'sickle'), 'simple', 'melee', '1d4', 'slashing', ARRAY['light'], NULL, NULL, NULL),
  ((SELECT id FROM public.equipment_items WHERE key = 'spear'), 'simple', 'melee', '1d6', 'piercing', ARRAY['thrown', 'versatile'], 20, 60, '1d8'),
  ((SELECT id FROM public.equipment_items WHERE key = 'light_crossbow'), 'simple', 'ranged', '1d8', 'piercing', ARRAY['ammunition', 'loading', 'two_handed'], 80, 320, NULL),
  ((SELECT id FROM public.equipment_items WHERE key = 'dart'), 'simple', 'ranged', '1d4', 'piercing', ARRAY['finesse', 'thrown'], 20, 60, NULL),
  ((SELECT id FROM public.equipment_items WHERE key = 'shortbow'), 'simple', 'ranged', '1d6', 'piercing', ARRAY['ammunition', 'two_handed'], 80, 320, NULL),
  ((SELECT id FROM public.equipment_items WHERE key = 'sling'), 'simple', 'ranged', '1d4', 'bludgeoning', ARRAY['ammunition'], 30, 120, NULL),
  ((SELECT id FROM public.equipment_items WHERE key = 'battleaxe'), 'martial', 'melee', '1d8', 'slashing', ARRAY['versatile'], NULL, NULL, '1d10'),
  ((SELECT id FROM public.equipment_items WHERE key = 'flail'), 'martial', 'melee', '1d8', 'bludgeoning', ARRAY[]::text[], NULL, NULL, NULL),
  ((SELECT id FROM public.equipment_items WHERE key = 'glaive'), 'martial', 'melee', '1d10', 'slashing', ARRAY['heavy', 'reach', 'two_handed'], NULL, NULL, NULL),
  ((SELECT id FROM public.equipment_items WHERE key = 'greataxe'), 'martial', 'melee', '1d12', 'slashing', ARRAY['heavy', 'two_handed'], NULL, NULL, NULL),
  ((SELECT id FROM public.equipment_items WHERE key = 'greatsword'), 'martial', 'melee', '2d6', 'slashing', ARRAY['heavy', 'two_handed'], NULL, NULL, NULL),
  ((SELECT id FROM public.equipment_items WHERE key = 'halberd'), 'martial', 'melee', '1d10', 'slashing', ARRAY['heavy', 'reach', 'two_handed'], NULL, NULL, NULL),
  ((SELECT id FROM public.equipment_items WHERE key = 'lance'), 'martial', 'melee', '1d12', 'piercing', ARRAY['reach', 'special'], NULL, NULL, NULL),
  ((SELECT id FROM public.equipment_items WHERE key = 'longsword'), 'martial', 'melee', '1d8', 'slashing', ARRAY['versatile'], NULL, NULL, '1d10'),
  ((SELECT id FROM public.equipment_items WHERE key = 'maul'), 'martial', 'melee', '2d6', 'bludgeoning', ARRAY['heavy', 'two_handed'], NULL, NULL, NULL),
  ((SELECT id FROM public.equipment_items WHERE key = 'morningstar'), 'martial', 'melee', '1d8', 'piercing', ARRAY[]::text[], NULL, NULL, NULL),
  ((SELECT id FROM public.equipment_items WHERE key = 'pike'), 'martial', 'melee', '1d10', 'piercing', ARRAY['heavy', 'reach', 'two_handed'], NULL, NULL, NULL),
  ((SELECT id FROM public.equipment_items WHERE key = 'rapier'), 'martial', 'melee', '1d8', 'piercing', ARRAY['finesse'], NULL, NULL, NULL),
  ((SELECT id FROM public.equipment_items WHERE key = 'scimitar'), 'martial', 'melee', '1d6', 'slashing', ARRAY['finesse', 'light'], NULL, NULL, NULL),
  ((SELECT id FROM public.equipment_items WHERE key = 'shortsword'), 'martial', 'melee', '1d6', 'piercing', ARRAY['finesse', 'light'], NULL, NULL, NULL),
  ((SELECT id FROM public.equipment_items WHERE key = 'trident'), 'martial', 'melee', '1d6', 'piercing', ARRAY['thrown', 'versatile'], 20, 60, '1d8'),
  ((SELECT id FROM public.equipment_items WHERE key = 'war_pick'), 'martial', 'melee', '1d8', 'piercing', ARRAY[]::text[], NULL, NULL, NULL),
  ((SELECT id FROM public.equipment_items WHERE key = 'warhammer'), 'martial', 'melee', '1d8', 'bludgeoning', ARRAY['versatile'], NULL, NULL, '1d10'),
  ((SELECT id FROM public.equipment_items WHERE key = 'whip'), 'martial', 'melee', '1d4', 'slashing', ARRAY['finesse', 'reach'], NULL, NULL, NULL),
  ((SELECT id FROM public.equipment_items WHERE key = 'blowgun'), 'martial', 'ranged', '1', 'piercing', ARRAY['ammunition', 'loading'], 25, 100, NULL),
  ((SELECT id FROM public.equipment_items WHERE key = 'hand_crossbow'), 'martial', 'ranged', '1d6', 'piercing', ARRAY['ammunition', 'light', 'loading'], 30, 120, NULL),
  ((SELECT id FROM public.equipment_items WHERE key = 'heavy_crossbow'), 'martial', 'ranged', '1d10', 'piercing', ARRAY['ammunition', 'heavy', 'loading', 'two_handed'], 100, 400, NULL),
  ((SELECT id FROM public.equipment_items WHERE key = 'longbow'), 'martial', 'ranged', '1d8', 'piercing', ARRAY['ammunition', 'heavy', 'two_handed'], 150, 600, NULL),
  ((SELECT id FROM public.equipment_items WHERE key = 'net'), 'martial', 'ranged', '0', 'none', ARRAY['special', 'thrown'], 5, 15, NULL)
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

INSERT INTO public.armor (item_id, armor_category, base_ac, dex_bonus_cap, minimum_strength, stealth_disadvantage) VALUES
  ((SELECT id FROM public.equipment_items WHERE key = 'padded_armor'), 'light', 11, NULL, NULL, true),
  ((SELECT id FROM public.equipment_items WHERE key = 'leather_armor'), 'light', 11, NULL, NULL, false),
  ((SELECT id FROM public.equipment_items WHERE key = 'studded_leather_armor'), 'light', 12, NULL, NULL, false),
  ((SELECT id FROM public.equipment_items WHERE key = 'hide_armor'), 'medium', 12, 2, NULL, false),
  ((SELECT id FROM public.equipment_items WHERE key = 'chain_shirt'), 'medium', 13, 2, NULL, false),
  ((SELECT id FROM public.equipment_items WHERE key = 'scale_mail'), 'medium', 14, 2, NULL, true),
  ((SELECT id FROM public.equipment_items WHERE key = 'breastplate'), 'medium', 14, 2, NULL, false),
  ((SELECT id FROM public.equipment_items WHERE key = 'half_plate'), 'medium', 15, 2, NULL, true),
  ((SELECT id FROM public.equipment_items WHERE key = 'ring_mail'), 'heavy', 14, 0, NULL, true),
  ((SELECT id FROM public.equipment_items WHERE key = 'chain_mail'), 'heavy', 16, 0, 13, true),
  ((SELECT id FROM public.equipment_items WHERE key = 'splint_armor'), 'heavy', 17, 0, 15, true),
  ((SELECT id FROM public.equipment_items WHERE key = 'plate_armor'), 'heavy', 18, 0, 15, true)
ON CONFLICT (item_id) DO UPDATE
SET
  armor_category = EXCLUDED.armor_category,
  base_ac = EXCLUDED.base_ac,
  dex_bonus_cap = EXCLUDED.dex_bonus_cap,
  minimum_strength = EXCLUDED.minimum_strength,
  stealth_disadvantage = EXCLUDED.stealth_disadvantage;

INSERT INTO public.shields (item_id, armor_class_bonus) VALUES
  ((SELECT id FROM public.equipment_items WHERE key = 'shield'), 2)
ON CONFLICT (item_id) DO UPDATE
SET armor_class_bonus = EXCLUDED.armor_class_bonus;
