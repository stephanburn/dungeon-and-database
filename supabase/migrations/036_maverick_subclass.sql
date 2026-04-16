-- Seed the Exploring Eberron Maverick artificer subclass so the generic
-- feature-option and feature-spell-grant layers can target a real subclass row.

INSERT INTO public.subclasses (name, class_id, choice_level, source)
VALUES
  ('Maverick', (SELECT id FROM public.classes WHERE name = 'Artificer' AND source = 'ERftLW'), 3, 'EE')
ON CONFLICT (name, class_id, source) DO UPDATE SET
  choice_level = EXCLUDED.choice_level;

INSERT INTO public.subclass_features (subclass_id, name, level, description, source)
VALUES
  (
    (SELECT id FROM public.subclasses WHERE name = 'Maverick' AND source = 'EE'),
    'Arcane Breakthroughs',
    3,
    'Choose additional class spell lists for your Breakthrough spell list and prepare bonus spells from those lists.',
    'EE'
  ),
  (
    (SELECT id FROM public.subclasses WHERE name = 'Maverick' AND source = 'EE'),
    'Cantrip Specialist',
    3,
    'Know one extra cantrip and treat chosen Breakthrough cantrips as artificer cantrips for you.',
    'EE'
  ),
  (
    (SELECT id FROM public.subclasses WHERE name = 'Maverick' AND source = 'EE'),
    'Cantrip Savant',
    5,
    'Improve artificer cantrips and swap one as an action after a long rest refresh.',
    'EE'
  ),
  (
    (SELECT id FROM public.subclasses WHERE name = 'Maverick' AND source = 'EE'),
    'Superior Breakthroughs',
    9,
    'Cast Arcane Breakthrough spells as if using a slot two levels higher a limited number of times.',
    'EE'
  ),
  (
    (SELECT id FROM public.subclasses WHERE name = 'Maverick' AND source = 'EE'),
    'Work in Progress',
    9,
    'Replace a prepared artificer spell with another artificer spell after a short or long rest refresh.',
    'EE'
  ),
  (
    (SELECT id FROM public.subclasses WHERE name = 'Maverick' AND source = 'EE'),
    'Final Breakthrough',
    15,
    'Gain one additional slot of each spell level you can prepare for Arcane Breakthrough spells only.',
    'EE'
  )
ON CONFLICT (subclass_id, name, level) DO UPDATE SET
  description = EXCLUDED.description,
  source = EXCLUDED.source;
