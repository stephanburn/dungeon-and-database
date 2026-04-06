-- ============================================================
-- DUNGEON & DATABASE — Initial Schema
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- ENUMS
-- ────────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('player', 'dm');

CREATE TYPE character_status AS ENUM (
  'draft',
  'submitted',
  'approved',
  'changes_requested'
);

CREATE TYPE stat_method AS ENUM ('point_buy', 'standard_array', 'rolled');

CREATE TYPE alignment AS ENUM (
  'LG', 'NG', 'CG',
  'LN', 'N',  'CN',
  'LE', 'NE', 'CE'
);

CREATE TYPE size_category AS ENUM ('tiny', 'small', 'medium', 'large');

CREATE TYPE spellcasting_type AS ENUM ('full', 'half', 'third', 'pact', 'none');

CREATE TYPE choice_type AS ENUM (
  'asi', 'feat', 'spell_known', 'skill', 'fighting_style', 'other'
);

CREATE TYPE check_severity AS ENUM ('error', 'warning');

CREATE TYPE character_type AS ENUM ('pc', 'npc', 'test');

-- ────────────────────────────────────────────────────────────
-- AUTH & USERS
-- ────────────────────────────────────────────────────────────

CREATE TABLE public.users (
  id           uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name text        NOT NULL DEFAULT '',
  role         user_role   NOT NULL DEFAULT 'player',
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Auto-create user row on signup.
-- The first user to sign up receives the 'dm' role.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role user_role;
BEGIN
  IF (SELECT COUNT(*) FROM public.users) = 0 THEN
    assigned_role := 'dm';
  ELSE
    assigned_role := 'player';
  END IF;

  INSERT INTO public.users (id, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    assigned_role
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ────────────────────────────────────────────────────────────
-- CAMPAIGNS
-- ────────────────────────────────────────────────────────────

CREATE TABLE public.campaigns (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  dm_id      uuid        NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  settings   jsonb       NOT NULL DEFAULT '{
    "stat_method": "point_buy",
    "max_level": 20,
    "milestone_levelling": false
  }'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.campaign_members (
  campaign_id uuid        NOT NULL REFERENCES public.campaigns (id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  joined_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (campaign_id, user_id)
);

-- DM is always a member of their own campaign
CREATE OR REPLACE FUNCTION public.handle_campaign_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.campaign_members (campaign_id, user_id)
  VALUES (NEW.id, NEW.dm_id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_campaign_created
  AFTER INSERT ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.handle_campaign_created();

CREATE TABLE public.campaign_source_allowlist (
  campaign_id uuid NOT NULL REFERENCES public.campaigns (id) ON DELETE CASCADE,
  source_key  text NOT NULL,
  PRIMARY KEY (campaign_id, source_key)
);

-- ────────────────────────────────────────────────────────────
-- CONTENT TABLES (meta-columns shared by all)
-- source       text    NOT NULL
-- amended      boolean NOT NULL DEFAULT false
-- amendment_note text  NULLABLE
-- ────────────────────────────────────────────────────────────

CREATE TABLE public.species_traits (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  description    text NOT NULL DEFAULT '',
  source         text NOT NULL,
  amended        boolean NOT NULL DEFAULT false,
  amendment_note text,
  UNIQUE (name, source)
);

CREATE TABLE public.species (
  id                    uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  text         NOT NULL,
  size                  size_category NOT NULL DEFAULT 'medium',
  speed                 int          NOT NULL DEFAULT 30,
  ability_score_bonuses jsonb        NOT NULL DEFAULT '[]'::jsonb,
  languages             text[]       NOT NULL DEFAULT '{}',
  traits                uuid[]       NOT NULL DEFAULT '{}',
  senses                jsonb        NOT NULL DEFAULT '[]'::jsonb,
  source                text         NOT NULL,
  amended               boolean      NOT NULL DEFAULT false,
  amendment_note        text,
  UNIQUE (name, source)
);

CREATE TABLE public.class_features (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  description    text NOT NULL DEFAULT '',
  source         text NOT NULL,
  amended        boolean NOT NULL DEFAULT false,
  amendment_note text,
  UNIQUE (name, source)
);

CREATE TABLE public.classes (
  id                         uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  name                       text              NOT NULL,
  hit_die                    int               NOT NULL,
  primary_ability            text[]            NOT NULL DEFAULT '{}',
  saving_throw_proficiencies text[]            NOT NULL DEFAULT '{}',
  armor_proficiencies        text[]            NOT NULL DEFAULT '{}',
  weapon_proficiencies       text[]            NOT NULL DEFAULT '{}',
  tool_proficiencies         jsonb             NOT NULL DEFAULT '{}'::jsonb,
  skill_choices              jsonb             NOT NULL DEFAULT '{}'::jsonb,
  multiclass_prereqs         jsonb             NOT NULL DEFAULT '[]'::jsonb,
  multiclass_proficiencies   jsonb             NOT NULL DEFAULT '{}'::jsonb,
  spellcasting_type          spellcasting_type,
  source                     text              NOT NULL,
  amended                    boolean           NOT NULL DEFAULT false,
  amendment_note             text,
  UNIQUE (name, source)
);

CREATE TABLE public.class_feature_progression (
  id                uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id          uuid    NOT NULL REFERENCES public.classes (id) ON DELETE CASCADE,
  level             int     NOT NULL CHECK (level BETWEEN 1 AND 20),
  features          uuid[]  NOT NULL DEFAULT '{}',
  asi_available     boolean NOT NULL DEFAULT false,
  proficiency_bonus int     NOT NULL,
  UNIQUE (class_id, level)
);

CREATE TABLE public.spell_slot_tables (
  id                  uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id            uuid  NOT NULL REFERENCES public.classes (id) ON DELETE CASCADE,
  level               int   NOT NULL CHECK (level BETWEEN 1 AND 20),
  slots_by_spell_level int[] NOT NULL DEFAULT '{}',
  UNIQUE (class_id, level)
);

CREATE TABLE public.multiclass_spell_slot_table (
  caster_level         int   PRIMARY KEY CHECK (caster_level BETWEEN 1 AND 20),
  slots_by_spell_level int[] NOT NULL DEFAULT '{}'
);

CREATE TABLE public.subclasses (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  class_id       uuid NOT NULL REFERENCES public.classes (id) ON DELETE CASCADE,
  choice_level   int  NOT NULL,
  source         text NOT NULL,
  amended        boolean NOT NULL DEFAULT false,
  amendment_note text,
  UNIQUE (name, class_id, source)
);

CREATE TABLE public.subclass_features (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subclass_id    uuid NOT NULL REFERENCES public.subclasses (id) ON DELETE CASCADE,
  name           text NOT NULL,
  level          int  NOT NULL CHECK (level BETWEEN 1 AND 20),
  description    text NOT NULL DEFAULT '',
  source         text NOT NULL,
  amended        boolean NOT NULL DEFAULT false,
  amendment_note text,
  UNIQUE (subclass_id, name, level)
);

CREATE TABLE public.spells (
  id               uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text    NOT NULL,
  level            int     NOT NULL CHECK (level BETWEEN 0 AND 9),
  school           text    NOT NULL,
  casting_time     text    NOT NULL,
  range            text    NOT NULL,
  components       jsonb   NOT NULL DEFAULT '{}'::jsonb,
  duration         text    NOT NULL,
  concentration    boolean NOT NULL DEFAULT false,
  ritual           boolean NOT NULL DEFAULT false,
  description      text    NOT NULL DEFAULT '',
  classes          uuid[]  NOT NULL DEFAULT '{}',
  source           text    NOT NULL,
  amended          boolean NOT NULL DEFAULT false,
  amendment_note   text,
  UNIQUE (name, source)
);

CREATE TABLE public.feats (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  prerequisites  jsonb NOT NULL DEFAULT '[]'::jsonb,
  description    text NOT NULL DEFAULT '',
  benefits       jsonb NOT NULL DEFAULT '{}'::jsonb,
  source         text NOT NULL,
  amended        boolean NOT NULL DEFAULT false,
  amendment_note text,
  UNIQUE (name, source)
);

CREATE TABLE public.backgrounds (
  id                  uuid     PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text     NOT NULL,
  skill_proficiencies text[]   NOT NULL DEFAULT '{}',
  tool_proficiencies  text[]   NOT NULL DEFAULT '{}',
  languages           text[]   NOT NULL DEFAULT '{}',
  starting_equipment  jsonb    NOT NULL DEFAULT '[]'::jsonb,
  source              text     NOT NULL,
  amended             boolean  NOT NULL DEFAULT false,
  amendment_note      text,
  UNIQUE (name, source)
);

-- ────────────────────────────────────────────────────────────
-- CHARACTERS
-- ────────────────────────────────────────────────────────────

CREATE TABLE public.characters (
  id                uuid             PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid             NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  campaign_id       uuid             NOT NULL REFERENCES public.campaigns (id) ON DELETE RESTRICT,
  name              text             NOT NULL,
  species_id        uuid             REFERENCES public.species (id) ON DELETE SET NULL,
  background_id     uuid             REFERENCES public.backgrounds (id) ON DELETE SET NULL,
  alignment         alignment,
  experience_points int              NOT NULL DEFAULT 0,
  status            character_status NOT NULL DEFAULT 'draft',
  stat_method       stat_method      NOT NULL DEFAULT 'point_buy',
  base_str          int              NOT NULL DEFAULT 8 CHECK (base_str BETWEEN 1 AND 30),
  base_dex          int              NOT NULL DEFAULT 8 CHECK (base_dex BETWEEN 1 AND 30),
  base_con          int              NOT NULL DEFAULT 8 CHECK (base_con BETWEEN 1 AND 30),
  base_int          int              NOT NULL DEFAULT 8 CHECK (base_int BETWEEN 1 AND 30),
  base_wis          int              NOT NULL DEFAULT 8 CHECK (base_wis BETWEEN 1 AND 30),
  base_cha          int              NOT NULL DEFAULT 8 CHECK (base_cha BETWEEN 1 AND 30),
  hp_max            int              NOT NULL DEFAULT 0,
  character_type    character_type   NOT NULL DEFAULT 'pc',
  dm_notes          text,
  created_at        timestamptz      NOT NULL DEFAULT now(),
  updated_at        timestamptz      NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER characters_updated_at
  BEFORE UPDATE ON public.characters
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.character_levels (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid        NOT NULL REFERENCES public.characters (id) ON DELETE CASCADE,
  class_id     uuid        NOT NULL REFERENCES public.classes (id) ON DELETE RESTRICT,
  level        int         NOT NULL CHECK (level BETWEEN 1 AND 20),
  subclass_id  uuid        REFERENCES public.subclasses (id) ON DELETE SET NULL,
  hp_roll      int,
  taken_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.character_stat_rolls (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid        NOT NULL REFERENCES public.characters (id) ON DELETE CASCADE,
  roll_set     int[]       NOT NULL,
  assigned_to  text        NOT NULL CHECK (assigned_to IN ('str','dex','con','int','wis','cha')),
  rolled_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (character_id, assigned_to)
);

CREATE TABLE public.character_snapshots (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid        NOT NULL REFERENCES public.characters (id) ON DELETE CASCADE,
  snapshot     jsonb       NOT NULL,
  level_total  int         NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.character_choices (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id        uuid        NOT NULL REFERENCES public.characters (id) ON DELETE CASCADE,
  character_level_id  uuid        NOT NULL REFERENCES public.character_levels (id) ON DELETE CASCADE,
  choice_type         choice_type NOT NULL,
  choice_value        jsonb       NOT NULL DEFAULT '{}'::jsonb
);

-- ────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.users                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_members        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_source_allowlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_levels        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_stat_rolls    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_snapshots     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_choices       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.species                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.species_traits          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_feature_progression ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spell_slot_tables       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multiclass_spell_slot_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subclasses              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subclass_features       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spells                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feats                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backgrounds             ENABLE ROW LEVEL SECURITY;

-- Helper: is the current user a DM?
CREATE OR REPLACE FUNCTION public.is_dm()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'dm'
  );
$$;

-- Helper: does the current user belong to a campaign?
CREATE OR REPLACE FUNCTION public.is_campaign_member(p_campaign_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.campaign_members
    WHERE campaign_id = p_campaign_id AND user_id = auth.uid()
  );
$$;

-- ── users ────────────────────────────────────────────────────
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (id = auth.uid() OR public.is_dm());

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (id = auth.uid());

-- ── campaigns ────────────────────────────────────────────────
CREATE POLICY "campaigns_select_member" ON public.campaigns
  FOR SELECT USING (public.is_campaign_member(id) OR public.is_dm());

CREATE POLICY "campaigns_insert_dm" ON public.campaigns
  FOR INSERT WITH CHECK (public.is_dm() AND dm_id = auth.uid());

CREATE POLICY "campaigns_update_dm" ON public.campaigns
  FOR UPDATE USING (public.is_dm() AND dm_id = auth.uid());

CREATE POLICY "campaigns_delete_dm" ON public.campaigns
  FOR DELETE USING (public.is_dm() AND dm_id = auth.uid());

-- ── campaign_members ─────────────────────────────────────────
CREATE POLICY "campaign_members_select" ON public.campaign_members
  FOR SELECT USING (user_id = auth.uid() OR public.is_dm());

CREATE POLICY "campaign_members_insert_dm" ON public.campaign_members
  FOR INSERT WITH CHECK (public.is_dm());

CREATE POLICY "campaign_members_delete_dm" ON public.campaign_members
  FOR DELETE USING (public.is_dm());

-- ── campaign_source_allowlist ────────────────────────────────
CREATE POLICY "allowlist_select_member" ON public.campaign_source_allowlist
  FOR SELECT USING (public.is_campaign_member(campaign_id) OR public.is_dm());

CREATE POLICY "allowlist_insert_dm" ON public.campaign_source_allowlist
  FOR INSERT WITH CHECK (public.is_dm());

CREATE POLICY "allowlist_delete_dm" ON public.campaign_source_allowlist
  FOR DELETE USING (public.is_dm());

-- ── characters ───────────────────────────────────────────────
-- npc and test rows are DM-visible only; pc rows are visible to owner or DM
CREATE POLICY "characters_select" ON public.characters
  FOR SELECT USING (
    public.is_dm()
    OR (user_id = auth.uid() AND character_type = 'pc')
  );

-- Players may only create pc-type characters
CREATE POLICY "characters_insert_own" ON public.characters
  FOR INSERT WITH CHECK (
    public.is_dm()
    OR (user_id = auth.uid() AND character_type = 'pc')
  );

CREATE POLICY "characters_update_own" ON public.characters
  FOR UPDATE USING (
    public.is_dm()
    OR (user_id = auth.uid() AND character_type = 'pc')
  );

CREATE POLICY "characters_delete_own" ON public.characters
  FOR DELETE USING (public.is_dm() OR (user_id = auth.uid() AND character_type = 'pc'));

-- ── character_levels ─────────────────────────────────────────
CREATE POLICY "char_levels_select" ON public.character_levels
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.characters c
            WHERE c.id = character_id
            AND (c.user_id = auth.uid() OR public.is_dm()))
  );

CREATE POLICY "char_levels_insert_own" ON public.character_levels
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.characters c
            WHERE c.id = character_id AND c.user_id = auth.uid())
  );

CREATE POLICY "char_levels_update_own" ON public.character_levels
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.characters c
            WHERE c.id = character_id AND c.user_id = auth.uid())
  );

CREATE POLICY "char_levels_delete_own" ON public.character_levels
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.characters c
            WHERE c.id = character_id AND c.user_id = auth.uid())
  );

-- ── character_stat_rolls ─────────────────────────────────────
CREATE POLICY "char_stat_rolls_select" ON public.character_stat_rolls
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.characters c
            WHERE c.id = character_id
            AND (c.user_id = auth.uid() OR public.is_dm()))
  );

CREATE POLICY "char_stat_rolls_insert_own" ON public.character_stat_rolls
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.characters c
            WHERE c.id = character_id AND c.user_id = auth.uid())
  );

CREATE POLICY "char_stat_rolls_update_own" ON public.character_stat_rolls
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.characters c
            WHERE c.id = character_id AND c.user_id = auth.uid())
  );

CREATE POLICY "char_stat_rolls_delete_own" ON public.character_stat_rolls
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.characters c
            WHERE c.id = character_id AND c.user_id = auth.uid())
  );

-- ── character_snapshots ──────────────────────────────────────
CREATE POLICY "char_snapshots_select" ON public.character_snapshots
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.characters c
            WHERE c.id = character_id
            AND (c.user_id = auth.uid() OR public.is_dm()))
  );

CREATE POLICY "char_snapshots_insert" ON public.character_snapshots
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.characters c
            WHERE c.id = character_id
            AND (c.user_id = auth.uid() OR public.is_dm()))
  );

-- ── character_choices ────────────────────────────────────────
CREATE POLICY "char_choices_select" ON public.character_choices
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.characters c
            WHERE c.id = character_id
            AND (c.user_id = auth.uid() OR public.is_dm()))
  );

CREATE POLICY "char_choices_insert_own" ON public.character_choices
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.characters c
            WHERE c.id = character_id AND c.user_id = auth.uid())
  );

CREATE POLICY "char_choices_update_own" ON public.character_choices
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.characters c
            WHERE c.id = character_id AND c.user_id = auth.uid())
  );

CREATE POLICY "char_choices_delete_own" ON public.character_choices
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.characters c
            WHERE c.id = character_id AND c.user_id = auth.uid())
  );

-- ── content tables (all authenticated users read; DM writes) ─

-- species
CREATE POLICY "species_select_auth" ON public.species
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "species_insert_dm" ON public.species
  FOR INSERT WITH CHECK (public.is_dm());
CREATE POLICY "species_update_dm" ON public.species
  FOR UPDATE USING (public.is_dm());

-- species_traits
CREATE POLICY "species_traits_select_auth" ON public.species_traits
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "species_traits_insert_dm" ON public.species_traits
  FOR INSERT WITH CHECK (public.is_dm());
CREATE POLICY "species_traits_update_dm" ON public.species_traits
  FOR UPDATE USING (public.is_dm());

-- classes
CREATE POLICY "classes_select_auth" ON public.classes
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "classes_insert_dm" ON public.classes
  FOR INSERT WITH CHECK (public.is_dm());
CREATE POLICY "classes_update_dm" ON public.classes
  FOR UPDATE USING (public.is_dm());

-- class_feature_progression
CREATE POLICY "cfp_select_auth" ON public.class_feature_progression
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "cfp_insert_dm" ON public.class_feature_progression
  FOR INSERT WITH CHECK (public.is_dm());
CREATE POLICY "cfp_update_dm" ON public.class_feature_progression
  FOR UPDATE USING (public.is_dm());

-- spell_slot_tables
CREATE POLICY "sst_select_auth" ON public.spell_slot_tables
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "sst_insert_dm" ON public.spell_slot_tables
  FOR INSERT WITH CHECK (public.is_dm());
CREATE POLICY "sst_update_dm" ON public.spell_slot_tables
  FOR UPDATE USING (public.is_dm());

-- multiclass_spell_slot_table
CREATE POLICY "msst_select_auth" ON public.multiclass_spell_slot_table
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "msst_insert_dm" ON public.multiclass_spell_slot_table
  FOR INSERT WITH CHECK (public.is_dm());
CREATE POLICY "msst_update_dm" ON public.multiclass_spell_slot_table
  FOR UPDATE USING (public.is_dm());

-- subclasses
CREATE POLICY "subclasses_select_auth" ON public.subclasses
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "subclasses_insert_dm" ON public.subclasses
  FOR INSERT WITH CHECK (public.is_dm());
CREATE POLICY "subclasses_update_dm" ON public.subclasses
  FOR UPDATE USING (public.is_dm());

-- subclass_features
CREATE POLICY "subclass_features_select_auth" ON public.subclass_features
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "subclass_features_insert_dm" ON public.subclass_features
  FOR INSERT WITH CHECK (public.is_dm());
CREATE POLICY "subclass_features_update_dm" ON public.subclass_features
  FOR UPDATE USING (public.is_dm());

-- spells
CREATE POLICY "spells_select_auth" ON public.spells
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "spells_insert_dm" ON public.spells
  FOR INSERT WITH CHECK (public.is_dm());
CREATE POLICY "spells_update_dm" ON public.spells
  FOR UPDATE USING (public.is_dm());

-- feats
CREATE POLICY "feats_select_auth" ON public.feats
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "feats_insert_dm" ON public.feats
  FOR INSERT WITH CHECK (public.is_dm());
CREATE POLICY "feats_update_dm" ON public.feats
  FOR UPDATE USING (public.is_dm());

-- backgrounds
CREATE POLICY "backgrounds_select_auth" ON public.backgrounds
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "backgrounds_insert_dm" ON public.backgrounds
  FOR INSERT WITH CHECK (public.is_dm());
CREATE POLICY "backgrounds_update_dm" ON public.backgrounds
  FOR UPDATE USING (public.is_dm());

-- ────────────────────────────────────────────────────────────
-- MULTICLASS SPELL SLOT TABLE SEED (PHB data — OGL content)
-- ────────────────────────────────────────────────────────────

INSERT INTO public.multiclass_spell_slot_table (caster_level, slots_by_spell_level) VALUES
  (1,  ARRAY[2,0,0,0,0,0,0,0,0]),
  (2,  ARRAY[3,0,0,0,0,0,0,0,0]),
  (3,  ARRAY[4,2,0,0,0,0,0,0,0]),
  (4,  ARRAY[4,3,0,0,0,0,0,0,0]),
  (5,  ARRAY[4,3,2,0,0,0,0,0,0]),
  (6,  ARRAY[4,3,3,0,0,0,0,0,0]),
  (7,  ARRAY[4,3,3,1,0,0,0,0,0]),
  (8,  ARRAY[4,3,3,2,0,0,0,0,0]),
  (9,  ARRAY[4,3,3,3,1,0,0,0,0]),
  (10, ARRAY[4,3,3,3,2,0,0,0,0]),
  (11, ARRAY[4,3,3,3,2,1,0,0,0]),
  (12, ARRAY[4,3,3,3,2,1,0,0,0]),
  (13, ARRAY[4,3,3,3,2,1,1,0,0]),
  (14, ARRAY[4,3,3,3,2,1,1,0,0]),
  (15, ARRAY[4,3,3,3,2,1,1,1,0]),
  (16, ARRAY[4,3,3,3,2,1,1,1,0]),
  (17, ARRAY[4,3,3,3,2,1,1,1,1]),
  (18, ARRAY[4,3,3,3,3,1,1,1,1]),
  (19, ARRAY[4,3,3,3,3,2,1,1,1]),
  (20, ARRAY[4,3,3,3,3,2,2,1,1]);
