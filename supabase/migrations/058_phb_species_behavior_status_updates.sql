UPDATE public.species
SET
  amended = false,
  amendment_note = NULL
WHERE source = 'PHB'
  AND name IN ('Dragonborn', 'High Elf', 'Tiefling');

UPDATE public.species
SET
  amended = true,
  amendment_note = 'Sunlight Sensitivity attack and Perception penalties are not yet automated.'
WHERE source = 'PHB'
  AND name = 'Dark Elf (Drow)';
