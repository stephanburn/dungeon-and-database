import { getAdjustedAbilityScores } from '@/lib/characters/build-context'
import type { DerivedCharacter } from '@/lib/characters/derived'
import { getSpeciesAbilityBonusChoiceConfig } from '@/lib/characters/species-ability-bonus-provenance'
import type { LegalityCheck, LegalityInput } from './types'

const POINT_BUY_BUDGET = 27
const POINT_BUY_COST = [0, 1, 2, 3, 4, 5, 7, 9]
const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8]

export function checkStatMethodConsistency(input: LegalityInput): LegalityCheck {
  const passed = input.statMethod === input.campaignSettings.stat_method
  return {
    key: 'stat_method_consistency',
    passed,
    message: passed
      ? 'Stat generation method matches campaign setting.'
      : `Campaign requires ${input.campaignSettings.stat_method} but character uses ${input.statMethod}.`,
    severity: 'error',
  }
}

export function checkStatMethod(input: LegalityInput): LegalityCheck {
  const scores = Object.values(input.baseStats)

  if (input.statMethod === 'point_buy') {
    let total = 0
    const invalid: number[] = []
    for (const score of scores) {
      const cost = pointBuyCost(score)
      if (cost === null) invalid.push(score)
      else total += cost
    }
    if (invalid.length > 0) {
      return {
        key: 'stat_method',
        passed: false,
        message: `Point buy scores must be between 8 and 15. Invalid scores: ${invalid.join(', ')}.`,
        severity: 'error',
      }
    }
    return {
      key: 'stat_method',
      passed: total === POINT_BUY_BUDGET,
      message: total === POINT_BUY_BUDGET
        ? 'Point buy scores are valid.'
        : `Point buy total must be exactly ${POINT_BUY_BUDGET} points. Current total: ${total}.`,
      severity: 'error',
    }
  }

  if (input.statMethod === 'standard_array') {
    const sorted = [...scores].sort((a, b) => b - a)
    const expected = [...STANDARD_ARRAY].sort((a, b) => b - a)
    const passed = sorted.every((value, index) => value === expected[index])
    return {
      key: 'stat_method',
      passed,
      message: passed
        ? 'Standard array scores are valid.'
        : `Standard array must use exactly [${STANDARD_ARRAY.join(', ')}]. Got [${sorted.join(', ')}].`,
      severity: 'error',
    }
  }

  const covered = new Set(input.statRolls.map((row) => row.assigned_to))
  const missing = ['str', 'dex', 'con', 'int', 'wis', 'cha'].filter((ability) => !covered.has(ability))
  if (missing.length > 0) {
    return {
      key: 'stat_method',
      passed: false,
      message: `Rolled stats missing assignments for: ${missing.join(', ')}.`,
      severity: 'error',
    }
  }

  const invalidRolls = input.statRolls.some((row) => row.roll_set.length !== 4)
  return {
    key: 'stat_method',
    passed: !invalidRolls,
    message: invalidRolls
      ? 'Each rolled stat must have exactly 4 dice values recorded.'
      : 'Rolled stats are valid.',
    severity: 'error',
  }
}

export function checkLevelCap(input: LegalityInput, derived: DerivedCharacter): LegalityCheck {
  if (derived.totalLevel === 0) {
    return {
      key: 'level_cap',
      passed: false,
      message: 'Character must have at least one class level.',
      severity: 'error',
    }
  }
  const passed = derived.totalLevel <= input.campaignSettings.max_level
  return {
    key: 'level_cap',
    passed,
    message: passed
      ? `Character level (${derived.totalLevel}) is within the campaign maximum (${input.campaignSettings.max_level}).`
      : `Character level (${derived.totalLevel}) exceeds the campaign maximum (${input.campaignSettings.max_level}).`,
    severity: 'error',
  }
}

export function checkSpeciesAbilityBonusChoices(input: LegalityInput): LegalityCheck {
  const config = getSpeciesAbilityBonusChoiceConfig(
    input.speciesName && input.speciesSource
      ? {
          id: input.speciesName.toLowerCase(),
          name: input.speciesName,
          size: input.speciesSize ?? 'medium',
          speed: input.speciesSpeed ?? 30,
          ability_score_bonuses: [],
          languages: input.speciesLanguages,
          traits: [],
          senses: input.speciesSenses,
          damage_resistances: input.speciesDamageResistances,
          condition_immunities: input.speciesConditionImmunities,
          source: input.speciesSource,
          amended: false,
          amendment_note: null,
        }
      : null
  )

  const selectedAbilities = Object.entries(input.selectedAbilityBonuses)
    .filter(([, bonus]) => (bonus ?? 0) > 0)
    .map(([ability]) => ability)

  if (!config) {
    return {
      key: 'species_ability_bonus_choices',
      passed: selectedAbilities.length === 0,
      message: selectedAbilities.length === 0
        ? 'Species ability bonus choices are valid.'
        : 'This species does not grant flexible ability score choices.',
      severity: 'error',
    }
  }

  if (selectedAbilities.length > config.count) {
    return {
      key: 'species_ability_bonus_choices',
      passed: false,
      message: `Too many flexible species ability bonuses selected: ${selectedAbilities.length}/${config.count}.`,
      severity: 'error',
    }
  }

  const invalidAbilities = selectedAbilities.filter((ability) => !config.allowedAbilities.includes(ability as typeof config.allowedAbilities[number]))
  if (invalidAbilities.length > 0) {
    return {
      key: 'species_ability_bonus_choices',
      passed: false,
      message: `Invalid flexible species ability choices: ${invalidAbilities.join(', ')}.`,
      severity: 'error',
    }
  }

  const invalidBonusValue = selectedAbilities.some((ability) => (input.selectedAbilityBonuses[ability as keyof typeof input.selectedAbilityBonuses] ?? 0) !== config.bonus)
  if (invalidBonusValue) {
    return {
      key: 'species_ability_bonus_choices',
      passed: false,
      message: `Flexible species ability bonuses must all be +${config.bonus}.`,
      severity: 'error',
    }
  }

  return {
    key: 'species_ability_bonus_choices',
    passed: true,
    message: `Species ability bonus choices valid (${selectedAbilities.length}/${config.count}).`,
    severity: 'error',
  }
}

export function checkAsiChoices(input: LegalityInput, derived: DerivedCharacter): LegalityCheck {
  const invalidSlots = input.asiChoiceSlots.flatMap((slot) => {
    if (derived.featSlots[slot.slotIndex]?.choiceKind === 'feat_only') {
      return [`Slot ${slot.slotIndex + 1} grants a feat and cannot take ASI bonuses.`]
    }
    const totalBonus = Object.values(slot.bonuses).reduce((sum, bonus) => sum + (bonus ?? 0), 0)
    const invalidAbilityBonus = Object.values(slot.bonuses).some((bonus) => (bonus ?? 0) > 2)
    if (invalidAbilityBonus || totalBonus > 2) {
      return [`ASI slot ${slot.slotIndex + 1} exceeds the normal +2 total.`]
    }
    return []
  })

  if (input.asiChoiceSlots.length + input.selectedFeats.length > derived.choiceCaps.featSlots) {
    return {
      key: 'asi_choices',
      passed: false,
      message: `Progression ASI and feat selections exceed available slots (${derived.choiceCaps.featSlots}).`,
      severity: 'error',
    }
  }

  return {
    key: 'asi_choices',
    passed: invalidSlots.length === 0,
    message: invalidSlots.length === 0
      ? `ASI choices fit available slots (${input.asiChoiceSlots.length}/${derived.choiceCaps.featSlots}).`
      : invalidSlots.join(' '),
    severity: 'error',
  }
}

export function checkMulticlassPrerequisites(input: LegalityInput): LegalityCheck {
  const adjustedScores = getAdjustedAbilityScores(input)
  const violations = input.classes
    .slice(1)
    .flatMap((cls) =>
      cls.multiclassPrereqs
        .filter((prereq) => {
          const ability = prereq.ability.toLowerCase() as keyof typeof adjustedScores
          return (adjustedScores[ability] ?? 0) < prereq.min
        })
        .map((prereq) => `${cls.name} requires ${prereq.ability.toUpperCase()} ${prereq.min}`)
    )

  return {
    key: 'multiclass_prerequisites',
    passed: violations.length === 0,
    message: violations.length === 0
      ? 'All multiclass prerequisites are satisfied.'
      : violations.join('; '),
    severity: 'error',
  }
}

export function checkSubclassTiming(derived: DerivedCharacter): LegalityCheck {
  const problems = derived.subclassRequirements.flatMap((entry) => {
    const messages: string[] = []
    if (entry.missingRequiredSubclass) {
      messages.push(`${entry.className} requires a subclass by level ${entry.requiredAt}.`)
    }
    if (entry.selectedTooEarly) {
      messages.push(`${entry.className} cannot take ${entry.subclassName} before level ${entry.requiredAt}.`)
    }
    return messages
  })

  return {
    key: 'subclass_timing',
    passed: problems.length === 0,
    message: problems.length === 0
      ? 'Subclass choices match class progression.'
      : problems.join(' '),
    severity: 'error',
  }
}

function pointBuyCost(score: number): number | null {
  const idx = score - 8
  if (idx < 0 || idx >= POINT_BUY_COST.length) return null
  return POINT_BUY_COST[idx]
}
