import type { DerivedAsiFeatHistoryEntry } from '@/lib/characters/derived'
import type { AbilityKey, CharacterBuildContext } from '@/lib/characters/build-context-types'

const ABILITY_LABELS: Record<AbilityKey, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
}

function formatAsiDetail(rows: CharacterBuildContext['selectedAsiChoices']) {
  const parts = rows
    .slice()
    .sort((left, right) => left.ability.localeCompare(right.ability))
    .map((row) => `+${row.bonus} ${ABILITY_LABELS[row.ability]}`)

  return parts.join(' / ')
}

export function deriveAsiFeatHistory(context: CharacterBuildContext): DerivedAsiFeatHistoryEntry[] {
  const levelById = new Map(context.classLevelAnchors.map((level) => [level.id, level]))
  const asiGroups = new Map<string, CharacterBuildContext['selectedAsiChoices']>()

  for (const row of context.selectedAsiChoices) {
    const key = `${row.slotIndex}:${row.characterLevelId ?? 'unanchored'}`
    asiGroups.set(key, [...(asiGroups.get(key) ?? []), row])
  }

  const asiEntries: DerivedAsiFeatHistoryEntry[] = Array.from(asiGroups.entries()).map(([key, rows]) => {
    const first = rows[0]
    const level = first?.characterLevelId ? levelById.get(first.characterLevelId) ?? null : null
    return {
      id: `asi:${key}`,
      type: 'asi',
      label: 'Ability Score Improvement',
      detail: formatAsiDetail(rows),
      classId: level?.classId ?? null,
      className: level?.className ?? null,
      levelNumber: level?.levelNumber ?? null,
      takenAt: level?.takenAt ?? null,
      sourceFeatureKey: first?.sourceFeatureKey ?? null,
    }
  })

  const featEntries: DerivedAsiFeatHistoryEntry[] = context.selectedFeatChoices.map((row) => {
    const level = row.characterLevelId ? levelById.get(row.characterLevelId) ?? null : null
    return {
      id: `feat:${row.id}`,
      type: 'feat',
      label: row.featName,
      detail: row.choiceKind === 'feat_only' ? 'Feat-only slot' : 'Feat selected instead of ASI',
      classId: level?.classId ?? null,
      className: level?.className ?? null,
      levelNumber: level?.levelNumber ?? null,
      takenAt: level?.takenAt ?? null,
      sourceFeatureKey: row.sourceFeatureKey,
    }
  })

  return [...asiEntries, ...featEntries].sort((left, right) => {
    const leftTime = left.takenAt ?? ''
    const rightTime = right.takenAt ?? ''
    if (leftTime !== rightTime) return leftTime.localeCompare(rightTime)
    return (left.levelNumber ?? 0) - (right.levelNumber ?? 0)
  })
}
