import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const migrationPath = path.join(process.cwd(), 'supabase/migrations/058_phb_species_behavior_status_updates.sql')
const migrationSql = fs.readFileSync(migrationPath, 'utf8')

test('PHB species behavior status migration clears outdated amendment notes for completed species', () => {
  assert.match(migrationSql, /name IN \('Dragonborn', 'High Elf', 'Tiefling'\)/)
  assert.match(migrationSql, /amended = false/i)
  assert.match(migrationSql, /amendment_note = NULL/i)
})

test('PHB species behavior status migration narrows Drow amendment note to sunlight sensitivity', () => {
  assert.match(migrationSql, /name = 'Dark Elf \(Drow\)'/)
  assert.match(migrationSql, /Sunlight Sensitivity attack and Perception penalties are not yet automated\./)
})
