import { isMaverickArcaneBreakthroughSourceKey } from '@/lib/characters/rule-handlers'
import {
  getRestrictedSubclassRuleForSubclassRow,
  isRestrictedSubclassSpellSelectionValid,
} from '@/lib/characters/subclass-spell-restrictions'
import {
  getMaverickPreparedBreakthroughLevels,
  isMaverickSubclass,
} from '@/lib/characters/maverick'
import type { DerivedCharacter } from '@/lib/characters/derived'
import type { LegalityCheck, LegalityInput } from './types'

export function checkSpellLegality(input: LegalityInput, derived: DerivedCharacter): LegalityCheck {
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

export function checkMaverickBreakthroughSelections(input: LegalityInput): LegalityCheck {
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
    (spell) => isMaverickArcaneBreakthroughSourceKey(spell.sourceFeatureKey) && spell.level > 0
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

export function checkSpellSelectionCount(input: LegalityInput, derived: DerivedCharacter): LegalityCheck {
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
