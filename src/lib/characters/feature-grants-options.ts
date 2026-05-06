import type {
  CharacterFeatureOptionChoice,
  FeatureOption,
} from '@/lib/types/database'
import type {
  FeatureOptionChoiceInput,
} from '@/lib/characters/choice-persistence'
import {
  MAVERICK_ARCANE_BREAKTHROUGH_GROUP_KEY,
  MAVERICK_ARCANE_BREAKTHROUGH_SOURCE_KEY,
  MAVERICK_BREAKTHROUGH_LEVELS,
  ordinalSuffix,
  type FeatureOptionChoiceDefinition,
} from './feature-grants-types'

export function getFeatureOptionChoiceValue(
  rows: Array<{
    option_group_key?: string
    optionGroupKey?: string
    option_key?: string
    optionKey?: string
    selected_value?: Record<string, unknown>
    selectedValue?: Record<string, unknown>
  }>,
  optionGroupKey: string,
  optionKey: string,
  valueKey: string
) {
  const row = getActiveFeatureOptionChoices(rows).find((entry) => {
    const groupKey = 'option_group_key' in entry ? entry.option_group_key : entry.optionGroupKey
    const key = 'option_key' in entry ? entry.option_key : entry.optionKey
    return groupKey === optionGroupKey && key === optionKey
  })
  if (!row) return null

  const selectedValue = 'selected_value' in row ? row.selected_value : row.selectedValue
  const value = selectedValue?.[valueKey]
  return typeof value === 'string' && value.length > 0 ? value : null
}

export function getActiveFeatureOptionChoices<T extends {
  option_group_key?: string
  optionGroupKey?: string
  option_key?: string
  optionKey?: string
}>(rows: T[]) {
  const latestBySlot = new Map<string, T>()

  for (const row of rows) {
    const groupKey = 'option_group_key' in row ? row.option_group_key : row.optionGroupKey
    const optionKey = 'option_key' in row ? row.option_key : row.optionKey
    if (!groupKey || !optionKey) continue
    latestBySlot.set(`${groupKey}:${optionKey}`, row)
  }

  return Array.from(latestBySlot.values())
}

export function buildFeatureOptionChoiceMap(
  rows: Array<Pick<CharacterFeatureOptionChoice, 'option_group_key' | 'option_key' | 'selected_value'>>
) {
  return Object.fromEntries(
    getActiveFeatureOptionChoices(rows).map((row) => [row.option_key, row.selected_value ?? {}])
  )
}

export function buildMaverickFeatureOptionChoices(args: {
  selectedClassIds: string[]
  definitions: FeatureOptionChoiceDefinition[]
}): FeatureOptionChoiceInput[] {
  return args.definitions.flatMap((definition, index) => {
    const classId = args.selectedClassIds[index] ?? ''
    if (!classId) return []

    const valueKey = definition.valueKey ?? 'class_id'
    return [{
      option_group_key: definition.optionGroupKey,
      option_key: definition.optionKey,
      selected_value: { [valueKey]: classId },
      choice_order: definition.choiceOrder,
      character_level_id: null,
      source_category: definition.sourceCategory,
      source_entity_id: definition.sourceEntityId,
      source_feature_key: definition.sourceFeatureKey,
    }]
  })
}

export function getMaverickArcaneBreakthroughOptionDefinitions(args: {
  classLevel: number
  subclassId: string | null
  optionRows: FeatureOption[]
}): FeatureOptionChoiceDefinition[] {
  if (!args.subclassId || args.classLevel < 3) return []

  const allowedClasses = args.optionRows
    .filter((option) => option.group_key === MAVERICK_ARCANE_BREAKTHROUGH_GROUP_KEY)
    .sort((left, right) => {
      if (left.option_order !== right.option_order) return left.option_order - right.option_order
      return left.name.localeCompare(right.name)
    })
    .flatMap((option) => {
      const classId = typeof option.effects?.class_id === 'string' ? option.effects.class_id : null
      if (!classId) return []

      return [{
        value: classId,
        label: option.name,
        description: option.description,
      }]
    })

  return MAVERICK_BREAKTHROUGH_LEVELS
    .filter((requiredLevel) => args.classLevel >= requiredLevel)
    .map((requiredLevel, index) => ({
      optionGroupKey: MAVERICK_ARCANE_BREAKTHROUGH_GROUP_KEY,
      optionKey: `class_${requiredLevel}`,
      label: `Arcane Breakthrough class ${index + 1}`,
      description: `Choose the ${index + 1}${ordinalSuffix(index + 1)} class to add to your Breakthrough spell list.`,
      choiceOrder: index,
      choices: allowedClasses,
      sourceCategory: 'subclass_feature',
      sourceEntityId: args.subclassId,
      sourceFeatureKey: MAVERICK_ARCANE_BREAKTHROUGH_SOURCE_KEY,
    }))
}

export function getSelectedMaverickBreakthroughClassIds(
  rows: Array<Pick<CharacterFeatureOptionChoice, 'option_group_key' | 'option_key' | 'selected_value'>> | FeatureOptionChoiceInput[]
) {
  const canonicalRows = getActiveFeatureOptionChoices(rows)
    .filter((row) => row.option_group_key === MAVERICK_ARCANE_BREAKTHROUGH_GROUP_KEY)
    .map((row) => row.selected_value?.class_id)
    .filter((value): value is string => typeof value === 'string' && value.length > 0)

  if (canonicalRows.length > 0) return canonicalRows

  return rows
    .filter((row) => row.option_group_key.startsWith('maverick:breakthrough:'))
    .sort((left, right) => {
      const leftLevel = Number.parseInt(left.option_group_key.split(':').at(-1) ?? '0', 10)
      const rightLevel = Number.parseInt(right.option_group_key.split(':').at(-1) ?? '0', 10)
      return leftLevel - rightLevel
    })
    .map((row) => ('option_key' in row ? row.option_key : undefined))
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
}

export function buildFeatureOptionChoicesFromDefinitionMap(args: {
  definitions: FeatureOptionChoiceDefinition[]
  selectedValues: Record<string, string>
}): FeatureOptionChoiceInput[] {
  return args.definitions.flatMap((definition) => {
    const selectedValue = args.selectedValues[definition.optionKey] ?? ''
    if (!selectedValue) return []

    const valueKey = definition.valueKey ?? 'class_id'
    return [{
      option_group_key: definition.optionGroupKey,
      option_key: definition.optionKey,
      selected_value: { [valueKey]: selectedValue },
      choice_order: definition.choiceOrder,
      character_level_id: null,
      source_category: definition.sourceCategory,
      source_entity_id: definition.sourceEntityId,
      source_feature_key: definition.sourceFeatureKey,
    }]
  })
}

export function mergeFeatureOptionChoiceInputs(args: {
  preservedChoices: FeatureOptionChoiceInput[]
  replacementDefinitions: FeatureOptionChoiceDefinition[]
  replacements: FeatureOptionChoiceInput[]
}) {
  const replacementKeys = new Set(
    args.replacementDefinitions.map((definition) => `${definition.optionGroupKey}:${definition.optionKey}`)
  )

  return [
    ...args.preservedChoices.filter(
      (choice) => !replacementKeys.has(`${choice.option_group_key}:${choice.option_key}`)
    ),
    ...args.replacements,
  ]
}

export function filterFeatureOptionChoicesByActiveDefinitions(args: {
  choices: FeatureOptionChoiceInput[]
  optionGroupKey: string
  definitions: FeatureOptionChoiceDefinition[]
}) {
  if (args.definitions.length === 0) return args.choices

  const activeKeys = new Set(
    args.definitions.map((definition) => `${definition.optionGroupKey}:${definition.optionKey}`)
  )

  return args.choices.filter((choice) => (
    choice.option_group_key !== args.optionGroupKey
    || activeKeys.has(`${choice.option_group_key}:${choice.option_key}`)
  ))
}
