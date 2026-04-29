import type { CheckSeverity, FeatPrerequisite } from '@/lib/types/database'
import {
  deriveCharacter,
  getAdjustedAbilityScores,
  type CharacterBuildContext,
} from '@/lib/characters/build-context'
import type { DerivedCharacter } from '@/lib/characters/derived'
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
  MAVERICK_ARCANE_BREAKTHROUGH_SOURCE_KEY,
} from '@/lib/characters/feature-grants'
import {
  getRestrictedSubclassRuleForSubclassRow,
  isRestrictedSubclassSpellSelectionValid,
} from '@/lib/characters/subclass-spell-restrictions'
import {
  getMaverickPreparedBreakthroughLevels,
  isMaverickSubclass,
  MAVERICK_BREAKTHROUGH_SOURCE_FEATURE_KEY,
} from '@/lib/characters/maverick'
import {
  ARTIFICER_CLASS_NAME,
  ARTIFICER_INFUSION_GROUP_KEY,
  getInfusionsKnown,
} from '@/lib/characters/infusions'
import { getSpeciesAbilityBonusChoiceConfig } from '@/lib/characters/species-ability-bonus-provenance'
import { allocateSkillChoices, getSpeciesSkillChoiceConfig } from '@/lib/characters/skill-provenance'
import { normalizeSkillKey, type SkillKey } from '@/lib/skills'

export interface LegalityCheck {
  key: string
  passed: boolean
  message: string
  severity: CheckSeverity
}

export interface LegalityResult {
  passed: boolean
  checks: LegalityCheck[]
  derived?: DerivedCharacter
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
  if (input.allowedSources.length === 0) {
    return {
      key: 'source_allowlist',
      passed: true,
      message: 'Campaign has no explicit source allowlist.',
      severity: 'error',
    }
  }

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

function checkLevelCap(input: LegalityInput, derived: DerivedCharacter): LegalityCheck {
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

function checkSkillProficiencies(input: LegalityInput, derived: DerivedCharacter): LegalityCheck {
  const classPool = new Set<SkillKey>((input.classes[0]?.skillChoices.from ?? []).map(normalizeSkillKey))
  const backgroundPool = new Set<SkillKey>((input.background?.skillChoiceFrom ?? []).map(normalizeSkillKey))
  const backgroundAuto = new Set(input.background?.skillProficiencies ?? [])
  const speciesConfig = getSpeciesSkillChoiceConfig(
    input.speciesName && input.speciesSource
      ? {
          id: input.speciesName.toLowerCase(),
          name: input.speciesName,
          size: input.speciesSize ?? 'medium',
          speed: input.speciesSpeed ?? 30,
          ability_score_bonuses: [],
          languages: input.speciesLanguages,
          traits: input.speciesTraits.map((trait) => trait.id),
          senses: input.speciesSenses,
          damage_resistances: input.speciesDamageResistances,
          condition_immunities: input.speciesConditionImmunities,
          source: input.speciesSource,
          amended: false,
          amendment_note: null,
        }
      : null
  )
  const speciesPool = speciesConfig?.from ?? new Set<SkillKey>()
  const selected = new Set(input.skillProficiencies.map(normalizeSkillKey))

  const invalid = Array.from(selected).filter((skill) => {
    if (backgroundAuto.has(skill)) return false
    return !classPool.has(skill) && !backgroundPool.has(skill) && !speciesPool.has(skill)
  })
  if (invalid.length > 0) {
    return {
      key: 'skill_proficiencies',
      passed: false,
      message: `Skill(s) not available to this build: ${invalid.join(', ')}.`,
      severity: 'error',
    }
  }

  const allocated = allocateSkillChoices({
    chosenSkills: Array.from(selected),
    classChoiceFrom: classPool,
    classChoiceCount: derived.choiceCaps.classSkillChoices,
    bgChoiceFrom: backgroundPool,
    bgChoiceCount: derived.choiceCaps.backgroundSkillChoices,
    speciesChoiceFrom: speciesPool,
    speciesChoiceCount: speciesConfig?.count ?? 0,
  })
  const classChosen = Array.from(allocated.classChosen)
  const backgroundChosen = Array.from(allocated.bgChosen)
  const speciesChosen = Array.from(allocated.speciesChosen)
  const overflowChosen = Array.from(allocated.manualChosen).filter((skill) => (
    classPool.has(skill) || backgroundPool.has(skill) || speciesPool.has(skill)
  ))

  if (overflowChosen.length > 0) {
    return {
      key: 'skill_proficiencies',
      passed: false,
      message: `Too many skill choices selected for the available class/background/species slots: ${overflowChosen.join(', ')}.`,
      severity: 'error',
    }
  }

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

  if (speciesChosen.length > (speciesConfig?.count ?? 0)) {
    return {
      key: 'skill_proficiencies',
      passed: false,
      message: `Too many species skill choices: selected ${speciesChosen.length}, maximum is ${speciesConfig?.count ?? 0}.`,
      severity: 'error',
    }
  }

  return {
    key: 'skill_proficiencies',
    passed: true,
    message: `Skill choices valid (${classChosen.length}/${derived.choiceCaps.classSkillChoices} class, ${backgroundChosen.length}/${derived.choiceCaps.backgroundSkillChoices} background, ${speciesChosen.length}/${speciesConfig?.count ?? 0} species).`,
    severity: 'error',
  }
}

function checkSpeciesAbilityBonusChoices(input: LegalityInput): LegalityCheck {
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

function checkAsiChoices(input: LegalityInput, derived: DerivedCharacter): LegalityCheck {
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

function checkSubclassTiming(derived: DerivedCharacter): LegalityCheck {
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

function checkFeatPrerequisite(prerequisite: FeatPrerequisite, input: LegalityInput, derived: DerivedCharacter): boolean {
  const adjustedScores = getAdjustedAbilityScores(input)
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
      return prerequisite.proficiency ? derived.proficiencies.all.includes(prerequisite.proficiency.toLowerCase()) : true
    case 'species':
      return checkSpeciesFeatPrerequisite(prerequisite, input)
    default:
      return true
  }
}

function normalizePrerequisiteValue(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_')
}

function inferSpeciesLineage(speciesName: string | null): string | null {
  if (!speciesName) return null
  const normalizedName = normalizePrerequisiteValue(speciesName.replace(/\(.+\)$/, '').trim())
  if (normalizedName === 'high_elf' || normalizedName === 'wood_elf' || normalizedName === 'dark_elf') return 'elf'
  return normalizedName || null
}

function checkSpeciesFeatPrerequisite(prerequisite: FeatPrerequisite, input: LegalityInput): boolean {
  const requiredSpecies = normalizePrerequisiteValue(prerequisite.species)
  const requiredLineage = normalizePrerequisiteValue(prerequisite.lineage)
  const speciesName = normalizePrerequisiteValue(input.speciesName)
  const speciesLineage = normalizePrerequisiteValue(input.speciesLineage ?? inferSpeciesLineage(input.speciesName))

  if (requiredSpecies && speciesName !== requiredSpecies) return false
  if (requiredLineage && speciesLineage !== requiredLineage) return false
  return true
}

function checkFeatPrerequisites(input: LegalityInput, derived: DerivedCharacter): LegalityCheck {
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

function checkFeatSlots(input: LegalityInput, derived: DerivedCharacter): LegalityCheck {
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

function checkSpellLegality(input: LegalityInput, derived: DerivedCharacter): LegalityCheck {
  const availableClassIds = new Set(input.classes.map((cls) => cls.classId))
  const grantedSpellIds = new Set(input.grantedSpellIds)
  const expandedSpellIds = new Set(input.expandedSpellIds)
  const invalid = input.selectedSpells.filter((spell) => {
    const matchesClass =
      spell.classes.some((classId) => availableClassIds.has(classId)) ||
      expandedSpellIds.has(spell.id) ||
      grantedSpellIds.has(spell.id) ||
      spell.grantedBySubclassIds.some((subclassId) =>
        input.classes.some((cls) => cls.subclass?.id === subclassId)
      )
    const inRange = spell.level === 0 || spell.level <= derived.maxSpellLevel
    return !matchesClass || !inRange
  })

  const restrictedSubclassViolations = input.classes.flatMap((cls) => {
    const rule = getRestrictedSubclassRuleForSubclassRow(cls.subclass, cls.level)
    if (!rule) return []

    const classSelectedSpells = input.selectedSpells.filter((spell) => (
      spell.level > 0
      && spell.countsAgainstSelectionLimit
      && spell.classes.includes(cls.classId)
      && !spell.grantedBySubclassIds.includes(cls.subclass?.id ?? '')
    ))
    const validity = isRestrictedSubclassSpellSelectionValid({
      selectedSpells: classSelectedSpells,
      rule,
    })
    if (validity.passed) return []

    return [`${cls.name} ${cls.subclass?.name} has ${validity.offSchoolCount} off-school spells but only ${validity.unrestrictedAllowance} are allowed.`]
  })

  return {
    key: 'spell_legality',
    passed: invalid.length === 0 && restrictedSubclassViolations.length === 0,
    message: invalid.length === 0 && restrictedSubclassViolations.length === 0
      ? 'Selected spells are valid for this build.'
      : [
          invalid.length > 0 ? `Invalid spell selections: ${invalid.map((spell) => spell.name).join(', ')}.` : null,
          ...restrictedSubclassViolations,
        ].filter(Boolean).join(' '),
    severity: 'error',
  }
}

function checkMaverickBreakthroughSelections(input: LegalityInput): LegalityCheck {
  const maverickClass = input.classes.find((cls) => cls.subclass && isMaverickSubclass(cls.subclass))
  if (!maverickClass) {
    return {
      key: 'maverick_breakthroughs',
      passed: true,
      message: 'No Maverick-specific spell selections to validate.',
      severity: 'error',
    }
  }

  const allowedLevels = new Set<number>(getMaverickPreparedBreakthroughLevels(maverickClass.level))
  const breakthroughSpells = input.selectedSpells.filter(
    (spell) => (
      spell.sourceFeatureKey === MAVERICK_BREAKTHROUGH_SOURCE_FEATURE_KEY
      || spell.sourceFeatureKey === MAVERICK_ARCANE_BREAKTHROUGH_SOURCE_KEY
    ) && spell.level > 0
  )

  const invalidLevels = breakthroughSpells
    .filter((spell) => !allowedLevels.has(spell.level))
    .map((spell) => spell.name)

  const overSelectedLevels = Array.from(allowedLevels).flatMap((level) => {
    const count = breakthroughSpells.filter((spell) => spell.level === level).length
    return count > 1 ? [`level ${level} (${count} selected)`] : []
  })

  return {
    key: 'maverick_breakthroughs',
    passed: invalidLevels.length === 0 && overSelectedLevels.length === 0,
    message: invalidLevels.length === 0 && overSelectedLevels.length === 0
      ? 'Maverick Breakthrough spell selections are valid.'
      : [
          invalidLevels.length > 0 ? `Invalid Breakthrough spell levels: ${invalidLevels.join(', ')}.` : null,
          overSelectedLevels.length > 0 ? `Too many Breakthrough spells selected for ${overSelectedLevels.join(', ')}.` : null,
        ].filter(Boolean).join(' '),
    severity: 'error',
  }
}

function checkSpellSelectionCount(input: LegalityInput, derived: DerivedCharacter): LegalityCheck {
  const sourceViolations = derived.spellcasting.sources.flatMap((source) => {
    const sourceSelections = input.selectedSpells.filter((spell) => {
      if (!spell.countsAgainstSelectionLimit) return false
      return (
        spell.classes.includes(source.classId) ||
        spell.grantedBySubclassIds.includes(
          input.classes.find((cls) => cls.classId === source.classId)?.subclass?.id ?? ''
        )
      )
    })

    const leveledSelected = sourceSelections.filter((spell) => spell.level > 0).length
    const cantripsSelected = sourceSelections.filter((spell) => spell.level === 0).length

    if (source.cantripSelectionCap !== null && cantripsSelected > source.cantripSelectionCap) {
      return [`${source.className} selected ${cantripsSelected} cantrips but the cap is ${source.cantripSelectionCap}.`]
    }
    if (leveledSelected > source.leveledSpellSelectionCap) {
      return [`${source.className} selected ${leveledSelected} leveled spells but the cap is ${source.leveledSpellSelectionCap}.`]
    }
    return []
  })

  if (derived.spellcasting.sources.length > 0) {
    return {
      key: 'spell_selection_count',
      passed: sourceViolations.length === 0,
      message: sourceViolations.length === 0
        ? `Spell selections fit current source caps for ${derived.spellcasting.sources.map((source) => source.className).join(', ')}.`
        : sourceViolations.join(' '),
      severity: 'error',
    }
  }

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

function checkFightingStyleSelections(input: LegalityInput): LegalityCheck {
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

function checkArtificerInfusionSelections(input: LegalityInput): LegalityCheck {
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

function checkSubclassFeatureOptionSelections(input: LegalityInput): LegalityCheck {
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
