-- Enable RLS on the class_features table and add policies to match sibling content tables.
-- This is the likely source of the rls_disabled_in_public alert, but the live database
-- still needs to be checked after this migration is applied.

ALTER TABLE public.class_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "class_features_select_auth" ON public.class_features
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "class_features_insert_dm" ON public.class_features
  FOR INSERT WITH CHECK (public.is_dm());

CREATE POLICY "class_features_update_dm" ON public.class_features
  FOR UPDATE USING (public.is_dm());
