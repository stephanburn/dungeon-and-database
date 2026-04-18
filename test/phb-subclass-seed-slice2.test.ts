import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const migrationPath = path.join(
  process.cwd(),
  'supabase/migrations/053_phb_subclasses_slice2.sql'
)
const migrationSql = fs.readFileSync(migrationPath, 'utf8')

const expectedPhbSubclassesSlice2 = [
  'Path of the Berserker',
  'College of Lore',
  'Life Domain',
  'Light Domain',
  'Nature Domain',
  'Tempest Domain',
  'Trickery Domain',
  'War Domain',
  'Circle of the Land',
  'Circle of the Moon',
  'Champion',
  'Battle Master',
  'Eldritch Knight',
  'Way of the Open Hand',
  'Oath of Devotion',
  'Hunter',
  'Thief',
  'Draconic Bloodline',
  'The Fiend',
  'School of Evocation',
]

test('PHB subclass migration seeds the expected subclass names for slice 2', () => {
  for (const subclass of expectedPhbSubclassesSlice2) {
    assert.match(
      migrationSql,
      new RegExp(`\\('${subclass.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}',`),
      `missing PHB subclass seed for ${subclass}`
    )
  }
})
