import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  validateContentImport,
  type ContentImportBundle,
  type ContentImportValidationError,
} from '../scripts/content-import/validator'

function validBundle(): ContentImportBundle {
  return {
    sources: [{ key: 'PHB', name: 'Player Handbook' }],
    classes: [
      {
        key: 'fighter',
        name: 'Fighter',
        source: 'PHB',
        progression: [
          { level: 1, proficiency_bonus: 2 },
          { level: 2, proficiency_bonus: 2 },
          { level: 3, proficiency_bonus: 2 },
          { level: 4, proficiency_bonus: 2, asi_available: true },
        ],
      },
      {
        key: 'wizard',
        name: 'Wizard',
        source: 'PHB',
        progression: [{ level: 1, proficiency_bonus: 2 }],
      },
    ],
    subclasses: [
      { key: 'champion', name: 'Champion', class_key: 'fighter', source: 'PHB', choice_level: 3 },
    ],
    spells: [
      { key: 'fire_bolt', name: 'Fire Bolt', level: 0, source: 'PHB', class_keys: ['wizard'] },
      { key: 'shield', name: 'Shield', level: 1, source: 'PHB', class_keys: ['wizard'] },
    ],
    languages: [
      { key: 'common', name: 'Common', source: 'PHB' },
    ],
    tools: [
      { key: 'smiths_tools', name: "Smith's Tools", source: 'PHB' },
    ],
    equipmentItems: [
      { key: 'longsword', name: 'Longsword', source: 'PHB', item_category: 'weapon' },
      { key: 'chain_mail', name: 'Chain Mail', source: 'PHB', item_category: 'armor' },
    ],
    featureOptionGroups: [
      { key: 'fighter:fighting_style', label: 'Fighting Style', source: 'PHB', owner_table: 'classes', owner_key: 'fighter' },
    ],
    featureOptions: [
      { key: 'defense', group_key: 'fighter:fighting_style', label: 'Defense', source: 'PHB' },
    ],
    featureSpellGrants: [
      { feature_key: 'wizard:spellcasting:cantrip', spell_key: 'fire_bolt', source: 'PHB' },
    ],
    startingEquipmentPackages: [
      {
        key: 'class:fighter:phb',
        name: 'Fighter Starting Equipment',
        source: 'PHB',
        items: [
          { item_key: 'longsword', quantity: 1 },
          { item_key: 'chain_mail', quantity: 1 },
        ],
      },
    ],
  }
}

function assertError(
  errors: ContentImportValidationError[],
  code: string,
  table: string,
  entityKey: string
) {
  assert.ok(
    errors.some((error) =>
      error.code === code &&
      error.table === table &&
      error.entityKey === entityKey &&
      error.ownerSlice === '6e'
    ),
    `Expected ${code} for ${table}:${entityKey}, got ${JSON.stringify(errors)}`
  )
}

test('validateContentImport accepts a complete dry-run bundle without mutating state', () => {
  const result = validateContentImport(validBundle())

  assert.equal(result.ok, true)
  assert.deepEqual(result.errors, [])
})

test('validateContentImport reports missing foreign-key style references with row identity', () => {
  const bundle = validBundle()
  bundle.subclasses[0] = { ...bundle.subclasses[0], class_key: 'cleric' }
  bundle.spells[0] = { ...bundle.spells[0], class_keys: ['wizard', 'cleric'] }

  const result = validateContentImport(bundle)

  assert.equal(result.ok, false)
  assertError(result.errors, 'missing_reference', 'subclasses', 'champion')
  assertError(result.errors, 'missing_reference', 'spells', 'fire_bolt')
})

test('validateContentImport rejects invalid class progression arrays', () => {
  const bundle = validBundle()
  bundle.classes[0] = {
    ...bundle.classes[0],
    progression: [
      { level: 1, proficiency_bonus: 2 },
      { level: 3, proficiency_bonus: 2 },
      { level: 3, proficiency_bonus: 3 },
    ],
  }

  const result = validateContentImport(bundle)

  assert.equal(result.ok, false)
  assertError(result.errors, 'invalid_progression', 'classes', 'fighter')
})

test('validateContentImport reports orphaned option groups and options', () => {
  const bundle = validBundle()
  bundle.featureOptionGroups[0] = {
    ...bundle.featureOptionGroups[0],
    owner_table: 'subclasses',
    owner_key: 'battle_master',
  }
  bundle.featureOptions[0] = {
    ...bundle.featureOptions[0],
    group_key: 'fighter:missing_group',
  }

  const result = validateContentImport(bundle)

  assert.equal(result.ok, false)
  assertError(result.errors, 'orphaned_option_group', 'feature_option_groups', 'fighter:fighting_style')
  assertError(result.errors, 'orphaned_option', 'feature_options', 'defense')
})

test('validateContentImport reports duplicate option records', () => {
  const bundle = validBundle()
  bundle.featureOptions.push({ ...bundle.featureOptions[0] })

  const result = validateContentImport(bundle)

  assert.equal(result.ok, false)
  assertError(result.errors, 'duplicate_record', 'feature_options', 'defense')
})

test('validateContentImport reports spell-list mismatches', () => {
  const bundle = validBundle()
  bundle.spells[0] = { ...bundle.spells[0], level: 0, class_keys: [] }
  bundle.spells[1] = { ...bundle.spells[1], level: 1, class_keys: ['wizard', 'fighter'] }

  const result = validateContentImport(bundle)

  assert.equal(result.ok, false)
  assertError(result.errors, 'spell_list_mismatch', 'spells', 'fire_bolt')
  assertError(result.errors, 'spell_list_mismatch', 'spells', 'shield')
})

test('validateContentImport requires feature spell grants to resolve exactly one spell row', () => {
  const bundle = validBundle()
  bundle.spells.push({ ...bundle.spells[0], source: 'SRD' })
  bundle.featureSpellGrants[0] = { ...bundle.featureSpellGrants[0], spell_key: 'fire_bolt' }
  bundle.featureSpellGrants.push({
    feature_key: 'wizard:spellcasting:missing',
    spell_key: 'magic_missile',
    source: 'PHB',
  })

  const result = validateContentImport(bundle)

  assert.equal(result.ok, false)
  assertError(result.errors, 'ambiguous_spell_reference', 'feature_spell_grants', 'wizard:spellcasting:cantrip')
  assertError(result.errors, 'missing_reference', 'feature_spell_grants', 'wizard:spellcasting:missing')
})

test('validateContentImport reports unresolved language, tool, and equipment references', () => {
  const bundle = validBundle()
  bundle.classes[0] = {
    ...bundle.classes[0],
    language_keys: ['common', 'giant'],
    tool_keys: ['smiths_tools', 'masons_tools'],
  }
  bundle.startingEquipmentPackages[0] = {
    ...bundle.startingEquipmentPackages[0],
    items: [{ item_key: 'missing_sword', quantity: 1 }],
  }

  const result = validateContentImport(bundle)

  assert.equal(result.ok, false)
  assertError(result.errors, 'missing_reference', 'classes', 'fighter')
  assertError(result.errors, 'missing_reference', 'starting_equipment_packages', 'class:fighter:phb')
})

test('slice 6e exposes dry-run validation and keeps seed-srd as an orchestration entrypoint', () => {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts: Record<string, string> }
  const seedScript = readFileSync('scripts/seed-srd.ts', 'utf8')
  const validateScript = readFileSync('scripts/content-import/validate.ts', 'utf8')

  assert.equal(packageJson.scripts['content:validate'], 'tsx scripts/content-import/validate.ts')
  assert.match(seedScript, /runSrdSeed/)
  assert.doesNotMatch(seedScript, /async function seedSpecies/)
  assert.match(validateScript, /validateContentImport/)
  assert.match(validateScript, /--fixture/)
})
