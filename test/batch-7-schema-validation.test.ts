import test from 'node:test'
import assert from 'node:assert/strict'
import {
  applyContentImportPlan,
  planContentImport,
} from '../scripts/content-import/import-workflow'
import { validateContentImport } from '../scripts/content-import/validator'
import {
  buildBatch7ContentBundle,
  buildBatch7ExistingSnapshot,
  buildBatch7InvalidContentBundle,
  buildBatch7SchemaValidationFixtures,
  listMigrationFiles,
  readMigration,
} from './helpers/batch-7-schema-validation-fixtures'

test('Slice 7d schema validation fixture names every required contract group', () => {
  const fixtures = buildBatch7SchemaValidationFixtures()

  assert.deepEqual(
    fixtures.contractGroups.map((group) => group.key),
    [
      'normalized-character-persistence',
      'language-tool-key-cutover',
      'equipment-and-starting-equipment',
      'feature-options',
      'feature-spell-grants',
      'legacy-spell-attribution',
    ]
  )
})

test('Slice 7d migration list reaches 077 and includes each normalized schema frontier', () => {
  const fixtures = buildBatch7SchemaValidationFixtures()
  const migrationFiles = listMigrationFiles()

  assert.equal(migrationFiles.at(-1), '077_legacy_spell_selection_attribution.sql')
  assert.equal(migrationFiles.length, 77)
  for (const migration of fixtures.requiredMigrationFiles) {
    assert.ok(migrationFiles.includes(migration), `Expected migration ${migration}`)
  }
})

test('Slice 7d normalized table and uniqueness expectations are pinned by migration contracts', () => {
  const fixtures = buildBatch7SchemaValidationFixtures()

  for (const group of fixtures.contractGroups) {
    for (const contract of group.requiredPatterns) {
      assert.match(
        readMigration(contract.migration),
        contract.pattern,
        `${group.key}: ${contract.label}`
      )
    }
  }
})

test('Slice 7d content validator rejects duplicate keys, orphaned options, and unresolved package items', () => {
  const validation = validateContentImport(buildBatch7InvalidContentBundle())
  const errorKeys = validation.errors.map((error) => `${error.code}:${error.table}:${error.entityKey}`)

  assert.equal(validation.ok, false)
  assert.ok(errorKeys.includes('duplicate_record:sources:PHB'))
  assert.ok(errorKeys.includes('duplicate_record:languages:common'))
  assert.ok(errorKeys.includes('orphaned_option_group:feature_option_groups:fighter:fighting_style:2014'))
  assert.ok(errorKeys.includes('orphaned_option:feature_options:defense'))
  assert.ok(errorKeys.includes('missing_reference:starting_equipment_packages:class:fighter:phb'))
  assert.deepEqual(
    Array.from(new Set(validation.errors.map((error) => error.ownerSlice))),
    ['6e']
  )
})

test('Slice 7d content import planning stays stable for create update no-op and retire rows', () => {
  const plan = planContentImport(buildBatch7ContentBundle(), buildBatch7ExistingSnapshot(), { retireMissing: true })

  assert.equal(plan.ok, true)
  assert.deepEqual(plan.summary, {
    create: 0,
    update: 3,
    retire: 3,
    noOp: 6,
  })
  assert.deepEqual(
    plan.rows.map((row) => `${row.status}:${row.table}:${row.key}`),
    [
      'no-op:sources:PHB',
      'no-op:languages:common',
      'update:languages:draconic',
      'retire:languages:giant',
      'no-op:tools:smiths_tools',
      'update:equipment_items:chain_mail',
      'no-op:equipment_items:longsword',
      'retire:equipment_items:rope_hempen',
      'no-op:feature_option_groups:fighter:fighting_style:2014',
      'no-op:feature_options:defense',
      'retire:feature_options:dueling',
      'update:starting_equipment_packages:class:fighter:phb',
    ]
  )
  assert.deepEqual(plan.rows.find((row) => row.key === 'chain_mail')?.changedFields, ['name'])
  assert.deepEqual(plan.rows.find((row) => row.key === 'class:fighter:phb')?.changedFields, ['items', 'name'])
})

test('Slice 7d apply uses the dry-run plan and rejected imports leave snapshots unchanged', () => {
  const snapshot = buildBatch7ExistingSnapshot()
  const dryRun = planContentImport(buildBatch7ContentBundle(), snapshot, { retireMissing: true })
  const applied = applyContentImportPlan(buildBatch7ContentBundle(), snapshot, { retireMissing: true })
  const rejected = applyContentImportPlan(buildBatch7InvalidContentBundle(), snapshot, { retireMissing: true })

  assert.equal(applied.ok, true)
  assert.deepEqual(applied.appliedRows, dryRun.rows)
  assert.equal(applied.nextSnapshot.equipment_items?.find((row) => row.key === 'chain_mail')?.name, 'Chain Mail')
  assert.equal(applied.nextSnapshot.equipment_items?.find((row) => row.key === 'rope_hempen')?.retired, true)
  assert.equal(applied.nextSnapshot.feature_options?.find((row) => row.key === 'dueling')?.retired, true)

  assert.equal(rejected.ok, false)
  assert.deepEqual(rejected.nextSnapshot, snapshot)
  assert.deepEqual(rejected.appliedRows, [])
})
