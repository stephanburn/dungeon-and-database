-- PHB species/subrace modeling support:
-- keep species rows directly selectable, while adding optional lineage metadata
-- so subraces and variants can be represented explicitly without forcing a
-- parent-child picker rewrite.

ALTER TABLE public.species
  ADD COLUMN IF NOT EXISTS parent_species_id uuid REFERENCES public.species (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lineage_key text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS variant_type text NOT NULL DEFAULT 'base',
  ADD COLUMN IF NOT EXISTS variant_order int NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS species_parent_species_id_idx
  ON public.species (parent_species_id);

CREATE INDEX IF NOT EXISTS species_lineage_variant_idx
  ON public.species (lineage_key, variant_type, variant_order, name);

UPDATE public.species
SET lineage_key = regexp_replace(lower(name), '[^a-z0-9]+', '_', 'g')
WHERE lineage_key = '';

UPDATE public.species
SET lineage_key = 'human',
    variant_type = 'variant'
WHERE name LIKE 'Human (%';

UPDATE public.species
SET lineage_key = 'half_elf',
    variant_type = 'variant'
WHERE name LIKE 'Half-Elf (%';

UPDATE public.species
SET lineage_key = 'half_orc',
    variant_type = 'variant'
WHERE name LIKE 'Half-Orc (%';

UPDATE public.species
SET lineage_key = 'dwarf',
    variant_type = 'variant'
WHERE name LIKE 'Dwarf (%';

UPDATE public.species
SET lineage_key = 'halfling',
    variant_type = 'variant'
WHERE name LIKE 'Halfling (%';

UPDATE public.species
SET lineage_key = 'elf',
    variant_type = 'variant'
WHERE name LIKE 'Elf (%';

UPDATE public.species
SET lineage_key = 'gnome',
    variant_type = 'variant'
WHERE name LIKE 'Gnome (%';
