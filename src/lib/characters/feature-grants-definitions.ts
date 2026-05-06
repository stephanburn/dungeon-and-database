import type {
  CharacterFeatureOptionChoice,
  FeatureOption,
  Species,
} from '@/lib/types/database'
import {
  BATTLE_MASTER_MANEUVER_GROUP_KEY,
  CIRCLE_OF_LAND_TERRAIN_GROUP_KEY,
  DRAGONBORN_ANCESTRIES,
  DRAGONBORN_ANCESTRY_GROUP_KEY,
  DRAGONBORN_ANCESTRY_SOURCE_KEY,
  FEATURE_OPTION_VALUE_KEY,
  FIGHTING_STYLE_GROUP_KEYS,
  FIGHTING_STYLE_UNLOCK_LEVELS,
  FIGHTING_STYLE_VALUE_KEY,
  FOUR_ELEMENTS_DISCIPLINE_GROUP_KEY,
  HUNTER_DEFENSIVE_TACTICS_GROUP_KEY,
  HUNTER_MULTIATTACK_GROUP_KEY,
  HUNTER_PREY_GROUP_KEY,
  HUNTER_SUPERIOR_DEFENSE_GROUP_KEY,
  type FeatureOptionChoiceDefinition,
} from './feature-grants-types'
import { getFeatureOptionChoiceValue } from './feature-grants-options'

export function getFightingStyleGroupKey(className: string | null | undefined) {
  if (!className) return null
  return FIGHTING_STYLE_GROUP_KEYS[className] ?? null
}

export function getFightingStyleUnlockLevel(className: string | null | undefined) {
  if (!className) return null
  return FIGHTING_STYLE_UNLOCK_LEVELS[className] ?? null
}

export function getFightingStyleFeatureOptionDefinition(args: {
  classId: string | null
  className: string | null
  classLevel: number
  optionRows: FeatureOption[]
}): FeatureOptionChoiceDefinition[] {
  const groupKey = getFightingStyleGroupKey(args.className)
  const unlockLevel = getFightingStyleUnlockLevel(args.className)
  const className = args.className
  if (!groupKey || !unlockLevel || !className || args.classLevel < unlockLevel) return []

  const choices = args.optionRows
    .filter((option) => option.group_key === groupKey)
    .sort((left, right) => {
      if (left.option_order !== right.option_order) return left.option_order - right.option_order
      return left.name.localeCompare(right.name)
    })
    .map((option) => ({
      value: option.key,
      label: option.name,
      description: option.description,
    }))

  if (choices.length === 0) return []

  return [{
    optionGroupKey: groupKey,
    optionKey: 'style',
    label: 'Fighting Style',
    description: `Choose the fighting style granted by ${className}.`,
    valueKey: FIGHTING_STYLE_VALUE_KEY,
    choiceOrder: 0,
    choices,
    sourceCategory: 'class_feature',
    sourceEntityId: args.classId,
    sourceFeatureKey: `class_feature:fighting_style:${className.toLowerCase()}`,
  }]
}

export function getSubclassFeatureOptionDefinitions(args: {
  classId: string | null
  classLevel: number
  subclassId: string | null
  subclassName: string | null
  subclassSource: string | null
  optionRows: FeatureOption[]
}): FeatureOptionChoiceDefinition[] {
  if (!args.classId || !args.subclassId || !args.subclassName || args.subclassSource !== 'PHB') return []

  if (args.subclassName === 'Battle Master') {
    const maneuverChoices = getFeatureOptionChoicesForGroup({
      optionRows: args.optionRows,
      groupKey: BATTLE_MASTER_MANEUVER_GROUP_KEY,
      classLevel: args.classLevel,
    })
    const maneuverCount = args.classLevel >= 15 ? 9 : args.classLevel >= 10 ? 7 : args.classLevel >= 7 ? 5 : args.classLevel >= 3 ? 3 : 0
    return buildRepeatedFeatureOptionDefinitions({
      count: maneuverCount,
      optionGroupKey: BATTLE_MASTER_MANEUVER_GROUP_KEY,
      optionKeyPrefix: `${args.classId}:maneuver`,
      labelPrefix: 'Combat Superiority Maneuver',
      description: 'Choose a Battle Master maneuver for this fighter.',
      choices: maneuverChoices,
      sourceEntityId: args.subclassId,
      sourceFeatureKey: 'subclass_feature:battle_master:combat_superiority',
    })
  }

  if (args.subclassName === 'Hunter') {
    const definitions: FeatureOptionChoiceDefinition[] = []
    const optionConfigs = [
      {
        minimumClassLevel: 3,
        optionGroupKey: HUNTER_PREY_GROUP_KEY,
        optionKey: `${args.classId}:hunters_prey`,
        label: "Hunter's Prey",
        description: 'Choose your preferred offensive hunting tactic.',
        sourceFeatureKey: 'subclass_feature:hunter:hunters_prey',
      },
      {
        minimumClassLevel: 7,
        optionGroupKey: HUNTER_DEFENSIVE_TACTICS_GROUP_KEY,
        optionKey: `${args.classId}:defensive_tactics`,
        label: 'Defensive Tactics',
        description: 'Choose a practiced defense for your Hunter.',
        sourceFeatureKey: 'subclass_feature:hunter:defensive_tactics',
      },
      {
        minimumClassLevel: 11,
        optionGroupKey: HUNTER_MULTIATTACK_GROUP_KEY,
        optionKey: `${args.classId}:multiattack`,
        label: 'Multiattack',
        description: 'Choose your Hunter multiattack option.',
        sourceFeatureKey: 'subclass_feature:hunter:multiattack',
      },
      {
        minimumClassLevel: 15,
        optionGroupKey: HUNTER_SUPERIOR_DEFENSE_GROUP_KEY,
        optionKey: `${args.classId}:superior_defense`,
        label: "Superior Hunter's Defense",
        description: 'Choose your advanced Hunter defense.',
        sourceFeatureKey: 'subclass_feature:hunter:superior_defense',
      },
    ] as const

    for (const config of optionConfigs) {
      if (args.classLevel < config.minimumClassLevel) continue
      const choices = getFeatureOptionChoicesForGroup({
        optionRows: args.optionRows,
        groupKey: config.optionGroupKey,
        classLevel: args.classLevel,
      })
      if (choices.length === 0) continue

      definitions.push({
        optionGroupKey: config.optionGroupKey,
        optionKey: config.optionKey,
        label: config.label,
        description: config.description,
        valueKey: FEATURE_OPTION_VALUE_KEY,
        choiceOrder: definitions.length,
        choices,
        sourceCategory: 'subclass_feature',
        sourceEntityId: args.subclassId,
        sourceFeatureKey: config.sourceFeatureKey,
      })
    }

    return definitions
  }

  if (args.subclassName === 'Circle of the Land' && args.classLevel >= 2) {
    const choices = getFeatureOptionChoicesForGroup({
      optionRows: args.optionRows,
      groupKey: CIRCLE_OF_LAND_TERRAIN_GROUP_KEY,
      classLevel: args.classLevel,
    })
    if (choices.length === 0) return []

    return [{
      optionGroupKey: CIRCLE_OF_LAND_TERRAIN_GROUP_KEY,
      optionKey: `${args.classId}:terrain`,
      label: 'Circle of the Land Terrain',
      description: 'Choose the natural terrain that shapes your circle spells.',
      valueKey: FEATURE_OPTION_VALUE_KEY,
      choiceOrder: 0,
      choices,
      sourceCategory: 'subclass_feature',
      sourceEntityId: args.subclassId,
      sourceFeatureKey: 'subclass_feature:circle_of_the_land:terrain',
    }]
  }

  if (args.subclassName === 'Way of the Four Elements') {
    const disciplineChoices = getFeatureOptionChoicesForGroup({
      optionRows: args.optionRows,
      groupKey: FOUR_ELEMENTS_DISCIPLINE_GROUP_KEY,
      classLevel: args.classLevel,
    })
    const disciplineCount = args.classLevel >= 17 ? 4 : args.classLevel >= 11 ? 3 : args.classLevel >= 6 ? 2 : args.classLevel >= 3 ? 1 : 0
    return buildRepeatedFeatureOptionDefinitions({
      count: disciplineCount,
      optionGroupKey: FOUR_ELEMENTS_DISCIPLINE_GROUP_KEY,
      optionKeyPrefix: `${args.classId}:discipline`,
      labelPrefix: 'Elemental Discipline',
      description: 'Choose an elemental discipline available to your monk.',
      choices: disciplineChoices,
      sourceEntityId: args.subclassId,
      sourceFeatureKey: 'subclass_feature:four_elements:discipline',
    })
  }

  return []
}

export function getSpeciesFeatureOptionDefinitions(args: {
  species: Pick<Species, 'id' | 'name' | 'source'> | null
}): FeatureOptionChoiceDefinition[] {
  if (!isPhbDragonborn(args.species)) return []

  return [{
    optionGroupKey: DRAGONBORN_ANCESTRY_GROUP_KEY,
    optionKey: 'ancestry',
    label: 'Draconic Ancestry',
    description: 'Choose the dragon ancestry that sets your breath weapon and damage resistance.',
    valueKey: FEATURE_OPTION_VALUE_KEY,
    choiceOrder: 0,
    choices: DRAGONBORN_ANCESTRIES.map((ancestry) => ({
      value: ancestry.key,
      label: ancestry.label,
      description: ancestry.description,
    })),
    sourceCategory: 'species_choice',
    sourceEntityId: args.species?.id ?? null,
    sourceFeatureKey: DRAGONBORN_ANCESTRY_SOURCE_KEY,
  }]
}

export function getSelectedDragonbornAncestry(
  rows: Array<Pick<CharacterFeatureOptionChoice, 'option_group_key' | 'option_key' | 'selected_value'>>
) {
  const selectedKey = getFeatureOptionChoiceValue(
    rows,
    DRAGONBORN_ANCESTRY_GROUP_KEY,
    'ancestry',
    FEATURE_OPTION_VALUE_KEY
  )
  if (!selectedKey) return null

  return DRAGONBORN_ANCESTRIES.find((ancestry) => ancestry.key === selectedKey) ?? null
}

export function getSpeciesDerivedDamageResistances(args: {
  speciesName: string | null
  speciesSource: string | null
  selectedOptions: Array<Pick<CharacterFeatureOptionChoice, 'option_group_key' | 'option_key' | 'selected_value'>>
}) {
  if (!args.speciesName || !args.speciesSource) return []
  if (!(args.speciesName === 'Dragonborn' && args.speciesSource === 'PHB')) return []

  const ancestry = getSelectedDragonbornAncestry(args.selectedOptions)
  return ancestry ? [ancestry.damageType] : []
}

function isPhbDragonborn(species: Pick<Species, 'name' | 'source'> | null) {
  return species?.name === 'Dragonborn' && species.source === 'PHB'
}

function getMinimumClassLevel(option: Pick<FeatureOption, 'prerequisites'>) {
  const raw = option.prerequisites?.minimum_class_level
  return typeof raw === 'number' ? raw : 1
}

function getFeatureOptionChoicesForGroup(args: {
  optionRows: FeatureOption[]
  groupKey: string
  classLevel: number
}) {
  return args.optionRows
    .filter((option) => (
      option.group_key === args.groupKey
      && getMinimumClassLevel(option) <= args.classLevel
    ))
    .sort((left, right) => {
      if (left.option_order !== right.option_order) return left.option_order - right.option_order
      return left.name.localeCompare(right.name)
    })
    .map((option) => ({
      value: option.key,
      label: option.name,
      description: option.description,
    }))
}

function buildRepeatedFeatureOptionDefinitions(args: {
  count: number
  optionGroupKey: string
  optionKeyPrefix: string
  labelPrefix: string
  description: string
  choices: FeatureOptionChoiceDefinition['choices']
  sourceEntityId: string | null
  sourceFeatureKey: string
}) {
  if (args.count <= 0 || args.choices.length === 0) return []

  return Array.from({ length: args.count }, (_, index) => ({
    optionGroupKey: args.optionGroupKey,
    optionKey: `${args.optionKeyPrefix}_${index + 1}`,
    label: `${args.labelPrefix} ${index + 1}`,
    description: args.description,
    valueKey: FEATURE_OPTION_VALUE_KEY,
    choiceOrder: index,
    choices: args.choices,
    sourceCategory: 'subclass_feature',
    sourceEntityId: args.sourceEntityId,
    sourceFeatureKey: args.sourceFeatureKey,
  }))
}
