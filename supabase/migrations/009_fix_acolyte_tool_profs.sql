-- Acolyte's tool_proficiencies was incorrectly populated with skill names
-- by the original seed run. Acolyte has no tool proficiencies in 5e SRD.
UPDATE public.backgrounds
SET tool_proficiencies = '{}'
WHERE name = 'Acolyte' AND source = 'SRD';
