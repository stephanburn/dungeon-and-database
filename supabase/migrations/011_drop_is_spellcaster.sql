-- Drop redundant is_spellcaster column from classes.
-- The value is fully derivable: spellcasting_type IS NOT NULL AND spellcasting_type <> 'none'

ALTER TABLE public.classes DROP COLUMN is_spellcaster;
