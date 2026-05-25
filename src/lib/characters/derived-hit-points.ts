export interface CharacterAggregateClassLevel {
  levelNumber: number
  hpRoll: number | null
  takenAt: string | null
}

export interface HitPointClassInput {
  classId: string
  className: string
  level: number
  hitDie: number | null
  hpRoll: number | null
  classLevels?: CharacterAggregateClassLevel[]
}

export interface DerivedHitPointRoll {
  classId: string
  className: string
  value: number | null
  levelNumber?: number
  takenAt?: string | null
  isStartingLevel?: boolean
}

export interface DerivedHitPointSummary {
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
  recordedRolls: DerivedHitPointRoll[]
}

type HitPointEstimate = {
  estimated: number
  minimum: number
  maximum: number
  inferredLevelCount: number
  recordedRolls: DerivedHitPointRoll[]
}

type NormalizedClassLevel = CharacterAggregateClassLevel & {
  classId: string
  className: string
  hitDie: number
}

export function hitPointGainFromRoll(hitDie: number, constitutionModifier: number, roll: number): number {
  return Math.max(1, roll + constitutionModifier)
}

export function getFixedHpGainValue(hitDie: number): number {
  return Math.floor(hitDie / 2) + 1
}

export function deriveHitPoints(
  classes: HitPointClassInput[],
  constitutionModifier: number,
  persistedHpMax: number
): DerivedHitPointSummary {
  const estimate = deriveHitPointEstimate(classes, constitutionModifier)

  return {
    max: persistedHpMax,
    constitutionModifier,
    estimatedFromLevels: estimate?.estimated ?? null,
    minimumPossible: estimate?.minimum ?? null,
    maximumPossible: estimate?.maximum ?? null,
    inferredLevelCount: estimate?.inferredLevelCount ?? 0,
    usesInferredLevels: (estimate?.inferredLevelCount ?? 0) > 0,
    hitDice: classes.map((cls) => ({
      classId: cls.classId,
      className: cls.className,
      dieSize: cls.hitDie,
      level: cls.level,
    })),
    recordedRolls: estimate?.recordedRolls ?? classes.map((cls) => ({
      classId: cls.classId,
      className: cls.className,
      value: cls.hpRoll,
    })),
  }
}

function deriveHitPointEstimate(
  classes: HitPointClassInput[],
  constitutionModifier: number
): HitPointEstimate | null {
  if (classes.length === 0) {
    return { estimated: 0, minimum: 0, maximum: 0, inferredLevelCount: 0, recordedRolls: [] }
  }
  if (classes.some((cls) => cls.hitDie === null)) return null

  const levels = normalizeClassLevels(classes)
  if (levels.length === 0) {
    return { estimated: 0, minimum: 0, maximum: 0, inferredLevelCount: 0, recordedRolls: [] }
  }

  const startingLevel = levels[0]
  let estimated = 0
  let minimum = 0
  let maximum = 0
  let inferredLevelCount = 0
  const recordedRolls: DerivedHitPointRoll[] = []

  for (const level of levels) {
    const isStartingLevel = level === startingLevel
    recordedRolls.push({
      classId: level.classId,
      className: level.className,
      value: level.hpRoll,
      levelNumber: level.levelNumber,
      takenAt: level.takenAt,
      isStartingLevel,
    })

    if (isStartingLevel) {
      const startingGain = hitPointGainFromRoll(level.hitDie, constitutionModifier, level.hitDie)
      estimated += startingGain
      minimum += startingGain
      maximum += startingGain
      continue
    }

    if (level.hpRoll !== null) {
      const recordedGain = hitPointGainFromRoll(level.hitDie, constitutionModifier, level.hpRoll)
      estimated += recordedGain
      minimum += recordedGain
      maximum += recordedGain
      continue
    }

    inferredLevelCount += 1
    estimated += hitPointGainFromRoll(level.hitDie, constitutionModifier, getFixedHpGainValue(level.hitDie))
    minimum += hitPointGainFromRoll(level.hitDie, constitutionModifier, 1)
    maximum += hitPointGainFromRoll(level.hitDie, constitutionModifier, level.hitDie)
  }

  return { estimated, minimum, maximum, inferredLevelCount, recordedRolls }
}

function normalizeClassLevels(classes: HitPointClassInput[]): NormalizedClassLevel[] {
  return classes
    .flatMap((cls, classIndex) => {
      if (!cls.hitDie || cls.level <= 0) return []
      const explicitLevels = cls.classLevels?.length
        ? cls.classLevels
        : synthesizeClassLevels(cls, classIndex)
      return explicitLevels
        .filter((level) => level.levelNumber > 0 && level.levelNumber <= cls.level)
        .map((level) => ({
          ...level,
          classId: cls.classId,
          className: cls.className,
          hitDie: cls.hitDie!,
        }))
    })
    .sort(compareClassLevels)
}

function synthesizeClassLevels(cls: HitPointClassInput, classIndex: number): CharacterAggregateClassLevel[] {
  return Array.from({ length: cls.level }, (_, index) => {
    const levelNumber = index + 1
    return {
      levelNumber,
      hpRoll: levelNumber === cls.level ? cls.hpRoll : null,
      takenAt: `compat:${String(classIndex).padStart(3, '0')}:${String(levelNumber).padStart(3, '0')}`,
    }
  })
}

function compareClassLevels(left: NormalizedClassLevel, right: NormalizedClassLevel) {
  const leftTakenAt = left.takenAt ?? ''
  const rightTakenAt = right.takenAt ?? ''
  if (leftTakenAt !== rightTakenAt) return leftTakenAt.localeCompare(rightTakenAt)
  if (left.classId !== right.classId) return left.classId.localeCompare(right.classId)
  return left.levelNumber - right.levelNumber
}
