import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const migrationPath = path.join(
  process.cwd(),
  'supabase/migrations/060_starting_equipment_resolution_catalog.sql'
)
const migrationSql = fs.readFileSync(migrationPath, 'utf8')

const expectedConcreteItemKeys = [
  'arrows',
  'crossbow_bolts',
  'crystal_arcane_focus',
  'wand_arcane_focus',
  'sprig_of_mistletoe',
  'wooden_staff_druidic_focus',
  'alchemists_supplies',
  'smiths_tools',
  'dice_set',
  'playing_card_set',
  'lute',
  'weighted_dice',
  'marked_cards',
  'fake_signet_ring',
]

test('starting-equipment resolution catalog seeds concrete helper targets', () => {
  for (const key of expectedConcreteItemKeys) {
    assert.match(
      migrationSql,
      new RegExp(`\\('${key.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}',`),
      `missing concrete starting-equipment item ${key}`
    )
  }
})
