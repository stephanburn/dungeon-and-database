-- Add structured resistance/immunity fields to species.
-- The SRD seed does not populate these (resistances are embedded in trait text).
-- DMs can set them manually via amendments.

ALTER TABLE public.species
  ADD COLUMN damage_resistances  text[] NOT NULL DEFAULT '{}',
  ADD COLUMN condition_immunities text[] NOT NULL DEFAULT '{}';
