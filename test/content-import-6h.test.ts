import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  applyContentImportPlan,
  formatContentImportPlan,
  planContentImport,
  type ContentImportSnapshot,
} from '../scripts/content-import/import-workflow'
import type { ContentImportBundle } from '../scripts/content-import/validator'

const read = (path: string) => readFileSync(path, 'utf8')

function fixtureBundle(): ContentImportBundle {
  return {
    sources: [{ key: 'PHB', name: 'Player Handbook' }],
    languages: [
      { key: 'common', name: 'Common', source: 'PHB' },
      {
        key: 'draconic',
        name: 'Draconic',
        source: 'PHB',
        amended: true,
        amendment_note: 'Uses the 2014 PHB language list.',
      },
      { key: 'giant', name: 'Giant', source: 'PHB' },
    ],
    tools: [
      { key: 'smiths_tools', name: "Smith's Tools", source: 'PHB' },
    ],
  }
}

function existingSnapshot(): ContentImportSnapshot {
  return {
    sources: [{ key: 'PHB', name: 'Player Handbook' }],
    languages: [
      { key: 'common', name: 'Common', source: 'PHB' },
      { key: 'draconic', name: 'Old Draconic', source: 'PHB', amended: false, amendment_note: null },
      { key: 'abyssal', name: 'Abyssal', source: 'PHB', amended: false, amendment_note: null },
    ],
    tools: [
      { key: 'smiths_tools', name: "Smith's Tools", source: 'PHB' },
    ],
  }
}

test('slice 6h plans fixture imports with stable create update no-op and retire rows', () => {
  const plan = planContentImport(fixtureBundle(), existingSnapshot(), { retireMissing: true })

  assert.equal(plan.ok, true)
  assert.deepEqual(plan.summary, {
    create: 1,
    update: 1,
    retire: 1,
    noOp: 3,
  })
  assert.deepEqual(
    plan.rows.map((row) => `${row.status}:${row.table}:${row.key}`),
    [
      'no-op:sources:PHB',
      'no-op:languages:common',
      'update:languages:draconic',
      'create:languages:giant',
      'retire:languages:abyssal',
      'no-op:tools:smiths_tools',
    ]
  )
  assert.deepEqual(plan.rows.find((row) => row.key === 'draconic')?.changedFields, [
    'amended',
    'amendment_note',
    'name',
  ])

  const formatted = formatContentImportPlan(plan)
  assert.match(formatted, /Create 1/)
  assert.match(formatted, /Update 1/)
  assert.match(formatted, /No change 3/)
  assert.match(formatted, /Retire 1/)
  assert.match(formatted, /Update\s+languages\s+draconic\s+Draconic\s+PHB\s+amended/)
  assert.doesNotMatch(formatted, /warning/i)
})

test('slice 6h rejects duplicate source and key conflicts before planning writes', () => {
  const bundle = fixtureBundle()
  bundle.sources = [
    { key: 'PHB', name: 'Player Handbook' },
    { key: 'PHB', name: 'Player Handbook duplicate' },
  ]
  bundle.languages?.push({ key: 'common', name: 'Common duplicate', source: 'PHB' })

  const plan = planContentImport(bundle, existingSnapshot())

  assert.equal(plan.ok, false)
  assert.equal(plan.rows.length, 0)
  assert.ok(plan.validation.errors.some((error) => (
    error.table === 'sources' &&
    error.entityKey === 'PHB' &&
    error.code === 'duplicate_record'
  )))
  assert.ok(plan.validation.errors.some((error) => (
    error.table === 'languages' &&
    error.entityKey === 'common' &&
    error.code === 'duplicate_record'
  )))
})

test('slice 6h rejected imports leave the target snapshot unchanged', () => {
  const before = existingSnapshot()
  const invalidBundle = fixtureBundle()
  invalidBundle.languages?.push({ key: 'common', name: 'Common duplicate', source: 'PHB' })

  const result = applyContentImportPlan(invalidBundle, before, { retireMissing: true })

  assert.equal(result.ok, false)
  assert.deepEqual(result.nextSnapshot, before)
  assert.deepEqual(result.appliedRows, [])
})

test('slice 6h applied imports use the same validated plan as dry-run', () => {
  const bundle = fixtureBundle()
  const dryRun = planContentImport(bundle, existingSnapshot(), { retireMissing: true })
  const result = applyContentImportPlan(bundle, existingSnapshot(), { retireMissing: true })

  assert.equal(result.ok, true)
  assert.deepEqual(result.appliedRows, dryRun.rows)
  assert.equal(result.nextSnapshot.languages?.find((row) => row.key === 'giant')?.name, 'Giant')
  assert.equal(result.nextSnapshot.languages?.find((row) => row.key === 'draconic')?.amended, true)
  assert.equal(result.nextSnapshot.languages?.find((row) => row.key === 'abyssal')?.retired, true)
})

test('slice 6h exposes command, docs, and calm admin import diff preview', () => {
  const packageJson = JSON.parse(read('package.json')) as { scripts: Record<string, string> }
  const command = read('scripts/content-import/import.ts')
  const admin = read('src/components/dm/ContentAdmin.tsx')
  const docs = read('docs/architecture.md')
  const equipmentItemsRoute = read('src/app/api/content/equipment-items/route.ts')
  const packagesRoute = read('src/app/api/content/starting-equipment-packages/route.ts')

  assert.equal(packageJson.scripts['content:import'], 'tsx scripts/content-import/import.ts')
  assert.match(command, /planContentImport/)
  assert.match(command, /applyContentImportPlan/)
  assert.match(command, /--dry-run/)
  assert.match(command, /--apply/)

  assert.match(admin, /Import diff/)
  assert.match(admin, /contentImportPreview/)
  assert.match(admin, /surface-row/)
  assert.match(admin, /<details/)
  assert.match(admin, /No change/)
  assert.doesNotMatch(admin, /No change[\s\S]{0,120}(warning|destructive|danger)/i)

  assert.match(docs, /content:import/)
  assert.match(docs, /amended/)
  assert.match(docs, /dry-run/)

  assert.match(equipmentItemsRoute, /amended: body\.amended \?\? false/)
  assert.match(equipmentItemsRoute, /amendment_note: body\.amendment_note \?\? null/)
  assert.match(packagesRoute, /amended: body\.amended \?\? false/)
  assert.match(packagesRoute, /amendment_note: body\.amendment_note \?\? null/)
})
