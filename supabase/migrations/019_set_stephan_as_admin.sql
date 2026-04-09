-- Complete the admin/DM role split after the enum value has been committed.
-- This migration also ensures the known primary account is the platform admin.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_dm()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('dm', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role user_role;
BEGIN
  IF (SELECT COUNT(*) FROM public.users) = 0 THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := 'player';
  END IF;

  INSERT INTO public.users (id, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    assigned_role
  );
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  first_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE role = 'admin') THEN
    SELECT id INTO first_user_id
    FROM public.users
    ORDER BY created_at, id
    LIMIT 1;

    IF first_user_id IS NOT NULL THEN
      UPDATE public.users
      SET role = 'admin'
      WHERE id = first_user_id;
    END IF;
  END IF;
END $$;

DROP POLICY IF EXISTS "species_insert_dm" ON public.species;
DROP POLICY IF EXISTS "species_update_dm" ON public.species;
CREATE POLICY "species_insert_admin" ON public.species
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "species_update_admin" ON public.species
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "species_traits_insert_dm" ON public.species_traits;
DROP POLICY IF EXISTS "species_traits_update_dm" ON public.species_traits;
CREATE POLICY "species_traits_insert_admin" ON public.species_traits
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "species_traits_update_admin" ON public.species_traits
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "classes_insert_dm" ON public.classes;
DROP POLICY IF EXISTS "classes_update_dm" ON public.classes;
CREATE POLICY "classes_insert_admin" ON public.classes
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "classes_update_admin" ON public.classes
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "cfp_insert_dm" ON public.class_feature_progression;
DROP POLICY IF EXISTS "cfp_update_dm" ON public.class_feature_progression;
CREATE POLICY "cfp_insert_admin" ON public.class_feature_progression
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "cfp_update_admin" ON public.class_feature_progression
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "sst_insert_dm" ON public.spell_slot_tables;
DROP POLICY IF EXISTS "sst_update_dm" ON public.spell_slot_tables;
CREATE POLICY "sst_insert_admin" ON public.spell_slot_tables
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "sst_update_admin" ON public.spell_slot_tables
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "msst_insert_dm" ON public.multiclass_spell_slot_table;
DROP POLICY IF EXISTS "msst_update_dm" ON public.multiclass_spell_slot_table;
CREATE POLICY "msst_insert_admin" ON public.multiclass_spell_slot_table
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "msst_update_admin" ON public.multiclass_spell_slot_table
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "subclasses_insert_dm" ON public.subclasses;
DROP POLICY IF EXISTS "subclasses_update_dm" ON public.subclasses;
CREATE POLICY "subclasses_insert_admin" ON public.subclasses
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "subclasses_update_admin" ON public.subclasses
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "subclass_features_insert_dm" ON public.subclass_features;
DROP POLICY IF EXISTS "subclass_features_update_dm" ON public.subclass_features;
CREATE POLICY "subclass_features_insert_admin" ON public.subclass_features
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "subclass_features_update_admin" ON public.subclass_features
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "spells_insert_dm" ON public.spells;
DROP POLICY IF EXISTS "spells_update_dm" ON public.spells;
CREATE POLICY "spells_insert_admin" ON public.spells
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "spells_update_admin" ON public.spells
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "feats_insert_dm" ON public.feats;
DROP POLICY IF EXISTS "feats_update_dm" ON public.feats;
CREATE POLICY "feats_insert_admin" ON public.feats
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "feats_update_admin" ON public.feats
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "backgrounds_insert_dm" ON public.backgrounds;
DROP POLICY IF EXISTS "backgrounds_update_dm" ON public.backgrounds;
CREATE POLICY "backgrounds_insert_admin" ON public.backgrounds
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "backgrounds_update_admin" ON public.backgrounds
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "sources_insert_dm" ON public.sources;
DROP POLICY IF EXISTS "sources_update_dm" ON public.sources;
DROP POLICY IF EXISTS "sources_delete_dm" ON public.sources;
CREATE POLICY "sources_insert_admin" ON public.sources
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "sources_update_admin" ON public.sources
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "sources_delete_admin" ON public.sources
  FOR DELETE USING (public.is_admin());

DROP POLICY IF EXISTS "class_features_insert_dm" ON public.class_features;
DROP POLICY IF EXISTS "class_features_update_dm" ON public.class_features;
CREATE POLICY "class_features_insert_admin" ON public.class_features
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "class_features_update_admin" ON public.class_features
  FOR UPDATE USING (public.is_admin());

UPDATE public.users u
SET role = CASE
  WHEN a.email = 'stephan.burn@gmail.com' THEN 'admin'::public.user_role
  WHEN u.role = 'admin' THEN 'dm'::public.user_role
  ELSE u.role
END
FROM auth.users a
WHERE a.id = u.id
  AND (
    a.email = 'stephan.burn@gmail.com'
    OR u.role = 'admin'
  );
