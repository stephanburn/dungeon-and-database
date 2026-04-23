import type { CharacterClassLevel, CharacterLevel } from '@/lib/types/database'

export function sortCharacterClassLevels(levels: CharacterClassLevel[]): CharacterClassLevel[] {
  return levels.slice().sort((left, right) => {
    if (left.taken_at !== right.taken_at) {
      return left.taken_at.localeCompare(right.taken_at)
    }
    if (left.class_id !== right.class_id) {
      return left.class_id.localeCompare(right.class_id)
    }
    return left.level_number - right.level_number
  })
}

export function aggregateCharacterLevels(levels: CharacterClassLevel[]): CharacterLevel[] {
  const byClassId = new Map<string, CharacterClassLevel[]>()

  for (const level of levels) {
    const existing = byClassId.get(level.class_id) ?? []
    existing.push(level)
    byClassId.set(level.class_id, existing)
  }

  return Array.from(byClassId.values())
    .map((classLevels) => classLevels.slice().sort((left, right) => left.level_number - right.level_number))
    .map((classLevels) => {
      const currentLevel = classLevels[classLevels.length - 1]!
      return {
        id: currentLevel.id,
        character_id: currentLevel.character_id,
        class_id: currentLevel.class_id,
        level: currentLevel.level_number,
        subclass_id: currentLevel.subclass_id,
        hp_roll: currentLevel.hp_roll,
        taken_at: currentLevel.taken_at,
      }
    })
    .sort((left, right) => left.taken_at.localeCompare(right.taken_at))
}
