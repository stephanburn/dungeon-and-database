-- Refresh stale dragonmarked species amendment notes now that Batch 2's typed
-- choice and shared feature-grants paths cover the modeled spell/language/tool
-- behavior. These rows are still flattened compared to their full parent
-- species, but the notes should no longer claim the implemented pieces are
-- missing.

UPDATE public.species
SET amendment_note = CASE
  WHEN source = 'EE' AND name = 'Half-Elf (Mark of Detection)' THEN
    'Flattened standalone dragonmarked species row. Uses typed species-choice support for the inherited half-elf extra language. Other base half-elf inheritance and some mark details remain denormalized pending broader species-model follow-up work.'
  WHEN source = 'ERftLW' AND name = 'Half-Elf (Mark of Detection)' THEN
    'Flattened standalone dragonmarked species row. Uses typed species-choice support for the inherited half-elf extra language and additional +1 ability score. Other inherited half-elf features remain denormalized.'
  WHEN source = 'ERftLW' AND name = 'Half-Elf (Mark of Storm)' THEN
    'Flattened standalone dragonmarked species row. Uses typed species-choice support for the inherited half-elf extra language, and its static Gust and Gust of Wind grants are modeled in shared feature-grants derivation. Other inherited half-elf features remain denormalized.'
  WHEN source = 'ERftLW' AND name = 'Human (Mark of Finding)' THEN
    'Flattened standalone dragonmarked species row. Uses typed species-choice support for the inherited human extra language, and its static Hunter''s Mark and Locate Object grants are modeled in shared feature-grants derivation. Other inherited human features remain denormalized.'
  WHEN source = 'ERftLW' AND name = 'Human (Mark of Handling)' THEN
    'Flattened standalone dragonmarked species row. Uses typed species-choice support for the inherited human extra language and flexible +1 ability score, and its static Animal Friendship and Speak with Animals grants are modeled in shared feature-grants derivation.'
  WHEN source = 'ERftLW' AND name = 'Human (Mark of Making)' THEN
    'Flattened standalone dragonmarked species row. Uses typed species-choice support for the inherited human extra language, flexible +1 ability score, and artisan''s tools choice, and its static Mending and Magic Weapon grants are modeled in shared feature-grants derivation.'
  WHEN source = 'ERftLW' AND name = 'Human (Mark of Passage)' THEN
    'Flattened standalone dragonmarked species row. Uses typed species-choice support for the inherited human extra language and flexible +1 ability score, and its static Misty Step grant is modeled in shared feature-grants derivation.'
  WHEN source = 'ERftLW' AND name = 'Human (Mark of Sentinel)' THEN
    'Flattened standalone dragonmarked species row. Uses typed species-choice support for the inherited human extra language, and its static Shield grant is modeled in shared feature-grants derivation. Vigilant Guardian remains unmodeled.'
  WHEN source = 'ERftLW' AND name = 'Dwarf (Mark of Warding)' THEN
    'Flattened standalone dragonmarked species row. Includes the common base dwarf traits needed by the current sheet, and its static Alarm, Mage Armor, and Arcane Lock grants are modeled in shared feature-grants derivation. Other inherited dwarf features remain denormalized.'
  WHEN source = 'ERftLW' AND name = 'Halfling (Mark of Hospitality)' THEN
    'Flattened standalone dragonmarked species row. Core halfling traits remain denormalized, and its static Prestidigitation, Purify Food and Drink, and Unseen Servant grants are modeled in shared feature-grants derivation.'
  WHEN source = 'ERftLW' AND name = 'Halfling (Mark of Healing)' THEN
    'Flattened standalone dragonmarked species row. Core halfling traits remain denormalized, and its static Cure Wounds and Lesser Restoration grants are modeled in shared feature-grants derivation.'
  WHEN source = 'ERftLW' AND name = 'Elf (Mark of Shadow)' THEN
    'Flattened standalone dragonmarked species row. Inherited elf features remain denormalized, and its static Minor Illusion and Invisibility grants are modeled in shared feature-grants derivation.'
  WHEN source = 'ERftLW' AND name = 'Gnome (Mark of Scribing)' THEN
    'Flattened standalone dragonmarked species row. Inherited gnome features remain denormalized, and its static Message, Comprehend Languages, and Magic Mouth grants are modeled in shared feature-grants derivation.'
  ELSE amendment_note
END
WHERE (source, name) IN (
  ('EE', 'Half-Elf (Mark of Detection)'),
  ('ERftLW', 'Half-Elf (Mark of Detection)'),
  ('ERftLW', 'Half-Elf (Mark of Storm)'),
  ('ERftLW', 'Human (Mark of Finding)'),
  ('ERftLW', 'Human (Mark of Handling)'),
  ('ERftLW', 'Human (Mark of Making)'),
  ('ERftLW', 'Human (Mark of Passage)'),
  ('ERftLW', 'Human (Mark of Sentinel)'),
  ('ERftLW', 'Dwarf (Mark of Warding)'),
  ('ERftLW', 'Halfling (Mark of Hospitality)'),
  ('ERftLW', 'Halfling (Mark of Healing)'),
  ('ERftLW', 'Elf (Mark of Shadow)'),
  ('ERftLW', 'Gnome (Mark of Scribing)')
);
