-- Track spellbook entry counts separately from prepared counts so wizard-style
-- casters can persist the spells they know without being capped by preparation.

UPDATE public.classes
SET spellcasting_progression = jsonb_set(
  spellcasting_progression,
  '{spellbook_spells_by_level}',
  '[6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,42,44]'::jsonb,
  true
)
WHERE name = 'Wizard'
  AND spellcasting_progression ->> 'mode' = 'spellbook';
