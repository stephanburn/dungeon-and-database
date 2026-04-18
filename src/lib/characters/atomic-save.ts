import type { Database } from '@/lib/types/database'
import {
  buildLanguageKeyByNameMap,
  normalizeLanguageName,
} from '@/lib/content/language-content'
import {
  buildToolKeyByNameMap,
  normalizeToolName,
} from '@/lib/content/tool-content'
import type {
  AbilityBonusChoiceInput,
  AsiChoiceInput,
  EquipmentItemChoiceInput,
  FeatureOptionChoiceInput,
  FeatChoiceInput,
  LanguageChoiceInput,
  SkillProficiencyInput,
  SpellChoiceInput,
  ToolChoiceInput,
} from '@/lib/characters/choice-persistence'
import type { SupabaseClient } from '@supabase/supabase-js'

type CharacterAtomicPayload = Record<string, unknown>

type SaveLevelsInput = Array<{
  class_id: string
  level: number
  subclass_id?: string | null
  hp_roll?: number | null
}>

type SaveStatRollsInput = Array<{
  assigned_to: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
  roll_set: number[]
}>

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

function normalizeSkillChoice(choice: SkillProficiencyInput) {
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

async function prepareLanguageChoices(
  supabase: SupabaseClient<Database>,
  languageChoices: LanguageChoiceInput[]
) {
  const normalizedChoices = languageChoices
    .filter((choice) => (typeof choice === 'string' ? choice.trim().length > 0 : choice.language.trim().length > 0))
    .map((choice) => {
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
    })

  if (normalizedChoices.length === 0) return normalizedChoices

  const { data: languageRows, error } = await supabase
    .from('languages')
    .select('key, name')
  if (error) throw error

  const languageKeyByName = buildLanguageKeyByNameMap(languageRows ?? [])

  return normalizedChoices.map((choice) => ({
    ...choice,
    language_key:
      languageKeyByName.get(normalizeLanguageName(choice.language)) ??
      choice.language_key ??
      null,
  }))
}

async function prepareToolChoices(
  supabase: SupabaseClient<Database>,
  toolChoices: ToolChoiceInput[]
) {
  const normalizedChoices = toolChoices
    .filter((choice) => (typeof choice === 'string' ? choice.trim().length > 0 : choice.tool.trim().length > 0))
    .map((choice) => {
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
    })

  if (normalizedChoices.length === 0) return normalizedChoices

  const { data: toolRows, error } = await supabase
    .from('tools')
    .select('key, name')
  if (error) throw error

  const toolKeyByName = buildToolKeyByNameMap(toolRows ?? [])

  return normalizedChoices.map((choice) => ({
    ...choice,
    tool_key:
      toolKeyByName.get(normalizeToolName(choice.tool)) ??
      choice.tool_key ??
      null,
  }))
}

export async function buildCharacterAtomicSavePayload(
  supabase: SupabaseClient<Database>,
  input: {
    characterFields: Record<string, unknown>
    levels?: SaveLevelsInput
    stat_rolls?: SaveStatRollsInput
    skill_proficiencies?: SkillProficiencyInput[]
    ability_bonus_choices?: AbilityBonusChoiceInput[]
    asi_choices?: AsiChoiceInput[]
    feature_option_choices?: FeatureOptionChoiceInput[]
    equipment_items?: EquipmentItemChoiceInput[]
    language_choices?: LanguageChoiceInput[]
    tool_choices?: ToolChoiceInput[]
    spell_choices?: SpellChoiceInput[]
    feat_choices?: FeatChoiceInput[]
  }
) {
  const payload: CharacterAtomicPayload = { ...input.characterFields }

  if (input.levels !== undefined) {
    payload.levels = input.levels.map((level) => ({
      class_id: level.class_id,
      level: level.level,
      subclass_id: level.subclass_id ?? null,
      hp_roll: level.hp_roll ?? null,
    }))
  }

  if (input.stat_rolls !== undefined) {
    payload.stat_rolls = input.stat_rolls
  }

  if (input.skill_proficiencies !== undefined) {
    payload.skill_proficiencies = input.skill_proficiencies
      .filter((choice) => (typeof choice === 'string' ? choice.length > 0 : choice.skill.length > 0))
      .map(normalizeSkillChoice)
  }

  if (input.ability_bonus_choices !== undefined) {
    payload.ability_bonus_choices = input.ability_bonus_choices.map(normalizeAbilityBonusChoice)
  }

  if (input.asi_choices !== undefined) {
    payload.asi_choices = input.asi_choices.map(normalizeAsiChoice)
  }

  if (input.feature_option_choices !== undefined) {
    payload.feature_option_choices = input.feature_option_choices
      .filter((choice) => choice.option_group_key.trim().length > 0 && choice.option_key.trim().length > 0)
      .map(normalizeFeatureOptionChoice)
  }

  if (input.equipment_items !== undefined) {
    payload.equipment_items = input.equipment_items
      .filter((item) => item.item_id.trim().length > 0)
      .map(normalizeEquipmentItemChoice)
  }

  if (input.language_choices !== undefined) {
    payload.language_choices = await prepareLanguageChoices(supabase, input.language_choices)
  }

  if (input.tool_choices !== undefined) {
    payload.tool_choices = await prepareToolChoices(supabase, input.tool_choices)
  }

  if (input.spell_choices !== undefined) {
    payload.spell_choices = input.spell_choices.map(normalizeSpellChoice)
  }

  if (input.feat_choices !== undefined) {
    payload.feat_choices = input.feat_choices
      .filter((choice) => (typeof choice === 'string' ? choice.length > 0 : choice.feat_id.length > 0))
      .map(normalizeFeatChoice)
  }

  return payload
}

export async function saveCharacterAtomic(
  supabase: SupabaseClient<Database>,
  characterId: string,
  payload: CharacterAtomicPayload
) {
  return supabase.rpc('save_character_atomic', {
    p_character_id: characterId,
    p_payload: payload,
  })
}
