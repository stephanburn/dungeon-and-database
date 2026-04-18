import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const migrationPath = path.join(process.cwd(), 'supabase/migrations/057_phb_species_spellcasting_and_dragonborn_choices.sql')
const migrationSql = fs.readFileSync(migrationPath, 'utf8')
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

test('PHB species spellcasting migration seeds Drow and Tiefling innate spell rows', () => {
  for (const pair of [
    ['Dark Elf (Drow)', 'Dancing Lights', '1'],
    ['Dark Elf (Drow)', 'Faerie Fire', '3'],
    ['Dark Elf (Drow)', 'Darkness', '5'],
    ['Tiefling', 'Thaumaturgy', '1'],
    ['Tiefling', 'Hellish Rebuke', '3'],
    ['Tiefling', 'Darkness', '5'],
  ]) {
    assert.match(
      migrationSql,
      new RegExp(`'${escapeRegExp(pair[0])}',\\s+'${escapeRegExp(pair[1])}',\\s+${pair[2]}`)
    )
  }
})

test('PHB species spellcasting migration prefers PHB spell rows but falls back safely', () => {
  assert.match(migrationSql, /source IN \('PHB', 'SRD', 'ERftLW'\)/)
  assert.match(migrationSql, /CASE source WHEN 'PHB' THEN 0 WHEN 'SRD' THEN 1 WHEN 'ERftLW' THEN 2/i)
  assert.match(migrationSql, /ON CONFLICT \(species_id, spell_id\) DO UPDATE SET/i)
})
