-- Slice 6d: make pre-Batch-4 spell selections explicit in DM audit output.
--
-- Fourteen imported/manual spell selections predate owning_class_id attribution.
-- They counted against class spell limits, but there is no reliable class-level
-- provenance left to infer after the fact, so preserve the rows and mark them.
UPDATE public.character_spell_selections
SET source_feature_key = 'legacy:pre_batch_4_spell_selection'
WHERE owning_class_id IS NULL
  AND counts_against_selection_limit = true
  AND source_feature_key IS NULL;
