import type {
  FeatureOptionChoiceInput,
} from '@/lib/characters/choice-persistence'
import type {
  CharacterFeatureOptionChoice,
  Subclass,
} from '@/lib/types/database'

export const MAVERICK_SOURCE_KEY = 'EE'
export const MAVERICK_SUBCLASS_NAME = 'Maverick'
export const MAVERICK_BREAKTHROUGH_SOURCE_FEATURE_KEY = 'subclass_feature:maverick_arcane_breakthroughs'

export const MAVERICK_BREAKTHROUGH_SLOTS = [
  { classLevel: 3, optionGroupKey: 'maverick:breakthrough:3' },
  { classLevel: 5, optionGroupKey: 'maverick:breakthrough:5' },
  { classLevel: 9, optionGroupKey: 'maverick:breakthrough:9' },
  { classLevel: 13, optionGroupKey: 'maverick:breakthrough:13' },
  { classLevel: 17, optionGroupKey: 'maverick:breakthrough:17' },
] as const

export function isMaverickSubclass(subclass: Pick<Subclass, 'name' | 'source'> | null | undefined) {
  return Boolean(
    subclass &&
    subclass.name === MAVERICK_SUBCLASS_NAME &&
    subclass.source === MAVERICK_SOURCE_KEY
  )
}

export function getUnlockedMaverickBreakthroughSlots(classLevel: number) {
  return MAVERICK_BREAKTHROUGH_SLOTS.filter((slot) => classLevel >= slot.classLevel)
}

export function getMaverickPreparedBreakthroughLevels(classLevel: number) {
  return getUnlockedMaverickBreakthroughSlots(classLevel).map((slot) => {
    if (slot.classLevel === 3) return 1
    if (slot.classLevel === 5) return 2
    if (slot.classLevel === 9) return 3
    if (slot.classLevel === 13) return 4
    return 5
  })
}

export function getMaverickCantripBonus(classLevel: number) {
  return classLevel >= 3 ? 1 : 0
}

export function getMaverickBreakthroughClassIds(
  rows: Array<Pick<CharacterFeatureOptionChoice, 'option_group_key' | 'option_key'>>
) {
  return MAVERICK_BREAKTHROUGH_SLOTS.flatMap((slot) => {
    const row = rows.find((entry) => entry.option_group_key === slot.optionGroupKey)
    return row?.option_key ? [row.option_key] : []
  })
}

export function buildMaverickFeatureOptionChoices(args: {
  subclassId: string | null
  classLevel: number
  selectedClassIds: string[]
}): FeatureOptionChoiceInput[] {
  const { subclassId, classLevel, selectedClassIds } = args
  return getUnlockedMaverickBreakthroughSlots(classLevel).flatMap((slot, index) => {
    const optionKey = selectedClassIds[index]
    if (!optionKey) return []
    return [{
      option_group_key: slot.optionGroupKey,
      option_key: optionKey,
      character_level_id: null,
      source_category: 'subclass_choice',
      source_entity_id: subclassId,
      source_feature_key: MAVERICK_BREAKTHROUGH_SOURCE_FEATURE_KEY,
    }]
  })
}
