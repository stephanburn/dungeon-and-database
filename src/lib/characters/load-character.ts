import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Background,
  CharacterAbilityBonusChoice,
  CharacterAsiChoice,
  Character,
  CharacterFeatChoice,
  CharacterEquipmentItem,
  CharacterFeatureOptionChoice,
  CharacterLanguageChoice,
  CharacterLevel,
  CharacterSpellSelection,
  CharacterToolChoice,
  Database,
  Species,
  Spell,
} from '@/lib/types/database'
import { buildLegalityInput } from '@/lib/legality/build-input'
import { runLegalityChecks, type LegalityResult } from '@/lib/legality/engine'
import { buildAsiSelectionsFromRows, type AsiSelection } from '@/lib/characters/asi-provenance'
import type { SpellOption } from '@/lib/characters/wizard-helpers'

export interface CharacterWithRelations extends Character {
  species: Species | null
  background: Background | null
  character_levels: CharacterLevel[]
}

export interface LoadedCharacterState {
  character: CharacterWithRelations
  initialSkillProficiencies: string[]
  initialAbilityBonusChoices: Array<'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'>
  initialAsiChoices: AsiSelection[]
  initialLanguageChoices: string[]
  initialToolChoices: string[]
  initialSpellChoices: string[]
  initialSpellSelections: CharacterSpellSelection[]
  initialSelectedSpells: SpellOption[]
  initialFeatChoices: string[]
  initialFeatureOptionChoices: CharacterFeatureOptionChoice[]
  initialEquipmentItems: CharacterEquipmentItem[]
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

  const [speciesResult, backgroundResult, levelsResult, skillsResult, abilityBonusChoicesResult, asiChoicesResult, languageChoicesResult, toolChoicesResult, featureOptionChoicesResult, equipmentItemsResult, typedSpellSelectionsResult, typedFeatChoicesResult, legalityInput] = await Promise.all([
    character.species_id
      ? supabase.from('species').select('*').eq('id', character.species_id).single()
      : Promise.resolve({ data: null }),
    character.background_id
      ? supabase.from('backgrounds').select('*').eq('id', character.background_id).single()
      : Promise.resolve({ data: null }),
    supabase.from('character_levels').select('*').eq('character_id', character.id),
    supabase.from('character_skill_proficiencies').select('*').eq('character_id', character.id),
    supabase.from('character_ability_bonus_choices').select('*').eq('character_id', character.id),
    supabase.from('character_asi_choices').select('*').eq('character_id', character.id),
    supabase.from('character_language_choices').select('*').eq('character_id', character.id),
    supabase.from('character_tool_choices').select('*').eq('character_id', character.id),
    supabase.from('character_feature_option_choices').select('*').eq('character_id', character.id),
    supabase.from('character_equipment_items').select('*').eq('character_id', character.id),
    supabase.from('character_spell_selections').select('*').eq('character_id', character.id),
    supabase.from('character_feat_choices').select('*').eq('character_id', character.id),
    buildLegalityInput(supabase, character.id),
  ])

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
    : { data: [] as Spell[] }

  const typedSpellChoices = ((typedSpellSelectionsResult.data ?? []) as CharacterSpellSelection[])
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

  return {
    character: {
      ...character,
      species: speciesResult.data ?? null,
      background: backgroundResult.data ?? null,
      character_levels: levelsResult.data ?? [],
    },
    initialSkillProficiencies: (skillsResult.data ?? []).map((row) => row.skill),
    initialAbilityBonusChoices: typedAbilityBonusChoices,
    initialAsiChoices: typedAsiChoices,
    initialLanguageChoices: typedLanguageChoices,
    initialToolChoices: typedToolChoices,
    initialSpellChoices: typedSpellChoices,
    initialSpellSelections: typedSpellSelections,
    initialSelectedSpells,
    initialFeatChoices: typedFeatChoices,
    initialFeatureOptionChoices: typedFeatureOptionChoices,
    initialEquipmentItems: typedEquipmentItems,
    legality: legalityInput ? runLegalityChecks(legalityInput) : null,
  }
}
