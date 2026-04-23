import type { SpellcastingMode, SpellcastingProgression } from '@/lib/types/database'

export function resolvePreparedSpellCap(args: {
  profile: SpellcastingProgression
  classLevel: number
  abilityModifier: number
}): number {
  const { profile, classLevel, abilityModifier } = args

  let preparedBase = classLevel
  switch (profile.prepared_formula) {
    case 'class_level':
      preparedBase = classLevel
      break
    case 'half_level_down':
      preparedBase = Math.floor(classLevel / 2)
      break
    case 'half_level_up':
      preparedBase = Math.ceil(classLevel / 2)
      break
    case 'third_level_down':
      preparedBase = Math.floor(classLevel / 3)
      break
    case 'third_level_up':
      preparedBase = Math.ceil(classLevel / 3)
      break
    case 'fixed':
      preparedBase = profile.prepared_fixed ?? 0
      break
    default:
      preparedBase = classLevel
      break
  }

  const totalPrepared = preparedBase + (profile.prepared_add_ability_mod ? abilityModifier : 0)
  return Math.max(profile.prepared_min ?? 0, totalPrepared)
}

export function resolveSpellbookSpellCount(
  profile: SpellcastingProgression,
  classLevel: number
): number {
  const indexedCount = profile.spellbook_spells_by_level?.[Math.max(classLevel - 1, 0)]
  if (typeof indexedCount === 'number') {
    return indexedCount
  }

  // Older local data may not have the new spellbook progression field yet.
  return 6 + Math.max(0, classLevel - 1) * 2
}

export function resolveLeveledSpellSelectionCap(args: {
  profile: SpellcastingProgression
  classLevel: number
  abilityModifier: number
}): number {
  const { profile, classLevel, abilityModifier } = args

  if (profile.mode === 'known') {
    return profile.spells_known_by_level?.[Math.max(classLevel - 1, 0)] ?? 0
  }

  if (profile.mode === 'spellbook') {
    return resolveSpellbookSpellCount(profile, classLevel)
  }

  if (profile.mode === 'prepared') {
    return resolvePreparedSpellCap({ profile, classLevel, abilityModifier })
  }

  return 0
}

export function buildSpellSelectionSummary(args: {
  className: string
  classLevel: number
  mode: SpellcastingMode
  leveledSelectionCap: number
  preparedSpellCap?: number | null
}): string | null {
  const { className, classLevel, mode, leveledSelectionCap, preparedSpellCap = null } = args

  if (mode === 'known') {
    return `${className} knows ${leveledSelectionCap} leveled spells at level ${classLevel}.`
  }

  if (mode === 'spellbook') {
    if (preparedSpellCap !== null) {
      return `${className} has ${leveledSelectionCap} leveled spells in its spellbook and can prepare ${preparedSpellCap} of them.`
    }
    return `${className} has ${leveledSelectionCap} leveled spells in its spellbook.`
  }

  if (mode === 'prepared') {
    return `${className} can prepare ${leveledSelectionCap} spells.`
  }

  return null
}
