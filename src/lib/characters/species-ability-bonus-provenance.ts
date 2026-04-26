import type { Species } from '@/lib/types/database'
import type { AbilityBonusChoiceInput } from '@/lib/characters/choice-persistence'

export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'

type SpeciesAbilityBonusChoiceConfig = {
  count: number
  bonus: number
  allowedAbilities: AbilityKey[]
  sourceCategory: string
  sourceEntityId: string | null
  sourceFeatureKey: string | null
}

type SpeciesAbilityBonusChoiceRule = {
  names: string[]
  count: number
  bonus: number
  allowedAbilities: AbilityKey[]
  sourceFeatureKey: string
}

const ABILITY_LABELS: Record<AbilityKey, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
}

const ALL_ABILITIES: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

const SPECIES_ABILITY_CHOICE_RULES: SpeciesAbilityBonusChoiceRule[] = [
  {
    names: ['Half-Elf'],
    count: 2,
    bonus: 1,
    allowedAbilities: ALL_ABILITIES.filter((ability) => ability !== 'cha'),
    sourceFeatureKey: 'species_asi:half_elf',
  },
  {
    names: ['Variant Human'],
    count: 2,
    bonus: 1,
    allowedAbilities: ALL_ABILITIES,
    sourceFeatureKey: 'species_asi:variant_human',
  },
  {
    names: ['Half-Elf (Mark of Detection)'],
    count: 1,
    bonus: 1,
    allowedAbilities: ALL_ABILITIES.filter((ability) => ability !== 'wis'),
    sourceFeatureKey: 'species_asi:mark_of_detection_half_elf',
  },
  {
    names: ['Human (Mark of Handling)'],
    count: 1,
    bonus: 1,
    allowedAbilities: ALL_ABILITIES,
    sourceFeatureKey: 'species_asi:mark_of_handling_human',
  },
  {
    names: ['Human (Mark of Making)'],
    count: 1,
    bonus: 1,
    allowedAbilities: ALL_ABILITIES,
    sourceFeatureKey: 'species_asi:mark_of_making_human',
  },
  {
    names: ['Human (Mark of Passage)'],
    count: 1,
    bonus: 1,
    allowedAbilities: ALL_ABILITIES,
    sourceFeatureKey: 'species_asi:mark_of_passage_human',
  },
]

export function getSpeciesAbilityBonusChoiceConfig(species: Species | null): SpeciesAbilityBonusChoiceConfig | null {
  if (!species) return null

  if (species.name === 'Changeling' && species.source === 'ERftLW') {
    return {
      count: 1,
      bonus: 1,
      allowedAbilities: ALL_ABILITIES.filter((ability) => ability !== 'cha'),
      sourceCategory: 'species_choice',
      sourceEntityId: species.id,
      sourceFeatureKey: 'species_asi:changeling_flexible_bonus',
    }
  }

  if (species.name === 'Warforged' && species.source === 'ERftLW') {
    return {
      count: 1,
      bonus: 1,
      allowedAbilities: ALL_ABILITIES.filter((ability) => ability !== 'con'),
      sourceCategory: 'species_choice',
      sourceEntityId: species.id,
      sourceFeatureKey: 'species_asi:warforged_flexible_bonus',
    }
  }

  const speciesRule = SPECIES_ABILITY_CHOICE_RULES.find((rule) => rule.names.includes(species.name))
  if (speciesRule) {
    return {
      count: speciesRule.count,
      bonus: speciesRule.bonus,
      allowedAbilities: speciesRule.allowedAbilities,
      sourceCategory: 'species_choice',
      sourceEntityId: species.id,
      sourceFeatureKey: speciesRule.sourceFeatureKey,
    }
  }

  return null
}

export function getAvailableSpeciesAbilityChoices(species: Species | null): AbilityKey[] {
  return getSpeciesAbilityBonusChoiceConfig(species)?.allowedAbilities ?? []
}

export function getSpeciesAbilityChoiceLimit(species: Species | null) {
  return getSpeciesAbilityBonusChoiceConfig(species)?.count ?? 0
}

export function getAbilityChoiceLabel(ability: AbilityKey) {
  return ABILITY_LABELS[ability]
}

export function buildSpeciesAbilityBonusMap(
  species: Species | null,
  chosenAbilities: AbilityKey[]
): Partial<Record<AbilityKey, number>> {
  const config = getSpeciesAbilityBonusChoiceConfig(species)
  if (!config) return {}

  return Array.from(new Set(chosenAbilities))
    .filter((ability): ability is AbilityKey => config.allowedAbilities.includes(ability))
    .slice(0, config.count)
    .reduce<Partial<Record<AbilityKey, number>>>((acc, ability) => {
      acc[ability] = (acc[ability] ?? 0) + config.bonus
      return acc
    }, {})
}

export function buildTypedAbilityBonusChoices(
  species: Species | null,
  chosenAbilities: AbilityKey[]
): AbilityBonusChoiceInput[] {
  const config = getSpeciesAbilityBonusChoiceConfig(species)
  if (!config) return []

  return Array.from(new Set(chosenAbilities))
    .filter((ability): ability is AbilityKey => config.allowedAbilities.includes(ability))
    .slice(0, config.count)
    .map((ability) => ({
      ability,
      bonus: config.bonus,
      character_level_id: null,
      source_category: config.sourceCategory,
      source_entity_id: config.sourceEntityId,
      source_feature_key: config.sourceFeatureKey,
    }))
}
