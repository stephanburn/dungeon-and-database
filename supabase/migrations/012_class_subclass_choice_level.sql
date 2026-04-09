-- Move subclass choice level from individual subclasses to the parent class.
-- Each class unlocks its subclass at a single level (e.g. Fighter = 3, Wizard = 2).

ALTER TABLE public.classes
  ADD COLUMN subclass_choice_level int NOT NULL DEFAULT 3;

-- Backfill from existing subclasses where all rows for a class agree.
-- If a class has no subclasses yet, the default of 3 applies.
UPDATE public.classes c
SET subclass_choice_level = sub.choice_level
FROM (
  SELECT DISTINCT ON (class_id) class_id, choice_level
  FROM public.subclasses
  ORDER BY class_id, choice_level
) sub
WHERE sub.class_id = c.id;
