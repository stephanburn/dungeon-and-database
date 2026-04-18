import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const migrationPath = path.join(
  process.cwd(),
  'supabase/migrations/048_phb_subclasses_slice1.sql'
)
const migrationSql = fs.readFileSync(migrationPath, 'utf8')

const expectedPhbSubclasses = [
  'Path of the Totem Warrior',
  'College of Valor',
  'Knowledge Domain',
  'Way of Shadow',
  'Way of the Four Elements',
  'Oath of Vengeance',
  'Beast Master',
  'Assassin',
  'Arcane Trickster',
  'Wild Magic',
  'The Archfey',
  'The Great Old One',
  'School of Abjuration',
  'School of Conjuration',
  'School of Divination',
  'School of Enchantment',
  'School of Illusion',
  'School of Transmutation',
]

test('PHB subclass migration seeds the expected subclass names for slice 1', () => {
  for (const subclass of expectedPhbSubclasses) {
    assert.match(
      migrationSql,
      new RegExp(`\\('${subclass.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}',`, 'u'),
      `missing PHB subclass seed for ${subclass}`
    )
  }
})
