import type { Alignment, Background, Class, Species, StatMethod } from '@/lib/types/database'
import type { FeatureOptionChoiceInput } from '@/lib/characters/choice-persistence'
import type { FeatSlotDefinition } from '@/lib/characters/feat-slots'
import type { DerivedCharacter } from '@/lib/characters/derived'
import type { SpellOption } from '@/lib/characters/wizard-helpers'
import type { AsiSelection } from '@/lib/characters/asi-provenance'
import type { AbilityKey as SpeciesChoiceAbilityKey } from '@/lib/characters/species-ability-bonus-provenance'
import {
  buildTypedAbilityBonusChoices,
  buildTypedAsiChoices,
  buildTypedFeatChoices,
  buildTypedLanguageChoices,
  buildTypedSkillProficiencies,
  buildTypedSpellChoices,
  buildTypedToolChoices,
} from '@/lib/characters/wizard-helpers'
import { buildTypedFeatSpellChoices } from '@/lib/characters/feat-spell-options'
import { buildTypedFeatureSpellChoices } from '@/lib/characters/feature-grants'

export type SheetSaveLevelInput = {
  class_id: string
  level: number
  subclass_id: string | null
  hp_roll: number | null
}

type BuildSheetSavePayloadArgs = {
  expectedUpdatedAt: string
  name: string
  alignment: Alignment | ''
  experiencePoints: number
  statMethod: StatMethod
  stats: Record<'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha', number>
  hpMax: number
  speciesId: string
  backgroundId: string
  levels: SheetSaveLevelInput[]
  skillProficiencies: string[]
  selectedBackground: Background | null
  selectedClass: Class | null
  selectedSpecies: Species | null
  abilityBonusChoices: SpeciesChoiceAbilityKey[]
  asiChoices: AsiSelection[]
  featSlots: FeatSlotDefinition[] | undefined
  featChoices: string[]
  languageChoices: string[]
  toolChoices: string[]
  canonicalFeatureOptionChoices: FeatureOptionChoiceInput[]
  spellChoices: string[]
  spellOptions: SpellOption[]
  firstClassId: string | null
  firstClassSubclassIds: string[]
  derivedCharacter: DerivedCharacter | null
  featSpellChoices: Record<string, string>
  featSpellDefinitions: Parameters<typeof buildTypedFeatSpellChoices>[0]['definitions']
  featureSpellChoices: Record<string, string>
  featureSpellDefinitions: Parameters<typeof buildTypedFeatureSpellChoices>[0]['definitions']
  isDm: boolean
  dmNotes: string
}

export function buildSheetSavePayload(args: BuildSheetSavePayloadArgs) {
  const character_levels = args.levels

  return {
    expected_updated_at: args.expectedUpdatedAt,
    name: args.name,
    alignment: args.alignment || null,
    experience_points: args.experiencePoints,
    stat_method: args.statMethod,
    base_str: args.stats.str,
    base_dex: args.stats.dex,
    base_con: args.stats.con,
    base_int: args.stats.int,
    base_wis: args.stats.wis,
    base_cha: args.stats.cha,
    hp_max: args.hpMax,
    species_id: args.speciesId || null,
    background_id: args.backgroundId || null,
    levels: character_levels,
    skill_proficiencies: buildTypedSkillProficiencies({
      skillProficiencies: args.skillProficiencies,
      background: args.selectedBackground,
      selectedClass: args.selectedClass,
      species: args.selectedSpecies,
    }),
    ability_bonus_choices: buildTypedAbilityBonusChoices(
      args.selectedSpecies,
      args.abilityBonusChoices
    ),
    asi_choices: buildTypedAsiChoices(
      args.asiChoices,
      args.featSlots,
      args.featChoices
    ),
    language_choices: buildTypedLanguageChoices({
      languageChoices: args.languageChoices,
      background: args.selectedBackground,
      species: args.selectedSpecies,
    }),
    tool_choices: buildTypedToolChoices({
      toolChoices: args.toolChoices,
      selectedClass: args.selectedClass,
      species: args.selectedSpecies,
    }),
    feature_option_choices: args.canonicalFeatureOptionChoices,
    spell_choices: [
      ...buildTypedSpellChoices({
        spellChoices: args.spellChoices,
        spellOptions: args.spellOptions,
        owningClassId: args.firstClassId,
        activeSubclassIds: args.firstClassSubclassIds,
        derived: args.derivedCharacter,
      }),
      ...buildTypedFeatSpellChoices({
        featSpellChoices: args.featSpellChoices,
        definitions: args.featSpellDefinitions,
      }),
      ...buildTypedFeatureSpellChoices({
        selectedChoices: args.featureSpellChoices,
        definitions: args.featureSpellDefinitions,
      }),
    ],
    feat_choices: buildTypedFeatChoices(args.featChoices, args.featSlots),
    ...(args.isDm ? { dm_notes: args.dmNotes } : {}),
  }
}
