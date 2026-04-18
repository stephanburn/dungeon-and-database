import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const migrationPath = path.join(
  process.cwd(),
  'supabase/migrations/054_phb_starting_equipment_expansion.sql'
)
const migrationSql = fs.readFileSync(migrationPath, 'utf8')

const expectedPackageKeys = [
  'background:acolyte:phb',
  'background:charlatan:phb',
  'background:criminal:phb',
  'background:entertainer:phb',
  'background:folk_hero:phb',
  'background:guild_artisan:phb',
  'background:hermit:phb',
  'background:noble:phb',
  'background:outlander:phb',
  'background:sage:phb',
  'background:sailor:phb',
  'background:soldier:phb',
  'background:urchin:phb',
  'class:barbarian:phb',
  'class:bard:phb',
  'class:cleric:phb',
  'class:druid:phb',
  'class:fighter:phb',
  'class:monk:phb',
  'class:paladin:phb',
  'class:ranger:phb',
  'class:rogue:phb',
  'class:sorcerer:phb',
  'class:warlock:phb',
  'class:wizard:phb',
]

const expectedHelperItems = [
  'explorers_pack',
  'dungeoneers_pack',
  'burglars_pack',
  'priests_pack',
  'scholars_pack',
  'arcane_focus_choice',
  'druidic_focus_choice',
  'martial_weapon_and_shield_set',
  'two_martial_weapons_set',
  'light_crossbow_and_20_bolts_set',
  'longbow_and_20_arrows_set',
  'shortbow_and_20_arrows_set',
]

test('PHB starting equipment expansion seeds the expected package keys', () => {
  for (const key of expectedPackageKeys) {
    assert.match(
      migrationSql,
      new RegExp(`'${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`),
      `missing PHB starting equipment package ${key}`
    )
  }
})

test('PHB starting equipment expansion seeds helper catalog items for package choices', () => {
  for (const key of expectedHelperItems) {
    assert.match(
      migrationSql,
      new RegExp(`\\('${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}',`),
      `missing helper equipment item ${key}`
    )
  }
})
