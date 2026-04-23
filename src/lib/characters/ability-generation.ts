export const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const

export type AbilityKey = (typeof ABILITY_KEYS)[number]

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8] as const

export const POINT_BUY_COST: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
}

export type RolledStatSet = {
  id: string
  rolls: number[]
}

export type StatRollRow = {
  assigned_to: AbilityKey
  roll_set: number[]
}

export function totalPointBuySpend(values: Record<AbilityKey, number>) {
  return ABILITY_KEYS.reduce((sum, key) => sum + (POINT_BUY_COST[values[key]] ?? 0), 0)
}

export function isStandardArrayAssignment(values: Record<AbilityKey, number>) {
  const actual = [...ABILITY_KEYS].map((key) => values[key]).sort((left, right) => right - left)
  const expected = [...STANDARD_ARRAY].sort((left, right) => right - left)
  return actual.every((value, index) => value === expected[index])
}

export function sumBestThree(rolls: number[]) {
  return [...rolls]
    .sort((left, right) => right - left)
    .slice(0, 3)
    .reduce((sum, value) => sum + value, 0)
}

export function createRolledStatSet(id: string, random = Math.random): RolledStatSet {
  return {
    id,
    rolls: Array.from({ length: 4 }, () => Math.floor(random() * 6) + 1),
  }
}

export function createRolledStatSets(count = 6, random = Math.random): RolledStatSet[] {
  return Array.from({ length: count }, (_, index) => createRolledStatSet(`rolled-${index + 1}-${Date.now()}-${Math.floor(random() * 100000)}`, random))
}

export function buildStatRollRows(
  assignments: Partial<Record<AbilityKey, string>>,
  rolledSets: RolledStatSet[]
): StatRollRow[] {
  return ABILITY_KEYS.flatMap((ability) => {
    const setId = assignments[ability]
    if (!setId) return []

    const rolledSet = rolledSets.find((entry) => entry.id === setId)
    if (!rolledSet) return []

    return [{
      assigned_to: ability,
      roll_set: rolledSet.rolls,
    }]
  })
}

export function buildStatsFromRollRows(
  rows: StatRollRow[],
  fallback: Record<AbilityKey, number>
): Record<AbilityKey, number> {
  const next = { ...fallback }

  for (const row of rows) {
    next[row.assigned_to] = sumBestThree(row.roll_set)
  }

  return next
}

export function restoreRolledState(rows: StatRollRow[]): {
  rolledSets: RolledStatSet[]
  assignments: Partial<Record<AbilityKey, string>>
} {
  const rolledSets: RolledStatSet[] = []
  const assignments: Partial<Record<AbilityKey, string>> = {}

  rows.forEach((row, index) => {
    const setId = `saved-roll-${index + 1}`
    rolledSets.push({
      id: setId,
      rolls: row.roll_set,
    })
    assignments[row.assigned_to] = setId
  })

  return {
    rolledSets,
    assignments,
  }
}
