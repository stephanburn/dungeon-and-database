-- Extend backgrounds with skill choices, feature text, and optional background feat.

ALTER TABLE public.backgrounds
  ADD COLUMN skill_choice_count int  NOT NULL DEFAULT 0,
  ADD COLUMN skill_choice_from  text[] NOT NULL DEFAULT '{}',
  ADD COLUMN feature            text NOT NULL DEFAULT '',
  ADD COLUMN background_feat_id uuid REFERENCES public.feats (id) ON DELETE SET NULL;
