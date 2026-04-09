import type { CheckSeverity, FeatPrerequisite } from '@/lib/types/database'
import {
  collectKnownProficiencies,
  deriveCharacterProgression,
  getAdjustedAbilityScores,
  type CharacterBuildContext,
  type CharacterProgressionSummary,
} from '@/lib/characters/build-context'
import { normalizeSkillKey } from '@/lib/skills'

export interface LegalityCheck {
  key: string
  passed: boolean
  message: string
  severity: CheckSeverity
}

export interface LegalityResult {
  passed: boolean
  checks: LegalityCheck[]
  derived?: CharacterProgressionSummary
}

export type LegalityInput = CharacterBuildContext

const POINT_BUY_BUDGET = 27
const POINT_BUY_COST = [0, 1, 2, 3, 4, 5, 7, 9]
const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8]

function pointBuyCost(score: number): number | null {
  const idx = score - 8
  if (idx < 0 || idx >= POINT_BUY_COST.length) return null
  return POINT_BUY_COST[idx]
}

function checkSourceAllowlist(input: LegalityInput): LegalityCheck {
  const allowed = new Set(input.allowedSources)
  const violations: string[] = []

  if (input.speciesSource && !allowed.has(input.speciesSource)) {
    violations.push(`species (${input.speciesSource})`)
  }
  if (input.background && !allowed.has(input.background.source)) {
    violations.push(`background (${input.background.source})`)
  }
  for (const src of input.sourceCollections.classSources) {
    if (!allowed.has(src)) violations.push(`class (${src})`)
  }
  for (const src of input.sourceCollections.subclassSources) {
    if (!allowed.has(src)) violations.push(`subclass (${src})`)
  }
  for (const src of input.sourceCollections.spellSources) {
    if (!allowed.has(src)) violations.push(`spell (${src})`)
  }
  for (const src of input.sourceCollections.featSources) {
    if (!allowed.has(src)) violations.push(`feat (${src})`)
  }

  return {
    key: 'source_allowlist',
    passed: violations.length === 0,
    message: violations.length === 0
      ? 'All content sources are allowed.'
      : `Content from disallowed sources: ${violations.join(', ')}.`,
    severity: 'error',
  }
}

function checkRuleSetConsistency(input: LegalityInput): LegalityCheck {
  const usedSources = [
    input.speciesSource,
    input.background?.source ?? null,
    ...input.sourceCollections.classSources,
    ...input.sourceCollections.subclassSources,
    ...input.sourceCollections.spellSources,
    ...input.sourceCollections.featSources,
  ].filter((value): value is string => Boolean(value))

  const mismatches: string[] = []
  for (const source of usedSources) {
    const sourceRuleSet = input.allSourceRuleSets[source]
    if (sourceRuleSet && sourceRuleSet !== input.campaignRuleSet && !mismatches.includes(source)) {
      mismatches.push(source)
    }
  }

  return {
    key: 'rule_set_consistency',
    passed: mismatches.length === 0,
    message: mismatches.length === 0
      ? `All content matches campaign rule set (${input.campaignRuleSet}).`
      : `Campaign uses ${input.campaignRuleSet} rules but content from incompatible sources: ${mismatches.join(', ')}.`,
    severity: 'warning',
  }
}

function checkStatMethodConsistency(input: LegalityInput): LegalityCheck {
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

function checkStatMethod(input: LegalityInput): LegalityCheck {
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

function checkLevelCap(input: LegalityInput, derived: CharacterProgressionSummary): LegalityCheck {
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

function checkSkillProficiencies(input: LegalityInput, derived: CharacterProgressionSummary): LegalityCheck {
  const classPool = new Set((input.classes[0]?.skillChoices.from ?? []).map(normalizeSkillKey))
  const backgroundPool = new Set(input.background?.skillChoiceFrom ?? [])
  const backgroundAuto = new Set(input.background?.skillProficiencies ?? [])
  const selected = new Set(input.skillProficiencies.map(normalizeSkillKey))

  const invalid = Array.from(selected).filter((skill) => {
    if (backgroundAuto.has(skill)) return false
    return !classPool.has(skill) && !backgroundPool.has(skill)
  })
  if (invalid.length > 0) {
    return {
      key: 'skill_proficiencies',
      passed: false,
      message: `Skill(s) not available to this build: ${invalid.join(', ')}.`,
      severity: 'error',
    }
  }

  const classChosen = Array.from(selected).filter((skill) => classPool.has(skill))
  const backgroundChosen = Array.from(selected).filter(
    (skill) => !classPool.has(skill) && backgroundPool.has(skill)
  )

  if (classChosen.length > derived.choiceCaps.classSkillChoices) {
    return {
      key: 'skill_proficiencies',
      passed: false,
      message: `Too many class skill choices: selected ${classChosen.length}, maximum is ${derived.choiceCaps.classSkillChoices}.`,
      severity: 'error',
    }
  }

  if (backgroundChosen.length > derived.choiceCaps.backgroundSkillChoices) {
    return {
      key: 'skill_proficiencies',
      passed: false,
      message: `Too many background skill choices: selected ${backgroundChosen.length}, maximum is ${derived.choiceCaps.backgroundSkillChoices}.`,
      severity: 'error',
    }
  }

  return {
    key: 'skill_proficiencies',
    passed: true,
    message: `Skill choices valid (${classChosen.length}/${derived.choiceCaps.classSkillChoices} class, ${backgroundChosen.length}/${derived.choiceCaps.backgroundSkillChoices} background).`,
    severity: 'error',
  }
}

function checkMulticlassPrerequisites(input: LegalityInput): LegalityCheck {
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

function checkSubclassTiming(derived: CharacterProgressionSummary): LegalityCheck {
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

function checkFeatPrerequisite(prerequisite: FeatPrerequisite, input: LegalityInput, derived: CharacterProgressionSummary): boolean {
  const adjustedScores = getAdjustedAbilityScores(input)
  const knownProficiencies = collectKnownProficiencies(input)
  const unlockedFeatures = new Set(derived.unlockedFeatures.map((feature) => feature.toLowerCase()))

  switch (prerequisite.type) {
    case 'ability': {
      const ability = prerequisite.ability?.toLowerCase() as keyof typeof adjustedScores | undefined
      return ability ? (adjustedScores[ability] ?? 0) >= (prerequisite.min ?? 0) : true
    }
    case 'level':
      return derived.totalLevel >= (prerequisite.min ?? 0)
    case 'spellcasting':
      return input.classes.some((cls) => cls.spellcastingType && cls.spellcastingType !== 'none')
    case 'feature':
      return prerequisite.feature ? unlockedFeatures.has(prerequisite.feature.toLowerCase()) : true
    case 'proficiency':
      return prerequisite.proficiency ? knownProficiencies.has(prerequisite.proficiency.toLowerCase()) : true
    default:
      return true
  }
}

function checkFeatPrerequisites(input: LegalityInput, derived: CharacterProgressionSummary): LegalityCheck {
  const invalid = input.selectedFeats.filter((feat) =>
    feat.prerequisites.some((prerequisite) => !checkFeatPrerequisite(prerequisite, input, derived))
  )

  return {
    key: 'feat_prerequisites',
    passed: invalid.length === 0,
    message: invalid.length === 0
      ? 'All selected feats meet their prerequisites.'
      : `Feat prerequisites not met: ${invalid.map((feat) => feat.name).join(', ')}.`,
    severity: 'error',
  }
}

function checkFeatSlots(input: LegalityInput, derived: CharacterProgressionSummary): LegalityCheck {
  const selectedCount = input.selectedFeats.length
  const backgroundFeatCount = input.backgroundFeat ? 1 : 0
  const effectiveCount = selectedCount + backgroundFeatCount

  return {
    key: 'feat_slots',
    passed: selectedCount <= derived.choiceCaps.featSlots,
    message: selectedCount <= derived.choiceCaps.featSlots
      ? `Feat choices fit available progression slots (${effectiveCount} total including background).`
      : `Selected ${selectedCount} progression feats but only ${derived.choiceCaps.featSlots} ASI/feat slots are available.`,
    severity: 'error',
  }
}

function checkSpellLegality(input: LegalityInput, derived: CharacterProgressionSummary): LegalityCheck {
  const availableClassIds = new Set(input.classes.map((cls) => cls.classId))
  const grantedSpellIds = new Set(input.grantedSpellIds)
  const invalid = input.selectedSpells.filter((spell) => {
    const matchesClass =
      spell.classes.some((classId) => availableClassIds.has(classId)) ||
      grantedSpellIds.has(spell.id) ||
      spell.grantedBySubclassIds.some((subclassId) =>
        input.classes.some((cls) => cls.subclass?.id === subclassId)
      )
    const inRange = spell.level === 0 || spell.level <= derived.maxSpellLevel
    return !matchesClass || !inRange
  })

  return {
    key: 'spell_legality',
    passed: invalid.length === 0,
    message: invalid.length === 0
      ? 'Selected spells are valid for this build.'
      : `Invalid spell selections: ${invalid.map((spell) => spell.name).join(', ')}.`,
    severity: 'error',
  }
}

function checkSpellSelectionCount(input: LegalityInput, derived: CharacterProgressionSummary): LegalityCheck {
  const cappedSelections = input.selectedSpells.filter((spell) => spell.countsAgainstSelectionLimit)
  const leveledSpells = cappedSelections.filter((spell) => spell.level > 0)
  const cantrips = cappedSelections.filter((spell) => spell.level === 0)
  const totalLeveledSelected = leveledSpells.length
  const cantripCapPassed = derived.cantripSelectionCap === null || cantrips.length <= derived.cantripSelectionCap
  const canSelectSpells =
    (derived.maxSpellLevel > 0 || input.selectedSpells.length === 0) &&
    totalLeveledSelected <= derived.leveledSpellSelectionCap &&
    cantripCapPassed

  return {
    key: 'spell_selection_count',
    passed: canSelectSpells,
    message: canSelectSpells
      ? `Spell selections fit the current build (${totalLeveledSelected}/${derived.leveledSpellSelectionCap} leveled, ${cantrips.length}/${derived.cantripSelectionCap ?? cantrips.length} cantrips).`
      : !cantripCapPassed
          ? `Selected ${cantrips.length} cantrips but the current cap is ${derived.cantripSelectionCap}.`
        : derived.maxSpellLevel > 0
          ? `Selected ${totalLeveledSelected} leveled spells but the current class cap is ${derived.leveledSpellSelectionCap}.`
          : 'This build cannot currently support spell selections.',
    severity: 'error',
  }
}

export function runLegalityChecks(input: LegalityInput): LegalityResult {
  const derived = deriveCharacterProgression(input)
  const checks: LegalityCheck[] = [
    checkSourceAllowlist(input),
    checkRuleSetConsistency(input),
    checkStatMethodConsistency(input),
    checkStatMethod(input),
    checkLevelCap(input, derived),
    checkSkillProficiencies(input, derived),
    checkMulticlassPrerequisites(input),
    checkSubclassTiming(derived),
    checkFeatPrerequisites(input, derived),
    checkFeatSlots(input, derived),
    checkSpellLegality(input, derived),
    checkSpellSelectionCount(input, derived),
  ]

  const passed = checks
    .filter((check) => check.severity === 'error')
    .every((check) => check.passed)

  return { passed, checks, derived }
}

export function shouldBlockCharacterSubmit(result: LegalityResult | null): boolean {
  return !!result && !result.passed
}
