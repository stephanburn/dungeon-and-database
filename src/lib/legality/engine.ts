import { deriveCharacter } from '@/lib/characters/build-context'
import type { DerivedCharacter } from '@/lib/characters/derived'
import {
  checkAsiChoices,
  checkLevelCap,
  checkMulticlassPrerequisites,
  checkSpeciesAbilityBonusChoices,
  checkStatMethod,
  checkStatMethodConsistency,
  checkSubclassTiming,
} from './ability-checks'
import {
  checkArtificerInfusionSelections,
  checkFightingStyleSelections,
  checkSubclassFeatureOptionSelections,
} from './feature-option-checks'
import { checkFeatPrerequisites, checkFeatSlots } from './feat-checks'
import { checkSkillProficiencies } from './proficiency-checks'
import { checkRuleSetConsistency, checkSourceAllowlist } from './source-checks'
import {
  checkMaverickBreakthroughSelections,
  checkSpellLegality,
  checkSpellSelectionCount,
} from './spell-checks'
import type { LegalityCheck, LegalityInput, LegalityResult } from './types'

export type { LegalityCheck, LegalityInput, LegalityResult } from './types'

export function runLegalityChecks(input: LegalityInput): LegalityResult {
  const baseDerived = deriveCharacter(input)
  const checks: LegalityCheck[] = [
    checkSourceAllowlist(input),
    checkRuleSetConsistency(input),
    checkStatMethodConsistency(input),
    checkStatMethod(input),
    checkLevelCap(input, baseDerived),
    checkSkillProficiencies(input, baseDerived),
    checkSpeciesAbilityBonusChoices(input),
    checkAsiChoices(input, baseDerived),
    checkMulticlassPrerequisites(input),
    checkSubclassTiming(baseDerived),
    checkFeatPrerequisites(input, baseDerived),
    checkFeatSlots(input, baseDerived),
    checkSpellLegality(input, baseDerived),
    checkMaverickBreakthroughSelections(input),
    checkFightingStyleSelections(input),
    checkSubclassFeatureOptionSelections(input),
    checkArtificerInfusionSelections(input),
    checkSpellSelectionCount(input, baseDerived),
  ]

  const passed = checks
    .filter((check) => check.severity === 'error')
    .every((check) => check.passed)

  const derived: DerivedCharacter = {
    ...baseDerived,
    blockingIssues: checks
      .filter((check) => !check.passed && check.severity === 'error')
      .map((check) => ({
        key: check.key,
        message: check.message,
        severity: check.severity,
      })),
    warnings: checks
      .filter((check) => !check.passed && check.severity === 'warning')
      .map((check) => ({
        key: check.key,
        message: check.message,
        severity: check.severity,
      })),
  }

  return { passed, checks, derived }
}

export function shouldBlockCharacterSubmit(result: LegalityResult | null): boolean {
  return !!result && !result.passed
}
