import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const migrationPath = path.join(
  process.cwd(),
  'supabase/migrations/047_phb_backgrounds_and_feats.sql'
)
const migrationSql = fs.readFileSync(migrationPath, 'utf8')

const expectedPhbBackgrounds = [
  'Charlatan',
  'Criminal',
  'Entertainer',
  'Folk Hero',
  'Guild Artisan',
  'Hermit',
  'Noble',
  'Outlander',
  'Sage',
  'Sailor',
  'Soldier',
  'Urchin',
]

const expectedPhbFeats = [
  'Actor',
  'Alert',
  'Athlete',
  'Charger',
  'Crossbow Expert',
  'Defensive Duelist',
  'Dual Wielder',
  'Dungeon Delver',
  'Durable',
  'Elemental Adept',
  'Grappler',
  'Great Weapon Master',
  'Healer',
  'Heavily Armored',
  'Heavy Armor Master',
  'Inspiring Leader',
  'Keen Mind',
  'Lightly Armored',
  'Linguist',
  'Lucky',
  'Mage Slayer',
  'Magic Initiate',
  'Martial Adept',
  'Medium Armor Master',
  'Mobile',
  'Moderately Armored',
  'Mounted Combatant',
  'Observant',
  'Polearm Master',
  'Resilient',
  'Ritual Caster',
  'Savage Attacker',
  'Sentinel',
  'Sharpshooter',
  'Shield Master',
  'Skilled',
  'Skulker',
  'Spell Sniper',
  'Tavern Brawler',
  'Tough',
  'War Caster',
  'Weapon Master',
]

test('PHB background migration seeds the expected non-SRD core backgrounds', () => {
  for (const background of expectedPhbBackgrounds) {
    assert.match(
      migrationSql,
      new RegExp(`\\('${background.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}',`, 'u'),
      `missing PHB background seed for ${background}`
    )
  }
})

test('PHB feat migration seeds the expected PHB feat catalog', () => {
  for (const feat of expectedPhbFeats) {
    assert.match(
      migrationSql,
      new RegExp(`\\('${feat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}',`, 'u'),
      `missing PHB feat seed for ${feat}`
    )
  }
})
