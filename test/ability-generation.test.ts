import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildStatRollRows,
  buildStatsFromRollRows,
  isStandardArrayAssignment,
  restoreRolledState,
  totalPointBuySpend,
  sumBestThree,
  type AbilityKey,
} from '@/lib/characters/ability-generation'

test('totalPointBuySpend matches the 27-point standard spread', () => {
  assert.equal(
    totalPointBuySpend({
      str: 15,
      dex: 14,
      con: 13,
      int: 12,
      wis: 10,
      cha: 8,
    }),
    27
  )
})

test('isStandardArrayAssignment accepts the standard array in any order', () => {
  assert.equal(
    isStandardArrayAssignment({
      str: 8,
      dex: 10,
      con: 12,
      int: 13,
      wis: 14,
      cha: 15,
    }),
    true
  )
})

test('buildStatRollRows and buildStatsFromRollRows preserve rolled assignments', () => {
  const rows = buildStatRollRows(
    {
      str: 'a',
      dex: 'b',
    } satisfies Partial<Record<AbilityKey, string>>,
    [
      { id: 'a', rolls: [6, 6, 5, 2] },
      { id: 'b', rolls: [4, 4, 3, 1] },
    ]
  )

  assert.deepEqual(rows, [
    { assigned_to: 'str', roll_set: [6, 6, 5, 2] },
    { assigned_to: 'dex', roll_set: [4, 4, 3, 1] },
  ])

  assert.deepEqual(
    buildStatsFromRollRows(rows, {
      str: 8,
      dex: 8,
      con: 8,
      int: 8,
      wis: 8,
      cha: 8,
    }),
    {
      str: 17,
      dex: 11,
      con: 8,
      int: 8,
      wis: 8,
      cha: 8,
    }
  )
})

test('sumBestThree drops the lowest die', () => {
  assert.equal(sumBestThree([6, 5, 3, 1]), 14)
})

test('restoreRolledState recreates rolled sets and assignments from saved rows', () => {
  const restored = restoreRolledState([
    { assigned_to: 'wis', roll_set: [6, 5, 4, 1] },
    { assigned_to: 'cha', roll_set: [5, 5, 3, 2] },
  ])

  assert.deepEqual(restored.rolledSets, [
    { id: 'saved-roll-1', rolls: [6, 5, 4, 1] },
    { id: 'saved-roll-2', rolls: [5, 5, 3, 2] },
  ])
  assert.deepEqual(restored.assignments, {
    wis: 'saved-roll-1',
    cha: 'saved-roll-2',
  })
})
