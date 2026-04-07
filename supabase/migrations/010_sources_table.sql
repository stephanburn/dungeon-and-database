-- 010_sources_table.sql
-- Canonical source registry. Seed must come before FK constraints.

CREATE TABLE public.sources (
  key       text    PRIMARY KEY,
  full_name text    NOT NULL,
  is_srd    boolean NOT NULL DEFAULT false
);

ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sources_select_authenticated" ON public.sources
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "sources_insert_dm" ON public.sources
  FOR INSERT WITH CHECK (public.is_dm());

CREATE POLICY "sources_update_dm" ON public.sources
  FOR UPDATE USING (public.is_dm());

CREATE POLICY "sources_delete_dm" ON public.sources
  FOR DELETE USING (public.is_dm());

-- Seed must match all source values already in content tables
INSERT INTO public.sources (key, full_name, is_srd) VALUES
  ('SRD',      'Systems Reference Document',        true),
  ('PHB',      'Player''s Handbook',                false),
  ('TCoE',     'Tasha''s Cauldron of Everything',   false),
  ('GGtR',     'Guildmasters'' Guide to Ravnica',   false),
  ('ERftLW',   'Eberron: Rising from the Last War', false),
  ('Homebrew', 'Homebrew',                          false);

-- FK constraints (safe now that seed is done)
ALTER TABLE public.species_traits
  ADD CONSTRAINT species_traits_source_fk
  FOREIGN KEY (source) REFERENCES public.sources(key);

ALTER TABLE public.species
  ADD CONSTRAINT species_source_fk
  FOREIGN KEY (source) REFERENCES public.sources(key);

ALTER TABLE public.class_features
  ADD CONSTRAINT class_features_source_fk
  FOREIGN KEY (source) REFERENCES public.sources(key);

ALTER TABLE public.classes
  ADD CONSTRAINT classes_source_fk
  FOREIGN KEY (source) REFERENCES public.sources(key);

ALTER TABLE public.subclasses
  ADD CONSTRAINT subclasses_source_fk
  FOREIGN KEY (source) REFERENCES public.sources(key);

ALTER TABLE public.subclass_features
  ADD CONSTRAINT subclass_features_source_fk
  FOREIGN KEY (source) REFERENCES public.sources(key);

ALTER TABLE public.spells
  ADD CONSTRAINT spells_source_fk
  FOREIGN KEY (source) REFERENCES public.sources(key);

ALTER TABLE public.feats
  ADD CONSTRAINT feats_source_fk
  FOREIGN KEY (source) REFERENCES public.sources(key);

ALTER TABLE public.backgrounds
  ADD CONSTRAINT backgrounds_source_fk
  FOREIGN KEY (source) REFERENCES public.sources(key);

ALTER TABLE public.campaign_source_allowlist
  ADD CONSTRAINT allowlist_source_fk
  FOREIGN KEY (source_key) REFERENCES public.sources(key);
