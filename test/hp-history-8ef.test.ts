import assert from 'node:assert/strict'
import { test } from 'node:test'
import { deriveCharacterCore } from '../src/lib/characters/derived'

test('slice 8ef derives HP from per-level class history for repeated same-class levels', () => {
  const derived = deriveCharacterCore({
    baseStats: { str: 10, dex: 10, con: 14, int: 10, wis: 10, cha: 10 },
    speciesAbilityBonuses: {},
    persistedHpMax: 27,
    classes: [{
      classId: 'fighter',
      className: 'Fighter',
      level: 3,
      hitDie: 10,
      hpRoll: 4,
      classLevels: [
        { levelNumber: 1, hpRoll: null, takenAt: '2026-05-01T10:00:00.000Z' },
        { levelNumber: 2, hpRoll: 7, takenAt: '2026-05-02T10:00:00.000Z' },
        { levelNumber: 3, hpRoll: 4, takenAt: '2026-05-03T10:00:00.000Z' },
      ],
    }],
  })

  assert.equal(derived.hitPoints.estimatedFromLevels, 27)
  assert.equal(derived.hitPoints.minimumPossible, 27)
  assert.equal(derived.hitPoints.maximumPossible, 27)
  assert.equal(derived.hitPoints.inferredLevelCount, 0)
  assert.equal(derived.hitPoints.usesInferredLevels, false)
  assert.deepEqual(
    derived.hitPoints.recordedRolls.map((roll) => [roll.className, roll.levelNumber, roll.value, roll.isStartingLevel]),
    [
      ['Fighter', 1, null, true],
      ['Fighter', 2, 7, false],
      ['Fighter', 3, 4, false],
    ]
  )
})

test('slice 8ef uses earliest taken_at class level as the only max-HP starting level', () => {
  const derived = deriveCharacterCore({
    baseStats: { str: 10, dex: 10, con: 12, int: 10, wis: 10, cha: 10 },
    speciesAbilityBonuses: {},
    persistedHpMax: 13,
    classes: [
      {
        classId: 'fighter',
        className: 'Fighter',
        level: 1,
        hitDie: 10,
        hpRoll: 5,
        classLevels: [
          { levelNumber: 1, hpRoll: 5, takenAt: '2026-05-02T10:00:00.000Z' },
        ],
      },
      {
        classId: 'wizard',
        className: 'Wizard',
        level: 1,
        hitDie: 6,
        hpRoll: null,
        classLevels: [
          { levelNumber: 1, hpRoll: null, takenAt: '2026-05-01T10:00:00.000Z' },
        ],
      },
    ],
  })

  assert.equal(derived.hitPoints.estimatedFromLevels, 13)
  assert.deepEqual(
    derived.hitPoints.recordedRolls.map((roll) => [roll.className, roll.levelNumber, roll.value, roll.isStartingLevel]),
    [
      ['Wizard', 1, null, true],
      ['Fighter', 1, 5, false],
    ]
  )
})
