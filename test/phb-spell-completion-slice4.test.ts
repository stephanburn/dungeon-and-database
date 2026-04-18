import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const migrationPath = path.join(
  process.cwd(),
  'supabase/migrations/052_phb_spell_completion_slice4.sql'
)
const migrationSql = fs.readFileSync(migrationPath, 'utf8')

const completedPhbSpellsSlice4 = [
  'Unseen Servant',
  'Stone Shape',
  'Pass without Trace',
  'Phantom Steed',
  'Teleportation Circle',
  'Shield of Faith',
  'Warding Bond',
  'Zone of Truth',
  'Prayer of Healing',
  'Mass Healing Word',
  'Sleep',
  "Mordenkainen's Private Sanctum",
  "Mordenkainen's Faithful Hound",
  "Leomund's Secret Chest",
  'Illusory Script',
  'Silence',
  'Sending',
  'Tongues',
  'Thunderwave',
  'Levitate',
  'Sleet Storm',
  'Wind Wall',
  'Silent Image',
  'Major Image',
  'Hallucinatory Terrain',
  'Mislead',
]

test('PHB spell completion slice 4 upgrades the expected spell set', () => {
  for (const spell of completedPhbSpellsSlice4) {
    const sqlLiteralSpell = spell.replace(/'/g, "''")
    assert.match(
      migrationSql,
      new RegExp(`\\('${sqlLiteralSpell.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}',\\s*\\d+,\\s*'`),
      `missing completed PHB spell data for ${spell}`
    )
  }
})

test('PHB spell completion slice 4 uses structured metadata instead of placeholder Varies rows', () => {
  assert.doesNotMatch(
    migrationSql,
    /'Varies'/,
    'spell completion slice 4 should not contain placeholder Varies metadata'
  )
})
