-- Seed the Exploring Eberron source key used by current character-creator handoff notes
-- and add Aberrant Dragonmark with structured spell-choice metadata.

INSERT INTO public.sources (key, full_name, is_srd, rule_set)
VALUES ('EE', 'Exploring Eberron', false, '2014')
ON CONFLICT (key) DO UPDATE
SET
  full_name = EXCLUDED.full_name,
  is_srd = EXCLUDED.is_srd,
  rule_set = EXCLUDED.rule_set;

INSERT INTO public.feats (
  name,
  prerequisites,
  description,
  benefits,
  source,
  amended,
  amendment_note
)
VALUES (
  'Aberrant Dragonmark',
  '[]'::jsonb,
  'Your dragonmark manifests in an unusual way, granting one sorcerer cantrip and one 1st-level sorcerer spell that can be cast through the mark.',
  jsonb_build_object(
    'spell_choices',
    jsonb_build_array(
      jsonb_build_object(
        'key', 'cantrip',
        'label', 'Aberrant Dragonmark cantrip',
        'spell_level', 0,
        'spell_list_class_name', 'Sorcerer',
        'acquisition_mode', 'granted',
        'counts_against_selection_limit', false
      ),
      jsonb_build_object(
        'key', 'level_1_spell',
        'label', 'Aberrant Dragonmark 1st-level spell',
        'spell_level', 1,
        'spell_list_class_name', 'Sorcerer',
        'acquisition_mode', 'granted',
        'counts_against_selection_limit', false
      )
    )
  ),
  'EE',
  false,
  null
)
ON CONFLICT (name, source) DO UPDATE
SET
  description = EXCLUDED.description,
  benefits = EXCLUDED.benefits,
  amended = EXCLUDED.amended,
  amendment_note = EXCLUDED.amendment_note;
