import type { Spell, Subclass } from '@/lib/types/database'

type RestrictedSubclassConfig = {
  spellListClassName: string
  restrictedSchools: string[]
}

export type RestrictedSubclassSpellRule = RestrictedSubclassConfig & {
  unrestrictedLeveledSpellAllowance: number
}

const PHB_RESTRICTED_SUBCLASS_CONFIGS: Record<string, RestrictedSubclassConfig> = {
  'Arcane Trickster': {
    spellListClassName: 'Wizard',
    restrictedSchools: ['enchantment', 'illusion'],
  },
  'Eldritch Knight': {
    spellListClassName: 'Wizard',
    restrictedSchools: ['abjuration', 'evocation'],
  },
}

export function getRestrictedSubclassSpellRule(args: {
  subclassName: string | null | undefined
  subclassSource: string | null | undefined
  classLevel: number
}): RestrictedSubclassSpellRule | null {
  if (args.subclassSource !== 'PHB' || !args.subclassName) return null

  const config = PHB_RESTRICTED_SUBCLASS_CONFIGS[args.subclassName]
  if (!config) return null

  return {
    ...config,
    unrestrictedLeveledSpellAllowance: getRestrictedSubclassOffSchoolAllowance(args.classLevel),
  }
}

export function getRestrictedSubclassOffSchoolAllowance(classLevel: number) {
  if (classLevel < 3) return 0

  let allowance = 1
  if (classLevel >= 8) allowance += 1
  if (classLevel >= 14) allowance += 1
  if (classLevel >= 20) allowance += 1
  return allowance
}

export function isSpellInRestrictedSubclassSchool(
  spell: Pick<Spell, 'school'> | { school?: string | null | undefined },
  rule: Pick<RestrictedSubclassSpellRule, 'restrictedSchools'>
) {
  if (!spell.school) return false
  return rule.restrictedSchools.includes(spell.school.toLowerCase())
}

export function isRestrictedSubclassSpellSelectionValid(args: {
  selectedSpells: Array<Pick<Spell, 'level' | 'school'> | { level: number; school?: string | null | undefined }>
  rule: RestrictedSubclassSpellRule
}) {
  const offSchoolCount = args.selectedSpells.filter((spell) => (
    spell.level > 0 && !isSpellInRestrictedSubclassSchool(spell, args.rule)
  )).length

  return {
    passed: offSchoolCount <= args.rule.unrestrictedLeveledSpellAllowance,
    offSchoolCount,
    unrestrictedAllowance: args.rule.unrestrictedLeveledSpellAllowance,
  }
}

export function filterRestrictedSubclassSpellOptions(args: {
  spells: Spell[]
  selectedSpellIds: string[]
  rule: RestrictedSubclassSpellRule | null
}) {
  if (!args.rule) return args.spells
  const rule = args.rule

  const selectedSpellIdSet = new Set(args.selectedSpellIds)
  const selectedOffSchoolCount = args.spells.filter((spell) => (
    selectedSpellIdSet.has(spell.id)
    && spell.level > 0
    && !isSpellInRestrictedSubclassSchool(spell, rule)
  )).length
  const hasOpenOffSchoolSlot = selectedOffSchoolCount < rule.unrestrictedLeveledSpellAllowance

  return args.spells.filter((spell) => (
    spell.level === 0
    || isSpellInRestrictedSubclassSchool(spell, rule)
    || selectedSpellIdSet.has(spell.id)
    || hasOpenOffSchoolSlot
  ))
}

export function getRestrictedSubclassRuleForSubclassRow(
  subclass: Pick<Subclass, 'name' | 'source'> | null | undefined,
  classLevel: number
) {
  return getRestrictedSubclassSpellRule({
    subclassName: subclass?.name ?? null,
    subclassSource: subclass?.source ?? null,
    classLevel,
  })
}
