import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Background,
  CharacterAbilityBonusChoice,
  Character,
  CharacterFeatChoice,
  CharacterFeatureOptionChoice,
  CharacterLanguageChoice,
  CharacterLevel,
  CharacterSpellSelection,
  CharacterToolChoice,
  Database,
  Species,
} from '@/lib/types/database'
import { buildLegalityInput } from '@/lib/legality/build-input'
import { runLegalityChecks, type LegalityResult } from '@/lib/legality/engine'
import {
  extractFeatSpellChoiceMap,
  isFeatSpellSourceFeatureKey,
} from '@/lib/characters/feat-spell-options'

export interface CharacterWithRelations extends Character {
  species: Species | null
  background: Background | null
  character_levels: CharacterLevel[]
}

export interface LoadedCharacterState {
  character: CharacterWithRelations
  initialSkillProficiencies: string[]
  initialAbilityBonusChoices: Array<'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'>
  initialLanguageChoices: string[]
  initialToolChoices: string[]
  initialSpellChoices: string[]
  initialFeatSpellChoices: Record<string, string>
  initialFeatChoices: string[]
  initialFeatureOptionChoices: CharacterFeatureOptionChoice[]
  legality: LegalityResult | null
}

export async function loadCharacterState(
  supabase: SupabaseClient<Database>,
  characterId: string
): Promise<LoadedCharacterState | null> {
  const { data: character } = await supabase
    .from('characters')
    .select('*')
    .eq('id', characterId)
    .single()

  if (!character) return null

  const [speciesResult, backgroundResult, levelsResult, skillsResult, abilityBonusChoicesResult, languageChoicesResult, toolChoicesResult, typedSpellSelectionsResult, typedFeatChoicesResult, featureOptionChoicesResult, legalityInput] = await Promise.all([
    character.species_id
      ? supabase.from('species').select('*').eq('id', character.species_id).single()
      : Promise.resolve({ data: null }),
    character.background_id
      ? supabase.from('backgrounds').select('*').eq('id', character.background_id).single()
      : Promise.resolve({ data: null }),
    supabase.from('character_levels').select('*').eq('character_id', character.id),
    supabase.from('character_skill_proficiencies').select('*').eq('character_id', character.id),
    supabase.from('character_ability_bonus_choices').select('*').eq('character_id', character.id),
    supabase.from('character_language_choices').select('*').eq('character_id', character.id),
    supabase.from('character_tool_choices').select('*').eq('character_id', character.id),
    supabase.from('character_spell_selections').select('*').eq('character_id', character.id),
    supabase.from('character_feat_choices').select('*').eq('character_id', character.id),
    supabase.from('character_feature_option_choices').select('*').eq('character_id', character.id).order('choice_order'),
    buildLegalityInput(supabase, character.id),
  ])

  const typedSpellSelections = (typedSpellSelectionsResult.data ?? []) as CharacterSpellSelection[]
  const typedSpellChoices = typedSpellSelections
    .filter((row) => !isFeatSpellSourceFeatureKey(row.source_feature_key))
    .map((row) => row.spell_id)
    .filter((value): value is string => Boolean(value))
  const typedFeatChoices = ((typedFeatChoicesResult.data ?? []) as CharacterFeatChoice[])
    .map((row) => row.feat_id)
    .filter((value): value is string => Boolean(value))
  const typedLanguageChoices = ((languageChoicesResult.data ?? []) as CharacterLanguageChoice[])
    .map((row) => row.language)
    .filter((value): value is string => Boolean(value))
  const typedToolChoices = ((toolChoicesResult.data ?? []) as CharacterToolChoice[])
    .map((row) => row.tool)
    .filter((value): value is string => Boolean(value))
  const typedAbilityBonusChoices = ((abilityBonusChoicesResult.data ?? []) as CharacterAbilityBonusChoice[])
    .map((row) => row.ability)
    .filter((value): value is 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha' => Boolean(value))

  return {
    character: {
      ...character,
      species: speciesResult.data ?? null,
      background: backgroundResult.data ?? null,
      character_levels: levelsResult.data ?? [],
    },
    initialSkillProficiencies: (skillsResult.data ?? []).map((row) => row.skill),
    initialAbilityBonusChoices: typedAbilityBonusChoices,
    initialLanguageChoices: typedLanguageChoices,
    initialToolChoices: typedToolChoices,
    initialSpellChoices: typedSpellChoices,
    initialFeatSpellChoices: extractFeatSpellChoiceMap(typedSpellSelections),
    initialFeatChoices: typedFeatChoices,
    initialFeatureOptionChoices: (featureOptionChoicesResult.data ?? []) as CharacterFeatureOptionChoice[],
    legality: legalityInput ? runLegalityChecks(legalityInput) : null,
  }
}
