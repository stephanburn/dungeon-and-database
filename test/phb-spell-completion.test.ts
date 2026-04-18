import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const migrationPath = path.join(
  process.cwd(),
  'supabase/migrations/049_phb_spell_completion_slice1.sql'
)
const migrationSql = fs.readFileSync(migrationPath, 'utf8')

const completedPhbSpells = [
  'Ensnaring Strike',
  'Speak with Animals',
  'Moonbeam',
  'Misty Step',
  'Plant Growth',
  'Protection from Energy',
  'Ice Storm',
  'Stoneskin',
  'Commune with Nature',
  'Tree Stride',
  'Command',
  'Identify',
  'Suggestion',
  'Nondetection',
  'Speak with Dead',
  'Arcane Eye',
  'Confusion',
  'Legend Lore',
  'Scrying',
  'Bane',
  "Hunter's Mark",
  'Hold Person',
  'Haste',
  'Banishment',
  'Dimension Door',
  'Hold Monster',
]

test('PHB spell completion migration upgrades the expected subclass spell set', () => {
  for (const spell of completedPhbSpells) {
    const sqlLiteralSpell = spell.replace(/'/g, "''")
    assert.match(
      migrationSql,
      new RegExp(`\\('${sqlLiteralSpell.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}',\\s*\\d+,\\s*'`),
      `missing completed PHB spell data for ${spell}`
    )
  }
})

test('PHB spell completion migration uses structured metadata instead of placeholder Varies rows', () => {
  assert.doesNotMatch(
    migrationSql,
    /'Varies'/,
    'spell completion slice should not contain placeholder Varies metadata'
  )
})
