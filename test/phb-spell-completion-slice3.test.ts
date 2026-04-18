import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const migrationPath = path.join(
  process.cwd(),
  'supabase/migrations/051_phb_spell_completion_slice3.sql'
)
const migrationSql = fs.readFileSync(migrationPath, 'utf8')

const completedPhbSpellsSlice3 = [
  'Conjure Animals',
  'Conjure Barrage',
  'Conjure Elemental',
  'Conjure Minor Elementals',
  'Control Water',
  'Creation',
  'Dominate Beast',
  'Elemental Weapon',
  'Fabricate',
  'Fog Cloud',
  'Freedom of Movement',
  'Glyph of Warding',
  'Goodberry',
  'Greater Restoration',
  'Guardian of Faith',
  'Gust of Wind',
  'Hallow',
  'Healing Word',
  'Jump',
  'Knock',
  "Leomund's Tiny Hut",
  'Locate Animals or Plants',
  'Locate Creature',
  'Magic Circle',
  'Magic Weapon',
]

test('PHB spell completion slice 3 upgrades the expected spell set', () => {
  for (const spell of completedPhbSpellsSlice3) {
    const sqlLiteralSpell = spell.replace(/'/g, "''")
    assert.match(
      migrationSql,
      new RegExp(`\\('${sqlLiteralSpell.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}',\\s*\\d+,\\s*'`),
      `missing completed PHB spell data for ${spell}`
    )
  }
})

test('PHB spell completion slice 3 uses structured metadata instead of placeholder Varies rows', () => {
  assert.doesNotMatch(
    migrationSql,
    /'Varies'/,
    'spell completion slice 3 should not contain placeholder Varies metadata'
  )
})
