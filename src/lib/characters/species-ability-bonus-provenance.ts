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

const ABILITY_LABELS: Record<AbilityKey, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
}

const ALL_ABILITIES: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

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

  if (species.name === 'Half-Elf (Mark of Detection)' && species.source === 'ERftLW') {
    return {
      count: 1,
      bonus: 1,
      allowedAbilities: ALL_ABILITIES.filter((ability) => ability !== 'wis'),
      sourceCategory: 'species_choice',
      sourceEntityId: species.id,
      sourceFeatureKey: 'species_asi:mark_of_detection_flexible_bonus',
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
