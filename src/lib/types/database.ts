// ============================================================
// Database types — hand-written to match 001_initial_schema.sql
// ============================================================

export type UserRole = 'player' | 'dm' | 'admin'
export type RuleSet = '2014' | '2024'
export type CharacterStatus = 'draft' | 'submitted' | 'approved' | 'changes_requested'
export type StatMethod = 'point_buy' | 'standard_array' | 'rolled'
export type Alignment = 'LG' | 'NG' | 'CG' | 'LN' | 'N' | 'CN' | 'LE' | 'NE' | 'CE'
export type SizeCategory = 'tiny' | 'small' | 'medium' | 'large'
export type SpeciesVariantType = 'base' | 'subrace' | 'variant'
export type SpellcastingType = 'full' | 'half' | 'third' | 'pact' | 'none'
export type ChoiceType = 'asi' | 'feat' | 'spell_known' | 'skill' | 'fighting_style' | 'other'
export type CheckSeverity = 'error' | 'warning'
export type CharacterType = 'pc' | 'npc' | 'test'
export type SpellcastingMode = 'prepared' | 'known' | 'spellbook' | 'none'

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

export type SpellcastingPreparedFormula =
  | 'class_level'
  | 'half_level_down'
  | 'half_level_up'
  | 'third_level_down'
  | 'third_level_up'
  | 'fixed'

export type SpellcastingProgression = {
  mode: SpellcastingMode
  spellcasting_ability?: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
  cantrips_known_by_level?: number[]
  spells_known_by_level?: number[]
  prepared_formula?: SpellcastingPreparedFormula
  prepared_fixed?: number
  prepared_add_ability_mod?: boolean
  prepared_min?: number
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
  email: string
  display_name: string
  role: UserRole
  created_at: string
}

export type Campaign = {
  id: string
  name: string
  dm_id: string
  settings: CampaignSettings
  rule_set: RuleSet
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

export type Source = {
  key: string
  full_name: string
  is_srd: boolean
  rule_set: RuleSet
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
  parent_species_id?: string | null
  lineage_key?: string
  variant_type?: SpeciesVariantType
  variant_order?: number
  size: SizeCategory
  speed: number
  ability_score_bonuses: AbilityScoreBonus[]
  languages: string[]
  traits: string[]
  senses: Sense[]
  damage_resistances: string[]
  condition_immunities: string[]
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
  starting_equipment_package_id?: string | null
  spellcasting_type: SpellcastingType | null
  spellcasting_progression: SpellcastingProgression | null
  subclass_choice_level: number
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

export type SubclassBonusSpell = {
  id: string
  subclass_id: string
  spell_id: string
  required_class_level: number
  counts_against_selection_limit: boolean
}

export type SpeciesBonusSpell = {
  id: string
  species_id: string
  spell_id: string
  minimum_character_level: number
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
  skill_choice_count: number
  skill_choice_from: string[]
  tool_proficiencies: string[]
  languages: string[]
  starting_equipment: StartingEquipmentItem[]
  starting_equipment_package_id?: string | null
  feature: string
  background_feat_id: string | null
  source: string
  amended: boolean
  amendment_note: string | null
}

export type Language = {
  key: string
  name: string
  sort_order: number
  source: string
  amended: boolean
  amendment_note: string | null
}

export type Tool = {
  key: string
  name: string
  sort_order: number
  source: string
  amended: boolean
  amendment_note: string | null
}

export type EquipmentItem = {
  id: string
  key: string
  name: string
  item_category: string
  cost_quantity: number
  cost_unit: string
  weight_lb: number | null
  source: string
  amended: boolean
  amendment_note: string | null
}

export type Weapon = {
  item_id: string
  weapon_category: string
  weapon_kind: string
  damage_dice: string
  damage_type: string
  properties: string[]
  normal_range: number | null
  long_range: number | null
  versatile_damage: string | null
}

export type Armor = {
  item_id: string
  armor_category: string
  base_ac: number
  dex_bonus_cap: number | null
  minimum_strength: number | null
  stealth_disadvantage: boolean
}

export type Shield = {
  item_id: string
  armor_class_bonus: number
}

export type StartingEquipmentPackage = {
  id: string
  key: string
  name: string
  description: string
  source: string
  amended: boolean
  amendment_note: string | null
}

export type StartingEquipmentPackageItem = {
  id: string
  package_id: string
  item_id: string
  quantity: number
  item_order: number
  choice_group: string
  notes: string | null
}

export type FeatureOptionGroup = {
  key: string
  name: string
  option_family: string
  description: string
  selection_limit: number
  allows_duplicate_selections: boolean
  metadata: Record<string, unknown>
  source: string
  amended: boolean
  amendment_note: string | null
}

export type FeatureOption = {
  id: string
  group_key: string
  key: string
  name: string
  description: string
  option_order: number
  prerequisites: Record<string, unknown>
  effects: Record<string, unknown>
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

export type CharacterHpRoll = {
  id: string
  character_id: string
  class_id: string
  level_number: number
  roll: number
  created_at: string
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
  character_level_id: string | null
  choice_type: ChoiceType
  choice_value: Record<string, unknown>
}

export type CharacterSkillProficiency = {
  character_id: string
  skill: string
  expertise: boolean
  character_level_id: string | null
  source_category: string
  source_entity_id: string | null
  source_feature_key: string | null
}

export type CharacterSpellSelection = {
  id: string
  character_id: string
  character_level_id: string | null
  spell_id: string
  owning_class_id: string | null
  granting_subclass_id: string | null
  acquisition_mode: string
  counts_against_selection_limit: boolean
  source_feature_key: string | null
  created_at: string
}

export type CharacterFeatChoice = {
  id: string
  character_id: string
  character_level_id: string | null
  feat_id: string
  choice_kind: string
  source_feature_key: string | null
  created_at: string
}

export type CharacterLanguageChoice = {
  character_id: string
  language: string
  language_key: string | null
  character_level_id: string | null
  source_category: string
  source_entity_id: string | null
  source_feature_key: string | null
  created_at: string
}

export type CharacterToolChoice = {
  character_id: string
  tool: string
  tool_key: string | null
  character_level_id: string | null
  source_category: string
  source_entity_id: string | null
  source_feature_key: string | null
  created_at: string
}

export type CharacterAbilityBonusChoice = {
  id: string
  character_id: string
  character_level_id: string | null
  ability: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
  bonus: number
  source_category: string
  source_entity_id: string | null
  source_feature_key: string | null
  created_at: string
}

export type CharacterAsiChoice = {
  id: string
  character_id: string
  character_level_id: string | null
  slot_index: number
  ability: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
  bonus: number
  source_feature_key: string | null
  created_at: string
}

export type CharacterFeatureOptionChoice = {
  id: string
  character_id: string
  character_level_id: string | null
  option_group_key: string
  option_key: string
  selected_value: Record<string, unknown>
  choice_order: number
  source_category: string
  source_entity_id: string | null
  source_feature_key: string | null
  created_at: string
}

export type CharacterEquipmentItem = {
  id: string
  character_id: string
  item_id: string
  quantity: number
  equipped: boolean
  source_package_item_id: string | null
  source_category: string
  source_entity_id: string | null
  notes: string | null
  created_at: string
}

export type AuditLog = {
  id: string
  actor_user_id: string | null
  action: string
  target_table: string
  target_id: string
  details: Record<string, unknown>
  succeeded: boolean
  created_at: string
}

// ── Supabase Database shape (for createClient generics) ────
// Every table requires Relationships: [] as of @supabase/supabase-js v2.101+

type R = []  // shorthand for empty Relationships array type

export type Database = {
  public: {
    Tables: {
      users: { Row: User; Insert: Omit<User, 'created_at'>; Update: Partial<Omit<User, 'id'>>; Relationships: R }
      campaigns: { Row: Campaign; Insert: Omit<Campaign, 'id' | 'created_at'> & { rule_set?: RuleSet }; Update: Partial<Omit<Campaign, 'id'>>; Relationships: R }
      campaign_members: { Row: CampaignMember; Insert: Omit<CampaignMember, 'joined_at'>; Update: Partial<CampaignMember>; Relationships: R }
      campaign_source_allowlist: { Row: CampaignSourceAllowlist; Insert: CampaignSourceAllowlist; Update: Partial<CampaignSourceAllowlist>; Relationships: R }
      sources: { Row: Source; Insert: Omit<Source, 'rule_set'> & { rule_set?: RuleSet }; Update: Partial<Source>; Relationships: R }
      species_traits: { Row: SpeciesTrait; Insert: Omit<SpeciesTrait, 'id'>; Update: Partial<Omit<SpeciesTrait, 'id'>>; Relationships: R }
      species: { Row: Species; Insert: Omit<Species, 'id'>; Update: Partial<Omit<Species, 'id'>>; Relationships: R }
      class_features: { Row: ClassFeature; Insert: Omit<ClassFeature, 'id'>; Update: Partial<Omit<ClassFeature, 'id'>>; Relationships: R }
      classes: { Row: Class; Insert: Omit<Class, 'id'>; Update: Partial<Omit<Class, 'id'>>; Relationships: R }
      class_feature_progression: { Row: ClassFeatureProgression; Insert: Omit<ClassFeatureProgression, 'id'>; Update: Partial<Omit<ClassFeatureProgression, 'id'>>; Relationships: R }
      spell_slot_tables: { Row: SpellSlotTable; Insert: Omit<SpellSlotTable, 'id'>; Update: Partial<Omit<SpellSlotTable, 'id'>>; Relationships: R }
      multiclass_spell_slot_table: { Row: MulticlassSpellSlotTable; Insert: MulticlassSpellSlotTable; Update: Partial<MulticlassSpellSlotTable>; Relationships: R }
      subclasses: { Row: Subclass; Insert: Omit<Subclass, 'id'>; Update: Partial<Omit<Subclass, 'id'>>; Relationships: R }
      subclass_features: { Row: SubclassFeature; Insert: Omit<SubclassFeature, 'id'>; Update: Partial<Omit<SubclassFeature, 'id'>>; Relationships: R }
      subclass_bonus_spells: { Row: SubclassBonusSpell; Insert: Omit<SubclassBonusSpell, 'id'>; Update: Partial<Omit<SubclassBonusSpell, 'id'>>; Relationships: R }
      species_bonus_spells: { Row: SpeciesBonusSpell; Insert: Omit<SpeciesBonusSpell, 'id'>; Update: Partial<Omit<SpeciesBonusSpell, 'id'>>; Relationships: R }
      spells: { Row: Spell; Insert: Omit<Spell, 'id'>; Update: Partial<Omit<Spell, 'id'>>; Relationships: R }
      feats: { Row: Feat; Insert: Omit<Feat, 'id'>; Update: Partial<Omit<Feat, 'id'>>; Relationships: R }
      backgrounds: { Row: Background; Insert: Omit<Background, 'id'>; Update: Partial<Omit<Background, 'id'>>; Relationships: R }
      languages: { Row: Language; Insert: Omit<Language, 'amended' | 'amendment_note'> & { amended?: boolean; amendment_note?: string | null }; Update: Partial<Omit<Language, 'key'>>; Relationships: R }
      tools: { Row: Tool; Insert: Omit<Tool, 'amended' | 'amendment_note'> & { amended?: boolean; amendment_note?: string | null }; Update: Partial<Omit<Tool, 'key'>>; Relationships: R }
      equipment_items: { Row: EquipmentItem; Insert: Omit<EquipmentItem, 'id' | 'amended' | 'amendment_note'> & { amended?: boolean; amendment_note?: string | null }; Update: Partial<Omit<EquipmentItem, 'id'>>; Relationships: R }
      weapons: { Row: Weapon; Insert: Weapon; Update: Partial<Weapon>; Relationships: R }
      armor: { Row: Armor; Insert: Armor; Update: Partial<Armor>; Relationships: R }
      shields: { Row: Shield; Insert: Shield; Update: Partial<Shield>; Relationships: R }
      starting_equipment_packages: { Row: StartingEquipmentPackage; Insert: Omit<StartingEquipmentPackage, 'id' | 'amended' | 'amendment_note'> & { amended?: boolean; amendment_note?: string | null }; Update: Partial<Omit<StartingEquipmentPackage, 'id'>>; Relationships: R }
      starting_equipment_package_items: { Row: StartingEquipmentPackageItem; Insert: Omit<StartingEquipmentPackageItem, 'id'>; Update: Partial<Omit<StartingEquipmentPackageItem, 'id'>>; Relationships: R }
      feature_option_groups: { Row: FeatureOptionGroup; Insert: Omit<FeatureOptionGroup, 'amended' | 'amendment_note'> & { amended?: boolean; amendment_note?: string | null }; Update: Partial<Omit<FeatureOptionGroup, 'key'>>; Relationships: R }
      feature_options: { Row: FeatureOption; Insert: Omit<FeatureOption, 'id' | 'amended' | 'amendment_note'> & { amended?: boolean; amendment_note?: string | null }; Update: Partial<Omit<FeatureOption, 'id'>>; Relationships: R }
      characters: { Row: Character; Insert: { user_id: string; campaign_id: string; name: string; character_type?: CharacterType; stat_method?: StatMethod; status?: CharacterStatus; species_id?: string | null; background_id?: string | null; alignment?: Alignment | null; experience_points?: number; base_str?: number; base_dex?: number; base_con?: number; base_int?: number; base_wis?: number; base_cha?: number; hp_max?: number; dm_notes?: string | null }; Update: Partial<Omit<Character, 'id' | 'created_at'>>; Relationships: R }
      character_levels: { Row: CharacterLevel; Insert: Omit<CharacterLevel, 'id' | 'taken_at'>; Update: Partial<Omit<CharacterLevel, 'id'>>; Relationships: R }
      character_hp_rolls: { Row: CharacterHpRoll; Insert: Omit<CharacterHpRoll, 'id' | 'created_at'>; Update: Partial<Omit<CharacterHpRoll, 'id' | 'created_at'>>; Relationships: R }
      character_stat_rolls: { Row: CharacterStatRoll; Insert: Omit<CharacterStatRoll, 'id' | 'rolled_at'>; Update: Partial<Omit<CharacterStatRoll, 'id'>>; Relationships: R }
      character_snapshots: { Row: CharacterSnapshot; Insert: Omit<CharacterSnapshot, 'id' | 'created_at'>; Update: Partial<Omit<CharacterSnapshot, 'id'>>; Relationships: R }
      character_choices: { Row: CharacterChoice; Insert: Omit<CharacterChoice, 'id'>; Update: Partial<Omit<CharacterChoice, 'id'>>; Relationships: R }
      character_spell_selections: { Row: CharacterSpellSelection; Insert: Omit<CharacterSpellSelection, 'id' | 'created_at'>; Update: Partial<Omit<CharacterSpellSelection, 'id' | 'created_at'>>; Relationships: R }
      character_feat_choices: { Row: CharacterFeatChoice; Insert: Omit<CharacterFeatChoice, 'id' | 'created_at'>; Update: Partial<Omit<CharacterFeatChoice, 'id' | 'created_at'>>; Relationships: R }
      character_language_choices: { Row: CharacterLanguageChoice; Insert: Omit<CharacterLanguageChoice, 'created_at'>; Update: Partial<Omit<CharacterLanguageChoice, 'created_at'>>; Relationships: R }
      character_tool_choices: { Row: CharacterToolChoice; Insert: Omit<CharacterToolChoice, 'created_at'>; Update: Partial<Omit<CharacterToolChoice, 'created_at'>>; Relationships: R }
      character_ability_bonus_choices: { Row: CharacterAbilityBonusChoice; Insert: Omit<CharacterAbilityBonusChoice, 'id' | 'created_at'>; Update: Partial<Omit<CharacterAbilityBonusChoice, 'id' | 'created_at'>>; Relationships: R }
      character_asi_choices: { Row: CharacterAsiChoice; Insert: Omit<CharacterAsiChoice, 'id' | 'created_at'>; Update: Partial<Omit<CharacterAsiChoice, 'id' | 'created_at'>>; Relationships: R }
      character_feature_option_choices: { Row: CharacterFeatureOptionChoice; Insert: Omit<CharacterFeatureOptionChoice, 'id' | 'created_at'>; Update: Partial<Omit<CharacterFeatureOptionChoice, 'id' | 'created_at'>>; Relationships: R }
      character_equipment_items: { Row: CharacterEquipmentItem; Insert: Omit<CharacterEquipmentItem, 'id' | 'created_at'>; Update: Partial<Omit<CharacterEquipmentItem, 'id' | 'created_at'>>; Relationships: R }
      character_skill_proficiencies: { Row: CharacterSkillProficiency; Insert: CharacterSkillProficiency; Update: Partial<CharacterSkillProficiency>; Relationships: R }
      audit_logs: { Row: AuditLog; Insert: Omit<AuditLog, 'id' | 'created_at'> & { details?: Record<string, unknown>; succeeded?: boolean }; Update: Partial<Omit<AuditLog, 'id' | 'created_at'>>; Relationships: R }
    }
    Views: Record<string, never>
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean }
      is_dm: { Args: Record<string, never>; Returns: boolean }
      is_campaign_member: { Args: { p_campaign_id: string }; Returns: boolean }
      can_manage_campaign: { Args: { p_campaign_id: string }; Returns: boolean }
      save_character_atomic: {
        Args: { p_character_id: string; p_payload?: Record<string, unknown> }
        Returns: Character
      }
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
