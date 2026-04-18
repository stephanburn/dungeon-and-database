import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const migrationPath = path.join(process.cwd(), 'supabase/migrations/056_phb_species_and_subraces.sql')
const migrationSql = fs.readFileSync(migrationPath, 'utf8')

test('PHB species migration seeds core parent species, subraces, and Variant Human', () => {
  for (const name of [
    'Dwarf',
    'Elf',
    'Halfling',
    'Human',
    'Dragonborn',
    'Gnome',
    'Half-Elf',
    'Half-Orc',
    'Tiefling',
    'Hill Dwarf',
    'Mountain Dwarf',
    'High Elf',
    'Wood Elf',
    'Dark Elf (Drow)',
    'Lightfoot Halfling',
    'Stout Halfling',
    'Forest Gnome',
    'Rock Gnome',
    'Variant Human',
  ]) {
    assert.match(migrationSql, new RegExp(`'${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`))
  }
})

test('PHB species migration uses lineage metadata for parent rows and variants', () => {
  assert.match(migrationSql, /'dwarf',\s+'subrace',\s+1,/)
  assert.match(migrationSql, /'elf',\s+'subrace',\s+3,/)
  assert.match(migrationSql, /'human',\s+'variant',\s+1,/)
  assert.match(migrationSql, /SELECT id FROM public\.species WHERE name = 'Human' AND source = 'PHB'/)
})

test('PHB species migration marks choice-heavy species with explicit amendment notes', () => {
  assert.match(migrationSql, /Draconic ancestry, breath weapon, and resistance type choices are not yet modeled/)
  assert.match(migrationSql, /The bonus wizard cantrip choice is not yet modeled as a species spell option/)
  assert.match(migrationSql, /Innate tiefling spellcasting is not yet automated/)
})
