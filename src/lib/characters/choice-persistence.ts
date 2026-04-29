import type { Database } from '@/lib/types/database'
import { buildLanguageKeyByNameMap, buildLanguageNameByKeyMap, normalizeLanguageName } from '@/lib/content/language-content'
import { buildToolKeyByNameMap, buildToolNameByKeyMap, normalizeToolName } from '@/lib/content/tool-content'
import type { SupabaseClient } from '@supabase/supabase-js'

export type SpellChoiceInput =
  | string
  | {
      spell_id: string
      character_level_id?: string | null
      owning_class_id?: string | null
      granting_subclass_id?: string | null
      acquisition_mode?: string
      counts_against_selection_limit?: boolean
      source_feature_key?: string | null
    }

export type FeatChoiceInput =
  | string
  | {
      feat_id: string
      character_level_id?: string | null
      choice_kind?: string
      source_feature_key?: string | null
    }

export type SkillProficiencyInput =
  | string
  | {
      skill: string
      expertise?: boolean
      character_level_id?: string | null
      source_category?: string
      source_entity_id?: string | null
      source_feature_key?: string | null
    }

export type LanguageChoiceInput =
  | string
  | {
      language: string
      language_key?: string | null
      character_level_id?: string | null
      source_category?: string
      source_entity_id?: string | null
      source_feature_key?: string | null
    }

export type ToolChoiceInput =
  | string
  | {
      tool: string
      tool_key?: string | null
      character_level_id?: string | null
      source_category?: string
      source_entity_id?: string | null
      source_feature_key?: string | null
    }

export type AbilityBonusChoiceInput =
  | {
      ability: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
      bonus?: number
      character_level_id?: string | null
      source_category?: string
      source_entity_id?: string | null
      source_feature_key?: string | null
    }

export type AsiChoiceInput = {
  slot_index: number
  ability: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
  bonus?: number
  character_level_id?: string | null
  source_feature_key?: string | null
}

export type FeatureOptionChoiceInput = {
  option_group_key: string
  option_key: string
  selected_value?: Record<string, unknown>
  choice_order?: number
  character_level_id?: string | null
  source_category?: string
  source_entity_id?: string | null
  source_feature_key?: string | null
}

export type EquipmentItemChoiceInput = {
  item_id: string
  quantity?: number
  equipped?: boolean
  source_package_item_id?: string | null
  source_category?: string
  source_entity_id?: string | null
  notes?: string | null
}

function normalizeSpellChoice(choice: SpellChoiceInput) {
  if (typeof choice === 'string') {
    return {
      spell_id: choice,
      character_level_id: null,
      owning_class_id: null,
      granting_subclass_id: null,
      acquisition_mode: 'known',
      counts_against_selection_limit: true,
      source_feature_key: null,
    }
  }

  return {
    spell_id: choice.spell_id,
    character_level_id: choice.character_level_id ?? null,
    owning_class_id: choice.owning_class_id ?? null,
    granting_subclass_id: choice.granting_subclass_id ?? null,
    acquisition_mode: choice.acquisition_mode ?? 'known',
    counts_against_selection_limit: choice.counts_against_selection_limit ?? true,
    source_feature_key: choice.source_feature_key ?? null,
  }
}

function normalizeFeatChoice(choice: FeatChoiceInput) {
  if (typeof choice === 'string') {
    return {
      feat_id: choice,
      character_level_id: null,
      choice_kind: 'feat',
      source_feature_key: null,
    }
  }

  return {
    feat_id: choice.feat_id,
    character_level_id: choice.character_level_id ?? null,
    choice_kind: choice.choice_kind ?? 'feat',
    source_feature_key: choice.source_feature_key ?? null,
  }
}

function normalizeSkillProficiency(choice: SkillProficiencyInput) {
  if (typeof choice === 'string') {
    return {
      skill: choice,
      expertise: false,
      character_level_id: null,
      source_category: 'manual',
      source_entity_id: null,
      source_feature_key: null,
    }
  }

  return {
    skill: choice.skill,
    expertise: choice.expertise ?? false,
    character_level_id: choice.character_level_id ?? null,
    source_category: choice.source_category ?? 'manual',
    source_entity_id: choice.source_entity_id ?? null,
    source_feature_key: choice.source_feature_key ?? null,
  }
}

function normalizeLanguageChoice(choice: LanguageChoiceInput) {
  if (typeof choice === 'string') {
    return {
      language: choice,
      language_key: null,
      character_level_id: null,
      source_category: 'manual',
      source_entity_id: null,
      source_feature_key: null,
    }
  }

  return {
    language: choice.language,
    language_key: choice.language_key ?? null,
    character_level_id: choice.character_level_id ?? null,
    source_category: choice.source_category ?? 'manual',
    source_entity_id: choice.source_entity_id ?? null,
    source_feature_key: choice.source_feature_key ?? null,
  }
}

function normalizeToolChoice(choice: ToolChoiceInput) {
  if (typeof choice === 'string') {
    return {
      tool: choice,
      tool_key: null,
      character_level_id: null,
      source_category: 'manual',
      source_entity_id: null,
      source_feature_key: null,
    }
  }

  return {
    tool: choice.tool,
    tool_key: choice.tool_key ?? null,
    character_level_id: choice.character_level_id ?? null,
    source_category: choice.source_category ?? 'manual',
    source_entity_id: choice.source_entity_id ?? null,
    source_feature_key: choice.source_feature_key ?? null,
  }
}

function normalizeAbilityBonusChoice(choice: AbilityBonusChoiceInput) {
  return {
    ability: choice.ability,
    bonus: choice.bonus ?? 1,
    character_level_id: choice.character_level_id ?? null,
    source_category: choice.source_category ?? 'manual',
    source_entity_id: choice.source_entity_id ?? null,
    source_feature_key: choice.source_feature_key ?? null,
  }
}

function normalizeAsiChoice(choice: AsiChoiceInput) {
  return {
    slot_index: choice.slot_index,
    ability: choice.ability,
    bonus: choice.bonus ?? 1,
    character_level_id: choice.character_level_id ?? null,
    source_feature_key: choice.source_feature_key ?? null,
  }
}

function normalizeFeatureOptionChoice(choice: FeatureOptionChoiceInput) {
  return {
    option_group_key: choice.option_group_key,
    option_key: choice.option_key,
    selected_value: choice.selected_value ?? {},
    choice_order: choice.choice_order ?? 0,
    character_level_id: choice.character_level_id ?? null,
    source_category: choice.source_category ?? 'feature',
    source_entity_id: choice.source_entity_id ?? null,
    source_feature_key: choice.source_feature_key ?? null,
  }
}

function normalizeEquipmentItemChoice(choice: EquipmentItemChoiceInput) {
  return {
    item_id: choice.item_id,
    quantity: choice.quantity ?? 1,
    equipped: choice.equipped ?? false,
    source_package_item_id: choice.source_package_item_id ?? null,
    source_category: choice.source_category ?? 'manual',
    source_entity_id: choice.source_entity_id ?? null,
    notes: choice.notes ?? null,
  }
}

export async function replaceCharacterSpellSelections(
  supabase: SupabaseClient<Database>,
  characterId: string,
  spellChoices: SpellChoiceInput[]
) {
  const { error: deleteSpellSelectionsError } = await supabase
    .from('character_spell_selections')
    .delete()
    .eq('character_id', characterId)
  if (deleteSpellSelectionsError) return deleteSpellSelectionsError

  const { error: deleteLegacyChoicesError } = await supabase
    .from('character_choices')
    .delete()
    .eq('character_id', characterId)
    .eq('choice_type', 'spell_known')
  if (deleteLegacyChoicesError) return deleteLegacyChoicesError

  if (spellChoices.length === 0) return null

  const normalizedChoices = spellChoices.map(normalizeSpellChoice)

  const { error: typedError } = await supabase.from('character_spell_selections').insert(
    normalizedChoices.map((choice) => ({
      character_id: characterId,
      ...choice,
    }))
  )
  if (typedError) return typedError

  // Keep legacy rows readable for untouched characters, but once a character is
  // saved through the typed path we clear the old spell_known mirror so future
  // reads cannot fall back to stale state.
  return null
}

export async function replaceCharacterFeatChoices(
  supabase: SupabaseClient<Database>,
  characterId: string,
  featChoices: FeatChoiceInput[]
) {
  const { error: deleteFeatSelectionsError } = await supabase
    .from('character_feat_choices')
    .delete()
    .eq('character_id', characterId)
  if (deleteFeatSelectionsError) return deleteFeatSelectionsError

  const { error: deleteLegacyChoicesError } = await supabase
    .from('character_choices')
    .delete()
    .eq('character_id', characterId)
    .eq('choice_type', 'feat')
  if (deleteLegacyChoicesError) return deleteLegacyChoicesError

  const normalizedChoices = featChoices
    .filter((choice) => (typeof choice === 'string' ? choice.length > 0 : choice.feat_id.length > 0))
    .map(normalizeFeatChoice)

  if (normalizedChoices.length === 0) return null

  const { error: typedError } = await supabase.from('character_feat_choices').insert(
    normalizedChoices.map((choice) => ({
      character_id: characterId,
      ...choice,
    }))
  )
  if (typedError) return typedError

  // Same transition rule as spells: clear the legacy mirror when typed rows are
  // rewritten so empty typed selections do not resurrect old feat rows.
  return null
}

export async function replaceCharacterSkillProficiencies(
  supabase: SupabaseClient<Database>,
  characterId: string,
  skillChoices: SkillProficiencyInput[]
) {
  const { error: deleteSkillsError } = await supabase
    .from('character_skill_proficiencies')
    .delete()
    .eq('character_id', characterId)
  if (deleteSkillsError) return deleteSkillsError

  const normalizedChoices = skillChoices
    .filter((choice) => (typeof choice === 'string' ? choice.length > 0 : choice.skill.length > 0))
    .map(normalizeSkillProficiency)

  if (normalizedChoices.length === 0) return null

  const { error } = await supabase.from('character_skill_proficiencies').insert(
    normalizedChoices.map((choice) => ({
      character_id: characterId,
      ...choice,
    }))
  )
  return error
}

export async function replaceCharacterLanguageChoices(
  supabase: SupabaseClient<Database>,
  characterId: string,
  languageChoices: LanguageChoiceInput[]
) {
  const { error: deleteLanguageChoicesError } = await supabase
    .from('character_language_choices')
    .delete()
    .eq('character_id', characterId)
  if (deleteLanguageChoicesError) return deleteLanguageChoicesError

  const normalizedChoices = languageChoices
    .filter((choice) => (typeof choice === 'string' ? choice.trim().length > 0 : choice.language.trim().length > 0))
    .map(normalizeLanguageChoice)

  if (normalizedChoices.length === 0) return null

  const { data: languageRows, error: languageLookupError } = await supabase
    .from('languages')
    .select('key, name')
  if (languageLookupError) return languageLookupError

  const languageKeyByName = buildLanguageKeyByNameMap(languageRows ?? [])
  const languageNameByKey = buildLanguageNameByKeyMap(languageRows ?? [])

  const { error } = await supabase.from('character_language_choices').insert(
    normalizedChoices.map((choice) => {
      const languageKey = choice.language_key ?? languageKeyByName.get(normalizeLanguageName(choice.language)) ?? null
      return {
        character_id: characterId,
        ...choice,
        language: languageKey ? languageNameByKey.get(languageKey) ?? choice.language : choice.language,
        language_key: languageKey,
      }
    })
  )
  return error
}

export async function replaceCharacterToolChoices(
  supabase: SupabaseClient<Database>,
  characterId: string,
  toolChoices: ToolChoiceInput[]
) {
  const { error: deleteToolChoicesError } = await supabase
    .from('character_tool_choices')
    .delete()
    .eq('character_id', characterId)
  if (deleteToolChoicesError) return deleteToolChoicesError

  const normalizedChoices = toolChoices
    .filter((choice) => (typeof choice === 'string' ? choice.trim().length > 0 : choice.tool.trim().length > 0))
    .map(normalizeToolChoice)

  if (normalizedChoices.length === 0) return null

  const { data: toolRows, error: toolLookupError } = await supabase
    .from('tools')
    .select('key, name')
  if (toolLookupError) return toolLookupError

  const toolKeyByName = buildToolKeyByNameMap(toolRows ?? [])
  const toolNameByKey = buildToolNameByKeyMap(toolRows ?? [])

  const { error } = await supabase.from('character_tool_choices').insert(
    normalizedChoices.map((choice) => {
      const toolKey = choice.tool_key ?? toolKeyByName.get(normalizeToolName(choice.tool)) ?? null
      return {
        character_id: characterId,
        ...choice,
        tool: toolKey ? toolNameByKey.get(toolKey) ?? choice.tool : choice.tool,
        tool_key: toolKey,
      }
    })
  )
  return error
}

export async function replaceCharacterAbilityBonusChoices(
  supabase: SupabaseClient<Database>,
  characterId: string,
  bonusChoices: AbilityBonusChoiceInput[]
) {
  const { error: deleteBonusChoicesError } = await supabase
    .from('character_ability_bonus_choices')
    .delete()
    .eq('character_id', characterId)
  if (deleteBonusChoicesError) return deleteBonusChoicesError

  if (bonusChoices.length === 0) return null

  const normalizedChoices = bonusChoices.map(normalizeAbilityBonusChoice)

  const { error } = await supabase.from('character_ability_bonus_choices').insert(
    normalizedChoices.map((choice) => ({
      character_id: characterId,
      ...choice,
    }))
  )
  return error
}

export async function replaceCharacterAsiChoices(
  supabase: SupabaseClient<Database>,
  characterId: string,
  asiChoices: AsiChoiceInput[]
) {
  const { error: deleteAsiChoicesError } = await supabase
    .from('character_asi_choices')
    .delete()
    .eq('character_id', characterId)
  if (deleteAsiChoicesError) return deleteAsiChoicesError

  if (asiChoices.length === 0) return null

  const normalizedChoices = asiChoices.map(normalizeAsiChoice)

  const { error } = await supabase.from('character_asi_choices').insert(
    normalizedChoices.map((choice) => ({
      character_id: characterId,
      ...choice,
    }))
  )
  return error
}

export async function replaceCharacterFeatureOptionChoices(
  supabase: SupabaseClient<Database>,
  characterId: string,
  featureOptionChoices: FeatureOptionChoiceInput[]
) {
  const { error: deleteChoicesError } = await supabase
    .from('character_feature_option_choices')
    .delete()
    .eq('character_id', characterId)
  if (deleteChoicesError) return deleteChoicesError

  const normalizedChoices = featureOptionChoices
    .filter((choice) => choice.option_group_key.trim().length > 0 && choice.option_key.trim().length > 0)
    .map(normalizeFeatureOptionChoice)

  if (normalizedChoices.length === 0) return null

  const { error } = await supabase.from('character_feature_option_choices').insert(
    normalizedChoices.map((choice) => ({
      character_id: characterId,
      ...choice,
    }))
  )
  return error
}

export async function replaceCharacterEquipmentItems(
  supabase: SupabaseClient<Database>,
  characterId: string,
  equipmentItems: EquipmentItemChoiceInput[]
) {
  const { error: deleteEquipmentError } = await supabase
    .from('character_equipment_items')
    .delete()
    .eq('character_id', characterId)
  if (deleteEquipmentError) return deleteEquipmentError

  const normalizedItems = equipmentItems
    .filter((item) => item.item_id.trim().length > 0)
    .map(normalizeEquipmentItemChoice)

  if (normalizedItems.length === 0) return null

  const { error } = await supabase.from('character_equipment_items').insert(
    normalizedItems.map((item) => ({
      character_id: characterId,
      ...item,
    }))
  )
  return error
}
