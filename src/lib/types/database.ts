// ============================================================
// Database types — hand-written to match 001_initial_schema.sql
// ============================================================

export type UserRole = 'player' | 'dm'
export type CharacterStatus = 'draft' | 'submitted' | 'approved' | 'changes_requested'
export type StatMethod = 'point_buy' | 'standard_array' | 'rolled'
export type Alignment = 'LG' | 'NG' | 'CG' | 'LN' | 'N' | 'CN' | 'LE' | 'NE' | 'CE'
export type SizeCategory = 'tiny' | 'small' | 'medium' | 'large'
export type SpellcastingType = 'full' | 'half' | 'third' | 'pact' | 'none'
export type ChoiceType = 'asi' | 'feat' | 'spell_known' | 'skill' | 'fighting_style' | 'other'
export type CheckSeverity = 'error' | 'warning'
export type CharacterType = 'pc' | 'npc' | 'test'

// ── JSON shapes ────────────────────────────────────────────

export type AbilityScoreBonus = {
  ability: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
  bonus: number
}

export type Sense = {
  type: string   // e.g. 'darkvision', 'blindsight', 'tremorsense'
  range_ft: number
}

export type SpellComponents = {
  verbal: boolean
  somatic: boolean
  material: boolean
  material_description?: string
}

export type FeatPrerequisite = {
  type: 'ability' | 'proficiency' | 'feature' | 'level' | 'spellcasting'
  ability?: string
  min?: number
  proficiency?: string
  feature?: string
}

export type MulticlassPrereq = {
  ability: string
  min: number
}

export type SkillChoices = {
  count: number
  from: string[]
}

export type CampaignSettings = {
  stat_method: StatMethod
  max_level: number
  milestone_levelling: boolean
}

export type StartingEquipmentItem = {
  item: string
  quantity: number
}

// ── Tables ────────────────────────────────────────────────

export type User = {
  id: string
  display_name: string
  role: UserRole
  created_at: string
}

export type Campaign = {
  id: string
  name: string
  dm_id: string
  settings: CampaignSettings
  created_at: string
}

export type CampaignMember = {
  campaign_id: string
  user_id: string
  joined_at: string
}

export type CampaignSourceAllowlist = {
  campaign_id: string
  source_key: string
}

export type SpeciesTrait = {
  id: string
  name: string
  description: string
  source: string
  amended: boolean
  amendment_note: string | null
}

export type Species = {
  id: string
  name: string
  size: SizeCategory
  speed: number
  ability_score_bonuses: AbilityScoreBonus[]
  languages: string[]
  traits: string[]
  senses: Sense[]
  source: string
  amended: boolean
  amendment_note: string | null
}

export type ClassFeature = {
  id: string
  name: string
  description: string
  source: string
  amended: boolean
  amendment_note: string | null
}

export type Class = {
  id: string
  name: string
  hit_die: number
  primary_ability: string[]
  saving_throw_proficiencies: string[]
  armor_proficiencies: string[]
  weapon_proficiencies: string[]
  tool_proficiencies: Record<string, unknown>
  skill_choices: SkillChoices
  multiclass_prereqs: MulticlassPrereq[]
  multiclass_proficiencies: Record<string, unknown>
  spellcasting_type: SpellcastingType | null
  source: string
  amended: boolean
  amendment_note: string | null
}

export type ClassFeatureProgression = {
  id: string
  class_id: string
  level: number
  features: string[]
  asi_available: boolean
  proficiency_bonus: number
}

export type SpellSlotTable = {
  id: string
  class_id: string
  level: number
  slots_by_spell_level: number[]
}

export type MulticlassSpellSlotTable = {
  caster_level: number
  slots_by_spell_level: number[]
}

export type Subclass = {
  id: string
  name: string
  class_id: string
  choice_level: number
  source: string
  amended: boolean
  amendment_note: string | null
}

export type SubclassFeature = {
  id: string
  subclass_id: string
  name: string
  level: number
  description: string
  source: string
  amended: boolean
  amendment_note: string | null
}

export type Spell = {
  id: string
  name: string
  level: number
  school: string
  casting_time: string
  range: string
  components: SpellComponents
  duration: string
  concentration: boolean
  ritual: boolean
  description: string
  classes: string[]
  source: string
  amended: boolean
  amendment_note: string | null
}

export type Feat = {
  id: string
  name: string
  prerequisites: FeatPrerequisite[]
  description: string
  benefits: Record<string, unknown>
  source: string
  amended: boolean
  amendment_note: string | null
}

export type Background = {
  id: string
  name: string
  skill_proficiencies: string[]
  tool_proficiencies: string[]
  languages: string[]
  starting_equipment: StartingEquipmentItem[]
  source: string
  amended: boolean
  amendment_note: string | null
}

export type Character = {
  id: string
  user_id: string
  campaign_id: string
  name: string
  species_id: string | null
  background_id: string | null
  alignment: Alignment | null
  experience_points: number
  status: CharacterStatus
  stat_method: StatMethod
  base_str: number
  base_dex: number
  base_con: number
  base_int: number
  base_wis: number
  base_cha: number
  hp_max: number
  character_type: CharacterType
  dm_notes: string | null
  created_at: string
  updated_at: string
}

export type CharacterLevel = {
  id: string
  character_id: string
  class_id: string
  level: number
  subclass_id: string | null
  hp_roll: number | null
  taken_at: string
}

export type CharacterStatRoll = {
  id: string
  character_id: string
  roll_set: number[]
  assigned_to: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
  rolled_at: string
}

export type CharacterSnapshot = {
  id: string
  character_id: string
  snapshot: Record<string, unknown>
  level_total: number
  created_at: string
}

export type CharacterChoice = {
  id: string
  character_id: string
  character_level_id: string
  choice_type: ChoiceType
  choice_value: Record<string, unknown>
}

// ── Supabase Database shape (for createClient generics) ────
// Every table requires Relationships: [] as of @supabase/supabase-js v2.101+

type R = []  // shorthand for empty Relationships array type

export type Database = {
  public: {
    Tables: {
      users: { Row: User; Insert: Omit<User, 'created_at'>; Update: Partial<Omit<User, 'id'>>; Relationships: R }
      campaigns: { Row: Campaign; Insert: Omit<Campaign, 'id' | 'created_at'>; Update: Partial<Omit<Campaign, 'id'>>; Relationships: R }
      campaign_members: { Row: CampaignMember; Insert: Omit<CampaignMember, 'joined_at'>; Update: Partial<CampaignMember>; Relationships: R }
      campaign_source_allowlist: { Row: CampaignSourceAllowlist; Insert: CampaignSourceAllowlist; Update: Partial<CampaignSourceAllowlist>; Relationships: R }
      species_traits: { Row: SpeciesTrait; Insert: Omit<SpeciesTrait, 'id'>; Update: Partial<Omit<SpeciesTrait, 'id'>>; Relationships: R }
      species: { Row: Species; Insert: Omit<Species, 'id'>; Update: Partial<Omit<Species, 'id'>>; Relationships: R }
      class_features: { Row: ClassFeature; Insert: Omit<ClassFeature, 'id'>; Update: Partial<Omit<ClassFeature, 'id'>>; Relationships: R }
      classes: { Row: Class; Insert: Omit<Class, 'id'>; Update: Partial<Omit<Class, 'id'>>; Relationships: R }
      class_feature_progression: { Row: ClassFeatureProgression; Insert: Omit<ClassFeatureProgression, 'id'>; Update: Partial<Omit<ClassFeatureProgression, 'id'>>; Relationships: R }
      spell_slot_tables: { Row: SpellSlotTable; Insert: Omit<SpellSlotTable, 'id'>; Update: Partial<Omit<SpellSlotTable, 'id'>>; Relationships: R }
      multiclass_spell_slot_table: { Row: MulticlassSpellSlotTable; Insert: MulticlassSpellSlotTable; Update: Partial<MulticlassSpellSlotTable>; Relationships: R }
      subclasses: { Row: Subclass; Insert: Omit<Subclass, 'id'>; Update: Partial<Omit<Subclass, 'id'>>; Relationships: R }
      subclass_features: { Row: SubclassFeature; Insert: Omit<SubclassFeature, 'id'>; Update: Partial<Omit<SubclassFeature, 'id'>>; Relationships: R }
      spells: { Row: Spell; Insert: Omit<Spell, 'id'>; Update: Partial<Omit<Spell, 'id'>>; Relationships: R }
      feats: { Row: Feat; Insert: Omit<Feat, 'id'>; Update: Partial<Omit<Feat, 'id'>>; Relationships: R }
      backgrounds: { Row: Background; Insert: Omit<Background, 'id'>; Update: Partial<Omit<Background, 'id'>>; Relationships: R }
      characters: { Row: Character; Insert: { user_id: string; campaign_id: string; name: string; character_type?: CharacterType; stat_method?: StatMethod; status?: CharacterStatus; species_id?: string | null; background_id?: string | null; alignment?: Alignment | null; experience_points?: number; base_str?: number; base_dex?: number; base_con?: number; base_int?: number; base_wis?: number; base_cha?: number; hp_max?: number; dm_notes?: string | null }; Update: Partial<Omit<Character, 'id' | 'created_at'>>; Relationships: R }
      character_levels: { Row: CharacterLevel; Insert: Omit<CharacterLevel, 'id' | 'taken_at'>; Update: Partial<Omit<CharacterLevel, 'id'>>; Relationships: R }
      character_stat_rolls: { Row: CharacterStatRoll; Insert: Omit<CharacterStatRoll, 'id' | 'rolled_at'>; Update: Partial<Omit<CharacterStatRoll, 'id'>>; Relationships: R }
      character_snapshots: { Row: CharacterSnapshot; Insert: Omit<CharacterSnapshot, 'id' | 'created_at'>; Update: Partial<Omit<CharacterSnapshot, 'id'>>; Relationships: R }
      character_choices: { Row: CharacterChoice; Insert: Omit<CharacterChoice, 'id'>; Update: Partial<Omit<CharacterChoice, 'id'>>; Relationships: R }
    }
    Views: Record<string, never>
    Functions: {
      is_dm: { Args: Record<string, never>; Returns: boolean }
      is_campaign_member: { Args: { p_campaign_id: string }; Returns: boolean }
    }
    Enums: {
      user_role: UserRole
      character_status: CharacterStatus
      stat_method: StatMethod
      alignment: Alignment
      size_category: SizeCategory
      spellcasting_type: SpellcastingType
      choice_type: ChoiceType
      check_severity: CheckSeverity
      character_type: CharacterType
    }
  }
}
