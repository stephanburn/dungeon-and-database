-- character_choices.character_level_id should be nullable:
-- some choices (e.g. spell_known) are not tied to a specific class level row.
ALTER TABLE public.character_choices
  ALTER COLUMN character_level_id DROP NOT NULL;
