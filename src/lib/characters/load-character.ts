import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Background,
  CharacterAbilityBonusChoice,
  CharacterAsiChoice,
  Character,
  CharacterClassLevel,
  CharacterFeatChoice,
  CharacterEquipmentItem,
  CharacterFeatureOptionChoice,
  CharacterLanguageChoice,
  CharacterLevel,
  CharacterSkillProficiency,
  CharacterSpellSelection,
  CharacterStatRoll,
  CharacterToolChoice,
  Database,
  Species,
  Spell,
} from '@/lib/types/database'
import { buildLegalityInput } from '@/lib/legality/build-input'
import { runLegalityChecks, type LegalityResult } from '@/lib/legality/engine'
import { buildAsiSelectionsFromRows, type AsiSelection } from '@/lib/characters/asi-provenance'
import { aggregateCharacterLevels, sortCharacterClassLevels } from '@/lib/characters/class-levels'
import type { SpellOption } from '@/lib/characters/wizard-helpers'
import { buildLanguageNameByKeyMap } from '@/lib/content/language-content'
import { buildToolNameByKeyMap } from '@/lib/content/tool-content'

export interface CharacterWithRelations extends Character {
  species: Species | null
  background: Background | null
  character_levels: CharacterLevel[]
  character_class_levels: CharacterClassLevel[]
}

export interface LoadedCharacterState {
  character: CharacterWithRelations
  initialSkillProficiencies: string[]
  initialTypedSkillProficiencies: CharacterSkillProficiency[]
  initialAbilityBonusChoices: Array<'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'>
  initialTypedAbilityBonusChoices: CharacterAbilityBonusChoice[]
  initialAsiChoices: AsiSelection[]
  initialTypedAsiChoices: CharacterAsiChoice[]
  initialLanguageChoices: string[]
  initialTypedLanguageChoices: CharacterLanguageChoice[]
  initialToolChoices: string[]
  initialTypedToolChoices: CharacterToolChoice[]
  initialSpellChoices: string[]
  initialSpellSelections: CharacterSpellSelection[]
  initialSelectedSpells: SpellOption[]
  initialFeatChoices: string[]
  initialTypedFeatChoices: CharacterFeatChoice[]
  initialFeatureOptionChoices: CharacterFeatureOptionChoice[]
  initialEquipmentItems: CharacterEquipmentItem[]
  initialStatRolls: CharacterStatRoll[]
  legality: LegalityResult | null
}

export interface CharacterLoadWarning {
  scope: string
  message: string
}

export interface CharacterLoadFailure {
  message: string
  issues: Array<{
    scope: string
    message: string
  }>
}

export type LoadCharacterStateResult =
  | { status: 'success'; state: LoadedCharacterState; warnings: CharacterLoadWarning[] }
  | { status: 'not_found' }
  | { status: 'error'; error: CharacterLoadFailure }

type LoadCharacterDeps = {
  buildLegalityInputImpl?: typeof buildLegalityInput
}

export async function loadCharacterState(
  supabase: SupabaseClient<Database>,
  characterId: string,
  deps: LoadCharacterDeps = {}
): Promise<LoadCharacterStateResult> {
  const { buildLegalityInputImpl = buildLegalityInput } = deps

  const { data: character, error: characterError } = await supabase
    .from('characters')
    .select('*')
    .eq('id', characterId)
    .single()

  if (characterError || !character) {
    return {
      status: 'not_found',
    }
  }

  const [speciesResult, backgroundResult, classLevelsResult, skillsResult, abilityBonusChoicesResult, asiChoicesResult, languageChoicesResult, toolChoicesResult, featureOptionChoicesResult, equipmentItemsResult, typedSpellSelectionsResult, typedFeatChoicesResult, statRollsResult] = await Promise.all([
    character.species_id
      ? supabase.from('species').select('*').eq('id', character.species_id).single()
      : Promise.resolve({ data: null, error: null }),
    character.background_id
      ? supabase.from('backgrounds').select('*').eq('id', character.background_id).single()
      : Promise.resolve({ data: null, error: null }),
    supabase.from('character_class_levels').select('*').eq('character_id', character.id),
    supabase.from('character_skill_proficiencies').select('*').eq('character_id', character.id),
    supabase.from('character_ability_bonus_choices').select('*').eq('character_id', character.id),
    supabase.from('character_asi_choices').select('*').eq('character_id', character.id),
    supabase.from('character_language_choices').select('*').eq('character_id', character.id),
    supabase.from('character_tool_choices').select('*').eq('character_id', character.id),
    supabase.from('character_feature_option_choices').select('*').eq('character_id', character.id),
    supabase.from('character_equipment_items').select('*').eq('character_id', character.id),
    supabase.from('character_spell_selections').select('*').eq('character_id', character.id),
    supabase.from('character_feat_choices').select('*').eq('character_id', character.id),
    supabase.from('character_stat_rolls').select('*').eq('character_id', character.id),
  ])

  const issues = [
    speciesResult,
    backgroundResult,
    classLevelsResult,
    skillsResult,
    abilityBonusChoicesResult,
    asiChoicesResult,
    languageChoicesResult,
    toolChoicesResult,
    featureOptionChoicesResult,
    equipmentItemsResult,
    typedSpellSelectionsResult,
    typedFeatChoicesResult,
    statRollsResult,
  ]
    .flatMap((result, index) => result.error ? [{
      scope: [
        'species',
        'background',
        'levels',
        'skills',
        'ability_bonus_choices',
        'asi_choices',
        'language_choices',
        'tool_choices',
        'feature_option_choices',
        'equipment_items',
        'spell_selections',
        'feat_choices',
        'stat_rolls',
      ][index] ?? 'unknown',
      message: result.error.message,
    }] : [])

  if (issues.length > 0) {
    return {
      status: 'error',
      error: {
        message: 'Failed to load character relations',
        issues,
      },
    }
  }

  const warnings: CharacterLoadWarning[] = []
  const sortedClassLevels = sortCharacterClassLevels((classLevelsResult.data ?? []) as CharacterClassLevel[])
  const aggregateLevels = aggregateCharacterLevels(sortedClassLevels)

  if (character.species_id && !speciesResult.data) {
    warnings.push({
      scope: 'species',
      message: `Character references missing species ${character.species_id}`,
    })
  }
  if (character.background_id && !backgroundResult.data) {
    warnings.push({
      scope: 'background',
      message: `Character references missing background ${character.background_id}`,
    })
  }

  const typedSpellSelections = (typedSpellSelectionsResult.data ?? []) as CharacterSpellSelection[]
  const selectedSpellIds = Array.from(
    new Set(
      typedSpellSelections
        .map((row) => row.spell_id)
        .filter((value): value is string => Boolean(value))
    )
  )
  const selectedSpellResult = selectedSpellIds.length > 0
    ? await supabase.from('spells').select('*').in('id', selectedSpellIds)
    : { data: [] as Spell[], error: null }

  if (selectedSpellResult.error) {
    return {
      status: 'error',
      error: {
        message: 'Failed to load selected spell rows',
        issues: [{
          scope: 'selected_spells',
          message: selectedSpellResult.error.message,
        }],
      },
    }
  }

  const typedSpellChoices = ((typedSpellSelectionsResult.data ?? []) as CharacterSpellSelection[])
    .map((row) => row.spell_id)
    .filter((value): value is string => Boolean(value))
  const typedFeatChoices = ((typedFeatChoicesResult.data ?? []) as CharacterFeatChoice[])
    .map((row) => row.feat_id)
    .filter((value): value is string => Boolean(value))
  const rawLanguageChoiceRows = (languageChoicesResult.data ?? []) as CharacterLanguageChoice[]
  const rawToolChoiceRows = (toolChoicesResult.data ?? []) as CharacterToolChoice[]
  const languageKeys = Array.from(new Set(rawLanguageChoiceRows.map((row) => row.language_key).filter((value): value is string => Boolean(value))))
  const toolKeys = Array.from(new Set(rawToolChoiceRows.map((row) => row.tool_key).filter((value): value is string => Boolean(value))))
  const languageCatalogResult = languageKeys.length > 0
    ? await supabase.from('languages').select('key, name').in('key', languageKeys)
    : { data: [] as Array<{ key: string; name: string }>, error: null }
  const toolCatalogResult = toolKeys.length > 0
    ? await supabase.from('tools').select('key, name').in('key', toolKeys)
    : { data: [] as Array<{ key: string; name: string }>, error: null }

  if (languageCatalogResult.error || toolCatalogResult.error) {
    return {
      status: 'error',
      error: {
        message: 'Failed to load language/tool catalog rows',
        issues: [
          languageCatalogResult.error ? { scope: 'languages', message: languageCatalogResult.error.message } : null,
          toolCatalogResult.error ? { scope: 'tools', message: toolCatalogResult.error.message } : null,
        ].filter((issue): issue is { scope: string; message: string } => Boolean(issue)),
      },
    }
  }

  const languageNameByKey = buildLanguageNameByKeyMap(languageCatalogResult.data ?? [])
  const toolNameByKey = buildToolNameByKeyMap(toolCatalogResult.data ?? [])
  const typedLanguageChoiceRows = rawLanguageChoiceRows.map((row) => ({
    ...row,
    language: row.language_key ? languageNameByKey.get(row.language_key) ?? row.language : row.language,
  }))
  const typedToolChoiceRows = rawToolChoiceRows.map((row) => ({
    ...row,
    tool: row.tool_key ? toolNameByKey.get(row.tool_key) ?? row.tool : row.tool,
  }))
  const typedLanguageChoices = typedLanguageChoiceRows
    .map((row) => row.language)
    .filter((value): value is string => Boolean(value))
  const typedToolChoices = typedToolChoiceRows
    .map((row) => row.tool)
    .filter((value): value is string => Boolean(value))
  const typedAbilityBonusChoices = ((abilityBonusChoicesResult.data ?? []) as CharacterAbilityBonusChoice[])
    .map((row) => row.ability)
    .filter((value): value is 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha' => Boolean(value))
  const typedAsiChoices = buildAsiSelectionsFromRows((asiChoicesResult.data ?? []) as CharacterAsiChoice[])
  const typedFeatureOptionChoices = (featureOptionChoicesResult.data ?? []) as CharacterFeatureOptionChoice[]
  const typedEquipmentItems = (equipmentItemsResult.data ?? []) as CharacterEquipmentItem[]
  const selectedSpellRowsById = new Map(
    typedSpellSelections.map((row) => [row.spell_id, row])
  )
  const initialSelectedSpells = ((selectedSpellResult.data ?? []) as Spell[]).map((spell) => {
    const selection = selectedSpellRowsById.get(spell.id)
    return {
      ...spell,
      granted_by_subclasses: selection?.granting_subclass_id ? [selection.granting_subclass_id] : [],
      counts_against_selection_limit: selection?.counts_against_selection_limit ?? true,
      source_feature_key: selection?.source_feature_key ?? null,
    } satisfies SpellOption
  })

  if (selectedSpellIds.length !== initialSelectedSpells.length) {
    warnings.push({
      scope: 'selected_spells',
      message: `Character references ${selectedSpellIds.length - initialSelectedSpells.length} missing spell row(s)`,
    })
  }

  let legalityInput = null
  try {
    legalityInput = await buildLegalityInputImpl(supabase, character.id)
  } catch (error) {
    return {
      status: 'error',
      error: {
        message: 'Failed to build legality input for loaded character',
        issues: [{
          scope: 'legality_input',
          message: error instanceof Error ? error.message : 'Unknown legality input error',
        }],
      },
    }
  }

  let legality: LegalityResult | null = null
  try {
    legality = legalityInput ? runLegalityChecks(legalityInput) : null
  } catch (error) {
    return {
      status: 'error',
      error: {
        message: 'Failed to derive legality for loaded character',
        issues: [{
          scope: 'legality',
          message: error instanceof Error ? error.message : 'Unknown legality error',
        }],
      },
    }
  }

  const state: LoadedCharacterState = {
    character: {
      ...character,
      species: speciesResult.data ?? null,
      background: backgroundResult.data ?? null,
      character_levels: aggregateLevels,
      character_class_levels: sortedClassLevels,
    },
    initialSkillProficiencies: (skillsResult.data ?? []).map((row) => row.skill),
    initialTypedSkillProficiencies: (skillsResult.data ?? []) as CharacterSkillProficiency[],
    initialAbilityBonusChoices: typedAbilityBonusChoices,
    initialTypedAbilityBonusChoices: (abilityBonusChoicesResult.data ?? []) as CharacterAbilityBonusChoice[],
    initialAsiChoices: typedAsiChoices,
    initialTypedAsiChoices: (asiChoicesResult.data ?? []) as CharacterAsiChoice[],
    initialLanguageChoices: typedLanguageChoices,
    initialTypedLanguageChoices: typedLanguageChoiceRows,
    initialToolChoices: typedToolChoices,
    initialTypedToolChoices: typedToolChoiceRows,
    initialSpellChoices: typedSpellChoices,
    initialSpellSelections: typedSpellSelections,
    initialSelectedSpells,
    initialFeatChoices: typedFeatChoices,
    initialTypedFeatChoices: (typedFeatChoicesResult.data ?? []) as CharacterFeatChoice[],
    initialFeatureOptionChoices: typedFeatureOptionChoices,
    initialEquipmentItems: typedEquipmentItems,
    initialStatRolls: (statRollsResult.data ?? []) as CharacterStatRoll[],
    legality,
  }

  return {
    status: 'success',
    state,
    warnings,
  }
}
