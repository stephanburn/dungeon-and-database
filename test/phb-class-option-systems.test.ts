import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const migrationPath = path.join(
  process.cwd(),
  'supabase/migrations/059_phb_class_option_systems.sql'
)
const migrationSql = fs.readFileSync(migrationPath, 'utf8')

test('PHB class option system migration seeds the expected option groups', () => {
  for (const groupKey of [
    'maneuver:battle_master:2014',
    'hunter:hunters_prey:2014',
    'hunter:defensive_tactics:2014',
    'hunter:multiattack:2014',
    'hunter:superior_defense:2014',
    'circle_of_land:terrain:2014',
    'elemental_discipline:four_elements:2014',
  ]) {
    assert.match(migrationSql, new RegExp(groupKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
})

test('PHB class option system migration seeds representative option names', () => {
  for (const optionName of [
    "Commander's Strike",
    'Trip Attack',
    'Colossus Slayer',
    'Steel Will',
    'Volley',
    'Forest',
    'Water Whip',
    'Mist Stance',
  ]) {
    assert.match(
      migrationSql,
      new RegExp(optionName.replace(/'/g, "''").replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      `missing seeded option ${optionName}`
    )
  }
})
