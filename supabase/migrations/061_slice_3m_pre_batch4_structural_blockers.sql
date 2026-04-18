-- Slice 3m: atomic character saves, owner access for non-PC rows, and HP roll history.

-- ── characters owner access ─────────────────────────────────
DROP POLICY IF EXISTS "characters_select" ON public.characters;
CREATE POLICY "characters_select" ON public.characters
  FOR SELECT USING (
    public.can_manage_campaign(campaign_id)
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "characters_insert_own" ON public.characters;
CREATE POLICY "characters_insert_own" ON public.characters
  FOR INSERT WITH CHECK (
    public.can_manage_campaign(campaign_id)
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "characters_update_own" ON public.characters;
CREATE POLICY "characters_update_own" ON public.characters
  FOR UPDATE
  USING (
    public.can_manage_campaign(campaign_id)
    OR user_id = auth.uid()
  )
  WITH CHECK (
    public.can_manage_campaign(campaign_id)
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "characters_delete_own" ON public.characters;
CREATE POLICY "characters_delete_own" ON public.characters
  FOR DELETE USING (
    public.can_manage_campaign(campaign_id)
    OR user_id = auth.uid()
  );

-- ── hp roll history ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.character_hp_rolls (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid        NOT NULL REFERENCES public.characters (id) ON DELETE CASCADE,
  class_id     uuid        NOT NULL REFERENCES public.classes (id) ON DELETE RESTRICT,
  level_number int         NOT NULL CHECK (level_number BETWEEN 1 AND 20),
  roll         int         NOT NULL CHECK (roll >= 1),
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (character_id, class_id, level_number)
);

CREATE INDEX IF NOT EXISTS character_hp_rolls_character_id_idx
  ON public.character_hp_rolls (character_id);

ALTER TABLE public.character_hp_rolls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "char_hp_rolls_select" ON public.character_hp_rolls;
CREATE POLICY "char_hp_rolls_select" ON public.character_hp_rolls
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );

DROP POLICY IF EXISTS "char_hp_rolls_insert_own" ON public.character_hp_rolls;
CREATE POLICY "char_hp_rolls_insert_own" ON public.character_hp_rolls
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );

DROP POLICY IF EXISTS "char_hp_rolls_update_own" ON public.character_hp_rolls;
CREATE POLICY "char_hp_rolls_update_own" ON public.character_hp_rolls
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

DROP POLICY IF EXISTS "char_hp_rolls_delete_own" ON public.character_hp_rolls;
CREATE POLICY "char_hp_rolls_delete_own" ON public.character_hp_rolls
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM public.characters c
      WHERE c.id = character_id
        AND (c.user_id = auth.uid() OR public.can_manage_campaign(c.campaign_id))
    )
  );

INSERT INTO public.character_hp_rolls (character_id, class_id, level_number, roll)
SELECT character_id, class_id, level, hp_roll
FROM public.character_levels
WHERE hp_roll IS NOT NULL
ON CONFLICT (character_id, class_id, level_number) DO UPDATE
SET roll = EXCLUDED.roll;

-- ── atomic character save ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.save_character_atomic(
  p_character_id uuid,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS public.characters
LANGUAGE plpgsql
AS $$
DECLARE
  v_existing public.characters%ROWTYPE;
  v_updated public.characters%ROWTYPE;
  v_actor_role public.user_role;
  v_has_character_type boolean := p_payload ? 'character_type';
  v_has_dm_notes boolean := p_payload ? 'dm_notes';
BEGIN
  SELECT *
  INTO v_existing
  FROM public.characters
  WHERE id = p_character_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Character not found';
  END IF;

  SELECT role
  INTO v_actor_role
  FROM public.users
  WHERE id = auth.uid();

  IF v_actor_role IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  UPDATE public.characters
  SET
    name = CASE WHEN p_payload ? 'name' THEN p_payload->>'name' ELSE name END,
    species_id = CASE WHEN p_payload ? 'species_id' THEN NULLIF(p_payload->>'species_id', '')::uuid ELSE species_id END,
    background_id = CASE WHEN p_payload ? 'background_id' THEN NULLIF(p_payload->>'background_id', '')::uuid ELSE background_id END,
    alignment = CASE WHEN p_payload ? 'alignment' THEN NULLIF(p_payload->>'alignment', '')::public.alignment ELSE alignment END,
    experience_points = CASE WHEN p_payload ? 'experience_points' THEN (p_payload->>'experience_points')::int ELSE experience_points END,
    stat_method = CASE WHEN p_payload ? 'stat_method' THEN (p_payload->>'stat_method')::public.stat_method ELSE stat_method END,
    base_str = CASE WHEN p_payload ? 'base_str' THEN (p_payload->>'base_str')::int ELSE base_str END,
    base_dex = CASE WHEN p_payload ? 'base_dex' THEN (p_payload->>'base_dex')::int ELSE base_dex END,
    base_con = CASE WHEN p_payload ? 'base_con' THEN (p_payload->>'base_con')::int ELSE base_con END,
    base_int = CASE WHEN p_payload ? 'base_int' THEN (p_payload->>'base_int')::int ELSE base_int END,
    base_wis = CASE WHEN p_payload ? 'base_wis' THEN (p_payload->>'base_wis')::int ELSE base_wis END,
    base_cha = CASE WHEN p_payload ? 'base_cha' THEN (p_payload->>'base_cha')::int ELSE base_cha END,
    hp_max = CASE WHEN p_payload ? 'hp_max' THEN (p_payload->>'hp_max')::int ELSE hp_max END,
    status = CASE WHEN p_payload ? 'status' THEN (p_payload->>'status')::public.character_status ELSE status END,
    character_type = CASE
      WHEN v_has_character_type AND v_actor_role::text IN ('dm', 'admin')
        THEN (p_payload->>'character_type')::public.character_type
      ELSE character_type
    END,
    dm_notes = CASE
      WHEN v_has_dm_notes AND v_actor_role::text IN ('dm', 'admin')
        THEN p_payload->>'dm_notes'
      ELSE dm_notes
    END,
    updated_at = now()
  WHERE id = p_character_id
  RETURNING * INTO v_updated;

  IF p_payload ? 'levels' THEN
    INSERT INTO public.character_hp_rolls (character_id, class_id, level_number, roll)
    SELECT character_id, class_id, level, hp_roll
    FROM public.character_levels
    WHERE character_id = p_character_id
      AND hp_roll IS NOT NULL
    ON CONFLICT (character_id, class_id, level_number) DO NOTHING;

    DELETE FROM public.character_hp_rolls
    WHERE character_id = p_character_id
      AND NOT EXISTS (
        SELECT 1
        FROM jsonb_to_recordset(COALESCE(p_payload->'levels', '[]'::jsonb))
          AS incoming(class_id uuid, level int, subclass_id uuid, hp_roll int)
        WHERE incoming.class_id = character_hp_rolls.class_id
      );

    DELETE FROM public.character_hp_rolls
    USING jsonb_to_recordset(COALESCE(p_payload->'levels', '[]'::jsonb))
      AS incoming(class_id uuid, level int, subclass_id uuid, hp_roll int)
    WHERE character_hp_rolls.character_id = p_character_id
      AND character_hp_rolls.class_id = incoming.class_id
      AND character_hp_rolls.level_number > incoming.level;

    DELETE FROM public.character_levels
    WHERE character_id = p_character_id;

    INSERT INTO public.character_levels (character_id, class_id, level, subclass_id, hp_roll)
    SELECT
      p_character_id,
      incoming.class_id,
      incoming.level,
      incoming.subclass_id,
      incoming.hp_roll
    FROM jsonb_to_recordset(COALESCE(p_payload->'levels', '[]'::jsonb))
      AS incoming(class_id uuid, level int, subclass_id uuid, hp_roll int);

    INSERT INTO public.character_hp_rolls (character_id, class_id, level_number, roll)
    SELECT
      p_character_id,
      incoming.class_id,
      incoming.level,
      incoming.hp_roll
    FROM jsonb_to_recordset(COALESCE(p_payload->'levels', '[]'::jsonb))
      AS incoming(class_id uuid, level int, subclass_id uuid, hp_roll int)
    WHERE incoming.hp_roll IS NOT NULL
    ON CONFLICT (character_id, class_id, level_number) DO UPDATE
    SET roll = EXCLUDED.roll;
  END IF;

  IF p_payload ? 'stat_rolls' THEN
    DELETE FROM public.character_stat_rolls WHERE character_id = p_character_id;

    INSERT INTO public.character_stat_rolls (character_id, assigned_to, roll_set)
    SELECT p_character_id, incoming.assigned_to, incoming.roll_set
    FROM jsonb_to_recordset(COALESCE(p_payload->'stat_rolls', '[]'::jsonb))
      AS incoming(assigned_to text, roll_set int[]);
  END IF;

  IF p_payload ? 'skill_proficiencies' THEN
    DELETE FROM public.character_skill_proficiencies WHERE character_id = p_character_id;

    INSERT INTO public.character_skill_proficiencies (
      character_id,
      skill,
      expertise,
      character_level_id,
      source_category,
      source_entity_id,
      source_feature_key
    )
    SELECT
      p_character_id,
      incoming.skill,
      COALESCE(incoming.expertise, false),
      incoming.character_level_id,
      COALESCE(incoming.source_category, 'manual'),
      incoming.source_entity_id,
      incoming.source_feature_key
    FROM jsonb_to_recordset(COALESCE(p_payload->'skill_proficiencies', '[]'::jsonb))
      AS incoming(
        skill text,
        expertise boolean,
        character_level_id uuid,
        source_category text,
        source_entity_id uuid,
        source_feature_key text
      );
  END IF;

  IF p_payload ? 'ability_bonus_choices' THEN
    DELETE FROM public.character_ability_bonus_choices WHERE character_id = p_character_id;

    INSERT INTO public.character_ability_bonus_choices (
      character_id,
      ability,
      bonus,
      character_level_id,
      source_category,
      source_entity_id,
      source_feature_key
    )
    SELECT
      p_character_id,
      incoming.ability,
      COALESCE(incoming.bonus, 1),
      incoming.character_level_id,
      COALESCE(incoming.source_category, 'manual'),
      incoming.source_entity_id,
      incoming.source_feature_key
    FROM jsonb_to_recordset(COALESCE(p_payload->'ability_bonus_choices', '[]'::jsonb))
      AS incoming(
        ability text,
        bonus int,
        character_level_id uuid,
        source_category text,
        source_entity_id uuid,
        source_feature_key text
      );
  END IF;

  IF p_payload ? 'asi_choices' THEN
    DELETE FROM public.character_asi_choices WHERE character_id = p_character_id;

    INSERT INTO public.character_asi_choices (
      character_id,
      slot_index,
      ability,
      bonus,
      character_level_id,
      source_feature_key
    )
    SELECT
      p_character_id,
      incoming.slot_index,
      incoming.ability,
      COALESCE(incoming.bonus, 1),
      incoming.character_level_id,
      incoming.source_feature_key
    FROM jsonb_to_recordset(COALESCE(p_payload->'asi_choices', '[]'::jsonb))
      AS incoming(
        slot_index int,
        ability text,
        bonus int,
        character_level_id uuid,
        source_feature_key text
      );
  END IF;

  IF p_payload ? 'feature_option_choices' THEN
    DELETE FROM public.character_feature_option_choices WHERE character_id = p_character_id;

    INSERT INTO public.character_feature_option_choices (
      character_id,
      option_group_key,
      option_key,
      selected_value,
      choice_order,
      character_level_id,
      source_category,
      source_entity_id,
      source_feature_key
    )
    SELECT
      p_character_id,
      incoming.option_group_key,
      incoming.option_key,
      COALESCE(incoming.selected_value, '{}'::jsonb),
      COALESCE(incoming.choice_order, 0),
      incoming.character_level_id,
      COALESCE(incoming.source_category, 'feature'),
      incoming.source_entity_id,
      incoming.source_feature_key
    FROM jsonb_to_recordset(COALESCE(p_payload->'feature_option_choices', '[]'::jsonb))
      AS incoming(
        option_group_key text,
        option_key text,
        selected_value jsonb,
        choice_order int,
        character_level_id uuid,
        source_category text,
        source_entity_id uuid,
        source_feature_key text
      );
  END IF;

  IF p_payload ? 'equipment_items' THEN
    DELETE FROM public.character_equipment_items WHERE character_id = p_character_id;

    INSERT INTO public.character_equipment_items (
      character_id,
      item_id,
      quantity,
      equipped,
      source_package_item_id,
      source_category,
      source_entity_id,
      notes
    )
    SELECT
      p_character_id,
      incoming.item_id,
      COALESCE(incoming.quantity, 1),
      COALESCE(incoming.equipped, false),
      incoming.source_package_item_id,
      COALESCE(incoming.source_category, 'manual'),
      incoming.source_entity_id,
      incoming.notes
    FROM jsonb_to_recordset(COALESCE(p_payload->'equipment_items', '[]'::jsonb))
      AS incoming(
        item_id uuid,
        quantity int,
        equipped boolean,
        source_package_item_id uuid,
        source_category text,
        source_entity_id uuid,
        notes text
      );
  END IF;

  IF p_payload ? 'language_choices' THEN
    DELETE FROM public.character_language_choices WHERE character_id = p_character_id;

    INSERT INTO public.character_language_choices (
      character_id,
      language,
      language_key,
      character_level_id,
      source_category,
      source_entity_id,
      source_feature_key
    )
    SELECT
      p_character_id,
      incoming.language,
      incoming.language_key,
      incoming.character_level_id,
      COALESCE(incoming.source_category, 'manual'),
      incoming.source_entity_id,
      incoming.source_feature_key
    FROM jsonb_to_recordset(COALESCE(p_payload->'language_choices', '[]'::jsonb))
      AS incoming(
        language text,
        language_key text,
        character_level_id uuid,
        source_category text,
        source_entity_id uuid,
        source_feature_key text
      );
  END IF;

  IF p_payload ? 'tool_choices' THEN
    DELETE FROM public.character_tool_choices WHERE character_id = p_character_id;

    INSERT INTO public.character_tool_choices (
      character_id,
      tool,
      tool_key,
      character_level_id,
      source_category,
      source_entity_id,
      source_feature_key
    )
    SELECT
      p_character_id,
      incoming.tool,
      incoming.tool_key,
      incoming.character_level_id,
      COALESCE(incoming.source_category, 'manual'),
      incoming.source_entity_id,
      incoming.source_feature_key
    FROM jsonb_to_recordset(COALESCE(p_payload->'tool_choices', '[]'::jsonb))
      AS incoming(
        tool text,
        tool_key text,
        character_level_id uuid,
        source_category text,
        source_entity_id uuid,
        source_feature_key text
      );
  END IF;

  IF p_payload ? 'spell_choices' THEN
    DELETE FROM public.character_spell_selections WHERE character_id = p_character_id;
    DELETE FROM public.character_choices
    WHERE character_id = p_character_id
      AND choice_type = 'spell_known';

    INSERT INTO public.character_spell_selections (
      character_id,
      spell_id,
      character_level_id,
      owning_class_id,
      granting_subclass_id,
      acquisition_mode,
      counts_against_selection_limit,
      source_feature_key
    )
    SELECT
      p_character_id,
      incoming.spell_id,
      incoming.character_level_id,
      incoming.owning_class_id,
      incoming.granting_subclass_id,
      COALESCE(incoming.acquisition_mode, 'known'),
      COALESCE(incoming.counts_against_selection_limit, true),
      incoming.source_feature_key
    FROM jsonb_to_recordset(COALESCE(p_payload->'spell_choices', '[]'::jsonb))
      AS incoming(
        spell_id uuid,
        character_level_id uuid,
        owning_class_id uuid,
        granting_subclass_id uuid,
        acquisition_mode text,
        counts_against_selection_limit boolean,
        source_feature_key text
      );
  END IF;

  IF p_payload ? 'feat_choices' THEN
    DELETE FROM public.character_feat_choices WHERE character_id = p_character_id;
    DELETE FROM public.character_choices
    WHERE character_id = p_character_id
      AND choice_type = 'feat';

    INSERT INTO public.character_feat_choices (
      character_id,
      feat_id,
      character_level_id,
      choice_kind,
      source_feature_key
    )
    SELECT
      p_character_id,
      incoming.feat_id,
      incoming.character_level_id,
      COALESCE(incoming.choice_kind, 'feat'),
      incoming.source_feature_key
    FROM jsonb_to_recordset(COALESCE(p_payload->'feat_choices', '[]'::jsonb))
      AS incoming(
        feat_id uuid,
        character_level_id uuid,
        choice_kind text,
        source_feature_key text
      );
  END IF;

  RETURN v_updated;
END;
$$;
