-- Slice 6c: make character language/tool catalog keys authoritative.
-- The display text remains denormalized for older UI surfaces, but identity and
-- uniqueness now come from language_key/tool_key.

UPDATE public.character_language_choices AS choice
SET language_key = language.key
FROM public.languages AS language
WHERE choice.language_key IS NULL
  AND lower(trim(choice.language)) = lower(trim(language.name));

UPDATE public.character_tool_choices AS choice
SET tool_key = tool.key
FROM public.tools AS tool
WHERE choice.tool_key IS NULL
  AND lower(trim(choice.tool)) = lower(trim(tool.name));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.character_language_choices WHERE language_key IS NULL) THEN
    RAISE EXCEPTION 'Cannot enforce language_key: unresolved character_language_choices rows remain';
  END IF;

  IF EXISTS (SELECT 1 FROM public.character_tool_choices WHERE tool_key IS NULL) THEN
    RAISE EXCEPTION 'Cannot enforce tool_key: unresolved character_tool_choices rows remain';
  END IF;
END $$;

UPDATE public.character_language_choices AS choice
SET language = language.name
FROM public.languages AS language
WHERE choice.language_key = language.key
  AND choice.language IS DISTINCT FROM language.name;

UPDATE public.character_tool_choices AS choice
SET tool = tool.name
FROM public.tools AS tool
WHERE choice.tool_key = tool.key
  AND choice.tool IS DISTINCT FROM tool.name;

WITH ranked_language_choices AS (
  SELECT
    ctid,
    row_number() OVER (
      PARTITION BY character_id, language_key
      ORDER BY created_at, language
    ) AS row_number
  FROM public.character_language_choices
)
DELETE FROM public.character_language_choices choice
USING ranked_language_choices ranked
WHERE choice.ctid = ranked.ctid
  AND ranked.row_number > 1;

WITH ranked_tool_choices AS (
  SELECT
    ctid,
    row_number() OVER (
      PARTITION BY character_id, tool_key
      ORDER BY created_at, tool
    ) AS row_number
  FROM public.character_tool_choices
)
DELETE FROM public.character_tool_choices choice
USING ranked_tool_choices ranked
WHERE choice.ctid = ranked.ctid
  AND ranked.row_number > 1;

ALTER TABLE public.character_language_choices
  DROP CONSTRAINT IF EXISTS character_language_choices_language_key_fkey,
  ALTER COLUMN language_key SET NOT NULL,
  ADD CONSTRAINT character_language_choices_language_key_fkey
    FOREIGN KEY (language_key) REFERENCES public.languages(key) ON DELETE RESTRICT,
  DROP CONSTRAINT IF EXISTS character_language_choices_pkey,
  ADD CONSTRAINT character_language_choices_pkey PRIMARY KEY (character_id, language_key);

ALTER TABLE public.character_tool_choices
  DROP CONSTRAINT IF EXISTS character_tool_choices_tool_key_fkey,
  ALTER COLUMN tool_key SET NOT NULL,
  ADD CONSTRAINT character_tool_choices_tool_key_fkey
    FOREIGN KEY (tool_key) REFERENCES public.tools(key) ON DELETE RESTRICT,
  DROP CONSTRAINT IF EXISTS character_tool_choices_pkey,
  ADD CONSTRAINT character_tool_choices_pkey PRIMARY KEY (character_id, tool_key);
