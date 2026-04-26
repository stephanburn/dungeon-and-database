import type {
  CharacterFeatureOptionChoice,
  FeatureOption,
} from '@/lib/types/database'
import type { FeatureOptionChoiceInput } from '@/lib/characters/choice-persistence'
import {
  FEATURE_OPTION_VALUE_KEY,
  type FeatureOptionChoiceDefinition,
} from '@/lib/characters/feature-grants'

export const ARTIFICER_INFUSION_GROUP_KEY = 'artificer:infusion:2014'
export const ARTIFICER_INFUSION_SOURCE_FEATURE_KEY = 'class_feature:artificer:infuse_item'
export const ARTIFICER_CLASS_NAME = 'Artificer'
export const ARTIFICER_CLASS_SOURCE = 'ERftLW'

interface InfusionProgressionEntry {
  minLevel: number
  count: number
}

const INFUSIONS_KNOWN_PROGRESSION: InfusionProgressionEntry[] = [
  { minLevel: 18, count: 12 },
  { minLevel: 14, count: 10 },
  { minLevel: 10, count: 8 },
  { minLevel: 6, count: 6 },
  { minLevel: 2, count: 4 },
]

const INFUSIONS_PREPARED_PROGRESSION: InfusionProgressionEntry[] = [
  { minLevel: 18, count: 6 },
  { minLevel: 14, count: 5 },
  { minLevel: 10, count: 4 },
  { minLevel: 6, count: 3 },
  { minLevel: 2, count: 2 },
]

export function isArtificerClass(className: string | null | undefined) {
  return className === ARTIFICER_CLASS_NAME
}

export function getInfusionsKnown(artificerLevel: number): number {
  return INFUSIONS_KNOWN_PROGRESSION.find((entry) => artificerLevel >= entry.minLevel)?.count ?? 0
}

export function getInfusionsPrepared(artificerLevel: number): number {
  return INFUSIONS_PREPARED_PROGRESSION.find((entry) => artificerLevel >= entry.minLevel)?.count ?? 0
}

function getMinimumInfusionLevel(option: Pick<FeatureOption, 'prerequisites'>) {
  const raw = option.prerequisites?.minimum_class_level
  return typeof raw === 'number' ? raw : 2
}

function getInfusionChoicePool(args: {
  optionRows: FeatureOption[]
  artificerLevel: number
}) {
  return args.optionRows
    .filter((option) => (
      option.group_key === ARTIFICER_INFUSION_GROUP_KEY
      && getMinimumInfusionLevel(option) <= args.artificerLevel
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

export function getArtificerInfusionOptionDefinitions(args: {
  classId: string | null
  artificerLevel: number
  optionRows: FeatureOption[]
}): FeatureOptionChoiceDefinition[] {
  const known = getInfusionsKnown(args.artificerLevel)
  if (known === 0 || !args.classId) return []

  const choices = getInfusionChoicePool({
    optionRows: args.optionRows,
    artificerLevel: args.artificerLevel,
  })

  if (choices.length === 0) return []

  return Array.from({ length: known }, (_, index) => ({
    optionGroupKey: ARTIFICER_INFUSION_GROUP_KEY,
    optionKey: `${args.classId}:infusion_${index + 1}`,
    label: `Artificer Infusion ${index + 1}`,
    description: index === 0
      ? `Choose ${known} known infusion${known === 1 ? '' : 's'}; you can keep ${getInfusionsPrepared(args.artificerLevel)} infused at once.`
      : 'Choose an additional known infusion.',
    valueKey: FEATURE_OPTION_VALUE_KEY,
    choiceOrder: index,
    choices,
    sourceCategory: 'class_feature',
    sourceEntityId: args.classId,
    sourceFeatureKey: ARTIFICER_INFUSION_SOURCE_FEATURE_KEY,
  }))
}

export function getSelectedInfusionKeys(
  rows: Array<Pick<CharacterFeatureOptionChoice, 'option_group_key' | 'option_key' | 'selected_value'>> | FeatureOptionChoiceInput[]
): string[] {
  return rows
    .filter((row) => row.option_group_key === ARTIFICER_INFUSION_GROUP_KEY)
    .sort((left, right) => left.option_key.localeCompare(right.option_key))
    .map((row) => {
      const value = row.selected_value?.[FEATURE_OPTION_VALUE_KEY]
      return typeof value === 'string' && value.length > 0 ? value : null
    })
    .filter((value): value is string => value !== null)
}
