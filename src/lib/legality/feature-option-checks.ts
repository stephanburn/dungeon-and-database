import {
  BATTLE_MASTER_MANEUVER_GROUP_KEY,
  CIRCLE_OF_LAND_TERRAIN_GROUP_KEY,
  FEATURE_OPTION_VALUE_KEY,
  FIGHTING_STYLE_VALUE_KEY,
  FOUR_ELEMENTS_DISCIPLINE_GROUP_KEY,
  getActiveFeatureOptionChoices,
  getFightingStyleGroupKey,
  getFightingStyleUnlockLevel,
  HUNTER_DEFENSIVE_TACTICS_GROUP_KEY,
  HUNTER_MULTIATTACK_GROUP_KEY,
  HUNTER_PREY_GROUP_KEY,
  HUNTER_SUPERIOR_DEFENSE_GROUP_KEY,
} from '@/lib/characters/feature-grants'
import {
  ARTIFICER_CLASS_NAME,
  ARTIFICER_INFUSION_GROUP_KEY,
  getInfusionsKnown,
} from '@/lib/characters/infusions'
import type { LegalityCheck, LegalityInput } from './types'

export function checkFightingStyleSelections(input: LegalityInput): LegalityCheck {
  const missingClassNames = input.classes.flatMap((cls) => {
    const groupKey = getFightingStyleGroupKey(cls.name)
    const unlockLevel = getFightingStyleUnlockLevel(cls.name)
    if (!groupKey || !unlockLevel || cls.level < unlockLevel) return []

    const hasSelection = input.selectedFeatureOptions.some((choice) => {
      if (choice.option_group_key !== groupKey) return false
      const selectedValue = choice.selected_value?.[FIGHTING_STYLE_VALUE_KEY]
      return typeof selectedValue === 'string' && selectedValue.length > 0
    })

    return hasSelection ? [] : [cls.name]
  })

  return {
    key: 'fighting_style_selections',
    passed: missingClassNames.length === 0,
    message: missingClassNames.length === 0
      ? 'Required fighting style selections are present.'
      : `Missing fighting style selection for ${missingClassNames.join(', ')}.`,
    severity: 'error',
  }
}

export function checkArtificerInfusionSelections(input: LegalityInput): LegalityCheck {
  const artificerLevel = input.classes
    .filter((cls) => cls.name === ARTIFICER_CLASS_NAME)
    .reduce((acc, cls) => Math.max(acc, cls.level), 0)
  const required = getInfusionsKnown(artificerLevel)
  const activeChoices = getActiveFeatureOptionChoices(input.selectedFeatureOptions)
    .filter((choice) => choice.option_group_key === ARTIFICER_INFUSION_GROUP_KEY)
    .filter((choice) => {
      const value = choice.selected_value?.[FEATURE_OPTION_VALUE_KEY]
      return typeof value === 'string' && value.length > 0
    })

  if (required === 0) {
    return {
      key: 'artificer_infusion_selections',
      passed: activeChoices.length === 0,
      message: activeChoices.length === 0
        ? 'No artificer infusions are required at this level.'
        : `Found ${activeChoices.length} infusion selection${activeChoices.length === 1 ? '' : 's'} but the current artificer level requires none.`,
      severity: 'error',
    }
  }

  const optionLevelByKey = new Map(
    input.featureOptions
      .filter((option) => option.group_key === ARTIFICER_INFUSION_GROUP_KEY)
      .map((option) => {
        const raw = option.prerequisites?.minimum_class_level
        return [option.key, typeof raw === 'number' ? raw : 2] as const
      })
  )

  const selectedKeys = activeChoices
    .map((choice) => choice.selected_value?.[FEATURE_OPTION_VALUE_KEY])
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
  const duplicates = selectedKeys.filter((key, index) => selectedKeys.indexOf(key) !== index)
  const unknownKeys = selectedKeys.filter((key) => !optionLevelByKey.has(key))
  const overLevelKeys = selectedKeys.filter((key) => {
    const minLevel = optionLevelByKey.get(key)
    return typeof minLevel === 'number' && minLevel > artificerLevel
  })

  const missing = required - activeChoices.length
  const issues: string[] = []
  if (missing > 0) issues.push(`Choose ${missing} more artificer infusion${missing === 1 ? '' : 's'} (${activeChoices.length}/${required}).`)
  if (activeChoices.length > required) issues.push(`Selected ${activeChoices.length} infusions but only ${required} are known at this level.`)
  if (duplicates.length > 0) issues.push(`Each infusion can only be chosen once: ${Array.from(new Set(duplicates)).join(', ')}.`)
  if (unknownKeys.length > 0) issues.push(`Unknown artificer infusion selections: ${Array.from(new Set(unknownKeys)).join(', ')}.`)
  if (overLevelKeys.length > 0) issues.push(`Some infusions exceed the current artificer level: ${overLevelKeys.join(', ')}.`)

  return {
    key: 'artificer_infusion_selections',
    passed: issues.length === 0,
    message: issues.length === 0
      ? `Artificer infusion selections are valid (${activeChoices.length}/${required}).`
      : issues.join(' '),
    severity: 'error',
  }
}

export function checkSubclassFeatureOptionSelections(input: LegalityInput): LegalityCheck {
  const missing: string[] = []

  for (const cls of input.classes) {
    const subclass = cls.subclass
    if (!subclass || subclass.source !== 'PHB') continue

    if (subclass.name === 'Battle Master') {
      const required = cls.level >= 15 ? 9 : cls.level >= 10 ? 7 : cls.level >= 7 ? 5 : cls.level >= 3 ? 3 : 0
      const selected = countSelectedFeatureOptions(input, BATTLE_MASTER_MANEUVER_GROUP_KEY)
      if (selected < required) missing.push(`Battle Master maneuvers (${selected}/${required})`)
    }

    if (subclass.name === 'Hunter') {
      const hunterGroups = [
        { minimumLevel: 3, groupKey: HUNTER_PREY_GROUP_KEY, label: "Hunter's Prey" },
        { minimumLevel: 7, groupKey: HUNTER_DEFENSIVE_TACTICS_GROUP_KEY, label: 'Defensive Tactics' },
        { minimumLevel: 11, groupKey: HUNTER_MULTIATTACK_GROUP_KEY, label: 'Multiattack' },
        { minimumLevel: 15, groupKey: HUNTER_SUPERIOR_DEFENSE_GROUP_KEY, label: "Superior Hunter's Defense" },
      ] as const

      for (const group of hunterGroups) {
        if (cls.level < group.minimumLevel) continue
        if (!hasSelectedFeatureOption(input, group.groupKey)) {
          missing.push(`Hunter ${group.label}`)
        }
      }
    }

    if (subclass.name === 'Circle of the Land' && cls.level >= 2 && !hasSelectedFeatureOption(input, CIRCLE_OF_LAND_TERRAIN_GROUP_KEY)) {
      missing.push('Circle of the Land terrain')
    }

    if (subclass.name === 'Way of the Four Elements') {
      const required = cls.level >= 17 ? 4 : cls.level >= 11 ? 3 : cls.level >= 6 ? 2 : cls.level >= 3 ? 1 : 0
      const selected = countSelectedFeatureOptions(input, FOUR_ELEMENTS_DISCIPLINE_GROUP_KEY)
      if (selected < required) missing.push(`Way of the Four Elements disciplines (${selected}/${required})`)
    }
  }

  return {
    key: 'subclass_feature_option_selections',
    passed: missing.length === 0,
    message: missing.length === 0
      ? 'Required subclass feature option selections are present.'
      : `Missing subclass feature option selections: ${missing.join(', ')}.`,
    severity: 'error',
  }
}

function countSelectedFeatureOptions(
  input: LegalityInput,
  optionGroupKey: string,
  expectedValueKey = FEATURE_OPTION_VALUE_KEY
) {
  return getActiveFeatureOptionChoices(input.selectedFeatureOptions).filter((choice) => {
    if (choice.option_group_key !== optionGroupKey) return false
    const selectedValue = choice.selected_value?.[expectedValueKey]
    return typeof selectedValue === 'string' && selectedValue.length > 0
  }).length
}

function hasSelectedFeatureOption(
  input: LegalityInput,
  optionGroupKey: string,
  expectedValueKey = FEATURE_OPTION_VALUE_KEY
) {
  return countSelectedFeatureOptions(input, optionGroupKey, expectedValueKey) > 0
}
