-- 015_rule_set.sql
-- Add rule_set to sources and campaigns for 2014 vs 2024 ruleset tracking.

ALTER TABLE public.sources
  ADD COLUMN rule_set text NOT NULL DEFAULT '2014'
  CHECK (rule_set IN ('2014', '2024'));

-- Mark known 2024 sources (added via admin UI)
UPDATE public.sources SET rule_set = '2024' WHERE key IN ('PHB24', 'PHB2024');

ALTER TABLE public.campaigns
  ADD COLUMN rule_set text NOT NULL DEFAULT '2014'
  CHECK (rule_set IN ('2014', '2024'));
