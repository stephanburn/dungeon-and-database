-- Batch 3c: first-class language content plus tolerant typed choice backfill.

CREATE TABLE IF NOT EXISTS public.languages (
  key text PRIMARY KEY,
  name text NOT NULL UNIQUE,
  sort_order int NOT NULL DEFAULT 0,
  source text NOT NULL REFERENCES public.sources (key),
  amended boolean NOT NULL DEFAULT false,
  amendment_note text
);

ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "languages_select_auth" ON public.languages;
CREATE POLICY "languages_select_auth" ON public.languages
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "languages_insert_admin" ON public.languages;
CREATE POLICY "languages_insert_admin" ON public.languages
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "languages_update_admin" ON public.languages;
CREATE POLICY "languages_update_admin" ON public.languages
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "languages_delete_admin" ON public.languages;
CREATE POLICY "languages_delete_admin" ON public.languages
  FOR DELETE USING (public.is_admin());

INSERT INTO public.languages (
  key,
  name,
  sort_order,
  source
) VALUES
  ('common', 'Common', 10, 'SRD'),
  ('dwarvish', 'Dwarvish', 20, 'SRD'),
  ('elvish', 'Elvish', 30, 'SRD'),
  ('giant', 'Giant', 40, 'SRD'),
  ('gnomish', 'Gnomish', 50, 'SRD'),
  ('goblin', 'Goblin', 60, 'SRD'),
  ('halfling', 'Halfling', 70, 'SRD'),
  ('orc', 'Orc', 80, 'SRD'),
  ('abyssal', 'Abyssal', 90, 'SRD'),
  ('celestial', 'Celestial', 100, 'SRD'),
  ('draconic', 'Draconic', 110, 'SRD'),
  ('deep_speech', 'Deep Speech', 120, 'SRD'),
  ('infernal', 'Infernal', 130, 'SRD'),
  ('primordial', 'Primordial', 140, 'SRD'),
  ('sylvan', 'Sylvan', 150, 'SRD'),
  ('undercommon', 'Undercommon', 160, 'SRD')
ON CONFLICT (key) DO UPDATE
SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order,
  source = EXCLUDED.source;

ALTER TABLE public.character_language_choices
  ADD COLUMN IF NOT EXISTS language_key text NULL REFERENCES public.languages (key) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS character_language_choices_language_key_idx
  ON public.character_language_choices (language_key);

UPDATE public.character_language_choices AS clc
SET language_key = languages.key
FROM public.languages
WHERE clc.language_key IS NULL
  AND lower(trim(clc.language)) = lower(trim(languages.name));
