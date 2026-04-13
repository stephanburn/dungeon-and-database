import type { AbilityKey } from '@/lib/characters/build-context'

export interface CharacterAggregateClass {
  classId: string
  className: string
  level: number
  hitDie: number | null
  hpRoll: number | null
}

export interface CharacterAggregate {
  baseStats: Record<AbilityKey, number>
  speciesAbilityBonuses: Partial<Record<AbilityKey, number>>
  classes: CharacterAggregateClass[]
  persistedHpMax: number
}

export interface DerivedAbilityScore {
  base: number
  adjusted: number
  modifier: number
}

export interface DerivedCharacterCore {
  totalLevel: number
  proficiencyBonus: number
  abilities: Record<AbilityKey, DerivedAbilityScore>
  hitPoints: {
    max: number
    constitutionModifier: number
    estimatedFromLevels: number | null
    minimumPossible: number | null
    maximumPossible: number | null
    inferredLevelCount: number
    usesInferredLevels: boolean
    hitDice: Array<{
      classId: string
      className: string
      dieSize: number | null
      level: number
    }>
    recordedRolls: Array<{
      classId: string
      className: string
      value: number | null
    }>
  }
}

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

export function hitPointGainFromRoll(hitDie: number, constitutionModifier: number, roll: number): number {
  return Math.max(1, roll + constitutionModifier)
}

export function getFixedHpGainValue(hitDie: number): number {
  return Math.floor(hitDie / 2) + 1
}

export function proficiencyBonusFromLevel(totalLevel: number): number {
  return Math.floor((Math.max(totalLevel, 1) - 1) / 4) + 2
}

export function deriveAbilityScores(
  baseStats: Record<AbilityKey, number>,
  bonuses: Partial<Record<AbilityKey, number>>
): Record<AbilityKey, DerivedAbilityScore> {
  return {
    str: buildDerivedAbilityScore(baseStats.str, bonuses.str ?? 0),
    dex: buildDerivedAbilityScore(baseStats.dex, bonuses.dex ?? 0),
    con: buildDerivedAbilityScore(baseStats.con, bonuses.con ?? 0),
    int: buildDerivedAbilityScore(baseStats.int, bonuses.int ?? 0),
    wis: buildDerivedAbilityScore(baseStats.wis, bonuses.wis ?? 0),
    cha: buildDerivedAbilityScore(baseStats.cha, bonuses.cha ?? 0),
  }
}

export function deriveCharacterCore(aggregate: CharacterAggregate): DerivedCharacterCore {
  const totalLevel = aggregate.classes.reduce((sum, cls) => sum + cls.level, 0)
  const abilities = deriveAbilityScores(aggregate.baseStats, aggregate.speciesAbilityBonuses)
  const hitPointEstimate = deriveHitPointEstimate(aggregate.classes, abilities.con.modifier)

  return {
    totalLevel,
    proficiencyBonus: proficiencyBonusFromLevel(totalLevel),
    abilities,
    hitPoints: {
      max: aggregate.persistedHpMax,
      constitutionModifier: abilities.con.modifier,
      estimatedFromLevels: hitPointEstimate?.estimated ?? null,
      minimumPossible: hitPointEstimate?.minimum ?? null,
      maximumPossible: hitPointEstimate?.maximum ?? null,
      inferredLevelCount: hitPointEstimate?.inferredLevelCount ?? 0,
      usesInferredLevels: (hitPointEstimate?.inferredLevelCount ?? 0) > 0,
      hitDice: aggregate.classes.map((cls) => ({
        classId: cls.classId,
        className: cls.className,
        dieSize: cls.hitDie,
        level: cls.level,
      })),
      recordedRolls: aggregate.classes.map((cls) => ({
        classId: cls.classId,
        className: cls.className,
        value: cls.hpRoll,
      })),
    },
  }
}

function buildDerivedAbilityScore(base: number, bonus: number): DerivedAbilityScore {
  const adjusted = base + bonus

  return {
    base,
    adjusted,
    modifier: abilityModifier(adjusted),
  }
}

function deriveHitPointEstimate(
  classes: CharacterAggregateClass[],
  constitutionModifier: number
): { estimated: number; minimum: number; maximum: number; inferredLevelCount: number } | null {
  if (classes.length === 0) return { estimated: 0, minimum: 0, maximum: 0, inferredLevelCount: 0 }
  if (classes.some((cls) => cls.hitDie === null)) return null

  let estimated = 0
  let minimum = 0
  let maximum = 0
  let inferredLevelCount = 0

  classes.forEach((cls, index) => {
    const hitDie = cls.hitDie
    if (!hitDie || cls.level <= 0) return

    let trackedLevels = 0

    // Assume the first recorded class was the character's starting class,
    // so its first level used maximum hit points.
    if (index === 0) {
      const startingGain = hitPointGainFromRoll(hitDie, constitutionModifier, hitDie)
      estimated += startingGain
      minimum += startingGain
      maximum += startingGain
      trackedLevels += 1
    }

    // The current schema stores at most one per-class HP roll, so we treat it
    // as the most recent gain for that class when there is room for one.
    const recordedRoll = cls.hpRoll
    const canUseRecordedRoll = recordedRoll !== null && trackedLevels < cls.level
    if (canUseRecordedRoll) {
      const recordedGain = hitPointGainFromRoll(hitDie, constitutionModifier, recordedRoll)
      estimated += recordedGain
      minimum += recordedGain
      maximum += recordedGain
      trackedLevels += 1
    }

    const remainingLevels = Math.max(0, cls.level - trackedLevels)
    if (remainingLevels === 0) return

    inferredLevelCount += remainingLevels
    estimated += hitPointGainFromRoll(hitDie, constitutionModifier, getFixedHpGainValue(hitDie)) * remainingLevels
    minimum += hitPointGainFromRoll(hitDie, constitutionModifier, 1) * remainingLevels
    maximum += hitPointGainFromRoll(hitDie, constitutionModifier, hitDie) * remainingLevels
  })

  return { estimated, minimum, maximum, inferredLevelCount }
}
