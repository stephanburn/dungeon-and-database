import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const migrationPath = path.join(
  process.cwd(),
  'supabase/migrations/050_phb_spell_completion_slice2.sql'
)
const migrationSql = fs.readFileSync(migrationPath, 'utf8')

const completedPhbSpellsSlice2 = [
  'Aid',
  'Alarm',
  'Animal Friendship',
  'Animal Messenger',
  'Antilife Shell',
  'Arcane Lock',
  'Armor of Agathys',
  'Aura of Purity',
  'Aura of Vitality',
  'Awaken',
  'Beacon of Hope',
  'Beast Sense',
  "Bigby's Hand",
  'Blink',
  'Calm Emotions',
  'Compelled Duel',
  'Comprehend Languages',
  'Continual Flame',
  'Create Food and Water',
  'Darkness',
  'Detect Magic',
  'Detect Poison and Disease',
  'Detect Thoughts',
  'Disguise Self',
  'Dream',
  'Expeditious Retreat',
  'Find Traps',
]

test('PHB spell completion slice 2 upgrades the expected spell set', () => {
  for (const spell of completedPhbSpellsSlice2) {
    const sqlLiteralSpell = spell.replace(/'/g, "''")
    assert.match(
      migrationSql,
      new RegExp(`\\('${sqlLiteralSpell.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}',\\s*\\d+,\\s*'`),
      `missing completed PHB spell data for ${spell}`
    )
  }
})

test('PHB spell completion slice 2 uses structured metadata instead of placeholder Varies rows', () => {
  assert.doesNotMatch(
    migrationSql,
    /'Varies'/,
    'spell completion slice 2 should not contain placeholder Varies metadata'
  )
})
