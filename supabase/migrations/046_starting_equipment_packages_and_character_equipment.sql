-- Batch 3f: starting equipment packages plus per-character equipment state.

CREATE TABLE IF NOT EXISTS public.starting_equipment_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  source text NOT NULL REFERENCES public.sources (key),
  amended boolean NOT NULL DEFAULT false,
  amendment_note text
);

CREATE TABLE IF NOT EXISTS public.starting_equipment_package_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.starting_equipment_packages (id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.equipment_items (id) ON DELETE RESTRICT,
  quantity int NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  item_order int NOT NULL DEFAULT 0,
  choice_group text NOT NULL DEFAULT '',
  notes text,
  UNIQUE (package_id, item_id, choice_group)
);

ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS starting_equipment_package_id uuid REFERENCES public.starting_equipment_packages (id) ON DELETE SET NULL;

ALTER TABLE public.backgrounds
  ADD COLUMN IF NOT EXISTS starting_equipment_package_id uuid REFERENCES public.starting_equipment_packages (id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.character_equipment_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES public.characters (id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.equipment_items (id) ON DELETE RESTRICT,
  quantity int NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  equipped boolean NOT NULL DEFAULT false,
  source_package_item_id uuid REFERENCES public.starting_equipment_package_items (id) ON DELETE SET NULL,
  source_category text NOT NULL DEFAULT 'manual',
  source_entity_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS character_equipment_items_character_id_idx
  ON public.character_equipment_items (character_id);

ALTER TABLE public.starting_equipment_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.starting_equipment_package_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_equipment_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "starting_equipment_packages_select_auth" ON public.starting_equipment_packages;
CREATE POLICY "starting_equipment_packages_select_auth" ON public.starting_equipment_packages
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "starting_equipment_packages_insert_admin" ON public.starting_equipment_packages;
CREATE POLICY "starting_equipment_packages_insert_admin" ON public.starting_equipment_packages
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "starting_equipment_packages_update_admin" ON public.starting_equipment_packages;
CREATE POLICY "starting_equipment_packages_update_admin" ON public.starting_equipment_packages
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "starting_equipment_packages_delete_admin" ON public.starting_equipment_packages;
CREATE POLICY "starting_equipment_packages_delete_admin" ON public.starting_equipment_packages
  FOR DELETE USING (public.is_admin());

DROP POLICY IF EXISTS "starting_equipment_package_items_select_auth" ON public.starting_equipment_package_items;
CREATE POLICY "starting_equipment_package_items_select_auth" ON public.starting_equipment_package_items
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "starting_equipment_package_items_insert_admin" ON public.starting_equipment_package_items;
CREATE POLICY "starting_equipment_package_items_insert_admin" ON public.starting_equipment_package_items
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "starting_equipment_package_items_update_admin" ON public.starting_equipment_package_items;
CREATE POLICY "starting_equipment_package_items_update_admin" ON public.starting_equipment_package_items
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "starting_equipment_package_items_delete_admin" ON public.starting_equipment_package_items;
CREATE POLICY "starting_equipment_package_items_delete_admin" ON public.starting_equipment_package_items
  FOR DELETE USING (public.is_admin());

DROP POLICY IF EXISTS "character_equipment_items_select" ON public.character_equipment_items;
CREATE POLICY "character_equipment_items_select" ON public.character_equipment_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );

DROP POLICY IF EXISTS "character_equipment_items_insert_own" ON public.character_equipment_items;
CREATE POLICY "character_equipment_items_insert_own" ON public.character_equipment_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );

DROP POLICY IF EXISTS "character_equipment_items_update_own" ON public.character_equipment_items;
CREATE POLICY "character_equipment_items_update_own" ON public.character_equipment_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );

DROP POLICY IF EXISTS "character_equipment_items_delete_own" ON public.character_equipment_items;
CREATE POLICY "character_equipment_items_delete_own" ON public.character_equipment_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );

INSERT INTO public.equipment_items (key, name, item_category, cost_quantity, cost_unit, weight_lb, source) VALUES
  ('holy_symbol', 'Holy Symbol', 'gear', 5, 'gp', 1.00, 'PHB'),
  ('prayer_book', 'Prayer Book', 'gear', 25, 'gp', 5.00, 'PHB'),
  ('stick_of_incense', 'Stick of Incense', 'gear', 1, 'sp', 0.00, 'PHB'),
  ('vestments', 'Vestments', 'gear', 10, 'gp', 4.00, 'PHB'),
  ('common_clothes', 'Common Clothes', 'gear', 5, 'sp', 3.00, 'PHB'),
  ('belt_pouch', 'Belt Pouch', 'gear', 5, 'sp', 1.00, 'PHB'),
  ('spellbook', 'Spellbook', 'gear', 50, 'gp', 3.00, 'PHB'),
  ('thieves_tools_kit', 'Thieves'' Tools', 'gear', 25, 'gp', 1.00, 'PHB')
ON CONFLICT (key) DO UPDATE
SET
  name = EXCLUDED.name,
  item_category = EXCLUDED.item_category,
  cost_quantity = EXCLUDED.cost_quantity,
  cost_unit = EXCLUDED.cost_unit,
  weight_lb = EXCLUDED.weight_lb,
  source = EXCLUDED.source;

INSERT INTO public.starting_equipment_packages (key, name, description, source) VALUES
  ('background:acolyte:srd', 'Acolyte Starting Equipment', 'Prayerful gear for a devout acolyte.', 'SRD'),
  ('class:fighter:srd', 'Fighter Starting Equipment', 'A simple seeded fighter loadout using the phase 1 equipment catalog.', 'SRD'),
  ('class:rogue:srd', 'Rogue Starting Equipment', 'A simple seeded rogue loadout using the phase 1 equipment catalog.', 'SRD'),
  ('class:wizard:srd', 'Wizard Starting Equipment', 'A simple seeded wizard loadout using the phase 1 equipment catalog.', 'SRD')
ON CONFLICT (key) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  source = EXCLUDED.source;

INSERT INTO public.starting_equipment_package_items (package_id, item_id, quantity, item_order, choice_group, notes) VALUES
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:acolyte:srd'), (SELECT id FROM public.equipment_items WHERE key = 'holy_symbol'), 1, 10, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:acolyte:srd'), (SELECT id FROM public.equipment_items WHERE key = 'prayer_book'), 1, 20, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:acolyte:srd'), (SELECT id FROM public.equipment_items WHERE key = 'stick_of_incense'), 5, 30, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:acolyte:srd'), (SELECT id FROM public.equipment_items WHERE key = 'vestments'), 1, 40, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:acolyte:srd'), (SELECT id FROM public.equipment_items WHERE key = 'common_clothes'), 1, 50, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'background:acolyte:srd'), (SELECT id FROM public.equipment_items WHERE key = 'belt_pouch'), 1, 60, '', 'Contains 15 gp'),

  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:fighter:srd'), (SELECT id FROM public.equipment_items WHERE key = 'chain_mail'), 1, 10, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:fighter:srd'), (SELECT id FROM public.equipment_items WHERE key = 'longsword'), 1, 20, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:fighter:srd'), (SELECT id FROM public.equipment_items WHERE key = 'shield'), 1, 30, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:fighter:srd'), (SELECT id FROM public.equipment_items WHERE key = 'light_crossbow'), 1, 40, '', NULL),

  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:rogue:srd'), (SELECT id FROM public.equipment_items WHERE key = 'rapier'), 1, 10, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:rogue:srd'), (SELECT id FROM public.equipment_items WHERE key = 'shortbow'), 1, 20, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:rogue:srd'), (SELECT id FROM public.equipment_items WHERE key = 'leather_armor'), 1, 30, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:rogue:srd'), (SELECT id FROM public.equipment_items WHERE key = 'thieves_tools_kit'), 1, 40, '', NULL),

  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:wizard:srd'), (SELECT id FROM public.equipment_items WHERE key = 'quarterstaff'), 1, 10, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:wizard:srd'), (SELECT id FROM public.equipment_items WHERE key = 'dagger'), 1, 20, '', NULL),
  ((SELECT id FROM public.starting_equipment_packages WHERE key = 'class:wizard:srd'), (SELECT id FROM public.equipment_items WHERE key = 'spellbook'), 1, 30, '', NULL)
ON CONFLICT (package_id, item_id, choice_group) DO NOTHING;

UPDATE public.backgrounds
SET starting_equipment_package_id = (SELECT id FROM public.starting_equipment_packages WHERE key = 'background:acolyte:srd')
WHERE name = 'Acolyte' AND source = 'SRD';

UPDATE public.classes
SET starting_equipment_package_id = (SELECT id FROM public.starting_equipment_packages WHERE key = 'class:fighter:srd')
WHERE name = 'Fighter' AND source = 'SRD';

UPDATE public.classes
SET starting_equipment_package_id = (SELECT id FROM public.starting_equipment_packages WHERE key = 'class:rogue:srd')
WHERE name = 'Rogue' AND source = 'SRD';

UPDATE public.classes
SET starting_equipment_package_id = (SELECT id FROM public.starting_equipment_packages WHERE key = 'class:wizard:srd')
WHERE name = 'Wizard' AND source = 'SRD';
