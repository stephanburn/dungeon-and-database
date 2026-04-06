-- Add is_spellcaster flag to classes table.
-- Derived from existing spellcasting_type: any class with a non-null spellcasting_type is a spellcaster.

ALTER TABLE public.classes
  ADD COLUMN is_spellcaster boolean NOT NULL DEFAULT false;

-- Backfill existing rows
UPDATE public.classes
SET is_spellcaster = (spellcasting_type IS NOT NULL);
