-- Slice 4.5a: swap/replace semantics for spell_choices, feat_choices,
-- feature_option_choices inside save_character_level_up_atomic so the level-up
-- payload can carry a full after-state (including removals and value edits)
-- without violating the target tables' unique constraints.

CREATE OR REPLACE FUNCTION public.save_character_level_up_atomic(
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
  v_level_up jsonb := COALESCE(p_payload->'level_up', '{}'::jsonb);
  v_class_id uuid := NULLIF(v_level_up->>'class_id', '')::uuid;
  v_previous_level int := COALESCE(NULLIF(v_level_up->>'previous_level', '')::int, -1);
  v_new_level int := COALESCE(NULLIF(v_level_up->>'new_level', '')::int, -1);
  v_subclass_id uuid := NULLIF(v_level_up->>'subclass_id', '')::uuid;
  v_hp_roll int := NULLIF(v_level_up->>'hp_roll', '')::int;
  v_current_level int := 0;
  v_current_subclass_id uuid := NULL;
  v_level_row_id uuid;
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

  IF v_class_id IS NULL THEN
    RAISE EXCEPTION 'Level-up class_id is required';
  END IF;

  IF v_previous_level < 0 THEN
    RAISE EXCEPTION 'Level-up previous_level is required';
  END IF;

  IF v_new_level < 1 THEN
    RAISE EXCEPTION 'Level-up new_level is required';
  END IF;

  SELECT level, subclass_id
  INTO v_current_level, v_current_subclass_id
  FROM public.character_levels
  WHERE character_id = p_character_id
    AND class_id = v_class_id
  ORDER BY level DESC, taken_at DESC
  LIMIT 1;

  v_current_level := COALESCE(v_current_level, 0);

  IF v_current_level <> v_previous_level THEN
    RAISE EXCEPTION 'Level-up expected previous level %, found %', v_previous_level, v_current_level;
  END IF;

  IF v_new_level <> v_previous_level + 1 THEN
    RAISE EXCEPTION 'Level-up must advance exactly one class level';
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

  IF v_previous_level = 0 THEN
    INSERT INTO public.character_levels (
      character_id,
      class_id,
      level,
      subclass_id,
      hp_roll
    )
    VALUES (
      p_character_id,
      v_class_id,
      v_new_level,
      v_subclass_id,
      v_hp_roll
    )
    RETURNING id INTO v_level_row_id;
  ELSE
    UPDATE public.character_levels
    SET
      level = v_new_level,
      subclass_id = COALESCE(v_subclass_id, v_current_subclass_id),
      hp_roll = v_hp_roll
    WHERE character_id = p_character_id
      AND class_id = v_class_id
    RETURNING id INTO v_level_row_id;
  END IF;

  IF v_hp_roll IS NOT NULL THEN
    INSERT INTO public.character_hp_rolls (
      character_id,
      class_id,
      level_number,
      roll
    )
    VALUES (
      p_character_id,
      v_class_id,
      v_new_level,
      v_hp_roll
    )
    ON CONFLICT (character_id, class_id, level_number) DO UPDATE
    SET roll = EXCLUDED.roll;
  END IF;

  SELECT id
  INTO v_level_row_id
  FROM public.character_class_levels
  WHERE character_id = p_character_id
    AND class_id = v_class_id
    AND level_number = v_new_level
  LIMIT 1;

  IF v_level_row_id IS NULL THEN
    RAISE EXCEPTION 'Failed to resolve level-up class level row';
  END IF;

  IF COALESCE((p_payload->>'test_fail_after_level_write')::boolean, false) THEN
    RAISE EXCEPTION 'Injected level-up failure';
  END IF;

  IF p_payload ? 'skill_proficiencies' THEN
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
      COALESCE(incoming.character_level_id, v_level_row_id),
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

  IF p_payload ? 'asi_choices' THEN
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
      incoming.ability::text,
      COALESCE(incoming.bonus, 1),
      COALESCE(incoming.character_level_id, v_level_row_id),
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

  -- feature_option_choices: upsert on the table's natural key so value edits
  -- for the same option succeed without unique-constraint violations.
  IF p_payload ? 'feature_option_choices' THEN
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
      COALESCE(incoming.character_level_id, v_level_row_id),
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
      )
    ON CONFLICT (character_id, option_group_key, option_key, choice_order, source_feature_key)
    DO UPDATE SET
      selected_value = EXCLUDED.selected_value,
      character_level_id = EXCLUDED.character_level_id,
      source_category = EXCLUDED.source_category,
      source_entity_id = EXCLUDED.source_entity_id;
  END IF;

  -- spell_choices: the payload carries the full after-state for the class
  -- receiving the level-up. Clear the editable-for-this-class rows first,
  -- then insert the after-state. Feature-granted (`feature_spell:%`) and
  -- feat-granted (`feat_spell:%`) rows are intentionally preserved; any
  -- pre-existing preserved rows that also appear in the payload are no-ops
  -- thanks to ON CONFLICT DO NOTHING.
  IF p_payload ? 'spell_choices' THEN
    DELETE FROM public.character_spell_selections
    WHERE character_id = p_character_id
      AND owning_class_id = v_class_id
      AND (
        source_feature_key IS NULL
        OR (
          source_feature_key NOT LIKE 'feat_spell:%'
          AND source_feature_key NOT LIKE 'feature_spell:%'
        )
      );

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
      COALESCE(
        incoming.character_level_id,
        CASE
          WHEN incoming.owning_class_id IS NOT DISTINCT FROM v_class_id THEN v_level_row_id
          ELSE NULL
        END
      ),
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
      )
    ON CONFLICT (character_id, spell_id, owning_class_id, granting_subclass_id, acquisition_mode)
    DO NOTHING;
  END IF;

  -- feat_choices: upsert on the table's natural key so re-asserting an
  -- existing feat (from the full after-state) does not raise a unique
  -- violation and source_feature_key / character_level_id can be refreshed
  -- when a retrained-feat payload arrives.
  IF p_payload ? 'feat_choices' THEN
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
      COALESCE(incoming.character_level_id, v_level_row_id),
      COALESCE(incoming.choice_kind, 'feat'),
      incoming.source_feature_key
    FROM jsonb_to_recordset(COALESCE(p_payload->'feat_choices', '[]'::jsonb))
      AS incoming(
        feat_id uuid,
        character_level_id uuid,
        choice_kind text,
        source_feature_key text
      )
    ON CONFLICT (character_id, feat_id, choice_kind)
    DO UPDATE SET
      character_level_id = EXCLUDED.character_level_id,
      source_feature_key = EXCLUDED.source_feature_key;
  END IF;

  RETURN v_updated;
END;
$$;
