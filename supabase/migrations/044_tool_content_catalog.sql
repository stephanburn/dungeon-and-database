-- Batch 3d: first-class tool catalog plus tolerant typed choice backfill.

CREATE TABLE IF NOT EXISTS public.tools (
  key text PRIMARY KEY,
  name text NOT NULL UNIQUE,
  sort_order int NOT NULL DEFAULT 0,
  source text NOT NULL REFERENCES public.sources (key),
  amended boolean NOT NULL DEFAULT false,
  amendment_note text
);

ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tools_select_auth" ON public.tools;
CREATE POLICY "tools_select_auth" ON public.tools
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "tools_insert_admin" ON public.tools;
CREATE POLICY "tools_insert_admin" ON public.tools
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "tools_update_admin" ON public.tools;
CREATE POLICY "tools_update_admin" ON public.tools
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "tools_delete_admin" ON public.tools;
CREATE POLICY "tools_delete_admin" ON public.tools
  FOR DELETE USING (public.is_admin());

INSERT INTO public.tools (
  key,
  name,
  sort_order,
  source
) VALUES
  ('alchemists_supplies', 'Alchemist''s Supplies', 10, 'SRD'),
  ('brewers_supplies', 'Brewer''s Supplies', 20, 'SRD'),
  ('calligraphers_supplies', 'Calligrapher''s Supplies', 30, 'SRD'),
  ('carpenters_tools', 'Carpenter''s Tools', 40, 'SRD'),
  ('cartographers_tools', 'Cartographer''s Tools', 50, 'SRD'),
  ('cobblers_tools', 'Cobbler''s Tools', 60, 'SRD'),
  ('cooks_utensils', 'Cook''s Utensils', 70, 'SRD'),
  ('glassblowers_tools', 'Glassblower''s Tools', 80, 'SRD'),
  ('jewelers_tools', 'Jeweler''s Tools', 90, 'SRD'),
  ('leatherworkers_tools', 'Leatherworker''s Tools', 100, 'SRD'),
  ('masons_tools', 'Mason''s Tools', 110, 'SRD'),
  ('painters_supplies', 'Painter''s Supplies', 120, 'SRD'),
  ('potters_tools', 'Potter''s Tools', 130, 'SRD'),
  ('smiths_tools', 'Smith''s Tools', 140, 'SRD'),
  ('tinkers_tools', 'Tinker''s Tools', 150, 'SRD'),
  ('weavers_tools', 'Weaver''s Tools', 160, 'SRD'),
  ('woodcarvers_tools', 'Woodcarver''s Tools', 170, 'SRD'),
  ('disguise_kit', 'Disguise Kit', 180, 'SRD'),
  ('forgery_kit', 'Forgery Kit', 190, 'SRD'),
  ('herbalism_kit', 'Herbalism Kit', 200, 'SRD'),
  ('navigators_tools', 'Navigator''s Tools', 210, 'SRD'),
  ('poisoners_kit', 'Poisoner''s Kit', 220, 'SRD'),
  ('thieves_tools', 'Thieves'' Tools', 230, 'SRD'),
  ('dice_set', 'Dice Set', 240, 'SRD'),
  ('dragonchess_set', 'Dragonchess Set', 250, 'SRD'),
  ('playing_card_set', 'Playing Card Set', 260, 'SRD'),
  ('bagpipes', 'Bagpipes', 270, 'SRD'),
  ('drum', 'Drum', 280, 'SRD'),
  ('dulcimer', 'Dulcimer', 290, 'SRD'),
  ('flute', 'Flute', 300, 'SRD'),
  ('horn', 'Horn', 310, 'SRD'),
  ('lute', 'Lute', 320, 'SRD'),
  ('lyre', 'Lyre', 330, 'SRD'),
  ('pan_flute', 'Pan Flute', 340, 'SRD'),
  ('shawm', 'Shawm', 350, 'SRD'),
  ('viol', 'Viol', 360, 'SRD')
ON CONFLICT (key) DO UPDATE
SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order,
  source = EXCLUDED.source;

ALTER TABLE public.character_tool_choices
  ADD COLUMN IF NOT EXISTS tool_key text NULL REFERENCES public.tools (key) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS character_tool_choices_tool_key_idx
  ON public.character_tool_choices (tool_key);

UPDATE public.character_tool_choices AS ctc
SET tool_key = tools.key
FROM public.tools
WHERE ctc.tool_key IS NULL
  AND lower(trim(ctc.tool)) = lower(trim(tools.name));
