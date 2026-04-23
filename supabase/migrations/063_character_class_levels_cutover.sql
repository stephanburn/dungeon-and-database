-- Slice 4i: introduce per-level class history while keeping the legacy
-- character_levels aggregate table alive for compatibility.

CREATE TABLE IF NOT EXISTS public.character_class_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES public.characters (id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes (id) ON DELETE RESTRICT,
  level_number int NOT NULL CHECK (level_number BETWEEN 1 AND 20),
  subclass_id uuid NULL REFERENCES public.subclasses (id) ON DELETE SET NULL,
  hp_roll int NULL,
  taken_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (character_id, class_id, level_number)
);

CREATE INDEX IF NOT EXISTS character_class_levels_character_id_idx
  ON public.character_class_levels (character_id);

CREATE INDEX IF NOT EXISTS character_class_levels_character_class_idx
  ON public.character_class_levels (character_id, class_id, level_number);

ALTER TABLE public.character_class_levels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "char_class_levels_select" ON public.character_class_levels;
CREATE POLICY "char_class_levels_select" ON public.character_class_levels
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );

DROP POLICY IF EXISTS "char_class_levels_insert_own" ON public.character_class_levels;
CREATE POLICY "char_class_levels_insert_own" ON public.character_class_levels
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );

DROP POLICY IF EXISTS "char_class_levels_update_own" ON public.character_class_levels;
CREATE POLICY "char_class_levels_update_own" ON public.character_class_levels
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );

DROP POLICY IF EXISTS "char_class_levels_delete_own" ON public.character_class_levels;
CREATE POLICY "char_class_levels_delete_own" ON public.character_class_levels
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );

INSERT INTO public.character_class_levels (
  id,
  character_id,
  class_id,
  level_number,
  subclass_id,
  hp_roll,
  taken_at
)
SELECT
  CASE
    WHEN series.level_number = cl.level THEN cl.id
    ELSE gen_random_uuid()
  END,
  cl.character_id,
  cl.class_id,
  series.level_number,
  CASE
    WHEN series.level_number = cl.level THEN cl.subclass_id
    ELSE NULL
  END,
  COALESCE(hpr.roll, CASE WHEN series.level_number = cl.level THEN cl.hp_roll ELSE NULL END),
  cl.taken_at
FROM public.character_levels cl
CROSS JOIN LATERAL generate_series(1, cl.level) AS series(level_number)
LEFT JOIN public.character_hp_rolls hpr
  ON hpr.character_id = cl.character_id
  AND hpr.class_id = cl.class_id
  AND hpr.level_number = series.level_number
ON CONFLICT (character_id, class_id, level_number) DO UPDATE
SET
  subclass_id = EXCLUDED.subclass_id,
  hp_roll = EXCLUDED.hp_roll,
  taken_at = EXCLUDED.taken_at;

CREATE OR REPLACE FUNCTION public.sync_character_class_levels_for_class(
  p_character_id uuid,
  p_class_id uuid
) RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_current public.character_levels%ROWTYPE;
BEGIN
  SELECT *
  INTO v_current
  FROM public.character_levels
  WHERE character_id = p_character_id
    AND class_id = p_class_id
  ORDER BY level DESC, taken_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    DELETE FROM public.character_class_levels
    WHERE character_id = p_character_id
      AND class_id = p_class_id;
    RETURN;
  END IF;

  DELETE FROM public.character_class_levels
  WHERE character_id = p_character_id
    AND class_id = p_class_id
    AND level_number > v_current.level;

  DELETE FROM public.character_class_levels
  WHERE character_id = p_character_id
    AND class_id = p_class_id
    AND level_number = v_current.level
    AND id <> v_current.id;

  INSERT INTO public.character_class_levels (
    id,
    character_id,
    class_id,
    level_number,
    subclass_id,
    hp_roll,
    taken_at
  )
  SELECT
    CASE
      WHEN series.level_number = v_current.level THEN v_current.id
      ELSE COALESCE(existing.id, gen_random_uuid())
    END,
    p_character_id,
    p_class_id,
    series.level_number,
    CASE
      WHEN series.level_number = v_current.level THEN v_current.subclass_id
      ELSE NULL
    END,
    COALESCE(hpr.roll, CASE WHEN series.level_number = v_current.level THEN v_current.hp_roll ELSE NULL END),
    v_current.taken_at
  FROM generate_series(1, v_current.level) AS series(level_number)
  LEFT JOIN public.character_class_levels existing
    ON existing.character_id = p_character_id
    AND existing.class_id = p_class_id
    AND existing.level_number = series.level_number
  LEFT JOIN public.character_hp_rolls hpr
    ON hpr.character_id = p_character_id
    AND hpr.class_id = p_class_id
    AND hpr.level_number = series.level_number
  ON CONFLICT (character_id, class_id, level_number) DO UPDATE
  SET
    subclass_id = EXCLUDED.subclass_id,
    hp_roll = EXCLUDED.hp_roll,
    taken_at = EXCLUDED.taken_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_character_class_levels_from_levels()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.sync_character_class_levels_for_class(OLD.character_id, OLD.class_id);
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE'
    AND (OLD.character_id <> NEW.character_id OR OLD.class_id <> NEW.class_id)
  THEN
    PERFORM public.sync_character_class_levels_for_class(OLD.character_id, OLD.class_id);
  END IF;

  PERFORM public.sync_character_class_levels_for_class(NEW.character_id, NEW.class_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_character_class_levels_from_levels
  ON public.character_levels;
CREATE TRIGGER sync_character_class_levels_from_levels
AFTER INSERT OR UPDATE OR DELETE
ON public.character_levels
FOR EACH ROW
EXECUTE FUNCTION public.sync_character_class_levels_from_levels();

CREATE OR REPLACE FUNCTION public.sync_character_class_levels_from_hp_rolls()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.sync_character_class_levels_for_class(OLD.character_id, OLD.class_id);
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE'
    AND (OLD.character_id <> NEW.character_id OR OLD.class_id <> NEW.class_id)
  THEN
    PERFORM public.sync_character_class_levels_for_class(OLD.character_id, OLD.class_id);
  END IF;

  PERFORM public.sync_character_class_levels_for_class(NEW.character_id, NEW.class_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_character_class_levels_from_hp_rolls
  ON public.character_hp_rolls;
CREATE TRIGGER sync_character_class_levels_from_hp_rolls
AFTER INSERT OR UPDATE OR DELETE
ON public.character_hp_rolls
FOR EACH ROW
EXECUTE FUNCTION public.sync_character_class_levels_from_hp_rolls();

DO $$
DECLARE
  level_row record;
BEGIN
  FOR level_row IN
    SELECT DISTINCT character_id, class_id
    FROM public.character_levels
  LOOP
    PERFORM public.sync_character_class_levels_for_class(level_row.character_id, level_row.class_id);
  END LOOP;
END
$$;

ALTER TABLE public.character_choices
  DROP CONSTRAINT IF EXISTS character_choices_character_level_id_fkey,
  ADD CONSTRAINT character_choices_character_level_id_fkey
    FOREIGN KEY (character_level_id)
    REFERENCES public.character_class_levels (id)
    ON DELETE CASCADE;

ALTER TABLE public.character_spell_selections
  DROP CONSTRAINT IF EXISTS character_spell_selections_character_level_id_fkey,
  ADD CONSTRAINT character_spell_selections_character_level_id_fkey
    FOREIGN KEY (character_level_id)
    REFERENCES public.character_class_levels (id)
    ON DELETE SET NULL;

ALTER TABLE public.character_feat_choices
  DROP CONSTRAINT IF EXISTS character_feat_choices_character_level_id_fkey,
  ADD CONSTRAINT character_feat_choices_character_level_id_fkey
    FOREIGN KEY (character_level_id)
    REFERENCES public.character_class_levels (id)
    ON DELETE SET NULL;

ALTER TABLE public.character_language_choices
  DROP CONSTRAINT IF EXISTS character_language_choices_character_level_id_fkey,
  ADD CONSTRAINT character_language_choices_character_level_id_fkey
    FOREIGN KEY (character_level_id)
    REFERENCES public.character_class_levels (id)
    ON DELETE SET NULL;

ALTER TABLE public.character_tool_choices
  DROP CONSTRAINT IF EXISTS character_tool_choices_character_level_id_fkey,
  ADD CONSTRAINT character_tool_choices_character_level_id_fkey
    FOREIGN KEY (character_level_id)
    REFERENCES public.character_class_levels (id)
    ON DELETE SET NULL;

ALTER TABLE public.character_ability_bonus_choices
  DROP CONSTRAINT IF EXISTS character_ability_bonus_choices_character_level_id_fkey,
  ADD CONSTRAINT character_ability_bonus_choices_character_level_id_fkey
    FOREIGN KEY (character_level_id)
    REFERENCES public.character_class_levels (id)
    ON DELETE SET NULL;

ALTER TABLE public.character_asi_choices
  DROP CONSTRAINT IF EXISTS character_asi_choices_character_level_id_fkey,
  ADD CONSTRAINT character_asi_choices_character_level_id_fkey
    FOREIGN KEY (character_level_id)
    REFERENCES public.character_class_levels (id)
    ON DELETE SET NULL;

ALTER TABLE public.character_feature_option_choices
  DROP CONSTRAINT IF EXISTS character_feature_option_choices_character_level_id_fkey,
  ADD CONSTRAINT character_feature_option_choices_character_level_id_fkey
    FOREIGN KEY (character_level_id)
    REFERENCES public.character_class_levels (id)
    ON DELETE SET NULL;

ALTER TABLE public.character_skill_proficiencies
  DROP CONSTRAINT IF EXISTS character_skill_proficiencies_character_level_id_fkey,
  ADD CONSTRAINT character_skill_proficiencies_character_level_id_fkey
    FOREIGN KEY (character_level_id)
    REFERENCES public.character_class_levels (id)
    ON DELETE SET NULL;
